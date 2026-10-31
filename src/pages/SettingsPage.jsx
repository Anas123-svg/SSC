import React, { useState } from 'react';
import { ArchiveRestore, Bell, Building2, Download, ExternalLink, Info, Mail, Phone, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { RecordForm, Button } from '../components/common/WorkspaceUI.jsx';
import { workspaceFields } from '../components/dialogs/CreateWorkspaceDialog.jsx';
import { migrateDatabase } from '../data/repository.js';
import { getWorkspaceLogo } from '../data/workspaceBranding.js';
import AppearanceToggle from '../components/layout/AppearanceToggle.jsx';

export default function SettingsPage() {
  const { activeWorkspaceId, activeWorkspace, db, commit, saveRecord, setToast, isAdmin, resolvedAppearance } = usePortal();
  const admin = activeWorkspaceId === 'admin';
  const [editing,setEditing] = useState(false),[error,setError] = useState('');
  const prefs = admin ? db.prefs || {} : activeWorkspace.prefs || {};
  const logo = getWorkspaceLogo(activeWorkspace);
  const update = (key,value) => { try { setError(''); if(admin) commit({...db,prefs:{...prefs,[key]:value}}); else saveRecord('workspaces',{...activeWorkspace,prefs:{...prefs,[key]:value}}); setToast('Preference saved in this browser.'); } catch(e) { setError(e.message); } };
  const backup = () => { try { const hxc={}; for(let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if(key.startsWith('harmonix-hxc-audits-v2')) hxc[key]=JSON.parse(localStorage.getItem(key)); } const blob=new Blob([JSON.stringify({database:db,hxc},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='ssc-browser-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); setToast('Browser backup downloaded.'); } catch(e){setError(e.message);} };
  const reset = () => { if (!window.confirm('Reset the portfolio to the initial demo records? Export a backup first. Saved HXC archives are retained.')) return; try { commit(migrateDatabase({getItem:()=>null})); setToast('Initial portfolio restored. HXC archives retained.'); } catch(e) { setError(e.message); } };
  const choices = [{key:'email',label:'Email updates',description:'Save whether email notifications should be enabled when connected to a service.'},{key:'critical',label:'Critical findings',description:'Preference for high-priority safety issue alerts.'},{key:'weekly',label:'Weekly summary',description:'Preference for a digest of inspections and site activity.'}];
  return <div className="workspace-page ssc-v2-page ssc-v2-settings">
    <div className="ssc-v2-hero"><div><span className="ssc-v2-kicker"><SlidersHorizontal size={15}/> PLATFORM PREFERENCES</span><h1>Settings</h1><p>{admin ? 'Manage the SSC portfolio, notification preferences and local demo data.' : `Manage the identity and preferences for ${activeWorkspace.name}.`}</p></div></div>
    {error&&<div className="ssc-v2-error" role="alert">{error}</div>}
    <div className="ssc-v2-settings-grid"><section className="ssc-v2-panel"><div className="ssc-v2-panel-title"><h2>{admin?'Organisation identity':'Workspace profile'}</h2><p>{admin?'Platform-wide administration and management':'Workspace details used across the project and inspection pages'}</p></div>
      <div className="ssc-v2-profile"><div className="ssc-v2-profile-logo">{logo ? <img src={logo} alt={`${activeWorkspace.name} logo`}/> : <Building2 size={26}/>}</div><div><h3>{admin?'Site Safety Consultants':activeWorkspace.name}</h3><span>{admin?'Portfolio administration':activeWorkspace.client||'Client workspace'}</span></div></div>
      <dl className="ssc-v2-definition"><div><dt><Building2 size={15}/> Workspace</dt><dd>{admin?'Admin':activeWorkspace.name}</dd></div><div><dt><Mail size={15}/> Contact email</dt><dd>{admin?'Managed locally':activeWorkspace.email||'Not provided'}</dd></div><div><dt><Phone size={15}/> Phone</dt><dd>{admin?'—':activeWorkspace.phone||'Not provided'}</dd></div><div><dt><ShieldCheck size={15}/> Access</dt><dd>{admin?'Administrator session':`${activeWorkspace.modules?.length||0} enabled features`}</dd></div></dl>
      {!admin&&isAdmin&&<div className="ssc-v2-card-foot"><Button onClick={()=>setEditing(true)}>Edit workspace details <ExternalLink size={15}/></Button></div>}
    </section>
    <section className="ssc-v2-panel"><div className="ssc-v2-panel-title"><h2>Notifications</h2><p>Select the alerts you would like to receive when notification delivery is connected.</p></div><div className="ssc-v2-toggle-list">{choices.map(c=><label key={c.key} className="ssc-v2-toggle-row"><span className="ssc-v2-toggle-icon"><Bell size={17}/></span><span className="ssc-v2-toggle-copy"><strong>{c.label}</strong><small>{c.description}</small></span><input type="checkbox" checked={!!prefs[c.key]} onChange={e=>update(c.key,e.target.checked)} aria-label={c.label}/><span aria-hidden="true" className="ssc-v2-switch"/></label>)}</div><div className="ssc-v2-note"><Info size={16}/> Settings are saved locally. No automatic email or push notifications are currently sent.</div></section></div>
    <section className="ssc-v2-panel ssc-v2-appearance-settings"><div className="ssc-v2-panel-title"><h2>Appearance & dark mode</h2><p>Switch between light and dark using one button. Harmonix uses its lime and charcoal brand palette, while SSC Admin retains its original pink and charcoal colours.</p></div>
      <div className="ssc-theme-settings-row"><AppearanceToggle/><span>Use the sun/moon button to switch between light and dark.</span></div>
      <p className="ssc-v2-note"><Info size={16}/> Currently displaying {resolvedAppearance} mode. Your choice remains available offline and follows you between workspaces on this device. Printed reports always use a light document sheet.</p>
    </section>
    {admin&&<section className="ssc-v2-panel ssc-v2-maintenance"><div><div className="ssc-v2-panel-title"><h2>Browser data & backup</h2><p>Preserve a copy of the current workspace records and HXC audits before making substantial changes.</p></div><div className="ssc-v2-note"><Info size={16}/> This is a browser-local demonstration. Backup files can contain private site and contact information; keep them secure.</div></div><div className="ssc-v2-maintenance-actions"><Button primary onClick={backup}><Download size={16}/> Export JSON backup</Button><Button onClick={reset}><ArchiveRestore size={16}/> Restore starter data</Button></div></section>}
    {editing&&<RecordForm title="Workspace settings" fields={[...workspaceFields.filter(f=>f.key!=='client' && (isAdmin || f.key!=='modules')),{key:'clientId',label:'Client / company',type:'select',required:true,options:db.clients.map(c=>({value:c.id,label:c.name}))}]} initial={activeWorkspace} close={()=>setEditing(false)} save={v=>saveRecord('workspaces',v)}/>}
  </div>;
}
