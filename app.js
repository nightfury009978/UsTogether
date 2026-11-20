// Register service worker (PWA)
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
// (The old start splash was removed: login / sign-up now show as soon as Firebase answers.)
let splashDone = true;
let authKnown = false; // Firebase told us whether someone is logged in
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
getAuth,
signInWithEmailAndPassword,
createUserWithEmailAndPassword,
onAuthStateChanged,
signOut,
deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
initializeFirestore,
persistentLocalCache,
collection,
addDoc,
onSnapshot,
query,
orderBy,
serverTimestamp,
deleteDoc,
doc,
updateDoc,
getDocs,
where,
setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Firebase Credentials
const firebaseConfig = {
apiKey: "AIzaSyBndZhDQVGVmrAgzwizheVErOfMz8nukYQ",
authDomain: "ustogether-14936.firebaseapp.com",
projectId: "ustogether-14936",
storageBucket: "ustogether-14936.firebasestorage.app",
messagingSenderId: "685510249495",
appId: "1:685510249495:web:3efd43596ca0cb621a6052"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Offline-capable Firestore (works with no signal, syncs later)
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
// ---------- Toast Notification Helper ----------
const toastContainer = document.getElementById('toastContainer');
function toast(message, type = 'info') {
if (!toastContainer) { console.log(message); return; }
const el = document.createElement('div');
el.className = `toast ${type}`;
el.textContent = message;
toastContainer.appendChild(el);
setTimeout(() => el.remove(), 3000);
}
// ---------- Safety + speed helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const debounce = (f, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
// ---------- Shine-name helper (used everywhere a username is shown) ----------
function shineName(name) {
return `<span class="shine-name">${esc(name)}</span>`;
}
// ---------- Date helpers ----------
function pad2(n) { return String(n).padStart(2, '0'); }
function formatDMY(dateObj) {
return `${pad2(dateObj.getDate())}/${pad2(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
}
function formatDMYShort(dateObj) {
return `${pad2(dateObj.getDate())}/${pad2(dateObj.getMonth() + 1)}`;
}
function formatTimeHM(dateObj) {
return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function getTodayDateKey() {
const d = new Date();
return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
// ---------- Badges (emoji + cute name). The emoji is still saved as "mood" so older memories keep working ----------
const BADGES = [
['💖', 'Love'], ['🥰', 'Adore'], ['😘', 'Kisses'], ['🌹', 'Romance'], ['💌', 'Love Note'], ['🧸', 'Cuddles'],
['🤗', 'Hugs'], ['💍', 'Forever'], ['🏡', 'Home'], ['🌙', 'Dreamy'], ['✨', 'Magic'], ['🌸', 'Blossom'],
['🦋', 'Butterflies'], ['🌈', 'Joyful'], ['🎀', 'Sweetie'], ['🍓', 'Sweet'], ['🍫', 'Chocolate'], ['☕', 'Cozy'],
['🍰', 'Treat'], ['🎶', 'Melody'], ['📸', 'Snapshot'], ['🌅', 'Sunset'], ['🎁', 'Surprise'], ['😂', 'Giggles'],
['🙈', 'Shy'], ['🥺', 'Missing You'], ['😴', 'Sleepy'], ['🔥', 'Passion'], ['🍀', 'Lucky'], ['🎂', 'Celebrate'],
['⭐', 'Star'], ['🌻', 'Sunshine'], ['🐾', 'Cutie'], ['🕊️', 'Peace']
];
// DOM Elements
const authOverlay = document.getElementById('authOverlay');
const authTitle = document.getElementById('authTitle');
const authSub = document.getElementById('authSub');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const authToggleWrap = document.getElementById('authToggleWrap');
const currentUserLabel = document.getElementById('currentUserLabel');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuDrawer = document.getElementById('menuDrawer');
const menuOverlay = document.getElementById('menuOverlay');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const permDeleteSubBtn = document.getElementById('permDeleteSubBtn');
const todoInput = document.getElementById('todoInput');
const todoPriority = document.getElementById('todoPriority');
const todoDueDate = document.getElementById('todoDueDate');
const todoSearchInput = document.getElementById('todoSearchInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const todoProgressFill = document.getElementById('todoProgressFill');
const todoProgressText = document.getElementById('todoProgressText');
const deleteModal = document.getElementById('deleteConfirmModal');
const timerBadge = document.getElementById('deleteTimerBadge');
const confirmBtn = document.getElementById('confirmDeleteBtn');
const cancelBtn = document.getElementById('cancelDeleteBtn');
const memoryInput = document.getElementById('memoryInput');
const saveBtn = document.getElementById('saveBtn');
// Mood picker popup
const moodTriggerBtn = document.getElementById('moodTriggerBtn');
const moodTriggerEmoji = document.getElementById('moodTriggerEmoji');
const moodTriggerName = document.getElementById('moodTriggerName');
const moodPickerOverlay = document.getElementById('moodPickerOverlay');
const moodPickerPopup = document.getElementById('moodPickerPopup');
const moodOptionsContainer = document.getElementById('moodOptionsContainer');
// Memory reveal overlay
const memoryRevealOverlay = document.getElementById('memoryRevealOverlay');
const memoryRevealBubble = document.getElementById('memoryRevealBubble');
const memoryRevealMood = document.getElementById('memoryRevealMood');
const memoryRevealBadge = document.getElementById('memoryRevealBadge');
const memoryRevealText = document.getElementById('memoryRevealText');
const memoryRevealMeta = document.getElementById('memoryRevealMeta');
// To-Do Sticky Modal Controls
const todoModalOverlay = document.getElementById('todoModalOverlay');
const todoBottomSheet = document.getElementById('todoBottomSheet');
const closeTodoSheetBtn = document.getElementById('closeTodoSheetBtn');
// To-Do History Sub-Menu Controls
const openTodoHistoryBtn = document.getElementById('openTodoHistoryBtn');
const todoHistoryModalOverlay = document.getElementById('todoHistoryModalOverlay');
const todoHistoryBottomSheet = document.getElementById('todoHistoryBottomSheet');
const closeTodoHistorySheetBtn = document.getElementById('closeTodoHistorySheetBtn');
const todoHistoryList = document.getElementById('todoHistoryList');
// Main Page Reminder Elements
const mainPageReminder = document.getElementById('mainPageReminder');
const reminderTaskText = document.getElementById('reminderTaskText');
const openTodoFromBanner = document.getElementById('openTodoFromBanner');
const storyModalOverlay = document.getElementById('storyModalOverlay');
const storyBottomSheet = document.getElementById('storyBottomSheet');
const closeStorySheetBtn = document.getElementById('closeStorySheetBtn');
const storyTitleInput = document.getElementById('storyTitleInput');
const storyTextInput = document.getElementById('storyTextInput');
const publishStoryBtn = document.getElementById('publishStoryBtn');
const storiesFeed = document.getElementById('storiesFeed');
let isSignUpMode = false;
let selectedMood = '💖';
let selectedBadge = 'Love';
let currentUser = null;
let deleteTimerInterval = null;
let allMemories = []; // cache for client-side search/filter
let revealAutoCloseTimer = null;
let started = false; // prevents duplicate live listeners on re-login
let unsubHist = null; // to-do history listener
// Helper: Clean Username
function getCleanUsername(user) {
if (!user || !user.email) return "User";
const raw = user.email.split('@')[0];
return raw.charAt(0).toUpperCase() + raw.slice(1);
}
// ============================================================
// MOOD PICKER POPUP (34 total moods)
// ============================================================
function renderMoodOptions() {
if (!moodOptionsContainer) return;
moodOptionsContainer.innerHTML = '';
BADGES.forEach(([emoji, name], i) => {
const btn = document.createElement('button');
btn.type = 'button';
btn.className = `mood-btn ${i === 0 ? 'active' : ''}`;
btn.setAttribute('data-mood', emoji);
btn.setAttribute('data-name', name);
btn.innerHTML = `<span class="bd-ring">${emoji}</span><span class="bd-name">${name}</span>`;
moodOptionsContainer.appendChild(btn);
});
}
function openMoodPicker() {
moodPickerOverlay?.classList.add('active');
moodPickerPopup?.classList.add('active');
}
function closeMoodPicker() {
moodPickerOverlay?.classList.remove('active');
moodPickerPopup?.classList.remove('active');
}
moodTriggerBtn?.addEventListener('click', openMoodPicker);
moodPickerOverlay?.addEventListener('click', closeMoodPicker);
function setupMoodPickers() {
const moodBtns = document.querySelectorAll('.mood-btn');
moodBtns.forEach(btn => {
btn.addEventListener('click', () => {
moodBtns.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
selectedMood = btn.getAttribute('data-mood');
selectedBadge = btn.getAttribute('data-name') || '';
if (moodTriggerEmoji) moodTriggerEmoji.textContent = selectedMood;
if (moodTriggerName) moodTriggerName.textContent = selectedBadge;
closeMoodPicker();
});
});
}
// ============================================================
// MEMORY REVEAL OVERLAY (posting animation + tap-to-view)
// ============================================================
function showMemoryReveal({ mood, badge, text, author, dateStr }, mode) {
clearTimeout(revealAutoCloseTimer);
memoryRevealMood.textContent = mood || '💖';
if (memoryRevealBadge) { memoryRevealBadge.textContent = badge || ''; memoryRevealBadge.style.display = badge ? '' : 'none'; }
memoryRevealText.textContent = text || '';
memoryRevealMeta.innerHTML = `${shineName(author || 'User')} · ${esc(dateStr || '')}`;
memoryRevealOverlay.classList.remove('posting');
void memoryRevealBubble.offsetWidth;
if (mode === 'post') {
memoryRevealOverlay.classList.add('posting');
memoryRevealOverlay.classList.add('active');
revealAutoCloseTimer = setTimeout(closeMemoryReveal, 2100);
} else {
memoryRevealOverlay.classList.add('active');
}
}
function closeMemoryReveal() {
clearTimeout(revealAutoCloseTimer);
memoryRevealOverlay.classList.remove('active');
memoryRevealOverlay.classList.remove('posting');
}
memoryRevealOverlay?.addEventListener('click', closeMemoryReveal);
// ============================================================
// MEMORIES (live list; shown as sticky notes via "Our Memories ✨" in features.js)
// ============================================================
function loadMemories() {
const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
allMemories = snapshot.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
window.dispatchEvent(new Event('memories-updated'));
});
}
// Share Memory -> triggers the full-screen rise & pop animation
saveBtn?.addEventListener('click', async () => {
const text = memoryInput.value.trim();
if (!text) {
toast("Write a memory first.", "error");
return;
}
const displayName = getCleanUsername(currentUser);
try {
await addDoc(collection(db, "memories"), {
text: text,
mood: selectedMood,
badge: selectedBadge,
author: displayName,
photo: window.OS?.photo?.() || '',
pinned: false,
createdAt: serverTimestamp()
});
showMemoryReveal({ mood: selectedMood, badge: selectedBadge, text, author: displayName, dateStr: formatDMY(new Date()) }, 'post');
memoryInput.value = '';
window.OS?.clearPhoto?.();
} catch (err) {
console.error("Error saving memory:", err);
toast("Couldn't save memory. Try again.", "error");
}
});
// ============================================================
// TO-DO LIST
// ============================================================
const priorityWeight = { high: 0, medium: 1, low: 2 };
let allTodos = [];
async function checkAndResetDailyTodos() {
const todayKey = getTodayDateKey();
const snapshot = await getDocs(query(collection(db, "todos")));
snapshot.docs.forEach(async (docSnap) => {
const data = docSnap.data();
if (data.dateKey && data.dateKey !== todayKey) {
try {
if (!data.historyLogged) {
/* unfinished tasks go to History and wait for a tick / cross (same id = never duplicated) */
await setDoc(doc(db, "todo_history", "t_" + docSnap.id), {
task: data.task,
completed: !!data.completed,
status: data.completed ? 'done' : 'unconfirmed',
priority: data.priority || 'medium',
dueDate: data.dueDate || '',
createdBy: data.createdBy,
createdAt: data.createdAt || serverTimestamp(),
completedAt: data.completedAt || null,
dateKey: data.dateKey,
archivedAt: serverTimestamp()
});
}
await deleteDoc(doc(db, "todos", docSnap.id));
} catch (e) { console.warn('todo rollover', e); }
}
});
}
let resetKey = null;
const rollover = () => {
const k = getTodayDateKey();
if (resetKey === null) { resetKey = k; return; }
if (k !== resetKey) { resetKey = k; checkAndResetDailyTodos(); }
};
rollover(); setInterval(rollover, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) rollover(); });
todoInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTodoBtn?.click(); } });
if (addTodoBtn) {
addTodoBtn.addEventListener('click', async () => {
const text = todoInput.value.trim();
if (!text) {
toast("Write a task first.", "error");
return;
}
if (!currentUser) return;
const priority = todoPriority?.value || 'medium';
const dueDate = todoDueDate?.value || '';
try {
await addDoc(collection(db, "todos"), {
task: text,
completed: false,
priority: priority,
dueDate: dueDate,
historyLogged: false,
createdBy: getCleanUsername(currentUser),
createdAt: serverTimestamp(),
dateKey: getTodayDateKey()
});
todoInput.value = '';
toast("Task added ✅", "success");
setTimeout(() => { const sc = document.querySelector('#todoBottomSheet .td-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; }, 350);
} catch (e) {
console.error("Error adding todo:", e);
toast("Couldn't add task. Try again.", "error");
}
});
}
function formatDueDate(dueDateStr) {
if (!dueDateStr) return null;
const due = new Date(dueDateStr + 'T00:00:00');
const today = new Date();
today.setHours(0, 0, 0, 0);
const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
let label;
if (diffDays === 0) label = 'Due today';
else if (diffDays === 1) label = 'Due tomorrow';
else if (diffDays < 0) label = `Overdue · ${due.toLocaleDateString()}`;
else label = `Due ${due.toLocaleDateString()}`;
return { label, overdue: diffDays < 0 };
}
function buildTaskCard(docId, data) {
const card = document.createElement('div');
card.className = `td-item ${data.completed ? 'completed' : ''}`;
let when = 'Just now';
if (data.createdAt) when = formatTimeHM(new Date(data.createdAt.seconds * 1000));
let done = '';
if (data.completed && data.completedAt) done = ` · Done ${formatTimeHM(new Date(data.completedAt.seconds * 1000))}`;
card.innerHTML = `
<label class="td-chk"><input type="checkbox" ${data.completed ? 'checked' : ''} id="check-${docId}"><i></i></label>
<div class="td-body"><span class="todo-text" id="text-${docId}">${esc(data.task)}</span><small>${esc(data.createdBy || 'User')} · ${when}${done}</small></div>
<button class="todo-icon-btn" id="edit-todo-${docId}" title="Edit" aria-label="Edit">✎</button>
<button class="todo-icon-btn" id="del-todo-${docId}" title="Delete" aria-label="Delete">&times;</button>`;
card.querySelector(`#check-${docId}`)?.addEventListener('change', async (e) => {
const isNowCompleted = e.target.checked;
const updates = { completed: isNowCompleted };
card.classList.toggle('completed', isNowCompleted);
if (isNowCompleted) {
updates.completedAt = serverTimestamp();
if (!data.historyLogged) {
try {
await addDoc(collection(db, "todo_history"), {
task: data.task, completed: true, status: 'done', priority: data.priority || 'medium', dueDate: data.dueDate || '',
createdBy: data.createdBy, createdAt: data.createdAt || serverTimestamp(), completedAt: serverTimestamp(),
dateKey: data.dateKey || getTodayDateKey(), archivedAt: serverTimestamp()
});
updates.historyLogged = true;
} catch (err) { console.error("Error logging to history:", err); }
}
}
await updateDoc(doc(db, "todos", docId), updates);
});
card.querySelector(`#del-todo-${docId}`)?.addEventListener('click', async () => {
await deleteDoc(doc(db, "todos", docId));
toast("Task deleted", "info");
});
card.querySelector(`#edit-todo-${docId}`)?.addEventListener('click', () => {
const textSpan = card.querySelector(`#text-${docId}`);
if (!textSpan) return;
const currentText = textSpan.textContent;
const input = document.createElement('input');
input.type = 'text'; input.className = 'todo-text-input'; input.value = currentText;
textSpan.replaceWith(input); input.focus(); input.select();
const commit = async () => {
const newText = input.value.trim();
if (newText && newText !== currentText) await updateDoc(doc(db, "todos", docId), { task: newText });
else renderTodoList();
};
input.addEventListener('blur', commit);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
});
return card;
}
/* the page header always shows today's real day + date and updates itself at midnight */
function updateTodoDate() {
const d = new Date(), a = document.getElementById('tdDay'), b = document.getElementById('tdDate');
if (a) a.textContent = d.toLocaleDateString([], { weekday: 'long' });
if (b) b.textContent = d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}
updateTodoDate(); setInterval(updateTodoDate, 30000);
function renderTodoList() {
if (!todoList) return;
const searchTerm = (todoSearchInput?.value || '').trim().toLowerCase();
const visible = allTodos.filter(({ data }) => !searchTerm || data.task.toLowerCase().includes(searchTerm));
/* one checklist for the whole day: in the order they were written, newest at the bottom */
visible.sort((a, b) => (a.data.createdAt?.seconds ?? 9e15) - (b.data.createdAt?.seconds ?? 9e15));
todoList.innerHTML = '';
if (visible.length === 0) {
todoList.innerHTML = `<div class="td-empty"><span>✨</span><b>Nothing here yet</b><i>Write your first task below and tap ✓</i></div>`;
} else {
const frag = document.createDocumentFragment();
visible.forEach(({ id, data }) => frag.appendChild(buildTaskCard(id, data)));
todoList.appendChild(frag);
}
const allCompleted = allTodos.filter((t) => t.data.completed).length;
const totalCount = allTodos.length;
const pct = totalCount === 0 ? 0 : Math.round((allCompleted / totalCount) * 100);
if (todoProgressFill) todoProgressFill.style.width = `${pct}%`;
if (todoProgressText) todoProgressText.textContent = `${allCompleted} of ${totalCount} done today`;
renderReminders();
}
// ============================================================
// SWIPEABLE REMINDERS (shown between "Our Space" and "Our Sacred Diary")
// A task stays here until you press ✓ (done) or ✕ (not done).
// ============================================================
let unconfirmed = [], unconfOn = false, rmSig = '', rmRaf = 0;
function listenUnconfirmed() {
if (unconfOn) return;
unconfOn = true;
onSnapshot(query(collection(db, "todo_history"), where("status", "==", "unconfirmed")), (snap) => {
unconfirmed = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
renderReminders();
}, (e) => console.warn('reminders', e));
}
async function markTodoDone(docId, data) {
const updates = { completed: true, completedAt: serverTimestamp() };
if (!data.historyLogged) {
try {
await setDoc(doc(db, "todo_history", "t_" + docId), {
task: data.task, completed: true, status: 'done', priority: data.priority || 'medium', dueDate: data.dueDate || '',
createdBy: data.createdBy, createdAt: data.createdAt || serverTimestamp(), completedAt: serverTimestamp(),
dateKey: data.dateKey || getTodayDateKey(), archivedAt: serverTimestamp()
});
updates.historyLogged = true;
} catch (err) { console.error("Error logging to history:", err); }
}
await updateDoc(doc(db, "todos", docId), updates);
toast("Marked as done ✅", "success");
}
async function markTodoMissed(docId, data) {
await setDoc(doc(db, "todo_history", "t_" + docId), {
task: data.task, completed: false, status: 'missed', priority: data.priority || 'medium', dueDate: data.dueDate || '',
createdBy: data.createdBy, createdAt: data.createdAt || serverTimestamp(), completedAt: null,
dateKey: data.dateKey || getTodayDateKey(), archivedAt: serverTimestamp()
});
await deleteDoc(doc(db, "todos", docId));
toast("Marked as not done", "info");
}
function rmSlideHtml(i) {
const d = i.data, hist = i.k === 'hist';
const dt = d.createdAt?.seconds ? formatDMY(new Date(d.createdAt.seconds * 1000)) : (d.dateKey || '');
const meta = hist ? `From ${esc(dt)} · did you finish it?` : `${esc(d.createdBy || 'Us')} · ${esc(d.priority || 'medium')} priority`;
return `<div class="rm-slide" data-k="${i.k}" data-id="${esc(i.id)}"><div class="rm-body"><span class="rm-ic">${hist ? '⏳' : '📌'}</span>` +
`<div class="rm-tx"><b>${esc(d.task)}</b><i>${meta}</i></div></div>` +
`<div class="rm-acts"><button type="button" class="rm-no" data-a="no" aria-label="Not done">✕</button><button type="button" class="rm-ok" data-a="ok" aria-label="Done">✓</button></div></div>`;
}
function rmMeta(n) {
const track = document.getElementById('rmTrack'), cnt = document.getElementById('rmCount'), dots = document.getElementById('rmDots');
if (!track || !cnt || !dots) return;
const i = Math.min(n - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
cnt.textContent = n > 1 ? `${i + 1} / ${n}` : '';
const shown = Math.min(n, 8);
dots.innerHTML = n > 1 ? Array.from({ length: shown }, (_, k) => `<i${k === Math.min(i, shown - 1) ? ' class="on"' : ''}></i>`).join('') : '';
}
function renderReminders() {
const card = mainPageReminder, track = document.getElementById('rmTrack');
if (!card || !track) return;
const items = [
...unconfirmed.slice().sort((a, b) => (a.data.archivedAt?.seconds || 0) - (b.data.archivedAt?.seconds || 0)).map((x) => ({ k: 'hist', ...x })),
...allTodos.filter((t) => !t.data.completed).map((x) => ({ k: 'todo', ...x }))
];
document.getElementById('bnSlot')?.classList.toggle('empty', !items.length);
card.classList.toggle('hidden', !items.length);
if (!items.length) { track.innerHTML = ''; rmSig = ''; return; }
const sig = items.map((i) => i.k + i.id + (i.data.task || '')).join('|');
if (sig !== rmSig) {
const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
rmSig = sig;
track.innerHTML = items.map(rmSlideHtml).join('');
track.scrollLeft = Math.min(idx, items.length - 1) * track.clientWidth;
}
rmMeta(items.length);
}
document.getElementById('rmTrack')?.addEventListener('scroll', () => {
cancelAnimationFrame(rmRaf);
rmRaf = requestAnimationFrame(() => rmMeta(document.getElementById('rmTrack').children.length));
}, { passive: true });
document.getElementById('rmTrack')?.addEventListener('click', async (e) => {
const b = e.target.closest('[data-a]');
if (!b) return;
const slide = b.closest('.rm-slide'), k = slide.dataset.k, id = slide.dataset.id, ok = b.dataset.a === 'ok';
slide.classList.add('out'); navigator.vibrate?.(10);
try {
if (k === 'hist') {
await updateDoc(doc(db, "todo_history", id), ok ? { completed: true, status: 'done', completedAt: serverTimestamp() } : { status: 'missed' });
toast(ok ? "Marked as done ✅" : "Marked as not done", ok ? "success" : "info");
} else {
const t = allTodos.find((x) => x.id === id);
if (!t) return;
if (ok) await markTodoDone(id, t.data); else await markTodoMissed(id, t.data);
}
} catch (err) { console.error(err); slide.classList.remove('out'); toast("Couldn't save. Try again.", "error"); }
});
function listenTodoList() {
if (!todoList) return;
checkAndResetDailyTodos();
const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
allTodos = snapshot.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
renderTodoList();
});
listenUnconfirmed();
}
todoSearchInput?.addEventListener('input', debounce(renderTodoList));
clearCompletedBtn?.addEventListener('click', async () => {
const q = query(collection(db, "todos"), where("completed", "==", true));
const snapshot = await getDocs(q);
if (snapshot.empty) {
toast("No completed tasks to clear.", "info");
return;
}
await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, "todos", d.id))));
toast("Cleared completed tasks", "success");
});
const openTodoModal = () => {
closeDrawer(); updateTodoDate();
todoBottomSheet?.classList.add('active');
todoModalOverlay?.classList.add('active');
};
openTodoFromBanner?.addEventListener('click', openTodoModal);
const closeTodoSheet = () => {
todoBottomSheet?.classList.remove('active');
todoModalOverlay?.classList.remove('active');
};
closeTodoSheetBtn?.addEventListener('click', closeTodoSheet);
todoModalOverlay?.addEventListener('click', closeTodoSheet);
const openTodoHistoryModal = () => {
closeDrawer();
todoHistoryBottomSheet?.classList.add('active');
todoHistoryModalOverlay?.classList.add('active');
loadTodoHistory();
};
openTodoHistoryBtn?.addEventListener('click', openTodoHistoryModal);
const closeTodoHistorySheet = () => {
todoHistoryBottomSheet?.classList.remove('active');
todoHistoryModalOverlay?.classList.remove('active');
};
closeTodoHistorySheetBtn?.addEventListener('click', closeTodoHistorySheet);
todoHistoryModalOverlay?.addEventListener('click', closeTodoHistorySheet);
function loadTodoHistory() {
if (!todoHistoryList) return;
const q = query(collection(db, "todo_history"), orderBy("archivedAt", "desc"));
unsubHist?.();
unsubHist = onSnapshot(q, (snapshot) => {
todoHistoryList.innerHTML = '';
if (snapshot.empty) {
todoHistoryList.innerHTML = `<div class="td-empty"><span>📜</span><b>No history yet</b><i>Finished and past tasks will live here</i></div>`;
return;
}
const keyOf = (data) => {
if (data.dateKey) return data.dateKey;
const t = data.completedAt || data.createdAt;
return t ? (() => { const d = new Date(t.seconds * 1000); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })() : 'older';
};
const groups = new Map();
snapshot.docs.forEach((docSnap) => { const data = docSnap.data(), k = keyOf(data); if (!groups.has(k)) groups.set(k, []); groups.get(k).push({ id: docSnap.id, data }); });
const frag = document.createDocumentFragment();
groups.forEach((rows, k) => {
const sec = document.createElement('section'); sec.className = 'th-day';
let title = 'Earlier';
if (k !== 'older') { const [y, m, d] = k.split('-').map(Number); title = new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
const done = rows.filter((r) => r.data.completed).length;
sec.innerHTML = `<div class="th-head"><b>${esc(title)}</b><span>${done} of ${rows.length} done</span></div>`;
rows.forEach(({ id, data }) => {
const st = data.completed ? 'done' : (data.status === 'missed' ? 'missed' : 'wait');
let t = data.completedAt || data.createdAt, time = '';
if (t) time = formatTimeHM(new Date(t.seconds * 1000));
const row = document.createElement('div'); row.className = `th-item ${st}`;
row.innerHTML = `<span class="th-ic">${st === 'done' ? '✓' : st === 'missed' ? '×' : '…'}</span><div class="th-body"><span class="th-text">${esc(data.task)}</span><small>${esc(data.createdBy || 'User')}${time ? ' · ' + (data.completed ? 'Done ' : '') + time : ''}</small></div>`;
if (data.status === 'unconfirmed') {
const acts = document.createElement('div'); acts.className = 'th-acts';
acts.innerHTML = '<button type="button" class="th-no" aria-label="Not done">×</button><button type="button" class="th-ok" aria-label="Done">✓</button>';
acts.querySelector('.th-ok').onclick = () => updateDoc(doc(db, "todo_history", id), { completed: true, status: 'done', completedAt: serverTimestamp() });
acts.querySelector('.th-no').onclick = () => updateDoc(doc(db, "todo_history", id), { status: 'missed' });
row.appendChild(acts);
}
sec.appendChild(row);
});
frag.appendChild(sec);
});
todoHistoryList.appendChild(frag);
});
}
// ============================================================
// STORY BOOK
// ============================================================
const openStoryModal = () => {
closeDrawer();
storyBottomSheet?.classList.add('active');
storyModalOverlay?.classList.add('active');
};
const closeStorySheet = () => {
storyBottomSheet?.classList.remove('active');
storyModalOverlay?.classList.remove('active');
};
closeStorySheetBtn?.addEventListener('click', closeStorySheet);
storyModalOverlay?.addEventListener('click', closeStorySheet);
publishStoryBtn?.addEventListener('click', async () => {
const title = storyTitleInput.value.trim();
const text = storyTextInput.value.trim();
if (!title || !text) {
toast("Please write a title and story content!", "error");
return;
}
const displayName = getCleanUsername(currentUser);
try {
await addDoc(collection(db, "stories"), {
title: title,
text: text,
author: displayName,
createdAt: serverTimestamp()
});
storyTitleInput.value = '';
storyTextInput.value = '';
toast("Chapter added 📖", "success");
} catch (err) {
console.error("Error adding story chapter:", err);
toast("Couldn't add chapter.", "error");
}
});
function loadStories() {
if (!storiesFeed) return;
const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
storiesFeed.innerHTML = '';
if (snapshot.empty) {
storiesFeed.innerHTML = `
<div class="empty-state">
<span class="empty-emoji">📖</span>
No chapters yet — write your first one above.
</div>
`;
return;
}
snapshot.docs.forEach((docSnap) => {
const data = docSnap.data();
const accordion = document.createElement('div');
accordion.className = 'story-accordion-card';
const dateStr = data.createdAt ? formatDMY(new Date(data.createdAt.seconds * 1000)) : 'Recently';
accordion.innerHTML = `
<div class="story-accordion-header">
<div>
<div class="story-accordion-title glowing-story-title">${esc(data.title)}</div>
<div class="story-by-sub">By: ${shineName(data.author)} • ${dateStr}</div>
</div>
<span class="chevron">&rsaquo;</span>
</div>
<div class="story-accordion-body">
<div class="story-book-author-bar">
<span>By: ${shineName(data.author)}</span>
<button id="del-story-${docSnap.id}" style="background:none; border:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
</div>
<p class="story-book-text">${esc(data.text)}</p>
</div>
`;
accordion.querySelector('.story-accordion-header').addEventListener('click', () => {
accordion.classList.toggle('open');
});
storiesFeed.appendChild(accordion);
document.getElementById(`del-story-${docSnap.id}`)?.addEventListener('click', async (e) => {
e.stopPropagation();
if (confirm("Are you sure you want to delete this story chapter?")) {
await deleteDoc(doc(db, 'stories', docSnap.id));
}
});
});
});
}
// ============================================================
// AUTH
// ============================================================
// Login screen: shown only after the splash, and only when nobody is logged in.
// The "Sign Up" option is only offered on a device that has never logged in before.
const isReturning = () => { try { return localStorage.getItem('os_member') === '1'; } catch { return false; } };
function showAuthIfNeeded() {
if (!splashDone || !authKnown || currentUser) return;
if (authToggleWrap) authToggleWrap.style.display = isReturning() ? 'none' : '';
authOverlay?.classList.add('active');
}
authToggleBtn?.addEventListener('click', () => {
isSignUpMode = !isSignUpMode;
if (isSignUpMode) {
authTitle.textContent = "Create Account";
authSub.textContent = "Create an account for our space";
authSubmitBtn.textContent = "Sign Up ✨";
authToggleBtn.textContent = "Login";
} else {
authTitle.textContent = "Welcome Back";
authSub.textContent = "Enter details to unlock our space";
authSubmitBtn.textContent = "Unlock Space ✨";
authToggleBtn.textContent = "Sign Up";
}
});
authSubmitBtn?.addEventListener('click', async () => {
const inputVal = authEmail.value.trim().toLowerCase();
const password = authPassword.value.trim();
if (!inputVal || !password) {
toast("Please enter both username and password.", "error");
return;
}
const email = inputVal.includes('@') ? inputVal : `${inputVal}@ourspace.com`;
try {
if (isSignUpMode) {
await createUserWithEmailAndPassword(auth, email, password);
} else {
await signInWithEmailAndPassword(auth, email, password);
}
} catch (error) {
toast(error.message, "error");
}
});
onAuthStateChanged(auth, (user) => {
authKnown = true;
if (user) {
currentUser = user;
authOverlay?.classList.remove('active');
try { localStorage.setItem('os_member', '1'); } catch {}
const displayName = getCleanUsername(user);
if (currentUserLabel) {
currentUserLabel.innerHTML = shineName(displayName);
}
if (!started) {
started = true;
renderMoodOptions();
setupMoodPickers();
loadMemories();
loadStories();
listenTodoList();
}
} else {
currentUser = null;
showAuthIfNeeded();
}
});
// ============================================================
// DRAWER / ACCOUNT
// ============================================================
hamburgerBtn?.addEventListener('click', () => {
menuDrawer?.classList.add('active');
menuOverlay?.classList.add('active');
});
const closeDrawer = () => {
menuDrawer?.classList.remove('active');
menuOverlay?.classList.remove('active');
};
closeDrawerBtn?.addEventListener('click', closeDrawer);
menuOverlay?.addEventListener('click', closeDrawer);
logoutBtn?.addEventListener('click', async () => {
await signOut(auth);
closeDrawer();
});
permDeleteSubBtn?.addEventListener('click', () => {
closeDrawer();
deleteModal?.classList.add('active');
let timeLeft = 7;
if (timerBadge) timerBadge.textContent = timeLeft;
if (confirmBtn) {
confirmBtn.disabled = true;
confirmBtn.classList.remove('ready');
confirmBtn.textContent = `Wait ${timeLeft}s...`;
}
clearInterval(deleteTimerInterval);
deleteTimerInterval = setInterval(() => {
timeLeft--;
if (timerBadge) timerBadge.textContent = timeLeft;
if (timeLeft > 0) {
if (confirmBtn) confirmBtn.textContent = `Wait ${timeLeft}s...`;
} else {
clearInterval(deleteTimerInterval);
if (timerBadge) timerBadge.textContent = '✓';
if (confirmBtn) {
confirmBtn.disabled = false;
confirmBtn.classList.add('ready');
confirmBtn.textContent = 'Continue & Delete Permanently';
}
}
}, 1000);
});
cancelBtn?.addEventListener('click', () => {
clearInterval(deleteTimerInterval);
deleteModal?.classList.remove('active');
});
confirmBtn?.addEventListener('click', async () => {
if (confirmBtn.disabled || !auth.currentUser) return;
try {
await deleteUser(auth.currentUser);
toast("Account permanently deleted.", "success");
deleteModal?.classList.remove('active');
} catch (error) {
toast("Security limit: Please log out and log back in before deleting your account.", "error");
}
});
// ============================================================
// Bridge for features.js (leave this at the very bottom)
// ============================================================
window.OS = {
db, auth, toast,
name: () => getCleanUsername(currentUser),
memories: () => allMemories,
todos: () => allTodos,
reveal: showMemoryReveal,
fmt: formatDMY,
today: getTodayDateKey,
openTodo: openTodoModal,
openStory: openStoryModal,
openTodoHistory: openTodoHistoryModal
};
