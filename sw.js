const CACHE = 'our-space-v3';
const SHELL = ['./', './index.html', './style.css', './app.js', './features.js', './features.css', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './premium.css', './premium.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Let Firebase / Google APIs handle their own traffic
  if (url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('identitytoolkit')) return;

  // Pages: network first, fall back to cache when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // Everything else: serve cache fast, refresh in background
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
