import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const O = () => window.OS;

/* =========================================================
   1. BACK BUTTON / SWIPE-BACK ROUTER
   Every sheet, popup, drawer and the memory viewer gets its own
   history entry, so Back closes the top layer instead of leaving
   the site. Closing with the X / overlay removes the entry again.
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

const isOpen = (l) => l.el.classList.contains('active') && !l.el.classList.contains('posting');
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
    history.go(-n);
  }
}
const queueSync = () => { clearTimeout(timer); timer = setTimeout(sync, 30); };

const mo = new MutationObserver(queueSync);
LAYERS.forEach((l) => mo.observe(l.el, { attributes: true, attributeFilter: ['class'] }));

addEventListener('popstate', (e) => {
  if (expecting) { expecting = false; return; }
  if (e.state && e.state.ui) return;          // forward onto a stale entry: ignore
  if (depth > 0) depth--;
  const top = stack[stack.length - 1];
  if (top) top.close();                        // observer will see it close; counts already match
});

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
   3. EXTRA MENU ITEMS: Surprise me, Export backup
   ========================================================= */
function addItem(listId, label, fn) {
  const m = label.match(/^(\S+)\s+(.*)$/);
  const li = document.createElement('li');
  li.innerHTML = `<span class="di-icon">${m[1]}</span><span class="di-label">${m[2]}</span><span class="chevron">&rsaquo;</span>`;
  li.onclick = () => { $('closeDrawerBtn').click(); setTimeout(fn, 320); };
  $(listId).appendChild(li);
}

addItem('memoriesList', '🎲 Surprise me', () => {
  const all = O().memories();
  if (!all.length) return O().toast('No memories yet', 'info');
  const { id, data } = all[Math.floor(Math.random() * all.length)];
  const d = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
  setOrigin(0, 0);
  O().reveal({ mood: data.mood, text: data.text, author: data.author, dateStr: O().fmt(d) }, 'view');
  dispatchEvent(new CustomEvent('memory-open', { detail: { id, data } }));
});

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
