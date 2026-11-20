import {
deleteField, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
onSnapshot, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
/* =========================================================
Helpers
========================================================= */
const $ = (id) => document.getElementById(id);
/* the newest styles are also injected from here, so they still apply even if an older chat.css is cached on the phone */
(() => { if (document.getElementById('v11css')) return; const s = document.createElement('style'); s.id = 'v11css'; s.textContent = `
/* =========================================================
v11 — header title · Chat tile · starry chats · reply arrow
========================================================= */
html body .top-nav { justify-content: space-between; }
html body .nav-brand { font-size: 1.3rem; white-space: nowrap; cursor: default; }
html body .nav-brand:active { transform: none; }
/* Chat tile: "Welcome to chat" <-> red shining "New message" */
#bnChatT.swap { animation: bnSwap .5s cubic-bezier(.2,.9,.3,1); }
@keyframes bnSwap { from { opacity: 0; transform: translateY(8px); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
#bnChatT.bn-new { font-weight: 700; color: transparent; -webkit-text-fill-color: transparent; -webkit-background-clip: text; background-clip: text;
background-image: linear-gradient(100deg, #ff2d46 0%, #ff2d46 36%, #ffd3d9 50%, #ff2d46 64%, #ff2d46 100%); background-size: 260% 100%;
filter: drop-shadow(0 0 6px rgba(255,45,70,.7)); animation: bnRedShine 2.2s linear infinite; }
#bnChatT.bn-new.swap { animation: bnSwap .5s cubic-bezier(.2,.9,.3,1), bnRedShine 2.2s linear infinite; }
@keyframes bnRedShine { from { background-position: 130% 0; } to { background-position: -130% 0; } }
html body .bn-tile.has-new { border-color: rgba(255,45,70,.4); box-shadow: 0 0 0 1px rgba(255,45,70,.25), 0 0 24px rgba(255,45,70,.16); }
/* starry gold background — same sparkles as the Our Space welcome */
.cbg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
background: radial-gradient(120% 90% at 50% 28%, #3a2418 0%, #150c08 58%, #0b0504 100%); }
.cbg i { position: absolute; left: var(--x); bottom: -6%; font-style: normal; font-size: var(--s); color: #e9bf8f; text-shadow: 0 0 10px rgba(233,191,143,.9);
opacity: 0; animation: cbgRise var(--t) linear var(--dl) infinite; will-change: transform, opacity; }
@keyframes cbgRise { 0% { transform: translate(0,0) rotate(0); opacity: 0; } 12% { opacity: .85; } 85% { opacity: .6; } 100% { transform: translate(var(--sw), -112vh) rotate(180deg); opacity: 0; } }
.chat-app:not(.active) .cbg i, .fp:not(.active) .cbg i { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .cbg i { animation-duration: 20s; } }
.chat-pane > .cp-head, .chat-pane > .cp-msgs, .chat-pane > .cp-empty, .chat-pane > .cp-reply, .chat-pane > .cp-comp { position: relative; z-index: 1; }
.chat-pane > .cp-head, .chat-pane > .cp-comp { background: rgba(16,11,9,.74); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-color: rgba(227,192,141,.18); box-shadow: none; }
.chat-pane > .cp-msgs { background: transparent; }
.fp > .fp-top, .fp > .fp-list { position: relative; z-index: 1; }
/* message text that matches the golden background */
html body .chat-app .me .bub { color: #2b190b; text-shadow: none; background: linear-gradient(135deg, #f3d9ae 0%, #e0b377 55%, #c9965a 100%); box-shadow: 0 6px 18px rgba(201,150,90,.32), inset 0 1px 0 rgba(255,255,255,.45); }
html body .chat-app .them .bub { color: #f7ecdc; background: rgba(42,30,24,.78); border: 1px solid rgba(227,192,141,.24); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
html body .chat-app .bub.lock { color: #d8c3a2; }

/* =========================================================
v12 — menu above messages · call button + call screen · dock stays on its pages
========================================================= */
.chat-pane > .cp-head { z-index: 6; }
html body .cp-menu { z-index: 8; background: #1a1410; border: 1px solid rgba(227,192,141,.38); box-shadow: 0 22px 48px rgba(0,0,0,.65); -webkit-backdrop-filter: none; backdrop-filter: none; }
html body .cp-menu::before { background: #1a1410; border-left-color: rgba(227,192,141,.38); border-top-color: rgba(227,192,141,.38); }
html body .chat-app .cp-head .cp-btn.cp-call { color: #e9cd9f; }
html body .cp-btn.cp-call svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
html body .dock { width: auto; min-width: 232px; padding: 0 12px; gap: 8px; justify-content: space-around; }
body.dock-up .dock { z-index: 620; }
html body .fp-list { padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px)); }
.pp-body { padding-bottom: calc(130px + env(safe-area-inset-bottom, 0px)) !important; }
#callUI { position: fixed; inset: 0; z-index: 900; display: none; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; color: #f4e9dc;
padding: calc(env(safe-area-inset-top, 0px) + 64px) 24px calc(env(safe-area-inset-bottom, 0px) + 52px); font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
background: radial-gradient(110% 80% at 50% 18%, #43291a 0%, #170d08 58%, #080403 100%); }
#callUI.active { display: flex; animation: callIn .4s ease both; }
@keyframes callIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }
#callUI .call-lbl { font-family: 'Cinzel', Georgia, serif; font-size: .72rem; letter-spacing: .4em; text-indent: .4em; text-transform: uppercase; color: #cdb48f; }
#callUI .call-mid { display: grid; justify-items: center; gap: 14px; }
#callUI .call-av { position: relative; width: 132px; height: 132px; border-radius: 50%; padding: 4px; background: conic-gradient(from 0deg, #b98558, #fff1cf, #e3c08d, #b98558); box-shadow: 0 0 46px rgba(227,192,141,.4); }
#callUI.ringing .call-av { animation: callPulse 1.8s ease-in-out infinite; }
@keyframes callPulse { 0%, 100% { box-shadow: 0 0 30px rgba(227,192,141,.3); } 50% { box-shadow: 0 0 70px rgba(227,192,141,.7); } }
#callUI .call-av .pfp { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; font-size: 3rem; background: #2a1c14; color: #e9cd9f; border: 3px solid #120b08; }
#callUI h2 { margin: 6px 0 0; font-family: 'Bodoni Moda', Georgia, serif; font-weight: 600; font-size: 1.9rem; color: #fff1d6; }
#callUI .call-state { margin: 0; font-size: .95rem; letter-spacing: .06em; color: #cdb48f; }
#callUI .call-acts { display: flex; gap: 30px; align-items: center; justify-content: center; }
#callUI .call-btn { width: 70px; height: 70px; border-radius: 50%; border: 0; padding: 0; display: grid; place-items: center; cursor: pointer; color: #fff; -webkit-tap-highlight-color: transparent; }
#callUI .call-btn svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
#callUI .call-btn.end { background: #e5484d; box-shadow: 0 8px 26px rgba(229,72,77,.45); } #callUI .call-btn.end svg { transform: rotate(135deg); }
#callUI .call-btn.ok { background: #2fbf71; box-shadow: 0 8px 26px rgba(47,191,113,.45); }
#callUI .call-btn.mute { background: rgba(255,255,255,.1); border: 1px solid rgba(227,192,141,.35); color: #e9cd9f; }
#callUI .call-btn.mute.on { background: #e3c08d; color: #1b120c; }
#callUI .call-btn:active { transform: scale(.92); }
html body .chat-app .mt { color: #bfa98b; }
html body .chat-app .mt .rd { color: #d3b98c; font-weight: 600; letter-spacing: .03em; }
html body .chat-app .mt .rd.seen { color: #ffe3a6; text-shadow: 0 0 8px rgba(255,214,140,.75); }
html body .chat-app .day-sep { color: #e9cd9f; background: rgba(22,15,11,.7); border: 1px solid rgba(227,192,141,.22); }
html body .chat-app .cp-who i { color: #bfa98b; }
/* reply arrow + quoted reply */
.msg .rp { position: absolute; top: calc(50% - 22px); width: 28px; height: 28px; padding: 0; display: grid; place-items: center; border-radius: 50%; cursor: pointer;
border: 1px solid rgba(227,192,141,.3); background: rgba(22,15,11,.72); color: #e9cd9f; opacity: .78; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: transform .15s ease, opacity .15s ease; }
.msg .rp svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.msg.me .rp { left: -35px; } .msg.them .rp { right: -35px; }
.msg .rp:active { transform: scale(.88); opacity: 1; background: rgba(227,192,141,.35); }
.cp-msgs.selecting .rp { display: none; }
.rq { max-width: 100%; margin-bottom: 4px; padding: 6px 11px; border-radius: 12px; border-left: 3px solid #e3c08d; background: rgba(227,192,141,.12); cursor: pointer; display: flex; flex-direction: column; gap: 1px; }
.rq b { font-size: .68rem; color: #e9cd9f; font-weight: 700; }
.rq span { font-size: .76rem; color: #e8d9c3; max-width: 62vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg.flash .bub { animation: msgFlash 1.6s ease; }
@keyframes msgFlash { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,222,150,0); } 25%, 60% { box-shadow: 0 0 0 4px rgba(255,222,150,.7), 0 0 26px rgba(255,214,140,.6); } }
.cp-reply { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(16,11,9,.82); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-top: 1px solid rgba(227,192,141,.18); }
.cp-reply.hidden { display: none; }
.cr-bar { align-self: stretch; width: 3px; border-radius: 3px; background: #e3c08d; flex: none; }
.cr-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.cr-t b { font-size: .72rem; color: #e9cd9f; }
.cr-t span { font-size: .8rem; color: #d8c8b2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-reply button { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(227,192,141,.3); background: transparent; color: #e9cd9f; cursor: pointer; }
.chat-pane.selecting .cp-reply { display: none; }
`; document.head.appendChild(s); })();
const O = () => window.OS;
const D = () => O().db;
const toast = (m, t) => O()?.toast(m, t);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const LSg = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const LSs = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const enc = new TextEncoder(), dec = new TextDecoder();
const INLINE = 700000;// max base64 chars kept inside one Firestore doc
const MAX_VIDEO = 8 * 1024 * 1024;// 8 MB
const safeImg = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) ? s : '';
const chatId = (a, b) => [a, b].sort().join('_');
const BANNERS = [['volt', 'Golden Thunder'], ['aurora', 'Night Aurora'], ['storm', 'White Thunder'], ['tide', 'Ocean Bubbles'], ['cosmos', 'Cosmic Drift']];
const BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>';
const bolts = () => [['0s', 19], ['-2s', 15], ['-4s', 15]].map(([l, s]) => `<em class="ob" style="--d:6s;--dl:${l};--s:${s}px"><u>${BOLT}</u></em>`).join('');
const rocks = (a) => a.map(([s, d, l, dir, sh]) => `<em class="ob" style="--d:${d}s;--dl:${l}s;--dir:${dir};--s:${s}px"><u class="rk ${sh}"></u></em>`).join('');
const bubbles = [[8, 8, 6, -1, 4], [19, 13, 8, -4, -6], [31, 7, 5.5, -2, 5], [44, 11, 7.5, -6, -5], [57, 15, 9, -3, 6], [68, 8, 6.5, -5, -4], [79, 12, 8, -1.5, 5], [90, 9, 6, -4.5, -5], [50, 6, 5, -.5, 3]]
.map(([x, s, d, l, dx]) => `<em class="bb" style="left:${x}%;--s:${s}px;--d:${d}s;--dl:${l}s;--x:${dx}px"></em>`).join('');
const BX = '<b class="rg"></b><b class="cv"></b>';
const BNFX = {
volt: BX + '<b class="fx"></b><b class="glo"></b><b class="fl"></b><b class="pth">' + bolts() + '</b><b class="shn"></b>',
storm: BX + '<b class="fx"></b><b class="glo"></b><b class="fl"></b><b class="pth">' + bolts() + '</b><b class="shn"></b>',
aurora: BX + '<b class="fx"><b class="st"></b><em class="au a1"></em><em class="au a2"></em><em class="au a3"></em></b><b class="glo"></b><b class="shn"></b>',
tide: BX + '<b class="fx"><em class="wv"></em>' + bubbles + '</b><b class="glo"></b><b class="pth"><em class="ob" style="--d:7s;--s:12px"><u class="dr"></u></em><em class="ob" style="--d:7s;--dl:-3.5s;--s:10px"><u class="dr"></u></em></b><b class="shn"></b>',
cosmos: BX + '<b class="fx"><b class="st"></b><b class="st s2"></b></b><b class="glo"></b><b class="pth">' +
rocks([[9, 11, 0, 'normal', 'r1'], [6, 8, -3, 'reverse', 'r2'], [11, 14, -6, 'normal', 'r3'], [7, 9.5, -8, 'reverse', 'r1']]) +
'</b><b class="pth p2">' + rocks([[5, 7, -1, 'normal', 'r2'], [8, 12, -5, 'reverse', 'r3'], [6, 10, -9, 'normal', 'r1']]) + '</b><b class="shn"></b>'
};
const bannerEl = (p, cls) => {
if (p?.bannerId && BNFX[p.bannerId]) return `<span class="${cls} bn bnx bn-${p.bannerId}">${BNFX[p.bannerId]}</span>`;
const s = safeImg(p?.banner);
return s ? `<img class="${cls}" src="${s}" alt="">` : `<span class="${cls} bn bnx bn-cosmos">${BNFX.cosmos}</span>`; };
const wide = () => matchMedia('(min-width:820px)').matches; const svg = (d, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = { add: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M19 8v6M16 11h6"/>'),
img: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>'),
mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>'),
send: svg('<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>'),
panel: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>'),
dots: svg('<circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/>'),
trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
close: (s = 22) => svg('<path d="M6 6l12 12M18 6L6 18"/>', s)
};
/* =========================================================
Crypto (end-to-end): ECDH P-256 -> HKDF -> AES-GCM
Private key lives only on the device (IndexedDB, non-extractable)
and, wrapped by the user's passphrase, in chatPrivate/{uid}. ========================================================= */
const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); const EC = { name: 'ECDH', namedCurve: 'P-256' };
const idbOpen = () => new Promise((res, rej) => { const r = indexedDB.open('ourspace-chat', 1); r.onupgradeneeded = () => r.result.createObjectStore('keys'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); const kvGet = async (k) => { const db = await idbOpen(); return new Promise((res, rej) => { const q = db.transaction('keys').objectStore('keys').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
const kvSet = async (k, v) => { const db = await idbOpen(); return new Promise((res,rej) => { const t = db.transaction('keys', 'readwrite'); t.objectStore('keys').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); };
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
return JSON.parse(dec.decode(pt)); }
const keyCache = new Map();
async function sharedKey(uid) {
const p = state.profiles.get(uid);
if (!p?.pubKey || !state.priv) throw new Error('no key');
const ck = uid + p.pubKey;
if (keyCache.has(ck)) return keyCache.get(ck);
const pub = await crypto.subtle.importKey('jwk', JSON.parse(p.pubKey), EC, false, []);
const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, state.priv, 256);
const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: enc.encode('ourspace-chat-v1') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); keyCache.set(ck, key);
return key;
}
async function encBytes(key, buf) {
const iv = crypto.getRandomValues(new Uint8Array(12));
return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf)) };
}
const decBytes = (key, iv, ct) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
const encJSON = (key, obj) => encBytes(key, enc.encode(JSON.stringify(obj)));
const decJSON = async (key, iv, ct) => JSON.parse(dec.decode(await decBytes(key, iv, ct))); async function safetyNumber(a, b) {
const [x, y] = [a, b].sort(); const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(x + y)));
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
profiles: new Map(), watch: new Map(), chats: new Map(), active: null, msgDocs: [], unsubs: [], unsubMsgs: null, listening: false, warned: false,
celebrated: new Set(), search: '', sig: '',
presence: new Map(), gotTo: false, chatsReady: false,
sel: new Set(), typeUntil: new Map(), typeStamp: new Map()
};
let hbTimer = null, presenceBound = false;
let typeLast = 0, typeOff = null; // typing indicator (sender side)
const plain = new Map(); // decrypted message payloads by id
const media = new Map(); // blob URLs by message id
/* =========================================================
DOM
========================================================= */ const confetti = Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
document.body.insertAdjacentHTML('beforeend', `
<div id="chatApp" class="chat-app" aria-hidden="true">
<div id="chatGate" class="chat-gate hidden"></div> <div id="chatMain" class="chat-main hidden">
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
<button id="cpCall" class="cp-btn cp-call" aria-label="Voice call"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg></button>
<button id="cpMore" class="cp-btn" aria-label="More options">${IC.dots}</button>
<div id="cpMenu" class="cs-menu cp-menu">
<button id="cpmSelect">☑️ Delete messages</button>
<button id="cpmAll" class="danger">🗑️ Delete all chats</button>
<button id="cpmClose">✕ Close chat</button>
</div>
<div id="cpSelBar" class="cp-selbar">
<button id="selCancel" class="cp-btn" aria-label="Cancel selection">${IC.close(20)}</button>
<b id="selCount" class="sel-count">Select messages</b>
<button id="selAll" class="cp-link">Select all</button>
<button id="selDel" class="cp-btn danger" aria-label="Delete selected" disabled>${IC.trash}</button>
</div>
</header>
<div id="cpEmpty" class="cp-empty"><div><span id="cpEmptyTxt">Add a friend<br>to start chatting</span><small id="cpNote">🔒 Messages are end-to-end encrypted</small></div></div>
<div id="cpMsgs" class="cp-msgs hidden"></div>
<div id="cpReply" class="cp-reply hidden"></div>
<footer id="cpComp" class="cp-comp">
<button id="cpFileBtn" class="cp-circle" aria-label="Send photo or video">${IC.img}</button>
<input id="cpFile" type="file" accept="image/*,video/*" hidden>
<textarea id="cpInput" class="cp-input" rows="1" placeholder="Type a message"></textarea> <div class="cp-rec"><span class="rec-dot"></span><span id="cpRecTime" class="rec-time">0:00</span>
<button id="cpRecCancel" class="cp-circle" style="width:36px;height:36px" aria-label="Cancel">${IC.close(18)}</button></div>
<button id="cpMic" class="cp-circle" aria-label="Voice message">${IC.mic}</button>
<button id="cpSend" class="cp-circle go hide" aria-label="Send">${IC.send}</button>
</footer>
</section> </div>
<div id="chatSheet" class="chat-sheet"><div class="sheet-card"><div class="sheet-grip"></div><div id="sheetBody"></div></div></div>
<div id="chatLight" class="chat-light"><img alt=""></div>
</div>
<div id="chatCongrats" class="chat-congrats">
<div class="cc-confetti">${confetti}</div>
<div class="cc-card"> <div id="ccPfp" class="cc-pfp"></div>
<h2>Congrats! 🎉</h2>
<p id="ccText"></p>
<small id="ccSub" class="cc-sub"></small>
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
scrim.onclick = hideSideMobile; function closeChat() {
exitSelect(); stopTyping(); $('cpMenu')?.classList.remove('open');
stopRec(false); if (state.active) closeConversation();
closeSheet(); closeLight(); hideSideMobile();
app.classList.remove('active');
document.documentElement.style.overflow = '';
}
const reg = (el, fn, test) => window.OSBack?.add(el, fn, test);
const pane = main.querySelector('.chat-pane');
const convBack = () => { closeConversation(); if (!wide()) openSide(); };
/* order = back-button structure: chat > conversation > friends drawer (over a conversation) > sheet / viewer */
reg(app, closeChat);
reg(pane, convBack);
reg(side, hideSideMobile, () => side.classList.contains('active') && !!state.active);
reg(sheet, closeSheet); reg(light, closeLight); reg(congrats, closeCongrats);
reg($('cpSelBar'), () => exitSelect(), () => state.selecting);
/* swipe: left closes the friends panel, right opens it */
let tx0 = 0, ty0 = 0, tblock = false;
app.addEventListener('touchstart', (e) => {
const t = e.touches[0]; tx0 = t.clientX; ty0 = t.clientY;
tblock = !!e.target.closest('audio,video,input,textarea,.chat-sheet,.chat-light');
}, { passive: true });
app.addEventListener('touchend', (e) => {
if (wide() || tblock || sheet.classList.contains('active')) return;
const t = e.changedTouches[0], dx = t.clientX - tx0, dy = t.clientY - ty0; if (Math.abs(dx)< 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return; const open = side.classList.contains('active');
if (open && dx < 0) hideSideMobile();
else if (!open && dx > 0 && !main.classList.contains('hidden')) openSide();
}, { passive: true });
/* keyboard-aware sizing (so the composer never hides behind the keyboard) */
let fitRaf = 0;
const fit = () => { if (fitRaf) return; fitRaf = requestAnimationFrame(() => { fitRaf = 0;
const v = window.visualViewport; if (!v || !app.classList.contains('active')) return;
app.style.height = v.height + 'px'; app.style.top = v.offsetTop + 'px';
if (document.activeElement === input) { const b = $('cpMsgs'); b.scrollTop = b.scrollHeight; } }); };
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
state.unsubs.forEach((f) => f()); state.watch.forEach((f) => f()); state.unsubMsgs?.(); Object.assign(state, { uid: null, profile: null, private: null, priv: null, nick: {}, bootErr: false, reqFrom: [], reqTo: [], friends: [], incoming: [], outgoing: [], unsubs: [], unsubMsgs: null, listening: false, warned: false, selecting: false, active: null, msgDocs: [], sig: '', gotTo: false, chatsReady: false });
clearInterval(hbTimer); hbTimer = null;
state.profiles.clear(); state.presence.clear(); state.typeUntil.clear(); state.typeStamp.clear(); state.sel.clear(); state.watch.clear(); state.chats.clear(); state.celebrated.clear(); keyCache.clear();
closeChat(); closeCongrats(); updateBadges(); }
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
/* chat opens only from the "Chat" tile on the home screen */
async function openChat() {
if (!state.uid) { toast('Please log in first', 'error'); return; }
await state.bootP;
app.classList.add('active'); document.documentElement.style.overflow = 'hidden';
fit(); route();
}
function route() {
gate.classList.add('hidden'); main.classList.add('hidden');
if (state.bootErr) return showGate('error');
if (!state.profile) return showGate('create');
if (!state.priv) return showGate('unlock'); main.classList.remove('hidden');
renderAll();
if (!state.active) openSide();
}
/* =========================================================
Gate screens
========================================================= */
function showGate(v) {
gate.classList.remove('hidden');
const back = '<button id="cgBack" class="gate-link">Back to memories</button>'; if (v === 'error') {
gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">⚠️</div><h2>Chat isn’t ready</h2>
<p>Couldn’t reach the chat database. Publish the chat Firestore rules (firestore.rules.txt), then try again.</p>${back}</div>`;
} else if (v === 'create') {
gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">💬</div><h2>Create your chat identity</h2>
<p>Choose a username your friends can find you by. Everything you send is end-to-end encrypted.</p>
<input id="cgUser" placeholder="Username (3–20: letters, numbers, _ .)" autocapitalize="none" autocomplete="off" maxlength="20">
<input id="cgPass" type="password" placeholder="Recovery passphrase (8+ characters)" autocomplete="new-password">
<input id="cgPass2" type="password" placeholder="Repeat passphrase" autocomplete="new-password">
<p class="gate-note">The passphrase restores your chats on a new phone. Nobodycan recover it for you.</p>
<button id="cgGo" class="gate-btn">Create &amp; continue ✨</button>${back}</div>`;
$('cgGo').onclick = createIdentity;
} else { gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">🔐</div><h2>Unlock your chats</h2>
<p>This device doesn’t have your chat key yet. Enter your recovery passphrase.</p>
<input id="cuPass" type="password" placeholder="Recovery passphrase" autocomplete="current-password">
<button id="cuGo" class="gate-btn">Unlock</button> <button id="cuForgot" class="gate-link">Forgot passphrase? Reset keys</button>${back}</div>`;
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
}); state.priv = await importPriv(keys.priv);
await kvSet('priv:' + me, state.priv); state.profile = { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), bio: '', pfp: '', banner: '' };
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
watchProfile(me); startPresence();
const rq = collection(D(), 'chatRequests');
state.unsubs.push(onSnapshot(query(rq, where('from', '==', me)), (s) => { state.reqFrom = s.docs.map((d) => ({ id: d.id, ...d.data() })); recompute(); }, err));
state.unsubs.push(onSnapshot(query(rq, where('to', '==', me)), (s) => {
const next = s.docs.map((d) => ({ id: d.id, ...d.data() }));
if (state.gotTo) next.filter((r) => r.status === 'pending' && !state.reqTo.some((o) => o.id === r.id)).forEach(notifyReq);
state.gotTo = true; state.reqTo = next; recompute();
}, err));
state.unsubs.push(onSnapshot(query(collection(D(), 'chats'), where('members', 'array-contains', me)), (s) => {
s.docChanges().forEach((ch) => { if (ch.type === 'removed' || !state.chatsReady || ch.doc.metadata.hasPendingWrites) return;
const c = ch.doc.data(), prev = state.chats.get(ch.doc.id);
if (c.lastFrom && c.lastFrom !== me && c.lastAt && prev?.lastAt?.seconds !== c.lastAt.seconds) notifyMsg(ch.doc.id, c); });
state.chats = new Map(s.docs.map((d) => [d.id, d.data()])); state.chatsReady = true; renderAll(); if (state.active) queuePaint();
}, err));
}
function watchProfile(uid) {
if (state.watch.has(uid)) return;
state.watch.set('p:' + uid, onSnapshot(doc(D(), 'chatPresence', uid), (s) => {
const pd = s.exists() ? s.data({ serverTimestamps: 'estimate' }) : null; state.presence.set(uid, pd); trackTyping(uid, pd); if (uid !== state.uid) renderAll();
}, () => {}));
state.watch.set(uid, onSnapshot(doc(D(), 'chatUsers', uid), (s) => {
const d = s.exists() ? s.data() : null;
state.profiles.set(uid, d);
if (uid === state.uid && d) state.profile = d;
if (uid === state.active) state.sig = '';
renderAll(); if (uid === state.active) queuePaint();
}));
}
async function getProfile(uid) {
if (state.profiles.get(uid)) return state.profiles.get(uid);
try { const s = await getDoc(doc(D(), 'chatUsers', uid)); return s.exists() ? s.data() : null; } catch { return null; }
}
function recompute() {
const me = state.uid;
const all = [...state.reqFrom, ...state.reqTo];
state.friends = all.filter((r) => r.status === 'accepted').map((r) => ({ uid: r.from === me ? r.to : r.from, req: r })); state.incoming = state.reqTo.filter((r) => r.status === 'pending');
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
state.celebrated.add(req.id); updateDoc(doc(D(), 'chatRequests', req.id), { [flag]: true }).catch(() => {});
celebrate(uid, req.to === me); // true = I accepted, false = they accepted mine
});
}
/* ---------- presence (online / last seen) ---------- */
function startPresence() {
if (hbTimer) return;
const beat = (on) => { if (state.uid) setDoc(doc(D(), 'chatPresence', state.uid), { online: on, lastSeen: serverTimestamp(), ...(on ? {} : { typing: false, typingTo: null }) }, { merge: true }).catch(() => {}); };
beat(!document.hidden); hbTimer = setInterval(() => { if (!document.hidden) beat(true); if (app.classList.contains('active') && state.profile) renderAll(); }, 30000);
if (!presenceBound) {
presenceBound = true;
document.addEventListener('visibilitychange', () => beat(!document.hidden));
addEventListener('pagehide', () => beat(false));
}
}
/* ---------- typing indicator ---------- */
function trackTyping(uid, d) {
if (d && d.typing === true && d.typingTo === state.uid) {
const t = d.typingAt, st = t ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0;
if (st !== state.typeStamp.get(uid)) { state.typeStamp.set(uid, st); state.typeUntil.set(uid, Date.now() + 6000); setTimeout(() => { if (state.profile) renderAll(); }, 6200); }
} else { state.typeUntil.delete(uid); state.typeStamp.delete(uid); }
}
function setTyping(on) {
if (!state.uid) return;
setDoc(doc(D(), 'chatPresence', state.uid), on ? { typing: true, typingTo: state.active, typingAt: serverTimestamp() } : { typing: false, typingTo: null }, { merge: true }).catch(() => {});
}
function typingPing() {
if (!state.active) return;
const now = Date.now();
if (now - typeLast > 2500) { typeLast = now; setTyping(true); }
clearTimeout(typeOff); typeOff = setTimeout(stopTyping, 3000);
}
function stopTyping() {
clearTimeout(typeOff); typeOff = null;
if (typeLast) { typeLast = 0; setTyping(false); }
}
function presence(uid) { const p = state.presence.get(uid);
if ((state.typeUntil.get(uid) || 0) > Date.now()) return { on: true, typing: true, txt: 'typing…' };
if (!p?.lastSeen) return { on: false, txt: 'Offline' };
const ms = p.lastSeen.seconds * 1000;
if (p.online && Date.now() - ms < 100000) return { on: true, txt: 'Online' };
const d = new Date(ms), day = dayLabel(d), t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
return { on: false, txt: `Last seen ${day === 'Today' ? 'today' : day === 'Yesterday' ? 'yesterday' : day} at ${t}` };
}
/* ---------- notifications ---------- */
async function notifyReq(r) {
const p = await getProfile(r.from);
window.OSNotify?.push({ icon: '💌', title: 'New friend request', body: `@${p?.username || 'someone'} wants to be friends`, key: 'rq:' + r.id, onTap: () => openChat() });
}
async function notifyMsg(cid, c) {
const uid = (c.members || []).find((m) => m !== state.uid); if (!uid) return;
if (app.classList.contains('active') && state.active === uid && !document.hidden) return;
let body = 'New message';
try {
const m = (await getDocs(query(collection(D(), 'chats', cid, 'messages'), orderBy('at', 'desc'), limit(1)))).docs[0]?.data();
if (m) { const p = await decJSON(await sharedKey(uid), m.iv, m.ct); body = p.k === 't' ? p.x.slice(0, 90) : p.k === 'img' ? '📷 Photo' : p.k === 'vid' ? '🎞️ Video' : '🎤 Voice message'; }
} catch {}
window.OSNotify?.push({ icon: '💬', title: displayName(uid), body, key: 'chat:' + cid, onTap: async () => { await openChat(); openConversation(uid); } });
}
async function celebrate(uid, iAccepted) {
const p = await getProfile(uid), nm = p?.username || 'your friend';
$('ccPfp').innerHTML = av(p, nm);
$('ccText').innerHTML = iAccepted ? `You accepted <b>@${esc(nm)}</b>’s friend request` : `<b>@${esc(nm)}</b> has accepted your friend request`;
$('ccSub').textContent = iAccepted ? 'You two are friends now 💞' : 'Your friendship is official 💞';
$('ccChat').onclick = async () => { closeCongrats(); await openChat(); openConversation(uid); };
congrats.classList.remove('active'); void congrats.offsetWidth; // replay the animation every time
congrats.classList.add('active');
}
/* =========================================================
Rendering: sidebar
========================================================= */
const av = (p, name) => { const s = safeImg(p?.pfp); return s ? `<img class="pfp" src="${s}" alt="">` : `<span class="pfp">${esc((name || '?').trim()[0]?.toUpperCase() || '?')}</span>`; };
const displayName = (uid) => state.nick[uid] || state.profiles.get(uid)?.username || 'Friend';
function unreadFor(uid) { const c = state.chats.get(chatId(state.uid, uid));
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
} function friendRow(uid) {
const p = state.profiles.get(uid) || {}, nm = displayName(uid), b = safeImg(p.banner), un = p.username ? '@' + p.username : '';
const pr = presence(uid);
return `<button class="fr-row${state.active === uid ? ' sel' : ''}" data-open="${uid}">
${bannerEl(p, 'fr-banner')}
<span class="fr-sheen"></span><span class="fr-scrim"></span>
<span class="pfp-wrap"><span class="pfp-ring">${av(p, nm)}</span><i class="pdot ${pr.on ? 'on' : 'off'}"></i></span>
<span class="fr-text"><b>${esc(nm)}</b>${state.nick[uid] && un ? `<i>${esc(un)}</i>` : ''}<i class="pres${pr.on ? ' on' : ''}${pr.typing ? ' typing' : ''}">${esc(pr.txt)}</i></span>
${unreadFor(uid) ? '<span class="fr-dot"></span>' : ''}</button>`; }
/* ---------- smooth lists: only rows that really changed are touched, so nothing flickers or restarts ---------- */
const rowIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('off', !e.isIntersecting)), { rootMargin: '60px' }) : null;
function setList(box, items, watch) {
const old = new Map();
for (const el of [...box.children]) { if (el.__k == null) el.remove(); else old.set(el.__k, el); }
let ref = box.firstElementChild;
for (const it of items) {
const el = old.get(it.k);
if (el && el.__h === it.html) { old.delete(it.k); if (el === ref) ref = ref.nextElementSibling; else box.insertBefore(el, ref); continue; }
const t = document.createElement('template'); t.innerHTML = it.html; const ne = t.content.firstElementChild; if (!ne) continue;
ne.__k = it.k; ne.__h = it.html;
if (el) { old.delete(it.k); if (el === ref) ref = ref.nextElementSibling; el.remove(); }
box.insertBefore(ne, ref); if (watch && rowIO) rowIO.observe(ne);
}
old.forEach((el) => el.remove());
}
const cnt = (n) => `<div class="cs-label">${n}</div>`;
function renderSide() {
const p = state.profile; if (!p) return; $('csMe').innerHTML = `<span class="pfp-ring sm">${av(p, p.username)}</span><span><b>@${esc(p.username)}</b><i>Tap to edit your profile</i></span>`;
const q = state.search.trim().toLowerCase(), items = [];
if (state.incoming.length) {
items.push({ k: 'l:rq', html: cnt('Friend requests') });
state.incoming.forEach((r) => {
const pr = state.profiles.get(r.from) || {};
items.push({ k: 'rq:' + r.id, html: `<div class="rq-row"><span class="pfp-sm">${av(pr, pr.username)}</span><span class="rq-name"><b>@${esc(pr.username || '…')}</b><i>wants to be friends</i></span>
<button class="rq-ok" data-acc="${r.id}" aria-label="Accept">✓</button><button class="rq-no" data-dec="${r.id}" aria-label="Decline">×</button></div>` });
});
}
if (state.outgoing.length) {
items.push({ k: 'l:out', html: cnt('Sent requests') });
state.outgoing.forEach((r) => {
const pr = state.profiles.get(r.to) || {};
items.push({ k: 'ro:' + r.id, html: `<div class="rq-out"><span>Waiting for @${esc(pr.username || '…')}</span><button data-cancel="${r.id}">Cancel</button></div>` });
});
}
const list = state.friends
.filter((f) => !q || displayName(f.uid).toLowerCase().includes(q) || (state.profiles.get(f.uid)?.username || '').includes(q))
.sort((a, b) => ((state.chats.get(chatId(state.uid, b.uid))?.lastAt?.seconds || 0) - (state.chats.get(chatId(state.uid, a.uid))?.lastAt?.seconds || 0)) || displayName(a.uid).localeCompare(displayName(b.uid)));
items.push({ k: 'l:fr', html: cnt('Friends · ' + state.friends.length) });
if (list.length) list.forEach((f) => items.push({ k: 'fr:' + f.uid, html: friendRow(f.uid) }));
else items.push({ k: 'empty', html: `<div class="cs-empty">${state.friends.length ? 'No friends match.' : 'No friends yet.<br>Tap the 👤+ button to add one by username.'}</div>` });
setList($('csScroll'), items, true);
}
function renderHeader() {
const uid = state.active, who = $('cpWho'), has = state.friends.length > 0;
$('cpNote')?.classList.toggle('gone', has);
const em = $('cpEmptyTxt'); if (em) em.innerHTML = has ? 'Select a friend<br>to start chatting' : 'Add a friend<br>to start chatting';
if (!uid) { who.innerHTML = `<span style="min-width:0"><b class="cp-title">Chats</b>${has ? '<i>🔒 End-to-end encrypted</i>' : ''}</span>`; return; }
const p = state.profiles.get(uid) || {}, nm = displayName(uid); const pr = presence(uid);
who.innerHTML = `<span class="pfp-wrap sm"><span class="pfp-sm">${av(p, nm)}</span><i class="pdot ${pr.on ? 'on' : 'off'}"></i></span><span style="min-width:0"><b>${esc(nm)}</b><i class="pres${pr.on ? ' on' : ''}${pr.typing ? ' typing' : ''}">${esc(pr.txt)}</i><i>🔒 End-to-end encrypted</i></span>`;
}
let raRaf = 0;
function renderAll() { if (raRaf) return; raRaf = requestAnimationFrame(() => { raRaf = 0; if (!state.profile) { updateBadges(); return; } renderSide(); renderHeader(); updateBadges(); renderFriendsPage(); }); }
$('csScroll').addEventListener('click', async (e) => {
const t = e.target.closest('[data-open],[data-acc],[data-dec],[data-cancel]'); if (!t) return;
if (t.dataset.open) return openConversation(t.dataset.open); try {
if (t.dataset.acc) await updateDoc(doc(D(), 'chatRequests', t.dataset.acc), { status: 'accepted', seenFrom: false, seenTo: false });
else await deleteDoc(doc(D(), 'chatRequests', t.dataset.dec || t.dataset.cancel));
} catch { toast('Something went wrong', 'error'); }
});
$('csSearch').addEventListener('input', (e) => { state.search = e.target.value; renderSide(); });
$('csMe').onclick = () => openMeSheet();
$('csAdd').onclick = () => openAddSheet();
$('csBurger').onclick = (e) => { e.stopPropagation(); $('csMenu').classList.toggle('open'); };
document.addEventListener('click', (e) => { if (!e.target.closest('#csMenu')) $('csMenu').classList.remove('open'); });
$('csRemove').onclick = () => { $('csMenu').classList.remove('open'); openRemoveSheet(); }; $('csProfile').onclick = () => { $('csMenu').classList.remove('open'); openMeSheet(); };
$('csForgot').onclick = () => { $('csMenu').classList.remove('open'); openUsernameSheet(); };
$('cpToggle').onclick = () => { if (wide()) main.classList.toggle('collapsed'); else if (side.classList.contains('active')) hideSideMobile(); else openSide(); };
$('cpWho').onclick = () => { if (state.active) openFriendSheet(state.active); };
/* =========================================================
Conversation
========================================================= */
function closeConversation() {
exitSelect(); stopTyping(); state.reply = null; renderReply();
state.unsubMsgs?.(); state.unsubMsgs = null; state.active = null; state.msgDocs = []; state.sig = ''; pane.classList.remove('active');
$('cpMsgs').classList.add('hidden'); $('cpEmpty').classList.remove('hidden'); renderHeader();
}
async function openConversation(uid) {
await state.bootP;
if (!state.priv) return route();
state.unsubMsgs?.();
state.active = uid; state.msgDocs = []; state.sig = ''; state.first = true; state.reply = null; renderReply();
pane.classList.add('active');
hideSideMobile();
$('cpEmpty').classList.add('hidden'); $('cpMsgs').classList.remove('hidden'); comp.classList.remove('hidden');
$('cpMsgs').innerHTML = '';
renderAll();
const cid = chatId(state.uid, uid);
if (!state.chats.has(cid)) { // brand-new chat: create it first. Existing chats open straight away (no waiting on the server)
try {
const c = await getDoc(doc(D(), 'chats', cid));
if (!c.exists()) await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort() });
} catch { toast('Couldn’t open this chat', 'error'); return; }
}
if (state.active !== uid) return;
state.lim = 40; state.more = false; state.anchor = null; state.stick = false;
subMsgs(uid, cid);
}
function subMsgs(uid, cid) {
state.unsubMsgs?.();
state.unsubMsgs = onSnapshot(query(collection(D(), 'chats', cid, 'messages'), orderBy('at', 'desc'), limit(state.lim)), { includeMetadataChanges: true }, (s) => {
if (state.active !== uid) return;
s.docChanges().forEach((ch) => { if (ch.type === 'removed') { const u = media.get(ch.doc.id); if (u) { URL.revokeObjectURL(u); media.delete(ch.doc.id); } plain.delete(ch.doc.id); } });
state.msgDocs = s.docs.map((d) => ({ id: d.id, pending: d.metadata.hasPendingWrites, ...d.data({ serverTimestamps: 'estimate' }) })).reverse();
if (state.sel.size) { const live = new Set(state.msgDocs.map((m) => m.id)); [...state.sel].forEach((id) => { if (!live.has(id)) state.sel.delete(id); }); updateSelUI(); }
paint(); if (!s.metadata.hasPendingWrites) markSeen(cid);
}, () => toast('Couldn’t load messages', 'error'));
}
const dayLabel = (d) => {
const diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}; const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB';
/* ---------- starry gold background (same sparkles as the Our Space welcome) ---------- */
function dust(el, n) {
if (!el) return;
const g = ['✦', '·', '✧'], few = matchMedia('(prefers-reduced-motion: reduce)').matches;
el.innerHTML = Array.from({ length: few ? 8 : n }, () => `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--s:${(8 + Math.random() * 14).toFixed(0)}px;--t:${(7 + Math.random() * 8).toFixed(1)}s;--dl:${(-Math.random() * 12).toFixed(1)}s;--sw:${((Math.random() - .5) * 60).toFixed(0)}px">${g[(Math.random() * 3) | 0]}</i>`).join('');
}

