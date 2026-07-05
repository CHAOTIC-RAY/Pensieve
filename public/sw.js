// Simple Service Worker for PWA installability
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through
  e.respondWith(fetch(e.request).catch(() => {
    // Basic offline fallback could go here
    return new Response('Offline mode');
  }));
});
