# Latest SSC UI & Analytics Improvements

The current package adds dedicated Projects & Locations, Team, and Settings layouts, polishes the report-only list, introduces real workspace/project analytics, removes the Inspection Register's duplicated top tabs, and shows Admin with the SSC logo plus Harmonix as the only built-in dropdown choices. Other prior demo workspaces are hidden, not destructively deleted.

See README.md for details and operational limitations.

---

# Near-black sidebar update

- Replaced the soft-blush SSC sidebar with a refined charcoal gradient.
- Updated navigation, section captions, workspace selector and dropdown, support/footer, and Add New Site surfaces to meet dark-background contrast needs.
- Kept SSC brand pink as a restrained active-navigation highlight.
- Added a logo variant with high-contrast lettering for the dark sidebar while keeping the original logo file intact.
- Preserved hidden scrollbar styling with scrolling enabled for the sidebar and workspace dropdown.
- All dashboard, inspections, reports, and projects remain unchanged.

## Corporate header and Harmonix branding

- Replaced the large boxed workspace switcher with a restrained, flat workspace row and a compact dropdown.
- Reworked the SSC header into a crisp logo-and-name lockup with a fine divider and smaller product subtitle.
- Extracted the original Harmonix logo from `reference/HXC_Site_Compliance_Audit_Final Rev 0122.docx` and included it as `public/harmonix-logo.png` (not a recreation).
- The wordmark now appears in both the active workspace switcher and its dropdown option. Existing browser-saved Harmonix records automatically receive the built-in logo without requiring a storage migration.
- Uploaded workspace logos continue to override built-in logos, so workspace branding remains editable.
- Kept the charcoal sidebar, SSC pink active accents, accessible navigation and hidden-but-functional scrolling.

### Dashboard heading clean-up
- Removed the duplicate client-workspace dashboard heading (for example, “Harmonix — Safety Dashboard”) and its generic “Safety activity and performance from saved inspections.” subtitle from the rendered client dashboard.
- Kept the dashboard’s own introduction, metrics, and actions unchanged; Admin header and Add New Site button remain intact.


## Full-width dashboard inspection chart and custom dates

- Removed the old “Needs attention” dashboard panel, giving inspection activity the full row width. The Open Findings summary metric remains available.
- Added rolling **1, 2, 3, 4 month** presets and an optional **Custom** date range (From / To), with inclusive boundary handling and validation.
- Added responsive date controls, chart legend and a stacked Completed / Other statuses display.
- Adaptively group by day, week, month, quarter or year depending on the range, always based on actual inspection dates, excluding demo records and future dates.
- Preserved the existing Recent Inspections / Projects section, reporting pages, HXC workflow, project pages, and sidebar branding.
- Extended automated tests for end-of-month and leap-year periods, custom filter boundaries, adaptive aggregation, and invalid dates.

## Custom calendar dropdown (latest)

- Replaced the dashboard's two HTML date inputs with a single charcoal date-range popover, based on the provided reference and the existing SSC theme.
- Click **Custom** to open the picker; select a start date, then an end date, and select **Apply** to update the inspection activity chart. Cancel, Escape, or an outside click discards uncommitted changes.
- Month arrows allow moving through calendar months. Future dates are disabled. The calendar displays pink endpoints and a shaded range with the current date outlined.
- Kept the 1M–4M presets and the existing date-based chart calculations unchanged; the selected range is inclusive.
- Added reusable UTC calendar helpers and automated tests for grid placement, month navigation, leap years, selection, date validation and integration.
- No new NPM dependencies or data model changes.


## Calendar selection and scrolling improvements

- Custom date selection now **starts blank every time the popup opens**; no range is pre-highlighted. Today retains a subtle outline, which is not an active selection.
- Clicking **Custom** preserves the currently displayed chart period until both dates are chosen and **Apply** is clicked. Cancel, Escape, and clicking outside leave the chart unchanged.
- The calendar is rendered via a React portal outside the dashboard card to avoid clipping by scrolling/overflow containers. Its anchored position is recalculated on scrolling (including nested containers), resizing, zoom/visual viewport changes and popup/trigger resize.
- The popup flips above the input when space below is insufficient, clamps horizontal positioning to the viewport, and internally scrolls on smaller screens. If the anchor leaves the viewport, the popup closes.
- Added regression tests for blank selection, unchanged chart period, desktop/mobile positioning, vertical flipping, and viewport offsets.
