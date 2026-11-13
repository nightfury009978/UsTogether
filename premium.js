import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const O = () => window.OS;

/* =========================================================
   1. STRUCTURED BACK BUTTON / SWIPE-BACK ROUTER
   Every layer (menu, sheets, popups, chat screens...) owns one
   history entry. Back/swipe closes the top layer, one step at a time,
   and never leaves the site until nothing is open.
   ========================================================= */
const LAYERS = [
  ['menuDrawer', 'closeDrawerBtn'],
  ['todoBottomSheet', 'closeTodoSheetBtn'],
  ['todoHistoryBottomSheet', 'closeTodoHistorySheetBtn'],
  ['memoryHistoryBottomSheet', 'closeMemoryHistorySheetBtn'],
  ['storyBottomSheet', 'closeStorySheetBtn'],
  ['moodPickerPopup', 'moodPickerOverlay'],
  ['memoryRevealOverlay', 'memoryRevealOverlay'],
  ['deleteConfirmModal', 'cancelDeleteBtn']
].map(([el, closer]) => ({ el: $(el), close: () => $(closer)?.click() })).filter((l) => l.el);

const isOpen = (l) => (l.test ? !!l.test() : (l.el.classList.contains('active') && !l.el.classList.contains('posting')));
const stack = [];          // open layers, oldest first
let depth = 0;             // history entries we have pushed
let expecting = false;     // true while a history.go() we triggered is in flight
let timer;

if (history.state && history.state.ui) history.replaceState(null, '');

function sync() {
  if (expecting) { timer = setTimeout(sync, 60); return; }
  LAYERS.forEach((l) => {
    const open = isOpen(l), i = stack.indexOf(l);
    if (open && i < 0) stack.push(l);
    if (!open && i >= 0) stack.splice(i, 1);
  });
  while (depth < stack.length) history.pushState({ ui: ++depth }, '');
  if (depth > stack.length) {
    const n = depth - stack.length;
    depth = stack.length;
    expecting = true;
    setTimeout(() => { expecting = false; }, 900);   // safety net
    history.go(-n);
  }
}
const queueSync = () => { clearTimeout(timer); timer = setTimeout(sync, 30); };

const mo = new MutationObserver(queueSync);
LAYERS.forEach((l) => mo.observe(l.el, { attributes: true, attributeFilter: ['class'] }));

addEventListener('popstate', (e) => {
  if (expecting) { expecting = false; return; }
  const target = (e.state && e.state.ui) || 0;     // depth of the entry we landed on
  if (target < depth) {
    const n = depth - target;
    depth = target;
    stack.slice(-n).reverse().forEach((l) => l.close());   // close exactly the layers we stepped back over
    queueSync();
  } else if (target > depth) {                     // forward onto a stale entry: step back again
    expecting = true;
    setTimeout(() => { expecting = false; }, 900);
    history.go(depth - target);
  }
});

/* other modules register their own layers here */
window.OSBack = {
  add(el, close, test) {
    if (!el || LAYERS.some((l) => l.el === el)) return;
    LAYERS.push({ el, close, test });
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    queueSync();
  }
};

/* =========================================================
   2. WATER-BUBBLE ORIGIN: viewer grows from / shrinks back to the tapped bubble
   ========================================================= */
const rb = $('memoryRevealBubble');
const setOrigin = (x, y) => { rb.style.setProperty('--tx', x + 'px'); rb.style.setProperty('--ty', y + 'px'); };
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('.field-bubble');
  if (b) {
    const r = b.getBoundingClientRect();
    setOrigin(r.left + r.width / 2 - innerWidth / 2, r.top + r.height / 2 - (innerHeight / 2 - 14));
    navigator.vibrate?.(8);
  } else if (e.target.closest?.('#otdCard, #saveBtn')) setOrigin(0, 0);
}, true);

/* =========================================================
   3. EXTRA MENU ITEM: Export backup
   ========================================================= */
function addItem(listId, label, fn) {
  const m = label.match(/^(\S+)\s+(.*)$/);
  const li = document.createElement('li');
  li.innerHTML = `<span class="di-icon">${m[1]}</span><span class="di-label">${m[2]}</span><span class="chevron">&rsaquo;</span>`;
  li.onclick = () => { $('closeDrawerBtn').click(); setTimeout(fn, 320); };
  $(listId).appendChild(li);
}

