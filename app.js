// Auto-hide Splash Screen on Launch
setTimeout(() => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; }, 500);
  }
}, 1200);

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
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  setDoc,
  updateDoc,
  getDocs,
  where
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
const db = getFirestore(app);

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

// DOM Elements
const authOverlay = document.getElementById('authOverlay');
const authTitle = document.getElementById('authTitle');
const authSub = document.getElementById('authSub');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const currentUserLabel = document.getElementById('currentUserLabel');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuDrawer = document.getElementById('menuDrawer');
const menuOverlay = document.getElementById('menuOverlay');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const accountMenuItem = document.getElementById('accountMenuItem');
const accountSubmenu = document.getElementById('accountSubmenu');
const logoutBtn = document.getElementById('logoutBtn');
const permDeleteSubBtn = document.getElementById('permDeleteSubBtn');

const friendsList = document.getElementById('friendsList');
const todoInput = document.getElementById('todoInput');
const todoPriority = document.getElementById('todoPriority');
const todoDueDate = document.getElementById('todoDueDate');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const todoProgressFill = document.getElementById('todoProgressFill');
const todoProgressText = document.getElementById('todoProgressText');
const bubbleContainer = document.getElementById('bubbleContainer');

const deleteModal = document.getElementById('deleteConfirmModal');
const timerBadge = document.getElementById('deleteTimerBadge');
const confirmBtn = document.getElementById('confirmDeleteBtn');
const cancelBtn = document.getElementById('cancelDeleteBtn');

const memoryInput = document.getElementById('memoryInput');
const saveBtn = document.getElementById('saveBtn');
const latestTimelineFeed = document.getElementById('latestTimelineFeed');
const olderTimelineFeed = document.getElementById('olderTimelineFeed');
const entryCountBadge = document.getElementById('entryCountBadge');
const memorySearchInput = document.getElementById('memorySearchInput');
const moodFilterSelect = document.getElementById('moodFilterSelect');
let moodBtns = document.querySelectorAll('.mood-btn');

// Friends Modal Controls
const openFriendsBtn = document.getElementById('openFriendsBtn');
const friendsModalOverlay = document.getElementById('friendsModalOverlay');
const friendsBottomSheet = document.getElementById('friendsBottomSheet');
const closeFriendsSheetBtn = document.getElementById('closeFriendsSheetBtn');

// To-Do Sticky Modal Controls
const openTodoBtn = document.getElementById('openTodoBtn');
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

const openStoriesMenuBtn = document.getElementById('openStoriesMenuBtn');
const storyModalOverlay = document.getElementById('storyModalOverlay');
const storyBottomSheet = document.getElementById('storyBottomSheet');
const closeStorySheetBtn = document.getElementById('closeStorySheetBtn');
const storyTitleInput = document.getElementById('storyTitleInput');
const storyTextInput = document.getElementById('storyTextInput');
const publishStoryBtn = document.getElementById('publishStoryBtn');
const storiesFeed = document.getElementById('storiesFeed');

const openWatchTogetherBtn = document.getElementById('openWatchTogetherBtn');
const watchModalOverlay = document.getElementById('watchModalOverlay');
const watchBottomSheet = document.getElementById('watchBottomSheet');
const closeWatchSheetBtn = document.getElementById('closeWatchSheetBtn');
const ytUrlInput = document.getElementById('ytUrlInput');
const loadYtBtn = document.getElementById('loadYtBtn');
const addToQueueBtn = document.getElementById('addToQueueBtn');
const ytQueueFeed = document.getElementById('ytQueueFeed');
const ytPlayerContainer = document.getElementById('ytPlayer');
const closeYtVideoBar = document.getElementById('closeYtVideoBar');
const closeYtVideoBtn = document.getElementById('closeYtVideoBtn');

const partnerPresenceDot = document.getElementById('partnerPresenceDot');
const partnerPresenceText = document.getElementById('partnerPresenceText');

let isSignUpMode = false;
let selectedMood = '💖';
let currentUser = null;
let deleteTimerInterval = null;
let allMemories = []; // cache for client-side search/filter

