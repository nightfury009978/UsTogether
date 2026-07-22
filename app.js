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

// Check & Lock Identity on Launch + Attach Listeners
window.addEventListener('DOMContentLoaded', () => {
  const lockedAuthor = localStorage.getItem('user_identity_locked');
  const authorSelect = document.getElementById('authorSelect');

  if (lockedAuthor && authorSelect) {
    authorSelect.value = lockedAuthor;
    authorSelect.disabled = true;
    authorSelect.style.opacity = "0.8";
    authorSelect.style.cursor = "not-allowed";
  }

  // Attach Mood Button Click Listeners
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      selectedMood = target.getAttribute('data-mood') || "🥰";
    });
  });

  // Hide splash screen after animation completes
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
  }, 2800);
});

// Lock Selection Permanently When Name is Selected
function saveAuthorPreference() {
  const authorSelect = document.getElementById('authorSelect');
  const chosenAuthor = authorSelect.value;

  if (chosenAuthor) {
    localStorage.setItem('user_identity_locked', chosenAuthor);
    authorSelect.disabled = true;
    authorSelect.style.opacity = "0.8";
    authorSelect.style.cursor = "not-allowed";
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
  toggleMenu(); // Close hamburger drawer
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
  const authorSelect = document.getElementById('authorSelect');
  let author = localStorage.getItem('user_identity_locked') || (authorSelect ? authorSelect.value : "");

  if (!author) {
    alert("Please select your name before posting your memory!");
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
    author: author,
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
    alert("Could not post memory. Please check your network!");
    if (saveBtn) saveBtn.innerText = "Post Memory ✨";
  });
}

// Restricted Memory Delete (Owner Only)
function deleteMemory(docId, author) {
  if (!isDeleteMode) return;

  const currentDeviceUser = localStorage.getItem('user_identity_locked');

  if (author !== currentDeviceUser) {
    alert(`You can only delete memories written by you (${currentDeviceUser})!`);
    return;
  }

  const confirmDelete = confirm(`Delete your memory?`);
  if (confirmDelete) {
    db.collection("diary").doc(docId).delete()
      .then(() => {
        toggleDeleteMode();
      })
      .catch((error) => {
        console.error("Error removing memory: ", error);
      });
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
  }, (error) => {
    console.error("Error fetching memories: ", error);
  });

// Save Story Function
function saveStory() {
  const authorSelect = document.getElementById('authorSelect');
  const author = localStorage.getItem('user_identity_locked') || (authorSelect ? authorSelect.value : "");

  if (!author) {
    alert("Please select your name on the main page first!");
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
    author: author,
    title: title,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    if (titleElem) titleElem.value = "";
    if (contentElem) contentElem.value = "";
  })
  .catch((error) => {
    console.error("Error publishing story: ", error);
  });
}

// Load Stories in Real-Time
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
        const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : 'Just now';

        const card = document.createElement('div');
        card.className = 'story-book-card';

        card.innerHTML = `
          <div class="story-book-title">${escapeHtml(data.title)}</div>
          <div class="story-book-author">Written by ${data.author} • ${dateStr}</div>
          <div class="story-book-body">${escapeHtml(data.content)}</div>
        `;
        feed.appendChild(card);
      });
    }, (error) => {
      console.error("Error loading stories: ", error);
    });
}

function triggerHeart(btn) {
  btn.style.transform = "scale(1.5)";
  setTimeout(() => {
    btn.style.transform = "scale(1)";
  }, 200);
}

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