/* ---------- reply to a message (the ↩ arrow beside every message) ---------- */
const REPLY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v3"/></svg>';
const replyLabel = (r) => r.k === 'img' ? '📷 Photo' : r.k === 'vid' ? '🎥 Video' : r.k === 'aud' ? '🎧 Voice message' : (r.x || 'Message');
const replyWho = (r) => r.f === state.uid ? 'You' : displayName(r.f);
function renderReply() {
const box = $('cpReply'); if (!box) return;
const r = state.reply;
box.classList.toggle('hidden', !r);
box.innerHTML = r ? `<span class="cr-bar"></span><span class="cr-t"><b>Replying to ${esc(replyWho(r))}</b><span>${esc(replyLabel(r))}</span></span><button type="button" id="crX" aria-label="Cancel reply">${IC.close(18)}</button>` : '';
$('crX')?.addEventListener('click', () => { state.reply = null; renderReply(); });
}
function startReply(id) {
const m = (state.msgDocs || []).find((x) => x.id === id), p = plain.get(id);
if (!m || !p || p.k === 'err') { toast('Can’t reply to this message', 'info'); return; }
state.reply = { id, f: m.from, k: p.k, x: p.k === 't' ? String(p.x || '').slice(0, 90) : '' };
renderReply(); input.focus();
}
function jumpToMsg(id) {
const el = $('cpMsgs').querySelector('[data-mid="' + String(id).replace(/"/g, '') + '"]');
if (!el) { toast('That message is further up than what’s loaded', 'info'); return; }
el.scrollIntoView({ block: 'center', behavior: 'smooth' });
el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
setTimeout(() => el.classList.remove('flash'), 1700);
}
const tsOf = (t) => (t && t.seconds != null) ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0;
function msgHTML(m, p, url, mine, t, theirRead) {
const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let inner;
if (p.k === 'err') inner = '<div class="bub lock">🔒 Can’t decrypt this message on this device</div>';
else if (p.k === 't') inner = `<div class="bub">${esc(p.x)}</div>`;
else if (url) {
inner = p.k === 'img' ? `<div class="bub media"><img class="m-img" data-view src="${url}" alt="" decoding="async"></div>`
: p.k === 'vid' ? `<div class="bub media"><video controls playsinline preload="metadata" src="${url}"></video></div>`
: `<div class="bub media"><audio controls preload="metadata" src="${url}"></audio></div>`;
} else {
inner = `<div class="bub media"><button class="m-load" data-load="${m.id}">${p.k === 'vid' ? '▶ Video' : p.k === 'aud' ? '🎧 Voice message' : '🖼️ Photo'} · ${fmtSize(p.sz)}<br>${m.d ? 'Opening…' : 'Tap to load'}</button></div>`;
}
const rq = p.r && p.r.id ? `<div class="rq" data-rq="${esc(p.r.id)}"><b>${esc(replyWho(p.r))}</b><span>${esc(replyLabel(p.r))}</span></div>` : '';
const rp = p.k === 'err' ? '' : `<button type="button" class="rp" data-reply="${m.id}" aria-label="Reply">${REPLY_SVG}</button>`;
const at = tsOf(m.at), seen = !!(theirRead && at && theirRead >= at);
const tick = !mine ? '' : m.pending ? '<em class="rd pend">🕓 Sending…</em>' : seen ? '<em class="rd seen">✓✓ Seen</em>' : '<em class="rd">✓ Delivered</em>';
return `<div class="msg ${mine ? 'me' : 'them'}${state.sel.has(m.id) ? ' picked' : ''}" data-mid="${m.id}"><span class="sel-ck"></span>${rq}${inner}<span class="mt">${time}${tick}</span>${rp}</div>`;
}
let paintTok = 0, pq = 0, hyd = 0; const badMedia = new Set();
const queuePaint = () => { if (!pq) pq = requestAnimationFrame(() => { pq = 0; paint(); }); };
async function paint() {
const uid = state.active; if (!uid) return;
const tok = ++paintTok, box = $('cpMsgs'), docs = state.msgDocs;
let key = null; try { key = await sharedKey(uid); } catch {}
if (tok !== paintTok || uid !== state.active) return;
const bodies = new Map();
await Promise.all(docs.map(async (m) => {
let p = plain.get(m.id);
if (!p) {
if (!key) p = { k: 'err' };
else { try { p = await decJSON(key, m.iv, m.ct); plain.set(m.id, p); } catch { p = { k: 'err' }; } }
}
bodies.set(m.id, p);
}));
if (tok !== paintTok || uid !== state.active) return;
const chat = state.chats.get(chatId(state.uid, uid)) || {}, theirRead = tsOf(chat.reads && chat.reads[uid]);
const items = []; let last = '';
for (const m of docs) {
const t = m.at ? new Date(m.at.seconds * 1000) : new Date(), day = dayLabel(t);
if (day !== last) { items.push({ k: 'd:' + day, html: `<div class="day-sep">${day}</div>` }); last = day; }
items.push({ k: m.id, html: msgHTML(m, bodies.get(m.id), media.get(m.id), m.from === state.uid, t, theirRead) });
}
const near = state.first || state.stick || box.scrollHeight - box.scrollTop - box.clientHeight < 160;
const a = state.anchor && docs.length > state.anchor.n ? state.anchor : null;
if (a) { state.anchor = null; state.more = false; }
setList(box, items);
if (a) box.scrollTop = a.t + (box.scrollHeight - a.h);
else if (near) { box.scrollTop = box.scrollHeight; box.__pin = true; }
state.first = false; state.stick = false;
hydrateMedia(docs, key, uid);
}
/* photos / videos / voice are decrypted one by one in the background, newest first, so text is never kept waiting */
async function hydrateMedia(docs, key, uid) {
if (!key) return; const me = ++hyd;
for (const m of [...docs].reverse()) {
if (me !== hyd || uid !== state.active) return;
if (media.has(m.id) || !m.d || badMedia.has(m.id)) continue;
const p = plain.get(m.id); if (!p || !p.k || p.k === 't' || p.k === 'err') continue;
try {
const url = URL.createObjectURL(new Blob([await decBytes(key, p.miv, m.d)], { type: p.mime }));
if (media.has(m.id)) URL.revokeObjectURL(url); else { media.set(m.id, url); queuePaint(); }
} catch { badMedia.add(m.id); }
await new Promise((r) => setTimeout(r, 0));
}
}
/* keep the view glued to the bottom while photos finish loading; load older messages when you reach the top */
(function () {
const box = $('cpMsgs'); let raf = 0;
const grow = () => { if (box.__pin) box.scrollTop = box.scrollHeight; };
box.addEventListener('load', grow, true); box.addEventListener('loadedmetadata', grow, true);
box.addEventListener('scroll', () => {
if (raf) return;
raf = requestAnimationFrame(() => {
raf = 0; box.__pin = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
if (box.scrollTop < 60 && state.active && !state.more && state.msgDocs.length >= state.lim) {
state.more = true; state.lim += 40; state.anchor = { h: box.scrollHeight, t: box.scrollTop, n: state.msgDocs.length };
subMsgs(state.active, chatId(state.uid, state.active));
}
});
}, { passive: true });
})();
async function loadChunked(id) {
const p = plain.get(id); if (!p?.mid) return;
const cid = chatId(state.uid, state.active), parts = new Array(p.n);
toast('Downloading…', 'info');
try {
for (let i = 0; i < p.n; i += 4) {
await Promise.all([...Array(Math.min(4, p.n - i))].map(async (_, j) => { parts[i + j] = (await getDoc(doc(D(), 'chats', cid, 'blobs', `${p.mid}_${i + j}`))).data().d;
}));
}
const bytes = await decBytes(await sharedKey(state.active), p.miv, parts.join(''));
media.set(id, URL.createObjectURL(new Blob([bytes], { type: p.mime })));
queuePaint();
} catch (e) { console.error(e); toast('Download failed', 'error'); }
}
$('cpMsgs').addEventListener('click', (e) => {
if (state.selecting) { const mm = e.target.closest('.msg'); if (mm) toggleSel(mm.dataset.mid); return; } const rpb = e.target.closest('[data-reply]'); if (rpb) { startReply(rpb.dataset.reply); return; }
const rqb = e.target.closest('[data-rq]'); if (rqb) { jumpToMsg(rqb.dataset.rq); return; }
const v = e.target.closest('[data-view]'), l = e.target.closest('[data-load]'); if (v) { light.querySelector('img').src = v.src; light.classList.add('active'); }
else if (l) loadChunked(l.dataset.load);
});
/* =========================================================
Sending
========================================================= */
async function sendPayload(payload, extra) {
const uid = state.active; if (!uid) return;
if (state.reply) { payload = { ...payload, r: state.reply }; state.reply = null; renderReply(); }
state.stick = true;
const key = await sharedKey(uid), cid = chatId(state.uid, uid), { iv, ct } = await encJSON(key, payload);
// the message is queued locally at once (shows as "Sending…"); the chat summary goes out in parallel instead of blocking it
const sent = addDoc(collection(D(), 'chats', cid, 'messages'), { from: state.uid, at: serverTimestamp(), iv, ct, ...(extra || {}) });
setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort(), lastAt: serverTimestamp(), lastFrom: state.uid }, { merge: true }).catch(() => {});
await sent;
} function needFriend() {
if (state.active) return false;
toast('Add a friend to start chatting 💬', 'info');
if (!state.friends.length) openAddSheet(); else openSide();
return true;
} function sendText() {
const x = input.value.trim(); if (!x) return;
if (needFriend()) return;
input.value = ''; autoGrow(); updateComp(); stopTyping();
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
await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort() }, { merge: true }); for (let i = 0; i < n; i++) {
toast(`Sending ${i + 1}/${n}…`, 'info');
await setDoc(doc(D(), 'chats', cid, 'blobs', `${mid}_${i}`), { d: e.ct.slice(i * INLINE, (i + 1) * INLINE), from: state.uid });
}
await sendPayload({ ...meta, mid, n }, { mid, n });
} catch (err) { console.error(err); toast('Couldn’t send media', 'error'); }
}
const shrinkImg = (file, max, q) => new Promise((res, rej) => {
const img = new Image(), u = URL.createObjectURL(file); img.onload = () => {
const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
c.toBlob((b) => (b ? res(b) : rej()), 'image/jpeg', q);
}; img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u;
});
async function prepImage(file) { for (const [m, q] of [[1280, .72], [1024, .6], [800, .5], [640, .45]]) { const b = await shrinkImg(file, m, q); if (b.size <= 480000) return b; }
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
$('cpFileBtn').onclick = () => { if (needFriend()) return; $('cpFile').click(); }; $('cpFile').onchange = async (e) => {
const f = e.target.files[0]; e.target.value = ''; if (!f) return;
if (f.type.startsWith('image/')) {
try { toast('Sending photo…', 'info'); await sendMedia(await prepImage(f), 'img'); } catch { toast('Couldn’t read that photo', 'error'); }
} else if (f.type.startsWith('video/')) {
if (f.size > MAX_VIDEO) return toast('Video too large — max 8 MB. Trim it first.', 'error');
toast('Sending video…', 'info'); sendMedia(f, 'vid');
} else toast('Only photos and videos', 'error');
};
/* composer behaviour */
let agRaf = 0;
function autoGrow() { if (agRaf) return; agRaf = requestAnimationFrame(() => { agRaf = 0; input.style.height = '46px'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }); }
function updateComp() {
const has = input.value.trim().length > 0 || !!rec;
$('cpSend').classList.toggle('hide', !has); $('cpMic').classList.toggle('hide', has && !rec ? true : false); }
let ucLast = null;
input.addEventListener('input', () => { autoGrow(); const has = input.value.trim().length > 0; if (has !== ucLast) { ucLast = has; updateComp(); } if (has) typingPing(); else stopTyping(); });
input.addEventListener('blur', () => stopTyping());
input.addEventListener('focus', () => setTimeout(() => { fit(); $('cpMsgs').scrollTop = $('cpMsgs').scrollHeight; }, 300));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches) { e.preventDefault(); sendText(); } });
$('cpSend').onclick = () => { if (rec) stopRec(true); else sendText(); };
/* voice messages */
let rec = null, recTimer = null;
const stopRec = (send) => { if (!rec) return; rec.send = send; if (rec.mr.state !== 'inactive') rec.mr.stop(); };
async function startRec() {
if (rec) return;
if (needFriend()) return; if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) return toast('Voice messages aren’t supported here', 'error');
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
$('cpMic').onclick = startRec; $('cpRecCancel').onclick = () => stopRec(false);
/* =========================================================
Sheets: add friend, remove friends, profiles, username
========================================================= */
function openAddSheet() {
openSheet('Add a friend', `<p class="sh-note">Enter your friend’s chat username.</p>
<div class="sh-row"><input id="afName" type="text" placeholder="@username" autocapitalize="none" autocomplete="off"><button id="afFind" class="gate-btn sm">Find</button></div>
<div id="afRes"></div>`);
$('afFind').onclick = async () => {
const name = $('afName').value.trim().replace(/^@/, '').toLowerCase(), box = $('afRes'); if (!/^[a-z0-9_.]{3,20}$/.test(name)) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Enter a valid username.</p>'; return; }
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
} catch { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Search failed. Check your connection / rules.</p>'; } };
}
function openRemoveSheet() {
if (!state.friends.length) return toast('No friends to remove', 'info');
openSheet('Remove friends', `<p class="sh-note">Select the friends you want to remove.</p>
${state.friends.map((f) => { const p = state.profiles.get(f.uid) || {}, nm = displayName(f.uid);
return `<label class="rm-row"><input type="checkbox" value="${f.uid}"><span class="pfp-sm">${av(p, nm)}</span><span class="nm">${esc(nm)}<br><i>@${esc(p.username || '')}</i></span></label>`; }).join('')}
<button id="rmGo" class="sh-btn danger" disabled>Remove selected</button>`);
const boxes = [...sheetBody.querySelectorAll('input[type=checkbox]')], go = $('rmGo');
boxes.forEach((b) => b.onchange = () => { const n = boxes.filter((x) => x.checked).length; go.disabled = !n; go.textContent = n ? `Remove selected (${n})` : 'Remove selected'; });
go.onclick = async () => { const ids = boxes.filter((b) => b.checked).map((b) => b.value);
if (!ids.length || !confirm(`Remove ${ids.length} friend${ids.length > 1 ? 's' : ''}?`)) return;
try { await Promise.all(ids.map((u) => deleteDoc(doc(D(), 'chatRequests', state.friends.find((f) => f.uid === u).req.id)))); toast('Removed', 'success'); closeSheet(); }
catch { toast('Couldn’t remove', 'error'); }
};
}
function openFriendSheet(uid) {
const p = state.profiles.get(uid) || {}, nm = displayName(uid), b = safeImg(p.banner);
openSheet('Profile', `<div class="pv-banner">${bannerEl(p, 'pv-bn')}<span class="fr-sheen"></span></div>
<div class="pv-pfpwrap"><span class="pfp-ring lg">${av(p, nm)}</span></div>
<h3 class="pv-name">${esc(nm)}</h3><div class="pv-user">@${esc(p.username || '')}</div>
${(() => { const q = presence(uid); return `<div class="pv-user pres${q.on ? ' on' : ''}">● ${esc(q.txt)}</div>`; })()}
${p.bio ? `<p class="pv-bio">${esc(p.bio)}</p>` : ''}
<label class="sh-lab">Nickname</label>
<div class="sh-row"><input id="fpNick" type="text" maxlength="24" placeholder="Add a nickname" value="${esc(state.nick[uid] || '')}"><button id="fpSave" class="gate-btn sm">Save</button></div>
<button id="fpCode" class="sh-btn">🔐 Verify encryption</button><div id="fpBox" class="code-box hidden"></div>
<button id="fpRemove" class="sh-btn danger">Remove friend</button>`);
$('fpSave').onclick = async () => {
const v = $('fpNick').value.trim().slice(0, 24); state.nick[uid] = v;
try { await setDoc(doc(D(), 'chatPrivate', state.uid), { nicknames: { [uid]: v } }, { merge: true }); renderAll(); toast('Nickname saved', 'success'); closeSheet(); }
catch { toast('Couldn’t save', 'error'); }
}; $('fpCode').onclick = async () => {
const box = $('fpBox'); box.classList.remove('hidden');
box.innerHTML = `${await safetyNumber(state.profile.pubKey, p.pubKey || '')}<small>If this number matches on both phones, nobody is intercepting your chat.</small>`; };
$('fpRemove').onclick = async () => {
const f = state.friends.find((x) => x.uid === uid);
if (f && confirm(`Remove ${nm}?`)) { try { await deleteDoc(doc(D(), 'chatRequests', f.req.id)); closeSheet(); toast('Removed', 'success'); } catch { toast('Couldn’t remove', 'error'); } }
};
}
function openMeSheet() {
if (!state.profile) return;
const me = state.uid;
openSheet('My profile', `<div class="pv-banner" id="mpBanner"></div>
<div class="pv-pfpwrap"><span class="pfp-ring lg" id="mpPfp"></span></div>
<button id="mpPfpBtn" class="sh-btn">📷 Change profile photo</button>
<input id="mpPfpF" type="file" accept="image/*" hidden>
<label class="sh-lab">Select banner</label>
<div class="bn-box"><div class="bn-grid" id="mpGrid"></div></div>
<label class="sh-lab">Bio</label><textarea id="mpBio" maxlength="120" placeholder="Say something about you">${esc(state.profile.bio || '')}</textarea>
<label class="sh-lab">Username</label><div class="sh-note" style="margin:0">@${esc(state.profile.username)} · <a id="mpForgot" style="color:var(--accent-dark);font-weight:700">Forgot it / create a new one</a></div>
<button id="mpSave" class="sh-btn primary">Save profile</button>`);
const draw = () => {
const q = state.profile;
$('mpBanner').innerHTML = bannerEl(q, 'pv-bn') + '<span class="fr-sheen"></span>';
$('mpPfp').innerHTML = av(q, q.username);
$('mpGrid').innerHTML = BANNERS.map(([id, n]) => `<button class="bn-pick${q.bannerId === id ? ' sel' : ''}" data-bn="${id}"><span class="bn bnx bn-${id}">${BNFX[id]}</span><i>${n}</i></button>`).join('');
};
draw();
const apply = (patch) => { state.profile = { ...state.profile, ...patch }; state.profiles.set(me, state.profile); draw(); renderAll(); };
$('mpGrid').onclick = async (e) => { const b = e.target.closest('[data-bn]'); if (!b) return;
apply({ bannerId: b.dataset.bn, banner: '' });
try { await updateDoc(doc(D(), 'chatUsers', me), { bannerId: b.dataset.bn, banner: '' }); toast('Banner applied ✨', 'success'); }
catch { toast('Couldn’t save banner', 'error'); }
};
$('mpPfpBtn').onclick = () => $('mpPfpF').click();
$('mpPfpF').onchange = async (e) => {
const f = e.target.files[0]; e.target.value = ''; if (!f) return;
let data; try { data = await cropImg(f, 256, 256, .82); } catch { return toast('Couldn’t read that image', 'error'); } apply({ pfp: data });
try { await updateDoc(doc(D(), 'chatUsers', me), { pfp: data }); toast('Profile photo updated ✨', 'success'); }
catch { toast('Couldn’t save photo', 'error'); }
};
$('mpForgot').onclick = openUsernameSheet;
$('mpSave').onclick = async () => {
try { await updateDoc(doc(D(), 'chatUsers', me), { bio: $('mpBio').value.trim().slice(0, 120) }); toast('Profile saved ✨', 'success'); closeSheet(); }
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
const ref = doc(D(), 'usernames', lower); if ((await tx.get(ref)).exists()) throw new Error('taken');
tx.set(ref, { uid: me }); if (old) tx.delete(doc(D(), 'usernames', old));
tx.update(doc(D(), 'chatUsers', me), { username: name, usernameLower: lower });
});
toast('Username updated', 'success'); closeSheet();
} catch (e) { toast(e.message === 'taken' ? 'That username is taken' : 'Couldn’t update username', 'error'); }
};
}
/* =========================================================
Delete messages / delete all chats (wipes Firestore docs too)
========================================================= */
function updateSelUI() {
const n = state.sel.size;
$('selCount').textContent = n ? `${n} selected` : 'Select messages';
$('selDel').disabled = !n;
const all = state.msgDocs.length > 0 && n >= state.msgDocs.length;
$('selAll').textContent = all ? 'Clear' : 'Select all';
}
function enterSelect() {
if (!state.active) return toast('Open a chat first', 'info');
state.selecting = true; state.sel.clear();
pane.classList.add('selecting'); $('cpMsgs').classList.add('selecting');
stopTyping(); updateSelUI();
}
function exitSelect() {
if (!state.selecting && !state.sel.size) return;
state.selecting = false; state.sel.clear();
pane.classList.remove('selecting'); $('cpMsgs').classList.remove('selecting');
$('cpMsgs').querySelectorAll('.msg.picked').forEach((el) => el.classList.remove('picked'));
updateSelUI();
}
function toggleSel(id) {
if (!id) return;
if (state.sel.has(id)) state.sel.delete(id); else state.sel.add(id);
const el = $('cpMsgs').querySelector(`.msg[data-mid="${id}"]`);
if (el) el.classList.toggle('picked', state.sel.has(id));
updateSelUI();
}
function toggleSelAll() {
const all = state.msgDocs.length > 0 && state.sel.size >= state.msgDocs.length;
state.sel.clear();
if (!all) state.msgDocs.forEach((m) => state.sel.add(m.id));
$('cpMsgs').querySelectorAll('.msg').forEach((el) => el.classList.toggle('picked', state.sel.has(el.dataset.mid)));
updateSelUI();
}
/* run deletes a few at a time (each delete is checked by the security rules) */
async function delRefs(refs) {
for (let i = 0; i < refs.length; i += 20) await Promise.all(refs.slice(i, i + 20).map((r) => deleteDoc(r)));
}
function forgetLocal(ids) {
ids.forEach((id) => { const u = media.get(id); if (u) { URL.revokeObjectURL(u); media.delete(id); } plain.delete(id); });
state.sig = '';
}
async function deleteSelected() {
const uid = state.active, ids = [...state.sel];
if (!uid || !ids.length) return;
if (!confirm(`Delete ${ids.length} message${ids.length > 1 ? 's' : ''} for both of you? This can’t be undone.`)) return;
const cid = chatId(state.uid, uid), btn = $('selDel'); btn.disabled = true;
try {
const refs = [];
ids.forEach((id) => {
const m = state.msgDocs.find((x) => x.id === id), p = plain.get(id), mid = m?.mid || p?.mid, n = m?.n || p?.n || 0;
for (let i = 0; mid && i < n; i++) refs.push(doc(D(), 'chats', cid, 'blobs', `${mid}_${i}`)); // big media chunks first
});
await delRefs(refs);
await delRefs(ids.map((id) => doc(D(), 'chats', cid, 'messages', id))); // then the messages themselves
forgetLocal(ids); exitSelect(); toast('Deleted for both of you 🗑️', 'success');
} catch (e) {
console.error(e); btn.disabled = !state.sel.size;
toast('Couldn’t delete — publish the updated Firestore rules', 'error');
}
}
/* wipe EVERYTHING in one conversation: messages (incl. inline photos/voice) + media chunks */
async function wipeChat(uid) {
const cid = chatId(state.uid, uid);
for (const [sub, size] of [['messages', 40], ['blobs', 8]]) {
for (;;) {
const s = await getDocs(query(collection(D(), 'chats', cid, sub), limit(size)));
if (s.empty) break;
await delRefs(s.docs.map((d) => d.ref));
}
}
try { await updateDoc(doc(D(), 'chats', cid), { lastAt: deleteField(), lastFrom: deleteField() }); } catch {}
}
function openDeleteAllSheet() {
const cur = state.active;
openSheet('Delete all chats', `<p class="sh-note">Every message, photo, video and voice message is permanently erased from the database — for <b>both</b> of you. This can’t be undone.</p>
${cur ? `<button id="daThis" class="sh-btn danger">Delete this chat · ${esc(displayName(cur))}</button>` : ''}
<button id="daAll" class="sh-btn danger">Delete chats with everyone (${state.friends.length})</button>
<button id="daNo" class="sh-btn">Cancel</button>`);
const run = async (list, label) => {
if (!list.length) return toast('No chats to delete', 'info');
if (!confirm(`${label}? This can’t be undone.`)) return;
exitSelect(); closeSheet(); toast('Deleting…', 'info');
try {
for (const u of list) await wipeChat(u);
media.forEach((u) => URL.revokeObjectURL(u)); media.clear(); plain.clear(); state.sig = ''; paint();
toast('Chats deleted for both of you 🗑️', 'success');
} catch (e) { console.error(e); toast('Couldn’t delete everything — publish the updated Firestore rules', 'error'); }
};
$('daNo').onclick = closeSheet;
if (cur) $('daThis').onclick = () => run([cur], `Delete the whole chat with ${displayName(cur)}`);
$('daAll').onclick = () => run(state.friends.map((f) => f.uid), 'Delete ALL your chats with every friend');
}
/* 3-dots menu + selection bar wiring */
$('cpMore').onclick = (e) => { e.stopPropagation(); $('cpMenu').classList.toggle('open'); };
document.addEventListener('click', (e) => { if (!e.target.closest('#cpMenu') && !e.target.closest('#cpMore')) $('cpMenu').classList.remove('open'); });
$('cpmSelect').onclick = () => { $('cpMenu').classList.remove('open'); if (!state.active) return toast('Open a chat first', 'info'); if (!state.msgDocs.length) return toast('No messages to delete', 'info'); enterSelect(); };
$('cpmAll').onclick = () => { $('cpMenu').classList.remove('open'); if (!state.friends.length) return toast('No chats yet', 'info'); openDeleteAllSheet(); };
$('cpmClose').onclick = () => { $('cpMenu').classList.remove('open'); closeChat(); };
$('selCancel').onclick = () => exitSelect();
$('selAll').onclick = toggleSelAll;
$('selDel').onclick = deleteSelected;
window.OSChat = { open: (uid) => openChat().then(() => uid && openConversation(uid)) };
/* =========================================================
v5 — typing cloud + Seen / Not seen (paste at the VERY END of chat.js)
========================================================= */
(function () {
const msgsBox = $('cpMsgs');
const tsMs = (t) => (t && t.seconds != null) ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0;
/* typing clouds: friend = bottom-left (near photos) · me = bottom-right (near mic) */
comp.insertAdjacentHTML('beforeend',
'<div id="tcL" class="tcloud l" aria-hidden="true"><i></i><i></i><i></i></div>' +
'<div id="tcR" class="tcloud r" aria-hidden="true"><i></i><i></i><i></i></div>');
const tcL = $('tcL'), tcR = $('tcR');
let lastKey = 0, marked = '';
input.addEventListener('input', () => { lastKey = input.value.trim() ? Date.now() : 0; });
input.addEventListener('blur', () => { lastKey = 0; });
const inView = (el) => {
const r = el.getBoundingClientRect(), b = msgsBox.getBoundingClientRect();
return r.bottom > b.top + 4 && r.top < b.bottom - 4;
};
function refresh() {
const open = app.classList.contains('active') && state.active && !msgsBox.classList.contains('hidden');
if (!open) { tcL.classList.remove('show'); tcR.classList.remove('show'); return; }
tcL.classList.toggle('show', (state.typeUntil.get(state.active) || 0) > Date.now());
const mine = lastKey && Date.now() - lastKey < 2600 && input.value.trim() && document.activeElement === input;
tcR.classList.toggle('show', !!mine);
const cid = chatId(state.uid, state.active), chat = state.chats.get(cid) || {};
const myRead = tsMs(chat.reads && chat.reads[state.uid]);
/* tell my friend I've seen their latest message — only when it is really on screen */
if (document.hidden) return;
let last = null;
for (let i = (state.msgDocs || []).length - 1; i >= 0; i--) {
if (state.msgDocs[i].from === state.active) { last = state.msgDocs[i]; break; }
}
if (!last) return;
const el = msgsBox.querySelector('[data-mid="' + last.id + '"]');
if (!el || !inView(el)) return;
const key = cid + ':' + last.id;
if (key === marked || tsMs(last.at) <= myRead) { marked = key; return; }
marked = key;
setDoc(doc(D(), 'chats', cid), { reads: { [state.uid]: serverTimestamp() } }, { merge: true })
.catch(() => { marked = ''; });
}
new MutationObserver(refresh).observe(msgsBox, { childList: true });
let rfRaf = 0; msgsBox.addEventListener('scroll', () => { if (!rfRaf) rfRaf = requestAnimationFrame(() => { rfRaf = 0; refresh(); }); }, { passive: true });
document.addEventListener('visibilitychange', refresh);
setInterval(refresh, 700);
})();
/* =========================================================
BENTO NOIR home tiles + bottom dock (v6)
Chat opens from the "Chat" tile. A red shining dot on that tile shows when something unread is waiting.
========================================================= */
(function () {
const root = document.querySelector('.app-container'), header = document.querySelector('.app-header');
if (!root || !header || document.getElementById('bento')) return;
const hb = document.querySelector('.glowing-badge'), sub = header.querySelector('.subtitle');
const tile = (id, lab, inner, cls = '') => `<button type="button" id="${id}" class="bn-tile ${cls}"><span class="bn-lab">${lab}</span>${inner}</button>`;
const el = document.createElement('section');
el.id = 'bento'; el.className = 'bento';
el.innerHTML =
'<div class="bn-head"><div><div class="bn-hi" id="bnHi">Welcome</div><div class="bn-title" id="bnTitle" role="button" tabindex="0" aria-label="Open Our Space">Our Space</div></div></div>' +
'<div class="bn-slot empty" id="bnSlot"></div>' +
'<div class="bn-tile bn-hero"><div class="bn-heroTop"></div><div class="bn-days" id="bnDaysBox"><span class="bn-num" id="bnDays">–</span><span class="bn-sm">days together</span></div><div class="bn-bar"><i id="bnBar"></i></div></div>' +
tile('bnMem', 'Memories', '<span class="bn-big" id="bnMemN">0</span><span class="bn-sm">moments shared</span>', 'bn-mem') +
tile('bnChat', 'Chat', '<span class="bn-mid" id="bnChatT">Welcome to chat</span><i id="bnChatDot" class="bn-dot hidden"></i>') + // CHAT-VISIBLE
tile('bnTodo', 'To-do', '<span class="bn-big" id="bnTodoN" style="font-size:1.7rem;margin-top:6px">0</span><span class="bn-sm">left today</span>') +
tile('bnStory', 'Story Book', '<span class="bn-mid" id="bnStoryT" style="font-family:var(--display);font-style:italic;font-size:1rem">Our chapters</span><span class="bn-sm" id="bnStoryS"></span>') +
tile('bnAnn', 'Next milestone', '<span class="bn-big" id="bnAnnN" style="font-size:1.7rem;margin-top:6px">–</span><span class="bn-sm" id="bnAnnS">days to go</span>');
header.after(el); header.style.display = 'none';
const rmCard = document.getElementById('mainPageReminder');
if (rmCard) { const slot = el.querySelector('#bnSlot'); slot.appendChild(rmCard); slot.classList.toggle('empty', rmCard.classList.contains('hidden')); } // pending reminders live between "Our Space" and "Our Sacred Diary"
const top = el.querySelector('.bn-heroTop');
if (hb) top.appendChild(hb);
if (sub) top.appendChild(sub);
const dock = document.createElement('nav');
dock.className = 'dock'; dock.setAttribute('aria-label', 'Main');
const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
dock.innerHTML = `<button type="button" id="dkHome" class="on" aria-label="Home">${svg('M3 11l9-8 9 8M5 10v10h14V10')}<span class="dk-lab">Home</span></button><button type="button" id="dkFr" aria-label="Friend list"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3.3"/><path d="M2.8 20c.5-3.4 3.1-5.2 6.2-5.2s5.7 1.8 6.2 5.2"/><circle cx="17.2" cy="9.5" r="2.5"/><path d="M17 14.7c2.6.1 4.4 1.7 4.8 5"/></svg><span class="dk-lab">Friends</span></button><button type="button" id="dkPost" aria-label="Post a memory">${svg('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z')}<span class="dk-lab">Post</span></button>`;
document.body.appendChild(dock);
$('bnMem').onclick = () => O().openMemories?.();
$('bnTitle').onclick = () => O().openSpace?.();
$('bnTitle').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); O().openSpace?.(); } };
$('bnTodo').onclick = () => O().openTodo?.();
$('bnStory').onclick = () => O().openStory?.();
$('bnChat').onclick = () => openChat();
$('dkHome').onclick = () => { closeFriends(); closePost(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
$('dkFr').onclick = () => openFriends();
$('bnDaysBox').onclick = () => document.getElementById('annivCard')?.click(); // set the anniversary only from "days together"
const set = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
function tick() {
const nm = ($('currentUserLabel')?.textContent || '').trim(), h = new Date().getHours();
set('bnHi', (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + (nm && nm !== 'Loading...' ? ', ' + nm : ''));
const d = parseInt(document.querySelector('#annivCard .anniv-num')?.textContent, 10);
if (Number.isFinite(d)) {
set('bnDays', d); $('bnBar').style.width = ((d % 365) / 365 * 100) + '%';
const next = 365 * (Math.floor(d / 365) + 1) - d, yr = Math.floor(d / 365) + 1;
set('bnAnnN', next); set('bnAnnS', 'days to year ' + yr);
} else { set('bnDays', '–'); set('bnAnnN', '–'); set('bnAnnS', 'set it from days together'); }
const mems = window.OS?.memories?.() || [];
set('bnMemN', mems.length);
set('bnTodoN', (window.OS?.todos?.() || []).filter((t) => !t.data.completed).length);
const chs = document.querySelectorAll('#storiesFeed .story-accordion-card');
set('bnStoryT', chs.length ? 'Chapter ' + chs.length : 'Our chapters');
set('bnStoryS', chs[0]?.querySelector('.story-accordion-title')?.textContent || '');
const un = state.friends.filter((f) => unreadFor(f.uid)).length, rq = state.incoming.length;
const ct = $('bnChatT'), ctxt = un ? 'New message' : rq ? rq + ' new request' + (rq > 1 ? 's' : '') : 'Welcome to chat';
if (ct && ct.textContent !== ctxt) { ct.textContent = ctxt; ct.classList.remove('swap'); void ct.offsetWidth; ct.classList.add('swap'); }
ct?.classList.toggle('bn-new', !!un); $('bnChat')?.classList.toggle('has-new', !!un);
const dot = !!(un || rq);
$('bnChatDot').classList.toggle('hidden', !dot);
}
tick(); setInterval(tick, 1000);
})();
/* =========================================================
FRIEND LIST (beside the home button) — only accepted friends
========================================================= */
var frPage = null;
document.body.insertAdjacentHTML('beforeend', `<div id="frPage" class="fp" aria-hidden="true"><div class="fp-bg"></div>
<header class="fp-top"><button id="frClose" class="fp-x" type="button" aria-label="Close">${IC.close(20)}</button><div class="fp-title">Friends</div><span id="frCount" class="fp-count">0</span></header>
<div id="frList" class="fp-list"></div></div>`);
frPage = $('frPage');
function renderFriendsPage() {
if (!frPage || !frPage.classList.contains('active')) return;
const list = $('frList'), fr = [...state.friends].sort((a, b) => displayName(a.uid).localeCompare(displayName(b.uid)));
$('frCount').textContent = fr.length;
const items = [];
if (state.incoming.length) {
items.push({ k: 'l:rq', html: cnt('Friend requests · ' + state.incoming.length) });
state.incoming.forEach((r) => {
const pr = state.profiles.get(r.from) || {};
items.push({ k: 'rq:' + r.id, html: `<div class="rq-row"><span class="pfp-sm">${av(pr, pr.username)}</span><span class="rq-name"><b>@${esc(pr.username || '…')}</b><i>wants to be friends</i></span>
<button class="rq-ok" data-acc="${r.id}" aria-label="Accept">✓</button><button class="rq-no" data-dec="${r.id}" aria-label="Decline">×</button></div>` });
});
}
if (state.outgoing.length) {
items.push({ k: 'l:out', html: cnt('Sent requests') });
state.outgoing.forEach((r) => {
const pr = state.profiles.get(r.to) || {};
items.push({ k: 'ro:' + r.id, html: `<div class="rq-out"><span>Waiting for @${esc(pr.username || '…')}</span><button data-cancel="${r.id}">Cancel</button></div>` });
});
}
items.push({ k: 'l:fr', html: cnt('Friends · ' + fr.length) });
if (fr.length) fr.forEach(({ uid }) => items.push({ k: 'fr:' + uid, html: friendRow(uid) }));
else items.push({ k: 'empty', html: '<div class="fp-empty"><span>💫</span><b>No friends yet</b><i>Add a friend from Chat. When they accept, they show up here.</i></div>' });
setList(list, items, true);
}
function dockSet(id) { ['dkHome', 'dkFr', 'dkPost'].forEach((b) => $(b)?.classList.toggle('on', b === id)); document.body.classList.toggle('dock-up', id !== 'dkHome'); }
function openFriends() {
closePost();
frPage.classList.add('active'); dockSet('dkFr'); frPage.setAttribute('aria-hidden', 'false');
document.documentElement.style.overflow = 'hidden';
renderFriendsPage();
}
function closeFriends() {
if (frPage.classList.contains('active')) dockSet('dkHome');
frPage.classList.remove('active'); frPage.setAttribute('aria-hidden', 'true');
if (!app.classList.contains('active')) document.documentElement.style.overflow = '';
}
$('frClose').onclick = closeFriends;
$('frList').onclick = async (e) => {
const t = e.target.closest('[data-open],[data-acc],[data-dec],[data-cancel]'); if (!t) return;
if (t.dataset.open) { const uid = t.dataset.open; closeFriends(); await openChat(); openConversation(uid); return; }
try {
if (t.dataset.acc) await updateDoc(doc(D(), 'chatRequests', t.dataset.acc), { status: 'accepted', seenFrom: false, seenTo: false });
else await deleteDoc(doc(D(), 'chatRequests', t.dataset.dec || t.dataset.cancel));
} catch { toast('Something went wrong', 'error'); }
};
window.OSBack?.add(frPage, closeFriends);
/* ---------- Post a memory page (dock symbol beside Friends) ---------- */
const postPage = $('postPage');
function openPost() {
closeFriends();
postPage.classList.add('active'); dockSet('dkPost'); postPage.setAttribute('aria-hidden', 'false');
document.documentElement.style.overflow = 'hidden';
}
function closePost() {
if (postPage.classList.contains('active')) dockSet('dkHome');
postPage.classList.remove('active'); postPage.setAttribute('aria-hidden', 'true');
if (!app.classList.contains('active') && !frPage.classList.contains('active')) document.documentElement.style.overflow = '';
}
$('dkPost').onclick = openPost;
$('ppClose').onclick = closePost;
window.OSBack?.add(postPage, closePost);
// when a memory is shared, the pop-up animation plays and we return Home, where "moments shared" goes up
const rv = $('memoryRevealOverlay');
if (rv) new MutationObserver(() => { if (rv.classList.contains('posting') && postPage.classList.contains('active')) closePost(); }).observe(rv, { attributes: true, attributeFilter: ['class'] });
setInterval(renderFriendsPage, 15000); // keeps "online / last seen" fresh while it is open

/* =========================================================
VOICE CALLS — WebRTC audio, the two phones find each other through Firestore ("calls" collection)
========================================================= */
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
const PH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
document.body.insertAdjacentHTML('beforeend', '<div id="callUI" aria-hidden="true"><div class="call-lbl" id="callLbl">Voice call</div><div class="call-mid"><div class="call-av" id="callAv"></div><h2 id="callName"></h2><p class="call-state" id="callState"></p></div><div class="call-acts" id="callActs"></div><audio id="callAudio" autoplay playsinline></audio></div>');
const call = { id: null, pc: null, stream: null, role: null, uid: null, unsubs: [], t0: 0, tick: 0, ringTo: 0, ring: null, muted: false, accepting: false, queue: [], incoming: null };
const callDoc = (id) => doc(D(), 'calls', id);
function ringStop() { if (call.ring) { clearInterval(call.ring.iv); try { call.ring.ctx.close(); } catch {} call.ring = null; } }
function ringStart(incoming) {
ringStop();
try {
const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
const beep = () => {
const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
o.type = 'sine'; o.frequency.value = incoming ? 880 : 440;
g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.linearRampToValueAtTime(0, t + .6);
o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .65);
if (incoming) navigator.vibrate?.([300, 150, 300]);
};
beep(); call.ring = { ctx, iv: setInterval(beep, 2200) };
} catch {}
}
function callActs(mode) {
const b = (cls, id, label, svg) => `<button type="button" class="call-btn ${cls}" id="${id}" aria-label="${label}">${svg}</button>`;
$('callActs').innerHTML = mode === 'in' ? b('end', 'callNo', 'Decline', PH) + b('ok', 'callYes', 'Accept', PH)
: mode === 'live' ? b('mute' + (call.muted ? ' on' : ''), 'callMute', 'Mute', MIC) + b('end', 'callEnd', 'End call', PH) : b('end', 'callEnd', 'End call', PH);
if ($('callNo')) $('callNo').onclick = declineCall;
if ($('callYes')) $('callYes').onclick = acceptCall;
if ($('callEnd')) $('callEnd').onclick = () => hangup('ended');
if ($('callMute')) $('callMute').onclick = () => { call.muted = !call.muted; call.stream?.getAudioTracks().forEach((t) => { t.enabled = !call.muted; }); $('callMute').classList.toggle('on', call.muted); };
}
async function showCall(uid, mode, text) {
const ui = $('callUI'); call.uid = uid;
ui.classList.add('active'); ui.classList.toggle('ringing', mode !== 'live'); ui.setAttribute('aria-hidden', 'false');
$('callLbl').textContent = mode === 'in' ? 'Incoming voice call' : 'Voice call';
$('callState').textContent = text || '';
callActs(mode);
const p = await getProfile(uid); if (call.uid !== uid) return;
$('callAv').innerHTML = av(p, displayName(uid)); $('callName').textContent = displayName(uid);
}
function makePc() {
const pc = new RTCPeerConnection(ICE); call.pc = pc; call.queue = [];
pc.ontrack = (e) => { const a = $('callAudio'); a.srcObject = e.streams[0]; a.play?.().catch(() => {}); };
pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') hangup('ended', 'Connection lost'); };
return pc;
}
const addCand = (c) => { const pc = call.pc; if (!pc) return; if (pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); else call.queue.push(c); };
const flushCands = () => { const q = call.queue; call.queue = []; q.forEach(addCand); };
function goLive() {
if (call.t0) return;
ringStop(); clearTimeout(call.ringTo); call.t0 = Date.now();
$('callUI').classList.remove('ringing'); callActs('live');
const upd = () => { const s = Math.floor((Date.now() - call.t0) / 1000); $('callState').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
upd(); call.tick = setInterval(upd, 1000);
}
function endLocal(msg) {
if (!call.id && !call.stream && !call.pc && !call.incoming) return;
ringStop(); clearTimeout(call.ringTo); clearInterval(call.tick);
call.unsubs.forEach((u) => { try { u(); } catch {} });
call.stream?.getTracks().forEach((t) => t.stop());
try { call.pc?.close(); } catch {}
const ui = $('callUI'); $('callAudio').srcObject = null;
if (msg) { $('callState').textContent = msg; ui.classList.remove('ringing'); $('callActs').innerHTML = ''; }
Object.assign(call, { id: null, pc: null, stream: null, role: null, unsubs: [], t0: 0, tick: 0, ringTo: 0, muted: false, accepting: false, queue: [], incoming: null });
setTimeout(() => { if (!call.id && !call.incoming) { ui.classList.remove('active'); ui.setAttribute('aria-hidden', 'true'); } }, msg ? 1300 : 0);
}
async function hangup(status, msg) {
const id = call.id; endLocal(msg || (status === 'ended' ? 'Call ended' : ''));
if (id) { try { await updateDoc(callDoc(id), { status }); } catch {} }
}
async function startCall(uid) {
if (call.id || call.incoming) return toast('You’re already in a call', 'info');
if (!state.friends.some((f) => f.uid === uid)) return toast('You can only call friends', 'info');
if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) return toast('Calling isn’t supported on this browser', 'error');
try { call.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
catch { return toast('Please allow the microphone to make a call', 'error'); }
call.role = 'caller'; showCall(uid, 'out', 'Calling…'); ringStart(false);
const pc = makePc(); call.stream.getTracks().forEach((t) => pc.addTrack(t, call.stream));
const ref = doc(collection(D(), 'calls')); call.id = ref.id;
let ready = false; const buf = [];
pc.onicecandidate = (e) => { if (!e.candidate) return; const c = e.candidate.toJSON(); if (ready) addDoc(collection(ref, 'callerCandidates'), c).catch(() => {}); else buf.push(c); };
try {
const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
await setDoc(ref, { from: state.uid, to: uid, status: 'ringing', offer: { type: offer.type, sdp: offer.sdp }, createdAt: serverTimestamp() });
} catch { endLocal('Couldn’t start the call'); toast('Couldn’t start the call', 'error'); return; }
ready = true; buf.forEach((c) => addDoc(collection(ref, 'callerCandidates'), c).catch(() => {}));
call.unsubs.push(onSnapshot(ref, async (sn) => {
const d = sn.data(); if (!d || call.id !== ref.id) return;
if (d.answer && !pc.currentRemoteDescription) { try { await pc.setRemoteDescription(d.answer); flushCands(); } catch {} }
if (d.status === 'active') { $('callState').textContent = 'Connecting…'; }
if (d.status === 'declined') endLocal('Call declined');
else if (d.status === 'ended' || d.status === 'missed') endLocal(call.t0 ? 'Ca