// Helper: Clean Username
function getCleanUsername(user) {
  if (!user || !user.email) return "User";
  const raw = user.email.split('@')[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Helper: Format Date Key (YYYY-MM-DD)
function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Memory Bubbles Generator
function spawnMemoryBubble(moodSymbol = '💖', textSnippet = '') {
  if (!bubbleContainer) return;
  const bubble = document.createElement('div');
  bubble.className = 'memory-bubble';
  
  const randomLeft = Math.floor(Math.random() * 80) + 10; 
  bubble.style.left = `${randomLeft}%`;

  const size = Math.floor(Math.random() * 20) + 45; 
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;

  bubble.innerHTML = `<span>${moodSymbol}</span>`;

  bubble.addEventListener('click', () => {
    bubble.classList.add('pop');
    setTimeout(() => bubble.remove(), 300);
  });

  bubbleContainer.appendChild(bubble);

  setTimeout(() => {
    if (bubble.parentNode) bubble.remove();
  }, 7000);
}

// Presence Updates Function
async function updateMyPresence(statusState, actionDetail = "") {
  if (!currentUser) return;
  const username = getCleanUsername(currentUser);
  try {
    await setDoc(doc(db, "presence", username.toLowerCase()), {
      username: username,
      state: statusState, 
      detail: actionDetail,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("Presence update error:", e);
  }
}

// Realtime Friends List Listener with Online/Offline Indicators
function listenFriendsList() {
  if (!currentUser) return;
  const currentUsername = getCleanUsername(currentUser).toLowerCase();

  onSnapshot(collection(db, "presence"), (snapshot) => {
    if (!friendsList) return;
    friendsList.innerHTML = '';

    let friendsCount = 0;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const fName = data.username || docSnap.id;
      
      if (docSnap.id.toLowerCase() !== currentUsername) {
        friendsCount++;
        const state = data.state || 'offline';
        const isOnline = (state === 'online' || state === 'watching' || state === 'opened');

        const friendCard = document.createElement('div');
        friendCard.className = 'friend-item';
        friendCard.innerHTML = `
          <span class="friend-name">👤 ${fName}</span>
          <span class="friend-status-dot ${isOnline ? 'online' : 'offline'}" title="${isOnline ? 'Online' : 'Offline'}"></span>
        `;
        friendsList.appendChild(friendCard);
      }
    });

    if (friendsCount === 0) {
      friendsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-emoji">👥</span>
          No other friends found yet.
        </div>
      `;
    }
  });
}

// Friends Bottom Sheet Trigger
openFriendsBtn?.addEventListener('click', () => {
  closeDrawer();
  friendsBottomSheet?.classList.add('active');
  friendsModalOverlay?.classList.add('active');
});

const closeFriendsSheet = () => {
  friendsBottomSheet?.classList.remove('active');
  friendsModalOverlay?.classList.remove('active');
};

closeFriendsSheetBtn?.addEventListener('click', closeFriendsSheet);
friendsModalOverlay?.addEventListener('click', closeFriendsSheet);

// To-Do Bottom Sheet Trigger
const openTodoModal = () => {
  closeDrawer();
  todoBottomSheet?.classList.add('active');
  todoModalOverlay?.classList.add('active');
};

openTodoBtn?.addEventListener('click', openTodoModal);
openTodoFromBanner?.addEventListener('click', openTodoModal);

const closeTodoSheet = () => {
  todoBottomSheet?.classList.remove('active');
  todoModalOverlay?.classList.remove('active');
};

closeTodoSheetBtn?.addEventListener('click', closeTodoSheet);
todoModalOverlay?.addEventListener('click', closeTodoSheet);

// To-Do History Trigger
openTodoHistoryBtn?.addEventListener('click', () => {
  closeDrawer();
  todoHistoryBottomSheet?.classList.add('active');
  todoHistoryModalOverlay?.classList.add('active');
  loadTodoHistory();
});

const closeTodoHistorySheet = () => {
  todoHistoryBottomSheet?.classList.remove('active');
  todoHistoryModalOverlay?.classList.remove('active');
};

closeTodoHistorySheetBtn?.addEventListener('click', closeTodoHistorySheet);
todoHistoryModalOverlay?.addEventListener('click', closeTodoHistorySheet);

// Realtime Presence Listener for Watch Together
function listenPartnerPresence() {
  if (!currentUser) return;
  const currentUsername = getCleanUsername(currentUser).toLowerCase();

  onSnapshot(collection(db, "presence"), (snapshot) => {
    let partnerFound = false;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id.toLowerCase() !== currentUsername) {
        partnerFound = true;
        const pName = data.username || "Partner";
        const state = data.state || "offline";

        if (state === 'watching') {
          partnerPresenceDot?.classList.remove('offline');
          partnerPresenceDot?.classList.add('online');
          if (partnerPresenceText) partnerPresenceText.textContent = `${pName} is watching 🎬`;
        } else if (state === 'opened' || state === 'online') {
          partnerPresenceDot?.classList.remove('offline');
          partnerPresenceDot?.classList.add('online');
          if (partnerPresenceText) partnerPresenceText.textContent = `${pName} is online 🟢`;
        } else {
          partnerPresenceDot?.classList.remove('online');
          partnerPresenceDot?.classList.add('offline');
          if (partnerPresenceText) partnerPresenceText.textContent = `${pName} is offline`;
        }
      }
    });

    if (!partnerFound && partnerPresenceText) {
      partnerPresenceDot?.classList.remove('online');
      partnerPresenceDot?.classList.add('offline');
      partnerPresenceText.textContent = "Waiting for friends...";
    }
  });
}

// Check & Reset Active To-Do List at 12:00 AM Midnight
async function checkAndResetDailyTodos() {
  const todayKey = getTodayDateKey();
  const q = query(collection(db, "todos"));
  const snapshot = await getDocs(q);

  snapshot.docs.forEach(async (docSnap) => {
    const data = docSnap.data();
    if (data.dateKey && data.dateKey !== todayKey) {
      // Move past items to todo_history collection
      await addDoc(collection(db, "todo_history"), {
        task: data.task,
        completed: data.completed,
        priority: data.priority || 'medium',
        dueDate: data.dueDate || '',
        createdBy: data.createdBy,
        createdAt: data.createdAt || serverTimestamp(),
        dateKey: data.dateKey,
        archivedAt: serverTimestamp()
      });
      // Delete from active list
      await deleteDoc(doc(db, "todos", docSnap.id));
    }
  });
}

// Priority sort weight (high first)
const priorityWeight = { high: 0, medium: 1, low: 2 };

// Add To-Do (with priority + optional due date)
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
        createdBy: getCleanUsername(currentUser),
        createdAt: serverTimestamp(),
        dateKey: getTodayDateKey()
      });
      todoInput.value = '';
      if (todoDueDate) todoDueDate.value = '';
      if (todoPriority) todoPriority.value = 'medium';
      toast("Task added ✅", "success");
    } catch (e) {
      console.error("Error adding todo:", e);
      toast("Couldn't add task. Try again.", "error");
    }
  });
}

// Format a due date string (YYYY-MM-DD) into a friendly badge label + overdue flag
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
  const stickyCard = document.createElement('div');
  stickyCard.className = `sticky-note-card ${data.completed ? 'completed' : ''}`;

  const priority = data.priority || 'medium';
  const dueInfo = formatDueDate(data.dueDate);

  let dateTimeStr = 'Just now';
  if (data.createdAt) {
    const d = new Date(data.createdAt.seconds * 1000);
    dateTimeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  stickyCard.innerHTML = `
    <div class="sticky-content">
      <input type="checkbox" ${data.completed ? 'checked' : ''} id="check-${docId}">
      <span class="todo-text" id="text-${docId}">${data.task}</span>
      <button class="todo-icon-btn" id="edit-todo-${docId}" title="Edit">✏️</button>
      <button class="todo-icon-btn" id="del-todo-${docId}" title="Delete">&times;</button>
    </div>
    <div class="todo-badges">
      <span class="priority-badge ${priority}">${priority}</span>
      ${dueInfo ? `<span class="due-date-badge ${dueInfo.overdue && !data.completed ? 'overdue' : ''}">${dueInfo.label}</span>` : ''}
    </div>
    <div class="sticky-footer-stamp">
      <strong>${data.createdBy || 'User'}</strong> • ${dateTimeStr}
    </div>
  `;

  stickyCard.querySelector(`#check-${docId}`)?.addEventListener('change', async (e) => {
    await updateDoc(doc(db, "todos", docId), { completed: e.target.checked });
  });

  stickyCard.querySelector(`#del-todo-${docId}`)?.addEventListener('click', async () => {
    await deleteDoc(doc(db, "todos", docId));
    toast("Task deleted", "info");
  });

  stickyCard.querySelector(`#edit-todo-${docId}`)?.addEventListener('click', () => {
    const textSpan = stickyCard.querySelector(`#text-${docId}`);
    if (!textSpan) return;
    const currentText = textSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-text-input';
    input.value = currentText;
    textSpan.replaceWith(input);
    input.focus();
    input.select();

    const commit = async () => {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        await updateDoc(doc(db, "todos", docId), { task: newText });
      }
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    });
  });

  return stickyCard;
}

function listenTodoList() {
  if (!todoList) return;
  checkAndResetDailyTodos();

  const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    todoList.innerHTML = '';

    const pending = [];
    const completed = [];
    const pendingReminders = [];

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.completed) {
        completed.push({ id: docSnap.id, data });
      } else {
        pending.push({ id: docSnap.id, data });
        pendingReminders.push({ task: data.task, author: data.createdBy || "User" });
      }
    });

    // Sort pending by priority (high first), then most recent
    pending.sort((a, b) => {
      const pw = priorityWeight[a.data.priority || 'medium'] - priorityWeight[b.data.priority || 'medium'];
      if (pw !== 0) return pw;
      return (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0);
    });

    if (pending.length === 0 && completed.length === 0) {
      todoList.innerHTML = `
        <div class="empty-state">
          <span class="empty-emoji">📝</span>
          No tasks yet — add your first one above.
        </div>
      `;
    } else {
      pending.forEach(({ id, data }) => todoList.appendChild(buildTaskCard(id, data)));

      if (completed.length > 0) {
        const label = document.createElement('div');
        label.className = 'todo-section-label';
        label.textContent = `Completed (${completed.length})`;
        todoList.appendChild(label);
        completed.forEach(({ id, data }) => todoList.appendChild(buildTaskCard(id, data)));
      }
    }

    // Progress bar
    const totalCount = pending.length + completed.length;
    const pct = totalCount === 0 ? 0 : Math.round((completed.length / totalCount) * 100);
    if (todoProgressFill) todoProgressFill.style.width = `${pct}%`;
    if (todoProgressText) todoProgressText.textContent = `${completed.length} of ${totalCount} done today`;

    // Update Main Page Reminder Banner
    if (mainPageReminder && reminderTaskText) {
      if (pendingReminders.length > 0) {
        mainPageReminder.classList.remove('hidden');
        const first = pendingReminders[0];
        reminderTaskText.textContent = `${first.author}: "${first.task}" ${pendingReminders.length > 1 ? `(+${pendingReminders.length - 1} more)` : ''}`;
      } else {
        mainPageReminder.classList.add('hidden');
      }
    }
  });
}

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

