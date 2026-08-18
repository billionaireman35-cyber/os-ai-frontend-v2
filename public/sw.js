// Cache name includes a version - bump this on any future manual SW changes
// so old caches get cleaned up automatically via the 'activate' handler below.
const CACHE_VERSION = 'osai-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_URLS = ['/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // activate the new SW immediately, don't wait for old tabs to close
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control of open tabs right away
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Navigation requests (loading index.html) and any hashed JS/CSS build
  // output: ALWAYS go to the network first, so users get the latest deploy
  // immediately. Only fall back to cache if the network is unreachable
  // (offline support), never serve a stale HTML/JS shell over a fresh one.
  if (e.request.mode === 'navigate' || url.pathname.startsWith('/assets/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static, rarely-changing assets (icons, manifest): cache-first is fine.
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
