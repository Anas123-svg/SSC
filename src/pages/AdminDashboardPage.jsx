import React from 'react';
import { ArrowRight, Building2, ClipboardCheck, FolderKanban, Plus } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button } from '../components/common/WorkspaceUI.jsx';

/** Small portfolio home for the Admin workspace; client dashboards are unchanged. */
export default function AdminDashboardPage() {
  const { workspaces, scopedSites, audits, db, go, setModal } = usePortal();
  const active = workspaces.filter(w => w.status !== 'Inactive');
  const count = n => new Intl.NumberFormat('en-GB').format(n);
  const stats = [
    { label: 'Active workspaces', value: active.length, Icon: Building2 },
    { label: 'Projects', value: scopedSites.filter(p => p.status !== 'Archived').length, Icon: FolderKanban },
    { label: 'Inspections', value: audits.length, Icon: ClipboardCheck },
  ];
  return <div className="workspace-page ssc-admin-simple">
    <header className="ssc-admin-heading">
      <div><span className="ssc-admin-kicker">ADMINISTRATION</span><h1>Admin overview</h1><p>Manage your workspaces, people and HXC inspection template.</p></div>
      <Button primary onClick={() => setModal({ kind: 'new-workspace' })}><Plus size={16}/> Add workspace</Button>
    </header>
    <div className="ssc-admin-stats">{stats.map(({ label, value, Icon }) => <div className="ssc-admin-stat" key={label}><span>{label}<Icon size={18}/></span><strong>{count(value)}</strong></div>)}</div>
    <section className="ssc-admin-panel">
      <div className="ssc-admin-panel-heading"><div><h2>Workspaces</h2><p>Open a workspace to manage its projects and inspections.</p></div><button className="ssc-admin-text-link" type="button" onClick={() => go('workspaces')}>Manage all <ArrowRight size={15}/></button></div>
      <div className="ssc-admin-items">{workspaces.length ? workspaces.map(w => <div className="ssc-admin-item" key={w.id}>
        <span className="ssc-admin-item-icon"><Building2 size={18}/></span>
        <div className="ssc-admin-item-info"><strong>{w.name}</strong><small>{w.client || 'Workspace'} · {db.projects.filter(p => p.workspaceId === w.id && p.status !== 'Archived').length} projects</small></div>
        <span className={'ssc-admin-state ' + (w.status === 'Inactive' ? 'inactive' : '')}>{w.status === 'Inactive' ? 'Inactive' : 'Active'}</span>
        <button type="button" className="ssc-admin-open" disabled={w.status === 'Inactive'} onClick={() => go('overview', null, w.id)}>Open <ArrowRight size={15}/></button>
      </div>) : <p className="ssc-admin-empty">No workspaces yet. Add a workspace to get started.</p>}</div>
    </section>
  </div>;
}
