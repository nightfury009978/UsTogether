// Your exact Firebase configuration
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

// Check & Lock identity on launch
window.addEventListener('DOMContentLoaded', () => {
  const lockedAuthor = localStorage.getItem('user_identity_locked');
  const authorSelect = document.getElementById('authorSelect');

  if (lockedAuthor) {
    authorSelect.value = lockedAuthor;
    authorSelect.disabled = true;
    authorSelect.style.opacity = "0.8";
    authorSelect.style.cursor = "not-allowed";
  }
});

// Lock selection on choosing a name
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

// Mood selection listener
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    selectedMood = e.target.getAttribute('data-mood');
  });
});

// Save Entry Function
function saveEntry() {
  const authorSelect = document.getElementById('authorSelect');
  let author = localStorage.getItem('user_identity_locked') || authorSelect.value;

  if (!author) {
    alert("Please select your name before posting your memory!");
    return;
  }

  const text = document.getElementById('diaryInput').value.trim();

  if (!text) {
    alert("Please write something before posting!");
    return;
  }

  db.collection("diary").add({
    author: author,
    text: text,
    mood: selectedMood,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    document.getElementById('diaryInput').value = "";
  })
  .catch((error) => {
    console.error("Error writing entry: ", error);
  });
}

// Real-time Feed Listener
db.collection("diary").orderBy("timestamp", "desc")
  .onSnapshot((snapshot) => {
    const feed = document.getElementById('entriesFeed');
    const countBadge = document.getElementById('entryCount');
    feed.innerHTML = "";

    if (snapshot.empty) {
      feed.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding-top:20px;">No memories yet. Write your first memory together! ✨</p>`;
      countBadge.textContent = "0 memories";
      return;
    }

    countBadge.textContent = `${snapshot.size} memories`;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Just now';

      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <div class="entry-header">
          <span class="entry-author">${data.author}</span>
          <span class="entry-date">${dateStr}</span>
        </div>
        <p class="entry-text">${escapeHtml(data.text)}</p>
        <div class="entry-footer">
          <span class="entry-mood">${data.mood || '❤️'}</span>
          <button class="like-heart" onclick="triggerHeart(this)">❤️</button>
        </div>
      `;
      feed.appendChild(card);
    });
  });

function triggerHeart(btn) {
  btn.style.transform = "scale(1.5)";
  setTimeout(() => {
    btn.style.transform = "scale(1)";
  }, 200);
}

function escapeHtml(text) {
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
