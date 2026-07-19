/* Pensieve PWA service worker — offline app shell + runtime asset cache */

const CACHE_VERSION = 'pensieve-shell-v2';
const RUNTIME_CACHE = 'pensieve-runtime-v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.jpg',
  '/icon-512.jpg',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Precache failed for', url, err);
          })
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});

function isCloudHost(url) {
  const host = url.hostname;
  return (
    host.includes('supabase') ||
    host.includes('appwrite') ||
    host.includes('googleapis') ||
    host.includes('gstatic.com') ||
    host.includes('firebaseio') ||
    host.includes('firebasestorage') ||
    host.includes('cloudflare') ||
    host.includes('generativelanguage') ||
    url.pathname.startsWith('/api')
  );
}

function withCorsHeaders(response) {
  if (!response || response.type === 'opaque' || response.status !== 200) {
    return response;
  }
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
  newHeaders.set('Access-Control-Allow-Origin', '*');
  return new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const modified = withCorsHeaders(response);
    if (modified && modified.status === 200) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, modified.clone());
    }
    return modified;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return (
        (await caches.match('/index.html')) ||
        (await caches.match('/offline.html')) ||
        Response.error()
      );
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      const modified = withCorsHeaders(response);
      if (modified && modified.status === 200) {
        cache.put(request, modified.clone());
      }
      return modified;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;
  return Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache cloud / API traffic — network only
  if (isCloudHost(url)) {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // Hashed Vite assets: stale-while-revalidate for snappy repeat visits
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Navigations + shell: network-first with offline SPA/offline fallback
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Other same-origin static (icons, manifest, fonts): SWR
  event.respondWith(staleWhileRevalidate(request));
});