// Load Sub-History of Past To-Do Items with iOS Notification Scroll
function loadTodoHistory() {
  if (!todoHistoryList) return;
  const q = query(collection(db, "todo_history"), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    todoHistoryList.innerHTML = '';
    if (snapshot.empty) {
      todoHistoryList.innerHTML = `
        <div class="empty-state">
          <span class="empty-emoji">📜</span>
          No past to-do records found.
        </div>
      `;
      return;
    }

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      let dateTimeStr = 'Past Task';
      if (data.createdAt) {
        const d = new Date(data.createdAt.seconds * 1000);
        dateTimeStr = `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      const priority = data.priority || 'medium';

      const card = document.createElement('div');
      card.className = 'entry-card ios-notification-card';
      
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="entry-author">👤 ${data.createdBy || 'User'}</span>
          <span class="entry-date">${dateTimeStr}</span>
        </div>
        <p class="entry-text" style="${data.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
          ${data.task} ${data.completed ? '✅' : '⏳'}
        </p>
        <div class="todo-badges">
          <span class="priority-badge ${priority}">${priority}</span>
        </div>
      `;

      todoHistoryList.appendChild(card);
    });
  });
}

// Extract Video ID
function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Render/Play YouTube Video
function renderYtVideo(videoId) {
  if (!ytPlayerContainer) return;
  if (!videoId) {
    ytPlayerContainer.innerHTML = '';
    if (closeYtVideoBar) closeYtVideoBar.style.display = 'none';
    return;
  }
  
  if (closeYtVideoBar) closeYtVideoBar.style.display = 'flex';
  ytPlayerContainer.innerHTML = `
    <iframe 
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
      style="width:100%; height:100%; border:0;">
    </iframe>
  `;
}

