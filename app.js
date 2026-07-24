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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Exact Firebase Credentials
const firebaseConfig = {
  apiKey: "AIzaSyBndZhDQVGVmrAgzwizheVErOfMz8nukYQ",
  authDomain: "ustogether-14936.firebaseapp.com",
  projectId: "ustogether-14936",
  storageBucket: "ustogether-14936.firebasestorage.app",
  messagingSenderId: "685510249495",
  appId: "1:685510249495:web:3efd43596ca0cb621a6052"
};

// Initialize Firebase App & Services
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

// Navigation & Drawer Elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuDrawer = document.getElementById('menuDrawer');
const menuOverlay = document.getElementById('menuOverlay');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const accountMenuItem = document.getElementById('accountMenuItem');
const accountSubmenu = document.getElementById('accountSubmenu');
const logoutBtn = document.getElementById('logoutBtn');
const permDeleteSubBtn = document.getElementById('permDeleteSubBtn');

// Delete Countdown Modal Elements
const deleteModal = document.getElementById('deleteConfirmModal');
const timerBadge = document.getElementById('deleteTimerBadge');
const confirmBtn = document.getElementById('confirmDeleteBtn');
const cancelBtn = document.getElementById('cancelDeleteBtn');

// Memory Feed Elements
const memoryInput = document.getElementById('memoryInput');
const saveBtn = document.getElementById('saveBtn');
const timelineFeed = document.getElementById('timelineFeed');
const entryCountBadge = document.getElementById('entryCountBadge');
const moodBtns = document.querySelectorAll('.mood-btn');

// Story Book Elements
const openStoriesMenuBtn = document.getElementById('openStoriesMenuBtn');
const storyModalOverlay = document.getElementById('storyModalOverlay');
const storyBottomSheet = document.getElementById('storyBottomSheet');
const closeStorySheetBtn = document.getElementById('closeStorySheetBtn');
const storyTitleInput = document.getElementById('storyTitleInput');
const storyTextInput = document.getElementById('storyTextInput');
const publishStoryBtn = document.getElementById('publishStoryBtn');
const storiesFeed = document.getElementById('storiesFeed');

// Watch Together Elements
const openWatchTogetherBtn = document.getElementById('openWatchTogetherBtn');
const watchModalOverlay = document.getElementById('watchModalOverlay');
const watchBottomSheet = document.getElementById('watchBottomSheet');
const closeWatchSheetBtn = document.getElementById('closeWatchSheetBtn');
const ytUrlInput = document.getElementById('ytUrlInput');
const loadYtBtn = document.getElementById('loadYtBtn');
const addToQueueBtn = document.getElementById('addToQueueBtn');
const ytQueueFeed = document.getElementById('ytQueueFeed');

// App & Watch Together State
let isSignUpMode = false;
let selectedMood = '💖';
let currentUser = null;
let deleteTimerInterval = null;
let ytPlayer = null;
let isRemoteChange = false;

