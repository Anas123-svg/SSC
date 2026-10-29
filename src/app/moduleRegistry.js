// Workspace modules are sidebar destinations, not individual reports or file views.
// Reports has its own destination; documents and corrective actions live in context-specific views.
export const MODULES = {
  overview: { label: 'Dashboard', path: 'dashboard', required: true },
  sites: { label: 'Projects & Locations', path: 'projects', required: true },
  audits: { label: 'Inspections', path: 'inspections', required: true },
  templates: { label: 'Templates', path: 'templates', required: true },
  schedule: { label: 'Inspection Schedule', path: 'schedule' },
  team: { label: 'Team', path: 'team' },
  settings: { label: 'Settings', path: 'settings', required: true },
  reports: { label: 'Reports', path: 'reports', required: true },
  analytics: { label: 'Analytics', path: 'analytics', required: true },
};
export const DEFAULT_MODULES = Object.keys(MODULES).filter(id => !MODULES[id].adminOnly);
// Preserve saved records and old settings, but hide retired sidebar destinations.
// Pre-existing HXC modules map onto the unified inspections feature.
export const normalizeModules = modules => {
  const selected = (modules || DEFAULT_MODULES).map(id => id === 'hxc' ? 'audits' : id);
  return [...new Set([...DEFAULT_MODULES.filter(id => MODULES[id].required), ...selected.filter(id => MODULES[id] && !MODULES[id].adminOnly)])];
};
export const isAdministrator = permissions => ['Admin', 'Super Admin'].includes(permissions?.role);
