// Cache name includes a version - bump this on any future manual SW changes
// so old caches get cleaned up automatically via the 'activate' handler below.
const CACHE_VERSION = 'osai-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = ['/manifest.json', '/icon-192.png', '/icon-512.png', OFFLINE_URL];

self.addEventListener('install', (e) => {
  // No self.skipWaiting() here on purpose - a new SW stays "waiting" until
  // the page explicitly asks it to take over (see the message listener
  // below). This lets the app show an "update available" prompt instead
  // of silently swapping the SW under an already-loaded page.
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control of open tabs right away
  );
});

// Lets the page trigger activation once the user agrees to update, instead
// of this happening automatically and silently.
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING' || e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Navigation requests (loading index.html) and any hashed JS/CSS build
  // output: ALWAYS go to the network first, so users get the latest deploy
  // immediately. On success, also stash a copy in the runtime cache so a
  // later offline visit to the same asset/route has something real to
  // fall back to - the network-first policy itself is unchanged, this
  // only makes the offline fallback actually work in practice.
  if (e.request.mode === 'navigate' || url.pathname.startsWith('/assets/')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(e.request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(e.request);
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match(OFFLINE_URL);
          return Response.error();
        })
    );
    return;
  }

  // Static, rarely-changing assets (icons, manifest): cache-first is fine.
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
