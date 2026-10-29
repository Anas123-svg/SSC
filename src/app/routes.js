import { ADMIN_WORKSPACE } from '../data/workspaces.js';
import { MODULES, isAdministrator } from './moduleRegistry.js';
import { canAccessPage, PAGE_META, routeFor } from './navigation.js';
export function resolveRoute(hash, workspaces, savedId = 'admin', permissions = { role: 'Admin' }) {
  let parts;
  try { parts = hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean).map(decodeURIComponent); }
  catch { parts = ['invalid', 'route']; }
  let workspaceId = savedId, token, detailId, subview, legacy = false;
  if (parts[0] === 'admin') { workspaceId = 'admin'; token = parts[1]; detailId = parts[2]; subview = parts[3]; }
  else if (parts[0] === 'workspace') { workspaceId = parts[1]; token = parts[2]; detailId = parts[3]; subview = parts[4]; }
  else if (parts.length <= 1) { token = parts[0]; legacy = true; }
  else token = '__invalid__';
  let workspace = workspaceId === 'admin' ? ADMIN_WORKSPACE : workspaces.find(w => w.id === workspaceId && w.status !== 'Inactive');
  if (!workspace || (workspaceId === 'admin' && !isAdministrator(permissions))) {
    workspace = isAdministrator(permissions) ? ADMIN_WORKSPACE : workspaces.find(w => w.status !== 'Inactive' && (!permissions.workspaceIds || permissions.workspaceIds.includes(w.id)));
    return { workspaceId: workspace?.id || 'none', page: workspace ? 'overview' : 'not-found', redirect: workspace ? routeFor(workspace.id, 'overview') : null };
  }
  if (!isAdministrator(permissions) && permissions.workspaceIds && !permissions.workspaceIds.includes(workspace.id)) return { workspaceId: workspace.id, page: 'not-found' };
  const page = !token ? 'overview' : Object.keys(MODULES).find(id => MODULES[id].path === token) || token;
  // Old HXC routes open the new unified register; removed Risk Assessment URLs
  // also redirect safely without deleting historical risk records.
  if (['hxc', 'hxc-audits'].includes(token)) return { workspaceId: workspace.id, page: 'audits', redirect: routeFor(workspace.id, 'audits') };
  // Keep shared bookmarks functional after moving reports out of the inspection register.
  if (token === 'inspections' && detailId === 'insights') return { workspaceId: workspace.id, page: 'reports', redirect: routeFor(workspace.id, 'reports') };
  if (token === 'documents' || (token === 'inspections' && detailId === 'documents')) return { workspaceId: workspace.id, page: 'sites', redirect: routeFor(workspace.id, 'sites') };
  if (token === 'actions') return { workspaceId: workspace.id, page: 'audits', detailId: 'actions', redirect: routeFor(workspace.id, 'audits', 'actions') };
  if (token === 'templates' && workspace.id !== 'admin' && !canAccessPage(workspace, 'templates', permissions))
    return { workspaceId: workspace.id, page: 'audits', redirect: routeFor(workspace.id, 'audits') };
  if (['risks', 'Risk Assessments'].includes(token)) return { workspaceId: workspace.id, page: 'overview', redirect: routeFor(workspace.id, 'overview') };
  const validProjectSubviews = ['overview', 'inspections', 'actions', 'insights', 'reports', 'documents', 'edit'];
  if (!PAGE_META[page] || (detailId && !['sites', 'audits'].includes(page)) ||
    (subview && (page !== 'sites' || !detailId || !validProjectSubviews.includes(subview))) ||
    parts.length > (parts[0] === 'admin' ? (page === 'sites' ? 4 : page === 'audits' ? 3 : 2) : (page === 'sites' ? 5 : 4)))
    return { workspaceId: workspace.id, page: 'not-found' };
  if (!canAccessPage(workspace, page, permissions)) return { workspaceId: workspace.id, page: 'overview', redirect: routeFor(workspace.id, 'overview'), reason: 'That module is unavailable in this workspace.' };
  // Legacy bookmarks for the removed project corrective-actions tab return to the project overview.
  if (page === 'sites' && detailId && subview === 'actions') return { workspaceId: workspace.id, page, detailId, subview: 'overview', redirect: routeFor(workspace.id, 'sites', detailId) };
  return { workspaceId: workspace.id, page, detailId, subview, redirect: legacy || !token ? routeFor(workspace.id, page) : null };
}

