/**
 * Unified inspection read model for the existing SSC register and the native HXC
 * checklist editor. HXC's evidence-rich documents stay in their original browser
 * storage to protect pre-existing photos, sign-offs and scoring rules. The UI
 * treats both as one inspection register and one action register.
 *
 * Identity is stable and source-qualified: hxc:<workspaceId>:<nativeAuditId>.
 * No HXC records or actions are copied into the generic database, preventing
 * divergent duplicates. This adapter can be replaced by a backend API later.
 */
import { parseSaved, computed } from '../features/hxc/hxcModel.js';
export const hxcInspectionId = (workspaceId, nativeId) => `hxc:${workspaceId}:${nativeId}`;
export const hxcActionId = (workspaceId, nativeId, actionId) => `hxc-action:${workspaceId}:${nativeId}:${actionId}`;
export function projectHxcInspection(audit, workspaceId) {
  const score = audit.state === 'Completed' ? computed(audit).score : null;
  return {
    id: hxcInspectionId(workspaceId, audit.id), nativeId: audit.id,
    source: 'hxc', templateId: 'hxc', templateName: 'HXC Site Compliance Audit',
    workspaceId, projectId: audit.projectId || '', type: 'HXC Compliance',
    subType: audit.meta?.type || '', projectName: audit.meta?.projectName || '',
    date: audit.meta?.assessmentDate || '', inspector: audit.meta?.assessor || '',
    status: audit.state || 'Draft', score, findings: computed(audit).issues,
    updatedAt: audit.updatedAt || audit.createdAt || '', demo: !!audit.demo,
  };
}
export function projectHxcAction(action, audit, workspaceId) {
  return {
    id: hxcActionId(workspaceId, audit.id, action.id), nativeId: action.id,
    inspectionId: hxcInspectionId(workspaceId, audit.id),
    workspaceId, projectId: audit.projectId || '', source: 'hxc',
    title: action.requiredAction || action.finding || 'HXC corrective action',
    finding: action.finding || '', priority: action.priority || 'Medium',
    assigned: action.owner || '', due: action.targetDate || '',
    status: action.status || 'Open', evidence: action.verifiedBy || '',
    itemId: action.itemId, demo: !!audit.demo,
  };
}
export const workspaceIdsFor = (db, workspaceId) => workspaceId === 'admin'
  ? ['admin', ...db.workspaces.map(w => w.id)] : [workspaceId];
export function listInspections(db, workspaceId, readHxc = parseSaved) {
  const workspaces = new Set(workspaceIdsFor(db, workspaceId));
  const register = db.audits.filter(a => workspaces.has(a.workspaceId))
    .map(a => ({ ...a, source: 'register', nativeId: a.id, demo: !!a.demo }));
  const hxc = [...workspaces].flatMap(wid => readHxc(wid).map(a => projectHxcInspection(a, wid)));
  const registered = new Set(register.map(a => a.id));
  return [...register, ...hxc.filter(a => !registered.has(a.id))];
}
export function listCorrectiveActions(db, workspaceId, readHxc = parseSaved) {
  const workspaces = new Set(workspaceIdsFor(db, workspaceId));
  const register = db.actions.filter(a => workspaces.has(a.workspaceId))
    .map(a => ({ ...a, source: 'register', nativeId: a.id, demo: !!a.demo }));
  const hxc = [...workspaces].flatMap(wid => readHxc(wid).flatMap(a =>
    (a.actions || []).map(action => projectHxcAction(action, a, wid))));
  const registered = new Set(register.map(a => a.id));
  return [...register, ...hxc.filter(a => !registered.has(a.id))];
}
// Sample HXC documents are accessible and visibly labelled in the register,
// but they must not inflate real operational KPIs or published reports.
export const operational = records => records.filter(r => !r.demo);
