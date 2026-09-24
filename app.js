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
  updateDoc
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
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const bubbleContainer = document.getElementById('bubbleContainer');

const deleteModal = document.getElementById('deleteConfirmModal');
const timerBadge = document.getElementById('deleteTimerBadge');
const confirmBtn = document.getElementById('confirmDeleteBtn');
const cancelBtn = document.getElementById('cancelDeleteBtn');

const memoryInput = document.getElementById('memoryInput');
const saveBtn = document.getElementById('saveBtn');
const timelineFeed = document.getElementById('timelineFeed');
const entryCountBadge = document.getElementById('entryCountBadge');
let moodBtns = document.querySelectorAll('.mood-btn');

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

// Clean Username helper
function getCleanUsername(user) {
  if (!user || !user.email) return "User";
  const raw = user.email.split('@')[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
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
      state: statusState, // 'online', 'watching', 'opened', 'offline'
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
        <div class="friend-item">
          <span class="friend-name" style="font-size:0.8rem; color:#888;">No other friends found</span>
        </div>
      `;
    }
  });
}

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

// Realtime To-Do List Implementation
if (addTodoBtn) {
  addTodoBtn.addEventListener('click', async () => {
    const text = todoInput.value.trim();
    if (!text || !currentUser) return;

    try {
      await addDoc(collection(db, "todos"), {
        task: text,
        completed: false,
        createdBy: getCleanUsername(currentUser),
        createdAt: serverTimestamp()
      });
      todoInput.value = '';
    } catch (e) {
      console.error("Error adding todo:", e);
    }
  });
}

function listenTodoList() {
  if (!todoList) return;
  const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    todoList.innerHTML = '';
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const item = document.createElement('div');
      item.className = `todo-item ${data.completed ? 'completed' : ''}`;

      item.innerHTML = `
        <input type="checkbox" ${data.completed ? 'checked' : ''} id="check-${docSnap.id}">
        <span class="todo-text">${data.task}</span>
        <button class="todo-del-btn" id="del-todo-${docSnap.id}">&times;</button>
      `;

      todoList.appendChild(item);

      document.getElementById(`check-${docSnap.id}`)?.addEventListener('change', async (e) => {
        await updateDoc(doc(db, "todos", docSnap.id), {
          completed: e.target.checked
        });
      });

      document.getElementById(`del-todo-${docSnap.id}`)?.addEventListener('click', async () => {
        await deleteDoc(doc(db, "todos", docSnap.id));
      });
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
      alert("Please paste a valid YouTube video or Shorts link!");
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
      alert("Please paste a valid YouTube link!");
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
    } catch (err) {
      console.error("Error adding to queue:", err);
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
    alert("Please enter both username and password.");
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
    alert(error.message);
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
    alert("Account permanently deleted.");
    deleteModal?.classList.remove('active');
  } catch (error) {
    alert("Security limit: Please log out and log back in before deleting your account.");
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
  if (!text) return;

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
  } catch (err) {
    console.error("Error saving memory:", err);
  }
});

function loadMemories() {
  if (!timelineFeed) return;
  const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    timelineFeed.innerHTML = '';
    if (entryCountBadge) entryCountBadge.textContent = `${snapshot.docs.length} memories`;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'entry-card';
      
      const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="entry-author">${data.author}</span>
          <span class="entry-date">${dateStr}</span>
        </div>
        <p class="entry-text">${data.text}</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:1.3rem;">${data.mood || '💖'}</span>
          <button class="story-delete-btn" id="del-${docSnap.id}" style="background:none; border:none; cursor:pointer;">🗑️</button>
        </div>
      `;
      
      timelineFeed.appendChild(card);

      document.getElementById(`del-${docSnap.id}`)?.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'memories', docSnap.id));
      });
    });
  });
}

publishStoryBtn?.addEventListener('click', async () => {
  const title = storyTitleInput.value.trim();
  const text = storyTextInput.value.trim();

  if (!title || !text) {
    alert("Please write a title and story content!");
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
  } catch (err) {
    console.error("Error adding story chapter:", err);
  }
});

function loadStories() {
  if (!storiesFeed) return;
  const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    storiesFeed.innerHTML = '';

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
          <span style="color:#ffb6c1; font-size: 1.2rem;">&rsaquo;</span>
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
