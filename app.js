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
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBndZhDQVGVmrAgzwizheVErOfMz8nukYQ",
  authDomain: "ustogether-14936.firebaseapp.com",
  projectId: "ustogether-14936",
  storageBucket: "ustogether-14936.firebasestorage.app",
  messagingSenderId: "685510249495",
  appId: "1:685510249495:web:3efd43596ca0cb621a6052"
};

// Initialize Firebase
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

// App State
let isSignUpMode = false;
let selectedMood = '💖';
let currentUser = null;
let deleteTimerInterval = null;

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
    authSub.textContent = "Create a passcode for our space";
    authSubmitBtn.textContent = "Sign Up ✨";
    authToggleBtn.textContent = "Login";
  } else {
    authTitle.textContent = "Welcome Back";
    authSub.textContent = "Enter your passcode to unlock our space";
    authSubmitBtn.textContent = "Unlock Space ✨";
    authToggleBtn.textContent = "Sign Up";
  }
});

// Authentication Submit (Uses simple username internally)
authSubmitBtn.addEventListener('click', async () => {
  const inputVal = authEmail.value.trim().toLowerCase();
  const password = authPassword.value.trim();

  if (!inputVal || !password) {
    alert("Please enter both username and passcode.");
    return;
  }

  // Seamlessly formats simple usernames for Firebase Auth
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
    // Display clean name (e.g. Abhay instead of abhay@ourspace.com)
    const rawName = user.email.split('@')[0];
    currentUserLabel.textContent = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    loadMemories();
    loadStories();
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

// Permanent Delete Countdown Trigger
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
          <button class="story-delete-btn" onclick="deleteDoc(doc(db, 'memories', '${docSnap.id}'))">🗑️</button>
        </div>
      `;
      timelineFeed.appendChild(card);
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
          </div>
          <p class="story-book-text">${data.text}</p>
        </div>
      `;

      accordion.querySelector('.story-accordion-header').addEventListener('click', () => {
        accordion.classList.toggle('open');
      });

      storiesFeed.appendChild(accordion);
    });
  });
}
