// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBndZhDQVGVmrAgzwizheVErOfMz8nukYQ",
  authDomain: "ustogether-14936.firebaseapp.com",
  projectId: "ustogether-14936",
  storageBucket: "ustogether-14936.firebasestorage.app",
  messagingSenderId: "685510249495",
  appId: "1:685510249495:web:3efd43596ca0cb621a6052"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let selectedMood = "🥰";
let isDeleteMode = false;
let isRegisterMode = false;
let currentUser = null;

// Check Auth Session on Launch
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('ustogether_logged_user');
  if (savedUser) {
    currentUser = savedUser;
    document.getElementById('authOverlay').classList.remove('active');
    document.getElementById('loggedInUserLabel').innerText = currentUser;
  } else {
    document.getElementById('authOverlay').classList.add('active');
  }

  // Attach Mood Click Listeners
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      selectedMood = target.getAttribute('data-mood') || "🥰";
    });
  });

  // Hide splash screen
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
  }, 2800);
});

// Toggle Auth Mode (Login vs Register)
function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const title = document.getElementById('authTitle');
  const sub = document.getElementById('authSubtitle');
  const btn = document.getElementById('authPrimaryBtn');
  const toggleText = document.getElementById('authToggleText');
  const toggleBtn = document.getElementById('authToggleBtn');

  if (isRegisterMode) {
    title.innerText = "Create Account ✨";
    sub.innerText = "Set up your credentials for the diary";
    btn.innerText = "Register";
    toggleText.innerText = "Already have an account?";
    toggleBtn.innerText = "Login";
  } else {
    title.innerText = "Welcome Back ✨";
    sub.innerText = "Sign in to your private diary";
    btn.innerText = "Login";
    toggleText.innerText = "Need an account?";
    toggleBtn.innerText = "Register";
  }
}

// Handle Login / Register Submit
function handleAuthSubmit() {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value.trim();

  if (!username || !password) {
    alert("Please enter both username and password!");
    return;
  }

  const userDocRef = db.collection("users").doc(username.toLowerCase());

  if (isRegisterMode) {
    userDocRef.get().then((doc) => {
      if (doc.exists) {
        alert("Username already exists! Please pick another or log in.");
      } else {
        userDocRef.set({
          username: username,
          password: password,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          completeLogin(username);
        });
      }
    });
  } else {
    userDocRef.get().then((doc) => {
      if (doc.exists && doc.data().password === password) {
        completeLogin(doc.data().username);
      } else {
        alert("Invalid username or password!");
      }
    });
  }
}

function completeLogin(username) {
  currentUser = username;
  localStorage.setItem('ustogether_logged_user', username);
  document.getElementById('loggedInUserLabel').innerText = username;
  document.getElementById('authOverlay').classList.remove('active');
  document.getElementById('authUsername').value = "";
  document.getElementById('authPassword').value = "";
}

// Drawer Account Submenu
function toggleAccountSubmenu() {
  const menu = document.getElementById('accountSubmenu');
  const item = document.querySelector('.account-menu-item');
  if (menu && item) {
    menu.classList.toggle('open');
    item.classList.toggle('open');
  }
}

// Logout Option
function handleLogout() {
  localStorage.removeItem('ustogether_logged_user');
  currentUser = null;
  toggleMenu();
  document.getElementById('authOverlay').classList.add('active');
}

// Permanent Delete Account & Wipe All Posts
function handlePermanentDelete() {
  if (!currentUser) return;

  const confirmDelete = confirm(`⚠️ Are you sure you want to permanently delete account "${currentUser}"? ALL your posted memories and stories will be deleted forever!`);
  
  if (confirmDelete) {
    const userLower = currentUser.toLowerCase();

    // 1. Delete user account doc
    db.collection("users").doc(userLower).delete();

    // 2. Wipe user's memories
    db.collection("diary").where("author", "==", currentUser).get().then((snapshot) => {
      snapshot.forEach(doc => doc.ref.delete());
    });

    // 3. Wipe user's stories
    db.collection("stories").where("author", "==", currentUser).get().then((snapshot) => {
      snapshot.forEach(doc => doc.ref.delete());
    });

    alert("Your account and all associated posts have been permanently deleted.");
    handleLogout();
  }
}

// Toggle Hamburger Menu Drawer
function toggleMenu() {
  const overlay = document.getElementById('menuOverlay');
  const drawer = document.getElementById('menuDrawer');
  if (overlay && drawer) {
    overlay.classList.toggle('active');
    drawer.classList.toggle('active');
  }
}

// Open / Close Stories Bottom Sheet
function openStoriesSheet() {
  toggleMenu();
  const overlay = document.getElementById('storyModalOverlay');
  const sheet = document.getElementById('storyBottomSheet');
  if (overlay && sheet) {
    overlay.classList.add('active');
    sheet.classList.add('active');
    loadStories();
  }
}

function closeStoriesSheet() {
  const overlay = document.getElementById('storyModalOverlay');
  const sheet = document.getElementById('storyBottomSheet');
  if (overlay && sheet) {
    overlay.classList.remove('active');
    sheet.classList.remove('active');
  }
}

