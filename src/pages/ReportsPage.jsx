import React, { useMemo, useState } from 'react';
import { ArrowRight, Download, FileCheck2, FileText, FolderOpen, Search } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button } from '../components/common/WorkspaceUI.jsx';
import { buildReportCatalog } from '../data/reportCatalog.js';

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A list of actual completed inspection records and attached report files.
 * Charts and portfolio insights deliberately belong to the Dashboard/project Insights tab.
 */
export default function ReportsPage({ projectId = null }) {
  const { activeWorkspaceId, audits, scoped, scopedSites, workspaces, go, matches } = usePortal();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [kind, setKind] = useState('all');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const catalog = useMemo(() => buildReportCatalog({
    inspections: audits, documents: scoped('documents'), projects: scopedSites,
    workspaceId: activeWorkspaceId, projectId,
  }), [audits, scoped, scopedSites, activeWorkspaceId, projectId]);
  const visible = catalog.filter(item =>
    (kind === 'all' || item.kind === kind) &&
    (projectId || !selectedProject || item.projectId === selectedProject) &&
    (activeWorkspaceId !== 'admin' || !selectedWorkspace || item.workspaceId === selectedWorkspace) &&
    `${item.title} ${item.reference} ${item.project} ${item.format}`.toLowerCase().includes(search.trim().toLowerCase()) &&
    matches(item.title, item.reference, item.project)
  ).sort((a,b)=>sort==='oldest' ? a.date.localeCompare(b.date) : a.date.localeCompare(b.date)*-1);
  const open = row => {
    if (row.kind === 'inspection') return go('audits', row.inspectionId, activeWorkspaceId === 'admin' ? 'admin' : activeWorkspaceId);
    if (row.file?.data) {
      const a = document.createElement('a');
      a.href = row.file.data;
      a.download = row.file.name || row.title || 'report';
      a.click();
    } else if (row.projectId) go('sites', row.projectId, activeWorkspaceId === 'admin' ? row.workspaceId : activeWorkspaceId, 'documents');
  };
  return <div className="workspace-page ssc-report-library ssc-v2-page">
    <section className="ssc-report-surface">
      <div className="ssc-report-heading">
        <div><div className="ssc-v2-kicker"><FileCheck2 size={15}/> REPORT LIBRARY</div><h2>{projectId ? 'Project reports' : 'Reports'}</h2>
          <p>A simple, searchable record of completed inspections and saved report files. Open a record or download its attached document.</p>
        </div>
        <span className="ssc-report-count">{visible.length} {visible.length === 1 ? 'report' : 'reports'}</span>
      </div>
      <div className="ssc-report-toolbar">
        <label className="ssc-report-search"><Search size={17}/><span className="sr-only">Search reports</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports or reference…" aria-label="Search reports" /></label>
        <label className="ssc-report-select">Type <select value={kind} onChange={e => setKind(e.target.value)}><option value="all">All reports</option><option value="inspection">Inspection records</option><option value="file">Uploaded reports</option></select></label>
        {!projectId && <label className="ssc-report-select">Project <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}><option value="">All projects</option>{scopedSites.filter(p => !selectedWorkspace || p.workspaceId === selectedWorkspace).map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>}
        {activeWorkspaceId === 'admin' && !projectId && <label className="ssc-report-select">Workspace <select value={selectedWorkspace} onChange={e => { setSelectedWorkspace(e.target.value); setSelectedProject(''); }}><option value="">All workspaces</option><option value="admin">Legacy HXC archive</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
        <label className="ssc-report-select">Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      </div>
      {visible.length ? <div className="ssc-report-table-wrap"><table className="ssc-report-table"><thead><tr><th>REPORT</th><th>PROJECT</th><th>DATE</th><th>FORMAT</th><th className="ssc-report-action-head">ACTION</th></tr></thead><tbody>{visible.map(row => <tr key={row.id}>
        <td><div className="ssc-report-title"><span className="ssc-report-file-icon">{row.kind === 'file' ? <FolderOpen size={18}/> : <FileText size={18}/>}</span><span><strong>{row.title}</strong><small>{row.reference}</small></span></div></td>
        <td className="ssc-report-muted">{row.project}</td><td className="ssc-report-muted">{formatDate(row.date)}</td><td><span className="ssc-report-format">{row.format}</span></td>
        <td className="ssc-report-action-cell"><Button onClick={() => open(row)} disabled={row.kind === 'file' && !row.file?.data && !row.projectId}>{row.kind === 'file' && row.file?.data ? <><Download size={14}/> Download</> : <> {row.kind === 'file' ? 'Find document' : 'Open'} <ArrowRight size={14}/></>}</Button></td>
      </tr>)}</tbody></table></div> : <div className="ssc-report-empty"><FileText size={29}/><h3>{catalog.length ? 'No matching reports' : 'No reports available yet'}</h3><p>{catalog.length ? 'Try adjusting the search or filters.' : 'Completed inspections and uploaded report documents will appear in this list.'}</p>{!catalog.length && !projectId && <Button onClick={() => go('audits')}>Go to inspections <ArrowRight size={15}/></Button>}</div>}
      <p className="ssc-report-disclaimer">All records are saved locally in this browser. Completed inspections are report-ready records, not automatically generated PDF files.</p>
    </section>
  </div>;
}
