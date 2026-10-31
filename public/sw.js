/* SSC PWA: cache only the application shell and same-origin static assets.
 * Local inspection records remain in browser storage, never in the SW cache. */
const VERSION = 'ssc-pwa-v13-harmonix-summary-cards-20261101';
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const SCOPE = new URL(self.registration.scope);
const HOME = SCOPE.pathname;
const relative = path => new URL(path, SCOPE).pathname;
const FALLBACK = relative('offline.html');
const essentials = [HOME, relative('offline.html'), relative('manifest.webmanifest'),
  relative('icons/ssc-192.png'), relative('icons/ssc-512.png'), relative('icons/ssc-maskable-512.png'),
  relative('icons/ssc-apple-180.png'), relative('icons/ssc-apple-167.png'), relative('icons/ssc-apple-152.png'), relative('icons/ssc-apple-120.png')];
const isStatic = url => /\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?|ttf)(?:$)/i.test(url.pathname);
const isLocal = url => url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);

async function cacheResource(cache, url) {
  try {
    const request = new Request(url, { credentials:'same-origin', cache:'reload' });
    const response = await fetch(request);
    if (!response.ok || response.type === 'opaque') return false;
    await cache.put(url, response.clone());
    return true;
  } catch { return false; }
}

// A compiled Vite index includes the JS entry and CSS links. Precache them
// during initial installation, not only after visiting every route.
async function precacheIndexAssets(html) {
  const urls = new Set();
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    const uri = new URL(match[1], SCOPE);
    if (isLocal(uri) && isStatic(uri)) urls.add(uri.href);
  }
  const cache = await caches.open(STATIC);
  await Promise.allSettled([...urls].map(url => cacheResource(cache, url)));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const results = await Promise.all(essentials.map(url => cacheResource(cache, url)));
    // Only activate if HTML is present. An offline-first launch cannot work
    // if the entry document was never installed.
    if (!results[0]) throw new Error('SSC app shell was not available for offline installation.');
    const response = await cache.match(HOME);
    if (response) await precacheIndexAssets(await response.text());
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name =>
      (name.startsWith('ssc-pwa-') || name.startsWith('harmonix-pwa-')) && ![SHELL, STATIC].includes(name)
    ).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range') || req.headers.has('authorization')) return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (!isLocal(url) || url.pathname.includes('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        if (response.ok && /text\/html/i.test(response.headers.get('content-type') || '')) {
          const cache = await caches.open(SHELL);
          await cache.put(HOME, response.clone());
          // Prefetch a new compiled asset set when a deployment changes.
          // Keep navigation responsive; optional asset warming must never reject it.
          void precacheIndexAssets(await response.clone().text()).catch(() => {});
        }
        return response;
      } catch {
        return (await caches.match(HOME)) || (await caches.match(FALLBACK)) || Response.error();
      }
    })());
    return;
  }

  if (isStatic(url) || [relative('offline.html'), relative('manifest.webmanifest')].includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(isStatic(url) ? STATIC : SHELL);
      const cached = await cache.match(req, { ignoreSearch: false });
      if (cached) return cached;
      try {
        const response = await fetch(req);
        if (response.ok && response.type === 'basic') await cache.put(req, response.clone());
        return response;
      } catch { return Response.error(); }
    })());
  }
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'PRECACHE_URLS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    const urls = [...new Set(event.data.urls)].slice(0, 500);
    await Promise.allSettled(urls.map(async raw => {
      try {
        const url = new URL(raw, SCOPE);
        if (!isLocal(url) || (!isStatic(url) && url.pathname !== HOME)) return;
        if (await cache.match(url.href)) return;
        await cacheResource(cache, url.href);
      } catch { /* Ignore optional assets; no user records are involved. */ }
    }));
  })());
});