addItem('settingsList', '💾 Export backup', async () => {
  try {
    O().toast('Preparing backup…', 'info');
    const grab = async (name) => (await getDocs(collection(O().db, name))).docs.map((d) => ({ id: d.id, ...d.data() }));
    const out = { exportedAt: new Date().toISOString(), memories: await grab('memories'), todos: await grab('todos'), todo_history: await grab('todo_history'), stories: await grab('stories') };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `our-space-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    O().toast('Backup saved 💾', 'success');
  } catch { O().toast("Couldn't create backup", 'error'); }
});

/* =========================================================
   4. COLLAPSIBLE MENU GROUPS (one open at a time)
   ========================================================= */
document.addEventListener('click', (e) => {
  const head = e.target.closest?.('.acc-head'); if (!head) return;
  const acc = head.parentElement, willOpen = !acc.classList.contains('open');
  document.querySelectorAll('.acc.open').forEach((a) => { a.classList.remove('open'); a.querySelector('.acc-head')?.setAttribute('aria-expanded', 'false'); });
  if (willOpen) { acc.classList.add('open'); head.setAttribute('aria-expanded', 'true'); }
});

/* =========================================================
   5. REMOVE THE APP PIN LOCK (menu item + any saved lock)
   ========================================================= */
try { localStorage.removeItem('pinHash'); localStorage.removeItem('bioId'); } catch {}
$('lockScreen')?.remove();
const dropPin = () => document.querySelectorAll('#settingsList li').forEach((li) => { if (/PIN lock/i.test(li.textContent)) li.remove(); });
dropPin();
if ($('settingsList')) new MutationObserver(dropPin).observe($('settingsList'), { childList: true });

/* =========================================================
   6. DOWNLOAD THE ANDROID APP (APK)
   Put your APK in the repo root with this exact name.
   ========================================================= */
const APK_URL = './UsTogether.apk';
addItem('settingsList', '📥 Download Android app', async () => {
  try {
    const r = await fetch(APK_URL, { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) throw new Error('missing');
    const a = document.createElement('a');
    a.href = APK_URL; a.download = 'UsTogether.apk';
    document.body.appendChild(a); a.click(); a.remove();
    O().toast('Downloading… open the file when done and allow “Install unknown apps” if asked.', 'success');
  } catch { O().toast('The APK isn’t uploaded to the site yet.', 'error'); }
});

/* =========================================================
   4. Accordion menu, Android app download, PIN lock removed
   ========================================================= */
const groups = [...document.querySelectorAll('.dr-group')];
const collapseAll = () => groups.forEach((g) => { g.classList.remove('open'); g.querySelector('.dr-head')?.setAttribute('aria-expanded', 'false'); });
groups.forEach((g) => g.querySelector('.dr-head').addEventListener('click', () => {
  const willOpen = !g.classList.contains('open');
  collapseAll();
  if (willOpen) { g.classList.add('open'); g.querySelector('.dr-head').setAttribute('aria-expanded', 'true'); }
}));
new MutationObserver(() => { if (!$('menuDrawer').classList.contains('active')) setTimeout(collapseAll, 350); })
  .observe($('menuDrawer'), { attributes: true, attributeFilter: ['class'] });

/* PIN lock is gone: remove its menu item and any saved PIN so nobody gets locked out */
document.querySelectorAll('#settingsList li').forEach((li) => { if (/PIN lock/i.test(li.textContent)) li.remove(); });
try { localStorage.removeItem('pinHash'); localStorage.removeItem('bioId'); } catch {}
$('lockScreen')?.classList.remove('active');

/* Android app (APK) download — put OurSpace.apk in the repo root */
addItem('settingsList', '📱 Download Android app', async () => {
  try {
    const r = await fetch('OurSpace.apk', { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) throw new Error('missing');
    const a = document.createElement('a');
    a.href = 'OurSpace.apk'; a.download = 'OurSpace.apk';
    document.body.appendChild(a); a.click(); a.remove();
    O().toast('Downloading the app…', 'success');
  } catch { O().toast('The app file (OurSpace.apk) hasn’t been added to the site yet', 'error'); }
});
