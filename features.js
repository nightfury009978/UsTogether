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
  $('mainPageReminder').after(c);
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
