# Harmonix — Inspections and Templates UI theme (v5)

This release builds on **SSC_Harmonix_Real_Project_Photos_Maps_v4**. All previous HXC editing, project-map/photo functionality and workspace routing remain in place.

## Harmonix workspace only

The new `src/styles/harmonix-inspections-templates.css` is imported after `harmonix-finish.css`, with every rule scoped to `html[data-workspace="harmonix"]`. The accent is **#B6D552**, paired with the charcoal and muted green palette used throughout the refreshed Harmonix workspace. It does **not** change the SSC Admin theme.

- **Inspections list:** revised heading and eyebrow tones, lime primary actions, metric icons, active tabs, search focus and filters, register table, row-open controls, empty state, and individual inspection detail cards.
- **Templates:** revised HXC catalog card and available badge, template editor mode tabs, active section and add-section controls, block editing state, input focus and secondary actions, table editor and report settings.
- **Word-style editor:** toolbar and ribbon colors now align with the Harmonix workspace. The editable paper itself stays white.
- **HXC inspection form:** surrounding actions and on-screen report headings/table headers follow Harmonix branding. The HXC document retains its legible white page presentation.
- **Dark theme:** coordinated charcoal panels, muted green surfaces, high-contrast text and lime selections for both screens, without darkening the printable report.

**Safety grades are unchanged:** C = green, MI = amber, MA = red, and N/A = unfilled. Destructive actions continue to use red where appropriate.

## Checks

- Source parse/import resolution: `node validate-source.cjs` — successful.
- CSS parser (`tinycss2`): no syntax errors in new stylesheet.
- Focused new tests: `node --test tests/harmonix-inspections-templates.test.mjs` — passed.
- Full suite: run `npm test`. The previous v4 codebase had seven existing failing tests; this update does not change the application logic they exercise.

A production Vite build and reliable live-browser review were not available in this environment. Check the deployed pages in both light and dark mode and clear the PWA/service worker cache if old styles remain.
