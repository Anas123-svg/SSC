/* SSC App Shell: no audit records or API responses are cached here. */
const VERSION = 'ssc-pwa-v1-20261030';
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const SCOPE = new URL(self.registration.scope);
const HOME = SCOPE.pathname;
const FALLBACK = new URL('offline.html', SCOPE).pathname;
const shellURLs = [HOME, new URL('manifest.webmanifest', SCOPE).pathname, FALLBACK,
  ...['icons/ssc-192.png','icons/ssc-512.png','icons/ssc-maskable-512.png'].map(x => new URL(x, SCOPE).pathname)];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(async cache => {
    // Preserve partial installation if one optional asset is unavailable.
    await Promise.allSettled(shellURLs.map(url => cache.add(url)));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('ssc-pwa-') && n !== SHELL && n !== STATIC).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
const isStatic = url => /\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?)(?:$)/i.test(url.pathname);
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (url.pathname.includes('/api/') || request.headers.has('authorization')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
          const cache = await caches.open(SHELL); await cache.put(HOME, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(HOME)) || (await caches.match(FALLBACK)) || Response.error();
      }
    })());
  } else if (isStatic(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
        return response;
      } catch { return Response.error(); }
    })());
  }
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'PRECACHE_URLS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    await Promise.allSettled(event.data.urls.slice(0, 300).map(async raw => {
      const u = new URL(raw, self.location.href);
      if (u.origin !== self.location.origin || !u.pathname.startsWith(SCOPE.pathname)) return;
      if (!isStatic(u) && u.pathname !== HOME) return;
      const request = new Request(u.href, { credentials: 'same-origin' });
      if (await cache.match(request)) return;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response);
    }));
  })());
});
