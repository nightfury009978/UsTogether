import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const $ = (id) => document.getElementById(id);
const O = () => window.OS;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const recent = (ts) => ts && Date.now() - ts.seconds * 1000 < 120000;
const clip = (s, n = 80) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; };
/* =========================================================
Swipeable top notifications (window.OSNotify.push)
========================================================= */
document.body.insertAdjacentHTML('beforeend', '<div id="ntfWrap" class="ntf-wrap"></div>');
const wrap = $('ntfWrap');
const LABELS = { chat: 'Messages', memory: 'Memories', task: 'To-do', story: 'Story book', love: 'Anniversary', friend: 'Friends', general: 'Our Space' };
const TYPES = { chat: 'chat', mem: 'memory', todo: 'task', story: 'story', anniv: 'love', rq: 'friend' };
const typeOf = (key) => TYPES[String(key || '').split(':')[0]] || 'general';
const SHOW_MS = 6500;
const ago = (t) => { const s = Math.floor((Date.now() - t) / 1000); return s < 10 ? 'now' : s < 60 ? s + 's ago' : s < 3600 ? Math.floor(s / 60) + 'm ago' : Math.floor(s / 3600) + 'h ago'; };
setInterval(() => wrap.querySelectorAll('.ntf').forEach((e) => { const t = e.querySelector('.ntf-time'); if (t) t.textContent = ago(+e.dataset.at); }), 10000);
const deck = [];
let deckEl = null, track = null, hideT = 0;
const hideDeck = () => {
clearTimeout(hideT); deck.length = 0;
if (deckEl) { const d = deckEl; deckEl = track = null; d.classList.add('leaving'); setTimeout(() => d.remove(), 280); }
};
const armHide = (ms) => { clearTimeout(hideT); hideT = setTimeout(hideDeck, ms || SHOW_MS + (deck.length > 1 ? 3000 : 0)); };
function meta() {
if (!track || !deckEl) return;
const n = deck.length, i = Math.min(n - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
deckEl.querySelector('.ntf-pos').textContent = n > 1 ? `${i + 1} / ${n}` : '';
const shown = Math.min(n, 8);
deckEl.querySelector('.ntf-dots').innerHTML = n > 1 ? Array.from({ length: shown }, (_, k) => `<i${k === Math.min(i, shown - 1) ? ' class="on"' : ''}></i>`).join('') : '';
deckEl.classList.toggle('multi', n > 1);
}
function slide(it) {
const n = it.n, el = document.createElement('div');
el.className = 'ntf'; el.dataset.type = it.type; el.dataset.at = String(it.at); el.dataset.count = String(it.count);
if (it.key) el.dataset.key = it.key;
el.setAttribute('role', 'status');
el.innerHTML =
`<span class="ntf-ic">${esc(n.icon || '💖')}</span>` +
`<span class="ntf-tx"><span class="ntf-top"><em>${esc(n.label || LABELS[it.type])}</em><span class="ntf-time">${ago(it.at)}</span></span>` +
`<b>${esc(n.title)}${it.count > 1 ? `<span class="ntf-n">${it.count} new</span>` : ''}</b><i>${esc(n.body || '')}</i></span>` +
`<button class="ntf-x" aria-label="Dismiss">✕</button>`;
el.addEventListener('click', (e) => { const x = e.target.closest('.ntf-x'); removeItem(it); if (!x) n.onTap?.(); });
return el;
}
/* Pop-ups appear in the empty space between "Our Space" and "Our Sacred Diary" on the home screen.
Anywhere else (chat, sheets, scrolled down) they fall back to the top of the screen. */
const BLOCK = '#menuDrawer.active,#todoBottomSheet.active,#todoHistoryBottomSheet.active,#storyBottomSheet.active,#memNotes.active,#osWelcome.active,#postPage.active,#frPage.active,#chatApp.active,#moodPickerPopup.active,#memoryRevealOverlay.active';
function relocate() {
if (!deckEl) return;
const slot = document.getElementById('bnSlot'), hd = document.querySelector('.bn-head'), r = hd && hd.getBoundingClientRect();
const home = slot && r && r.height && r.bottom > 40 && r.top < innerHeight * .6 && !document.querySelector(BLOCK);
const host = home ? slot : wrap;
if (deckEl.parentNode !== host) { if (home) host.prepend(deckEl); else host.appendChild(deckEl); }
}
setInterval(relocate, 400);
function render() {
if (!deck.length) { hideDeck(); return; }
if (!deckEl) {
wrap.insertAdjacentHTML('beforeend', '<div class="ntf-deck"><div class="ntf-track"></div><div class="ntf-meta"><span class="ntf-pos"></span><span class="ntf-dots"></span></div></div>');
deckEl = wrap.lastElementChild; track = deckEl.querySelector('.ntf-track'); relocate();
track.addEventListener('scroll', () => { meta(); armHide(4500); }, { passive: true });
deckEl.addEventListener('pointerdown', () => clearTimeout(hideT));
['pointerup', 'pointercancel'].forEach((k) => deckEl.addEventListener(k, () => armHide(4500)));
}
track.innerHTML = '';
deck.forEach((it) => track.appendChild(slide(it)));
meta();
}
function removeItem(it) {
const i = deck.indexOf(it); if (i < 0) return;
const keep = track ? track.scrollLeft : 0;
deck.splice(i, 1); render();
if (track && deck.length) track.scrollLeft = Math.min(keep, (deck.length - 1) * track.clientWidth);
if (deck.length) armHide(4500);
}
function push(n) {
const type = typeOf(n.key);
let count = 1;
if (n.key) {
const old = deck.find((x) => x.key === n.key);
if (old) { if (type === 'chat') count = (old.count || 1) + 1; deck.splice(deck.indexOf(old), 1); }
}
deck.unshift({ key: n.key, type, at: n.at || Date.now(), count, n });
if (deck.length > 8) deck.length = 8;
render(); track.scrollLeft = 0;
navigator.vibrate?.(12);
armHide();
/* background tab: also show a system notification if allowed (unchanged behaviour) */
if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
navigator.serviceWorker?.ready.then((r) => r.showNotification(n.title, { body: n.body || '', icon: 'icons/icon-192.png', tag: n.key || 'os' })).catch(() => {});
}
}
window.OSNotify = { push };
/* =========================================================
Anniversary: one shared date, either of you can edit
========================================================= */
let cur = {};
document.body.insertAdjacentHTML('beforeend', `
<div id="annivModal" class="ax-modal"><div class="ax-card">
<div class="ax-emoji">💞</div><h3>Our anniversary</h3><p id="axSub"></p>
<input type="date" id="axDate">
<button id="axSave" class="ax-btn">Save</button><button id="axCancel" class="ax-link">Cancel</button>
</div></div>`);
const ax = $('annivModal');
const closeAx = () => ax.classList.remove('active');
window.OSBack?.add(ax, closeAx);
ax.addEventListener('click', (e) => { if (e.target === ax) closeAx(); });
$('axCancel').onclick = closeAx;
function openAx() {
$('axDate').value = cur.startDate || '';
$('axSub').textContent = cur.updatedBy
? `Last set by ${cur.updatedBy}. Either of you can change it, and it updates on both phones.`
: 'Pick the day you got together. It shows on both phones, and either of you can change it.';
ax.classList.add('active');
}
$('axSave').onclick = async () => {
const v = $('axDate').value;
if (!v) return O().toast('Pick a date', 'error');
try {
await setDoc(doc(O().db, 'settings', 'couple'), { startDate: v, updatedBy: O().name(), updatedAt: serverTimestamp() }, { merge: true });
O().toast('Saved 💞', 'success'); closeAx();
} catch { O().toast("Couldn't save date", 'error'); }
};
/* take over the old prompt() flow (menu item + the days-together card) */
document.addEventListener('click', (e) => {
const li = e.target.closest?.('#settingsList li');
if (li && /anniversary/i.test(li.textContent)) {
e.stopPropagation(); e.preventDefault();
$('closeDrawerBtn').click(); setTimeout(openAx, 320);
} else if (e.target.closest?.('#annivCard')) {
e.stopPropagation(); e.preventDefault(); openAx();
}
}, true);
/* =========================================================
Live notifications for everything your partner does
========================================================= */
let unsubs = [];
onAuthStateChanged(O().auth, (u) => {
unsubs.forEach((f) => f()); unsubs = [];
if (u) start();
});
function start() {
const db = O().db, me = () => O().name();
const err = (e) => console.warn('notify listener', e);
/* memories: new + edited */
const mem = new Map(); let mFirst = true;
unsubs.push(onSnapshot(query(collection(db, 'memories'), orderBy('createdAt', 'desc'), limit(40)), (snap) => {
snap.docChanges().forEach((ch) => {
const d = ch.doc.data(), id = ch.doc.id, ed = d.editedAt?.seconds || 0, pend = ch.doc.metadata.hasPendingWrites;
if (ch.type === 'removed') { mem.delete(id); return; }
const prev = mem.get(id); mem.set(id, ed);
if (mFirst || pend || !d.author || d.author === me()) return;
if (ch.type === 'added' && recent(d.createdAt)) push({ icon: d.mood || '💖', title: `${d.author} shared a memory`, body: clip(d.text), key: 'mem:' + id, onTap: () => O().openMemories?.(id) });
else if (ch.type === 'modified' && ed > (prev || 0) && Date.now() - ed * 1000 < 120000) push({ icon: '✏️', title: `${d.author} edited a memory`, body: clip(d.text), key: 'mem:' + id });
});
mFirst = false;
}, err));
/* to-dos: new, completed, edited */
const todo = new Map(); let tFirst = true;
unsubs.push(onSnapshot(collection(db, 'todos'), (snap) => {
snap.docChanges().forEach((ch) => {
const d = ch.doc.data(), id = ch.doc.id, pend = ch.doc.metadata.hasPendingWrites;
if (ch.type === 'removed') { todo.delete(id); return; }
const prev = todo.get(id); todo.set(id, { c: !!d.completed, t: d.task });
if (tFirst || pend) return;
const open = () => O().openTodo?.();
if (ch.type === 'added' && d.createdBy && d.createdBy !== me() && recent(d.createdAt)) push({ icon: '📌', title: `${d.createdBy} added a task`, body: clip(d.task), key: 'todo:' + id, onTap: open });
else if (ch.type === 'modified' && prev) {
if (!prev.c && d.completed) push({ icon: '✅', title: 'Task completed', body: clip(d.task), key: 'todo:' + id, onTap: open });
else if (prev.t !== d.task) push({ icon: '✏️', title: 'Task edited', body: clip(d.task),key: 'todo:' + id, onTap: open });
}
});
tFirst = false;
}, err));
/* story chapters */
let sFirst = true;
unsubs.push(onSnapshot(query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(20)), (snap) => {
snap.docChanges().forEach((ch) => {
const d = ch.doc.data();
if (sFirst || ch.type !== 'added' || ch.doc.metadata.hasPendingWrites || !d.author || d.author === me() || !recent(d.createdAt)) return;
push({ icon: '📖', title: `${d.author} added a chapter`, body: clip(d.title), key: 'story:' + ch.doc.id, onTap: () => O().openStory?.() });
});
sFirst = false;
}, err));
/* anniversary */
let aFirst = true;
unsubs.push(onSnapshot(doc(db, 'settings', 'couple'), (s) => {
const d = s.data() || {}; cur = d;
if (!aFirst && !s.metadata.hasPendingWrites && d.updatedBy && d.updatedBy !== me() && recent(d.updatedAt)) {
push({ icon: '💞', title: `${d.updatedBy} updated your anniversary`, body: d.startDate, key: 'anniv' });
}
aFirst = false;
}, err));
}