// Video Controls
if (closeYtVideoBtn) {
  closeYtVideoBtn.addEventListener('click', async () => {
    renderYtVideo(null);
    updateMyPresence('opened');
    try {
      await setDoc(doc(db, "watch_sync", "current"), {
        videoId: "",
        updatedBy: currentUser?.email || "User",
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  });
}

if (loadYtBtn) {
  loadYtBtn.addEventListener('click', async () => {
    const url = ytUrlInput.value.trim();
    const vidId = extractVideoId(url);

    if (!vidId) {
      toast("Please paste a valid YouTube video or Shorts link!", "error");
      return;
    }

    renderYtVideo(vidId);
    updateMyPresence('watching');

    try {
      await setDoc(doc(db, "watch_sync", "current"), {
        videoId: vidId,
        updatedBy: currentUser?.email || "User",
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }

    ytUrlInput.value = '';
  });
}

if (addToQueueBtn) {
  addToQueueBtn.addEventListener('click', async () => {
    const url = ytUrlInput.value.trim();
    const vidId = extractVideoId(url);

    if (!vidId) {
      toast("Please paste a valid YouTube link!", "error");
      return;
    }

    const customName = prompt("Give this video a title/name (optional):", "") || "Saved Video";
    const displayName = getCleanUsername(currentUser);

    try {
      await addDoc(collection(db, "yt_queue"), {
        videoId: vidId,
        videoTitle: customName,
        addedBy: displayName,
        createdAt: serverTimestamp()
      });
      ytUrlInput.value = '';
      toast("Added to playlist", "success");
    } catch (err) {
      console.error("Error adding to queue:", err);
      toast("Couldn't add to playlist.", "error");
    }
  });
}

function listenWatchSync() {
  onSnapshot(doc(db, "watch_sync", "current"), (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    if (data.videoId) {
      renderYtVideo(data.videoId);
    } else {
      renderYtVideo(null);
    }
  });
}

function loadYtQueue() {
  if (!ytQueueFeed) return;
  const q = query(collection(db, "yt_queue"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    ytQueueFeed.innerHTML = '';

    if (snapshot.empty) {
      ytQueueFeed.innerHTML = `
        <div class="empty-state">
          <span class="empty-emoji">🎬</span>
          No saved videos yet.
        </div>
      `;
      return;
    }

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'queue-item-card';

      const displayTitle = data.videoTitle ? data.videoTitle : `Video (${data.addedBy})`;

      card.innerHTML = `
        <span class="queue-item-title">📺 ${displayTitle}</span>
        <div style="display:flex; gap:6px;">
          <button class="queue-play-btn" id="play-q-${docSnap.id}">Play 🎬</button>
          <button class="story-delete-btn" id="del-q-${docSnap.id}">🗑️</button>
        </div>
      `;

      ytQueueFeed.appendChild(card);

      document.getElementById(`play-q-${docSnap.id}`)?.addEventListener('click', async () => {
        renderYtVideo(data.videoId);
        updateMyPresence('watching');
        await setDoc(doc(db, "watch_sync", "current"), {
          videoId: data.videoId,
          updatedBy: currentUser?.email || "User",
          timestamp: serverTimestamp()
        }, { merge: true });
      });

      document.getElementById(`del-q-${docSnap.id}`)?.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'yt_queue', docSnap.id));
      });
    });
  });
}

