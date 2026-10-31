# SSC / Harmonix — Frontend Upgrade (1 November 2026)

## HXC compliance colours
The HXC report compliance dropdown and the original audit-checklist choice buttons use C = green, MI = amber, MA = red and N/A = unfilled. No change to grading, validation, section scoring or old saved audit snapshots.

## Word-style HXC template editing
Open **Templates → HXC Audit Template → Document editor**. Add **Document text** from Add content. Expand the block and use the local formatting ribbon for bold/italic/underline/strikethrough, headings, font/size, text and highlight colours, alignment, lists, indent, undo/redo, hyperlinks, tables and horizontal rules. Existing interactive HXC field blocks, tables, signatures and evidence uploads remain in the builder. Save changes as usual; new inspections get the revised schema and existing inspections retain their snapshot.

This is a **Word-like browser editor**, not a complete Microsoft Word implementation. It does not support DOCX round-tripping, comments, track changes, collaborative editing, full pagination, or every advanced Word layout feature. Browser `execCommand` is used for local/offline rich formatting; check on deployed Safari and Android browsers.

Pasted external formatting is converted to plain text to avoid injected markup. Stored rich text is filtered to a restricted set of safe HTML tags and text styles before being rendered in inspection reports.

## Project card visuals
**Projects & Locations** now shows **both** a project image and a map panel together. If no photograph has been uploaded yet, a demo project image is shown. If no coordinates exist or live tiles are unavailable, a demo map is shown instead. Add a photograph in **Edit project → Site photograph** to replace the demo image with the real site photo. The address and project manager remain visible. Photos are resized/compressed and stored locally; live map tiles require internet and degrade gracefully when unavailable.

## Workspace branding and appearance
Harmonix workspace uses the requested Harmonix website palette led by **#B6D552** in its sidebar, dashboard, primary controls, and navigation. The prior built-in Harmonix mark was replaced with a refreshed website-style Harmonix wordmark asset. SSC Admin retains the existing charcoal/pink brand. The sidebar wordmark changes to the selected workspace; the installed PWA name and app icon stay SSC.

Use the **top bar appearance selector** or **Settings → Appearance** to choose Light, Dark or Match device. Dark mode is applied across workspaces with high-contrast form elements and chart labels; printed HXC document pages remain white for paper readability. Choice is stored under `ssc-appearance-mode` in `localStorage` for use offline. Default is Light to retain the existing SSC look.

## Verification
- New feature tests can run using `node --test tests/feature-upgrade.test.mjs`.
- The supplied original has six pre-existing failing tests about old sidebar / admin routing expectations. Compare against the baseline archive before attributing them to this upgrade.
- Local install/build needs node modules: run `npm ci && npm run build && npm test` with npm registry access; this environment has no cached dependencies for an offline `npm ci`. **A production build and real-device interaction tests were not run in this sandbox.**
- Check that the build/deployment uses the new service worker version so updated CSS/JS are refreshed in installed PWAs.


## Live construction photographs & real maps (revision 4)
Project cards now contain a real Unsplash-sourced construction photograph and a live OpenStreetMap thumbnail side by side, replacing previous SVG illustrations. Each reference photo is explicitly labelled **Reference photo** and links to its credited Unsplash photographer. The bundled projects are sample records, so their reference photos are not claimed to depict those sites.

All bundled sample projects have only city names, not real street addresses. Their map previews use real OSM tiles centred on those cities, visibly labelled **City area map** and intentionally drawn *without* an exact site pin. Cards with saved latitude/longitude show a closer map and a site pin. Map opens in OpenStreetMap in a new tab. Missing or failed tiles do not fabricate a location. The client browser fetches live map tiles, so maps require network access and may be unavailable offline.

When editing a project, use **Site photograph → Upload site photo**, or enter an HTTPS URL in **Online site photo URL**. Uploaded photos take precedence, then the URL, then the credited representative online photo. Photo previews require internet unless the user has uploaded a local photo or the browser has separately cached the remote image. This change does not modify existing inspection data or the SSC icon/theme.

Sources: individual Unsplash free-photo pages (see `src/data/projectCardPhotos.js`) and city-area coordinates (see `src/data/projectCardLocations.js`). Map tiles from `tile.openstreetmap.org` with attribution visible on each map.
