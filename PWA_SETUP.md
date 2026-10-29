# SSC PWA – Installation and deployment

This package was built from `SSC_Simplified_Admin_Panel_SRC.zip` (the latest version provided prior to this request).

## Copy the files

1. Merge the included `src/` folder into your existing Vite React project's `src/` folder.
2. **Also copy the included `public/` folder into the project's root `public/` folder.** This is REQUIRED; the manifest, service worker, offline fallback and icons are not under `src/`.
3. Keep your existing `package.json`, `vite.config.js`, and `index.html`; no new dependencies are needed.
4. Run your normal project build (`npm install`, `npm run build`) and deploy the compiled output to HTTPS. Don't open the generated files from a `file://` URL.
5. Visit from mobile Safari or Android Chrome. The install button is only shown for screens <=900px. A device that is already in standalone installed mode won't show it.

The manifest is linked by `src/pwa.js` at startup. Production registration happens on HTTPS or localhost. It is intentionally NOT registered during Vite development (`import.meta.env.PROD`). For local installation testing, use `npm run build && npm run preview` on localhost.

If the app is served from a **subdirectory** instead of the domain root, update manifest `id`, `start_url`, `scope`, icon URLs, and ensure Vite `base` is configured for the deployment path. This package defaults to root `/`.

## Installation behavior

- Android/Chromium: install button shows the browser prompt when `beforeinstallprompt` is available. If unavailable, a dialog explains manual installation.
- iOS/iPadOS: browser APIs do not allow opening a native install prompt. The button shows Safari's Share > Add to Home Screen instructions.
- Screen widths >900px: install button stays hidden even if the browser could install. When already installed in standalone mode, button stays hidden.

## Offline behavior

- A successful production visit caches the HTML shell and static assets; a subsequent visit can load the app offline.
- Existing inspections and forms are currently stored in **browser-local storage**, not uploaded to a server. Offline changes remain on the same device/browser and can be lost if its site data is cleared. There is **no cross-device sync** and no automatic background upload.
- Map tiles, geocoding, external URLs, server APIs and third-party fonts are not cached and require connectivity.
- The service worker never caches inspection API requests or personally entered audit data.
- The offline fallback screen appears if app assets are unavailable on a device's first offline use.

## What changed

- `src/pwa.js` (manifest injection, service worker registration, initial asset warming)
- `src/components/pwa/InstallAppButton.jsx` (install prompt + iOS instructions)
- `src/components/layout/Topbar.jsx` (mobile install control)
- `src/main.jsx` (initialization + responsive CSS)
- `src/features/templates/HxcReportDocument.jsx` (accessible per-cell labels)
- `src/components/common/WorkspaceUI.jsx` (mobile inspection register labels)
- `src/styles/pwa-mobile.css` (template studio, checklist forms, register, schedule, small-screen layout)
- `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, `public/icons/*`
