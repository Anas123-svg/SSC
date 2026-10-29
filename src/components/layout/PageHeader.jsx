import React from 'react';
import { Plus } from 'lucide-react';
import { PAGE_META } from '../../app/navigation.js';
import { usePortal } from '../../app/PortalContext.jsx';
export default function PageHeader() {
  const { page, detailId, activeWorkspaceId, activeWorkspace, setModal, isAdmin } = usePortal();
  const config = PAGE_META[page];
  // Client dashboards already provide their own clean introduction and actions.
  // Avoid rendering a duplicate workspace title/description above the dashboard.
  if ((activeWorkspaceId === 'admin' && ['overview','workspaces','users','templates','settings'].includes(page)) || (page === 'overview' && activeWorkspaceId !== 'admin') || ['sites','team','reports','settings','analytics','audits'].includes(page)) return null;
  const subheading = page === 'audits' && detailId === 'actions' ? 'Inspection findings & corrective actions' : null;
  return <div className="page-title"><div><h1>{page === 'overview' ? 'Portfolio dashboard' : subheading || (page === 'templates' && activeWorkspaceId === 'admin' ? 'Manage inspection templates' : config.title)}</h1><p>{page === 'templates' && activeWorkspaceId === 'admin' ? 'Create inspection templates and assign them to client workspaces.' : config.description}</p></div><div className="page-cta"><span className="prototype-label">BROWSER-LOCAL DEMO</span>{isAdmin && activeWorkspaceId === 'admin' && page === 'overview' && <button className="btn primary" onClick={() => setModal({ kind: 'new-workspace' })}><Plus size={17}/>Add New Site</button>}</div></div>;
}

