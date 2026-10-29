import React, { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePortal } from '../app/PortalContext.jsx';
import { DataTable, Button, CollectionHeader, EmptyState, FilterBar } from '../components/common/WorkspaceUI.jsx';
import { Metric } from '../components/common/PortalUI.jsx';
import { metrics, trendData, isOverdue, isOpen } from '../data/repository.js';
import { operational } from '../data/inspections.js';
import { csv, printReport } from '../utils/reporting.js';
export function RecordCharts({ data }) {
  if (!data.length) return <section className="panel"><EmptyState title="No inspection history" description="Charts will appear when dated inspections have been recorded."/></section>;
  return <div className="workspace-two-columns">{[['compliance','Recorded compliance'],['audits','Inspection activity']].map(([key,label]) => <section className="panel padded" key={key}><h2>{label}</h2><p>{key === 'compliance' ? 'Average of completed, scored records by month.' : 'Number of dated inspections by month.'}</p><div className="record-chart"><ResponsiveContainer width="100%" height="100%">{key === 'compliance' ? <AreaChart data={data}><CartesianGrid stroke="#eee"/><XAxis dataKey="month"/><YAxis domain={[0,100]}/><Tooltip/><Area dataKey="compliance" name="Compliance %" stroke="#ee3861" fill="#fff0f4" connectNulls={false}/></AreaChart> : <BarChart data={data}><CartesianGrid stroke="#eee"/><XAxis dataKey="month"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="audits" name="Inspections" fill="#ee3861" radius={[4,4,0,0]}/></BarChart>}</ResponsiveContainer></div></section>)}</div>;
}
export default function ReportingPage({ projectId = null }) {
  const { page, activeWorkspaceId, workspaces, audits, actions, scopedSites, matches, go } = usePortal();
  const [workspace, setWorkspace] = useState(''), [projectFilter, setProjectFilter] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [type, setType] = useState('');
  const chosenProject = projectId || projectFilter;
  const admin = activeWorkspaceId === 'admin';
  const records = operational(audits), findings = operational(actions);
  const inDates = d => (!from || (d && d >= from)) && (!to || (d && d <= to));
  const filtered = records.filter(a => (!workspace || a.workspaceId === workspace) && (!chosenProject || a.projectId === chosenProject) && inDates(a.date) && (!type || a.type === type) && matches(a.id,a.type,a.inspector));
  const includedIds = new Set(filtered.map(a => a.id));
  const filteredActions = findings.filter(a => {
    const linked = records.find(i => i.id === a.inspectionId);
    return (!workspace || a.workspaceId === workspace)
      && (!chosenProject || a.projectId === chosenProject)
      && (!type || (linked && linked.type === type))
      && (a.inspectionId ? includedIds.has(a.inspectionId) : !type && inDates(a.due))
      && matches(a.id,a.title,a.assigned);
  });
  const projects = scopedSites.filter(p => (!workspace || p.workspaceId === workspace) && (!chosenProject || p.id === chosenProject));
  const m = metrics(filtered,filteredActions);
  return <div className="workspace-page"><section className="panel padded"><CollectionHeader title={projectId ? 'Project reports & exports' : page === 'analytics' ? 'Performance analytics' : page === 'compliance' ? 'Compliance review' : 'Reports'} description={projectId ? 'Project-specific reports based on recorded HXC and general inspections.' : 'One combined view of HXC and general inspections across the selected workspace.'}/>
    <FilterBar>{admin && <label>Workspace<select value={workspace} onChange={e => setWorkspace(e.target.value)}><option value="">All workspaces</option><option value="admin">Legacy HXC archive</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}{!projectId && <label>Project<select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="">All projects</option>{scopedSites.filter(p=>!workspace || p.workspaceId===workspace).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>}<label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)}/></label><label>Inspection type<select value={type} onChange={e => setType(e.target.value)}><option value="">All types</option>{[...new Set(records.map(a => a.type))].filter(Boolean).sort().map(t => <option key={t}>{t}</option>)}</select></label></FilterBar>
    <p className="workspace-note">Includes completed HXC scores and linked findings without duplicating HXC records. Illustrative HXC samples are excluded. Unlinked corrective actions use due dates for date filtering; findings linked to inspections inherit their inspection date filters.</p>
    <div className="actions-row"><Button onClick={() => csv((projectId ? 'project-inspections-'+projectId+'.csv' : 'inspections.csv'),[['Workspace','Reference','Project','Type','Date','Status','Score'],...filtered.map(a => [a.workspaceId,a.nativeId || a.id,projects.find(p => p.id === a.projectId)?.name || a.projectName || 'Unlinked',a.type,a.date,a.status,a.score])])}>Export inspections CSV</Button><Button onClick={() => csv((projectId ? 'project-actions-'+projectId+'.csv' : 'corrective-actions.csv'),[['Reference','Description','Owner','Due','Status','Source'],...filteredActions.map(a => [a.nativeId || a.id,a.title,a.assigned,a.due,a.status,a.source])])}>Export actions CSV</Button><Button onClick={() => printReport(projectId ? 'Project performance report' : 'Workspace performance report',filtered,filteredActions,projects.map(p => ({ ...p,compliance:metrics(filtered.filter(a => a.projectId === p.id),[]).compliance })))}>Print / Save PDF</Button></div>
    </section><div className="overview-summary"><Metric name="Inspections" value={m.total} detail={m.completed + ' completed'}/><Metric name="Completion" value={m.total ? Math.round(m.completed / m.total * 100) + '%' : '—'} detail={m.pending + ' pending'}/><Metric name="Compliance" value={m.compliance == null ? '—' : m.compliance + '%'} detail="Completed scored records"/><Metric name="Open actions" value={m.open} detail={m.overdue + ' overdue'}/></div>
    <RecordCharts data={trendData(filtered)}/>
    <section className="panel padded"><CollectionHeader title="Inspection history"/><DataTable rows={filtered} columns={[{label:'Reference',render:a => a.nativeId || a.id},{label:'Type',key:'type'},{label:'Date',key:'date'},{label:'Status',key:'status'},{label:'Score',render:a => a.status === 'Completed' && a.score != null ? a.score+'%' : '—'},{label:'Action',render:a => <Button onClick={() => go('audits',a.id)}>Open</Button>}]}/></section>
    <div className="workspace-two-columns"><section className="panel padded"><CollectionHeader title="Corrective action breakdown"/><DataTable rows={['Low','Medium','High','Critical'].map(p => ({id:p,count:filteredActions.filter(a => a.priority === p).length,open:filteredActions.filter(a => a.priority === p && isOpen(a)).length}))} columns={[{label:'Severity',key:'id'},{label:'Total',render:r => r.count},{label:'Outstanding',render:r => r.open}]}/></section><section className="panel padded"><CollectionHeader title="Overdue actions"/><DataTable rows={filteredActions.filter(isOverdue)} columns={[{label:'Finding',key:'title'},{label:'Responsible',key:'assigned'},{label:'Due',key:'due'}]}/></section></div>
    <section className="panel padded"><CollectionHeader title="Project performance"/><DataTable rows={projects} columns={[{label:'Project',key:'name'},{label:'Inspections',render:p => filtered.filter(a => a.projectId === p.id).length},{label:'Compliance',render:p => {const n = metrics(filtered.filter(a => a.projectId === p.id),[]).compliance;return n == null ? '—' : n + '%';}},{label:'Outstanding',render:p => filteredActions.filter(a => a.projectId === p.id && isOpen(a)).length},{label:'Project report',render:p => <Button onClick={() => go('sites',p.id,p.workspaceId,'reports')}>Open project report</Button>}]}/></section>
  </div>;
}
