# Harmonix Construction — visual theme refinement

This pass builds on the SSC/Harmonix v2 project-card and HXC template update.

## Brand system
- Primary Harmonix accent: **#B6D552** (user-supplied).
- Workspace navigation: charcoal/forest-neutrals **#26312D**, **#1F2926**, and **#151E1B**; lime selected-navigation background with dark legible icons/text; consistent focus indicators.
- Main app: warm off-white **#FCFDF8** canvas, white cards with soft gray-green borders, deep charcoal headings, green-neutral secondary text.
- Dashboard: one primary lime metric tile, adjacent charcoal metrics, lime chart bars and understated supporting colors.
- Dates, analytics, project details, reports, template-builder active states and buttons are Harmonix-colored; safety warnings remain red/orange as before.
- Dark mode: green-leaning deep-charcoal backgrounds, muted green borders, light text, lime primary actions and accessible hover/focus states.

All new styling is scoped under `html[data-workspace="harmonix"]`, so Admin/SSC retains the existing pink/charcoal design. Application theme selection continues via `html[data-theme="dark"]` and local storage; PWA app identity remains SSC. Earlier HXC C/MI/MA/N/A semantic grading, demo photo+map project tiles and rich-text template editor are unchanged.

## Implementation
- New `src/styles/harmonix-finish.css` is loaded **after** `appearance-upgrade.css` from `src/main.jsx` to form a single predictable finishing layer without altering the SSC theme.
- `src/pages/DashboardPage.jsx`: lime completed series and neutral other-status bars.
- `src/pages/AnalyticsPage.jsx`: workspace-dependent series and pie colors (SSC unchanged).
- `src/pages/ReportingPage.jsx`: conditional chart accents for older reporting views.
- `src/styles/appearance-upgrade.css`: removed residual teal values from Harmonix-specific overrides.
- `public/sw.js`: bumped cache version for updated styles and app shell after deployment.
- `tests/harmonix-theme.test.mjs`: checks workspace isolation, chart color separation and preservation of audit grade colors.

## Limitations / verification
- JavaScript/JSX parse/import validation: passed (91 files).
- PostCSS parse of affected stylesheets: passed.
- New Harmonix theme tests: 3 passed.
- Full suite: 75 tests; 68 passed / 7 failed, exactly matching prior v2 package (no new failures). These failures concern legacy navigation and the now-replaced built-in logo reference.
- Production build and real-browser responsive visual QA remain to be done: project dependencies are not installed locally and Chromium headless preview did not finish rendering in this environment. After deployment run `npm ci && npm run build && npm test`, then smoke-test desktop/mobile Safari/Chrome, dark mode, and offline PWA.
- Branding asset note: the existing `/harmonix-logo.png` in v2 is a **locally created uploaded transparent logo asset**, not a verified download of the official logo from harmonixconstruction.com. This color/UX refinement does not claim to replace it with a verified official company asset. To achieve exact-logo fidelity, replace that asset with a licensed official logo file.