// Initialize YouTube IFrame Player
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('ytPlayer', {
    height: '100%',
    width: '100%',
    videoId: 'M7lc1UVf-VE', // Default initial video
    playerVars: {
      'playsinline': 1,
      'controls': 1
    },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
};

// Handle YouTube Player Events (Play, Pause, Seek)
function onPlayerStateChange(event) {
  if (isRemoteChange || !currentUser) return;

  const state = event.data;
  const currentTime = ytPlayer.getCurrentTime();

  if (state === YT.PlayerState.PLAYING) {
    updateWatchState('play', currentTime);
  } else if (state === YT.PlayerState.PAUSED) {
    updateWatchState('pause', currentTime);
  }
}

// Helper to extract YouTube Video ID from any URL
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Broadcast player changes to Firestore
async function updateWatchState(action, time, videoId = null) {
  try {
    const payload = {
      action: action,
      time: time,
      updatedBy: currentUser.email,
      timestamp: serverTimestamp()
    };
    if (videoId) payload.videoId = videoId;

    await setDoc(doc(db, "watch_sync", "current"), payload, { merge: true });
  } catch (err) {
    console.error("Watch state update error:", err);
  }
}

// Listen for Realtime Watch Together Sync
function listenWatchSync() {
  onSnapshot(doc(db, "watch_sync", "current"), (docSnap) => {
    if (!docSnap.exists() || !ytPlayer || !ytPlayer.loadVideoById) return;

    const data = docSnap.data();
    if (data.updatedBy === currentUser?.email) return; // Skip if self-triggered

    isRemoteChange = true;

    if (data.videoId) {
      const currentVid = ytPlayer.getVideoData()?.video_id;
      if (currentVid !== data.videoId) {
        ytPlayer.loadVideoById(data.videoId, data.time || 0);
      }
    }

    if (data.action === 'play') {
      if (Math.abs(ytPlayer.getCurrentTime() - data.time) > 2) {
        ytPlayer.seekTo(data.time, true);
      }
      ytPlayer.playVideo();
    } else if (data.action === 'pause') {
      ytPlayer.pauseVideo();
      ytPlayer.seekTo(data.time, true);
    }

    setTimeout(() => { isRemoteChange = false; }, 500);
  });
}

// Load Video Button Action
loadYtBtn.addEventListener('click', () => {
  const url = ytUrlInput.value.trim();
  const vidId = extractVideoId(url);

  if (!vidId) {
    alert("Please enter a valid YouTube video link!");
    return;
  }

  ytPlayer.loadVideoById(vidId);
  updateWatchState('play', 0, vidId);
  ytUrlInput.value = '';
});

// Save to Playlist Action
addToQueueBtn.addEventListener('click', async () => {
  const url = ytUrlInput.value.trim();
  const vidId = extractVideoId(url);

  if (!vidId) {
    alert("Please enter a valid YouTube link!");
    return;
  }

  const rawName = currentUser.email.split('@')[0];
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  try {
    await addDoc(collection(db, "yt_queue"), {
      videoId: vidId,
      addedBy: displayName,
      createdAt: serverTimestamp()
    });
    ytUrlInput.value = '';
  } catch (err) {
    console.error("Error adding to queue:", err);
  }
});

// Load Realtime Shared Playlist
function loadYtQueue() {
  const q = query(collection(db, "yt_queue"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    ytQueueFeed.innerHTML = '';

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'queue-item-card';

      card.innerHTML = `
        <span class="queue-item-title">📺 Video ID: ${data.videoId} (Saved by ${data.addedBy})</span>
        <div class="queue-actions">
          <button class="queue-play-btn" id="play-q-${docSnap.id}">Play</button>
          <button class="story-delete-btn" id="del-q-${docSnap.id}">🗑️</button>
        </div>
      `;

      ytQueueFeed.appendChild(card);

      // Play video from queue
      document.getElementById(`play-q-${docSnap.id}`)?.addEventListener('click', () => {
        ytPlayer.loadVideoById(data.videoId);
        updateWatchState('play', 0, data.videoId);
      });

      // Delete from queue
      document.getElementById(`del-q-${docSnap.id}`)?.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'yt_queue', docSnap.id));
      });
    });
  });
}

// Watch Sheet Drawer Controls
openWatchTogetherBtn.addEventListener('click', () => {
  closeDrawer();
  watchBottomSheet.classList.add('active');
  watchModalOverlay.classList.add('active');
});

const closeWatchSheet = () => {
  watchBottomSheet.classList.remove('active');
  watchModalOverlay.classList.remove('active');
};

closeWatchSheetBtn.addEventListener('click', closeWatchSheet);
watchModalOverlay.addEventListener('click', closeWatchSheet);

// Handle Mood Selection
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    moodBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMood = btn.getAttribute('data-mood');
  });
});

