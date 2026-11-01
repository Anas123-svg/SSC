# SSC / Harmonix — V14 Word Document Workspace

Built on the **new Codex-modified source uploaded on 31 October 2026**, not the prior V13 ZIP.

## Implemented

1. **Immersive Word layout:** entering Templates → HXC Audit Template opens the document editor and hides the normal SSC/Harmonix sidebar, topbar, footer, and surrounding template hero. The actual document, its ribbon, and status bar use the full application width.
2. **Editor full-screen control:** the title bar has a `Full screen` / `Exit full screen` toggle with Maximize/Minimize icons. It uses the browser Fullscreen API where permitted, with a CSS full-viewport fallback. Escape exits expanded mode. Toggling does **not** unmount Tiptap or clear its undo history.
3. **Removed side navigation:** removed the document outline pane and Navigation pane/Heading navigation ribbon actions. A compact **Go to section** selector remains in the status bar for quick navigation without a side pane.
4. **Removed Fields & Structure tab:** removed the old form-builder tab and its separate section-tree UI. Existing structured HXC fields remain editable from the document canvas with contextual field properties; insertion tools remain in the Insert ribbon. Report layout/tables are still accessible through the top-bar Report setup control.
5. **Document-centered UI styling:** improved title bar, transparent workspace logo, Save/Preview/Print controls, ribbon groups, ruler, page shadows, contextual properties popover, and responsive controls. Preview remains a measured, multi-page, read-only renderer.
6. **Theme-aware:** Harmonix lime/charcoal chrome, neutral Word paper, dark-mode chrome with white paper, and preserved SSC branding and safety-status colors.
7. **Save feedback stays visible:** save errors and notices now render *inside* the editor, including when expanded.
8. **PWA cache key:** advanced to `ssc-pwa-v17-word-immersive-fullscreen-20261101`.

## Files changed

- `src/pages/HxcTemplatePage.jsx` — simplified template workspace to document + report setup, preserving permissions, schema validation, save and snapshots.
- `src/features/templates/WordTemplateWorkspace.jsx` — fullscreen state, immersive shell integration, simplified chrome, status section selector, external save notices.
- `src/features/templates/DocumentRibbon.jsx` — removed sidebar-navigation actions.
- `src/styles/word-workspace-v14.css` — **new** Word chrome and responsive/fullscreen styling.
- `src/main.jsx` — import new stylesheet after V13 Word styles.
- `public/sw.js` — new cache version.
- `tests/word-workspace-v14.test.mjs` — **new** focused tests.
- `tests/harmonix-audit-v7.test.mjs` — update import precedence assertion.

## Verification

- `node validate-source.cjs` — passed: **101 JS/JSX files parse; all relative imports resolve**.
- New and nearby CSS/theme tests — **12/12 passed**.
- `src/styles/word-workspace-v14.css` — parsed via tinycss2 with **no parse errors**.
- Full Node suite — **104 passed, 8 failed**: six legacy routing/navigation expectations already present in the uploaded baseline plus two suites that require `jsdom`. The local `npm ci` timed out and left node_modules incomplete, so those two test modules could not load. They are not counted as passing.
- **Production Vite build, live Playwright UI, and native full-screen browser behavior were not verified here.**

## Run locally

```
npm ci
npm run build
npm test
npm run dev
```

Then verify: Templates → HXC Audit Template → Full screen → Preview → Return to editor → Save, and confirm that reloading retains edits. Use `npm run test:browser` in an environment with browser dependencies installed.

## Architectural limitation

The Codex document engine intentionally keeps one continuous Tiptap document for caret/undo stability. The editable sheet therefore remains a continuous paper canvas; **the measured A4/Letter page boundaries exist in Preview and print**, not as multiple separately editable pages. This does not claim pixel-perfect Microsoft Word desktop parity or complete native DOCX fidelity.
