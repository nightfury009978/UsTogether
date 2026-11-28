const CACHE = 'our-space-v28';
const SHELL = ['./', './index.html', './style.css', './app.js', './features.js', './features.css', './premium.js', './chat.css', './chat.js', './notify.js', './manifest.json',
'./icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => {
// 'reload' skips the browser's own cache so a fresh copy of every file is saved
e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
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
// Never cache the downloadable APK
if (url.pathname.endsWith('.apk')) return;
// Let Firebase / Google APIs handle their own traffic
if (url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts')) return;
if (url.hostname.includes('firebaseio.com') || url.hostname.includes('identitytoolkit')) return;
// Pages: network first, fall back to cache when offline
if (req.mode === 'navigate') {
e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
return;
}
// Our own files (code, styles, icons): ask the server first so every update shows straight away; use the saved copy only when offline
if (url.origin === location.origin) {
e.respondWith(
fetch(req, { cache: 'no-cache' }).then((res) => {
if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
return res;
}).catch(() => caches.match(req))
);
return;
}
// Everything else (fonts, libraries): serve the saved copy fast, refresh in the background
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

