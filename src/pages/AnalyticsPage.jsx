import React, { useMemo, useState } from 'react';
import {
  Activity, ArrowRight, BarChart3, CalendarDays, CheckCircle2, ClipboardCheck,
  Filter, ShieldAlert, ShieldCheck, SlidersHorizontal,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie,
  PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { usePortal } from '../app/PortalContext.jsx';
import { analyticsForScope, analyticsWindow } from '../data/analytics.js';
import { today } from '../data/repository.js';
import { isOpen } from '../data/repository.js';

const PALETTE = { pink: '#d64e76', slate: '#b9c9da', blue: '#5279a6', teal: '#45a28b', orange: '#efa45a', red: '#d76b72', gray: '#e6ebf1' };
const CHART_AXIS = { fontSize: 11, fill: '#8793a5' };
const CHART_TIP = { contentStyle: { border: '1px solid #e6eaf0', borderRadius: 11, fontSize: 12, boxShadow: '0 10px 30px #25334816' } };
const fmt = n => new Intl.NumberFormat('en-GB').format(n || 0);
const pct = (part, total) => total ? Math.round((part / total) * 100) : 0;

function Stat({ icon: Icon, name, value, sub, tone = '' }) {
  return <article className={`insight-stat ${tone}`}><div className="insight-stat-top"><span>{name}</span><span className="insight-stat-icon"><Icon size={19}/></span></div><strong>{value}</strong><small>{sub}</small></article>;
}
function Panel({ title, note, children, badge, wide = false }) {
  return <section className={`insight-panel${wide ? ' insight-panel-wide' : ''}`}>
    <header className="insight-panel-head"><div><h2>{title}</h2><p>{note}</p></div>{badge && <span className="insight-panel-badge">{badge}</span>}</header>
    {children}
  </section>;
}
function Empty({ text }) {
  return <div className="insight-empty"><BarChart3 size={25}/><strong>No data for this view</strong><span>{text}</span></div>;
}
function ProgressRow({ title, amount, total, tone }) {
  return <div className="insight-progress-row"><div className="insight-progress-top"><span>{title}</span><strong>{fmt(amount)} <small>· {pct(amount, total)}%</small></strong></div><div className="insight-progress-track"><span style={{ width: `${pct(amount, total)}%`, background: tone || PALETTE.pink }}/></div></div>;
}

/** Consistent, project-filterable inspection charts used on Analytics and Project Details. */
function InspectionStatusPanel({ statuses, completed, total }) {
  return <Panel title="Inspection status" note="Distribution of saved inspection states" badge={`${fmt(completed)} completed`}>
    {statuses.length ? <div className="insight-donut-layout">
      <div className="insight-donut" role="img" aria-label="Inspection status distribution">
        <ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={statuses} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="65%" outerRadius="88%" paddingAngle={2} stroke="none">
            {statuses.map(row => <Cell key={row.name} fill={row.color}/>)}
          </Pie>
          <Tooltip {...CHART_TIP}/>
        </PieChart></ResponsiveContainer>
        <div className="insight-donut-center"><strong>{fmt(total)}</strong><small>inspections</small></div>
      </div>
      <div className="insight-status-list">
        {statuses.map(row => <div key={row.name}><span><i style={{ background: row.color }}/>{row.name}</span><strong>{row.value} <small>{pct(row.value, total)}%</small></strong></div>)}
      </div>
    </div> : <Empty text="Inspection statuses are shown when records are added."/>}
  </Panel>;
}

function InspectionTypesPanel({ typeRows, total }) {
  return <Panel title="Inspection types" note="Most frequently recorded inspection categories">
    {typeRows.length ? <div className="insight-progress-list">
      {typeRows.map((row, index) => <ProgressRow key={row.name} title={row.name} amount={row.total} total={total} tone={index === 0 ? PALETTE.pink : PALETTE.blue}/>)}
    </div> : <Empty text="Types appear when you save inspection records."/>}
  </Panel>;
}

/** Same page supports portfolio analytics and project-scoped "Insights" without leaking other projects. */
export default function AnalyticsPage({ projectId = '', embedded = false, inspectionPanelsOnly = false }) {
  const { activeWorkspaceId, activeWorkspace, workspaces, audits, actions, scopedSites, go } = usePortal();
  const admin = activeWorkspaceId === 'admin';
  const [workspace, setWorkspace] = useState('');
  const [project, setProject] = useState('');
  const [period, setPeriod] = useState('6');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const asOf = today();
  const selectedProjectId = projectId || project;
  const selectedProject = scopedSites.find(site => site.id === selectedProjectId);
  const selectedWorkspace = embedded ? (selectedProject?.workspaceId || '') : workspace;
  const availableProjects = scopedSites.filter(site => !selectedWorkspace || site.workspaceId === selectedWorkspace);
  const sourceAudits = admin && selectedWorkspace ? audits.filter(audit => audit.workspaceId === selectedWorkspace) : audits;
  const sourceActions = admin && selectedWorkspace ? actions.filter(action => action.workspaceId === selectedWorkspace) : actions;
  const range = inspectionPanelsOnly ? { start: '', end: '' } : period === 'custom' ? { start, end } : period === 'all' ? { start: '', end: '' } : analyticsWindow(Number(period), asOf);
  const invalid = period === 'custom' && (!start || !end || start > end || end > asOf);
  const results = useMemo(() => invalid ? null : analyticsForScope(sourceAudits, sourceActions, availableProjects, {
    projectId: selectedProjectId, start: range.start, end: range.end,
  }), [sourceAudits, sourceActions, availableProjects, selectedProjectId, range.start, range.end, invalid]);

  const m = results?.metrics;
  const inspections = results?.inspections || [];
  const findings = results?.actions || [];
  const recent = [...inspections].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 5);
  const title = selectedProject?.name || (selectedWorkspace ? workspaces.find(w => w.id === selectedWorkspace)?.name : admin ? 'All client workspaces' : activeWorkspace?.name || 'Current workspace');
  const typeRows = useMemo(() => {
    const counts = new Map();
    for (const record of inspections) {
      const key = record.type || 'Other inspection';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [inspections]);
  const completed = results?.statuses.find(s => s.name === 'Completed')?.value || 0;
  const statuses = (results?.statuses || []).map((entry, index) => ({ ...entry, color: [PALETTE.teal, PALETTE.blue, PALETTE.orange, PALETTE.slate][index % 4] }));
  const openFindings = findings.filter(isOpen);
  const priorityCount = openFindings.filter(action => ['High', 'Critical'].includes(action.priority)).length;
  const scoreTrend = results?.trend.filter(item => item.compliance != null) || [];
  const alertText = m?.overdue > 0 ? `${m.overdue} overdue finding${m.overdue === 1 ? '' : 's'} need${m.overdue === 1 ? 's' : ''} follow-up.`
    : priorityCount ? `${priorityCount} high or critical finding${priorityCount === 1 ? '' : 's'} remain open.`
    : m?.open ? `${m.open} open finding${m.open === 1 ? '' : 's'} remain to be closed.`
    : m?.total ? 'No open findings in this reporting selection.' : 'Add inspection records to start building your analytics.';

  // Keep the project inspection tab and the main Analytics page on exactly the
  // same charts/aggregation logic. No additional filters or cross-project data.
  if (inspectionPanelsOnly) {
    return <div className="insight-page is-embedded pd-inspection-insights" aria-label="Project inspection insights">
      <div className="insight-chart-grid">
        <InspectionStatusPanel statuses={statuses} completed={completed} total={m?.total || 0}/>
        <InspectionTypesPanel typeRows={typeRows} total={m?.total || 0}/>
      </div>
    </div>;
  }

  return <div className={`workspace-page insight-page${embedded ? ' is-embedded' : ''}`}>
    <header className="insight-hero">
      <div className="insight-heading"><span className="insight-eyebrow"><Activity size={14}/> SAFETY PERFORMANCE</span>
        <h1>{embedded ? 'Project insights' : 'Analytics & insights'}</h1>
        <p>Track inspections, compliance, and corrective actions using your saved records.</p>
      </div>
      {!embedded && <button className="insight-main-action" type="button" onClick={() => go('audits')}><ClipboardCheck size={16}/> Inspection register <ArrowRight size={15}/></button>}
    </header>

    <section className="insight-filter-card" aria-label="Analytics filters">
      <div className="insight-filter-intro"><span className="insight-filter-icon"><SlidersHorizontal size={18}/></span><div><strong>Reporting filters</strong><small>{title}</small></div></div>
      <div className="insight-filters">
        {admin && !embedded && <label>Workspace<select aria-label="Filter workspace" value={workspace} onChange={event => { setWorkspace(event.target.value); setProject(''); }}><option value="">All workspaces</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
        {!embedded && <label>Project<select aria-label="Filter project" value={project} onChange={event => setProject(event.target.value)}><option value="">All projects</option>{availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
        <label>Period<select aria-label="Reporting period" value={period} onChange={event => setPeriod(event.target.value)}><option value="3">Last 3 months</option><option value="6">Last 6 months</option><option value="12">Last 12 months</option><option value="all">All recorded dates</option><option value="custom">Custom dates</option></select></label>
        {period === 'custom' && <><label>From<input aria-label="Start date" type="date" value={start} max={end || asOf} onChange={event => setStart(event.target.value)}/></label><label>To<input aria-label="End date" type="date" value={end} min={start || undefined} max={asOf} onChange={event => setEnd(event.target.value)}/></label></>}
      </div>
    </section>
    {invalid ? <div className="insight-error" role="alert"><Filter size={17}/> Choose a valid start and end date (not later than today).</div> : <>
      <div className="insight-stats" aria-label="Key analytics indicators">
        <Stat icon={ClipboardCheck} name="Total inspections" value={fmt(m.total)} sub={`${fmt(m.completed)} completed · ${fmt(m.pending)} not completed`}/>
        <Stat icon={CheckCircle2} name="Completion rate" value={m.completion == null ? '—' : `${m.completion}%`} sub="Completed ÷ recorded inspections"/>
        <Stat icon={ShieldCheck} name="Avg. compliance" value={m.compliance == null ? '—' : `${m.compliance}%`} sub="Only completed inspections with scores"/>
        <Stat icon={ShieldAlert} name="Open findings" value={fmt(m.open)} sub={`${fmt(m.overdue)} overdue · ${fmt(priorityCount)} high / critical`} tone={m.overdue ? 'is-warning' : ''}/>
      </div>
      <div className={`insight-attention${m.overdue ? ' is-urgent' : ''}`}><span className="insight-attention-icon"><ShieldAlert size={18}/></span><div><strong>Safety follow-up</strong><p>{alertText}</p></div><button type="button" onClick={() => go('audits', 'actions')}>View findings <ArrowRight size={14}/></button></div>

      <div className="insight-chart-grid">
        <Panel title="Inspection volume" note="Recorded and completed inspections by month" badge={`${fmt(m.total)} total`}>
          {results.trend.length ? <div className="insight-chart" role="img" aria-label="Monthly inspection volume chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={results.trend} margin={{ top: 12, right: 10, left: -23, bottom: 0 }} barGap={3}><CartesianGrid stroke="#eef1f5" vertical={false} strokeDasharray="3 5"/><XAxis dataKey="month" tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={value => value.slice(5) + '/' + value.slice(2, 4)}/><YAxis allowDecimals={false} tick={CHART_AXIS} axisLine={false} tickLine={false}/><Tooltip {...CHART_TIP}/><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }}/><Bar name="Recorded" dataKey="total" fill={PALETTE.slate} maxBarSize={34} radius={[4,4,0,0]}/><Bar name="Completed" dataKey="completed" fill={PALETTE.pink} maxBarSize={34} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div> : <Empty text="Inspections with valid dates will appear as monthly activity."/>}
        </Panel>
        <Panel title="Compliance movement" note="Mean scores of completed inspections by month" badge={m.compliance == null ? 'No scores' : `${m.compliance}% average`}>
          {scoreTrend.length ? <div className="insight-chart" role="img" aria-label="Monthly compliance score chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={results.trend} margin={{ top: 12, right: 15, left: -20, bottom: 0 }}><CartesianGrid stroke="#eef1f5" vertical={false} strokeDasharray="3 5"/><XAxis dataKey="month" tick={CHART_AXIS} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} unit="%" tick={CHART_AXIS} axisLine={false} tickLine={false}/><Tooltip {...CHART_TIP} formatter={value => value == null ? 'No scored inspection' : `${value}%`}/><Line dataKey="compliance" name="Compliance" stroke={PALETTE.pink} strokeWidth={3} type="monotone" connectNulls={false} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }}/></LineChart></ResponsiveContainer></div> : <Empty text="Complete a scored inspection to build a compliance trend."/>}
        </Panel>
        <InspectionStatusPanel statuses={statuses} completed={completed} total={m.total}/>
        <InspectionTypesPanel typeRows={typeRows} total={m.total}/>
      </div>

      {!embedded && <Panel wide title={project ? 'Selected project performance' : 'Project performance comparison'} note="Inspections and findings linked to each registered project" badge={`${results.comparison.length} projects`}>
        {results.comparison.length ? <div className="insight-table-wrap"><table className="insight-table insight-comparison-table"><thead><tr><th>PROJECT</th><th>INSPECTIONS</th><th>COMPLIANCE</th><th>OPEN FINDINGS</th><th></th></tr></thead><tbody>{results.comparison.map(site => <tr key={site.id}><td><strong>{site.name}</strong></td><td>{site.inspections}</td><td><div className="insight-score-cell"><span>{site.compliance == null ? '—' : `${site.compliance}%`}</span><div><i style={{ width: `${site.compliance ?? 0}%` }}/></div></div></td><td>{site.open}{site.overdue > 0 && <small className="insight-overdue"> · {site.overdue} overdue</small>}</td><td><button type="button" className="insight-table-link" onClick={() => go('sites', site.id)}>Open <ArrowRight size={14}/></button></td></tr>)}</tbody></table></div> : <Empty text="Register projects to compare their inspection and finding metrics."/>}
      </Panel>}
      {embedded && <Panel wide title="Recent project inspections" note="Last five inspections within the selected reporting period">
        {recent.length ? <div className="insight-recent-list">{recent.map(record => <button key={record.id} type="button" onClick={() => go('audits', record.id)}><span className="insight-recent-symbol"><ClipboardCheck size={16}/></span><span><strong>{record.type || 'Inspection'}</strong><small>{record.date || 'No date'} · {record.inspector || 'Inspector not assigned'}</small></span><span className="insight-recent-status">{record.status || 'Draft'}</span><ArrowRight size={15}/></button>)}</div> : <Empty text="Recent inspections appear here as the site is inspected."/>}
      </Panel>}
      <footer className="insight-disclaimer"><CalendarDays size={15}/> Period filters use inspection dates and finding due/record dates. Scores only use completed, scored inspections. No sample chart data or estimated values are used.</footer>
    </>}
  </div>;
}
