# SSC / Harmonix V13 — Word-style HXC Template Workspace

## What changed
The main **Templates → HXC Audit Template → Document editor** now opens a Word-style browser document workspace rather than the compact field builder. This update starts from the fully updated V12 source, retaining its Harmonix lime theme, SSC Admin styling, dark mode, calendar fixes, project cards, PWA setup and HXC compliance colors.

- Familiar Word-style file/title bar and **File, Home, Insert, Layout, References, Review, View** ribbon tabs.
- Formatting: fonts, approximate browser text sizes, title/headings, bold, italic, underline, strikethrough, subscript/superscript, text color and highlight, alignment, numbered/bulleted lists, indentation, clear formatting, undo/redo.
- Insert links, rich text tables, dividers, dates/symbols and HXC photo, response table, signature and compliance-answer fields.
- Find, Find Next, Replace and Replace All **within the active rich-text block**. Browser-native spellcheck.
- A4/Letter page-size preview, portrait/landscape orientation, normal/narrow/wide margins, page ruler and 50–150% zoom; these are **editor canvas preferences** stored in `reportConfig.editorPage` in the HXC template.
- Single paper-like document canvas, a section navigation outline, word/character count, basic printing (using browser Print → PDF), standalone HTML export of the active rich-text block.
- Editable HXC section title/description and audit requirements beneath the page; existing question IDs, options, scoring, saved inspection snapshots and report template layout are preserved. **Fields & structure** retains the detailed template-builder tools for complex table layout, question choices, and signatures.
- Multiple formatted-text blocks remain separate; the document editor provides a selector for them. Existing blocks are not flattened, silently moved, or deleted.
- Save via the main **Save changes** action or Ctrl/Cmd+S inside the editor. Ctrl/Cmd+F opens Find within the active editor.
- Safe text paste, URL restrictions and existing rich-text sanitization are preserved. Clipboard toolbar paste requires browser permission; Ctrl/Cmd+V works without it.

## Important limitations
This is a Word-style HXC **web editor, not Microsoft Word**. It does **not** offer true DOCX editing or full DOCX import/export, multi-user collaboration, track changes, comments, mail merge, macros, advanced shapes, exact Word pagination, or all Office layout functions. The page controls affect the **editing canvas**, not the separately configured HXC report/PDF formatting. For the full report output, use **Preview form** and **Report layout & tables**.

HTML export downloads only the active rich-text block, not the whole inspection report. Inspectors still fill in HXC questions in the normal inspection form; the Word-style page is for template editors.

## Architecture and touched files
- `src/features/templates/RichTextEditor.jsx`: extended ribbon and live editable page.
- `src/features/templates/WordTemplateWorkspace.jsx`: new document workspace and schema-backed HXC fields.
- `src/pages/HxcTemplatePage.jsx`: new default document view; keeps the builder and preview.
- `src/features/templates/hxcReportConfig.js`: persisted editor canvas settings.
- `src/styles/word-template-v13.css`: responsive Word-style UI, print and dark mode.
- `src/main.jsx`: new stylesheet loaded after V12.
- `public/sw.js`: cache revision.
- `tests/word-template-v13.test.mjs`: four feature tests.
- `tests/harmonix-audit-v7.test.mjs`: stylesheet-order assertion updated for V13.

## Validation
- `node validate-source.cjs`: passed, 95 JavaScript/JSX files parsed and relative imports resolved.
- `tinycss2` parsed `word-template-v13.css` with zero top-level parse errors.
- `node --test tests/word-template-v13.test.mjs`: 4/4 passed.
- Full suite: **103 passed, 6 failures**, the same six pre-existing legacy routing tests as V12; no new failures.
- No npm dependencies installed in this environment: **`npm ci && npm run build` and real-browser editing tests are still required** before deployment. Test especially Safari/iOS contentEditable, clipboard permission, text selection across toolbars, and printing.
