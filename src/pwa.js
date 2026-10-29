/** Installable PWA assets live under /public and are served at the app origin root. */
export function initPWA() {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = `${import.meta.env.BASE_URL}manifest.webmanifest`;
    document.head.appendChild(manifest);
  }
  for (const [name, content] of [['apple-mobile-web-app-capable', 'yes'], ['apple-mobile-web-app-status-bar-style', 'default'], ['apple-mobile-web-app-title', 'SSC']]) {
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
    const warm = async () => {
      try {
        const ready = await navigator.serviceWorker.ready;
        const worker = ready.active;
        if (!worker) return;
        const base = new URL(import.meta.env.BASE_URL, location.href);
        // Build assets are loaded by Vite before register; these include bundled
        // inspection/template code and their CSS. Warm *all* local resources.
        const resources = [base.href, ...Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"],link[rel="modulepreload"],img[src]')).map(el => el.src || el.href),
          ...performance.getEntriesByType('resource').map(entry => entry.name)];
        const urls = [...new Set(resources)].filter(raw => {
          try {
            const url = new URL(raw, location.href);
            return url.origin === base.origin && url.pathname.startsWith(base.pathname) &&
              (url.pathname === base.pathname || /\.(?:js|css|png|jpe?g|svg|webp|woff2?|ico)$/i.test(url.pathname));
          } catch { return false; }
        });
        worker.postMessage({ type: 'PRECACHE_URLS', urls });
      } catch (error) { console.warn('SSC PWA: asset warming unavailable', error); }
    };
    const register = () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then(() => warm())
      .catch(error => console.warn('SSC PWA: offline installation unavailable', error));
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    navigator.serviceWorker.addEventListener('controllerchange', warm);
    window.addEventListener('pageshow', warm);
  }
}