if (openWatchTogetherBtn) {
  openWatchTogetherBtn.addEventListener('click', () => {
    closeDrawer();
    watchBottomSheet?.classList.add('active');
    watchModalOverlay?.classList.add('active');
    updateMyPresence('opened');
  });
}

const closeWatchSheet = () => {
  watchBottomSheet?.classList.remove('active');
  watchModalOverlay?.classList.remove('active');
  updateMyPresence('online');
};

closeWatchSheetBtn?.addEventListener('click', closeWatchSheet);
watchModalOverlay?.addEventListener('click', closeWatchSheet);

function setupMoodPickers() {
  moodBtns = document.querySelectorAll('.mood-btn');
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.getAttribute('data-mood');
    });
  });
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
  if (user) {
    currentUser = user;
    authOverlay?.classList.remove('active');
    
    const displayName = getCleanUsername(user);
    if (currentUserLabel) {
      currentUserLabel.textContent = displayName;
    }
    
    updateMyPresence('online');
    setupMoodPickers();
    loadMemories();
    loadStories();
    loadYtQueue();
    listenWatchSync();
    listenPartnerPresence();
    listenFriendsList();
    listenTodoList();
  } else {
    currentUser = null;
    authOverlay?.classList.add('active');
  }
});

// Window BeforeUnload to Set Offline
window.addEventListener('beforeunload', () => {
  if (currentUser) {
    updateMyPresence('offline');
  }
});

