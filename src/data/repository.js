import { auditsSeed, actionsSeed, teamSeed, sites } from './portalData.js';
import { countQuestions, getHxcSchema } from '../features/templates/hxcSchema.js';
import { createWorkspaceRecord, normalizeWorkspace, workspaceSeed, isVisibleWorkspace } from './workspaces.js';
export const DATABASE_KEY = 'ssc-workspace-db-v1';
export const id = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
export const today = () => new Date().toLocaleDateString('en-CA');
export const isOpen = a => !['Closed', 'Resolved'].includes(a.status);
export const isOverdue = a => isOpen(a) && !!a.due && a.due < today();
export const scopeRecords = (records, workspaceId) => workspaceId === 'admin' ? records : records.filter(r => r.workspaceId === workspaceId || r.workspaceIds?.includes(workspaceId));
const read = (storage, key, fallback) => { try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
export function migrateDatabase(storage) {
  const old = (key, fallback) => read(storage, 'harmonix-' + key, fallback);
  const rawWorkspaces = old('workspaces', workspaceSeed);
  const workspaces = (Array.isArray(rawWorkspaces) ? rawWorkspaces : workspaceSeed).map(normalizeWorkspace);
  // Preserve projects from the two legacy clients, rather than assigning them to another tenant.
  // Preserve demo records for compatibility, but present only Admin/Harmonix + user-created sites in UI.
  for (const [key, name] of [['stonebridge', 'Stonebridge Construction'], ['beacon', 'Beacon Projects']]) {
    if (!workspaces.some(w => w.id === key)) workspaces.push(normalizeWorkspace({ id: key, name, client: name, color: '#718096', migrated: true }));
  }

  const projects = sites.map(s => ({ ...s, projectId: s.id, reference: s.id, address: s.location, description: '', manager: '', clientId: workspaces.find(w => w.id === s.workspaceId)?.clientId }));
  const migrateRecords = (records, key) => (Array.isArray(records) ? records : []).map(r => ({ ...r, [key]: r.id, projectId: r.projectId || r.siteId || '', workspaceId: r.workspaceId || projects.find(p => p.id === (r.projectId || r.siteId))?.workspaceId || 'unassigned' }));
  const clients = workspaces.map(w => ({ id: w.clientId, name: w.client || w.name, contact: w.contact || '', email: w.email || '', phone: w.phone || '', address: w.address || '' }));
  return { version: 1, workspaces, projects, clients,
    audits: migrateRecords(old('audits', auditsSeed), 'inspectionId'),
    actions: migrateRecords(old('actions', actionsSeed), 'actionId'),
    users: old('team', teamSeed).map(u => ({ ...u, userId: u.id, role: u.role.includes('Administrator') ? 'Admin' : 'Inspector', workspaceIds: u.workspaceIds || ['harmonix'], status: u.status || 'Active' })),
    risks: [], schedule: [], documents: [],
    templates: [{ id: 'hxc', name: 'HXC compliance audit', category: 'Compliance', questions: 65, description: 'Editable HXC inspection checklist.', workspaceIds: workspaces.map(w => w.id), kind: 'hxc' }],
    prefs: old('prefs', { email: true, critical: true, weekly: false }),
  };
}
export function loadDatabase(storage) {
  const raw = storage.getItem(DATABASE_KEY);
  if (!raw) return migrateDatabase(storage);
  const db = JSON.parse(raw);
  if (db.version !== 1 || !['workspaces','projects','clients','audits','actions','users','risks','schedule','documents','templates'].every(k => Array.isArray(db[k]))) throw new Error('Saved workspace data is unreadable. Export or restore your browser data before continuing.');
  // Show only the HXC template; keep all saved inspection records unchanged.
  const hxc = db.templates.find(t => t.id === 'hxc') || { id: 'hxc', name: 'HXC compliance audit', kind: 'hxc', workspaceIds: db.workspaces.map(w => w.id) };
  return { ...db, templates: [{ ...hxc, id: 'hxc', name: 'HXC compliance audit', kind: 'hxc', questions: countQuestions(getHxcSchema(hxc)) }], workspaces: db.workspaces.map(normalizeWorkspace) };
}
export function saveDatabase(storage, db) { storage.setItem(DATABASE_KEY, JSON.stringify(db)); }
export function addWorkspace(db, values) {
  const basic = createWorkspaceRecord(values.name || '', values.client || '', db.workspaces);
  const existingClient = db.clients.find(c => c.id === values.clientId || c.name.toLowerCase() === basic.client.toLowerCase());
  const client = existingClient || { id: id('client'), name: basic.client, contact: values.contact || '', email: values.email || '', phone: values.phone || '', address: values.address || '' };
  const workspace = normalizeWorkspace({ ...values, ...basic, clientId: client.id, client: client.name, modules: values.modules });
  return { workspace, db: { ...db, workspaces: [...db.workspaces, workspace], clients: existingClient ? db.clients : [...db.clients, client], templates: db.templates } };
}
export function upsertRecord(db, collection, record, workspaceId) {
  const existing = db[collection].find(x => x.id === record.id);
  if (existing && workspaceId !== 'admin' && !(collection === 'workspaces' ? existing.id === workspaceId : scopeRecords([existing], workspaceId).length)) throw new Error('This record belongs to another workspace.');
  const item = { ...existing, ...record, id: existing?.id || id(collection), updatedAt: new Date().toISOString() };
  const identityKey = { projects: 'projectId', audits: 'inspectionId', actions: 'actionId', users: 'userId' }[collection];
  if (identityKey) item[identityKey] = item.id;
  if (!['clients','users','templates','workspaces'].includes(collection)) {
    item.workspaceId = workspaceId === 'admin' ? item.workspaceId : workspaceId;
    if (!db.workspaces.some(w => w.id === item.workspaceId)) throw new Error('Choose a workspace.');
    if (collection !== 'projects' && item.projectId) {
      if (!db.projects.some(p => p.id === item.projectId && p.workspaceId === item.workspaceId)) throw new Error('Choose a project in the selected workspace.');
      item.siteId = item.projectId;
    }
    if (collection === 'actions' && item.inspectionId && !db.audits.some(a => a.id === item.inspectionId && a.workspaceId === item.workspaceId && (!item.projectId || a.projectId === item.projectId))) throw new Error('The inspection must belong to the selected project and workspace.');
  }
  if (collection === 'workspaces') {
    if (!item.name?.trim()) throw new Error('Workspace name is required.');
    item.name = item.name.trim().replace(/\s+/g, ' ');
    if (item.name.toLowerCase() === 'admin' || db.workspaces.some(w => w.id !== item.id && w.name.toLowerCase() === item.name.toLowerCase())) throw new Error('A workspace with this name already exists.');
    Object.assign(item, normalizeWorkspace(item));
    item.client = db.clients.find(c => c.id === item.clientId)?.name || item.client;
  }
  if (collection === 'templates') {
    if (!item.name?.trim()) throw new Error('Template name is required.');
    const assigned = item.workspaceIds || [];
    if (!Array.isArray(assigned) || assigned.some(wid => !db.workspaces.some(w => w.id === wid))) throw new Error('Templates can only be assigned to existing workspaces.');
    item.workspaceIds = [...new Set(assigned)];
    if (item.id === 'hxc') Object.assign(item, { kind: 'hxc', name: 'HXC compliance audit', questions: countQuestions(getHxcSchema(item)) });
  }
  if (collection === 'users' && db.users.some(u => u.id !== item.id && u.email.toLowerCase() === item.email.toLowerCase())) throw new Error('A user with this email already exists.');
  if (collection === 'clients' && db.clients.some(c => c.id !== item.id && c.name.toLowerCase() === item.name.trim().toLowerCase())) throw new Error('A client with this name already exists.');
  if (collection === 'projects') {
    item.clientId = db.workspaces.find(w => w.id === item.workspaceId)?.clientId;
    if (item.start && item.end && item.end < item.start) throw new Error('Completion must be on or after the start date.');
  }
  if (collection === 'actions' && ['Resolved','Closed'].includes(item.status) && !item.evidence?.trim()) throw new Error('Add completion evidence before resolving or closing the action.');
  if (collection === 'audits' && item.status === 'Completed' && !(item.templateId === 'hxc' && Array.isArray(item.schemaSnapshot)) && (item.score === '' || item.score == null || !Number.isFinite(Number(item.score)) || Number(item.score) < 0 || Number(item.score) > 100)) throw new Error('Completed inspections require a score from 0 to 100.');
  if (collection === 'users' && (item.projectIds || []).some(pid => !db.projects.some(p => p.id === pid && item.workspaceIds?.includes(p.workspaceId)))) throw new Error('Project assignments must belong to assigned workspaces.');
  const next = { ...db, [collection]: existing ? db[collection].map(x => x.id === item.id ? item : x) : [...db[collection], item] };
  if (collection === 'clients') next.workspaces = db.workspaces.map(w => w.clientId === item.id ? { ...w, client: item.name } : w);
  return next;
}
export function metrics(audits, actions) {
  const completed = audits.filter(a => a.status === 'Completed');
  const scored = completed.filter(a => a.score != null && a.score !== '' && Number.isFinite(Number(a.score)));
  return { total: audits.length, completed: completed.length, pending: audits.length - completed.length, open: actions.filter(isOpen).length, overdue: actions.filter(isOverdue).length, compliance: scored.length ? Math.round(scored.reduce((sum, a) => sum + Number(a.score), 0) / scored.length) : null };
}
export function trendData(audits) {
  const buckets = new Map();
  for (const a of audits) {
    if (!a.date) continue;
    const month = a.date.slice(0, 7), bucket = buckets.get(month) || { month, audits: 0, scores: [] };
    bucket.audits++;
    if (a.status === 'Completed' && a.score != null && a.score !== '') bucket.scores.push(Number(a.score));
    buckets.set(month, bucket);
  }
  return [...buckets.values()].sort((a,b) => a.month.localeCompare(b.month)).map(b => ({ ...b, compliance: b.scores.length ? Math.round(b.scores.reduce((a,c) => a+c,0)/b.scores.length) : null }));
}

