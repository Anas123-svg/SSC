# Site Safety Consultants (SSC) Offline PWA — setup and verification

**Source:** Based on the latest simplified Admin + responsive PWA package, with the updated HXC editor, inspection workflows and project pages preserved.

## Install the patch

1. Merge the ZIP `src/` and `public/` folders with your existing Vite project's folders. Do not delete other existing assets in `public/`.
2. Replace your root `index.html` with the supplied version. It removes remote Google Fonts, sets SSC branding, and links the PWA manifest.
3. Keep your project's `package.json` and Vite configuration. Run `npm install` and `npm run build`, then deploy the **production** build over HTTPS.
4. On mobile, first load the deployed app **online**, then use the Install App control (Chrome Android) or Safari Share → Add to Home Screen (iOS). Do not test by opening raw files with `file://`.
5. After that first online visit, try airplane mode, reopen the PWA, open Templates and Inspections, create a Draft, sign and save it, then reload while still offline.
6. If an old build persists after replacement, close the installed app, reopen it online to update the service worker, and reload. The manifest keeps the same app ID, so a previous installation should update its name and icon when the browser refreshes the manifest. Some devices may need an icon refresh or reinstall.

## What works offline, and limitations

- The previously cached application UI, project and inspection records, HXC template builder and fillable report, signatures, local image entry, scoring, filtering and browser-local saves are designed to work offline on the **same device**.
- New pages are made from the same locally bundled code. The service worker caches the app entry HTML and compiled JS/CSS, with a second asset-warming pass after the first load.
- **No server sync exists.** Data saved offline in this version stays in browser storage. Do not clear site data, remove the installed app, or change browser profiles without first exporting a backup in Settings. Browser storage can still run out (especially with many photos); the app reports storage errors rather than claiming a save succeeded.
- **OpenStreetMap tiles, live map search, GPS permissions, external links and any future server-backed functionality are not fully available offline.** The project map shows an offline notice, and manually entered coordinates and saved project locations remain available.
- This archive does not include the project's npm dependency manifest or a full production browser environment. Run a production build and install/offline tests on each target device before release. No code change can guarantee zero exceptions on every device.

## Installation details

- `public/manifest.webmanifest`: SSC name and original SSC logo icon; Harmonix workspace remains the start URL.
- `public/sw.js`: versioned shell and compiled asset cache, network-first document reload with offline fallback; no private inspection records are cached by the service worker.
- `src/pwa.js`: registers service worker and warms downloaded static resources in production.
- `src/app/App.jsx`, `src/app/routes.js`: direct default to Harmonix; explicit Admin links still work.
- `src/app/AppErrorBoundary.jsx`: recovery UI for page render failures without deleting saved data.
- `src/styles/pwa-readability.css`: local system-font stack and mobile legibility for templates and inspections.
- `src/components/projects/ProjectLocationPicker.jsx`: offline fallback for map search and tiles.
- `index.html`: removes third-party font downloads and sets SSC browser branding.

**Development:** PWA worker is intentionally registered only with production builds on HTTPS or localhost. Use `npm run build` + `npm run preview` for local install/offline testing.

## Brand and landing page

The installed app displays the name **SSC** and uses the original pink **SSC** logo on navy as its home-screen and launcher icon. **Site Safety Consultants** remains the full organization name in its description and page title. The default in-app workspace is still **Harmonix**. These are intentionally separate: platform branding vs. client workspace.

If the previous installed icon remains, open the deployed app online, reload to activate the updated service worker, and allow the launcher to refresh its metadata. On iOS, removing and adding the home-screen icon again may be necessary for the new name and icon to appear.

For an existing Harmonix-labelled installation: deploy this updated package, reopen the website online, and if the launcher still shows the old name/icon uninstall the old PWA and reinstall SSC. Device launchers can retain outdated icons/labels independently of web caches.

## Apple iPhone and iPad installation (Safari)

SSC is an installable **web app**, not an App Store package. The **Get SSC App** button appears on iPhones and iPads while browsing the website; tapping it shows Apple-specific instructions because Safari has no `beforeinstallprompt` API.

1. Deploy the built app to **HTTPS** and open its URL in **Safari** while online.
2. Tap **Get SSC App**, or tap Safari's **Share** control (on some iPhones, the page menu → Share).
3. Choose **Add to Home Screen**. If you cannot see it, use **Edit Actions** in the Share sheet.
4. Enable **Open as Web App** (if shown), then tap **Add**.
5. Launch **SSC** from the Home Screen. It opens the **Harmonix** workspace and keeps the SSC launcher name and icon.
6. Once the app has been opened online and its cache is populated, test offline use by switching to Airplane Mode. Offline use is device-local, and live maps still need internet.

**Apple assets:** Apple-specific icons at 120, 152, 167 and 180 pixels are included under `public/icons/` and referenced in `index.html`. The regular web manifest uses SSC icons too. The install UI intentionally does **not** claim iOS supports a one-tap silent download.

**Deployment note:** iOS may keep an older launcher label/icon. If so, remove the old Home Screen app and add it again from Safari after deployment. Verify on real iPhone and iPad devices before calling the release production-ready.
