import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Building2, CalendarCheck2, CalendarDays, CheckCircle2,
  ClipboardCheck, Download, ExternalLink, FileText, FolderKanban,
  Mail, MapPin, Pencil, Phone, Plus, ShieldAlert, ShieldCheck, UsersRound,
} from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button, DataTable, EmptyState, RecordForm } from '../components/common/WorkspaceUI.jsx';
import { Status } from '../components/common/PortalUI.jsx';
import { metrics, isOpen, isOverdue, today } from '../data/repository.js';
import { operational } from '../data/inspections.js';
import { projectRecords } from '../data/projectScope.js';
import { validCoordinate } from '../utils/mapCoordinates.js';
import AnalyticsPage from './AnalyticsPage.jsx';
import ReportsPage from './ReportsPage.jsx';

export const PROJECT_SECTIONS = ['overview', 'inspections', 'insights', 'reports', 'documents'];
const sections = [
  ['overview', 'Overview'], ['inspections', 'Inspections'],
  ['insights', 'Insights'], ['reports', 'Reports'], ['documents', 'Documents'],
];
const icons = { overview: Building2, inspections: ClipboardCheck, insights: ShieldCheck, reports: FileText, documents: FolderKanban };
const field = (key, label, required = false) => ({ key, label, required });
const select = (key, label, options, required = false) => ({ key, label, type: 'select', options, required });
const area = (key, label) => ({ key, label, type: 'textarea', wide: true });
const date = (key, label, required = false) => ({ key, label, type: 'date', required });
const prettyDate = v => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return v || 'Not set';
  return new Date(`${v}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const display = value => value || 'Not provided';
const openDate = item => `${item.date || ''} ${item.time || ''}`;

function Panel({ title, note, icon: Icon, action, children, className = '' }) {
  return <section className={`pd-panel ${className}`}>
    <div className="pd-panel-head"><div className="pd-panel-label">{Icon && <span className="pd-panel-icon"><Icon size={17}/></span>}<div><h2>{title}</h2>{note && <p>{note}</p>}</div></div>{action}</div>
    {children}
  </section>;
}
function Detail({ label, value, icon: Icon }) {
  return <div className="pd-definition"><span className="pd-definition-key">{Icon && <Icon size={14}/>} {label}</span><strong>{display(value)}</strong></div>;
}
function MiniMetric({ icon: Icon, label, value, note, tone = '' }) {
  return <div className={`pd-kpi ${tone}`}><div className="pd-kpi-top"><span>{label}</span><span className="pd-kpi-icon"><Icon size={19}/></span></div><strong>{value}</strong><small>{note}</small></div>;
}
function EmptyInline({ icon: Icon, title, detail }) {
  return <div className="pd-empty"><span><Icon size={22}/></span><strong>{title}</strong><p>{detail}</p></div>;
}

/** Every detail record is filtered by both the project ID and owning workspace. */
export default function ProjectDetailPage({ project, onEdit }) {
  const { subview, activeWorkspaceId, scoped, audits, actions, saveRecord, go, workspaces } = usePortal();
  const section = PROJECT_SECTIONS.includes(subview) ? subview : 'overview';
  const [editingAction, setEditingAction] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [documentCategory, setDocumentCategory] = useState('');
  const projectAudits = useMemo(() => projectRecords(audits, project), [audits, project.id, project.workspaceId]);
  const projectActions = useMemo(() => projectRecords(actions, project), [actions, project.id, project.workspaceId]);
  const allDocuments = projectRecords(scoped('documents'), project);
  const projectDocuments = allDocuments.filter(r => !documentCategory || r.category === documentCategory);
  const realAudits = operational(projectAudits);
  const realActions = operational(projectActions);
  const projectSchedule = projectRecords(scoped('schedule'), project);
  const upcoming = projectSchedule.filter(r => r.date >= today() && (r.status || 'Scheduled') === 'Scheduled').sort((a, b) => openDate(a).localeCompare(openDate(b))).slice(0, 3);
  const recent = [...realAudits].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 4);
  const findings = realActions.filter(isOpen).sort((a, b) => (Number(isOverdue(b)) - Number(isOverdue(a))) || String(a.due || '9999').localeCompare(String(b.due || '9999'))).slice(0, 4);
  const performance = metrics(realAudits, realActions);
  const completion = performance.total ? Math.round(performance.completed / performance.total * 100) : null;
  const workspaceName = workspaces.find(w => w.id === project.workspaceId)?.name;
  const hasPin = validCoordinate(project.latitude, project.longitude);
  const mapUrl = hasPin ? `https://www.openstreetmap.org/?mlat=${project.latitude}&mlon=${project.longitude}#map=17/${project.latitude}/${project.longitude}` : '';
  const lat = Number(project.latitude), lng = Number(project.longitude);
  const mapEmbed = hasPin ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.002}%2C${lat - 0.0015}%2C${lng + 0.002}%2C${lat + 0.0015}&layer=mapnik&marker=${lat}%2C${lng}` : '';
  const move = next => go('sites', project.id, activeWorkspaceId, next === 'overview' ? null : next);
  // Open the actual fillable HXC report, prelinked to this project's workspace.
  const createHxcInspection = () => go('audits', `new-project-${project.id}`, project.workspaceId);
  const openInspection = r => go('audits', r.id, r.workspaceId || project.workspaceId);
  const openFinding = r => r.source === 'hxc' ? go('audits', r.inspectionId) : setEditingAction(r);
  const download = file => {
    if (!file?.data) return;
    const link = document.createElement('a'); link.href = file.data; link.download = file.name || 'document'; link.click();
  };
  const actionFields = [
    field('title', 'Finding / description', true),
    select('inspectionId', 'Related inspection', [{ value: '', label: 'Not linked' }, ...projectAudits.filter(r => r.source !== 'hxc').map(r => ({ value: r.id, label: `${r.nativeId || r.id} · ${r.type}` }))]),
    select('priority', 'Severity', ['Low', 'Medium', 'High', 'Critical'], true),
    field('assigned', 'Responsible person', true), date('due', 'Due date', true),
    select('status', 'Status', ['Open', 'In Progress', 'Resolved', 'Closed'], true),
    area('notes', 'Progress notes'), area('evidence', 'Completion evidence / verification reference'),
    { key: 'evidenceFile', label: 'Completion attachment (maximum 750 KB)', type: 'file' },
  ];
  const documentFields = [
    field('name', 'Document title', true),
    select('category', 'Category', ['Safety documentation', 'Method statements', 'Inspection reports', 'Certificates', 'Training records', 'Other'], true),
    field('reference', 'Reference / revision'), area('description', 'Description'),
    { key: 'file', label: 'File (maximum 750 KB)', type: 'file', hint: 'Stored in your browser only, not uploaded to a secure server.' },
  ];
  const newDocument = () => setEditingDocument({ workspaceId: project.workspaceId, projectId: project.id, category: 'Inspection reports' });
  const saveAction = v => saveRecord('actions', { ...v, workspaceId: project.workspaceId, projectId: project.id });
  const saveDocument = v => {
    if (!v.file && !editingDocument?.file) throw new Error('Select a document file.');
    saveRecord('documents', { ...v, workspaceId: project.workspaceId, projectId: project.id });
  };
  // Keep the fillable HXC template in the normal inspection table.
  // Hide the legacy Fire safety walkthrough entry here without deleting saved records.
  // The HXC starter is an action, not a saved audit, and isn't counted in KPIs.
  const inspectionRows = [
    { id: `hxc-starter-${project.id}`, isHxcStarter: true, type: 'HXC Audit inspection' },
    ...realAudits
      .filter(a => String(a.type || '').trim().toLowerCase() !== 'fire safety walkthrough')
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
  ];
  const inspectionColumns = [
    { label: 'Inspection', render: r => <><strong>{r.type || 'Inspection'}</strong><small>{r.isHxcStarter ? 'Fillable HXC audit template' : (r.nativeId || r.id)}</small></> },
    { label: 'Date', render: r => r.isHxcStarter ? '—' : prettyDate(r.date) },
    { label: 'Inspector', render: r => r.isHxcStarter ? '—' : (r.inspector || '—') },
    { label: 'Status', render: r => r.isHxcStarter ? <span className="pd-hxc-ready">Ready to fill</span> : <Status text={r.status || 'Draft'}/> },
    { label: 'Score', render: r => !r.isHxcStarter && r.status === 'Completed' && r.score != null && r.score !== '' ? `${r.score}%` : '—' },
    { label: 'Open', render: r => r.isHxcStarter
      ? <Button primary onClick={createHxcInspection}><Plus size={14}/> Open HXC audit</Button>
      : <Button onClick={() => openInspection(r)}>View inspection <ArrowRight size={13}/></Button> },
  ];
  const documentColumns = [
    { label: 'Document', render: r => <><strong>{r.name}</strong><small>{r.reference || r.id}</small></> },
    { label: 'Category', key: 'category' }, { label: 'Description', key: 'description' },
    { label: 'Actions', render: r => <div className="row-actions"><Button onClick={() => download(r.file)} disabled={!r.file?.data}><Download size={14}/> Download</Button><Button onClick={() => setEditingDocument(r)}>Edit details</Button></div> },
  ];

  return <div className="workspace-page project-detail-page pd-page">
    <header className="pd-hero">
      <div className="pd-crumb"><button type="button" onClick={() => go('sites')}><ArrowLeft size={15}/> Projects & Locations</button><span>/</span><span>{project.name}</span></div>
      <div className="pd-hero-main"><div className="pd-project-avatar"><Building2 size={26}/></div><div className="pd-hero-copy"><div className="pd-eyebrow">PROJECT WORKSPACE <span className="pd-eye-dot"/> {display(project.reference)}</div><h1>{project.name}</h1><div className="pd-hero-meta"><span><MapPin size={14}/>{project.address || project.location || 'No site address'}</span>{workspaceName && <span><Building2 size={14}/>{workspaceName}</span>}{project.manager && <span><UsersRound size={14}/>{project.manager}</span>}</div></div><div className="pd-hero-actions"><span className={`pd-state ${String(project.status || 'Active').toLowerCase()}`}>{project.status || 'Active'}</span><button type="button" className="pd-btn pd-btn-primary" onClick={onEdit}><Pencil size={15}/> Edit project</button></div></div>
      <nav className="pd-tabs project-section-nav" aria-label="Project sections">{sections.map(([id, label]) => { const Icon = icons[id]; return <button type="button" key={id} className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => move(id)}><Icon size={15}/>{label}</button>; })}</nav>
    </header>

    {section === 'overview' && <>
      <div className="pd-kpis">
        <MiniMetric icon={ClipboardCheck} label="Total inspections" value={performance.total} note="Saved inspections for this site"/>
        <MiniMetric icon={CheckCircle2} label="Inspection completion" value={completion == null ? '—' : `${completion}%`} note={`${performance.completed} completed of ${performance.total}`}/>
        <MiniMetric icon={ShieldCheck} label="Average compliance" value={performance.compliance == null ? '—' : `${performance.compliance}%`} note="Completed, scored inspections"/>
        <MiniMetric icon={ShieldAlert} label="Open findings" value={performance.open} note={`${performance.overdue} overdue`} tone={performance.overdue ? 'is-alert' : ''}/>
      </div>
      <div className="pd-dashboard-grid">
        <div className="pd-dashboard-primary">
          <Panel title="Project overview" note="Scope, timeline and management" icon={Building2} action={<button className="pd-text-btn" type="button" onClick={onEdit}>Update details <ArrowRight size={15}/></button>}>
            {project.description && <p className="pd-project-description">{project.description}</p>}
            <div className="pd-definition-grid">
              <Detail label="Project type" value={project.type} icon={Building2}/>
              <Detail label="Project reference" value={project.reference} icon={FolderKanban}/>
              {project.manager && <Detail label="Project manager" value={project.manager} icon={UsersRound}/>}
              {project.contractor && <Detail label="Principal contractor" value={project.contractor} icon={Building2}/>}
              {project.start && <Detail label="Start date" value={prettyDate(project.start)} icon={CalendarDays}/>}
              {project.end && <Detail label="Expected completion" value={prettyDate(project.end)} icon={CalendarCheck2}/>}
            </div>
            <div className="pd-completion"><div><span>Recorded inspection completion</span><strong>{completion == null ? 'No inspections yet' : `${performance.completed} of ${performance.total} completed`}</strong></div><div className="pd-meter"><span style={{ width: `${completion ?? 0}%` }}/></div></div>
          </Panel>
          <Panel title="Recent inspections" note="Latest inspections linked to this project" icon={ClipboardCheck} action={<button className="pd-text-btn" type="button" onClick={() => move('inspections')}>View all <ArrowRight size={15}/></button>}>
            {recent.length ? <div className="pd-record-list">{recent.map(r => <button type="button" key={r.id} className="pd-record-row" onClick={() => openInspection(r)}><span className="pd-record-icon"><ClipboardCheck size={18}/></span><span className="pd-record-main"><strong>{r.type || 'Site inspection'}</strong><small>{prettyDate(r.date)} · {r.inspector || 'Inspector not assigned'}</small></span><Status text={r.status || 'Draft'}/><ArrowRight size={16} className="pd-record-arrow"/></button>)}</div> : <EmptyInline icon={ClipboardCheck} title="No inspections recorded" detail="Inspections linked to this site will appear here."/>}
          </Panel>
          <Panel title="Outstanding corrective actions" note="Open findings requiring follow-up" icon={ShieldAlert}>
            {findings.length ? <div className="pd-record-list">{findings.map(r => <button type="button" key={r.id} className="pd-record-row" onClick={() => openFinding(r)}><span className={`pd-severity pd-severity-${String(r.priority || 'medium').toLowerCase()}`}>{(r.priority || 'M').slice(0, 1)}</span><span className="pd-record-main"><strong>{r.title || r.finding || 'Untitled finding'}</strong><small>{r.assigned || 'Unassigned'} · Due {prettyDate(r.due)}</small></span><span className={isOverdue(r) ? 'pd-overdue' : 'pd-priority'}>{isOverdue(r) ? 'Overdue' : r.priority || 'Open'}</span><ArrowRight size={16} className="pd-record-arrow"/></button>)}</div> : <EmptyInline icon={CheckCircle2} title="No open findings" detail="There are no unresolved corrective actions recorded for this project."/>}
          </Panel>
        </div>
        <aside className="pd-dashboard-aside">
          <Panel title="Site location" note="Address and pinpointed position" icon={MapPin} className="pd-location-card">
            {hasPin ? <div className="pd-map"><iframe title={`Map location of ${project.name}`} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer"/></div> : <div className="pd-map-placeholder"><MapPin size={25}/><strong>No map pin set</strong><small>Add the site's location while editing the project.</small></div>}
            <div className="pd-address"><MapPin size={16}/><div><strong>{project.address || project.location || 'Address not provided'}</strong><small>{[project.city, project.region, project.postalCode, project.country].filter(Boolean).join(', ') || (hasPin ? 'Location pinned on map' : 'Use Edit project to pin this address')}</small></div></div>
            {hasPin ? <a className="pd-map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">View on OpenStreetMap <ExternalLink size={14}/></a> : <button className="pd-text-btn" type="button" onClick={onEdit}>Add map pin <ArrowRight size={14}/></button>}
          </Panel>
          <Panel title="Upcoming site visits" note="Scheduled inspections for this site" icon={CalendarDays} action={<button type="button" className="pd-text-btn" onClick={() => go('schedule')}>Calendar <ArrowRight size={14}/></button>}>
            {upcoming.length ? <div className="pd-upcoming">{upcoming.map(r => <div key={r.id} className="pd-upcoming-row"><span className="pd-date-tile"><strong>{r.date?.slice(8, 10)}</strong><small>{prettyDate(r.date).split(' ')[1]}</small></span><div><strong>{r.type || 'Scheduled inspection'}</strong><small>{r.time || 'Time not set'} · {r.inspector || 'Unassigned'}</small></div></div>)}</div> : <EmptyInline icon={CalendarDays} title="Nothing scheduled" detail="Upcoming visits will appear after they are added to Inspection Schedule."/>}
          </Panel>
          {(project.siteContact || project.sitePhone || project.siteEmail || project.accessInstructions || project.safetyNotes) ?
            <Panel title="Site contacts & notes" note="Saved information for visiting teams" icon={UsersRound}>
              {(project.siteContact || project.sitePhone || project.siteEmail) && <div className="pd-contact-list">
                {project.siteContact && <Detail label="Site contact" value={project.siteContact} icon={UsersRound}/>}
                {project.sitePhone && <Detail label="Phone" value={project.sitePhone} icon={Phone}/>}
                {project.siteEmail && <Detail label="Email" value={project.siteEmail} icon={Mail}/>}
              </div>}
              {project.accessInstructions && <div className="pd-note"><strong><MapPin size={15}/> Arrival & access</strong><p>{project.accessInstructions}</p></div>}
              {project.safetyNotes && <div className="pd-note is-safety"><strong><ShieldAlert size={15}/> Safety & PPE</strong><p>{project.safetyNotes}</p></div>}
            </Panel>
          : <Panel title="Quick actions" note="Common tasks for this site" icon={ClipboardCheck}>
              <div className="pd-quick-actions">
                <button type="button" onClick={() => go('audits')}><span><ClipboardCheck size={18}/></span><span><strong>Record an inspection</strong><small>Open the inspection register</small></span><ArrowRight size={15}/></button>
                <button type="button" onClick={() => go('schedule')}><span><CalendarDays size={18}/></span><span><strong>Plan a site visit</strong><small>Open the inspection calendar</small></span><ArrowRight size={15}/></button>
                <button type="button" onClick={() => move('documents')}><span><FileText size={18}/></span><span><strong>View documents</strong><small>Site drawings and inspection evidence</small></span><ArrowRight size={15}/></button>
              </div>
            </Panel>}

        </aside>
      </div>
    </>}

    {section === 'inspections' && <div className="pd-inspections-content">
      <Panel title="Project inspections" note="Open saved inspections in their original fillable forms" icon={ClipboardCheck}
        action={<button className="pd-text-btn" type="button" onClick={() => go('audits', null, project.workspaceId)}>Inspection register <ArrowRight size={15}/></button>}>
        <div className="pd-section-summary"><span><ClipboardCheck size={16}/>{performance.total} inspections</span>
          <span><CheckCircle2 size={16}/>{performance.completed} completed</span>
          <span><ShieldCheck size={16}/>{performance.compliance == null ? 'No scores yet' : `${performance.compliance}% average compliance`}</span>
        </div>
        <div className="pd-table"><DataTable rows={inspectionRows} columns={inspectionColumns}/></div>
      </Panel>
    </div>}
    {section === 'insights' && <section className="pd-project-insights-content" aria-label="Project insights"><AnalyticsPage projectId={project.id} embedded /></section>}
    {section === 'reports' && <ReportsPage projectId={project.id} />}
    {section === 'documents' && <Panel title="Project documents" note="Site-specific drawings, certificates, reports and evidence" icon={FileText} action={<button type="button" className="pd-btn pd-btn-primary" onClick={newDocument}><Plus size={15}/> Add document</button>}><label className="pd-document-filter">Document category<select value={documentCategory} onChange={e => setDocumentCategory(e.target.value)}><option value="">All categories</option>{[...new Set(allDocuments.map(r => r.category).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c}</option>)}</select></label><div className="pd-table"><DataTable rows={projectDocuments} columns={documentColumns} empty={<EmptyState title="No project documents" description="Add drawings, method statements, inspection reports or supporting files here." action={<Button onClick={newDocument}><Plus size={15}/> Add a document</Button>}/>}/></div><p className="pd-hint">Attachments are stored in this browser, not in a shared server.</p></Panel>}

    {editingAction && <RecordForm title={editingAction.id ? 'Update project finding' : 'Create project finding'} fields={actionFields} initial={editingAction} save={saveAction} close={() => setEditingAction(null)}/>}
    {editingDocument && <RecordForm title={editingDocument.id ? 'Edit project document' : 'Add project document'} fields={documentFields} initial={editingDocument} save={saveDocument} close={() => setEditingDocument(null)}/>}
  </div>;
}
