import { operational } from './inspections.js';

const reportCategories = new Set(['inspection reports', 'reports', 'report']);

/** Report-ready completed inspections and report files actually stored in the browser.
 * This is a read-only catalog, not a claim that PDFs were previously generated.
 */
export function buildReportCatalog({ inspections = [], documents = [], projects = [], workspaceId = 'admin', projectId = null }) {
  const projectById = new Map(projects.map(p => [p.id, p]));
  const inScope = item => (workspaceId === 'admin' || item.workspaceId === workspaceId) && (!projectId || item.projectId === projectId);
  const inspectionsAsReports = operational(inspections).filter(a => inScope(a) && a.status === 'Completed').map(a => ({
    id: `inspection-report:${a.id}`,
    inspectionId: a.id,
    workspaceId: a.workspaceId,
    projectId: a.projectId || '',
    project: projectById.get(a.projectId)?.name || a.projectName || 'No linked project',
    title: a.source === 'hxc' ? 'HXC site compliance audit' : a.type || 'Inspection report',
    reference: a.nativeId || a.id,
    date: a.date || '',
    kind: 'inspection',
    format: a.source === 'hxc' ? 'HXC audit' : 'Inspection record',
    file: null,
  }));
  const savedFiles = documents.filter(d => inScope(d) && reportCategories.has((d.category || '').toLowerCase().trim())).map(d => ({
    id: `document-report:${d.id}`,
    workspaceId: d.workspaceId,
    projectId: d.projectId || '',
    project: projectById.get(d.projectId)?.name || 'No linked project',
    title: d.name || 'Uploaded report',
    reference: d.reference || d.id,
    date: (d.updatedAt || d.date || '').slice(0, 10),
    kind: 'file',
    format: d.file?.data ? 'Uploaded file' : 'Report reference',
    file: d.file || null,
  }));
  return [...inspectionsAsReports, ...savedFiles].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
