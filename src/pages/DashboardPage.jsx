import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, FileText, FolderKanban, ShieldAlert, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePortal } from '../app/PortalContext.jsx';
import { Status } from '../components/common/PortalUI.jsx';
import { Button } from '../components/common/WorkspaceUI.jsx';
import ChartDateRangePicker from '../components/common/ChartDateRangePicker.jsx';
import { metrics, today } from '../data/repository.js';
import { operational } from '../data/inspections.js';
import { dashboardSummary, inspectionActivityForRange, inspectionPeriodForMonths, validInspectionDate } from '../data/dashboardSummary.js';

const dateLabel = value => {
  if (!value) return 'Not set';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const number = value => new Intl.NumberFormat('en-GB').format(value);

function SummaryCard({ icon: Icon, label, value, note, emphasis = false, accent = false }) {
  return <div className={'ssc-dash-card' + (emphasis ? ' is-emphasis' : '') + (accent ? ' is-accent' : '')}>
    <div className="ssc-dash-card-top"><span>{label}</span><span className="ssc-dash-card-icon"><Icon size={18} strokeWidth={1.8}/></span></div>
    <strong>{value}</strong><small>{note}</small>
  </div>;
}
function PanelTitle({ title, description, action, onAction }) {
  return <div className="ssc-dash-panel-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <button type="button" className="ssc-dash-text-action" onClick={onAction}>{action}<ArrowRight size={15}/></button>}</div>;
}
export default function DashboardPage() {
  const { activeWorkspace, activeWorkspaceId, workspaces, scopedSites, audits, actions, go, can, matches } = usePortal();
  const admin = activeWorkspaceId === 'admin';
  const summary = dashboardSummary(audits, actions, scopedSites);
  const asOf = today();
  const [period, setPeriod] = useState('4');
  const [calendarOpen, setCalendarOpen] = useState(false);
  // No custom dates are applied until the visitor explicitly selects a range.
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const selected = period === 'custom' ? { start: customStart, end: customEnd } : inspectionPeriodForMonths(asOf, Number(period));
  const rangeError = !validInspectionDate(selected.start) || !validInspectionDate(selected.end)
    ? 'Choose valid start and end dates.'
    : selected.start > selected.end ? 'Start date must be on or before the end date.'
    : selected.start > asOf || selected.end > asOf ? 'Choose dates no later than today.' : '';
  const activity = rangeError ? [] : inspectionActivityForRange(audits, selected.start, selected.end, asOf);
  const totalInPeriod = activity.reduce((sum, item) => sum + item.inspections, 0);
  const completedInPeriod = activity.reduce((sum, item) => sum + item.completed, 0);
  const changePeriod = value => { setPeriod(value); setCalendarOpen(false); };
  // Keep the currently applied chart range intact while the custom picker is open.
  // Cancel/away-click does not switch the chart into an empty custom period.
  const applyCustomDates = (start, end) => {
    setCustomStart(start);
    setCustomEnd(end);
    setPeriod('custom');
  };
  const projectsById = new Map(scopedSites.map(p => [p.id, p]));
  const recent = summary.recent.filter(a => matches(a.type, a.id, a.inspector, projectsById.get(a.projectId)?.name)).slice(0, 4);
  const projectRows = admin ? workspaces.filter(w => matches(w.name, w.client)).slice(0, 4)
    : scopedSites.filter(p => p.status !== 'Archived' && matches(p.name, p.location, p.manager)).slice(0, 4);
  const chartSummary = totalInPeriod ? `${number(totalInPeriod)} inspections · ${number(completedInPeriod)} completed` : 'No recorded inspections in the selected dates';
  return <div className="ssc-dash workspace-page">
    <div className="ssc-dash-intro">
      <div><div className="ssc-dash-eyebrow"><span className="ssc-dash-live-dot"/> {admin ? 'PORTFOLIO OVERVIEW' : 'WORKSPACE OVERVIEW'}</div>
        <h2>{admin ? 'Your safety portfolio, at a glance.' : 'A clearer view of site safety.'}</h2>
        <p>{admin ? 'Monitor workspaces, inspections and follow-up work in one place.' : `Review inspection trends and recent work across ${activeWorkspace.name}.`}</p>
      </div>
      <div className="ssc-dash-intro-actions">
        <Button primary onClick={() => go('audits')}><ClipboardCheck size={16}/> View inspections <ArrowRight size={15}/></Button>
        {can('sites') && <Button onClick={() => go('sites')}><FolderKanban size={16}/> Projects</Button>}
      </div>
    </div>

    <div className="ssc-dash-cards" aria-label="Key safety indicators">
      <SummaryCard icon={FolderKanban} label="Active projects" value={number(summary.projects)} note={admin ? `${workspaces.length} client workspaces` : 'Registered project sites'} accent />
      <SummaryCard icon={CheckCircle2} label="Completed inspections" value={number(summary.completed)} note={`${summary.pending} awaiting completion`} accent />
      <SummaryCard icon={ShieldAlert} label="Open findings" value={number(summary.open)} note={summary.overdue ? `${summary.overdue} past due` : 'None overdue'} emphasis={summary.overdue > 0} accent />
      <SummaryCard icon={TrendingUp} label="Average compliance" value={summary.compliance == null ? '—' : `${summary.compliance}%`} note={summary.compliance == null ? 'No completed scored records yet' : 'Completed scored inspections'} accent />
    </div>

    <section className="ssc-dash-surface ssc-dash-chart-panel ssc-dash-chart-wide" aria-label="Inspection activity over a selected period">
      <div className="ssc-dash-activity-head">
        <PanelTitle title="Inspection activity" description="Inspections grouped by date, based on saved records" />
        <div className="ssc-dash-date-controls" aria-label="Chart date range">
          <div className="ssc-dash-range-buttons" role="group" aria-label="Quick date range">
            {[1, 2, 3, 4].map(months => <button type="button" key={months} aria-label={`${months} ${months === 1 ? 'month' : 'months'}`} className={period === String(months) ? 'is-selected' : ''} aria-pressed={period === String(months)} onClick={() => changePeriod(String(months))}>{months}M</button>)}
            <button type="button" className={period === 'custom' || calendarOpen ? 'is-selected' : ''} aria-pressed={period === 'custom' || calendarOpen} onClick={() => setCalendarOpen(open => !open)}>Custom</button>
          </div>
        </div>
      </div>
      {(period === 'custom' || calendarOpen) && <div className="ssc-dash-custom-dates" aria-label="Custom chart date range">
        <ChartDateRangePicker start={period === 'custom' ? customStart : ''} end={period === 'custom' ? customEnd : ''} maxDate={asOf}
          open={calendarOpen} onOpenChange={setCalendarOpen} onApply={applyCustomDates}/>
      </div>}
      <div className="ssc-dash-chart-context">
        <span>{validInspectionDate(selected.start) && validInspectionDate(selected.end) ? `${dateLabel(selected.start)} – ${dateLabel(selected.end)}` : 'Choose a date range'}</span>
        <div className="ssc-dash-chart-legend"><span><i className="ssc-dash-legend-completed"/> Completed</span><span><i className="ssc-dash-legend-other"/> Other statuses</span></div>
      </div>
      {rangeError ? <p className="ssc-dash-range-error" role="alert">{rangeError}</p>
        : totalInPeriod ? <div className="ssc-dash-chart" aria-label="Inspection counts by period, completed and other statuses"><ResponsiveContainer width="100%" height="100%"><BarChart data={activity} margin={{ top: 12, right: 18, left: -20, bottom: 0 }} barCategoryGap="28%" maxBarSize={48}>
          <CartesianGrid stroke="#eef0f4" vertical={false} strokeDasharray="4 5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#778296', fontSize: 12 }} dy={8} minTickGap={18}/>
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#778296', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#faf3f6' }} labelFormatter={(_label, payload) => payload?.[0]?.payload?.rangeLabel || _label} contentStyle={{ borderRadius: 10, border: '1px solid #e8ecf1', boxShadow: '0 8px 24px #192d4412' }} />
          <Bar dataKey="completed" stackId="inspections" name="Completed" fill="#d74b72" />
          <Bar dataKey="other" stackId="inspections" name="Other statuses" fill="#ccd5e2" radius={[5, 5, 0, 0]} />
        </BarChart></ResponsiveContainer></div>
        : <div className="ssc-dash-chart-empty"><ClipboardCheck size={26}/><strong>No inspection activity in this range</strong><span>Choose a different date range or record an inspection to see activity here.</span></div>}
      <div className="ssc-dash-chart-foot"><span aria-live="polite">{chartSummary}</span><button type="button" onClick={() => go('audits')}>Inspection register <ArrowRight size={14}/></button></div>
    </section>

    <div className="ssc-dash-secondary-grid">
      <section className="ssc-dash-surface">
        <PanelTitle title="Recent inspections" description="Most recent records across this workspace" action="View all" onAction={() => go('audits')}/>
        {recent.length ? <div className="ssc-dash-list">{recent.map(a => <button type="button" className="ssc-dash-list-row" key={a.id} onClick={() => go('audits', a.id)}>
          <span className="ssc-dash-list-icon"><FileText size={17}/></span><span className="ssc-dash-list-copy"><strong>{a.type || 'Inspection'}</strong><small>{projectsById.get(a.projectId)?.name || a.projectName || 'Unlinked project'} · {dateLabel(a.date)}</small></span><Status text={a.status || 'Draft'}/><ArrowRight size={15} className="ssc-dash-chevron"/>
        </button>)}</div> : <div className="ssc-dash-quiet"><ClipboardCheck size={22}/><strong>No inspections yet</strong><span>Create an inspection to see your recent work here.</span></div>}
      </section>
      <section className="ssc-dash-surface">
        <PanelTitle title={admin ? 'Client workspaces' : 'Your projects'} description={admin ? 'Portfolio visibility by client' : 'Jump straight into a project'} action="View all" onAction={() => go(admin ? 'workspaces' : 'sites')}/>
        {projectRows.length ? <div className="ssc-dash-list">{projectRows.map(p => {
          const id = p.id;
          const itsAudits = admin ? operational(audits).filter(a => a.workspaceId === id) : operational(audits).filter(a => a.projectId === id);
          const itsActions = admin ? operational(actions).filter(a => a.workspaceId === id) : operational(actions).filter(a => a.projectId === id);
          const pm = metrics(itsAudits, itsActions);
          return <button type="button" className="ssc-dash-list-row" key={id} onClick={() => admin ? go('overview', null, p.id) : go('sites', p.id)} disabled={admin && p.status === 'Inactive'}><span className="ssc-dash-project-monogram">{p.name?.slice(0,1) || 'S'}</span><span className="ssc-dash-list-copy"><strong>{p.name}</strong><small>{pm.total} inspections · {pm.open} open findings</small></span><span className="ssc-dash-project-score">{pm.compliance == null ? '—' : `${pm.compliance}%`}</span><ArrowRight size={15} className="ssc-dash-chevron"/></button>;
        })}</div> : <div className="ssc-dash-quiet"><FolderKanban size={22}/><strong>{admin ? 'No client workspaces' : 'No projects yet'}</strong><span>{admin ? 'Add a workspace to get started.' : 'Register your first construction project.'}</span></div>}
      </section>
    </div>
  </div>;
}
