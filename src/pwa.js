/** Installable PWA assets live under /public and are served at the app origin root. */
export function initPWA() {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = `${import.meta.env.BASE_URL}manifest.webmanifest`;
    document.head.appendChild(manifest);
  }
  for (const [name, content] of [['apple-mobile-web-app-capable', 'yes'], ['apple-mobile-web-app-status-bar-style', 'default'], ['apple-mobile-web-app-title', 'SSC Inspections']]) {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const tag = document.createElement('meta'); tag.name = name; tag.content = content; document.head.appendChild(tag);
    }
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const icon = document.createElement('link'); icon.rel = 'apple-touch-icon'; icon.href = `${import.meta.env.BASE_URL}icons/ssc-192.png`; document.head.appendChild(icon);
  }
  const theme = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
  theme.name = 'theme-color'; theme.content = '#153e56';
  if (!theme.isConnected) document.head.appendChild(theme);
  if ('serviceWorker' in navigator && import.meta.env.PROD && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
        .then(async () => {
          const ready = await navigator.serviceWorker.ready;
          const worker = ready.active;
          if (!worker) return;
          // Assets loaded before the very first SW activation would not otherwise
          // have passed through its fetch handler. Warm the offline shell now.
          const urls = [import.meta.env.BASE_URL, ...performance.getEntriesByType('resource').map(entry => entry.name)]
            .filter(url => {
              try { const parsed = new URL(url, location.href); return parsed.origin === location.origin && /\.(js|css|svg|png|jpe?g|webp|woff2?)(\?|$)|\/$/.test(parsed.pathname); }
              catch { return false; }
            });
          worker.postMessage({ type: 'PRECACHE_URLS', urls: [...new Set(urls)] });
        })
        .catch(error => console.warn('SSC PWA offline registration was not available:', error));
    }, { once: true });
  }
}
