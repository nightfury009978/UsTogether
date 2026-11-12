import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
  onSnapshot, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* =========================================================
   Helpers
   ========================================================= */
const $ = (id) => document.getElementById(id);
const O = () => window.OS;
const D = () => O().db;
const toast = (m, t) => O()?.toast(m, t);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LSg = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const LSs = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const enc = new TextEncoder(), dec = new TextDecoder();
const INLINE = 700000;                    // max base64 chars kept inside one Firestore doc
const MAX_VIDEO = 8 * 1024 * 1024;        // 8 MB
const safeImg = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) ? s : '';
const chatId = (a, b) => [a, b].sort().join('_');
const wide = () => matchMedia('(min-width:820px)').matches;
const svg = (d, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  add: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M19 8v6M16 11h6"/>'),
  img: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>'),
  send: svg('<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>'),
  panel: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>'),
  close: (s = 22) => svg('<path d="M6 6l12 12M18 6L6 18"/>', s)
};

/* =========================================================
   Crypto (end-to-end): ECDH P-256 -> HKDF -> AES-GCM
   Private key lives only on the device (IndexedDB, non-extractable)
   and, wrapped by the user's passphrase, in chatPrivate/{uid}.
   ========================================================= */
const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const EC = { name: 'ECDH', namedCurve: 'P-256' };

const idbOpen = () => new Promise((res, rej) => { const r = indexedDB.open('ourspace-chat', 1); r.onupgradeneeded = () => r.result.createObjectStore('keys'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const kvGet = async (k) => { const db = await idbOpen(); return new Promise((res, rej) => { const q = db.transaction('keys').objectStore('keys').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
const kvSet = async (k, v) => { const db = await idbOpen(); return new Promise((res, rej) => { const t = db.transaction('keys', 'readwrite'); t.objectStore('keys').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); };

async function genKeys() {
  const kp = await crypto.subtle.generateKey(EC, true, ['deriveBits']);
  return { pub: await crypto.subtle.exportKey('jwk', kp.publicKey), priv: await crypto.subtle.exportKey('jwk', kp.privateKey) };
}
const importPriv = (jwk) => crypto.subtle.importKey('jwk', jwk, EC, false, ['deriveBits']);
async function pwKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 400000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function wrapPriv(jwk, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pwKey(pass, salt), enc.encode(JSON.stringify(jwk)));
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function unwrapPriv(w, pass) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(w.iv) }, await pwKey(pass, unb64(w.salt)), unb64(w.ct));
  return JSON.parse(dec.decode(pt));
}
const keyCache = new Map();
async function sharedKey(uid) {
  const p = state.profiles.get(uid);
  if (!p?.pubKey || !state.priv) throw new Error('no key');
  const ck = uid + p.pubKey;
  if (keyCache.has(ck)) return keyCache.get(ck);
  const pub = await crypto.subtle.importKey('jwk', JSON.parse(p.pubKey), EC, false, []);
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, state.priv, 256);
  const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: enc.encode('ourspace-chat-v1') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  keyCache.set(ck, key);
  return key;
}
async function encBytes(key, buf) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf)) };
}
const decBytes = (key, iv, ct) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
const encJSON = (key, obj) => encBytes(key, enc.encode(JSON.stringify(obj)));
const decJSON = async (key, iv, ct) => JSON.parse(dec.decode(await decBytes(key, iv, ct)));
async function safetyNumber(a, b) {
  const [x, y] = [a, b].sort();
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(x + y)));
  const groups = [];
  for (let i = 0; i < 6; i++) groups.push(String(((h[i * 3] << 16) | (h[i * 3 + 1] << 8) | h[i * 3 + 2]) % 100000).padStart(5, '0'));
  return groups.join(' ');
}

/* =========================================================
   State
   ========================================================= */
const state = {
  uid: null, profile: null, private: null, priv: null, nick: {}, bootP: null, bootErr: false,
  reqFrom: [], reqTo: [], friends: [], incoming: [], outgoing: [],
  profiles: new Map(), watch: new Map(), chats: new Map(),
  active: null, msgDocs: [], unsubs: [], unsubMsgs: null, listening: false, warned: false,
  celebrated: new Set(), search: '', sig: ''
};
const plain = new Map();   // decrypted message payloads by id
const media = new Map();   // blob URLs by message id

/* =========================================================
   DOM
   ========================================================= */
