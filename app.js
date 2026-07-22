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

// Load saved user on launch
window.addEventListener('DOMContentLoaded', () => {
  const savedAuthor = localStorage.getItem('user_identity');
  if (savedAuthor) {
    document.getElementById('authorSelect').value = savedAuthor;
  }
});

// Save user identity on that phone
function saveAuthorPreference() {
  const author = document.getElementById('authorSelect').value;
  localStorage.setItem('user_identity', author);
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
  const author = authorSelect.value;
  const text = document.getElementById('diaryInput').value.trim();

  if (!text) {
    alert("Please write something before posting!");
    return;
  }

  // Ensure preference is stored on post
  localStorage.setItem('user_identity', author);

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
    feed.innerHTML = "";

    if (snapshot.empty) {
      feed.innerHTML = `<p style="color:var(--text-secondary); text-align:center;">No entries yet. Be the first to write! ✨</p>`;
      return;
    }

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
        <span class="entry-mood">${data.mood || '❤️'}</span>
      `;
      feed.appendChild(card);
    });
  });

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
