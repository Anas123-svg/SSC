# Harmonix Offline PWA — setup and verification

**Source:** Based on the latest simplified Admin + responsive PWA package, with the updated HXC editor, inspection workflows and project pages preserved.

## Install the patch

1. Merge the ZIP `src/` and `public/` folders with your existing Vite project's folders. Do not delete other existing assets in `public/`.
2. Replace your root `index.html` with the supplied version. It removes remote Google Fonts, sets Harmonix branding, and links the PWA manifest.
3. Keep your project's `package.json` and Vite configuration. Run `npm install` and `npm run build`, then deploy the **production** build over HTTPS.
4. On mobile, first load the deployed app **online**, then use the Install App control (Chrome Android) or Safari Share → Add to Home Screen (iOS). Do not test by opening raw files with `file://`.
5. After that first online visit, try airplane mode, reopen the PWA, open Templates and Inspections, create a Draft, sign and save it, then reload while still offline.
6. If an old build persists after replacement, close the installed app, reopen it online to update the service worker, and reload. A previously installed SSC app may remain separate because this manifest identifies the Harmonix app.

## What works offline, and limitations

- The previously cached application UI, project and inspection records, HXC template builder and fillable report, signatures, local image entry, scoring, filtering and browser-local saves are designed to work offline on the **same device**.
- New pages are made from the same locally bundled code. The service worker caches the app entry HTML and compiled JS/CSS, with a second asset-warming pass after the first load.
- **No server sync exists.** Data saved offline in this version stays in browser storage. Do not clear site data, remove the installed app, or change browser profiles without first exporting a backup in Settings. Browser storage can still run out (especially with many photos); the app reports storage errors rather than claiming a save succeeded.
- **OpenStreetMap tiles, live map search, GPS permissions, external links and any future server-backed functionality are not fully available offline.** The project map shows an offline notice, and manually entered coordinates and saved project locations remain available.
- This archive does not include the project's npm dependency manifest or a full production browser environment. Run a production build and install/offline tests on each target device before release. No code change can guarantee zero exceptions on every device.

## Installation details

- `public/manifest.webmanifest`: Harmonix name, icon, and Harmonix workspace as start URL.
- `public/sw.js`: versioned shell and compiled asset cache, network-first document reload with offline fallback; no private inspection records are cached by the service worker.
- `src/pwa.js`: registers service worker and warms downloaded static resources in production.
- `src/app/App.jsx`, `src/app/routes.js`: direct default to Harmonix; explicit Admin links still work.
- `src/app/AppErrorBoundary.jsx`: recovery UI for page render failures without deleting saved data.
- `src/styles/pwa-readability.css`: local system-font stack and mobile legibility for templates and inspections.
- `src/components/projects/ProjectLocationPicker.jsx`: offline fallback for map search and tiles.
- `index.html`: removes third-party font downloads and sets Harmonix browser branding.

**Development:** PWA worker is intentionally registered only with production builds on HTTPS or localhost. Use `npm run build` + `npm run preview` for local install/offline testing.
