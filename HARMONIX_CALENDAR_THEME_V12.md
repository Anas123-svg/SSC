# Harmonix Calendar and Inspection Schedule — V12

## Scope
Updated the Harmonix workspace only (`html[data-workspace="harmonix"]`) to remove residual SSC pink from both calendar interfaces:

1. **Dashboard/analytics date-range calendar:** selected endpoints, in-range dates, today's date, hover/focus states, picker buttons, active range fields, and picker navigation.
2. **Inspection Schedule (calendar and list views):** current/selected days, events, status chips, Today/month navigation, Calendar/List switch, selected-day panel, add inspection controls, filters, date links, legend, and agenda rows.
3. **Dark mode:** harmonized charcoal/forest calendar surfaces, contrast, legible lime highlights, and both date-picker and schedule states.
4. **Legacy schedule calendar:** changed its card colors as a safe fallback for older routes.

### Brand and status semantics
- Harmonix accent: `#B6D552` with charcoal/forest neutral surfaces.
- Scheduled events: lime. Completed: success green. Cancelled: neutral gray.
- Safety/compliance statuses (C/MI/MA/N/A) were not modified.
- SSC Admin and other workspaces remain unchanged.

### Implementation
- New final stylesheet: `src/styles/harmonix-calendar-v12.css`
- App import added in `src/main.jsx` after V11 styles
- Service worker cache version updated in `public/sw.js` to force a refresh of installed PWA assets
- Four regression tests added at `tests/harmonix-calendar-v12.test.mjs`
- Updated one earlier stylesheet-order regression test so the V12 calendar layer loads last

### Verification
- JavaScript/JSX syntax and local imports: 94 source files validated
- New calendar tests: 4/4 passed
- Full test suite: 99 passed, six pre-existing failures (same as V11 baseline)
- CSS parsed successfully: 126 workspace-scoped rules, zero parse errors
- Production build and browser/device visual verification were not performed in this environment
