import React, { useState } from 'react';
import { Download, Info } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button } from '../components/common/WorkspaceUI.jsx';

/** Minimal administration settings: preserve local data without unnecessary switches or reset controls. */
export default function AdminSettingsPage() {
  const { db, setToast } = usePortal();
  const [error, setError] = useState('');
  const backup = () => {
    try {
      const hxc = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('harmonix-hxc-audits-v2')) hxc[key] = JSON.parse(localStorage.getItem(key));
      }
      const blob = new Blob([JSON.stringify({ database: db, hxc }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'ssc-browser-backup.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError(''); setToast('Backup downloaded.');
    } catch (e) { setError(e.message); }
  };
  return <div className="workspace-page ssc-admin-simple">
    <header className="ssc-admin-heading"><div><span className="ssc-admin-kicker">ADMINISTRATION</span><h1>Settings</h1><p>Just the essentials for your local demo.</p></div></header>
    <section className="ssc-admin-panel ssc-admin-backup"><div><h2>Export a backup</h2><p>Save a JSON copy of your workspaces, projects, inspections and HXC audit records.</p><small><Info size={14}/> Records are stored in this browser. Keep exported backups in a secure location.</small></div><Button primary onClick={backup}><Download size={16}/> Download backup</Button></section>
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
