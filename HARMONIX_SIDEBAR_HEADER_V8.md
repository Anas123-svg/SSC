# V8 · Harmonix sidebar top / logo header

## Scope
The top logo area of the Harmonix workspace is visually integrated into the **same fixed charcoal sidebar** as navigation. It is not a floating white card or a separate content top bar.

- Preserves the user-uploaded transparent Harmonix PNG in `public/harmonix-logo.png`.
- Uses a full-width brand section, matching the sidebar charcoal, with a subtle bottom divider and lime accent line.
- Gives the logo more usable size and keeps its transparency without a white plate.
- Keeps workspace switching immediately underneath the brand section.
- Adjusts header height and the mobile close button for narrow screen sizes.
- Scoped only to `html[data-workspace="harmonix"]`; SSC Admin remains unchanged.
- Bumps the service-worker cache version to deliver the new styling to installed PWA users after deployment.

## Files
- `src/components/layout/Sidebar.jsx`
- `src/styles/harmonix-complete-audit.css` (last-loaded stylesheet)
- `public/sw.js`
- `tests/harmonix-sidebar-header-v8.test.mjs`

## Validation
- JS/JSX source parsed and local relative imports resolved.
- New sidebar tests pass.
- CSS stylesheet parsed using tinycss2.
- Full node tests: 85 pass, 6 legacy failures (same baseline as V7).
- Browser rendering and production build still require a local check with dependencies installed.
