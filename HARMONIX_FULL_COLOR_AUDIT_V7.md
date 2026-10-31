# Harmonix workspace — detailed colour audit (V7)

## Scope
This update continues from V6 (transparent uploaded logo). All new decorative theme rules are applied only when `<html data-workspace="harmonix">` is active, keeping SSC Admin’s original identity unchanged.

## Changes

### Project Details
- Matched project header, hero, breadcrumb, active tabs, KPI icons, progress meter, recent inspections, quick actions, empty states, location/address links, upcoming dates, and HXC entry to the `#B6D552` lime and charcoal theme.
- Replaced residual pink in section links, date tiles, document filters, site map links and ordinary interface icons.
- Kept status/severity badges for overdue, major/critical and safety alerts red or amber rather than recolouring them lime.
- Project-level Insights, Reports, Documents, Inspections continue to use their existing functionality and shared page implementations.

### Project Create / Edit
- Changed section icons, kicker labels, helper details, focus rings, form borders and map-search button to lime/green-neutral colours.
- The map picker pin now uses a CSS variable (`--project-map-pin`) with the existing SSC pink as a fallback outside Harmonix.

### Other pages
- Team directory: profile avatars, member links, filters and secondary highlights.
- Settings: profile logo surface, notification toggles and note backgrounds. Updated the outdated description that still called Harmonix teal.
- Analytics: filters, links, stat badges, progress and panel details.
- Reports: file icons, list hover states and search filters.
- Harmonix sidebar top logo displays the provided transparent logo without a forced white plate.
- Light/dark variables are aligned, with charcoal/forest surfaces and accessible lime text in dark mode.
- Existing V5 Inspections and Templates styling remains loaded. This V7 stylesheet imports last to correct leftover styling.

## Colour system
- Primary: `#B6D552`
- Hover: `#A7C447`
- Neutral links: `#536B24` (light) / `#D0EA95` (dark)
- Primary ink: `#23302A`
- Light workspace background: `#FCFDF8`
- Dark content surface: `#1C2921`
- Soft lime: `#F0F7D9`

## Validation
- `node validate-source.cjs`: 93 JavaScript/JSX files parse with resolved relative imports.
- New V7 audit tests: 4/4 passing.
- Full suite: 83 passing, six failing. Compared against V6 baseline: identical six legacy failures (the new changes introduced no additional failures).
- CSS parsing: all three Harmonix theme files parsed without top-level syntax errors.
- Browser screenshot check was attempted but stalled in this environment; full rendering and production build still require a local browser and dependencies.

## Release instructions
From the project root: `npm ci && npm run build && npm test`. After deployment, reload any installed PWA/service worker to ensure new CSS is served. Review both Light and Dark modes in Harmonix and switch to Admin to confirm pink/charcoal remains intact.