// Toggle Memory Delete Mode
function toggleDeleteMode() {
  isDeleteMode = !isDeleteMode;
  const feed = document.getElementById('entriesFeed');
  const banner = document.getElementById('deleteBanner');
  const btnText = document.getElementById('deleteModeText');

  if (isDeleteMode) {
    if (feed) feed.classList.add('delete-mode');
    if (banner) banner.style.display = 'flex';
    if (btnText) btnText.textContent = 'Exit Delete Mode';
  } else {
    if (feed) feed.classList.remove('delete-mode');
    if (banner) banner.style.display = 'none';
    if (btnText) btnText.textContent = 'Delete a Memory';
  }

  toggleMenu();
}

// Post Memory Function
function saveEntry() {
  if (!currentUser) {
    alert("Please log in first!");
    return;
  }

  const inputElem = document.getElementById('diaryInput');
  const text = inputElem ? inputElem.value.trim() : "";

  if (!text) {
    alert("Please write something before posting!");
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.innerText = "Posting...";

  db.collection("diary").add({
    author: currentUser,
    text: text,
    mood: selectedMood,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    if (inputElem) inputElem.value = "";
    if (saveBtn) saveBtn.innerText = "Post Memory ✨";
  })
  .catch((error) => {
    console.error("Error writing entry: ", error);
    if (saveBtn) saveBtn.innerText = "Post Memory ✨";
  });
}

// Memory Delete Prompt
function deleteMemory(docId, author) {
  if (!isDeleteMode) return;

  if (author !== currentUser) {
    alert(`You can only delete memories written by you (${currentUser})!`);
    return;
  }

  const confirmDelete = confirm("Delete your selected memory?");
  if (confirmDelete) {
    db.collection("diary").doc(docId).delete().then(() => toggleDeleteMode());
  }
}

// Real-Time Memory Feed Listener
db.collection("diary").orderBy("timestamp", "desc")
  .onSnapshot((snapshot) => {
    const feed = document.getElementById('entriesFeed');
    const countBadge = document.getElementById('entryCount');
    if (!feed) return;

    feed.innerHTML = "";

    if (snapshot.empty) {
      feed.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding-top:20px;">No memories yet. Write your first memory together! ✨</p>`;
      if (countBadge) countBadge.textContent = "0 memories";
      return;
    }

    if (countBadge) countBadge.textContent = `${snapshot.size} memories`;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Just now';

      const card = document.createElement('div');
      card.className = 'entry-card';
      card.onclick = () => deleteMemory(docId, data.author);

      card.innerHTML = `
        <div class="entry-header">
          <span class="entry-author">${data.author}</span>
          <span class="entry-date">${dateStr}</span>
        </div>
        <p class="entry-text">${escapeHtml(data.text)}</p>
        <div class="entry-footer">
          <span class="entry-mood">${data.mood || '❤️'}</span>
          <button class="like-heart" onclick="event.stopPropagation(); triggerHeart(this)">❤️</button>
        </div>
      `;
      feed.appendChild(card);
    });
  });

// Save Story Function
function saveStory() {
  if (!currentUser) {
    alert("Please log in first!");
    return;
  }

  const titleElem = document.getElementById('storyTitle');
  const contentElem = document.getElementById('storyContent');

  const title = titleElem ? titleElem.value.trim() : "";
  const content = contentElem ? contentElem.value.trim() : "";

  if (!title || !content) {
    alert("Please write both a title and story content!");
    return;
  }

  db.collection("stories").add({
    author: currentUser,
    title: title,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    if (titleElem) titleElem.value = "";
    if (contentElem) contentElem.value = "";
  });
}

// Load Stories with Accordion & Delete
function loadStories() {
  db.collection("stories").orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      const feed = document.getElementById('storiesFeed');
      if (!feed) return;
      feed.innerHTML = "";

      if (snapshot.empty) {
        feed.innerHTML = `<p style="color:var(--text-secondary); text-align:center; font-family:'Cormorant Garamond', serif; font-size:1.15rem; padding-top:10px;">No stories published yet. Write the first chapter...</p>`;
        return;
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const docId = doc.id;
        const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : 'Just now';

        const card = document.createElement('div');
        card.className = 'story-accordion-card';

        card.innerHTML = `
          <div class="story-accordion-header" onclick="toggleStoryAccordion(this)">
            <div class="story-accordion-title">${escapeHtml(data.title)}</div>
            <div class="story-chevron">❯</div>
          </div>
          <div class="story-accordion-body">
            <div class="story-book-author-bar">
              <span>Written by ${data.author} • ${dateStr}</span>
              <button class="story-delete-btn" onclick="deleteStory('${docId}', '${data.author}')">🗑️</button>
            </div>
            <div class="story-book-text">${escapeHtml(data.content)}</div>
          </div>
        `;
        feed.appendChild(card);
      });
    });
}

function toggleStoryAccordion(headerElem) {
  const card = headerElem.parentElement;
  card.classList.toggle('open');
}

function deleteStory(docId, author) {
  if (author !== currentUser) {
    alert(`You can only delete stories written by you (${currentUser})!`);
    return;
  }

  const confirmDelete = confirm("Delete your selected memory?");
  if (confirmDelete) {
    db.collection("stories").doc(docId).delete();
  }
}

function triggerHeart(btn) {
  btn.style.transform = "scale(1.5)";
  setTimeout(() => { btn.style.transform = "scale(1)"; }, 200);
}

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
