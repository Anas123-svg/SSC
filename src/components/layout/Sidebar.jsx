import React, { useEffect, useRef } from 'react';
import { ChevronRight, CircleHelp, Plus, ShieldCheck, X, LayoutDashboard, Building2, ClipboardCheck, ShieldAlert, CalendarDays, FolderOpen, UsersRound, FileBarChart2, BarChart3, Settings2, FileText, Bell } from 'lucide-react';
import { usePortal } from '../../app/PortalContext.jsx';
import WorkspaceSwitcher from './WorkspaceSwitcher.jsx';
const NAV_ICONS = { LayoutDashboard, Building2, ClipboardCheck, ShieldAlert, CalendarDays, FolderOpen, UsersRound, FileBarChart2, BarChart3, Settings2, FileText, Bell };
export default function Sidebar() {
  const { page, go, navOpen, setNavOpen, openActions, activeWorkspaceId, activeWorkspace, isAdmin, navigation, setModal, can } = usePortal();
  const sidebar = useRef(null);
  const isHarmonix = activeWorkspaceId === 'harmonix';
  useEffect(() => {
    if (!navOpen || !window.matchMedia('(max-width: 830px)').matches) return;
    const previous = document.activeElement, node = sidebar.current;
    node.scrollTop = 0;
    node.querySelector('.ssc-mobile-close')?.focus();
    const trap = e => {
      if (e.key !== 'Tab') return;
      const items = [...node.querySelectorAll('button:not(:disabled)')].filter(x => x.offsetParent !== null);
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0]?.focus(); }
    };
    node.addEventListener('keydown', trap);
    return () => { node.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
  }, [navOpen]);
  return <>{navOpen && <button type="button" className="nav-shade" aria-label="Close navigation" onClick={() => setNavOpen(false)}/>}
  <aside ref={sidebar} className={'sidebar ssc-sidebar ' + (navOpen ? 'is-open' : '')} aria-label="Main navigation"><div className="ssc-sidebar-head ssc-sidebar-head--integrated"><div className="ssc-brand-row"><div className={"ssc-brand-mark" + (isHarmonix ? " is-harmonix" : "")}><img src={isHarmonix ? "/harmonix-logo.png" : "/ssc-logo-for-dark-sidebar.png"} alt={isHarmonix ? "Harmonix" : "SSC"}/><span className="ssc-brand-divider" aria-hidden="true"/><span className="ssc-brand-title"><strong>{isHarmonix ? 'Harmonix' : 'Site Safety'}</strong><span>{isHarmonix ? 'Construction' : 'Consultants'}</span></span></div><button type="button" className="ssc-mobile-close" aria-label="Close sidebar" onClick={() => setNavOpen(false)}><X size={19}/></button></div><div className="ssc-product-caption">{isHarmonix ? "Construction · Site safety" : "Safety management platform"}</div></div>
  <WorkspaceSwitcher/><nav className="ssc-navigation" aria-label="Workspace sections">{navigation.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(({ id,label,icon }) => <button type="button" key={id} className={'nav-link ' + (page === id ? 'selected' : '')} aria-current={page === id ? 'page' : undefined} onClick={() => go(id)}>{React.createElement(NAV_ICONS[icon] || ClipboardCheck, { size:19, strokeWidth:1.8 })}<span>{label}</span>{id === 'actions' && openActions.length > 0 && <em>{openActions.length}</em>}</button>)}</div>)}</nav>
  <div className="ssc-sidebar-foot">{isAdmin && activeWorkspaceId === 'admin' && <button className="ssc-add-site" onClick={() => setModal({ kind: 'new-workspace' })}><span className="ssc-add-icon"><Plus size={17}/></span><span>Add workspace</span><ChevronRight size={17}/></button>}
  <div className="ssc-support-note"><ShieldCheck size={17}/><span>Site Safety Consultants<small>Local browser · Demo mode</small></span><button className="icon-button" aria-label="Help and support" onClick={() => window.alert('SSC demo help: select a workspace, register a project, then start an inspection. All records and files stay in this browser. Export reports and HXC JSON for backups. No shared server or invitation emails are connected.')}><CircleHelp size={15}/></button></div>
  <button className="ssc-user-row" onClick={() => go(activeWorkspaceId === 'admin' ? 'users' : can('team') ? 'team' : 'settings')}><span className="ssc-user-avatar">TT</span><span className="ssc-user-name"><strong>Tony Turner</strong><small>Administrator · Demo session</small></span><ChevronRight size={17}/></button></div></aside></>;
}

