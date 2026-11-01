# V15 — Editable HXC template fields

## What changed
- The Word-style template document now shows editable controls within every standard HXC compliance checklist row: Ref, Compliance dropdown (template preview only), Evidence / Appendix Reference placeholder, and Action Reference placeholder. Custom checklist column placeholders are also editable.
- The contextual HXC field properties panel supports changing compliance choice **display labels** for C / MI / MA / N/A, choosing a template preview selection, editing Evidence/Action placeholders, and changing shared checklist column headings. **The safety codes themselves remain fixed** because inspection validation and scoring depend on them.
- Other select/radio/checkbox fields support editing their options and response hints in field properties.
- Other placeholder fields (cover details, summary, corrective action tracker, photo appendix) now have editable text controls in the document. Section score/rationale/action captions are also editable.
- Inspection form/report compliance dropdowns use the chosen display labels while storing the same codes; evidence and action inputs use the configured placeholders.
- The existing template save flow stores these changes in the HXC schema/document, keeping field IDs, answer keys, and historic inspection snapshots intact.
- The Harmonix lime/charcoal theme, SSC theme, full-screen mode and Word-style preview remain preserved.

## Usage
Open Templates → HXC Audit Template → Document Editor as Admin/Super Admin. Edit the reference, preview dropdown, evidence, or action field directly inside an audit row. Focus one of those fields to open its properties panel; there you can change compliance option names, placeholders, and shared column headings. Click Save. In Preview, placeholders are shown; actual inspection answers are still recorded separately when an inspection is completed.

## Important distinctions
- Choosing a compliance code inside the template editor sets a **preview example**, **not** a prefilled inspection answer.
- Compliance choices cannot change their core codes (C, MI, MA, N/A) without changing safety scoring logic. Only their user-facing labels can change.
- The editor remains a Word-style browser editor rather than native Microsoft Word.

## Verification
- `node validate-source.cjs` passed (102 JavaScript/JSX source files).
- `node --test tests/editable-checklist-v15.test.mjs` passed (4/4).
- `npm run build` could not execute: this container's dependency installation is incomplete and `vite` is missing.
- A live browser verification is still required for the Tiptap node-view controls, preview and save/reload interactions.
