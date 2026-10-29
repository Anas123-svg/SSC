import React, { useState } from 'react';
import { ArrowRight, Building2, Pencil, Plus } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button, RecordForm } from '../components/common/WorkspaceUI.jsx';

/** Essential workspace management. Advanced module setup remains saved but is not exposed here. */
export default function WorkspacesPage() {
  const { db, workspaces, go, setModal, saveRecord, setToast } = usePortal();
  const [editing, setEditing] = useState(null);
  const fields = [
    { key: 'name', label: 'Workspace name', required: true, maxLength: 80 },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive'] },
  ];
  const toggle = workspace => {
    try { saveRecord('workspaces', { ...workspace, status: workspace.status === 'Inactive' ? 'Active' : 'Inactive' }); }
    catch (error) { setToast(error.message); }
  };
  return <div className="workspace-page ssc-admin-simple">
    <header className="ssc-admin-heading"><div><span className="ssc-admin-kicker">ADMINISTRATION</span><h1>Workspaces</h1><p>Manage the client workspaces in one place.</p></div><Button primary onClick={() => setModal({ kind: 'new-workspace' })}><Plus size={16}/> Add workspace</Button></header>
    <section className="ssc-admin-panel"><div className="ssc-admin-panel-heading"><div><h2>All workspaces</h2><p>{workspaces.length} workspace{workspaces.length === 1 ? '' : 's'}</p></div></div>
      <div className="ssc-admin-items">{workspaces.length ? workspaces.map(w => <div key={w.id} className="ssc-admin-item">
        <span className="ssc-admin-item-icon"><Building2 size={19}/></span>
        <div className="ssc-admin-item-info"><strong>{w.name}</strong><small>{w.client || 'Client workspace'} · {db.projects.filter(p => p.workspaceId === w.id).length} projects</small></div>
        <span className={'ssc-admin-state ' + (w.status === 'Inactive' ? 'inactive' : '')}>{w.status === 'Inactive' ? 'Inactive' : 'Active'}</span>
        <div className="ssc-admin-item-actions">
          <button type="button" className="ssc-admin-quiet-button" onClick={() => setEditing(w)}><Pencil size={15}/> Edit</button>
          <button type="button" className="ssc-admin-quiet-button" onClick={() => toggle(w)}>{w.status === 'Inactive' ? 'Activate' : 'Deactivate'}</button>
          <button type="button" className="ssc-admin-open" disabled={w.status === 'Inactive'} onClick={() => go('overview', null, w.id)}>Open <ArrowRight size={15}/></button>
        </div>
      </div>) : <p className="ssc-admin-empty">No workspaces yet. Create one to get started.</p>}</div>
    </section>
    {editing && <RecordForm title={'Edit ' + editing.name} fields={fields} initial={editing} close={() => setEditing(null)} save={v => saveRecord('workspaces', v)}/>}
  </div>;
}
