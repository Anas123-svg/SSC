# SSC — Unified inspection architecture

## Live entry points

- `src/main.jsx` imports `src/app/App.jsx` and SSC styles.
- `src/app/moduleRegistry.js` defines modules. **Only `audits`** is a navigable inspection module; `hxc` and `risks` are retired legacy IDs. `normalizeModules` maps saved `hxc` module selections to `audits` and drops `risks` from active configuration without deleting data.
- `src/app/navigation.js` builds client and Admin sidebar menus; `src/app/routes.js` resolves hash routes and redirects old HXC and removed Risk Assessments paths.
- `src/pages/InspectionsPage.jsx` renders the new shared inspection register, filters, template chooser and the appropriate inspection editor.
- `src/features/hxc/HxcAudits.jsx` is a specialized **inspection editor** invoked by `InspectionsPage`. Its HXC scoring, evidence, actions, sign-off, export and validation are preserved.
- `src/pages/RecordsPage.jsx` remains responsible for projects, corrective actions, scheduling, documents, team, users, clients and templates. The old inline HXC source toggle and risk assessment page have been removed.
- `src/pages/DashboardPage.jsx` and `src/pages/ReportingPage.jsx` consume the same combined read model through portal context.

## One inspection list without destroying documents

`src/data/inspections.js` projects the two legacy persistence forms into stable inspection and action records:

| Source | Authoritative write location | Unified display identity |
|---|---|---|
| General inspection | `ssc-workspace-db-v1` → `audits[]` | Existing inspection ID |
| HXC detailed audit | `harmonix-hxc-audits-v2-<workspaceId>` (legacy Admin uses unsuffixed key) | `hxc:<workspaceId>:<nativeAuditId>` |
| General action | `ssc-workspace-db-v1` → `actions[]` | Existing action ID |
| HXC action | Native HXC audit `actions[]` | `hxc-action:<workspaceId>:<nativeAuditId>:<nativeActionId>` |

No HXC document or embedded action is duplicated into the generic database. The adapter returns a common shape (`workspaceId`, `projectId`, `status`, `date`, `score`, `inspector`, `type`, `source`) while preserving native source identity. Views can link to the complete HXC document rather than a flattened, incomplete checklist.

The HXC editor fires `ssc-hxc-changed` after saving, and the app re-renders unified metrics and registers. HXC records are scoped by their original storage key. Sample HXC records are displayed with a SAMPLE label, but excluded from operational totals and reports.

## Route examples

- `#/admin/inspections`
- `#/admin/inspections/hxc%3Aharmonix%3AHXC-123`
- `#/workspace/harmonix/inspections`
- `#/workspace/harmonix/inspections/hxc%3Aharmonix%3AHXC-123`
- `#/workspace/harmonix/projects/<projectId>`

Legacy `#/hxc`, `#/workspace/<id>/hxc-audits` → Inspections. Removed `#/workspace/<id>/risks` → Dashboard. Routes are checked against enabled modules, including direct links.

## Metrics and corrective actions

Dashboard, reports and analytics now use `listInspections` and `listCorrectiveActions` instead of drawing only from `db.audits` and `db.actions`. This includes HXC completion status, applicable-section percentage, inspection dates and checklist actions. Only completed, scored inspections contribute to compliance averages; draft scores do not count. HXC samples never contribute to KPIs or exported performance reports.

Corrective Actions shows embedded HXC findings along with general findings. The HXC item remains editable **only inside its source audit**, preserving HXC-specific validation and the link to the original checklist evidence. Scheduling is still its own appointment workflow; completing a schedule record does not invent an inspection result.

## Risk Assessments removal

The `risks` module, menu item and page are retired. `db.risks` is still kept in the existing versioned storage and Admin JSON backup, so upgrading does not irreversibly delete historical data. `normalizeModules` removes the legacy key from all rendered module settings.

## Production boundary

This application is browser-local and the demo role is an Admin simulation. No backend authentication, tenant authorization, cloud files or shared data service is included. The read-model adapter is a migration-safe bridge to eventual single-source backend APIs, not secure multi-tenant infrastructure.

## Verification

Run `npm test` and `npm run build` (after `npm ci`). A JSX parser check should be performed for every source module. For browser acceptance: create a new HXC audit → save some checklist responses/actions → return to Inspections → verify the record, dashboard, Actions and Reports update → reopen the audit → verify signatures/evidence remain. Confirm Risk Assessments is not selectable for any workspace.


## Project-centric navigation revision — October 2026

This section supersedes the older client-menu and embedded-reports notes above.

- `src/app/moduleRegistry.js`, `src/app/navigation.js`: Reports is a required client sidebar page. Corrective Actions, Documents and Analytics are not independent client navigation entries. Templates remains a separate Admin-assigned page.
- `src/app/routes.js`: project URLs allow `projects/:projectId/:section`, where `section` is `overview`, `inspections`, `actions`, `insights`, `reports` or `documents`. Legacy inspection reports, documents and action URLs redirect to the new locations.
- `src/pages/ProjectDetailPage.jsx`: project hub with six tabs; related inspection/HXC and corrective action lists, project KPIs/charts, document upload/download and dedicated project reports.
- `src/data/projectScope.js`: exact `projectId` and `workspaceId` pairing keeps project views scoped to their owner.
- `src/pages/ReportingPage.jsx`: standalone portfolio/workspace Reports; optional `projectId` prop narrows all report data and exports to one project.
- `src/pages/InspectionsPage.jsx`: only Inspection Register and Findings & corrective actions sub-navigation. Template choice remains part of the Create Inspection workflow.
- `src/pages/AssignedTemplatesPage.jsx`: separate client Templates page, assigned by Admin.
- `src/components/layout/Topbar.jsx`: findings notification links point to Inspections → Findings & corrective actions, without a sidebar Actions entry.

No destructive schema migration or HXC scoring modifications. This is browser-local storage with no backend authorization.


## Dashboard refresh & report library (October 2026)

- `src/pages/DashboardPage.jsx` and `src/styles/dashboard-reports.css` provide a calm, bright-white operational overview: four readable KPIs, one historical activity chart, prioritized findings and recent work. `src/data/dashboardSummary.js` contains testable date/activity aggregation, excluding demo HXC records and future scheduled visits from history.
- `src/pages/ReportsPage.jsx` is the **only** renderer for the sidebar Reports route and each project’s Reports section. It displays a scoped list of completed inspections and stored report-category documents; `src/data/reportCatalog.js` builds this list from records already in the browser. Reports does not display performance charts, raw findings tables, or synthetic PDFs.
- `src/pages/ReportingPage.jsx` remains for the separate project **Insights** tab and legacy compliance views, preserving their existing charts. It is intentionally not used as the Reports destination.
- HXC audit editors, checklist calculations, storage, assigned templates, and project document management remain unchanged. Reports list entries open the correct inspection or download an existing attached report file.
- Tests: `tests/dashboard-reports.test.mjs` checks real metric dates, exclusion of sample records, tenant/project isolation and report catalog construction.