// Toggle Auth Mode (Login vs Sign Up)
authToggleBtn.addEventListener('click', () => {
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
authSubmitBtn.addEventListener('click', async () => {
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

// Track Authentication State
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authOverlay.classList.remove('active');
    
    const rawName = user.email.split('@')[0];
    currentUserLabel.textContent = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    loadMemories();
    loadStories();
    loadYtQueue();
    listenWatchSync();
  } else {
    currentUser = null;
    authOverlay.classList.add('active');
  }
});

// Navigation Drawer Controls
hamburgerBtn.addEventListener('click', () => {
  menuDrawer.classList.add('active');
  menuOverlay.classList.add('active');
});

const closeDrawer = () => {
  menuDrawer.classList.remove('active');
  menuOverlay.classList.remove('active');
};

closeDrawerBtn.addEventListener('click', closeDrawer);
menuOverlay.addEventListener('click', closeDrawer);

// Account Submenu Toggle
accountMenuItem.addEventListener('click', () => {
  accountMenuItem.classList.toggle('open');
  accountSubmenu.classList.toggle('open');
});

// Logout Action
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  closeDrawer();
});

// Permanent Delete Trigger
permDeleteSubBtn.addEventListener('click', () => {
  closeDrawer();
  deleteModal.classList.add('active');

  let timeLeft = 7;
  timerBadge.textContent = timeLeft;
  confirmBtn.disabled = true;
  confirmBtn.classList.remove('ready');
  confirmBtn.textContent = `Wait ${timeLeft}s...`;

  clearInterval(deleteTimerInterval);

  deleteTimerInterval = setInterval(() => {
    timeLeft--;
    timerBadge.textContent = timeLeft;

    if (timeLeft > 0) {
      confirmBtn.textContent = `Wait ${timeLeft}s...`;
    } else {
      clearInterval(deleteTimerInterval);
      timerBadge.textContent = '✓';
      confirmBtn.disabled = false;
      confirmBtn.classList.add('ready');
      confirmBtn.textContent = 'Continue & Delete Permanently';
    }
  }, 1000);
});

// Cancel Permanent Deletion
cancelBtn.addEventListener('click', () => {
  clearInterval(deleteTimerInterval);
  deleteModal.classList.remove('active');
});

// Execute Account Deletion
confirmBtn.addEventListener('click', async () => {
  if (confirmBtn.disabled || !auth.currentUser) return;

  try {
    await deleteUser(auth.currentUser);
    alert("Account permanently deleted.");
    deleteModal.classList.remove('active');
  } catch (error) {
    console.error("Delete account error:", error);
    alert("Security limit: Please log out and log back in before deleting your account.");
  }
});

// Story Book Drawer Controls
openStoriesMenuBtn.addEventListener('click', () => {
  closeDrawer();
  storyBottomSheet.classList.add('active');
  storyModalOverlay.classList.add('active');
});

const closeStorySheet = () => {
  storyBottomSheet.classList.remove('active');
  storyModalOverlay.classList.remove('active');
};

closeStorySheetBtn.addEventListener('click', closeStorySheet);
storyModalOverlay.addEventListener('click', closeStorySheet);

// Share Memory
saveBtn.addEventListener('click', async () => {
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
  const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    timelineFeed.innerHTML = '';
    entryCountBadge.textContent = `${snapshot.docs.length} memories`;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'entry-card';
      
      const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';

      card.innerHTML = `
        <div class="entry-header">
          <span class="entry-author">${data.author}</span>
          <span class="entry-date">${dateStr}</span>
        </div>
        <p class="entry-text">${data.text}</p>
        <div class="entry-footer">
          <span>${data.mood || '💖'}</span>
          <button class="story-delete-btn" id="del-${docSnap.id}">🗑️</button>
        </div>
      `;
      
      timelineFeed.appendChild(card);

      document.getElementById(`del-${docSnap.id}`)?.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'memories', docSnap.id));
      });
    });
  });
}

// Publish Story Chapter
publishStoryBtn.addEventListener('click', async () => {
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
  const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    storiesFeed.innerHTML = '';

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const accordion = document.createElement('div');
      accordion.className = 'story-accordion-card';

      accordion.innerHTML = `
        <div class="story-accordion-header">
          <span class="story-accordion-title">${data.title}</span>
          <span class="story-chevron">&rsaquo;</span>
        </div>
        <div class="story-accordion-body">
          <div class="story-book-author-bar">
            <span>Written by ${data.author}</span>
            <button class="story-delete-btn" id="del-story-${docSnap.id}" style="background:none; border:none; cursor:pointer; font-size: 1.1rem;" title="Delete Story">🗑️</button>
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
