const CACHE_NAME = 'xos-v3';

// Install — skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate — delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Fetch — ALWAYS network first, cache only for offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return new Response('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f1e3c;color:#fff;text-align:center;"><div><h1>Offline</h1><p>Check your connection and try again.</p><button onclick="location.reload()" style="margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Retry</button></div></body></html>', {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })
  );
});
