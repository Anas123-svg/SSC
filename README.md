# Site Safety Consultants — Dashboard & Report Library

SSC is a React 18 / Vite frontend for managing safety inspections, including the original detailed HXC checklist, across multiple client workspaces. The bright-white sidebar and browser-local records are preserved.

## Getting started

```bash
npm ci
npm run dev
npm test
npm run build
```

## Sidebar structure

**Client workspaces:** Dashboard · Projects & Locations · Inspections · Templates · Inspection Schedule (when enabled) · Team (when enabled) · **Reports** · **Analytics** · Settings.

**Admin:** Portfolio Dashboard · Sites & Workspaces · All Inspections · Clients · Users & Access · Manage Templates · Compliance Management · Reports · **Analytics** · Notifications · Settings.

**Corrective Actions is no longer a sidebar destination.** Open the findings view using a corrective-action link inside Inspections, or the **Corrective actions** tab in a project. HXC findings still link to their original editor, where they can be updated safely.

**Templates** remains a *dedicated page* for templates assigned by Admin. The Inspection Register no longer displays Assigned Templates as an inline tab. The **Create Inspection** flow still asks users to choose an assigned template, since this is needed to select the correct inspection form. Admin can change assignments from Manage Templates.

## Project detail pages

Open **Projects & Locations → View project**. Each project now has six context-specific, deep-linkable sections:

1. **Overview** — project metadata, KPIs, latest inspection, outstanding findings.
2. **Inspections** — all HXC and general inspections linked to this project, with links into the original editors.
3. **Corrective actions** — project-specific findings, owners, due dates, verification references, create/edit/close actions. HXC findings open in the original HXC editor.
4. **Insights** — project-specific compliance and inspection activity charts, severity breakdowns and summary metrics.
5. **Reports** — a project-specific list of completed inspection records and attached report files, with open/download actions. No charts or analytics on this page.
6. **Documents** — upload, categorize, edit and download project-specific browser-local files up to 750 KB.

Example route: `#/workspace/harmonix/projects/S-1/reports`. The project ID is kept in the route for back/forward navigation and refresh. Workspace and project IDs scope inspection, action and document lists, including for Admin.

## Focused dashboard and report library

The **Dashboard** uses four compact KPIs, one full-width inspection activity chart, recent inspections, and a short project/workspace list. The old “Needs attention” panel has been removed. The chart has quick 1/2/3/4-month rolling ranges and a Custom start/end calendar filter (inclusive dates). Short ranges group by day/week and longer ranges by month/quarter/year. The stacked columns distinguish completed inspections from other statuses. Date filters affect the chart, not the dashboard’s all-time KPI totals. All figures come from saved inspections/actions, excluding HXC sample records and future inspection dates from the activity chart. Empty data shows an empty state, never invented percentages.

Reports is a client and Admin sidebar destination (`#/workspace/harmonix/reports`), not an Inspection Register tab. **It contains only a searchable/filterable report list:** completed HXC and general inspection records (open in their original editor), plus previously saved documents categorized as reports (download when a file is attached). Draft inspections and fictional HXC samples do not appear as finished reports. Admin can filter by workspace/project. The same list is scoped to a single project on that project’s Reports tab. Creating a completed inspection does **not** automatically produce a stored PDF; the original inspection editor remains responsible for its native export.

The Inspection Register no longer shows the redundant **Inspection register** / **Findings & corrective actions** top tabs. The main table, status filters, inspection actions and route into corrective actions remain functional.

## Compatibility and data ownership

- The HXC 65-requirement/10-section audit engine, photographs, evidence, scores, signatures and exports are not changed.
- HXC native documents remain in their original storage keys; generic register data remains in `ssc-workspace-db-v1`.
- Combined inspection/action read models remain in `src/data/inspections.js`, so HXC findings are not duplicated.
- Analytics has its own route and workspace/project filters. Previous general `documents` bookmarks open the Projects listing; previous `actions` bookmarks open the Inspections findings view. Old `inspections/insights` and `inspections/documents` URLs also redirect.
- Stored documents, legacy risk assessments and existing template assignments are preserved.
- Seed/sample HXC records are excluded from operational statistics.

## Limits

This is a **browser-local prototype**, not a production multi-tenant backend. The demo role and client filtering are not secure authorization. Files may be lost when browser storage is cleared and are limited by browser quota; they are not cloud-synced. Non-HXC templates still use the general register form rather than an extensive custom question engine. Cloud files, notifications, authentication, collaboration and server-side workspace security require backend implementation.

## Verification

Run `npm test` and `npm run build` after installing dependencies. See [ARCHITECTURE.md](ARCHITECTURE.md) and [CHANGES_THIS_RELEASE.md](CHANGES_THIS_RELEASE.md). The included tests check HXC scoring, data filtering, project routes, retired sidebar entries and stored-data compatibility.

### Dashboard custom date-range calendar

Choose **Custom** above the Inspection Activity graph to open the dark charcoal SSC calendar. Click the start and end dates (navigate months using the arrow buttons), then **Apply** to update the graph. **Cancel**, the Escape key, and clicking outside leave the previously applied range unchanged. The selected dates are inclusive and dates after today are disabled. The calendar is responsive and uses no additional dependencies.


### Custom dashboard calendar

Select **Custom** on the dashboard's Inspection activity chart. The calendar opens with no dates preselected. Pick a start date and end date and click **Apply**. Until you apply, the previously selected 1–4 month range (or prior custom range) remains on the chart. The popup tracks its control when scrolling and automatically opens above it if there isn't space below. Small screens constrain the calendar to the visible viewport and allow internal scrolling.


## October 2026 — Projects, Team, Reports, Settings & Analytics refresh

- **Projects & Locations:** dedicated responsive card directory, inspection/compliance figures derived from saved records, search, workspace/status filters, archive/restore and edit actions. Project detail routes, six project-specific tabs and existing records are retained.
- **Team:** dedicated member cards, role/status/search filters, project assignments, demo-role warning and Admin-controlled editing. These are browser-local demo roles, not live invitations.
- **Reports:** remains strictly a report library/list, now with more cohesive typography, type/project/workspace filters, date sorting and open/download actions. It does **not** contain analytics charts.
- **Settings:** redesigned workspace identity, preferences with accessible toggle controls, Admin browser backup and restore, and local-data/privacy notices.
- **Analytics:** new separate sidebar destination in Admin and client workspaces. Select all projects or one individual project, plus 3/6/12 months, all data or a custom date window. Includes real inspection volume/completion, compliance trend, finding severity and status, and per-project comparison. Sample HXC audits are not counted.
- **Inspections:** removed the redundant top tab labels “Inspection register” and “Findings & corrective actions”. Findings remain available through dedicated links and project sections.
- **Workspace dropdown:** Admin now has the supplied SSC brand mark, Harmonix uses its original supplied wordmark. Older demo workspaces Northfield, Meridian, Stonebridge and Beacon are hidden from the switcher and active management listings. Previously saved data for those demonstrations is not deleted; user-created workspaces remain available.

Verification: `npm test` passes 70 tests; `node validate-source.cjs` parses source JSX/JS and verifies relative imports. `npm run build` requires installed dependencies and has not run successfully in this environment (`vite: not found`).
