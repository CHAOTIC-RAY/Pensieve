/* Pensieve PWA service worker — offline app shell + same-origin static assets */

const CACHE_VERSION = 'pensieve-shell-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCloudHost(url) {
  const host = url.hostname;
  return (
    host.includes('supabase') ||
    host.includes('appwrite') ||
    host.includes('googleapis') ||
    host.includes('firebaseio') ||
    host.includes('firebasestorage') ||
    host.includes('cloudflare') ||
    url.pathname.startsWith('/api')
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache cloud / API traffic — network only
  if (isCloudHost(url)) {
    return;
  }

  // Same-origin navigations & assets: network-first, fall back to cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.type === 'opaque' || response.status !== 200) {
            return response;
          }

          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
          newHeaders.set('Access-Control-Allow-Origin', '*');

          const modified = new Response(response.clone().body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });

          const cacheCopy = modified.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, cacheCopy));

          return modified;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // SPA fallback
          if (request.mode === 'navigate') {
            const shell = await caches.match('/index.html');
            if (shell) return shell;
          }
          return Response.error();
        })
    );
  }
});
