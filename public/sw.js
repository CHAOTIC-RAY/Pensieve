// Simple Service Worker to prevent COEP/require-corp blocking same-origin static assets like images
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Intercept requests to inject CORP and CORS headers dynamically
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only process same-origin static assets (images, fonts, scripts, styles)
  if (url.origin === self.location.origin) {
    // Avoid intercepting API routes or firestore endpoints
    if (url.pathname.startsWith('/api') || url.pathname.includes('firestore') || url.pathname.includes('google')) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.type === 'opaque') {
            return response;
          }
          
          // Clone response to modify headers
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
          newHeaders.set('Access-Control-Allow-Origin', '*');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch(() => {
          return fetch(event.request);
        })
    );
  }
});
