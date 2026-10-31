import { DEFAULT_MODULES, normalizeModules } from '../app/moduleRegistry.js';
/** Top-level client/site workspaces. Admin is a portfolio mode, not a client. */
export const ADMIN_WORKSPACE = { id: 'admin', type: 'admin', name: 'Admin', client: null, initials: 'AD', color: '#ee3861' };

export const workspaceSeed = [
  { id: 'harmonix', name: 'Harmonix', client: 'Harmonix Developments', initials: 'HX', color: '#B6D552' },
  { id: 'northfield', name: 'Northfield Group', client: 'Northfield Group', initials: 'NG', color: '#00988f' },
  { id: 'meridian', name: 'Meridian Contractors', client: 'Meridian Contractors', initials: 'MC', color: '#9871d5' },
].map(w => ({ ...w, type: 'client', status: 'Active', clientId: `client-${w.id}`, modules: DEFAULT_MODULES.filter(id => w.id === 'harmonix' || !(w.id === 'northfield' ? ['schedule', 'team', 'analytics'] : ['schedule', 'documents', 'analytics']).includes(id)) }));

export const workspaceInitials = name => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();

export function createWorkspaceRecord(name, client, current = []) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanClient = client.trim().replace(/\s+/g, ' ') || cleanName;
  if (!cleanName) throw new Error('Enter a site name.');
  if (current.some(w => w.name.toLowerCase() === cleanName.toLowerCase()) || cleanName.toLowerCase() === 'admin') {
    throw new Error('A site with this name already exists.');
  }
  return {
    id: `site-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    client: cleanClient,
    initials: workspaceInitials(cleanName),
    color: '#3c92a3',
  };
}

export function scopeSiteIds(projectSites, workspaceId, workspaces) {
  if (workspaceId === 'admin') return new Set(projectSites.map(site => site.id));
  if (!workspaces.some(w => w.id === workspaceId)) return new Set();
  return new Set(projectSites.filter(site => site.workspaceId === workspaceId).map(site => site.id));
}

export function normalizeWorkspace(w) { return { ...w, type: 'client', status: w.status || 'Active', clientId: w.clientId || `client-${w.id}`, modules: normalizeModules(w.modules || workspaceSeed.find(x => x.id === w.id)?.modules), initials: workspaceInitials(w.name) }; }

/** Retired showcase workspaces remain in old browser backups, never in the active workspace selector. */
export const RETIRED_DEMO_WORKSPACES = new Set(['northfield','meridian','stonebridge','beacon']);
export const isVisibleWorkspace = workspace => !RETIRED_DEMO_WORKSPACES.has(workspace.id);
