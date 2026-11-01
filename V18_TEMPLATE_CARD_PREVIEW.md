# V18 — Template card editor / preview actions

## What changed

- `src/pages/TemplatesPage.jsx`: The HXC Audit Template card now presents two **independent buttons**: **Open document editor** (same existing Word/Tiptap workspace, respecting Admin permissions) and **Preview template** (the saved template in a read-only print preview).
- `src/pages/HxcTemplatePreviewPage.jsx` (new): Reads the saved HXC template through `getHxcSchema` / `getReportConfig`, reuses `editorDocument` if present and reconstructs it from schema otherwise, renders with the same Tiptap extensions and opens the established `DocumentPreview` without mounting the rich-text editing UI or providing a save action.
- `src/features/templates/DocumentPreview.jsx`: Accepts optional title/back-label and read-only preview note; hides the inspection selector when no inspections were supplied. Existing editor preview behavior and pagination/printing remain unchanged.
- `src/styles/template-catalog-actions-v18.css` (new): Dedicated two-button card layout, separate preview page sizing and toolbar, responsive/dark styling, theme-scoped accents (SSC pink and Harmonix lime).
- `src/main.jsx`: Loads the V18 stylesheet after V17.
- `public/sw.js`: Bumps the PWA cache version.
- `tests/template-actions-v18.test.mjs` (new): Four source-level integration/route tests. The existing style-order test was updated for the new stylesheet.

## How to use

1. Open **Templates**.
2. On **HXC Audit Template**, select **Open document editor** for the existing editable Word workspace, or **Preview template** for the saved read-only print layout.
3. In preview, use the page controls, zoom, view layout and Print / Save as PDF. Click **Back to templates** to return to the catalog. Preview never saves or changes the template or past inspections.

## Verification

- `node validate-source.cjs`: 105 JS/JSX files parse and local imports resolve.
- `node --test tests/template-actions-v18.test.mjs`: 4/4 passed.
- `node --test tests/*.test.mjs`: 122 passed, eight pre-existing failures. Six are navigation/routing assertions and two fail to load because the dependency install is incomplete.
- `tinycss2` parsing of the V18 stylesheet: no syntax errors.
- `npm run build`: Not verified; local dependencies do not provide `vite` (`sh: vite: not found`).
- Live-browser visual verification: not performed in this environment.

The ZIP is a source package; install dependencies before running the app.
