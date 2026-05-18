const CACHE_NAME = 'mj-pwa-v1';
const OFFLINE_URLS = ['/', '/offline'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).catch(() => caches.match('/'));
    })
  );
});

// ── Push notifications ──────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'MJ', body: 'Your partner answered', url: '/home' };
  try { if (event.data) data = event.data.json(); } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     '/apple-touch-icon.png',
      badge:    '/apple-touch-icon.png',
      vibrate:  [200, 100, 200],
      tag:      'mj-answer',
      renotify: true,
      data:     { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
