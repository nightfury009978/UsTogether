import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const O = () => window.OS;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const recent = (ts) => ts && Date.now() - ts.seconds * 1000 < 120000;
const clip = (s, n = 80) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; };

/* =========================================================
   Swipeable top notifications  (window.OSNotify.push)
   ========================================================= */
document.body.insertAdjacentHTML('beforeend', '<div id="ntfWrap" class="ntf-wrap"></div>');
const wrap = $('ntfWrap');

function dismiss(el, dx = 0, dy = -60) {
  if (el.dataset.gone) return; el.dataset.gone = '1';
  el.style.transition = 'transform .25s ease, opacity .25s ease';
  el.style.transform = `translate(${dx}px, ${dy}px)`; el.style.opacity = '0';
  setTimeout(() => el.remove(), 260);
}
function push(n) {
  if (n.key) wrap.querySelectorAll('.ntf').forEach((x) => { if (x.dataset.key === n.key) x.remove(); });
  const el = document.createElement('div');
  el.className = 'ntf'; if (n.key) el.dataset.key = n.key;
  el.innerHTML = `<span class="ntf-ic">${esc(n.icon || '💖')}</span><span class="ntf-tx"><b>${esc(n.title)}</b><i>${esc(n.body || '')}</i></span>`;
  wrap.prepend(el);
  while (wrap.children.length > 3) wrap.lastChild.remove();
  navigator.vibrate?.(12);
  const t = setTimeout(() => dismiss(el), 6000);

  let x0 = 0, y0 = 0, dx = 0, dy = 0, down = false;
  el.addEventListener('pointerdown', (e) => { down = true; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; clearTimeout(t); });
  el.addEventListener('pointermove', (e) => {
    if (!down) return; dx = e.clientX - x0; dy = Math.min(0, e.clientY - y0);
    el.style.transform = `translate(${dx}px, ${dy}px)`; el.style.opacity = String(Math.max(.2, 1 - Math.abs(dx) / 260));
  });
  const up = () => {
    if (!down) return; down = false;
    if (Math.abs(dx) > 70 || dy < -35) return dismiss(el, dx > 0 ? 400 : dx < 0 ? -400 : 0, dy < -35 ? -90 : 0);
    el.style.transition = 'transform .2s ease, opacity .2s ease'; el.style.transform = ''; el.style.opacity = '';
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) { dismiss(el, 0, -40); n.onTap?.(); }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  /* background tab: also show a system notification if allowed */
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
      if (ch.type === 'added' && recent(d.createdAt)) push({ icon: d.mood || '💖', title: `${d.author} shared a memory`, body: clip(d.text), key: 'mem:' + id, onTap: () => document.querySelector('.timeline-container')?.scrollIntoView({ behavior: 'smooth' }) });
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
      const open = () => $('openTodoBtn')?.click();
      if (ch.type === 'added' && d.createdBy && d.createdBy !== me() && recent(d.createdAt)) push({ icon: '📌', title: `${d.createdBy} added a task`, body: clip(d.task), key: 'todo:' + id, onTap: open });
      else if (ch.type === 'modified' && prev) {
        if (!prev.c && d.completed) push({ icon: '✅', title: 'Task completed', body: clip(d.task), key: 'todo:' + id, onTap: open });
        else if (prev.t !== d.task) push({ icon: '✏️', title: 'Task edited', body: clip(d.task), key: 'todo:' + id, onTap: open });
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
      push({ icon: '📖', title: `${d.author} added a chapter`, body: clip(d.title), key: 'story:' + ch.doc.id, onTap: () => $('openStoriesMenuBtn')?.click() });
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
