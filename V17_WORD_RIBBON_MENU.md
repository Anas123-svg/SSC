# V17 — Modern Word-style Ribbon Menu

## Changed
- `src/features/templates/DocumentRibbon.jsx`: introduced a clearly separated document menu with **File, Home, Insert, Layout, References, Review, View, Help**, plus context-dependent Table Design, Table Layout, and Picture. Kept existing commands and editing engine.
- `src/styles/word-workspace-v17.css`: modernized typography, spacing, hover/active/focus states, separate File entry, context-tab styling, dark-mode colors, overflow behavior, and print hiding. Styles are scoped to `.hxword`, so SSC Admin's global UI is not modified.
- `src/main.jsx`: loads V17 CSS last so previous Word / Harmonix styles no longer compress the menu.
- `public/sw.js`: updated cache version to refresh installed PWAs.
- `tests/word-ribbon-navigation-v17.test.mjs`: added regression tests for menu tabs, keyboard navigation, ribbon collapse, responsive behavior, dark mode, and stylesheet order.
- `tests/harmonix-audit-v7.test.mjs`: updated import-order check to account for the new last override.

## Behavior
- Tab selection opens the corresponding existing functional ribbon controls.
- Tab navigation supports **Left/Right arrow, Home, End** while focused on the ribbon tabs.
- At compact widths, tabs can be scrolled horizontally using touch, trackpad, or arrow controls.
- The **Hide ribbon / Show ribbon** control increases document space without unmounting or resetting the Tiptap editor. Double-clicking a ribbon tab also toggles the ribbon.
- Dark mode keeps sufficient contrast; document paper remains white.

## Verification
- Source parsing: **104 JavaScript/JSX files parsed; no missing relative imports**.
- V17 CSS: parsed using `tinycss2` without syntax errors.
- New V17 tests: 4 passed.
- Focused V17 + existing Word tests: 12 passed.
- Full test suite: **118 passed, 8 failed**. Identical eight failed tests exist on the supplied V16 baseline; 2 tests are blocked by missing `jsdom` and the others are legacy navigation assertions.
- `npm run build`: **could not run** because Vite isn't installed (`vite: not found`). Run `npm ci && npm run build` in an environment with npm registry access.
- Headless Chromium visual preview: timed out; visual results are unverified.
