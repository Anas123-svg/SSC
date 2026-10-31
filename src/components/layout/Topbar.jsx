import React from 'react';
import { Bell, ChevronRight, Menu, Search } from 'lucide-react';
import { PAGE_META } from '../../app/navigation.js';
import { usePortal } from '../../app/PortalContext.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';
import AppearanceToggle from './AppearanceToggle.jsx';
export default function Topbar() {
  const { page, go, query, setQuery, searchRef, setNavOpen, notify, setNotify, openActions, activeWorkspace, can } = usePortal();
  return <header className="topbar"><div className="crumb"><button className="hamburger" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu size={22}/></button><span>{activeWorkspace.name}</span><ChevronRight size={14}/><strong>{PAGE_META[page]?.title}</strong></div><div className="top-tools"><InstallAppButton/><AppearanceToggle/><label className="search"><Search size={17}/><input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search this page…" aria-label="Search current page"/><kbd>/</kbd></label>
  {can('audits') && <div className="notification"><button className="icon-button" aria-label="Notifications" aria-expanded={notify} onClick={() => setNotify(!notify)}><Bell size={20}/></button>{openActions.length > 0 && <i className="notify-dot"/>}{notify && <div className="notify-pop"><h3>Workspace findings</h3>{openActions.slice(0,5).map(a => <button key={a.id} onClick={() => go('audits','actions')}><span><strong>{a.title}</strong><small>{a.priority} · Due {a.due}</small></span></button>)}{!openActions.length && <p>No outstanding findings.</p>}<button className="notify-end" onClick={() => go('audits','actions')}>View corrective actions</button></div>}</div>}</div></header>;
}