const confetti = Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
document.body.insertAdjacentHTML('beforeend', `
<div id="chatApp" class="chat-app" aria-hidden="true">
  <div id="chatGate" class="chat-gate hidden"></div>
  <div id="chatMain" class="chat-main hidden">
    <div id="chatScrim" class="chat-scrim"></div>
    <aside id="chatSide" class="chat-side">
      <div class="cs-head">
        <h2 class="cs-title">Friends</h2>
        <button id="csAdd" class="cs-icon" aria-label="Add friend">${IC.add}</button>
        <button id="csBurger" class="cs-burger" aria-label="Friends menu"><span></span><span></span><span></span><i id="csBurgerDot" class="bdot hidden"></i></button>
        <div id="csMenu" class="cs-menu">
          <button id="csRemove">🗑️ Remove friends</button>
          <button id="csProfile">🖼️ My profile</button>
          <button id="csForgot">🔑 Forgot / new username</button>
        </div>
      </div>
      <div id="csMe" class="cs-me"></div>
      <input id="csSearch" class="cs-search" type="search" placeholder="Search friends">
      <div id="csScroll" class="cs-scroll"></div>
    </aside>
    <section class="chat-pane">
      <header class="cp-head">
        <button id="cpToggle" class="cp-btn" aria-label="Friends">${IC.panel}</button>
        <button id="cpWho" class="cp-who"></button>
        <button id="cpClose" class="cp-btn" aria-label="Close chat">${IC.close()}</button>
      </header>
      <div id="cpEmpty" class="cp-empty"><div>Select a friend<br>to start chatting<small>🔒 Messages are end-to-end encrypted</small></div></div>
      <div id="cpMsgs" class="cp-msgs hidden"></div>
      <footer id="cpComp" class="cp-comp hidden">
        <button id="cpFileBtn" class="cp-circle" aria-label="Send photo or video">${IC.img}</button>
        <input id="cpFile" type="file" accept="image/*,video/*" hidden>
        <textarea id="cpInput" class="cp-input" rows="1" placeholder="Type a message"></textarea>
        <div class="cp-rec"><span class="rec-dot"></span><span id="cpRecTime" class="rec-time">0:00</span>
          <button id="cpRecCancel" class="cp-circle" style="width:36px;height:36px" aria-label="Cancel">${IC.close(18)}</button></div>
        <button id="cpMic" class="cp-circle" aria-label="Voice message">${IC.mic}</button>
        <button id="cpSend" class="cp-circle go hide" aria-label="Send">${IC.send}</button>
      </footer>
    </section>
  </div>
  <div id="chatSheet" class="chat-sheet"><div class="sheet-card"><div class="sheet-grip"></div><div id="sheetBody"></div></div></div>
  <div id="chatLight" class="chat-light"><img alt=""></div>
</div>
<div id="chatCongrats" class="chat-congrats">
  <div class="cc-confetti">${confetti}</div>
  <div class="cc-card">
    <div id="ccPfp" class="cc-pfp"></div>
    <h2>Congrats! 🎉</h2>
    <p id="ccText"></p>
    <button id="ccChat" class="gate-btn">Say hi 💬</button>
    <button id="ccClose" class="gate-link">Later</button>
  </div>
</div>`);

const app = $('chatApp'), gate = $('chatGate'), main = $('chatMain'), side = $('chatSide'), scrim = $('chatScrim');
const sheet = $('chatSheet'), sheetBody = $('sheetBody'), light = $('chatLight'), congrats = $('chatCongrats');
const comp = $('cpComp'), input = $('cpInput');

/* sheets / layers */
function openSheet(title, html) { sheetBody.innerHTML = `<h3 class="sheet-title">${esc(title)}</h3>` + html; sheet.classList.add('active'); sheet.querySelector('.sheet-card').scrollTop = 0; }
const closeSheet = () => sheet.classList.remove('active');
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
const closeLight = () => light.classList.remove('active');
light.onclick = closeLight;
const closeCongrats = () => congrats.classList.remove('active');
$('ccClose').onclick = closeCongrats;
const openSide = () => { if (wide()) $('chatMain').classList.remove('collapsed'); else { side.classList.add('active'); scrim.classList.add('active'); } };
const hideSideMobile = () => { side.classList.remove('active'); scrim.classList.remove('active'); };
scrim.onclick = hideSideMobile;
function closeChat() {
  stopRec(false);
  closeSheet(); closeLight(); hideSideMobile();
  app.classList.remove('active');
  document.documentElement.style.overflow = '';
}
const reg = (el, fn) => window.OSBack?.add(el, fn);
reg(app, closeChat); reg(side, hideSideMobile); reg(sheet, closeSheet); reg(light, closeLight); reg(congrats, closeCongrats);

/* keyboard-aware sizing (so the composer never hides behind the keyboard) */
const fit = () => {
  const v = window.visualViewport; if (!v || !app.classList.contains('active')) return;
  app.style.height = v.height + 'px'; app.style.top = v.offsetTop + 'px';
  if (document.activeElement === input) { const b = $('cpMsgs'); b.scrollTop = b.scrollHeight; }
};
window.visualViewport?.addEventListener('resize', fit);
window.visualViewport?.addEventListener('scroll', fit);

/* =========================================================
   Boot / auth
   ========================================================= */
onAuthStateChanged(O().auth, (u) => {
  if (!u) { teardown(); return; }
  if (state.uid === u.uid) return;
  teardown(); state.uid = u.uid; state.bootP = boot();
});

function teardown() {
  state.unsubs.forEach((f) => f()); state.watch.forEach((f) => f());
  state.unsubMsgs?.();
  Object.assign(state, { uid: null, profile: null, private: null, priv: null, nick: {}, bootErr: false, reqFrom: [], reqTo: [], friends: [], incoming: [], outgoing: [], unsubs: [], unsubMsgs: null, listening: false, warned: false, active: null, msgDocs: [], sig: '' });
  state.profiles.clear(); state.watch.clear(); state.chats.clear(); state.celebrated.clear(); keyCache.clear();
  closeChat(); closeCongrats(); updateBadges();
}

async function boot() {
  const me = state.uid;
  try {
    const [p, pv] = await Promise.all([getDoc(doc(D(), 'chatUsers', me)), getDoc(doc(D(), 'chatPrivate', me))]);
    state.profile = p.exists() ? p.data() : null;
    state.private = pv.exists() ? pv.data() : null;
    state.nick = state.private?.nicknames || {};
    state.priv = (await kvGet('priv:' + me)) || null;
    if (state.profile) startListeners();
  } catch (e) { console.error(e); state.bootErr = true; }
  updateBadges();
}

/* hidden entry: tap "Our Sacred Diary" */
const badge = document.querySelector('.glowing-badge');
if (badge) {
  badge.setAttribute('role', 'button');
  badge.insertAdjacentHTML('beforeend', '<i id="chatBadgeDot" class="badge-dot hidden"></i>');
  badge.addEventListener('click', openChat);
}

async function openChat() {
  if (!state.uid) { toast('Please log in first', 'error'); return; }
  await state.bootP;
  app.classList.add('active');
  document.documentElement.style.overflow = 'hidden';
  fit(); route();
}

