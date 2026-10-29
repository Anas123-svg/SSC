import { MODULES, normalizeModules, isAdministrator } from './moduleRegistry.js';
export const PAGE_META = {
  overview: { title: 'Dashboard', description: 'Safety activity and performance from saved inspections.' },
  sites: { title: 'Projects & Locations', description: 'Register and manage physical construction projects.' },
  audits: { title: 'Inspections', description: 'Manage inspections, HXC checklists, and their findings.' },
  templates: { title: 'Templates', description: 'Inspection frameworks assigned by your administrator.' },
  actions: { title: 'Corrective Actions', description: 'Manage inspection findings and HXC checklist actions.' },
  schedule: { title: 'Inspection Schedule', description: 'Plan inspections and assign inspectors.' },
  team: { title: 'Team', description: 'People assigned to this workspace and its projects.' },
  reports: { title: 'Reports', description: 'Completed inspection reports and saved report documents.' },
  analytics: { title: 'Analytics', description: 'Inspection performance and trends by workspace or project.' },
  settings: { title: 'Settings', description: 'Branding and workspace preferences.' },
  workspaces: { title: 'Sites & Workspaces', description: 'Manage client workspaces, modules and linked projects.' },
  clients: { title: 'Clients', description: 'Company contacts linked to workspaces.' },
  users: { title: 'Users & Access', description: 'Browser-local member records and simulated permissions.' },
  compliance: { title: 'Compliance Management', description: 'Review recorded performance and outstanding findings.' },
  notifications: { title: 'Notifications', description: 'Outstanding and overdue findings across your portfolio.' },
  'not-found': { title: 'Page not found', description: 'This route does not identify an available page.' },
};
const icons = { overview: 'LayoutDashboard', sites: 'Building2', audits: 'ClipboardCheck', templates: 'FileText', actions: 'ShieldAlert', schedule: 'CalendarDays', team: 'UsersRound', reports: 'FileBarChart2', analytics: 'BarChart3', settings: 'Settings2', workspaces: 'Building2', clients: 'Building2', users: 'UsersRound', compliance: 'ShieldAlert', notifications: 'Bell' };
const clientGroups = [['OVERVIEW', ['overview', 'sites']], ['SAFETY & COMPLIANCE', ['audits', 'templates']], ['OPERATIONS', ['schedule', 'team']], ['REPORTING', ['reports', 'analytics']], ['WORKSPACE', ['settings']]];
const adminGroups = [['ADMIN', ['overview', 'workspaces', 'users', 'templates', 'settings']]];
const adminLabels = { overview: 'Dashboard', workspaces: 'Workspaces', users: 'Users', templates: 'Templates', settings: 'Settings' }; 
export const routeFor = (workspaceId, page, detailId, subview) => (workspaceId === 'admin' ? '#/admin' : '#/workspace/' + encodeURIComponent(workspaceId)) + '/' + (MODULES[page]?.path || page) + (detailId ? '/' + encodeURIComponent(detailId) : '') + (page === 'sites' && detailId && subview ? '/' + encodeURIComponent(subview) : '');
export function getNavigationForWorkspace(workspace, permissions = { role: 'Admin' }) {
  const admin = workspace.type === 'admin' || workspace.id === 'admin';
  if (admin && !isAdministrator(permissions)) return [];
  const modules = normalizeModules(workspace.modules);
  return (admin ? adminGroups : clientGroups).map(([label, ids]) => ({ label, items: ids.filter(id => admin || modules.includes(id)).map(id => ({ id, label: admin && adminLabels[id] || PAGE_META[id].title, icon: icons[id], route: routeFor(workspace.id, id), group: label, workspaceType: admin ? 'admin' : 'client', requiredModule: admin ? null : id, permission: admin ? 'admin' : null })) })).filter(group => group.items.length);
}
export const canAccessPage = (workspace, page, permissions) => (workspace.id === 'admin' && page === 'sites' && isAdministrator(permissions)) || getNavigationForWorkspace(workspace, permissions).some(g => g.items.some(i => i.id === page));
export const SEARCHABLE_PAGES = new Set(Object.keys(PAGE_META));
