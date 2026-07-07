// Simple Service Worker for PWA installability
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// No-op fetch event handler to prevent proxy issues inside sandboxed iframes while maintaining PWA installability checks
self.addEventListener('fetch', (e) => {
  // Let the browser handle all requests natively
});
