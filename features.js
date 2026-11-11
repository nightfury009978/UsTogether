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

function addMenu(label, fn) {
  const m = label.match(/^(\S+)\s+(.*)$/);
  const li = document.createElement('li');
  li.innerHTML = `<span class="di-icon">${m[1]}</span><span class="di-label">${m[2]}</span><span class="chevron">&rsaquo;</span>`;
  li.onclick = () => { $('closeDrawerBtn').click(); fn(); };
  $('settingsList').appendChild(li);
}

/* ---------- Dark mode ---------- */
function applyTheme(m) {
  document.documentElement.dataset.theme = m;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', m === 'dark' ? '#1c1411' : '#cf9b7a');
}
applyTheme(LS.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
addMenu('🌙 Dark / Light mode', () => {
  const m = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  LS.set('theme', m); applyTheme(m);
});

/* ---------- Install prompt ---------- */
let installEvt;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); installEvt = e;
  addMenu('📲 Install app', () => { installEvt?.prompt(); installEvt = null; });
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
addMenu('🔒 App PIN lock', async () => {
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
addMenu('🔔 Task reminders', async () => {
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
addMenu('💞 Set our anniversary', pickAnniv);
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

/* ---------- Memory actions: photo view, pin, edit, delete ---------- */
function renderActions({ id, data }) {
  const box = $('memActions'); box.innerHTML = '';
  if (data.photo) { const im = new Image(); im.src = data.photo; im.className = 'mem-photo'; box.appendChild(im); }
  const row = document.createElement('div'); row.className = 'mem-btn-row';
  const ref = () => doc(O().db, 'memories', id);
  const done = () => $('memoryRevealOverlay').click();
  const mk = (t, fn) => { const b = document.createElement('button'); b.textContent = t; b.onclick = fn; row.appendChild(b); };
  mk(data.pinned ? '⭐ Unpin' : '☆ Pin', async () => { await updateDoc(ref(), { pinned: !data.pinned }); done(); });
  if (data.author === O().name()) {
    mk('✏️ Edit', async () => {
      const v = prompt('Edit memory', data.text);
      if (v && v.trim()) { await updateDoc(ref(), { text: v.trim(), editedAt: serverTimestamp() }); done(); say('Updated', 'success'); }
    });
    mk('🗑️ Delete', async () => { if (confirm('Delete this memory?')) { await deleteDoc(ref()); done(); say('Deleted', 'info'); } });
  }
  box.appendChild(row);
}
function initActions() {
  const ov = $('memoryRevealOverlay');
  const box = document.createElement('div');
  box.id = 'memActions'; box.onclick = (e) => e.stopPropagation(); ov.appendChild(box);
  new MutationObserver(() => { if (!ov.classList.contains('active')) box.innerHTML = ''; })
    .observe(ov, { attributes: true, attributeFilter: ['class'] });
  addEventListener('memory-open', (e) => renderActions(e.detail));
  $('moodFilterSelect').insertBefore(new Option('⭐ Pinned', 'pinned'), $('moodFilterSelect').children[1]);
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
      b.onclick = () => { O().reveal({ mood: data.mood, text: data.text, author: data.author, dateStr: O().fmt(d) }, 'view'); renderActions({ id, data }); };
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

/* ---------- Start once logged in ---------- */
let started = false;
onAuthStateChanged(O().auth, (u) => {
  if (!u || started) return;
  started = true;
  initAnniv(); initOnThisDay(); initPhoto(); initActions();
  setTimeout(checkReminders, 4000);
  setInterval(checkReminders, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => !document.hidden && checkReminders());
  if (new URLSearchParams(location.search).get('open') === 'todo') setTimeout(() => $('openTodoBtn').click(), 700);
});
