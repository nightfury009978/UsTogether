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
OUR MEMORIES: swipeable sticky notes (opened from "Our Memories ✨")
========================================================= */
const TONES = [
['#fbefcf', '#efd69f', '#46341b', 'rgba(239,214,159,.32)'], // champagne
['#fadcdf', '#eeb7bf', '#5b2c37', 'rgba(238,183,191,.32)'], // blush
['#e2ecd8', '#bfd5ad', '#31462a', 'rgba(191,213,173,.28)'], // sage
['#e8e0f6', '#c9bce8', '#3d3262', 'rgba(201,188,232,.30)'], // lavender
['#fce3cd', '#f1c096', '#5a381c', 'rgba(241,192,150,.30)'], // peach
['#dbeaf0', '#acd3df', '#254552', 'rgba(172,211,223,.28)'] // mist
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
SPECIAL DAYS + "OUR SPACE" WELCOME
- Tap "Our Space" on Home -> premium "Welcome to Our Space" animation -> interface.
- On special days (00:00 -> 23:59 of that same day, device time) golden sparkles fly
  across Home into "Our Space", and the interface opens with a tap-to-reveal wish.
- Test any day without waiting:  open the site with  ?fx=xmas  (see the key list below).
========================================================= */
const SPECIAL = [
{ k: 'birth', m: 11, d: 19, theme: 'gold', icon: '🌟', small: 'The birth of our website', title: 'Today’s the birth of Our Space',
msg: 'Today our little website came to life: a corner of the internet made only for us, for our memories, our stories and everything we’ll keep. Here’s to many more days inside it.' },
{ k: 'xmas', m: 12, d: 25, theme: 'xmas', icon: '🎄', small: 'Merry Christmas', title: 'Happy Christmas',
msg: 'May your day glow with warmth, wonder and everything you love the most. Wishing you a Christmas as magical as you are.' },
{ k: 'newyear', m: 1, d: 1, theme: 'ny', icon: '🎆', small: 'A brand-new chapter', title: 'Happy New Year',
msg: 'A fresh page, a new beginning. May this year be filled with love, light and moments worth remembering, together.' },
{ k: 'rose', m: 2, d: 7, theme: 'val', icon: '🌹', small: 'Valentine’s Week · Rose Day', title: 'Happy Rose Day',
msg: 'A single rose says what words cannot. You are the most beautiful thing that ever bloomed in my life.' },
{ k: 'propose', m: 2, d: 8, theme: 'val', icon: '💍', small: 'Valentine’s Week · Propose Day', title: 'Happy Propose Day',
msg: 'If I could choose again, a thousand times over, I would still choose you. Today and always, my heart says yes to us.' },
{ k: 'choco', m: 2, d: 9, theme: 'val', icon: '🍫', small: 'Valentine’s Week · Chocolate Day', title: 'Happy Chocolate Day',
msg: 'Life is sweeter with you in it. Every moment with you tastes better than the finest chocolate.' },
{ k: 'teddy', m: 2, d: 10, theme: 'val', icon: '🧸', small: 'Valentine’s Week · Teddy Day', title: 'Happy Teddy Day',
msg: 'Soft, warm and always there, just like you. Sending you the tightest teddy hug today.' },
{ k: 'promise', m: 2, d: 11, theme: 'val', icon: '🤝', small: 'Valentine’s Week · Promise Day', title: 'Happy Promise Day',
msg: 'I promise to hold your hand through every season, to choose you every day, and to keep this love alive, always.' },
{ k: 'hug', m: 2, d: 12, theme: 'val', icon: '🤗', small: 'Valentine’s Week · Hug Day', title: 'Happy Hug Day',
msg: 'Some places feel like home, and your arms are one of them. Here is a hug that lasts all day.' },
{ k: 'kiss', m: 2, d: 13, theme: 'val', icon: '💋', small: 'Valentine’s Week · Kiss Day', title: 'Happy Kiss Day',
msg: 'A small kiss, a big feeling. Every moment with you is a love story I never want to end.' },
{ k: 'valentine', m: 2, d: 14, theme: 'val', icon: '❤️', small: 'The day of love', title: 'Happy Valentine’s Day',
msg: 'You are my favourite hello and my hardest goodbye. Today and every day, my heart is yours.' }
];
const fxParam = (() => { try { return new URLSearchParams(location.search).get('fx'); } catch { return null; } })();
function activeSpecial() {
const pv = fxParam && SPECIAL.find((s) => s.k === fxParam);
if (pv) return pv;
const n = new Date(), m = n.getMonth() + 1, d = n.getDate();
return SPECIAL.find((s) => s.m === m && s.d === d) || null; // same calendar day = 12:00am to 11:59pm
}
/* ---------- golden sparkle sprinkle on Home ----------
   One light canvas (no DOM particles): glowing gold sparkles drift in from the edges, fly into "Our Space",
   and the title shines as each one arrives. Runs only on special days and pauses whenever a page is open. */
const FX = { cv: null, ctx: null, dpr: 1, w: 0, h: 0, raf: 0, on: false, key: null, hitAt: 0, spawnAt: 0, last: 0, chkAt: 0, comets: [], dust: [], amb: [], tgt: null, blk: false, dirty: false, spr: null, pool: [] };
const BLOCKERS = '#osStart,#menuDrawer.active,#todoBottomSheet.active,#todoHistoryBottomSheet.active,#storyBottomSheet.active,#memNotes.active,#osWelcome.active,#frPage.active,#postPage.active,#chatApp.active,#authOverlay.active';
function fxSprites() {
if (FX.spr) return FX.spr;
const mk = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); return c; };
const star = mk((g) => {
const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,248,214,.9)'); r.addColorStop(.22, 'rgba(255,214,120,.42)'); r.addColorStop(1, 'rgba(255,190,70,0)');
g.fillStyle = r; g.fillRect(0, 0, 64, 64);
g.fillStyle = '#fff8dc'; g.beginPath(); g.moveTo(32, 3); g.quadraticCurveTo(34, 30, 61, 32); g.quadraticCurveTo(34, 34, 32, 61); g.quadraticCurveTo(30, 34, 3, 32); g.quadraticCurveTo(30, 30, 32, 3); g.fill();
});
const dot = mk((g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,244,200,1)'); r.addColorStop(.3, 'rgba(255,205,100,.55)'); r.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
return (FX.spr = { star, dot });
}
function fxResize() {
if (!FX.cv) return;
FX.dpr = Math.min(window.devicePixelRatio || 1, 1.5); FX.w = innerWidth; FX.h = innerHeight;
FX.cv.width = Math.round(FX.w * FX.dpr); FX.cv.height = Math.round(FX.h * FX.dpr);
FX.ctx.setTransform(FX.dpr, 0, 0, FX.dpr, 0, 0);
}
function fxCanvas() {
if (FX.cv) return FX.cv;
const c = document.createElement('canvas');
c.id = 'fxCanvas'; c.setAttribute('aria-hidden', 'true');
c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:120';
document.body.appendChild(c);
FX.cv = c; FX.ctx = c.getContext('2d'); fxResize(); addEventListener('resize', fxResize);
return c;
}
function fxTarget() {
const t = $('bnTitle'); if (!t) return null;
const r = t.getBoundingClientRect();
if (!r.width || r.bottom < 40 || r.top > innerHeight - 90) return null;
return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
const fxNew = () => FX.pool.pop() || {};
function fxDust(x, y, vx, vy, life, size, star, grav) {
if (FX.dust.length > 240) return;
const p = fxNew(); p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.s = size; p.star = star; p.g = grav; p.rot = Math.random() * 6.28;
FX.dust.push(p);
}
function hitTitle(t) {
const el = $('bnTitle'), now = performance.now();
if (!el || now - FX.hitAt < 260) return;
FX.hitAt = now;
el.classList.remove('fx-hit'); void el.offsetWidth; el.classList.add('fx-hit');
fxDust(t.x, t.y, 0, 0, .4, 90, false, 0);                               // soft flash
for (let k = 0; k < 14; k++) { const a = Math.random() * 6.283, v = 50 + Math.random() * 120; fxDust(t.x, t.y, Math.cos(a) * v, Math.sin(a) * v, .6 + Math.random() * .5, 7 + Math.random() * 9, Math.random() < .55, 30); }
}
function spawnComet(now) {
const W = FX.w, H = FX.h, r = Math.random();
let x0, y0;
if (r < .38) { x0 = -30; y0 = H * (.2 + Math.random() * .7); }
else if (r < .76) { x0 = W + 30; y0 = H * (.2 + Math.random() * .7); }
else { x0 = W * Math.random(); y0 = H + 30; }
const c = fxNew();
c.x0 = x0; c.y0 = y0; c.c1x = W * Math.random(); c.c1y = H * (.25 + Math.random() * .6); c.c2x = W * Math.random(); c.c2y = H * (.05 + Math.random() * .5);
c.t0 = now; c.dur = 3200 + Math.random() * 2400; c.ph = Math.random() * 6.28; c.amp = 12 + Math.random() * 22; c.size = 14 + Math.random() * 14; c.last = 0;
FX.comets.push(c);
}
function fxClear() {
FX.pool.push(...FX.comets, ...FX.dust, ...FX.amb); FX.comets.length = FX.dust.length = FX.amb.length = 0;
if (FX.ctx && FX.dirty) { FX.ctx.clearRect(0, 0, FX.w, FX.h); FX.dirty = false; }
}
function fxFrame(now) {
FX.raf = requestAnimationFrame(fxFrame);
if (now - FX.chkAt > 150) { FX.chkAt = now; FX.blk = document.hidden || !!document.querySelector(BLOCKERS); FX.tgt = FX.blk ? null : fxTarget(); }
const t = FX.tgt;
if (!t) { fxClear(); FX.last = now; return; }
const dt = Math.min(.05, (now - FX.last) / 1000); FX.last = now;
const ctx = FX.ctx, spr = FX.spr;
if (now > FX.spawnAt && FX.comets.length < (reduceMotion ? 5 : 15)) {
spawnComet(now); if (!reduceMotion && Math.random() < .4) spawnComet(now);
FX.spawnAt = now + (reduceMotion ? 900 : 230 + Math.random() * 260);
}
if (!reduceMotion && FX.amb.length < 16 && Math.random() < .12) {
const a = fxNew(); a.x = Math.random() * FX.w; a.y = FX.h * (.12 + Math.random() * .78); a.life = a.max = 1.6 + Math.random() * 1.6; a.s = 8 + Math.random() * 14; FX.amb.push(a);
}
ctx.clearRect(0, 0, FX.w, FX.h); ctx.globalCompositeOperation = 'lighter'; FX.dirty = true;
for (let i = FX.amb.length - 1; i >= 0; i--) {
const a = FX.amb[i]; a.life -= dt;
if (a.life <= 0) { FX.pool.push(a); FX.amb[i] = FX.amb[FX.amb.length - 1]; FX.amb.pop(); continue; }
ctx.globalAlpha = Math.sin(Math.PI * (1 - a.life / a.max)) * .85;
ctx.drawImage(spr.star, a.x - a.s / 2, a.y - a.s / 2, a.s, a.s);
}
for (let i = FX.comets.length - 1; i >= 0; i--) {
const b = FX.comets[i], u = (now - b.t0) / b.dur;
if (u >= 1) { FX.pool.push(b); FX.comets[i] = FX.comets[FX.comets.length - 1]; FX.comets.pop(); hitTitle(t); continue; }
const e = u * u * (3 - 2 * u) * .35 + u * .65, iu = 1 - e;
let x = iu ** 3 * b.x0 + 3 * iu * iu * e * b.c1x + 3 * iu * e * e * b.c2x + e ** 3 * t.x;
let y = iu ** 3 * b.y0 + 3 * iu * iu * e * b.c1y + 3 * iu * e * e * b.c2y + e ** 3 * t.y;
const dx = 3 * iu * iu * (b.c1x - b.x0) + 6 * iu * e * (b.c2x - b.c1x) + 3 * e * e * (t.x - b.c2x);
const dy = 3 * iu * iu * (b.c1y - b.y0) + 6 * iu * e * (b.c2y - b.c1y) + 3 * e * e * (t.y - b.c2y);
const len = Math.hypot(dx, dy) || 1, wob = Math.sin(u * 12 + b.ph) * b.amp * (1 - u * .85);
x += (-dy / len) * wob; y += (dx / len) * wob;
const sc = u > .9 ? Math.max(.2, 1 - (u - .9) * 8) : 1, op = u < .05 ? u / .05 : u > .94 ? (1 - u) / .06 : 1;
const s = b.size * sc * (.85 + .25 * Math.sin(now * .018 + b.ph));
ctx.globalAlpha = op * .55; ctx.drawImage(spr.dot, x - s, y - s, s * 2, s * 2);
ctx.globalAlpha = op; ctx.drawImage(spr.star, x - s / 2, y - s / 2, s, s);
if (now - b.last > 42) { b.last = now; fxDust(x + (Math.random() - .5) * 6, y + (Math.random() - .5) * 6, (Math.random() - .5) * 20, 6 + Math.random() * 16, .7 + Math.random() * .5, 5 + Math.random() * 7, Math.random() < .3, 14); }
}
for (let i = FX.dust.length - 1; i >= 0; i--) {
const p = FX.dust[i]; p.life -= dt;
if (p.life <= 0) { FX.pool.push(p); FX.dust[i] = FX.dust[FX.dust.length - 1]; FX.dust.pop(); continue; }
p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= .985;
const k = p.life / p.max, s = p.s * (.4 + .6 * k);
ctx.globalAlpha = k * k * .95;
ctx.drawImage(p.star ? spr.star : spr.dot, p.x - s / 2, p.y - s / 2, s, s);
}
ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function syncFx() {
const sp = activeSpecial(), t = $('bnTitle');
t?.classList.toggle('fx-on', !!sp);
if (sp && !FX.on) { FX.on = true; fxCanvas(); fxSprites(); FX.last = performance.now(); FX.raf = requestAnimationFrame(fxFrame); }
if (!sp && FX.on) { FX.on = false; cancelAnimationFrame(FX.raf); fxClear(); t?.classList.remove('fx-hit'); }
FX.key = sp ? sp.k : null;
}
syncFx(); setInterval(syncFx, 15000);
document.addEventListener('visibilitychange', syncFx);
// the title is created by chat.js a moment later, so check once more shortly after start
setTimeout(syncFx, 1500); setTimeout(syncFx, 4000);
/* ---------- Opening animation: tap to skip, then remove it ---------- */
(() => {
const st = $('osStart'); if (!st) return;
const t0 = performance.now();
const done = () => { st.remove(); };
st.addEventListener('click', () => { if (performance.now() - t0 > 1200) { st.style.transition = 'opacity .4s ease'; st.style.opacity = '0'; st.style.pointerEvents = 'none'; setTimeout(done, 450); } });
setTimeout(done, 5700);
})();
/* ---------- Our Space welcome + interface ---------- */
const ow = $('osWelcome');
const OW_GLYPHS = { gold: ['✦', '·', '✧'], xmas: ['❄', '❅', '✦'], ny: ['✦', '✧', '★'], val: ['❤', '✿', '♥'] };
let owOpen = false, owTok = 0, owTimers = [], fwTimer = 0, owSpecial = null;
const owLater = (fn, ms) => { const id = setTimeout(fn, ms); owTimers.push(id); };
function owDustBuild(theme, icon) {
const g = (OW_GLYPHS[theme] || OW_GLYPHS.gold).slice(); if (icon && theme === 'val') g.push(icon);
$('owDust').innerHTML = Array.from({ length: reduceMotion ? 10 : 34 }, () => {
const c = g[(Math.random() * g.length) | 0];
return `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--s:${(8 + Math.random() * 14).toFixed(0)}px;--t:${(7 + Math.random() * 8).toFixed(1)}s;--dl:${(-Math.random() * 12).toFixed(1)}s;--sw:${((Math.random() - .5) * 60).toFixed(0)}px">${c}</i>`;
}).join('');
}
function owBurst(x, y, n, r) {
const box = $('owFw'), c = document.createElement('div');
c.className = 'fw'; c.style.left = x + '%'; c.style.top = y + '%';
c.innerHTML = Array.from({ length: n }, (_, i) => `<b style="--a:${(360 / n) * i}deg;--r:${r * (.7 + Math.random() * .5)}px;--c:${['#ffe7a8', '#f6c85a', '#fff', '#ffb8cf'][(Math.random() * 4) | 0]}"></b>`).join('');
box.appendChild(c); setTimeout(() => c.remove(), 1400);
}
function owReveal() {
if (!owOpen || !ow.classList.contains('stage') || ow.classList.contains('revealed')) return;
ow.classList.add('revealed'); navigator.vibrate?.(14);
owBurst(50, 46, 22, 150);
if (!reduceMotion) {
owLater(() => owBurst(26, 30, 14, 90), 350); owLater(() => owBurst(76, 36, 14, 90), 600);
if (owSpecial && (owSpecial.theme === 'ny' || owSpecial.theme === 'gold')) {
fwTimer = setInterval(() => owBurst(12 + Math.random() * 76, 12 + Math.random() * 50, 16, 80 + Math.random() * 60), 900);
}
}
}
function openSpace() {
if (owOpen || !ow) return;
owOpen = true; const tok = ++owTok; owSpecial = activeSpecial();
ow.className = 'ow t-' + (owSpecial ? owSpecial.theme : 'gold');
owDustBuild(owSpecial ? owSpecial.theme : 'gold', owSpecial?.icon);
if (owSpecial) {
$('owGiftIc').textContent = owSpecial.icon; $('owEmoji').textContent = owSpecial.icon;
$('owSmall').textContent = owSpecial.small; $('owWishTitle').textContent = owSpecial.title; $('owMsg').textContent = owSpecial.msg;
$('owDate').textContent = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
ow.classList.add('has-wish');
}
ow.classList.add('active'); ow.setAttribute('aria-hidden', 'false');
document.documentElement.style.overflow = 'hidden';
void ow.offsetWidth; ow.classList.add('play');
owLater(() => { if (tok === owTok) ow.classList.add('stage'); }, reduceMotion ? 500 : 4300);
}
function closeSpace() {
if (!owOpen) return;
owOpen = false; owTok++;
owTimers.forEach(clearTimeout); owTimers = []; clearInterval(fwTimer);
ow.classList.remove('active'); ow.setAttribute('aria-hidden', 'true');
document.documentElement.style.overflow = '';
setTimeout(() => { if (!owOpen) { $('owFw').innerHTML = ''; $('owDust').innerHTML = ''; ow.classList.remove('play', 'stage', 'revealed'); } }, 700);
}
O().openSpace = openSpace; O().closeSpace = closeSpace;
$('owClose')?.addEventListener('click', closeSpace);
$('owGift')?.addEventListener('click', owReveal);
