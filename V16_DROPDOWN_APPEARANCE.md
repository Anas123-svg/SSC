# V16 — Compliance dropdown appearance + Word editor polish

## Where to find the controls

1. Open **Templates → HXC Audit Template → Document editor**.
2. Select or focus any compliance dropdown in the document.
3. In **Field settings → Dropdown appearance**, choose **C**, **MI**, **MA**, **N/A**, or **Empty**.
4. Set the **Fill**, **Text**, and **Outline** colors. The sample control updates as you edit.
5. Use **Reset C/MI/MA/N/A/Empty**, **Reset all**, or **Apply these colors to all compliance fields**.
6. Click **Save** in the Word editor. Your template, future inspection controls, and document preview use the saved colors.

### Scope and safety

- All five states have separate optional color overrides. Original colors are kept by default: C = green, MI = amber, MA = red, N/A = white/unfilled, empty = white.
- The HXC response codes, scoring rules and historic inspection answer snapshots do **not** change. Template colors are saved with each field definition (`complianceColors`) under the existing schema and included in subsequent snapshots.
- The color inputs accept only `#RRGGBB` values. Invalid stored values fall back to semantic defaults.
- A contrast check flags low-contrast text and offers **Fix text color**.
- Native dropdown *popup option colors* may be controlled by the browser/OS; the selected dropdown, Word preview, print document, and template swatches retain the chosen colors.

## UI refinements

- Updated the Word ribbon, property panel, and inline controls with simpler spacing, neutral surfaces, subtle borders, consistent focus rings, and minimal lime accents.
- Moved color customization to the top of the contextual compliance properties panel and collapsed more advanced option/table settings.
- Added a mobile bottom-sheet layout for field settings, including a stable scrollbar.
- Dark editor chrome retains legible form controls while the document paper remains white.
- SSC application pages outside the Word workspace are untouched.

## Main files changed / added

- `src/features/templates/hxcComplianceColors.js` — validated palette, safe CSS-variable serialization, contrast checks.
- `src/features/templates/CompliancePaletteEditor.jsx` — compact interactive color editor, preview, reset and apply-to-all controls.
- `src/features/templates/hxcEditableChecklist.js` — live template dropdown color updates.
- `src/features/templates/documentExtensions.js` — serialized style variables for preview/print.
- `src/features/templates/WordTemplateWorkspace.jsx` — contextual palette UI and schema update commands.
- `src/features/templates/HxcReportDocument.jsx`, `FormBlock.jsx` — saved palette applied to future inspection controls.
- `src/styles/word-workspace-v16.css`, `src/main.jsx` — scoped editor design layer.
- `public/sw.js` — PWA cache version refresh.
- `tests/hxc-compliance-palette-v16.test.mjs` — palette, validation, contrast, persistence and integration checks.

## Validation

- TypeScript syntax parsing and local import resolution passed for 104 JS/JSX files.
- New and focused palette tests passed.
- Full test suite: 122 tests, **114 passed, 8 failed**. Of these failures, six are existing navigation/legacy assertions and two are test files requiring npm dependencies (`document-engine`, `feature-upgrade`).
- `npm ci --offline` failed because `yallist-3.1.1.tgz` is absent from the npm cache. No production Vite build or live-browser visual verification was possible in this environment.

Before deployment, run `npm ci && npm run build && npm test` with registry access and verify dropdown colors in live Safari/Chrome, the saved-inspection screen and print/PDF.
