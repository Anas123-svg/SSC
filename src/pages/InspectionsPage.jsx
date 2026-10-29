import React, { useMemo, useState } from 'react';
import RecordsPage from './RecordsPage.jsx';
import { ArrowDownToLine, ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, FilterX, FolderKanban, Plus, Search, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button, DataTable, RecordForm } from '../components/common/WorkspaceUI.jsx';
import { Status } from '../components/common/PortalUI.jsx';
import { operational } from '../data/inspections.js';
import { metrics } from '../data/repository.js';
import { csv } from '../utils/reporting.js';
import HxcAudits from '../features/hxc/HxcAudits.jsx';
import HxcInspectionForm from './HxcInspectionForm.jsx';
import { legacyDocument, saveLegacyDocument } from '../features/templates/legacyHxcDocument.js';

const field = (key, label, required = false) => ({ key, label, required });
const dateField = (key, label, required = false) => ({ key, label, type: 'date', required });
const selectField = (key, label, options, required = false) => ({ key, label, type: 'select', options, required });
const inspectionKinds = ['Draft', 'Scheduled', 'In review', 'Completed'];

/** One inspection register, one creation flow. The HXC editor remains the
 * dedicated renderer for the fixed 65-item official framework. */
export default function InspectionsPage() {
  const { activeWorkspaceId, detailId, db, workspaces, audits, actions, scopedSites, go, can, saveRecord, matches } = usePortal();
  const admin = activeWorkspaceId === 'admin';
  const embeddedView = detailId === 'actions' ? 'actions' : null;
  const selectedFromRoute = detailId?.startsWith('new-template-') ? detailId.slice('new-template-'.length) : null;
  const projectFromRoute = detailId?.startsWith('new-project-') ? detailId.slice('new-project-'.length) : '';
  const createHxc = detailId === 'new' || !!selectedFromRoute || !!projectFromRoute;
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState(null);
  const [originalHxcView, setOriginalHxcView] = useState(false);
  const real = operational(audits);
  const totals = metrics(real, operational(actions));
  const filtered = useMemo(() => audits.filter(a => {
    const label = a.projectName || scopedSites.find(p => p.id === a.projectId)?.name || '';
    return (tab === 'All' || (tab === 'Draft' ? a.status !== 'Completed' : a.status === 'Completed'))
      && (!workspaceFilter || a.workspaceId === workspaceFilter)
      && (!projectFilter || a.projectId === projectFilter)
      && (!typeFilter || a.type === typeFilter)
      && (!from || (a.date && a.date >= from)) && (!to || (a.date && a.date <= to))
      && `${a.id} ${a.type || ''} ${a.inspector || ''} ${label} ${a.status || ''}`.toLowerCase().includes(search.trim().toLowerCase())
      && matches(a.id, a.type, a.inspector, label);
  }).sort((a, b) => String(b.updatedAt || b.date || '').localeCompare(String(a.updatedAt || a.date || ''))), [audits, tab, workspaceFilter, projectFilter, typeFilter, from, to, search, scopedSites, matches]);

  const open = a => go('audits', a.id);
  const existing = detailId ? audits.find(a => a.id === detailId || a.nativeId === detailId && (!admin || a.workspaceId === workspaceFilter)) : null;
  if (createHxc) return <HxcInspectionForm initialProjectId={projectFromRoute} />;
  if (embeddedView) return <div className="workspace-page inspections-workspace"><button type="button" className="ssc-v2-back" onClick={() => go('audits')}>← Back to inspections</button><RecordsPage embeddedPage="actions"/></div>;
  if (detailId) {
    if (!existing) return <section className="panel padded"><h2>Inspection not found</h2><p>This record may have been removed or belongs to another workspace.</p><Button primary onClick={() => go('audits')}>All inspections</Button></section>;
    if (existing.source === 'hxc') {
      if (originalHxcView) return <HxcAudits key={existing.id} workspaceId={existing.workspaceId} initialAuditId={existing.nativeId} onExit={()=>setOriginalHxcView(false)}/>;
      const legacy = legacyDocument(existing);
      if (!legacy) return <section className="panel padded">Original HXC audit record not found.</section>;
      return <HxcInspectionForm key={existing.id} existing={legacy} onPersist={payload=>saveLegacyDocument(existing,payload)} openOriginal={()=>setOriginalHxcView(true)} />;
    }
    if (existing.templateId === 'hxc' && Array.isArray(existing.schemaSnapshot)) return <HxcInspectionForm existing={existing} />;
    const fields = recordFields(existing.workspaceId, db);
    return <div className="workspace-page ix-page ix-detail-page">
      <button type="button" className="ix-detail-back" onClick={() => go('audits')}><ArrowRight size={16}/> Back to inspections</button>
      <div className="ix-detail-header"><div><span className="ix-eyebrow"><ClipboardCheck size={15}/> INSPECTION RECORD</span><h1>{existing.type || 'General inspection'}</h1><p>{existing.id} · {existing.date || 'No inspection date'}</p></div><button type="button" className="ix-new" onClick={() => setForm(existing)}>Edit inspection</button></div>
      <div className="ix-summary"><div className="ix-stat"><div className="ix-stat-top">Status <CheckCircle2 size={18}/></div><div className="ix-detail-status"><Status text={existing.status || 'Draft'}/></div><small>Current inspection status</small></div><div className="ix-stat"><div className="ix-stat-top">Recorded score <ShieldCheck size={18}/></div><strong>{existing.score == null || existing.score === '' ? '—' : `${existing.score}%`}</strong><small>Based on the inspection entry</small></div><div className="ix-stat"><div className="ix-stat-top">Findings <ClipboardCheck size={18}/></div><strong>{existing.findings || 0}</strong><small>Findings recorded</small></div><div className="ix-stat"><div className="ix-stat-top">Inspection date <CalendarDays size={18}/></div><strong className="ix-date-figure">{existing.date || '—'}</strong><small>Scheduled record date</small></div></div>
      <section className="ix-detail-section"><h2>Inspection information</h2><div className="ix-detail-facts"><div><span><FolderKanban size={15}/> Project</span><strong>{existing.projectName || scopedSites.find(p => p.id === existing.projectId)?.name || 'Unlinked project'}</strong></div><div><span><UserRound size={15}/> Inspector</span><strong>{existing.inspector || 'Not assigned'}</strong></div><div><span><ClipboardCheck size={15}/> Inspection type</span><strong>{existing.type || 'General inspection'}</strong></div></div><div className="ix-detail-notes"><h3>Inspection notes</h3><p>{existing.notes || 'No notes have been entered for this inspection.'}</p></div></section>
      {form && <RecordForm title="Edit inspection" fields={fields} initial={existing} close={() => setForm(null)} save={v => saveRecord('audits', { ...v, workspaceId: existing.workspaceId })}/>}
    </div>;
  }
  const generalFields = recordFields(form?.workspaceId || activeWorkspaceId, db);
  const columns = [
    { label: 'Inspection / Reference', render: a => <div className="ix-record-cell"><span className="ix-record-icon"><ClipboardCheck size={17}/></span><span><strong>{a.type || 'General inspection'}</strong><small>{a.source === 'hxc' ? a.nativeId : a.id}{a.demo ? ' · SAMPLE' : ''}</small></span></div> },
    { label: 'Project', render: a => <span className="ix-project-cell"><FolderKanban size={14}/>{a.projectName || scopedSites.find(p => p.id === a.projectId)?.name || 'Unlinked project'}</span> },
    ...(admin ? [{ label: 'Workspace', render: a => workspaces.find(w => w.id === a.workspaceId)?.name || (a.workspaceId === 'admin' ? 'Legacy archive' : 'Unassigned') }] : []),
    { label: 'Inspector', render: a => a.inspector || 'Unassigned' },
    { label: 'Date', render: a => a.date || '—' },
    { label: 'Status', render: a => <Status text={a.status || 'Draft'}/> },
    { label: 'Score', render: a => <span className="ix-score">{a.status !== 'Completed' || a.score == null || a.score === '' ? '—' : `${a.score}%`}</span> },
    { label: '', render: a => <button type="button" className="ix-open-row" onClick={() => open(a)} aria-label={`Open ${a.type || 'inspection'}`}><ArrowRight size={17}/></button> },
  ];
  const filtersActive = !!(search || workspaceFilter || projectFilter || typeFilter || from || to || tab !== 'All');
  const resetFilters = () => { setSearch(''); setWorkspaceFilter(''); setProjectFilter(''); setTypeFilter(''); setFrom(''); setTo(''); setTab('All'); };
  const exportRecords = () => csv('ssc-unified-inspections.csv', [['Workspace', 'Reference', 'Template', 'Project', 'Inspector', 'Date', 'Status', 'Score', 'Sample'], ...filtered.map(a => [a.workspaceId, a.nativeId || a.id, a.source === 'hxc' ? 'HXC Site Compliance Audit' : a.type, a.projectName || scopedSites.find(p => p.id === a.projectId)?.name || '', a.inspector, a.date, a.status, a.status === 'Completed' ? a.score : '', a.demo ? 'Yes' : 'No'])]);
  const beginCreate = () => go('audits', 'new');
  return <div className="workspace-page unified-inspections inspections-workspace ix-page">
    <div className="ix-hero">
      <div><span className="ix-eyebrow"><ShieldCheck size={15}/> SAFETY & COMPLIANCE</span><h1>Inspections</h1><p>A single place to manage site inspections, review findings, and open compliance checklists.</p></div>
      <div className="ix-hero-actions">{can('schedule') && <button type="button" className="ix-outline-action" onClick={() => go('schedule')}><CalendarDays size={17}/> Inspection schedule</button>}<button type="button" className="ix-new" onClick={beginCreate}><Plus size={17}/> Create inspection</button></div>
    </div>
    <div className="ix-summary">
      <div className="ix-stat"><div className="ix-stat-top"><span>All inspections</span><ClipboardCheck size={18}/></div><strong>{totals.total}</strong><small>Recorded inspections excluding samples</small></div>
      <div className="ix-stat"><div className="ix-stat-top"><span>Completed</span><CheckCircle2 size={18}/></div><strong>{totals.completed}</strong><small>Finalised inspection records</small></div>
      <div className="ix-stat"><div className="ix-stat-top"><span>In progress</span><Clock3 size={18}/></div><strong>{totals.pending}</strong><small>Draft and pending inspections</small></div>
      <div className="ix-stat"><div className="ix-stat-top"><span>Compliance score</span><ShieldCheck size={18}/></div><strong>{totals.compliance == null ? '—' : `${totals.compliance}%`}</strong><small>Average of completed scored records</small></div>
    </div>
    <section className="ix-register">
      <div className="ix-register-header"><div><h2>Inspection register</h2><p>Browse and manage inspection records across {admin ? 'your portfolio' : 'this workspace'}.</p></div><span className="ix-record-count">{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span></div>
      <div className="ix-register-tabs" role="group" aria-label="Inspection status">
        {[["All", "All inspections"],["Draft", "Draft & in progress"],["Completed", "Completed"]].map(([value,label]) => <button type="button" key={value} className={tab === value ? 'active' : ''} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}
      </div>
      <div className="ix-toolbar"><label className="ix-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, project or inspector" aria-label="Search inspections"/></label><button type="button" className={`ix-filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(v => !v)} aria-expanded={showFilters}><SlidersHorizontal size={16}/> Filters{filtersActive && <span className="ix-filter-indicator"/>}</button><button type="button" className="ix-export" onClick={exportRecords}><ArrowDownToLine size={16}/> Export CSV</button></div>
      {showFilters && <div className="ix-filters">
        {admin && <label>Workspace<select value={workspaceFilter} onChange={e => { setWorkspaceFilter(e.target.value); setProjectFilter(''); }}><option value="">All workspaces</option><option value="admin">Legacy HXC archive</option>{workspaces.map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select></label>}
        <label>Project<select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="">All projects</option>{scopedSites.filter(p => !workspaceFilter || p.workspaceId === workspaceFilter).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Inspection type<select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">All types</option>{[...new Set(audits.map(a => a.type).filter(Boolean))].sort().map(t => <option key={t}>{t}</option>)}</select></label>
        <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>To<input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></label>
        {filtersActive && <button type="button" className="ix-clear" onClick={resetFilters}><FilterX size={15}/> Clear filters</button>}
      </div>}
      <div className="ix-table-container"><DataTable columns={columns} rows={filtered} empty={<div className="ix-empty"><ClipboardCheck size={28}/><strong>No matching inspections</strong><p>{filtersActive ? 'Try clearing your search or filters.' : 'Create an inspection to see it here.'}</p>{filtersActive ? <button type="button" onClick={resetFilters}>Clear filters</button> : <button type="button" onClick={beginCreate}>Create inspection</button>}</div>}/></div>
      <div className="ix-table-footer"><span>Showing {filtered.length} inspection {filtered.length === 1 ? 'record' : 'records'}</span><span>HXC sample audits are excluded from the performance figures. Records remain browser-local.</span></div>
    </section>
    {form && <RecordForm title={form.id ? 'Edit inspection' : 'New inspection'} fields={generalFields} initial={form} close={() => setForm(null)} save={v => saveRecord('audits', v)}/>}
  </div>;
}
function recordFields(workspaceId, db) {
  const projects = db.projects.filter(p => p.workspaceId === workspaceId && p.status !== 'Archived');
  return [selectField('projectId', 'Project', projects.map(p => ({ value: p.id, label: p.name })), true),
    field('inspector', 'Inspector', true), dateField('date', 'Inspection date', true),
    selectField('status', 'Status', inspectionKinds, true),
    { ...field('score', 'Recorded compliance score (0–100)'), type: 'number', min: 0, max: 100 },
    { ...field('findings', 'Finding count'), type: 'number', min: 0, max: 10000 },
    { ...field('notes', 'Inspection notes'), type: 'textarea', wide: true }];
}
