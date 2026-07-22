// Open/Close Stories Bottom Sheet Interface
function openStoriesSheet() {
  document.getElementById('menuOverlay').classList.remove('active');
  document.getElementById('menuDrawer').classList.remove('active');

  document.getElementById('storyModalOverlay').classList.add('active');
  document.getElementById('storyBottomSheet').classList.add('active');
  loadStories();
}

function closeStoriesSheet() {
  document.getElementById('storyModalOverlay').classList.remove('active');
  document.getElementById('storyBottomSheet').classList.remove('active');
}

// Save Story
function saveStory() {
  const authorSelect = document.getElementById('authorSelect');
  const author = localStorage.getItem('user_identity_locked') || authorSelect.value;

  if (!author) {
    alert("Please select your name on the main page first!");
    return;
  }

  const title = document.getElementById('storyTitle').value.trim();
  const content = document.getElementById('storyContent').value.trim();

  if (!title || !content) {
    alert("Please write a title and story content!");
    return;
  }

  db.collection("stories").add({
    author: author,
    title: title,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    document.getElementById('storyTitle').value = "";
    document.getElementById('storyContent').value = "";
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
      feed.innerHTML = "";

      if (snapshot.empty) {
        feed.innerHTML = `<p style="color:var(--text-secondary); text-align:center; font-family:'Cormorant Garamond', serif; font-size:1.1rem; padding-top:10px;">No stories published yet. Write the first chapter...</p>`;
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
    });
}
