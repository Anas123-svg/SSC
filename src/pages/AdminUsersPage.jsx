import React, { useState } from 'react';
import { Plus, UsersRound, Pencil } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button, RecordForm } from '../components/common/WorkspaceUI.jsx';

export default function AdminUsersPage() {
  const { db, workspaces, saveRecord } = usePortal();
  const [editing, setEditing] = useState(null);
  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'role', label: 'Role', type: 'select', required: true, options: ['Admin', 'Site Manager', 'Inspector', 'Viewer'] },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive'] },
    { key: 'workspaceIds', label: 'Assigned workspaces', type: 'multi', wide: true, options: workspaces.map(w => ({ value: w.id, label: w.name })) },
  ];
  return <div className="workspace-page ssc-admin-simple">
    <header className="ssc-admin-heading"><div><span className="ssc-admin-kicker">ADMINISTRATION</span><h1>Users</h1><p>Keep track of names, roles and workspace assignments.</p></div><Button primary onClick={() => setEditing({ role: 'Inspector', status: 'Active', workspaceIds: [], projectIds: [] })}><Plus size={16}/> Add user</Button></header>
    <section className="ssc-admin-panel"><div className="ssc-admin-panel-heading"><div><h2>Team members</h2><p>{db.users.length} recorded user{db.users.length === 1 ? '' : 's'}</p></div></div>
      <div className="ssc-admin-items">{db.users.length ? db.users.map(user => <div className="ssc-admin-item" key={user.id}>
        <span className="ssc-admin-item-icon"><UsersRound size={18}/></span>
        <div className="ssc-admin-item-info"><strong>{user.name}</strong><small>{user.email} · {user.role || 'Viewer'}</small></div>
        <span className={'ssc-admin-state ' + (user.status === 'Inactive' ? 'inactive' : '')}>{user.status || 'Active'}</span>
        <button type="button" className="ssc-admin-quiet-button" onClick={() => setEditing(user)}><Pencil size={15}/> Edit</button>
      </div>) : <p className="ssc-admin-empty">No users added yet.</p>}</div>
    </section>
    <p className="ssc-admin-disclaimer">User assignments are browser-local demo records. They do not create logins, send invitations or enforce secure authentication.</p>
    {editing && <RecordForm title={editing.id ? 'Edit user' : 'Add user'} fields={fields} initial={editing} close={() => setEditing(null)} save={v => saveRecord('users', { ...v, projectIds: (v.projectIds || []).filter(id => db.projects.some(p => p.id === id && (v.workspaceIds || []).includes(p.workspaceId))) })}/>}
  </div>;
}
