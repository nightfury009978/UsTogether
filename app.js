// Toggle Views (Memories vs Stories)
function openStoriesView() {
  document.getElementById('mainTimelineView').style.display = 'none';
  document.getElementById('storyView').style.display = 'block';
  toggleMenu();
  loadStories();
}

function closeStoriesView() {
  document.getElementById('storyView').style.display = 'none';
  document.getElementById('mainTimelineView').style.display = 'block';
}

// Save Story to Firebase
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
    alert("Please add both a title and story content!");
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
    alert("Story published successfully! 🥀");
  })
  .catch((error) => {
    console.error("Error publishing story: ", error);
  });
}

// Load Stories Real-time
function loadStories() {
  db.collection("stories").orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      const feed = document.getElementById('storiesFeed');
      feed.innerHTML = "";

      if (snapshot.empty) {
        feed.innerHTML = `<p style="color:var(--text-secondary); text-align:center; font-style:italic;">No stories published yet. Write the first chapter...</p>`;
        return;
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : 'Just now';

        const card = document.createElement('div');
        card.className = 'published-story-card';

        card.innerHTML = `
          <div class="story-card-header">
            <div>
              <div class="story-card-title">${escapeHtml(data.title)}</div>
              <div class="story-card-author">Written by ${data.author} • ${dateStr}</div>
            </div>
          </div>
          <div class="story-card-content">${escapeHtml(data.content)}</div>
        `;
        feed.appendChild(card);
      });
    });
}
