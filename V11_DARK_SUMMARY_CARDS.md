# SSC / Harmonix — V11 dark mode card consistency

## Fixed in Team and Projects

- Removed the inherited teal-blue background on the summary metric heading rows.
- Unified the six metric tiles in Harmonix dark mode with a single charcoal surface and border.
- Labels and numbers are now consistent high-contrast whites; supporting captions are neutral sage-grey. Lime is reserved for icons and their smaller tile backgrounds.
- Preserved the card dimensions, responsive grid and accessible text hierarchy.
- Scoped the visual correction to `html[data-workspace="harmonix"][data-theme="dark"]` to avoid changing SSC Admin, other workspaces, or inspection-grade colors.

## Theme toggle

- The single one-click Sun (light) / Moon (dark) toggle from V10 remains in the topbar.
- Workspace Settings and Admin Settings now use the **same icon-only button**, no labelled appearance dropdown.
- Clicking the Sun switches to dark and shows Moon; clicking Moon switches back to light and shows Sun. The appearance is saved to browser storage for use offline.

## Technical details

- Added `src/styles/harmonix-summary-cards-v11.css` after V10 controls in `src/main.jsx`.
- Removed the shared `ssc-v2-stat-label` entry from an earlier broad dark styling rule so header rows no longer receive a teal-blue background.
- Updated PWA cache namespace to `ssc-pwa-v13-harmonix-summary-cards-20261101`.
- Added four regression tests; all pass. Full suite has **95 passed / 6 existing failures**, matching the V10 six-failure baseline.
- All 94 JavaScript / JSX files parse and local relative imports resolve. New stylesheet parses cleanly.
- Production build could not be run because npm dependencies were not available offline; a browser preview attempt also stalled. Verify via `npm ci && npm run build` and test both desktop and mobile before production.
