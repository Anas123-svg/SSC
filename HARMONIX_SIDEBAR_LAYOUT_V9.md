# Harmonix sidebar top-layout refinement — V9

The Harmonix workspace header is now laid out to match the **structure** shown in the user-supplied SSC sidebar screenshot, without copying SSC's pink palette.

## Header structure
1. **Top row:** the user-provided transparent Harmonix logo at left, a vertical divider, then two lines: `Harmonix` and `Construction` at right.
2. **Subtitle:** `Construction · Site safety` beneath the top row.
3. **Full-width border:** separates the brand header from the workspace selection.
4. **Current workspace section:** retains `CURRENT WORKSPACE` above the clickable switcher row, with the Harmonix logo/avatar, name, `Client workspace`, and dropdown chevron.

The header remains part of the fixed sidebar, not the page topbar, with responsive sizing for mobile widths. The application continues to use Harmonix's charcoal background and client-provided lime accent `#B6D552`, retaining the transparent PNG logo. SSC Admin's look and its header content are unchanged.

## Changed files
- `src/components/layout/Sidebar.jsx` — shares the original two-column lockup layout for SSC and Harmonix, with contextual text.
- `src/styles/harmonix-complete-audit.css` — replaces the oversized V8 Harmonix header with the compact screenshot-style layout, scoped to Harmonix only.
- `public/sw.js` — bumps the PWA cache version so installed clients fetch the updated styles and source.
- `tests/harmonix-sidebar-layout-v9.test.mjs` — adds regression coverage for layout, theme isolation, and transparency.

## Validation
- 93 JavaScript/JSX source files parsed and all local relative imports resolved.
- Harmonix theme CSS parsed with PostCSS.
- 7 focused sidebar/branding tests passed.
- Full suite: 87 pass, six pre-existing unrelated navigation/analytics failures (unchanged versus V8 baseline).
- A live Chromium screenshot attempt timed out, so the finished layout still needs browser/device visual QA.

Run `npm ci && npm run build && npm test` locally before publishing. PWA users may need to reload after deployment for the updated service worker to take control.
