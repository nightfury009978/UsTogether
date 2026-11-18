import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const $ = (id) => document.getElementById(id);
const O = () => window.OS;
const LS = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} }
};
const say = (m, ty) => O()?.toast(m, ty);
/* premium line icons used by the menu (shared with premium.js) */
const SV = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
window.OSIcons = {
  install: SV('<path d="M12 3.5v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>'),
  bell: SV('<path d="M6.2 9a5.8 5.8 0 0 1 11.6 0c0 6.2 2.7 7.6 2.7 7.6h-17s2.7-1.400 2.7-7.600M10.2 20a2 2 0 0 0 3.600 0"/>'),
  heart: SV('<path d="M12 20S3.500 14.800 3.500 9A4.600 4.600 0 0 1 12 6.600 4.600 4.600 0 0 1 20.500 9C20.500 14.800 12 20 12 20z"/>'),
  backup: SV('<path d="M4 7.500h16V11H4zM5.500 11v8.500h13V11M10 15h4"/>'),
  phone: SV('<rect x="7" y="2.800" width="10" height="18.400" rx="2.400"/><path d="M11 18h2"/>'),
};
const ICONS = window.OSIcons;
function addMenu(iconKey, label, fn) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="di-icon">${ICONS[iconKey] || ''}</span><span class="di-label">${label}</span><span class="chevron">&rsaquo;</span>`;
  li.onclick = () => { $('closeDrawerBtn').click(); fn(); };
  $('settingsList').appendChild(li);
}
/* ---------- Always dark (no light mode) ---------- */
document.documentElement.dataset.theme = 'dark';
document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#0d0b0a');
LS.del('theme');
/* ---------- Install prompt ---------- */
let installEvt;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); installEvt = e;
  addMenu('install', 'Install app', () => { installEvt?.prompt(); installEvt = null; });
});
/* ---------- PIN + biometric lock ---------- */
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('os:' + s)))]
  .map((b) => b.toString(16).padStart(2, '0')).join('');
const lock = document.createElement('div');
lock.id = 'lockScreen'; lock.className = 'auth-overlay';
lock.innerHTML = `<div class="auth-card"><h2>Locked 🔒</h2><p class="auth-sub">Enter your PIN</p>
<div class="auth-inputs"><input id="lockPin" type="password" inputmode="numeric" maxlength="8" placeholder="PIN"></div>
<button id="lockBtn" class="auth-btn">Unlock</button>
<button id="bioBtn" class="cancel-btn" style="margin-top:10px;display:none">Use fingerprint / face</button></div>`;
document.body.appendChild(lock);
const showLock = () => {
  if (!LS.get('pinHash')) return;
  lock.classList.add('active');
  $('bioBtn').style.display = LS.get('bioId') ? 'block' : 'none';
};
const unlocked = () => { lock.classList.remove('active'); $('lockPin').value = ''; };
async function tryUnlock() {
  if (await sha($('lockPin').value) === LS.get('pinHash')) unlocked();
  else { say('Wrong PIN', 'error'); $('lockPin').value = ''; }
}
$('lockBtn').onclick = tryUnlock;
$('lockPin').onkeydown = (e) => e.key === 'Enter' && tryUnlock();
$('bioBtn').onclick = async () => {
  try {
    const id = Uint8Array.from(atob(LS.get('bioId')), (c) => c.charCodeAt(0));
    await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id }], userVerification: 'required' } });
    unlocked();
  } catch { say('Biometric failed — use PIN', 'error'); }
};
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 60000) showLock();
});
showLock();
async function enableBio() {
  try {
    const c = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'Our Space' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'us', displayName: 'us' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' } } });
    LS.set('bioId', btoa(String.fromCharCode(...new Uint8Array(c.rawId))));
    say('Biometric unlock on', 'success');
  } catch { say('Biometrics not available on this device', 'error'); }
}
addMenu('bell', 'App PIN lock', async () => {
  if (LS.get('pinHash')) {
    if (confirm('Remove PIN lock?')) { LS.del('pinHash'); LS.del('bioId'); say('PIN removed', 'success'); }
    return;
  }
  const p = prompt('Choose a 4–8 digit PIN');
  if (!p) return;
  if (!/^\d{4,8}$/.test(p)) return say('PIN must be 4–8 digits', 'error');
  LS.set('pinHash', await sha(p)); say('PIN lock on 🔒', 'success');
  if (window.PublicKeyCredential && confirm('Also enable fingerprint / face unlock?')) enableBio();
});
/* ---------- Reminders ---------- */
async function checkReminders() {
  if (LS.get('notif') !== '1' || !('Notification' in window) || Notification.permission !== 'granted') return;
  const today = O().today();
  if (LS.get('notifDay') === today) return;
  const due = O().todos().filter(({ data }) => !data.completed && data.dueDate && data.dueDate <= today);
  if (!due.length) return;
  LS.set('notifDay', today);
  const opts = { body: due.slice(0, 3).map(({ data }) => '• ' + data.task).join('\n'), icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'todo-due' };
  const reg = await navigator.serviceWorker?.ready;
  reg ? reg.showNotification('Tasks due 📌', opts) : new Notification('Tasks due 📌', opts);
}
addMenu('bell', 'Task reminders', async () => {
  if (!('Notification' in window)) return say('Notifications not supported here', 'error');
  if (await Notification.requestPermission() === 'granted') { LS.set('notif', '1'); say('Reminders on 🔔', 'success'); checkReminders(); }
  else say('Notification permission denied', 'error');
});
/* ---------- Anniversary ---------- */
let annivDate = null;
async function pickAnniv() {
  const v = prompt('Date we got together (YYYY-MM-DD)', annivDate || '');
  if (!v) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v))) return say('Use format YYYY-MM-DD', 'error');
  try { await setDoc(doc(O().db, 'settings', 'couple'), { startDate: v }, { merge: true }); say('Saved 💞', 'success'); }
  catch { say("Couldn't save date", 'error'); }
}
addMenu('heart', 'Set our anniversary', pickAnniv);
function initAnniv() {
  const c = document.createElement('div');
  c.id = 'annivCard'; c.className = 'anniv-card'; c.onclick = pickAnniv;
  document.querySelector('.app-header').after(c);
  const draw = () => {
    if (!annivDate) { c.textContent = '💞 Tap to set the day we got together'; return; }
    const d = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(annivDate + 'T00:00:00')) / 864e5);
    c.innerHTML = `<span class="anniv-num">${Math.max(d, 0)}</span><span>days together 💞</span>`;
  };
  onSnapshot(doc(O().db, 'settings', 'couple'), (s) => { annivDate = s.data()?.startDate || null; draw(); }, () => draw());
}
/* ---------- On this day ---------- */
function initOnThisDay() {
  const c = document.createElement('div');
  c.id = 'otdCard'; c.className = 'otd-card hidden';
  ($('bento') || $('mainPageReminder')).after(c);
  const draw = () => {
    const n = new Date(), key = n.getDate() + '/' + n.getMonth();
    const hits = O().memories().filter(({ data }) => {
      if (!data.createdAt) return false;
      const d = new Date(data.createdAt.seconds * 1000);
      return d.getDate() + '/' + d.getMonth() === key && d.getFullYear() < n.getFullYear();
    });
    c.classList.toggle('hidden', !hits.length);
    if (!hits.length) return;
    c.innerHTML = '<b>🕰️ On this day</b>';
    hits.slice(0, 4).forEach(({ id, data }) => {
      const d = new Date(data.createdAt.seconds * 1000), b = document.createElement('button');
      b.textContent = `${data.mood || '💖'} ${d.getFullYear()}`;
      b.onclick = () => openMemories(id);
      c.appendChild(b);
    });
  };
  addEventListener('memories-updated', draw); draw();
}
/* ---------- Photo attach (resized, stored in the memory doc) ---------- */
const shrink = (file, max = 720) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = img.width * s; c.height = img.height * s;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.7));
  };
  img.onerror = rej; img.src = URL.createObjectURL(file);
});
function initPhoto() {
  let data = '';
  const wrap = $('moodTriggerBtn').parentElement; wrap.classList.add('compose-tools');
  const b = document.createElement('button'); b.type = 'button'; b.className = 'mood-trigger-btn'; b.textContent = '📷 Photo';
  const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.hidden = true;
  const pv = document.createElement('div'); pv.className = 'photo-preview hidden';
  wrap.append(b, f); wrap.after(pv);
  const clear = () => { data = ''; pv.classList.add('hidden'); pv.innerHTML = ''; };
  b.onclick = () => f.click();
  f.onchange = async () => {
    const file = f.files[0]; if (!file) return;
    try {
      data = await shrink(file);
      pv.innerHTML = `<img src="${data}" alt=""><button type="button">×</button>`;
      pv.classList.remove('hidden'); pv.querySelector('button').onclick = clear;
    } catch { say('Could not read photo', 'error'); }
    f.value = '';
  };
  O().photo = () => data; O().clearPhoto = clear;
}
/* =========================================================
   OUR MEMORIES: swipeable sticky notes  (opened from "Our Memories ✨")
   ========================================================= */
const TONES = [
  ['#fbefcf', '#efd69f', '#46341b', 'rgba(239,214,159,.32)'],   // champagne
  ['#fadcdf', '#eeb7bf', '#5b2c37', 'rgba(238,183,191,.32)'],   // blush
  ['#e2ecd8', '#bfd5ad', '#31462a', 'rgba(191,213,173,.28)'],   // sage
  ['#e8e0f6', '#c9bce8', '#3d3262', 'rgba(201,188,232,.30)'],   // lavender
  ['#fce3cd', '#f1c096', '#5a381c', 'rgba(241,192,150,.30)'],   // peach
  ['#dbeaf0', '#acd3df', '#254552', 'rgba(172,211,223,.28)']    // mist
];
const TILTS = [-2.2, 1.6, -1.1, 2.1, -1.7, 1.2];
const GLYPHS = ['✨', '💖', '🌸', '⭐', '💫', '🤍', '🦋'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mn = { el: $('memNotes'), stage: $('mnStage'), fx: $('mnFx'), list: [], idx: new Map(), cur: 0, els: new Map(), moved: false };
const hash = (str) => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; };
const secs = (m) => m.data.createdAt?.seconds ?? Date.now() / 1000;
const sortedMemories = () => [...(O().memories() || [])].sort((a, b) => (b.data.pinned ? 1 : 0) - (a.data.pinned ? 1 : 0) || secs(b) - secs(a));
const sigOf = ({ data: d }) => [d.text, d.mood, !!d.pinned, !!d.photo, d.editedAt?.seconds || 0].join('|');
const ACT = {
  pin: SV('<path d="M12 3.500l2.600 5.300 5.800.800-4.200 4.100 1 5.800L12 16.800 6.800 19.500l1-5.800L3.600 9.600l5.800-.8z"/>'),
  edit: SV('<path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4"/>'),
  del: SV('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.200A1.500 1.500 0 0 0 8.500 20.500h7a1.500 1.500 0 0 0 1.500-1.300L18 7M9 7V4.500h6V7"/>')
};
function buildNote(item) {
  const { id, data } = item, h = hash(id), t = TONES[h % TONES.length];
  const el = document.createElement('article');
  el.className = 'mn-note'; el.dataset.id = id; el.dataset.sig = sigOf(item); el.dataset.glow = t[3];
  el.style.cssText = `--p1:${t[0]};--p2:${t[1]};--ink:${t[2]};--tilt:${TILTS[h % TILTS.length]}deg`;
  const d = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
  el.innerHTML = '<i class="mn-tape"></i><div class="mn-stamp"><b></b><span></span></div><div class="mn-mood"></div><div class="mn-photo"></div><div class="mn-body"><p></p></div><div class="mn-by"></div><div class="mn-acts"></div>';
  el.querySelector('.mn-stamp b').textContent = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  el.querySelector('.mn-stamp span').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  el.querySelector('.mn-mood').textContent = data.mood || '💖';
  el.querySelector('.mn-body p').textContent = data.text || '';
  el.querySelector('.mn-by').textContent = data.author ? '— ' + data.author : '';
  if (typeof data.photo === 'string' && data.photo.startsWith('data:image/')) {
    const im = new Image(); im.src = data.photo; im.alt = ''; im.draggable = false; el.querySelector('.mn-photo').appendChild(im); el.classList.add('has-photo');
  }
  if (data.pinned) el.classList.add('pinned');
  const acts = el.querySelector('.mn-acts'), ref = () => doc(O().db, 'memories', id);
  const mk = (cls, label, svg, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label); b.innerHTML = svg; b.onclick = fn; acts.appendChild(b); };
  mk('pin' + (data.pinned ? ' on' : ''), data.pinned ? 'Unpin' : 'Pin', ACT.pin, () => updateDoc(ref(), { pinned: !data.pinned }).catch(() => say("Couldn't update", 'error')));
  if (data.author === O().name()) {
    mk('edit', 'Edit', ACT.edit, async () => {
      const v = prompt('Edit memory', data.text);
      if (v && v.trim()) { try { await updateDoc(ref(), { text: v.trim(), editedAt: serverTimestamp() }); say('Updated', 'success'); } catch { say("Couldn't update", 'error'); } }
    });
    mk('del', 'Delete', ACT.del, async () => {
      if (confirm('Delete this memory?')) { try { await deleteDoc(ref()); say('Deleted', 'info'); } catch { say("Couldn't delete", 'error'); } }
    });
  }
  return el;
}
function layout() {
  const n = mn.list.length;
  mn.stage.querySelector('.mn-empty')?.remove();
  if (!n) {
    mn.els.forEach((e) => e.remove()); mn.els.clear();
    mn.stage.insertAdjacentHTML('beforeend', '<div class="mn-empty"><span>📝</span><b>No memories yet</b><i>Share your first one and it will appear here as a sticky note.</i></div>');
    return;
  }
  for (let i = mn.cur - 1; i <= mn.cur + 2; i++) {
    if (i < 0 || i >= n) continue;
    const it = mn.list[i]; let el = mn.els.get(it.id);
    if (!el) { el = buildNote(it); el.dataset.d = '3'; mn.stage.appendChild(el); mn.els.set(it.id, el); void el.offsetWidth; }
    el.dataset.d = String(i - mn.cur);
  }
  mn.els.forEach((el, id) => {
    const i = mn.idx.get(id);
    if (i === undefined || i < mn.cur - 1 || i > mn.cur + 2) {
      el.dataset.d = '3';
      setTimeout(() => { if (el.dataset.d === '3') { el.remove(); mn.els.delete(id); } }, 480);
    }
  });
  const front = mn.els.get(mn.list[mn.cur].id);
  if (front) mn.el.style.setProperty('--glow', front.dataset.glow);
}
function chrome() {
  const n = mn.list.length;
  $('mnCount').textContent = n ? `${mn.cur + 1} / ${n}` : '0 / 0';
  const dots = $('mnDots'), shown = Math.min(n, 7);
  const pos = n <= 7 ? mn.cur : Math.round(mn.cur / (n - 1) * 6);
  let h = ''; for (let i = 0; i < shown; i++) h += `<i${i === pos ? ' class="on"' : ''}></i>`;
  dots.innerHTML = h;
  $('mnPrev').classList.toggle('off', mn.cur <= 0); $('mnNext').classList.toggle('off', mn.cur >= n - 1);
  $('mnHint').textContent = !n ? '' : n === 1 ? 'Our first memory 💖' : mn.cur >= n - 1 ? 'That’s all of them so far 💖' : 'Swipe for more memories';
  $('mnHint').classList.toggle('quiet', mn.moved && mn.cur > 0 && mn.cur < n - 1);
}
function sync(keepId) {
  const list = sortedMemories();
  const curId = keepId ?? mn.list[mn.cur]?.id;
  mn.list = list; mn.idx = new Map(list.map((x, i) => [x.id, i]));
  mn.cur = curId && mn.idx.has(curId) ? mn.idx.get(curId) : Math.min(mn.cur, Math.max(list.length - 1, 0));
  mn.els.forEach((el, id) => {
    const it = list[mn.idx.get(id)];
    if (!it || el.dataset.sig !== sigOf(it)) { el.remove(); mn.els.delete(id); }
  });
  layout(); chrome();
}
function burst(dir) {
  if (reduceMotion) return;
  const r = mn.stage.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .46;
  const ring = document.createElement('i'); ring.className = 'mn-ring'; ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; mn.fx.appendChild(ring);
  setTimeout(() => ring.remove(), 900);
  for (let k = 0; k < 14; k++) {
    const p = document.createElement('i'); p.className = 'mn-p';
    p.textContent = GLYPHS[k % GLYPHS.length]; p.style.left = cx + 'px'; p.style.top = cy + 'px'; p.style.fontSize = (11 + Math.random() * 12) + 'px';
    mn.fx.appendChild(p);
    const x = dir * -1 * (30 + Math.random() * 150) + (Math.random() - .5) * 120, y = (Math.random() - .6) * 260, rot = (Math.random() - .5) * 220;
    p.animate([
      { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 0 },
      { opacity: 1, offset: .2 },
      { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.1) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: 750 + Math.random() * 550, easing: 'cubic-bezier(.15,.8,.25,1)' }).onfinish = () => p.remove();
  }
}
function go(dir) {
  const n = mn.list.length, nx = mn.cur + dir;
  if (nx < 0 || nx >= n) { mn.stage.classList.remove('shake'); void mn.stage.offsetWidth; mn.stage.classList.add('shake'); navigator.vibrate?.(6); return; }
  mn.cur = nx; mn.moved = true;
  layout(); chrome(); burst(dir); navigator.vibrate?.(10);
  const front = mn.els.get(mn.list[nx].id);
  if (front) { front.classList.remove('pop'); void front.offsetWidth; front.classList.add('pop'); setTimeout(() => front.classList.remove('pop'), 900); }
}
function openMemories(id) {
  if (typeof id !== 'string') id = undefined;
  mn.stage.innerHTML = ''; mn.els.clear(); mn.list = []; mn.cur = 0; mn.moved = false;
  mn.el.classList.add('active'); mn.el.setAttribute('aria-hidden', 'false');
  sync(id);
}
function closeMemories() {
  mn.el.classList.remove('active'); mn.el.setAttribute('aria-hidden', 'true');
}
O().openMemories = openMemories;
$('memoriesNavBtn')?.addEventListener('click', () => openMemories());
$('memoriesNavBtn')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMemories(); } });
$('mnClose').addEventListener('click', closeMemories);
$('mnPrev').addEventListener('click', () => go(-1));
$('mnNext').addEventListener('click', () => go(1));
addEventListener('memories-updated', () => { if (mn.el.classList.contains('active')) sync(); });
document.addEventListener('keydown', (e) => {
  if (!mn.el.classList.contains('active')) return;
  if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'Escape') closeMemories();
});
/* swipe: drag the top note, release past the threshold (or flick) to turn it */
let drag = null;
mn.stage.addEventListener('pointerdown', (e) => {
  if (!mn.list.length || e.target.closest('button')) return;
  const el = mn.els.get(mn.list[mn.cur]?.id); if (!el) return;
  drag = { x: e.clientX, y: e.clientY, dx: 0, lock: null, t: Date.now(), el, id: e.pointerId };
});
mn.stage.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (drag.lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    drag.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    if (drag.lock === 'x') { try { mn.stage.setPointerCapture(e.pointerId); } catch {} mn.stage.classList.add('drag'); }
  }
  if (drag.lock !== 'x') return;
  const atEdge = (dx < 0 && mn.cur >= mn.list.length - 1) || (dx > 0 && mn.cur <= 0);
  const x = atEdge ? dx * .22 : dx; drag.dx = dx;
  drag.el.style.transform = `translate3d(${x}px,0,0) rotate(${x / 15}deg)`;
  drag.el.style.opacity = String(Math.max(.35, 1 - Math.abs(x) / 420));
  mn.stage.style.setProperty('--prog', Math.min(1, Math.abs(x) / 170).toFixed(3));
});
const endDrag = (e) => {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const d = drag; drag = null;
  mn.stage.classList.remove('drag');
  d.el.style.transform = ''; d.el.style.opacity = '';
  mn.stage.style.setProperty('--prog', 0);
  if (d.lock !== 'x') return;
  const fast = Math.abs(d.dx) / Math.max(1, Date.now() - d.t) > .5 && Math.abs(d.dx) > 30;
  if (Math.abs(d.dx) > 70 || fast) go(d.dx < 0 ? 1 : -1);
};
mn.stage.addEventListener('pointerup', endDrag);
mn.stage.addEventListener('pointercancel', endDrag);
/* ---------- Start once logged in ---------- */
let started = false;
onAuthStateChanged(O().auth, (u) => {
  if (!u || started) return;
  started = true;
  initAnniv(); initOnThisDay(); initPhoto();
  setTimeout(checkReminders, 4000);
  setInterval(checkReminders, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => !document.hidden && checkReminders());
  if (new URLSearchParams(location.search).get('open') === 'todo') setTimeout(() => O().openTodo?.(), 700);
});

/* =========================================================
   SPACE UNIVERSE  —  tap "Our Space" on the home screen
   Welcome animation -> explorable 3D universe (three.js is loaded only when first opened).
   Everything lives in its own shadow DOM, so it can never clash with the rest of the site.
   ========================================================= */
const SPACE_CSS = `
:host{--gold:#e3c08d;--ink:#f4e9dc;--mut:#a8978a;--glass:rgba(16,12,10,.66);--line:rgba(227,192,141,.3)}
*{box-sizing:border-box}
.sp{position:absolute;inset:0;background:#000;overflow:hidden;font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
canvas{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}
#str{pointer-events:none}
button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation}
.top{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 14px;pointer-events:none}
.top>*{pointer-events:auto}
.logo{font-family:var(--display,'Bodoni Moda',serif);font-size:1.2rem;font-weight:600;color:var(--gold)}
.row{display:flex;gap:6px}
.pill{padding:7px 10px;border-radius:20px;border:1px solid var(--line);background:var(--glass);font-size:.72rem;font-weight:500;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);white-space:nowrap}
.pill.on{background:linear-gradient(135deg,#e3c08d,#8a6a42);color:#1b120c;border-color:transparent}
.x{width:36px;height:34px;padding:0;font-size:.95rem;border-radius:50%}
@media (max-width:440px){.logo{display:none}}
.tabs{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 56px);display:flex;gap:6px;padding:0 14px}
.tabs .pill{flex:none}.tabs .pill.on{background:rgba(227,192,141,.22);border-color:var(--gold);color:var(--gold)}
.chips{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 100px);display:flex;gap:6px;padding:0 14px;overflow-x:auto;scrollbar-width:none;touch-action:pan-x}
.chips::-webkit-scrollbar{display:none}.chips .pill{flex:none}
.bot{position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);display:flex;flex-direction:column;gap:8px;pointer-events:none}
.bot>*{pointer-events:auto}
.info{align-self:flex-start;width:min(290px,72vw);padding:12px 14px;border-radius:18px;border:1px solid var(--line);background:var(--glass);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.info h2{margin:0;font-family:var(--display,'Bodoni Moda',serif);font-size:1.5rem;font-weight:600;color:var(--gold);line-height:1.1}
.info p{margin:2px 0 8px;font-size:.74rem;color:var(--mut)}
.info dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:.76rem}
.info dt{color:var(--mut)}.info dd{margin:0;text-align:right}
.time{display:flex;gap:6px;align-items:center;overflow-x:auto;scrollbar-width:none;touch-action:pan-x}
.time::-webkit-scrollbar{display:none}.time .pill{flex:none}
.ls{display:none}.ls.show{display:flex}.lbl{color:var(--gold)}
#spo{align-self:flex-end;font-variant-numeric:tabular-nums}
.fly{position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 170px);display:none;flex-direction:column;gap:10px;align-items:center}
.fly.show{display:flex}
.th{width:56px;height:56px;border-radius:50%;border:1px solid var(--line);background:var(--glass);font-size:1.3rem;color:var(--gold)}
.th:active{background:var(--gold);color:#1b120c}
.spd{writing-mode:vertical-lr;direction:rtl;height:110px;accent-color:var(--gold)}
.lb{position:fixed;left:0;top:0;display:flex;align-items:center;gap:6px;font-size:.72rem;padding:4px 8px 4px 4px;border-radius:12px;background:rgba(16,12,10,.45);border:1px solid rgba(227,192,141,.18);white-space:nowrap;will-change:transform;cursor:pointer}
.lb i{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold)}
.hint{position:fixed;left:0;right:0;top:46%;text-align:center;font-family:var(--display,'Bodoni Moda',serif);font-style:italic;font-size:1.05rem;pointer-events:none;padding:0 24px;opacity:0}
.live .hint{animation:hint 6s ease forwards}
@keyframes hint{0%,70%{opacity:1}100%{opacity:0}}
/* ---------- welcome animation ---------- */
.intro{position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;perspective:900px;visibility:hidden;opacity:0;
 background:radial-gradient(120% 90% at 50% 42%,#0c1126 0%,#05060f 55%,#000 100%)}
.intro.play{visibility:visible;animation:iIn .6s ease forwards}
.intro.out{animation:iOut .8s ease forwards}
@keyframes iIn{to{opacity:1}}@keyframes iOut{from{opacity:1}to{opacity:0;visibility:hidden}}
.glowbg{position:absolute;left:50%;top:42%;width:120vmax;height:120vmax;margin:-60vmax 0 0 -60vmax;border-radius:50%;opacity:0;will-change:opacity,transform;
 background:radial-gradient(circle,rgba(227,192,141,.16) 0%,rgba(90,110,200,.1) 22%,transparent 50%)}
.play .glowbg{animation:gIn 2.4s ease .3s forwards}
@keyframes gIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.stars{position:absolute;left:50%;top:50%;width:1px;height:1px;border-radius:50%;will-change:transform,opacity}
.play .s1{animation:drift 6s linear forwards}.play .s2{animation:drift 5s linear forwards}.play .s3{animation:drift 4s linear forwards}
@keyframes drift{from{transform:scale(.5);opacity:0}15%{opacity:1}to{transform:scale(2.1)}}
.jump .stars{animation:warp .9s cubic-bezier(.55,0,.9,.4) forwards}
@keyframes warp{from{transform:scale(1.5);opacity:1}to{transform:scale(16);opacity:0}}
.hero{position:relative;width:min(78vw,340px);height:150px;display:grid;place-items:center;z-index:3}
.orb{width:62px;height:62px;border-radius:50%;opacity:0;transform:scale(.2);will-change:transform,opacity;
 background:radial-gradient(circle at 32% 28%,#fff6e0 0%,#e3c08d 32%,#7a5530 68%,#1a0f08 100%);box-shadow:0 0 40px 6px rgba(227,192,141,.45),0 0 120px 30px rgba(227,192,141,.18)}
.play .orb{animation:orbIn 1.2s cubic-bezier(.2,1.2,.3,1) .35s forwards,pulse 3s ease-in-out 1.6s infinite}
@keyframes orbIn{to{opacity:1;transform:scale(1)}}
@keyframes pulse{50%{box-shadow:0 0 56px 10px rgba(227,192,141,.6),0 0 140px 40px rgba(227,192,141,.22)}}
.ring{position:absolute;left:0;top:50%;width:100%;aspect-ratio:1;margin-top:-50%;border-radius:50%;border:1px solid rgba(227,192,141,.28);opacity:0;will-change:transform,opacity;transform:rotateX(72deg) scale(.5)}
.ring::after{content:'';position:absolute;left:50%;top:-4px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#f6dcb8;box-shadow:0 0 14px 3px rgba(227,192,141,.9)}
.r2{width:74%;left:13%;margin-top:-37%;border-color:rgba(130,160,255,.28)}.r2::after{background:#bcd0ff;box-shadow:0 0 14px 3px rgba(130,160,255,.9)}
.play .r1{animation:rIn 1.4s ease .6s forwards,spin 9s linear .6s infinite}
.play .r2{animation:rIn 1.4s ease .9s forwards,spin 6s linear reverse .9s infinite}
@keyframes rIn{to{opacity:1;transform:rotateX(72deg) scale(1)}}
@keyframes spin{to{transform:rotateX(72deg) rotateZ(360deg) scale(1)}}
.ttl{position:relative;z-index:3;text-align:center;padding:0 18px}
.ttl small{display:block;font-size:.78rem;font-weight:500;letter-spacing:.5em;text-transform:uppercase;color:#c9b79e;opacity:0;transform:translateY(8px);padding-left:.5em}
.play .ttl small{animation:up 1.1s ease 1s forwards}
.ttl h1{margin:14px 0 0;font-family:var(--display,'Bodoni Moda',serif);font-size:clamp(2.5rem,12vw,3.7rem);font-weight:700;line-height:1.05;opacity:0;filter:blur(12px);transform:scale(1.12);will-change:transform,opacity,filter;
 background:linear-gradient(100deg,#b98558 0%,#f6dcb8 35%,#fff 50%,#e3c08d 65%,#b98558 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}
.play .ttl h1{animation:tIn 1.5s cubic-bezier(.2,.8,.2,1) 1.5s forwards,shim 3.2s linear 2s infinite}
@keyframes tIn{to{opacity:1;filter:blur(0);transform:scale(1)}}
@keyframes shim{from{background-position:130% 0}to{background-position:-130% 0}}
.rule{display:block;width:200px;height:1px;margin:20px auto 0;background:linear-gradient(90deg,transparent,#e3c08d,transparent);box-shadow:0 0 12px #e3c08d;transform:scaleX(0)}
.play .rule{animation:ruleIn 1.1s ease 2.3s forwards}
@keyframes ruleIn{to{transform:scaleX(1)}}
.ttl em{display:block;margin-top:16px;font-family:var(--display,'Bodoni Moda',serif);font-size:.95rem;color:#d9c9b4;opacity:0;transform:translateY(8px)}
.play .ttl em{animation:up 1.1s ease 2.6s forwards}
@keyframes up{to{opacity:1;transform:none}}
.jump .hero,.jump .ttl{animation:fall .9s cubic-bezier(.5,0,.9,.4) forwards}
@keyframes fall{to{opacity:0;transform:scale(1.5)}}
.flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9}
.jump .flash{animation:fl .9s ease forwards}
@keyframes fl{0%{opacity:0}28%{opacity:.85}100%{opacity:0}}
.msg{position:absolute;left:0;right:0;bottom:18%;text-align:center;font-size:.85rem;color:var(--mut);padding:0 24px}
@media (prefers-reduced-motion:reduce){.play *,.play{animation-duration:.01s!important;animation-delay:0s!important}}
:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
`;
const SPACE_MARKUP = `
<div class="sp" id="sp">
 <div class="top"><button class="pill x" id="bClose" aria-label="Close Space Universe">✕</button><div class="logo">Space Universe</div>
  <div class="row"><button class="pill on" id="bOrb">Orbits</button><button class="pill on" id="bLab">Labels</button><button class="pill" id="bFly">Fly</button><button class="pill" id="bLs">⚡ Light speed</button></div></div>
 <div class="chips" id="chips"></div>
 <div class="hint">Drag to look around · pinch to zoom · tap a name to travel · try Light speed</div>
 <div class="fly" id="fly"><button class="th" id="thF" aria-label="Fly forward">▲</button><input class="spd" id="spd" type="range" min="-2" max="2" step=".05" value="0" aria-label="Fly speed"><button class="th" id="thB" aria-label="Fly backward">▼</button></div>
 <div class="bot"><div class="info" id="info"></div><div class="time" id="time"></div></div>
 <div class="intro" id="intro">
  <div class="glowbg"></div><i class="stars s1"></i><i class="stars s2"></i><i class="stars s3"></i>
  <div class="hero"><i class="ring r1"></i><i class="ring r2"></i><div class="orb"></div></div>
  <div class="ttl"><small>Welcome to</small><h1>Space Universe</h1><span class="rule"></span><em>Planets · stars · galaxies · black holes</em></div>
  <div class="flash"></div><div class="msg" id="spMsg"></div>
 </div>
</div>`;
let spaceWorld = null, spaceOpen = false, spaceShadow = null;
const loadThree = () => window.THREE ? Promise.resolve() : new Promise((res, rej) => {
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload = res; s.onerror = () => rej(new Error('three.js'));
  document.head.appendChild(s);
});
function ensureSpaceDom() {
  if (spaceShadow) return spaceShadow;
  const SR = spaceShadow = $('spaceU').attachShadow({ mode: 'open' });
  SR.innerHTML = '<style>' + SPACE_CSS + '</style>' + SPACE_MARKUP;
  const mk = (n, sp) => { const a = []; for (let i = 0; i < n; i++) a.push(`${((Math.random() * 2 - 1) * 55).toFixed(1)}vw ${((Math.random() * 2 - 1) * 55).toFixed(1)}vh 0 ${sp}px rgba(255,255,255,${(.35 + Math.random() * .65).toFixed(2)})`); return a.join(','); };
  SR.querySelectorAll('.stars').forEach((e, i) => { e.style.boxShadow = mk([90, 70, 40][i], [0, .4, .8][i]); });
  SR.getElementById('bClose').addEventListener('click', closeSpace);
  return SR;
}
async function openSpace() {
  if (spaceOpen) return;
  spaceOpen = true;
  const host = $('spaceU'), SR = ensureSpaceDom(), intro = SR.getElementById('intro'), ui = SR.getElementById('sp'), msg = SR.getElementById('spMsg');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.documentElement.style.overflow = 'hidden';
  ui.classList.remove('live'); msg.textContent = '';
  intro.className = 'intro'; void intro.offsetWidth; intro.className = 'intro play';
  host.classList.add('active');
  const t0 = performance.now();
  const skip = new Promise((r) => { intro.onclick = () => { if (performance.now() - t0 > 1600) r(); }; });
  try {
    const ready = (async () => {
      await loadThree(); await wait(450);                       // let the first frames of the welcome animation paint
      if (!spaceWorld) spaceWorld = buildSpaceWorld(SR, window.THREE, ui);
      spaceWorld.reset(); spaceWorld.prime();
    })();
    await Promise.all([ready, Promise.race([wait(3900), skip])]);
  } catch (e) {
    msg.textContent = 'Couldn’t reach the stars. Check your connection and try again.';
    await wait(2200); closeSpace(); return;
  }
  if (!spaceOpen) return;
  intro.classList.add('jump'); spaceWorld.start(); ui.classList.add('live');
  await wait(850);
  if (!spaceOpen) return;
  intro.classList.add('out');
}
function closeSpace() {
  if (!spaceOpen) return;
  spaceOpen = false;
  spaceWorld?.stop();
  $('spaceU').classList.remove('active');
  document.documentElement.style.overflow = '';
}
O().openSpace = openSpace; O().closeSpace = closeSpace;
$('spaceCloseBtn')?.addEventListener('click', closeSpace);   // used by the back button / swipe-back router

/* ---- the 3D universe ---- */
function buildSpaceWorld(SR, THREE, ROOT) {

const TAU=Math.PI*2,V3=THREE.Vector3,$=s=>ROOT.querySelector(s);
const NZ=`float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*n(p);p=p*2.03+7.1;a*=.5;}return s;}`;
const VS='varying vec3 vP,vN,vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const HD='precision highp float;varying vec3 vP,vN,vW;';
const PF=HD+NZ+`uniform int T;uniform vec3 A,B,C;uniform float S,SP;
void main(){vec3 q=normalize(vP),p=q+vec3(S);float y=q.y,e=fbm(p*2.);vec3 N=normalize(vN),L=normalize(-vW),V=normalize(cameraPosition-vW);
float d=dot(N,L),df=smoothstep(-.04,.45,d),sp=0.,li=0.;vec3 col;
if(T==0){float land=smoothstep(.5,.53,e);vec3 oc=mix(vec3(.01,.05,.18),vec3(.03,.2,.45),smoothstep(.25,.5,e));
vec3 gr=mix(vec3(.12,.3,.08),vec3(.5,.42,.25),smoothstep(.5,.75,fbm(p*5.)));gr=mix(gr,vec3(.62,.58,.5),smoothstep(.66,.8,e));
float ice=smoothstep(.78,.92,abs(y)+(e-.5)*.25);col=mix(mix(oc,gr,land),vec3(.93,.96,1.),ice);sp=(1.-land)*(1.-ice);
li=step(.74,n(p*70.))*land*(1.-ice)*smoothstep(.4,.6,fbm(p*8.));}
else if(T==1){float c=abs(n(p*9.)-.5)*2.;float m=smoothstep(.5,.62,fbm(p*1.6));col=mix(A,B,e)*(smoothstep(0.,.12,c)*.35+.65)*mix(1.,.55,m);}
else if(T==2){col=mix(A,B,smoothstep(.35,.7,e));col=mix(col,C,smoothstep(.55,.8,fbm(p*4.))*.6);col=mix(col,vec3(.95),smoothstep(.9,.97,abs(y)+(e-.5)*.1));}
else if(T==3){float w=fbm(vec3(q.x*2.,q.y*6.,q.z*2.)+fbm(p*2.)*2.);col=mix(A,B,w);col=mix(col,C,fbm(p*4.+w)*.5);}
else{float w=fbm(vec3(0.,y*7.,0.)+fbm(p*2.+.5)*.7);col=mix(A,B,w);col=mix(col,C,smoothstep(.4,.8,fbm(p*3.+w*2.))*.6);
vec2 s=vec2(atan(q.z,q.x)-1.2,(y+.3)*2.4);col=mix(col,vec3(.75,.3,.2),(1.-smoothstep(0.,.25,length(s)))*SP);}
vec3 H=normalize(L+V);float spec=pow(max(dot(N,H),0.),70.)*sp*.9*df;
vec3 o=col*df+spec+vec3(.9,.8,.4)*li*(1.-df)*1.3+col*.015;gl_FragColor=vec4(pow(o,vec3(.85)),1.);}`;
const CF=HD+NZ+`uniform float U;void main(){vec3 q=normalize(vP);float c=smoothstep(.52,.75,fbm(q*3.2+vec3(U*.01,0.,0.)));
float df=smoothstep(-.1,.5,dot(normalize(vN),normalize(-vW)));gl_FragColor=vec4(vec3(1.)*(df*.95+.03),c*.9);}`;
const AF=HD+`uniform vec3 C;uniform float K;void main(){vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(-vW);
float k=-dot(N,V);float i=pow(smoothstep(0.,K,k),2.2)*smoothstep(-.35,.45,dot(N,L));gl_FragColor=vec4(C*i*1.4,i);}`;
const SF=HD+NZ+`uniform float U;void main(){vec3 q=normalize(vP);float f=fbm(q*3.+vec3(U*.05));float g=fbm(q*9.-vec3(U*.08));
vec3 c=mix(vec3(1.,.3,.04),vec3(1.,.88,.45),f*.8+g*.4);float l=dot(normalize(vN),normalize(cameraPosition-vW));c*=.55+.6*pow(max(l,0.),.5);gl_FragColor=vec4(c*1.25,1.);}`;
const MF=HD+NZ+`void main(){vec3 d=normalize(vP);vec3 g=vec3(d.x,d.y*.55+d.z*.83,d.z*.55-d.y*.83);float band=exp(-pow(g.y*3.2,2.));
float f=fbm(d*4.)*.9+fbm(d*12.)*.4;float dust=smoothstep(.45,.75,fbm(d*6.+3.));vec3 c=mix(vec3(.05,.07,.18),vec3(.95,.72,.5),band*band)*band*f*1.15;
c*=1.-dust*band*.7;c+=vec3(.008,.01,.025);gl_FragColor=vec4(c,1.);}`;
const R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
let pr=Math.min(devicePixelRatio,1.25);const prMax=Math.min(devicePixelRatio,2);let fa=0,fc=0,pHold=0;
R.setPixelRatio(pr);R.setSize(innerWidth,innerHeight);ROOT.prepend(R.domElement);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,40000),cv=R.domElement;
const sph=new THREE.SphereGeometry(1,96,64);
const mat=(f,u,x)=>new THREE.ShaderMaterial(Object.assign({uniforms:u,vertexShader:VS,fragmentShader:f},x||{}));
const v3=a=>new V3(...(a||[0,0,0]));
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
r.addColorStop(0,'rgba(255,240,200,1)');r.addColorStop(.18,'rgba(255,190,100,.55)');r.addColorStop(.5,'rgba(255,120,40,.12)');r.addColorStop(1,'rgba(255,100,20,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
const dotTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);
r.addColorStop(0,'#fff');r.addColorStop(.4,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);})();
/* sky: Milky Way + stars */
const sky=new THREE.Mesh(new THREE.SphereGeometry(20000,48,32),new THREE.ShaderMaterial({vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:MF,side:THREE.BackSide,depthWrite:false}));
sky.renderOrder=-2;const skyScene=new THREE.Scene();skyScene.add(sky);
{const N=7000,p=new Float32Array(N*3),c=new Float32Array(N*3);for(let i=0;i<N;i++){const u=Math.random()*2-1,a=Math.random()*TAU,s=Math.sqrt(1-u*u),k=Math.random(),t=k<.15?[.7,.8,1]:k<.8?[1,.95,.9]:[1,.75,.55],b=.35+Math.random()*.65;
p.set([s*Math.cos(a)*15000,u*15000,s*Math.sin(a)*15000],i*3);c.set([t[0]*b,t[1]*b,t[2]*b],i*3);}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
const st=new THREE.Points(g,new THREE.PointsMaterial({size:2.6,sizeAttenuation:false,vertexColors:true,map:dotTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));st.renderOrder=-1;st.frustumCulled=false;sky.add(st);}
/* bodies */
const D=[
{n:'Sun',r:30,km:696340,sun:1,i:['Star (G2)','—','—','25 days']},
{n:'Mercury',r:1.3,d:70,P:88,sp:58.6,tl:0,T:1,A:[.35,.33,.31],B:[.62,.58,.54],km:2440,i:['Rocky planet','0.39 AU','88 days','58.6 days']},
{n:'Venus',r:2.9,d:100,P:225,sp:-243,tl:177,T:3,A:[.85,.62,.3],B:[.95,.82,.55],C:[.7,.45,.25],atm:[1,.7,.3],km:6052,i:['Rocky planet','0.72 AU','225 days','243 days']},
{n:'Earth',r:3,d:140,P:365.25,sp:1,tl:23.4,T:0,cl:1,atm:[.25,.55,1],km:6371,i:['Rocky planet','1 AU','365 days','24 hours']},
{n:'Moon',r:.8,d:7.5,P:27.3,sp:27.3,tl:6,T:1,A:[.4,.4,.4],B:[.75,.74,.72],par:'Earth',km:1737,i:['Natural satellite','384,400 km from Earth','27.3 days','27.3 days']},
{n:'Mars',r:1.9,d:190,P:687,sp:1.03,tl:25,T:2,A:[.55,.22,.1],B:[.8,.45,.25],C:[.3,.12,.07],atm:[.9,.55,.4],km:3390,i:['Rocky planet','1.52 AU','687 days','24.6 hours']},
{n:'Jupiter',r:13,d:300,P:4333,sp:.41,tl:3,T:4,A:[.85,.7,.5],B:[.55,.38,.25],C:[.9,.85,.75],SP:1,km:69911,i:['Gas giant','5.2 AU','11.9 years','9.9 hours']},
{n:'Saturn',r:10.5,d:430,P:10759,sp:.45,tl:27,T:4,A:[.92,.82,.58],B:[.78,.66,.44],C:[.95,.9,.75],ring:1,km:58232,i:['Gas giant','9.6 AU','29.5 years','10.7 hours']},
{n:'Uranus',r:6,d:540,P:30687,sp:-.72,tl:98,T:4,A:[.6,.85,.9],B:[.5,.78,.85],C:[.72,.92,.95],atm:[.5,.8,.9],km:25362,i:['Ice giant','19.2 AU','84 years','17.2 hours']},
{n:'Neptune',r:5.8,d:640,P:60190,sp:.67,tl:28,T:4,A:[.15,.3,.75],B:[.25,.45,.9],C:[.4,.6,1],atm:[.3,.5,1],km:24622,i:['Ice giant','30.1 AU','165 years','16.1 hours']},
{n:'Io',r:.75,d:22,P:1.77,sp:1.77,tl:0,T:2,A:[.9,.8,.3],B:[.95,.6,.2],C:[.5,.3,.1],par:'Jupiter',km:1822,i:['Moon of Jupiter','Volcanic world','1.8 days','1.8 days']},
{n:'Europa',r:.7,d:30,P:3.55,sp:3.55,tl:0,T:1,A:[.8,.75,.65],B:[.95,.9,.8],par:'Jupiter',km:1561,i:['Moon of Jupiter','Icy ocean world','3.6 days','3.6 days']},
{n:'Titan',r:1.1,d:34,P:15.9,sp:15.9,tl:0,T:3,A:[.8,.55,.2],B:[.9,.7,.35],C:[.6,.4,.15],atm:[1,.6,.2],par:'Saturn',km:2575,i:['Moon of Saturn','Thick orange haze','15.9 days','15.9 days']},
{n:'Pluto',r:.8,d:760,P:90560,sp:-6.4,tl:122,T:1,A:[.55,.45,.38],B:[.9,.8,.7],km:1188,i:['Dwarf planet','39.5 AU','248 years','6.4 days']}];
const uT={value:0};let earth;
D.forEach((b,ix)=>{b.ph=ix*1.7;b.o=new THREE.Group();b.pos=b.o.position;scene.add(b.o);
 if(b.sun){const m=new THREE.Mesh(sph,mat(SF,{U:uT}));m.scale.setScalar(b.r);b.o.add(m);
  [[b.r*9,.9],[b.r*26,.35]].forEach(([s,o])=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:o}));sp.scale.setScalar(s);b.o.add(sp);});return;}
 const tl=new THREE.Group();tl.rotation.z=b.tl*Math.PI/180;b.o.add(tl);
 b.sp_=new THREE.Mesh(sph,mat(PF,{T:{value:b.T},A:{value:v3(b.A)},B:{value:v3(b.B)},C:{value:v3(b.C)},S:{value:ix*3.7+1.3},SP:{value:b.SP||0}}));b.sp_.scale.setScalar(b.r);tl.add(b.sp_);
 if(b.cl){b.cl_=new THREE.Mesh(sph,mat(CF,{U:uT},{transparent:true,depthWrite:false}));b.cl_.scale.setScalar(b.r*1.012);tl.add(b.cl_);}
 if(b.atm){const a=new THREE.Mesh(sph,mat(AF,{C:{value:v3(b.atm)},K:{value:.356}},{transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));a.scale.setScalar(b.r*1.07);b.o.add(a);}
 if(b.ring){const g=new THREE.RingGeometry(b.r*1.35,b.r*2.3,128),p=g.attributes.position,uv=g.attributes.uv,v=new V3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);uv.setXY(i,(v.length()-b.r*1.35)/(b.r*.95),.5);}
  const c=document.createElement('canvas');c.width=1024;c.height=2;const x=c.getContext('2d');
  for(let i=0;i<1024;i++){const t=i/1024;let a=.5+.35*Math.sin(t*90)*Math.sin(t*27+1)+Math.random()*.15;if(t>.6&&t<.67)a*=.08;if(t<.06)a*=t/.06;x.fillStyle=`rgba(${215-t*40|0},${190-t*40|0},${150-t*30|0},${Math.max(0,Math.min(.95,a))})`;x.fillRect(i,0,1,2);}
  const r=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,side:THREE.DoubleSide,depthWrite:false}));r.rotation.x=-Math.PI/2;tl.add(r);}
 if(b.n==='Earth')earth=b;});
D.forEach(b=>{if(b.par)b.par=D.find(x=>x.n===b.par);});
/* orbit lines */
const orbs=[];const circ=(R_,col)=>{const p=[];for(let i=0;i<=256;i++){const a=i/256*TAU;p.push(new V3(Math.cos(a)*R_,0,Math.sin(a)*R_));}
 const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.28,depthWrite:false}));orbs.push(l);return l;};
D.forEach(b=>{if(b.d&&!b.par)scene.add(circ(b.d,0xe3c08d));});
D.forEach(b=>{if(b.par){b.og=new THREE.Group();b.og.add(circ(b.d,0x9fb4d6));scene.add(b.og);}});
/* labels + chips */
const lbs=D.map((b,i)=>{const e=document.createElement('div');e.className='lb';e.innerHTML='<i></i>'+b.n;e.onclick=()=>go(i);ROOT.appendChild(e);return e;});
D.forEach((b,i)=>{const e=document.createElement('button');e.className='pill';e.textContent=b.n;e.onclick=()=>go(i);b.chip=e;$('#chips').appendChild(e);});
const RATES=[['Pause',0],['1 h/s',1/24],['1 d/s',1],['10 d/s',10],['100 d/s',100]];let rate=RATES[1][1];
RATES.forEach(([l,v],i)=>{const e=document.createElement('button');e.className='pill'+(i==1?' on':'');e.textContent=l;e.onclick=()=>{rate=v;[...$('#time').children].forEach(c=>c.classList.remove('on'));e.classList.add('on');};$('#time').appendChild(e);});
/* camera state */
const S={mode:'orbit',tgt:earth,focus:new V3(),dist:260,want:0,yaw:.9,pitch:.3,fy:0,fp:0,th:0,fs:1,keys:{},orb:true,lab:true};
S.focus.copy(earth.pos);S.want=earth.r*5;
const fmt=x=>Math.round(x).toLocaleString('en-US');
function info(b){$('#info').innerHTML=`<h2>${b.n}</h2><p>${b.i[0]}</p><dl><dt>Radius</dt><dd>${b.ru||fmt(b.km)+' km'}</dd><dt>From Sun</dt><dd>${b.i[1]}</dd><dt>Year</dt><dd>${b.i[2]}</dd><dt>Day</dt><dd>${b.i[3]}</dd><dt>Altitude</dt><dd id="alt">—</dd></dl>`;}
function go(i){const b=D[i];if(S.mode==='free')toOrbit();S.tgt=b;S.want=b.r*(b.sun?3:4.5);info(b);D.forEach(x=>x.chip.classList.toggle('on',x===b));
 const c=b.chip;c.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});}
function toOrbit(){const f=new V3();cam.getWorldDirection(f);S.mode='orbit';S.focus.copy(cam.position).addScaledVector(f,100);S.dist=100;S.yaw=Math.atan2(-f.x,-f.z);S.pitch=Math.asin(-f.y);$('#fly').classList.remove('show');$('#bFly').classList.remove('on');}
$('#bFly').onclick=()=>{if(S.mode==='free'){go(D.indexOf(S.tgt));return;}const e=new THREE.Euler().setFromQuaternion(cam.quaternion,'YXZ');S.fy=e.y;S.fp=e.x;S.mode='free';$('#fly').classList.add('show');$('#bFly').classList.add('on');D.forEach(x=>x.chip.classList.remove('on'));};
$('#bOrb').onclick=e=>{S.orb=!S.orb;e.currentTarget.classList.toggle('on',S.orb);};
$('#bLab').onclick=e=>{S.lab=!S.lab;e.currentTarget.classList.toggle('on',S.lab);};
$('#spd').oninput=e=>S.fs=Math.pow(10,+e.target.value);
const hold=(id,v)=>{const e=$(id);e.onpointerdown=()=>S.th=v;['onpointerup','onpointerleave','onpointercancel'].forEach(k=>e[k]=()=>{if(S.th===v)S.th=0;});};hold('#thF',1);hold('#thB',-1);
/* input */
const ptr=new Map();let pd=0;const pdist=()=>{const a=[...ptr.values()];return Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);};
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);if(ptr.size==2)pd=pdist();});
cv.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p[0],dy=e.clientY-p[1];p[0]=e.clientX;p[1]=e.clientY;
 if(ptr.size==1){if(S.mode==='orbit'){S.yaw-=dx*.005;S.pitch=Math.max(-1.5,Math.min(1.5,S.pitch+dy*.005));}else{S.fy-=dx*.004;S.fp=Math.max(-1.55,Math.min(1.55,S.fp-dy*.004));}}
 else if(ptr.size==2){const nd=pdist();if(S.mode==='orbit')zoom(pd/nd);else mv(cam.position,(nd-pd)*.02);pd=nd;}});
['pointerup','pointercancel'].forEach(k=>cv.addEventListener(k,e=>ptr.delete(e.pointerId)));
const minD=()=>S.tgt.r*(S.tgt.soft?.05:1.12),zoom=r=>{S.want=Math.max(minD(),Math.min(Math.max(4000,S.tgt.r*12),S.want*r));};
const alt=()=>{let m=1e9;for(const b of D){let d=cam.position.distanceTo(b.pos)-(b.soft?b.r*.1:b.r);if(b.soft)d=Math.max(d,b.r*.05);m=Math.min(m,d);}return Math.max(m,.03);};
function mv(p,k){const f=new V3();cam.getWorldDirection(f);p.addScaledVector(f,k*alt()*.1);}
cv.addEventListener('wheel',e=>{e.preventDefault();if(S.mode==='orbit')zoom(Math.exp(e.deltaY*.001));else{S.fs=Math.max(.01,Math.min(100,S.fs*Math.exp(-e.deltaY*.001)));$('#spd').value=Math.log10(S.fs);}},{passive:false});
addEventListener('keydown',e=>{if(running)S.keys[e.code]=1;});addEventListener('keyup',e=>S.keys[e.code]=0);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
/* loop */
let t=0,last=performance.now(),altT=0;const tmp=new V3(),fw=new V3(),rt=new V3();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt*rate;
 fa+=dt;fc++;if(fc>=45){const av=fa/fc;fa=0;fc=0;if(av>.027&&pr>.55){pr=Math.max(.55,pr*.85);pHold=now+8000;R.setPixelRatio(pr);R.setSize(innerWidth,innerHeight);}else if(av<.0185&&pr<prMax&&now>pHold){pr=Math.min(prMax,pr*1.15);R.setPixelRatio(pr);R.setSize(innerWidth,innerHeight);}}uT.value=now/1000;
 for(const b of D){if(b.sun||b.far)continue;const a=b.ph+t*TAU/b.P,x=Math.cos(a)*b.d,z=Math.sin(a)*b.d;
  if(b.par)b.pos.set(b.par.pos.x+x,0,b.par.pos.z+z);else b.pos.set(x,0,z);
  b.sp_.rotation.y=t*TAU/b.sp;if(b.cl_)b.cl_.rotation.y=t*TAU/b.sp*1.06;}
 D.forEach(b=>b.og&&b.og.position.copy(b.par.pos));orbs.forEach(l=>l.visible=S.orb);sky.position.copy(cam.position);
 if(S.mode==='orbit'){const k=1-Math.exp(-dt*2.2),tp=S.tgt.pos;S.want=Math.max(minD(),S.want);
  if(S.focus.distanceTo(tp)<S.dist*.05)S.focus.copy(tp);else S.focus.lerp(tp,k);
  S.dist=Math.exp(Math.log(S.dist)+(Math.log(S.want)-Math.log(S.dist))*k);
  const cp=Math.cos(S.pitch);cam.position.set(S.focus.x+Math.sin(S.yaw)*cp*S.dist,S.focus.y+Math.sin(S.pitch)*S.dist,S.focus.z+Math.cos(S.yaw)*cp*S.dist);cam.lookAt(S.focus);
  const K=S.keys;if(K.KeyW||K.ArrowUp)zoom(Math.exp(-dt*1.5));if(K.KeyS||K.ArrowDown)zoom(Math.exp(dt*1.5));}
 else{cam.rotation.set(S.fp,S.fy,0,'YXZ');cam.getWorldDirection(fw);rt.crossVectors(fw,cam.up).normalize();const K=S.keys,sp=alt()*1.5*S.fs*dt;
  const f=(S.th||0)+(K.KeyW?1:0)-(K.KeyS?1:0),sd=(K.KeyD?1:0)-(K.KeyA?1:0),ud=(K.KeyE?1:0)-(K.KeyQ?1:0);
  cam.position.addScaledVector(fw,f*sp+(S.wv?Math.min(S.wv,alt()*10)*dt:0)).addScaledVector(rt,sd*sp).addScaledVector(cam.up,ud*sp);
  for(const b of D){tmp.copy(cam.position).sub(b.pos);const l=tmp.length();if(!b.soft&&l<b.r*1.02)cam.position.copy(b.pos).addScaledVector(tmp.normalize(),b.r*1.02);}}
 cam.updateMatrixWorld();
 D.forEach((b,i)=>{const e=lbs[i];tmp.copy(b.pos);tmp.y+=b.r*1.15;tmp.project(cam);
  const vis=S.lab&&(b.far?fwd(b):tmp.z<1)&&(!b.par||cam.position.distanceTo(b.par.pos)<b.par.r*14+40)&&Math.abs(tmp.x)<1.1&&Math.abs(tmp.y)<1.1;
  e.style.display=vis?'flex':'none';if(vis)e.style.transform=`translate3d(${(tmp.x*.5+.5)*innerWidth-10}px,${(-tmp.y*.5+.5)*innerHeight-22}px,0)`;});
 if(now-altT>250){altT=now;const a=$('#alt');if(a){const b=S.tgt,d=Math.max(0,cam.position.distanceTo(b.pos)-b.r)*b.km/b.r;a.textContent=fmt(d)+' km';}}
 try{ext(now,dt)}catch(e){console.error(e);R.autoClear=true;R.render(scene,cam)}
 if(running)raf=requestAnimationFrame(frame);}
info(earth);earth.chip.classList.add('on');S.dist=earth.r*16;


/* ===== Deep space: stars, black hole, nebula, galaxies, cosmic web, light speed ===== */
const farScene=new THREE.Scene(),fcam=new THREE.PerspectiveCamera(60,1,8,3e7),Kc=1500;
const _f=new V3(),_d=new V3();function fwd(b){cam.getWorldDirection(_f);return _d.copy(b.pos).sub(cam.position).dot(_f)>0;}
const mk=(g,m)=>new THREE.Mesh(g,m),quad=new THREE.PlaneGeometry(2,2);
const VQ='varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const QH='precision highp float;varying vec2 vU;';
const wTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.15,'rgba(255,255,255,.5)');r.addColorStop(.5,'rgba(255,255,255,.1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
const glow=(par,col,s,o)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:wTex,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:o}));sp.scale.setScalar(s);par.add(sp);return sp;};
const add=b=>{b.far=1;b.o=new THREE.Group();b.pos=b.o.position;b.o.position.set(...b.at);farScene.add(b.o);D.push(b);
 const e=document.createElement('div');e.className='lb';e.innerHTML='<i></i>'+b.n;e.onclick=()=>go(D.indexOf(b));ROOT.appendChild(e);lbs.push(e);
 const c=document.createElement('button');c.className='pill';c.textContent=b.n;c.onclick=()=>go(D.indexOf(b));b.chip=c;$('#chips').appendChild(c);return b;};
const SS=HD+NZ+`uniform float U;uniform vec3 CA,CB;void main(){vec3 q=normalize(vP);float f=fbm(q*3.+vec3(U*.05)),g=fbm(q*9.-vec3(U*.08));vec3 c=mix(CA,CB,f*.8+g*.4);
float l=dot(normalize(vN),normalize(cameraPosition-vW));c*=.55+.6*pow(max(l,0.),.5);gl_FragColor=vec4(c*1.25,1.);}`;
const star=(r,CA,CB,gc)=>{const g=new THREE.Group(),m=mk(sph,new THREE.ShaderMaterial({uniforms:{U:uT,CA:{value:v3(CA)},CB:{value:v3(CB)}},vertexShader:VS,fragmentShader:SS}));
 m.scale.setScalar(r);g.add(m);glow(g,gc,r*9,.9);glow(g,gc,r*26,.3);return g;};
const SP=(n,at,r,CA,CB,gc,i,ru)=>{const b=add({n,at,r,km:r*23211,cat:'Stars',i,ru});b.o.add(star(r,CA,CB,gc));return b;};
SP('Sirius',[90000,-6000,-210000],700,[.6,.8,1],[1,1,1],0x88aaff,['Blue-white star','8.6 light-years','—','—'],'1.7 × Sun');
SP('Betelgeuse',[-260000,20000,-120000],5000,[1,.15,.04],[1,.55,.2],0xff5522,['Red supergiant','548 light-years','—','—'],'~700 × Sun');
SP('Proxima',[40000,3000,150000],160,[.8,.15,.05],[1,.4,.2],0xff4422,['Red dwarf','4.2 light-years','—','—'],'0.15 × Sun');
/* three blue suns */
const tri=add({n:'Three blue suns',at:[-150000,5000,220000],r:7000,soft:1,cat:'Stars',km:7000*23211,ru:'3 stars orbiting',i:['Triple star system','—','—','—']});
const ts=[[1100,0],[850,2.1],[650,4.2]].map(([r,ph],k)=>{const g=star(r,[.08,.25,1],[.65,.88,1],0x5599ff);g.userData={ph,rad:2200+k*900,k};tri.o.add(g);return g;});
/* pulsar */
const pu=SP('Pulsar',[280000,-12000,60000],160,[.7,.8,1],[1,1,1],0x99bbff,['Neutron star','~6,500 light-years','Spins in milliseconds','—'],'~12 km');
const bt=(()=>{const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d'),l=g.createLinearGradient(0,0,256,0);
 l.addColorStop(0,'rgba(150,190,255,0)');l.addColorStop(.5,'rgba(230,240,255,.95)');l.addColorStop(1,'rgba(150,190,255,0)');g.fillStyle=l;g.fillRect(0,0,256,64);
 g.globalCompositeOperation='destination-in';const v=g.createLinearGradient(0,0,0,64);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.5,'rgba(0,0,0,1)');v.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=v;g.fillRect(0,0,256,64);return new THREE.CanvasTexture(c);})();
const pTilt=new THREE.Group(),pSpin=new THREE.Group();pTilt.rotation.z=.45;pTilt.add(pSpin);pu.o.add(pTilt);
[0,Math.PI/2].forEach(a=>{const m=mk(new THREE.PlaneGeometry(16000,700),new THREE.MeshBasicMaterial({map:bt,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=a;pSpin.add(m);});
/* nebula */
const NB=QH+NZ+`uniform float U;void main(){vec2 p=vU;float r=length(p);vec3 q=vec3(p*2.2,3.);float w=fbm(q+fbm(q*1.7+U*.01)*1.4);float m=smoothstep(.38,.85,w)*(1.-smoothstep(.55,1.,r));
vec3 c=mix(vec3(.1,.5,.7),vec3(.9,.2,.5),fbm(q*2.+5.));c=mix(c,vec3(1.,.7,.3),smoothstep(.65,.9,w));float s=step(.992,h(vec3(p*160.,1.)))*m*3.;gl_FragColor=vec4(c*m*1.6+s,m);}`;
const neb=add({n:'Pillars nebula',at:[-320000,-20000,-40000],r:90000,soft:1,cat:'Deep space',km:90000*23211,ru:'Gas & dust cloud',i:['Emission nebula','~7,000 light-years','—','—']});
const nbM=mk(quad,new THREE.ShaderMaterial({uniforms:{U:uT},vertexShader:VQ,fragmentShader:NB,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));nbM.scale.setScalar(90000);neb.o.add(nbM);
/* black hole */
const BF=QH+NZ+`uniform float U,C,S;uniform vec2 A;void main(){vec2 q=vU*8.5;float rho=length(q);vec2 ex=vec2(A.y,-A.x);vec2 d=vec2(dot(q,ex),dot(q,A));
float hw=sqrt(max(0.,1.-C*C)),ang=atan(d.y,d.x);float tx=fbm(vec3(cos(ang)*rho*1.4,sin(ang)*rho*1.4,U*.1))*.8+.35;
float hi=smoothstep(1.,1.1,rho)*(1.-smoothstep(1.1,3.6,rho))*pow(1./rho,1.5)*hw*2.4*tx;
vec2 e=vec2(d.x,d.y/max(C,.05));float er=length(e),ea=atan(e.y,e.x),ph=ea-U*1.1/pow(er,1.5);
float ds=smoothstep(1.6,2.,er)*(1.-smoothstep(5.,6.2,er));float tb=fbm(vec3(cos(ph)*er*.9,sin(ph)*er*.9,er*1.6))*1.1+.25;float tt=1.-smoothstep(1.6,6.2,er);
vec3 dc=mix(vec3(.85,.2,.04),vec3(1.,.9,.7),tt*tt)*tb*ds*(1.+.75*(-e.x/max(er,.01)))*2.;float nr=step(d.y*S,0.);dc*=nr+(1.-nr)*step(1.,rho);
vec3 hc=mix(vec3(1.,.55,.2),vec3(1.,.95,.8),(1.-smoothstep(1.,3.,rho)))*hi;float pr=exp(-pow((rho-1.08)*14.,2.))*1.8;
gl_FragColor=vec4(dc+hc+vec3(1.,.9,.7)*pr,1.);}`;
const bh=add({n:'Black hole',at:[420000,10000,-260000],r:1200,cat:'Deep space',km:1200*23211,ru:'4 million × Sun',i:['Supermassive black hole','26,000 light-years','—','—']});
const bhS=mk(sph,new THREE.MeshBasicMaterial({color:0x000000}));bhS.scale.setScalar(1200);bh.o.add(bhS);
const bhM=new THREE.ShaderMaterial({uniforms:{U:uT,C:{value:.5},S:{value:1},A:{value:new THREE.Vector2(0,1)}},vertexShader:VQ,fragmentShader:BF,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
const bB=mk(quad,bhM);bB.scale.setScalar(1200*8.5);bB.renderOrder=1;bh.o.add(bB);
/* galaxies */
const GF=QH+NZ+`uniform float U,AR,TW,BAR,SD;uniform vec3 CA,CC;void main(){vec2 p=vU;float r=length(p);if(r>1.)discard;float a=atan(p.y,p.x);vec3 col;
if(AR<.5){float b=exp(-r*5.5)*(.8+.4*fbm(vec3(p*6.,SD)));col=mix(CC,vec3(1.,.85,.7),exp(-r*6.))*b*1.7+step(.99,h(vec3(p*200.,SD)))*b*2.;gl_FragColor=vec4(col,clamp(b*2.,0.,1.));return;}
float ph=a-TW*log(r+.03)+U*.01;float arm=pow(.5+.5*cos(AR*ph),2.2);arm*=smoothstep(.15,.75,fbm(vec3(p*6.,SD))+.25);
float bulge=exp(-r*r*20.)*1.5;float bar=BAR*exp(-pow(length(vec2(dot(p,vec2(.866,.5)),dot(p,vec2(-.5,.866))*3.5)),2.)*7.)*1.2;
float disk=exp(-r*2.4)*(.25+arm*1.3);float dust=smoothstep(.5,.85,fbm(vec3(p*10.,SD+4.)))*pow(.5+.5*cos(AR*(ph+.5)),3.)*(1.-bulge*.5);
float hii=pow(n(vec3(p*45.,SD)),7.)*arm*r*40.;float L=(disk+bulge+bar)*(1.-dust*.75);float f=1.-smoothstep(.75,1.,r);
col=mix(CA,CC,exp(-r*3.))*L+vec3(1.,.3,.5)*hii*.7+vec3(1.,.9,.8)*step(.985,h(vec3(p*230.,SD)))*L*1.8+vec3(1.,.85,.6)*bulge*.5;
gl_FragColor=vec4(col*f,clamp(max(max(col.r,col.g),col.b),0.,1.)*f);}`;
const gal=(n,at,R,o)=>{const b=add({n,at,r:R,soft:1,cat:'Deep space',km:R*23211,ru:o.ru,i:o.i});
 const m=mk(quad,new THREE.ShaderMaterial({uniforms:{U:uT,AR:{value:o.ar},TW:{value:o.tw},BAR:{value:o.bar||0},SD:{value:o.sd},CA:{value:v3(o.ca)},CC:{value:v3(o.cc)}},vertexShader:VQ,fragmentShader:GF,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 m.scale.setScalar(R);m.rotation.set(o.tx,0,o.tz||0);b.o.add(m);glow(b.o,0xffddaa,R*.55,.55);return b;};
gal('Andromeda',[1.6e6,4e5,2e6],4e5,{ar:2,tw:3,sd:1.3,tx:1.1,tz:.3,ca:[.55,.7,1],cc:[1,.85,.6],ru:'110,000 light-years',i:['Spiral galaxy','2.5 million ly','—','—']});
gal('Whirlpool',[-2.4e6,-3e5,1.8e6],3.2e5,{ar:2,tw:2.2,sd:4.7,tx:.25,tz:1,ca:[.45,.6,1],cc:[1,.8,.6],ru:'76,000 light-years',i:['Spiral galaxy','23 million ly','—','—']});
gal('Sombrero',[2.6e6,2e5,-2.2e6],3.4e5,{ar:3,tw:4,sd:8.1,tx:1.42,tz:-.4,ca:[.9,.8,.65],cc:[1,.9,.7],ru:'50,000 light-years',i:['Spiral galaxy','29 million ly','—','—']});
gal('Barred spiral',[-1.4e6,6e5,-3e6],3.5e5,{ar:2,tw:2.6,bar:1,sd:2.9,tx:.6,tz:.8,ca:[.6,.65,1],cc:[1,.82,.55],ru:'110,000 light-years',i:['Barred spiral galaxy','61 million ly','—','—']});
gal('Elliptical',[.6e6,-5e5,-4.4e6],3e5,{ar:0,tw:0,sd:6.2,tx:.4,ca:[1,.8,.55],cc:[1,.78,.5],ru:'120,000 light-years',i:['Giant elliptical galaxy','53 million ly','—','—']});
/* cosmic web */
const web=add({n:'Cosmic web',at:[7e6,1e6,-6e6],r:2.8e6,soft:1,cat:'Deep space',km:2.8e6*23211,ru:'~1 billion light-years',i:['Large-scale structure','—','—','—']});
{const nodes=Array.from({length:70},()=>new V3((Math.random()*2-1)*2.4e6,(Math.random()*2-1)*1.6e6,(Math.random()*2-1)*2.4e6)),P=[],Cc=[];
 const gs=s=>(Math.random()+Math.random()+Math.random()-1.5)*s*1.6;
 const put=(x,y,z,b,warm)=>{P.push(x,y,z);const w=b*(.5+Math.random()*.5);Cc.push(warm?w:.55*w,warm?.75*w:.7*w,warm?.5*w:w);};
 nodes.forEach((a,i)=>{for(let k=0;k<300;k++)put(a.x+gs(1.1e5),a.y+gs(1.1e5),a.z+gs(1.1e5),1,true);
  nodes.map((b,j)=>[a.distanceTo(b),j]).sort((x,y)=>x[0]-y[0]).slice(1,3).forEach(([d,j])=>{const b=nodes[j];for(let k=0;k<450;k++){const u=Math.random();put(a.x+(b.x-a.x)*u+gs(6e4),a.y+(b.y-a.y)*u+gs(6e4),a.z+(b.z-a.z)*u+gs(6e4),.6,false);}});});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));
 const pts=new THREE.Points(g,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,map:dotTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pts.frustumCulled=false;web.o.add(pts);
 nodes.slice(0,14).forEach(a=>{const s=glow(web.o,0x88aaff,3e5,.18);s.position.copy(a);});}
/* asteroid belt (near scene) */
const belt=(()=>{const N=5000,p=new Float32Array(N*3);for(let i=0;i<N;i++){const a=Math.random()*TAU,r=215+Math.random()*50;p.set([Math.cos(a)*r,(Math.random()-.5)*6,Math.sin(a)*r],i*3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const m=new THREE.Points(g,new THREE.PointsMaterial({size:1.7,sizeAttenuation:false,color:0xb9a58c,map:dotTex,transparent:true,depthWrite:false}));scene.add(m);return m;})();
/* tabs */
let tab='Solar system';const tabs=document.createElement('div');tabs.className='tabs';ROOT.appendChild(tabs);
const setTab=c=>{tab=c;[...tabs.children].forEach(x=>x.classList.toggle('on',x.textContent===c));D.forEach(b=>b.chip.style.display=(b.cat||'Solar system')===c?'':'none');};
['Solar system','Stars','Deep space'].forEach(c=>{const e=document.createElement('button');e.className='pill';e.textContent=c;e.onclick=()=>setTab(c);tabs.appendChild(e);});setTab(tab);
const _go=go;go=i=>{_go(i);setTab(D[i].cat||'Solar system');};
/* light speed panel */
const ls=document.createElement('div');ls.className='time ls';ls.id='ls';ls.innerHTML='<span class="pill lbl">Light speed</span>';
[[1,'1 c'],[10,'10 c'],[100,'100 c'],[1000,'1,000 c'],[0,'Stop']].forEach(([n,l])=>{const e=document.createElement('button');e.className='pill';e.textContent=l;
 e.onclick=()=>{if(n&&S.mode!=='free')$('#bFly').click();S.wv=n*Kc;[...ls.querySelectorAll('button')].forEach(x=>x.classList.toggle('on',x===e&&n>0));};ls.appendChild(e);});
const bot=$('.bot');bot.insertBefore(ls,$('#time'));const spo=document.createElement('div');spo.className='pill';spo.id='spo';bot.insertBefore(spo,ls);
$('#bLs').onclick=e=>{const on=!ls.classList.contains('show');ls.classList.toggle('show',on);e.currentTarget.classList.toggle('on',on);};
$('#bFly').addEventListener('click',()=>{if(S.mode!=='free'){S.wv=0;ls.querySelectorAll('button').forEach(x=>x.classList.remove('on'));}});
/* warp streaks */
const sc=document.createElement('canvas');sc.id='str';cv.after(sc);const sx=sc.getContext('2d'),ST=Array.from({length:170},()=>({a:Math.random()*TAU,r:Math.random(),w:.5+Math.random()*1.5}));let cleared=true;
function streaks(I,dt){if(I<.02){if(!cleared){sx.clearRect(0,0,sc.width,sc.height);cleared=true;}return;}cleared=false;
 const W=sc.width=innerWidth,H=sc.height=innerHeight,cx=W/2,cy=H*.46,M=Math.max(W,H),gr=sx.createRadialGradient(cx,cy,0,cx,cy,M*.7);
 gr.addColorStop(0,'rgba(120,170,255,0)');gr.addColorStop(1,`rgba(90,140,255,${.3*I})`);sx.fillStyle=gr;sx.fillRect(0,0,W,H);sx.lineCap='round';
 ST.forEach(s=>{s.r=(s.r+dt*(.15+I*1.2))%1;const r0=s.r*s.r*M*.65+20,len=r0*(.12+I*1.1),c=Math.cos(s.a),n=Math.sin(s.a);
  sx.strokeStyle=`rgba(200,225,255,${.2+.6*I*s.r})`;sx.lineWidth=s.w;sx.beginPath();sx.moveTo(cx+c*r0,cy+n*r0);sx.lineTo(cx+c*(r0+len),cy+n*(r0+len));sx.stroke();});}
/* per-frame hook (called from the main loop) */
const nrm=new V3(.15,.98,.1).normalize(),rg=new V3(),upv=new V3(),t2=new V3(),prev=cam.position.clone();let sm=0,rT=0,lastAlt='';
const lt=d=>{const s=d/Kc;return s<90?s.toFixed(1)+' light-sec':s<5400?(s/60).toFixed(1)+' light-min':(s/3600).toFixed(1)+' light-hours';};
const ext=(now,dt)=>{
 const v=cam.position.distanceTo(prev)/Math.max(dt,.001);prev.copy(cam.position);sm+=(v-sm)*.15;
 const I=sm>2500?Math.min(1,Math.log10(sm/2500)/2.2):0;cam.fov+=(60+48*I-cam.fov)*.12;cam.updateProjectionMatrix();
 belt.rotation.y=t*TAU/1600;ts.forEach(g=>{const a=g.userData.ph+now/1000*.5/(g.userData.k+1);g.position.set(Math.cos(a)*g.userData.rad,Math.sin(a*.7)*g.userData.rad*.25,Math.sin(a)*g.userData.rad);});
 pSpin.rotation.y=now/1000*6;nbM.quaternion.copy(cam.quaternion);
 rg.set(1,0,0).applyQuaternion(cam.quaternion);upv.set(0,1,0).applyQuaternion(cam.quaternion);let ax=nrm.dot(rg),ay=nrm.dot(upv);const l=Math.hypot(ax,ay);if(l<.04){ax=0;ay=1;}else{ax/=l;ay/=l;}
 t2.copy(cam.position).sub(bh.pos);const dl=t2.length(),sg=Math.sign(nrm.dot(t2))||1;t2.divideScalar(dl);
 bhM.uniforms.C.value=Math.abs(nrm.dot(t2));bhM.uniforms.A.value.set(ax,ay);bhM.uniforms.S.value=sg;bB.quaternion.copy(cam.quaternion);
 D.forEach((b,i)=>{if((b.cat||'Solar system')!==tab&&b!==S.tgt)lbs[i].style.display='none';});
 const tg=S.tgt;if(tg.far){const a=$('#alt');if(a){const s=lt(Math.max(0,cam.position.distanceTo(tg.pos)-(tg.soft?0:tg.r)));if(s!==lastAlt){lastAlt=s;a.textContent=s;}}}
 if(now-rT>150){rT=now;const c=sm/Kc;spo.textContent='Speed '+(c<.005?'0':c<10?c.toFixed(2):fmt(c))+' c';}
 streaks(I,dt);
 fcam.position.copy(cam.position);fcam.quaternion.copy(cam.quaternion);fcam.fov=cam.fov;fcam.aspect=cam.aspect;fcam.updateProjectionMatrix();fcam.updateMatrixWorld();
 R.autoClear=false;R.clear();R.render(skyScene,cam);R.render(farScene,fcam);R.clearDepth();R.render(scene,cam);};

let running=false,raf=0;
const reset=()=>{S.mode='orbit';S.wv=0;S.th=0;S.keys={};$('#fly').classList.remove('show');$('#bFly').classList.remove('on');ls.classList.remove('show');$('#bLs').classList.remove('on');
 ls.querySelectorAll('button').forEach(x=>x.classList.remove('on'));S.focus.set(0,0,0);S.dist=4000;S.yaw=.9;S.pitch=.3;cam.fov=60;sm=0;prev.copy(cam.position);go(D.indexOf(earth));};
const prime=()=>{try{R.compile(skyScene,cam);R.compile(farScene,fcam);R.compile(scene,cam);}catch(e){}try{ext(performance.now(),.016);}catch(e){}};
const start=()=>{if(running)return;running=true;last=performance.now();prev.copy(cam.position);raf=requestAnimationFrame(frame);};
const stop=()=>{running=false;cancelAnimationFrame(raf);S.th=0;S.keys={};};
return {reset,prime,start,stop};
}
