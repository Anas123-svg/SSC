/**
 * Brand assets sourced from SSC's supplied reference materials.
 * The Harmonix wordmark is extracted verbatim from
 * reference/HXC_Site_Compliance_Audit_Final Rev 0122.docx (word/media/image1.png).
 * Existing uploaded workspace logos take precedence over these built-in assets.
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
