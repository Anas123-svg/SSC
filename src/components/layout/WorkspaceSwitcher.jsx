import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, LayoutGrid, Plus } from 'lucide-react';
import { ADMIN_WORKSPACE, isVisibleWorkspace } from '../../data/workspaces.js';
import { getWorkspaceLogo } from '../../data/workspaceBranding.js';
import { usePortal } from '../../app/PortalContext.jsx';
export default function WorkspaceSwitcher() {
  const { activeWorkspace: active, activeWorkspaceId, workspaces, isAdmin, permissions, setActiveWorkspaceId, setModal } = usePortal();
  const [open,setOpen] = useState(false), ref = useRef(null), trigger = useRef(null);
  const choices = [...(isAdmin ? [ADMIN_WORKSPACE] : []), ...workspaces.filter(w => isVisibleWorkspace(w) && w.status !== 'Inactive' && (isAdmin || !permissions.workspaceIds || permissions.workspaceIds.includes(w.id)))];
  useEffect(() => {
    if (!open) return;
    const dismiss = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown',dismiss);
    return () => document.removeEventListener('pointerdown',dismiss);
  }, [open]);
  const keyDown = e => {
    if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
      e.preventDefault();
      if (!open) { setOpen(true); setTimeout(() => ref.current?.querySelector('[role="menuitemradio"]')?.focus(),0); return; }
      const items = [...ref.current.querySelectorAll('[role^="menuitem"]')], current = items.indexOf(document.activeElement);
      items[e.key === 'Home' ? 0 : e.key === 'End' ? items.length-1 : (current + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }
  };
  const avatar = w => {
    const logo = getWorkspaceLogo(w);
    return logo ? <img src={logo} alt="" loading="eager"/> : w.id === 'admin' ? <LayoutGrid size={19} aria-hidden="true"/> : w.initials;
  };
  const avatarClass = w => getWorkspaceLogo(w) ? ' ssc-logo-avatar' + (w.id !== 'admin' ? ' ssc-client-logo' : '') : '';
  const workspaceDetails = w => w.id === 'admin' ? 'All workspaces' : (w.client || 'Client workspace');
  return <div className="ssc-switcher-wrap" ref={ref} onKeyDown={keyDown} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <span className="ssc-switcher-label">CURRENT WORKSPACE</span>
    <button ref={trigger} type="button" className={'ssc-switcher-trigger' + (open ? ' is-active' : '')} aria-label={`Switch workspace. Currently ${active.name}`} aria-haspopup="menu" aria-expanded={open} aria-controls="workspace-options" onClick={() => setOpen(!open)}>
      <span className={'ssc-workspace-avatar' + avatarClass(active)}>{avatar(active)}</span>
      <span className="ssc-switcher-info"><strong>{active.name}</strong><small title={workspaceDetails(active)}>{active.id === 'admin' ? 'Portfolio administration' : 'Client workspace'}</small></span>
      <ChevronDown className={'ssc-switch-chevron' + (open ? ' up' : '')} size={16} aria-hidden="true"/>
    </button>
    {open && <div className="ssc-switcher-menu" id="workspace-options" role="menu" aria-label="Workspaces">
      <div className="ssc-menu-heading">Switch workspace <span>{choices.length} available</span></div>
      {choices.map(w => <button type="button" role="menuitemradio" aria-checked={w.id === activeWorkspaceId} key={w.id} className={'ssc-option ' + (w.id === activeWorkspaceId ? 'is-selected' : '')} onClick={() => { setActiveWorkspaceId(w.id); setOpen(false); trigger.current?.focus(); }}>
        <span className={'ssc-option-avatar' + avatarClass(w)}>{avatar(w)}</span>
        <span className="ssc-option-copy"><strong>{w.name}</strong><small>{w.id === 'admin' ? 'Portfolio administration' : 'Client workspace'}</small></span>
        {w.id === activeWorkspaceId && <Check className="ssc-option-check" size={16} aria-hidden="true"/>}
      </button>)}
      {isAdmin && <div className="ssc-menu-bottom"><button role="menuitem" onClick={() => { setOpen(false); setModal({ kind: 'new-workspace' }); }}><Plus size={16}/> Add New Site</button></div>}
    </div>}
  </div>;
}

