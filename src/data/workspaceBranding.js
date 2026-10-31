/**
 * Built-in workspace logo assets. Harmonix uses the user's supplied
 * lime wordmark with its background removed (transparent PNG, V6).
 * Workspace-specific uploaded logos take precedence over these defaults.
 */
export const WORKSPACE_BRAND_ASSETS = Object.freeze({
  harmonix: '/harmonix-logo.png',
  admin: '/ssc-logo-for-dark-sidebar.png',
});

export function getWorkspaceLogo(workspace) {
  if (!workspace) return null;
  return workspace.logo?.data || WORKSPACE_BRAND_ASSETS[workspace.id] || null;
}

export function workspaceHasBrandLogo(workspace) {
  return Boolean(getWorkspaceLogo(workspace));
}
