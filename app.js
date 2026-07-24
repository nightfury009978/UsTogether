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
  onDisconnect
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
const closeYtVideoBar = document.getElementById('closeYtVideoBar');
const closeYtVideoBtn = document.getElementById('closeYtVideoBtn');
const watchPresenceBadge = document.getElementById('watchPresenceBadge');
const presenceText = document.getElementById('presenceText');

let isSignUpMode = false;
let selectedMood = '💖';
let currentUser = null;
let deleteTimerInterval = null;

// YouTube SDK Player Variables
let ytPlayer = null;
let currentVideoId = null;
let isRemoteUpdate = false;
let presenceHeartbeat = null;

// Extract Video ID
function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Initialize or Update YouTube iFrame Player API
function loadYtSdkPlayer(videoId, startTime = 0, state = 'pause') {
  if (!videoId) {
    if (ytPlayer && typeof ytPlayer.destroy === 'function') {
      ytPlayer.destroy();
      ytPlayer = null;
    }
    document.getElementById('ytPlayer').innerHTML = '';
    if (closeYtVideoBar) closeYtVideoBar.style.display = 'none';
    currentVideoId = null;
    return;
  }

  if (closeYtVideoBar) closeYtVideoBar.style.display = 'flex';

  if (!ytPlayer || currentVideoId !== videoId) {
    currentVideoId = videoId;
    document.getElementById('ytPlayer').innerHTML = '<div id="ytPlayerTarget"></div>';

    ytPlayer = new YT.Player('ytPlayerTarget', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': state === 'play' ? 1 : 0,
        'start': Math.floor(startTime),
        'playsinline': 1,
        'enablejsapi': 1
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  } else {
    // Player exists - apply state remotely
    isRemoteUpdate = true;
    const currentTime = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;
    if (Math.abs(currentTime - startTime) > 2) {
      ytPlayer.seekTo(startTime, true);
    }

    if (state === 'play') {
      ytPlayer.playVideo();
    } else if (state === 'pause') {
      ytPlayer.pauseVideo();
    }
    setTimeout(() => { isRemoteUpdate = false; }, 500);
  }
}

// Broadcast Local Play/Pause/Seek Changes to Firestore
async function onPlayerStateChange(event) {
  if (isRemoteUpdate || !currentUser) return;

  const playerState = event.data;
  let actionState = 'pause';

  if (playerState === YT.PlayerState.PLAYING) {
    actionState = 'play';
  } else if (playerState === YT.PlayerState.PAUSED) {
    actionState = 'pause';
  } else {
    return;
  }

  const time = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;

  try {
    await setDoc(doc(db, "watch_sync", "current"), {
      videoId: currentVideoId,
      state: actionState,
      time: time,
      updatedBy: currentUser.email,
      timestamp: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("Error broadcasting video state:", e);
  }
}

// Close/Clear Current Playing Video Action
if (closeYtVideoBtn) {
  closeYtVideoBtn.addEventListener('click', async () => {
    loadYtSdkPlayer(null);
    try {
      await setDoc(doc(db, "watch_sync", "current"), {
        videoId: "",
        state: "pause",
        time: 0,
        updatedBy: currentUser?.email || "User",
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  });
}

// Play Video Action
if (loadYtBtn) {
  loadYtBtn.addEventListener('click', async () => {
    const url = ytUrlInput.value.trim();
    const vidId = extractVideoId(url);

    if (!vidId) {
      alert("Please paste a valid YouTube video or Shorts link!");
      return;
    }

    loadYtSdkPlayer(vidId, 0, 'play');

    try {
      await setDoc(doc(db, "watch_sync", "current"), {
        videoId: vidId,
        state: "play",
        time: 0,
        updatedBy: currentUser?.email || "User",
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }

    ytUrlInput.value = '';
  });
}

// Save to Shared Playlist Action
if (addToQueueBtn) {
  addToQueueBtn.addEventListener('click', async () => {
    const url = ytUrlInput.value.trim();
    const vidId = extractVideoId(url);

    if (!vidId) {
      alert("Please paste a valid YouTube link!");
      return;
    }

    const customName = prompt("Give this video a title/name (optional):", "") || "Saved Video";
    const rawName = currentUser.email.split('@')[0];
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

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

// Real-Time Synchronized Playback Listener
function listenWatchSync() {
  onSnapshot(doc(db, "watch_sync", "current"), (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    if (!data.videoId) {
      loadYtSdkPlayer(null);
      return;
    }

    // Ignore remote sync trigger if triggered by self
    if (data.updatedBy === currentUser?.email && ytPlayer) return;

    loadYtSdkPlayer(data.videoId, data.time || 0, data.state || 'pause');
  });
}

// Real-Time Presence (Option 2)
function updatePresence(isWatching) {
  if (!currentUser) return;
  const userKey = currentUser.email.split('@')[0].toLowerCase();
  
  setDoc(doc(db, "presence", userKey), {
    active: isWatching,
    lastSeen: Date.now(),
    name: currentUser.email.split('@')[0]
  }, { merge: true });
}

function listenPresence() {
  onSnapshot(collection(db, "presence"), (snapshot) => {
    let usersActive = [];
    const now = Date.now();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      // Consider active if updated within last 15 seconds and marked active
      if (data.active && (now - (data.lastSeen || 0)) < 15000) {
        if (docSnap.id !== currentUser?.email.split('@')[0].toLowerCase()) {
          usersActive.push(data.name);
        }
      }
    });

    if (usersActive.length > 0) {
      const otherUser = usersActive[0].charAt(0).toUpperCase() + usersActive[0].slice(1);
      if (watchPresenceBadge) {
        watchPresenceBadge.className = 'presence-badge active';
        presenceText.textContent = `${otherUser} is in the Watch Room 🟢`;
      }
    } else {
      if (watchPresenceBadge) {
        watchPresenceBadge.className = 'presence-badge away';
        presenceText.textContent = `Solo Watching ⚪`;
      }
    }
  });
}

// Load Shared Playlist
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
        loadYtSdkPlayer(data.videoId, 0, 'play');
        await setDoc(doc(db, "watch_sync", "current"), {
          videoId: data.videoId,
          state: "play",
          time: 0,
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

// Watch Sheet Drawer Controls & Presence Heartbeat
if (openWatchTogetherBtn) {
  openWatchTogetherBtn.addEventListener('click', () => {
    closeDrawer();
    watchBottomSheet?.classList.add('active');
    watchModalOverlay?.classList.add('active');

    // Start Presence Heartbeat
    updatePresence(true);
    clearInterval(presenceHeartbeat);
    presenceHeartbeat = setInterval(() => updatePresence(true), 8000);
  });
}

const closeWatchSheet = () => {
  watchBottomSheet?.classList.remove('active');
  watchModalOverlay?.classList.remove('active');

  // Stop Presence
  clearInterval(presenceHeartbeat);
  updatePresence(false);
};

closeWatchSheetBtn?.addEventListener('click', closeWatchSheet);
watchModalOverlay?.addEventListener('click', closeWatchSheet);

// Re-bind Mood Buttons Event Listeners
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

// Toggle Auth Mode
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

// Authentication Submit
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

// Track Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authOverlay?.classList.remove('active');
    
    const rawName = user.email.split('@')[0];
    if (currentUserLabel) {
      currentUserLabel.textContent = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    }
    
    setupMoodPickers();
    loadMemories();
    loadStories();
    loadYtQueue();
    listenWatchSync();
    listenPresence();
  } else {
    currentUser = null;
    authOverlay?.classList.add('active');
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

// Submenu Toggle
accountMenuItem?.addEventListener('click', () => {
  accountMenuItem.classList.toggle('open');
  accountSubmenu?.classList.toggle('open');
});

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
    alert("Account permanently deleted.");
    deleteModal?.classList.remove('active');
  } catch (error) {
    alert("Security limit: Please log out and log back in before deleting your account.");
  }
});

// Story Book Controls
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

// Share Memory
saveBtn?.addEventListener('click', async () => {
  const text = memoryInput.value.trim();
  if (!text) return;

  const rawName = currentUser.email.split('@')[0];
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  try {
    await addDoc(collection(db, "memories"), {
      text: text,
      mood: selectedMood,
      author: displayName,
      createdAt: serverTimestamp()
    });
    memoryInput.value = '';
  } catch (err) {
    console.error("Error saving memory:", err);
  }
});

// Load Realtime Memories
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
          <span>${data.mood || '💖'}</span>
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

// Publish Story
publishStoryBtn?.addEventListener('click', async () => {
  const title = storyTitleInput.value.trim();
  const text = storyTextInput.value.trim();

  if (!title || !text) {
    alert("Please write a title and story content!");
    return;
  }

  const rawName = currentUser.email.split('@')[0];
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

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

// Load Realtime Story Book
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
