# SSC / Harmonix V10 — Workspace logo, dark mode and summary-card polish

## Client workspace logo
- Removed the white tile, border and rounded rectangle from the **client** logo in both the CURRENT WORKSPACE selector and its expanded dropdown. The transparent image is displayed directly against the dropdown/sidebar surface.
- The SSC/Admin logo treatment remains intact.

## One-click appearance control
- Replaced the topbar Light / Dark / System dropdown with a single accessible button, which **shows Sun when light is active** and **Moon when dark is active**. Pressing the button switches modes and changes the icon.
- Reused that control in both Workspace Settings and Admin Settings; removed the three-choice mode cards.
- The selection is saved using the existing `ssc-appearance-mode` preference so it works offline. An existing saved `system` mode remains readable; pressing the new control switches to an explicit light/dark choice.

## Dark mode
- Harmonized topbar search container, input, placeholder, keyboard shortcut hint, focus ring and notification dropdown with light/dark workspace colors.
- Harmonized Team/Projects filters, inspections/search, calendar/search, reports, analytics, project-edit inputs and selectors without recoloring HXC safety statuses.
- Harmonix uses its charcoal/green dark palette. SSC Admin uses its own slate/pink colors.

## Team and Project KPI text
- Wrapped label text separately from icon in all three summary cards on both Team and Projects pages.
- Added spacing, proper wrapping, high-contrast title/subtitle colors, coherent numerical sizing and icon containers, with responsive adjustments.

## Technical details
- New `src/components/layout/AppearanceToggle.jsx` used by Topbar, Workspace Settings and Admin Settings.
- New `src/styles/theme-controls-v10.css` is imported LAST to override the older appearance styles consistently.
- Incremented the PWA service worker cache version for installed clients.
- All 94 JS/JSX source files parsed and their local imports resolved. All 23 CSS files parsed with PostCSS.
- 4 new regression tests pass. Full suite: 91 pass / 6 fail, with the **same six failures as the unmodified V9 codebase**. No new failures.
- Browser interaction screenshots and production Vite build were not completed in this environment. Run `npm ci && npm run build && npm test`, then check mobile/desktop Safari and installed PWA before production deployment.