// Drawer Navigation Controls
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

accountMenuItem?.addEventListener('click', () => {
  accountMenuItem.classList.toggle('open');
  accountSubmenu?.classList.toggle('open');
});

logoutBtn?.addEventListener('click', async () => {
  await updateMyPresence('offline');
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
    await updateMyPresence('offline');
    await deleteUser(auth.currentUser);
    toast("Account permanently deleted.", "success");
    deleteModal?.classList.remove('active');
  } catch (error) {
    toast("Security limit: Please log out and log back in before deleting your account.", "error");
  }
});

openStoriesMenuBtn?.addEventListener('click', () => {
  closeDrawer();
  storyBottomSheet?.classList.add('active');
  storyModalOverlay?.classList.add('active');
});

const closeStorySheet = () => {
  storyBottomSheet?.classList.remove('active');
  storyModalOverlay?.classList.remove('active');
};

closeStorySheetBtn?.addEventListener('click', closeStorySheet);
storyModalOverlay?.addEventListener('click', closeStorySheet);

// Share Memory with Memory Bubble Trigger
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
      author: displayName,
      createdAt: serverTimestamp()
    });

    spawnMemoryBubble(selectedMood, text);
    memoryInput.value = '';
    toast("Memory shared 💖", "success");
  } catch (err) {
    console.error("Error saving memory:", err);
    toast("Couldn't save memory. Try again.", "error");
  }
});

// Render the timeline feed from the current cache + active filters
function renderMemoryFeed() {
  if (!latestTimelineFeed || !olderTimelineFeed) return;

  const searchTerm = (memorySearchInput?.value || '').trim().toLowerCase();
  const moodFilter = moodFilterSelect?.value || 'all';

  const filtered = allMemories.filter(({ data }) => {
    const matchesSearch = !searchTerm || data.text.toLowerCase().includes(searchTerm);
    const matchesMood = moodFilter === 'all' || data.mood === moodFilter;
    return matchesSearch && matchesMood;
  });

  latestTimelineFeed.innerHTML = '';
  olderTimelineFeed.innerHTML = '';

  if (entryCountBadge) entryCountBadge.textContent = `${allMemories.length} memories`;

  if (filtered.length === 0) {
    latestTimelineFeed.innerHTML = `
      <div class="empty-state">
        <span class="empty-emoji">🔍</span>
        ${allMemories.length === 0 ? 'No memories yet — share your first one above.' : 'No memories match your search.'}
      </div>
    `;
    return;
  }

  filtered.forEach(({ id, data }, index) => {
    const card = document.createElement('div');
    card.className = 'entry-card ios-notification-card';

    const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="entry-author">${data.author}</span>
        <span class="entry-date">${dateStr}</span>
      </div>
      <p class="entry-text">${data.text}</p>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:1.3rem;">${data.mood || '💖'}</span>
        <button class="story-delete-btn" id="del-${id}" style="background:none; border:none; cursor:pointer;">🗑️</button>
      </div>
    `;

    if (index < 2) {
      latestTimelineFeed.appendChild(card);
    } else {
      olderTimelineFeed.appendChild(card);
    }

    document.getElementById(`del-${id}`)?.addEventListener('click', async () => {
      await deleteDoc(doc(db, 'memories', id));
      toast("Memory deleted", "info");
    });
  });
}

// Load Memories (2 Latest Top + iOS Notification Scroll Container below)
function loadMemories() {
  if (!latestTimelineFeed || !olderTimelineFeed) return;
  const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    allMemories = snapshot.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    renderMemoryFeed();
  });
}

memorySearchInput?.addEventListener('input', renderMemoryFeed);
moodFilterSelect?.addEventListener('change', renderMemoryFeed);

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

      const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Recently';

      accordion.innerHTML = `
        <div class="story-accordion-header">
          <div>
            <div class="story-accordion-title glowing-story-title">${data.title}</div>
            <div class="story-by-sub">By: ${data.author} • ${dateStr}</div>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>
        <div class="story-accordion-body">
          <div class="story-book-author-bar">
            <span>By: ${data.author}</span>
            <button id="del-story-${docSnap.id}" style="background:none; border:none; cursor:pointer; font-size:1.1rem;">🗑️</button>
          </div>
          <p class="story-book-text">${data.text}</p>
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