function route() {
  gate.classList.add('hidden'); main.classList.add('hidden');
  if (state.bootErr) return showGate('error');
  if (!state.profile) return showGate('create');
  if (!state.priv) return showGate('unlock');
  main.classList.remove('hidden');
  renderAll();
  if (!state.active) openSide();
}

/* =========================================================
   Gate screens
   ========================================================= */
function showGate(v) {
  gate.classList.remove('hidden');
  const back = '<button id="cgBack" class="gate-link">Back to memories</button>';
  if (v === 'error') {
    gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">⚠️</div><h2>Chat isn’t ready</h2>
      <p>Couldn’t reach the chat database. Publish the chat Firestore rules (firestore.rules.txt), then try again.</p>${back}</div>`;
  } else if (v === 'create') {
    gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">💬</div><h2>Create your chat identity</h2>
      <p>Choose a username your friends can find you by. Everything you send is end-to-end encrypted.</p>
      <input id="cgUser" placeholder="Username (3–20: letters, numbers, _ .)" autocapitalize="none" autocomplete="off" maxlength="20">
      <input id="cgPass" type="password" placeholder="Recovery passphrase (8+ characters)" autocomplete="new-password">
      <input id="cgPass2" type="password" placeholder="Repeat passphrase" autocomplete="new-password">
      <p class="gate-note">The passphrase restores your chats on a new phone. Nobody can recover it for you.</p>
      <button id="cgGo" class="gate-btn">Create &amp; continue ✨</button>${back}</div>`;
    $('cgGo').onclick = createIdentity;
  } else {
    gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">🔐</div><h2>Unlock your chats</h2>
      <p>This device doesn’t have your chat key yet. Enter your recovery passphrase.</p>
      <input id="cuPass" type="password" placeholder="Recovery passphrase" autocomplete="current-password">
      <button id="cuGo" class="gate-btn">Unlock</button>
      <button id="cuForgot" class="gate-link">Forgot passphrase? Reset keys</button>${back}</div>`;
    $('cuGo').onclick = unlock; $('cuForgot').onclick = forgotPass;
  }
  $('cgBack').onclick = closeChat;
}

async function createIdentity() {
  const name = $('cgUser').value.trim(), p1 = $('cgPass').value, p2 = $('cgPass2').value, lower = name.toLowerCase();
  if (!/^[a-z0-9_.]{3,20}$/i.test(name)) return toast('Username: 3–20 letters, numbers, _ or .', 'error');
  if (p1.length < 8) return toast('Passphrase needs 8+ characters', 'error');
  if (p1 !== p2) return toast('Passphrases don’t match', 'error');
  const btn = $('cgGo'); btn.disabled = true; btn.textContent = 'Creating…';
  try {
    const me = state.uid, keys = await genKeys(), wrapped = await wrapPriv(keys.priv, p1);
    await runTransaction(D(), async (tx) => {
      const ref = doc(D(), 'usernames', lower);
      if ((await tx.get(ref)).exists()) throw new Error('taken');
      tx.set(ref, { uid: me });
      tx.set(doc(D(), 'chatUsers', me), { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), bio: '', pfp: '', banner: '', createdAt: serverTimestamp() });
      tx.set(doc(D(), 'chatPrivate', me), { keyBackup: wrapped, nicknames: {} });
    });
    state.priv = await importPriv(keys.priv);
    await kvSet('priv:' + me, state.priv);
    state.profile = { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), bio: '', pfp: '', banner: '' };
    state.private = { keyBackup: wrapped, nicknames: {} };
    startListeners(); route(); toast('Chat identity created 🔐', 'success');
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Create & continue ✨';
    toast(e.message === 'taken' ? 'That username is taken' : 'Couldn’t create — check Firestore rules', 'error');
  }
}
async function unlock() {
  try {
    const jwk = await unwrapPriv(state.private.keyBackup, $('cuPass').value);
    state.priv = await importPriv(jwk); await kvSet('priv:' + state.uid, state.priv);
    keyCache.clear(); route(); toast('Unlocked 🔓', 'success');
  } catch { toast('Wrong passphrase', 'error'); }
}
async function forgotPass() {
  if (!confirm('Resetting creates new keys. Old messages will become unreadable. Continue?')) return;
  const p = prompt('Choose a new recovery passphrase (8+ characters)');
  if (!p || p.length < 8) return toast('Passphrase needs 8+ characters', 'error');
  try {
    const keys = await genKeys(), wrapped = await wrapPriv(keys.priv, p);
    await updateDoc(doc(D(), 'chatUsers', state.uid), { pubKey: JSON.stringify(keys.pub) });
    await setDoc(doc(D(), 'chatPrivate', state.uid), { keyBackup: wrapped }, { merge: true });
    state.priv = await importPriv(keys.priv); await kvSet('priv:' + state.uid, state.priv);
    state.profile.pubKey = JSON.stringify(keys.pub); keyCache.clear(); route(); toast('Keys reset', 'success');
  } catch { toast('Reset failed', 'error'); }
}

/* =========================================================
   Listeners: profiles, requests, chats
   ========================================================= */
function startListeners() {
  if (state.listening) return; state.listening = true;
  const me = state.uid;
  const err = (e) => { console.error(e); if (!state.warned) { state.warned = true; toast('Chat permission error — check Firestore rules', 'error'); } };
  watchProfile(me);
  const rq = collection(D(), 'chatRequests');
  state.unsubs.push(onSnapshot(query(rq, where('from', '==', me)), (s) => { state.reqFrom = s.docs.map((d) => ({ id: d.id, ...d.data() })); recompute(); }, err));
  state.unsubs.push(onSnapshot(query(rq, where('to', '==', me)), (s) => { state.reqTo = s.docs.map((d) => ({ id: d.id, ...d.data() })); recompute(); }, err));
  state.unsubs.push(onSnapshot(query(collection(D(), 'chats'), where('members', 'array-contains', me)), (s) => {
    state.chats = new Map(s.docs.map((d) => [d.id, d.data()])); renderAll();
  }, err));
}
function watchProfile(uid) {
  if (state.watch.has(uid)) return;
  state.watch.set(uid, onSnapshot(doc(D(), 'chatUsers', uid), (s) => {
    const d = s.exists() ? s.data() : null;
    state.profiles.set(uid, d);
    if (uid === state.uid && d) state.profile = d;
    if (uid === state.active) state.sig = '';
    renderAll(); if (uid === state.active) paint();
  }));
}
async function getProfile(uid) {
  if (state.profiles.get(uid)) return state.profiles.get(uid);
  try { const s = await getDoc(doc(D(), 'chatUsers', uid)); return s.exists() ? s.data() : null; } catch { return null; }
}
function recompute() {
  const me = state.uid;
  const all = [...state.reqFrom, ...state.reqTo];
  state.friends = all.filter((r) => r.status === 'accepted').map((r) => ({ uid: r.from === me ? r.to : r.from, req: r }));
  state.incoming = state.reqTo.filter((r) => r.status === 'pending');
  state.outgoing = state.reqFrom.filter((r) => r.status === 'pending');
  [...state.friends.map((f) => f.uid), ...state.incoming.map((r) => r.from), ...state.outgoing.map((r) => r.to)].forEach(watchProfile);
  if (state.active && !state.friends.some((f) => f.uid === state.active)) closeConversation();
  checkCongrats(); renderAll();
}
function checkCongrats() {
  const me = state.uid;
  state.friends.forEach(({ uid, req }) => {
    const flag = req.from === me ? 'seenFrom' : 'seenTo';
    if (req[flag] || state.celebrated.has(req.id)) return;
    state.celebrated.add(req.id);
    updateDoc(doc(D(), 'chatRequests', req.id), { [flag]: true }).catch(() => {});
    celebrate(uid);
  });
}
async function celebrate(uid) {
  const p = await getProfile(uid), nm = p?.username || 'your friend';
  $('ccPfp').innerHTML = av(p, nm);
  $('ccText').innerHTML = `<b>@${esc(nm)}</b> and you are friends now`;
  $('ccChat').onclick = async () => { closeCongrats(); await openChat(); openConversation(uid); };
  congrats.classList.add('active');
}

/* =========================================================
   Rendering: sidebar
   ========================================================= */
const av = (p, name) => { const s = safeImg(p?.pfp); return s ? `<img class="pfp" src="${s}" alt="">` : `<span class="pfp">${esc((name || '?').trim()[0]?.toUpperCase() || '?')}</span>`; };
const displayName = (uid) => state.nick[uid] || state.profiles.get(uid)?.username || 'Friend';
function unreadFor(uid) {
  const c = state.chats.get(chatId(state.uid, uid));
  if (!c || !c.lastAt || c.lastFrom === state.uid) return false;
  let seen = {}; try { seen = JSON.parse(LSg('chatSeen') || '{}'); } catch {}
  return c.lastAt.seconds * 1000 > (seen[chatId(state.uid, uid)] || 0);
}
function markSeen(cid) {
  let seen = {}; try { seen = JSON.parse(LSg('chatSeen') || '{}'); } catch {}
  const last = state.msgDocs[state.msgDocs.length - 1];
  seen[cid] = Math.max(last?.at ? last.at.seconds * 1000 : 0, Date.now());
  LSs('chatSeen', JSON.stringify(seen)); updateBadges();
}
function updateBadges() {
  const unread = state.friends.some((f) => unreadFor(f.uid));
  $('chatBadgeDot')?.classList.toggle('hidden', !(state.incoming.length || unread));
  $('csBurgerDot')?.classList.toggle('hidden', !state.incoming.length);
}
function friendRow(uid) {
  const p = state.profiles.get(uid) || {}, nm = displayName(uid), b = safeImg(p.banner), un = p.username ? '@' + p.username : '';
  const sub = state.nick[uid] && un ? un : 'Tap to chat';
  return `<button class="fr-row${state.active === uid ? ' sel' : ''}" data-open="${uid}">
    ${b ? `<img class="fr-banner" src="${b}" alt="">` : '<span class="fr-banner fr-banner-def"></span>'}
    <span class="fr-sheen"></span><span class="fr-scrim"></span>
    <span class="pfp-ring">${av(p, nm)}</span>
    <span class="fr-text"><b>${esc(nm)}</b><i>${esc(sub)}</i></span>
    ${unreadFor(uid) ? '<span class="fr-dot"></span>' : ''}</button>`;
}
function renderSide() {
  const p = state.profile; if (!p) return;
  $('csMe').innerHTML = `<span class="pfp-sm">${av(p, p.username)}</span><span><b>@${esc(p.username)}</b><i>Tap to edit your profile</i></span>`;
  const q = state.search.trim().toLowerCase();
  let h = '';
  if (state.incoming.length) {
    h += '<div class="cs-label">Friend requests</div>';
    state.incoming.forEach((r) => {
      const pr = state.profiles.get(r.from) || {};
      h += `<div class="rq-row"><span class="pfp-sm">${av(pr, pr.username)}</span><span class="rq-name"><b>@${esc(pr.username || '…')}</b><i>wants to be friends</i></span>
        <button class="rq-ok" data-acc="${r.id}">Accept</button><button class="rq-no" data-dec="${r.id}" aria-label="Decline">✕</button></div>`;
    });
  }
  if (state.outgoing.length) {
    h += '<div class="cs-label">Sent requests</div>';
    state.outgoing.forEach((r) => {
      const pr = state.profiles.get(r.to) || {};
      h += `<div class="rq-out"><span>Waiting for @${esc(pr.username || '…')}</span><button data-cancel="${r.id}">Cancel</button></div>`;
    });
  }
  const list = state.friends
    .filter((f) => !q || displayName(f.uid).toLowerCase().includes(q) || (state.profiles.get(f.uid)?.username || '').includes(q))
    .sort((a, b) => ((state.chats.get(chatId(state.uid, b.uid))?.lastAt?.seconds || 0) - (state.chats.get(chatId(state.uid, a.uid))?.lastAt?.seconds || 0)) || displayName(a.uid).localeCompare(displayName(b.uid)));
  h += `<div class="cs-label">Friends · ${state.friends.length}</div>`;
  h += list.length ? list.map((f) => friendRow(f.uid)).join('')
    : `<div class="cs-empty">${state.friends.length ? 'No friends match.' : 'No friends yet.<br>Tap the 👤+ button to add one by username.'}</div>`;
  $('csScroll').innerHTML = h;
}
function renderHeader() {
  const uid = state.active, who = $('cpWho');
  if (!uid) { who.innerHTML = '<b style="font-family:var(--serif);font-size:1.3rem">Chats</b>'; return; }
  const p = state.profiles.get(uid) || {}, nm = displayName(uid);
  who.innerHTML = `<span class="pfp-sm">${av(p, nm)}</span><span style="min-width:0"><b>${esc(nm)}</b><i>🔒 End-to-end encrypted</i></span>`;
}
function renderAll() { if (!state.profile) { updateBadges(); return; } renderSide(); renderHeader(); updateBadges(); }

$('csScroll').addEventListener('click', async (e) => {
  const t = e.target.closest('[data-open],[data-acc],[data-dec],[data-cancel]'); if (!t) return;
  if (t.dataset.open) return openConversation(t.dataset.open);
  try {
    if (t.dataset.acc) await updateDoc(doc(D(), 'chatRequests', t.dataset.acc), { status: 'accepted', seenFrom: false, seenTo: false });
    else await deleteDoc(doc(D(), 'chatRequests', t.dataset.dec || t.dataset.cancel));
  } catch { toast('Something went wrong', 'error'); }
});
$('csSearch').addEventListener('input', (e) => { state.search = e.target.value; renderSide(); });
$('csMe').onclick = () => openMeSheet();
$('csAdd').onclick = () => openAddSheet();
$('csBurger').onclick = (e) => { e.stopPropagation(); $('csMenu').classList.toggle('open'); };
document.addEventListener('click', (e) => { if (!e.target.closest('#csMenu')) $('csMenu').classList.remove('open'); });
$('csRemove').onclick = () => { $('csMenu').classList.remove('open'); openRemoveSheet(); };
$('csProfile').onclick = () => { $('csMenu').classList.remove('open'); openMeSheet(); };
$('csForgot').onclick = () => { $('csMenu').classList.remove('open'); openUsernameSheet(); };
$('cpToggle').onclick = () => { if (wide()) main.classList.toggle('collapsed'); else if (side.classList.contains('active')) hideSideMobile(); else openSide(); };
$('cpClose').onclick = closeChat;
$('cpWho').onclick = () => { if (state.active) openFriendSheet(state.active); };

/* =========================================================
   Conversation
   ========================================================= */
function closeConversation() {
  state.unsubMsgs?.(); state.unsubMsgs = null; state.active = null; state.msgDocs = []; state.sig = '';
  $('cpMsgs').classList.add('hidden'); comp.classList.add('hidden'); $('cpEmpty').classList.remove('hidden');
  renderHeader();
}
async function openConversation(uid) {
  await state.bootP;
  if (!state.priv) return route();
  state.unsubMsgs?.();
  state.active = uid; state.msgDocs = []; state.sig = ''; state.first = true;
  hideSideMobile();
  $('cpEmpty').classList.add('hidden'); $('cpMsgs').classList.remove('hidden'); comp.classList.remove('hidden');
  $('cpMsgs').innerHTML = '';
  renderAll();
  const cid = chatId(state.uid, uid);
  try {
    const c = await getDoc(doc(D(), 'chats', cid));
    if (!c.exists()) await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort() });
  } catch { toast('Couldn’t open this chat', 'error'); return; }
  if (state.active !== uid) return;
  state.unsubMsgs = onSnapshot(query(collection(D(), 'chats', cid, 'messages'), orderBy('at', 'desc'), limit(80)), (s) => {
    state.msgDocs = s.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })).reverse();
    paint(); markSeen(cid);
  }, () => toast('Couldn’t load messages', 'error'));
}

const dayLabel = (d) => {
  const diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB';

function msgHTML(m, p, url, mine, t) {
  const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let inner;
  if (p.k === 'err') inner = '<div class="bub lock">🔒 Can’t decrypt this message on this device</div>';
  else if (p.k === 't') inner = `<div class="bub">${esc(p.x)}</div>`;
  else if (url) {
    inner = p.k === 'img' ? `<div class="bub media"><img class="m-img" data-view src="${url}" alt=""></div>`
      : p.k === 'vid' ? `<div class="bub media"><video controls playsinline preload="metadata" src="${url}"></video></div>`
      : `<div class="bub media"><audio controls preload="metadata" src="${url}"></audio></div>`;
  } else {
    inner = `<div class="bub media"><button class="m-load" data-load="${m.id}">${p.k === 'vid' ? '▶ Video' : p.k === 'aud' ? '🎧 Voice message' : '🖼️ Photo'} · ${fmtSize(p.sz)}<br>Tap to load</button></div>`;
  }
  return `<div class="msg ${mine ? 'me' : 'them'}">${inner}<span class="mt">${time}</span></div>`;
}

let paintTok = 0;
async function paint() {
  const uid = state.active; if (!uid) return;
  const tok = ++paintTok, box = $('cpMsgs');
  let key = null; try { key = await sharedKey(uid); } catch {}
  const sig = state.msgDocs.map((m) => m.id).join('|') + '#' + media.size + (key ? 'k' : 'n') + uid;
  if (sig === state.sig) return;
  const near = state.first || box.scrollHeight - box.scrollTop - box.clientHeight < 160;
  let html = '', last = '';
  for (const m of state.msgDocs) {
    const t = m.at ? new Date(m.at.seconds * 1000) : new Date(), day = dayLabel(t);
    if (day !== last) { html += `<div class="day-sep">${day}</div>`; last = day; }
    let p = plain.get(m.id);
    if (!p) {
      if (!key) p = { k: 'err' };
      else { try { p = await decJSON(key, m.iv, m.ct); plain.set(m.id, p); } catch { p = { k: 'err' }; } }
    }
    let url = media.get(m.id);
    if (!url && m.d && key && p.k && p.k !== 't' && p.k !== 'err') {
      try { url = URL.createObjectURL(new Blob([await decBytes(key, p.miv, m.d)], { type: p.mime })); media.set(m.id, url); } catch {}
    }
    html += msgHTML(m, p, url, m.from === state.uid, t);
    if (tok !== paintTok) return;
  }
  state.sig = state.msgDocs.map((m) => m.id).join('|') + '#' + media.size + (key ? 'k' : 'n') + uid;
  box.innerHTML = html;
  if (near) box.scrollTop = box.scrollHeight;
  state.first = false;
}

async function loadChunked(id) {
  const p = plain.get(id); if (!p?.mid) return;
  const cid = chatId(state.uid, state.active), parts = new Array(p.n);
  toast('Downloading…', 'info');
  try {
    for (let i = 0; i < p.n; i += 4) {
      await Promise.all([...Array(Math.min(4, p.n - i))].map(async (_, j) => {
        parts[i + j] = (await getDoc(doc(D(), 'chats', cid, 'blobs', `${p.mid}_${i + j}`))).data().d;
      }));
    }
    const bytes = await decBytes(await sharedKey(state.active), p.miv, parts.join(''));
    media.set(id, URL.createObjectURL(new Blob([bytes], { type: p.mime })));
    paint();
  } catch (e) { console.error(e); toast('Download failed', 'error'); }
}
$('cpMsgs').addEventListener('click', (e) => {
  const v = e.target.closest('[data-view]'), l = e.target.closest('[data-load]');
  if (v) { light.querySelector('img').src = v.src; light.classList.add('active'); }
  else if (l) loadChunked(l.dataset.load);
});

/* =========================================================
   Sending
   ========================================================= */
async function sendPayload(payload, extra) {
  const uid = state.active; if (!uid) return;
  const key = await sharedKey(uid), cid = chatId(state.uid, uid), { iv, ct } = await encJSON(key, payload);
  await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort(), lastAt: serverTimestamp(), lastFrom: state.uid }, { merge: true });
  await addDoc(collection(D(), 'chats', cid, 'messages'), { from: state.uid, at: serverTimestamp(), iv, ct, ...(extra || {}) });
}
function sendText() {
  const x = input.value.trim(); if (!x) return;
  input.value = ''; autoGrow(); updateComp();
  sendPayload({ k: 't', x }).catch(() => toast('Couldn’t send', 'error'));
}
async function sendMedia(blob, k) {
  const uid = state.active; if (!uid) return;
  try {
    const key = await sharedKey(uid), cid = chatId(state.uid, uid);
    const e = await encBytes(key, await blob.arrayBuffer());
    const meta = { k, mime: blob.type || 'application/octet-stream', miv: e.iv, sz: blob.size };
    if (e.ct.length <= INLINE) { await sendPayload(meta, { d: e.ct }); return; }
    const mid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), n = Math.ceil(e.ct.length / INLINE);
    await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort() }, { merge: true });
    for (let i = 0; i < n; i++) {
      toast(`Sending ${i + 1}/${n}…`, 'info');
      await setDoc(doc(D(), 'chats', cid, 'blobs', `${mid}_${i}`), { d: e.ct.slice(i * INLINE, (i + 1) * INLINE), from: state.uid });
    }
    await sendPayload({ ...meta, mid, n });
  } catch (err) { console.error(err); toast('Couldn’t send media', 'error'); }
}
const shrinkImg = (file, max, q) => new Promise((res, rej) => {
  const img = new Image(), u = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
    c.toBlob((b) => (b ? res(b) : rej()), 'image/jpeg', q);
  };
  img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u;
});
async function prepImage(file) {
  for (const [m, q] of [[1280, .72], [1024, .6], [800, .5], [640, .45]]) { const b = await shrinkImg(file, m, q); if (b.size <= 480000) return b; }
  throw new Error('big');
}
const cropImg = (file, w, h, q) => new Promise((res, rej) => {
  const img = new Image(), u = URL.createObjectURL(file);
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
    c.getContext('2d').drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh); URL.revokeObjectURL(u);
    res(c.toDataURL('image/jpeg', q));
  };
  img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u;
});

$('cpFileBtn').onclick = () => $('cpFile').click();
$('cpFile').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.type.startsWith('image/')) {
    try { toast('Sending photo…', 'info'); await sendMedia(await prepImage(f), 'img'); } catch { toast('Couldn’t read that photo', 'error'); }
  } else if (f.type.startsWith('video/')) {
    if (f.size > MAX_VIDEO) return toast('Video too large — max 8 MB. Trim it first.', 'error');
    toast('Sending video…', 'info'); sendMedia(f, 'vid');
  } else toast('Only photos and videos', 'error');
};

/* composer behaviour */
function autoGrow() { input.style.height = '46px'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }
function updateComp() {
  const has = input.value.trim().length > 0 || !!rec;
  $('cpSend').classList.toggle('hide', !has); $('cpMic').classList.toggle('hide', has && !rec ? true : false);
}
input.addEventListener('input', () => { autoGrow(); updateComp(); });
input.addEventListener('focus', () => setTimeout(() => { fit(); $('cpMsgs').scrollTop = $('cpMsgs').scrollHeight; }, 300));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches) { e.preventDefault(); sendText(); } });
$('cpSend').onclick = () => { if (rec) stopRec(true); else sendText(); };

/* voice messages */
let rec = null, recTimer = null;
const stopRec = (send) => { if (!rec) return; rec.send = send; if (rec.mr.state !== 'inactive') rec.mr.stop(); };
async function startRec() {
  if (rec) return;
  if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) return toast('Voice messages aren’t supported here', 'error');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mt = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(stream, { ...(mt ? { mimeType: mt } : {}), audioBitsPerSecond: 32000 });
    const chunks = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec = { mr, stream, chunks, t0: Date.now(), send: false, mt: mr.mimeType };
    mr.onstop = () => {
      const r = rec; rec = null; clearInterval(recTimer);
      stream.getTracks().forEach((t) => t.stop()); comp.classList.remove('recording'); updateComp();
      if (r && r.send && r.chunks.length) sendMedia(new Blob(r.chunks, { type: r.mt || 'audio/webm' }), 'aud');
    };
    mr.start(); comp.classList.add('recording'); $('cpRecTime').textContent = '0:00'; updateComp();
    recTimer = setInterval(() => {
      if (!rec) return; const s = Math.floor((Date.now() - rec.t0) / 1000);
      $('cpRecTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (s >= 90) stopRec(true);
    }, 250);
  } catch { toast('Microphone permission needed', 'error'); }
}
$('cpMic').onclick = startRec;
$('cpRecCancel').onclick = () => stopRec(false);

/* =========================================================
   Sheets: add friend, remove friends, profiles, username
   ========================================================= */
function openAddSheet() {
  openSheet('Add a friend', `<p class="sh-note">Enter your friend’s chat username.</p>
    <div class="sh-row"><input id="afName" type="text" placeholder="@username" autocapitalize="none" autocomplete="off"><button id="afFind" class="gate-btn sm">Find</button></div>
    <div id="afRes"></div>`);
  $('afFind').onclick = async () => {
    const name = $('afName').value.trim().replace(/^@/, '').toLowerCase(), box = $('afRes');
    if (!/^[a-z0-9_.]{3,20}$/.test(name)) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Enter a valid username.</p>'; return; }
    box.innerHTML = '<p class="sh-note" style="margin-top:12px">Searching…</p>';
    try {
      const u = await getDoc(doc(D(), 'usernames', name));
      if (!u.exists()) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">No one found with that username.</p>'; return; }
      const uid = u.data().uid;
      if (uid === state.uid) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">That’s you 🙂</p>'; return; }
      const p = await getProfile(uid); if (!p) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Profile not available.</p>'; return; }
      box.innerHTML = `<div class="rq-row" style="margin-top:14px"><span class="pfp-sm">${av(p, p.username)}</span><span class="rq-name"><b>@${esc(p.username)}</b><i>${esc(p.bio || 'Chat user')}</i></span></div>
        <button id="afSend" class="sh-btn primary">Send friend request</button>`;
      $('afSend').onclick = async () => {
        if (state.friends.some((f) => f.uid === uid)) return toast('Already friends', 'info');
        if (state.outgoing.some((r) => r.to === uid)) return toast('Request already sent', 'info');
        if (state.incoming.some((r) => r.from === uid)) return toast('They already sent you one — accept it in your list', 'info');
        try {
          await setDoc(doc(D(), 'chatRequests', state.uid + '_' + uid), { from: state.uid, to: uid, status: 'pending', seenFrom: false, seenTo: false, createdAt: serverTimestamp() });
          toast('Request sent 💌', 'success'); closeSheet();
        } catch { toast('Couldn’t send request', 'error'); }
      };
    } catch { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Search failed. Check your connection / rules.</p>'; }
  };
}

function openRemoveSheet() {
  if (!state.friends.length) return toast('No friends to remove', 'info');
  openSheet('Remove friends', `<p class="sh-note">Select the friends you want to remove.</p>
    ${state.friends.map((f) => { const p = state.profiles.get(f.uid) || {}, nm = displayName(f.uid);
      return `<label class="rm-row"><input type="checkbox" value="${f.uid}"><span class="pfp-sm">${av(p, nm)}</span><span class="nm">${esc(nm)}<br><i>@${esc(p.username || '')}</i></span></label>`; }).join('')}
    <button id="rmGo" class="sh-btn danger" disabled>Remove selected</button>`);
  const boxes = [...sheetBody.querySelectorAll('input[type=checkbox]')], go = $('rmGo');
  boxes.forEach((b) => b.onchange = () => { const n = boxes.filter((x) => x.checked).length; go.disabled = !n; go.textContent = n ? `Remove selected (${n})` : 'Remove selected'; });
  go.onclick = async () => {
    const ids = boxes.filter((b) => b.checked).map((b) => b.value);
    if (!ids.length || !confirm(`Remove ${ids.length} friend${ids.length > 1 ? 's' : ''}?`)) return;
    try { await Promise.all(ids.map((u) => deleteDoc(doc(D(), 'chatRequests', state.friends.find((f) => f.uid === u).req.id)))); toast('Removed', 'success'); closeSheet(); }
    catch { toast('Couldn’t remove', 'error'); }
  };
}

function openFriendSheet(uid) {
  const p = state.profiles.get(uid) || {}, nm = displayName(uid), b = safeImg(p.banner);
  openSheet('Profile', `<div class="pv-banner">${b ? `<img src="${b}" alt="">` : ''}</div>
    <div class="pv-pfpwrap"><span class="pv-pfp">${av(p, nm)}</span></div>
    <h3 class="pv-name">${esc(nm)}</h3><div class="pv-user">@${esc(p.username || '')}</div>
    ${p.bio ? `<p class="pv-bio">${esc(p.bio)}</p>` : ''}
    <label class="sh-lab">Nickname</label>
    <div class="sh-row"><input id="fpNick" type="text" maxlength="24" placeholder="Add a nickname" value="${esc(state.nick[uid] || '')}"><button id="fpSave" class="gate-btn sm">Save</button></div>
    <button id="fpCode" class="sh-btn">🔐 Verify encryption</button><div id="fpBox" class="code-box hidden"></div>
    <button id="fpRemove" class="sh-btn danger">Remove friend</button>`);
  $('fpSave').onclick = async () => {
    const v = $('fpNick').value.trim().slice(0, 24); state.nick[uid] = v;
    try { await setDoc(doc(D(), 'chatPrivate', state.uid), { nicknames: { [uid]: v } }, { merge: true }); renderAll(); toast('Nickname saved', 'success'); closeSheet(); }
    catch { toast('Couldn’t save', 'error'); }
  };
  $('fpCode').onclick = async () => {
    const box = $('fpBox'); box.classList.remove('hidden');
    box.innerHTML = `${await safetyNumber(state.profile.pubKey, p.pubKey || '')}<small>If this number matches on both phones, nobody is intercepting your chat.</small>`;
  };
  $('fpRemove').onclick = async () => {
    const f = state.friends.find((x) => x.uid === uid);
    if (f && confirm(`Remove ${nm}?`)) { try { await deleteDoc(doc(D(), 'chatRequests', f.req.id)); closeSheet(); toast('Removed', 'success'); } catch { toast('Couldn’t remove', 'error'); } }
  };
}

function openMeSheet() {
  const p = state.profile; if (!p) return;
  const d = { pfp: p.pfp || '', banner: p.banner || '' };
  const drawB = () => { const s = safeImg(d.banner); $('mpBanner').innerHTML = s ? `<img src="${s}" alt="">` : ''; };
  openSheet('My profile', `<div class="pv-banner" id="mpBanner"></div>
    <div class="pv-pfpwrap"><span class="pv-pfp" id="mpPfp"></span></div>
    <div class="sh-row" style="margin-top:12px"><button id="mpBanBtn" class="sh-btn" style="margin:0">Change banner</button><button id="mpPfpBtn" class="sh-btn" style="margin:0">Change photo</button></div>
    <input id="mpBanF" type="file" accept="image/*" hidden><input id="mpPfpF" type="file" accept="image/*" hidden>
    <label class="sh-lab">Bio</label><textarea id="mpBio" maxlength="120" placeholder="Say something about you">${esc(p.bio || '')}</textarea>
    <label class="sh-lab">Username</label><div class="sh-note" style="margin:0">@${esc(p.username)} · <a id="mpForgot" style="color:var(--accent-dark);font-weight:700">Forgot it / create a new one</a></div>
    <button id="mpSave" class="sh-btn primary">Save profile</button>`);
  drawB(); $('mpPfp').innerHTML = av(d, p.username);
  $('mpBanBtn').onclick = () => $('mpBanF').click(); $('mpPfpBtn').onclick = () => $('mpPfpF').click();
  $('mpBanF').onchange = async (e) => { const f = e.target.files[0]; if (f) { try { d.banner = await cropImg(f, 900, 300, .78); drawB(); } catch { toast('Couldn’t read image', 'error'); } } };
  $('mpPfpF').onchange = async (e) => { const f = e.target.files[0]; if (f) { try { d.pfp = await cropImg(f, 256, 256, .82); $('mpPfp').innerHTML = av(d, p.username); } catch { toast('Couldn’t read image', 'error'); } } };
  $('mpForgot').onclick = openUsernameSheet;
  $('mpSave').onclick = async () => {
    try { await updateDoc(doc(D(), 'chatUsers', state.uid), { pfp: d.pfp, banner: d.banner, bio: $('mpBio').value.trim().slice(0, 120) }); toast('Profile saved ✨', 'success'); closeSheet(); }
    catch { toast('Couldn’t save profile', 'error'); }
  };
}

function openUsernameSheet() {
  const p = state.profile; if (!p) return;
  openSheet('Your username', `<p class="sh-note">Your current chat username is <b>@${esc(p.username)}</b>. Forgot it or want a different one? Create a new username below — your friends stay connected.</p>
    <input id="unNew" type="text" placeholder="New username" autocapitalize="none" autocomplete="off" maxlength="20">
    <button id="unGo" class="sh-btn primary">Save new username</button>`);
  $('unGo').onclick = async () => {
    const name = $('unNew').value.trim(), lower = name.toLowerCase(), me = state.uid, old = p.usernameLower;
    if (!/^[a-z0-9_.]{3,20}$/i.test(name)) return toast('Username: 3–20 letters, numbers, _ or .', 'error');
    try {
      await runTransaction(D(), async (tx) => {
        if (lower === old) { tx.update(doc(D(), 'chatUsers', me), { username: name }); return; }
        const ref = doc(D(), 'usernames', lower);
        if ((await tx.get(ref)).exists()) throw new Error('taken');
        tx.set(ref, { uid: me });
        if (old) tx.delete(doc(D(), 'usernames', old));
        tx.update(doc(D(), 'chatUsers', me), { username: name, usernameLower: lower });
      });
      toast('Username updated', 'success'); closeSheet();
    } catch (e) { toast(e.message === 'taken' ? 'That username is taken' : 'Couldn’t update username', 'error'); }
  };
}
