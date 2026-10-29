import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBlank, computed } from '../src/features/hxc/hxcModel.js';
import { hxcTemplate } from '../src/features/hxc/hxcTemplate.js';
import { listInspections, listCorrectiveActions, hxcInspectionId, operational } from '../src/data/inspections.js';
import { migrateDatabase, metrics } from '../src/data/repository.js';
import { MODULES, normalizeModules } from '../src/app/moduleRegistry.js';
import { getNavigationForWorkspace } from '../src/app/navigation.js';
import { resolveRoute } from '../src/app/routes.js';
import { workspaceSeed } from '../src/data/workspaces.js';
const storage = { getItem: () => null };
const mockAudit = (workspaceId, suffix = '001', status = 'Completed') => {
  const a = createBlank();
  a.id = `HXC-TEST-${suffix}`;
  a.workspaceId = workspaceId;
  a.state = status;
  a.projectId = 'S-1';
  a.meta = { ...a.meta, projectName: 'Test construction site', assessmentDate: '2026-09-10', assessor: 'Inspector One' };
  a.sections = Object.fromEntries(hxcTemplate.map(sec => [sec.id, { score: 8, na: false }]));
  a.actions = [{ id: 'FIX-1', itemId: '1.1', requiredAction: 'Correct fall protection', priority: 'High', owner: 'Inspector One', targetDate: '2026-12-12', status: 'Open' }];
  return a;
};
test('legacy HXC module is folded into inspections and removed risks remain inaccessible', () => {
  assert.equal(MODULES.hxc, undefined);
  assert.equal(MODULES.risks, undefined);
  assert.ok(normalizeModules(['hxc', 'risks']).includes('audits'));
  assert.ok(!normalizeModules(['hxc', 'risks']).includes('risks'));
  for (const workspace of workspaceSeed) {
    const ids = getNavigationForWorkspace(workspace).flatMap(group => group.items.map(item => item.id));
    assert.ok(ids.includes('audits'));
    assert.ok(!ids.includes('hxc') && !ids.includes('risks'));
  }
});
test('native HXC assessment uses original scoring and appears in the same register', () => {
  const db = migrateDatabase(storage);
  const hxc = mockAudit('harmonix');
  assert.equal(computed(hxc).score, 80);
  const results = listInspections(db, 'harmonix', key => key === 'harmonix' ? [hxc] : []);
  assert.ok(results.some(a => a.source === 'register'));
  const recorded = results.find(a => a.source === 'hxc');
  assert.equal(recorded.id, hxcInspectionId('harmonix', hxc.id));
  assert.equal(recorded.score, 80);
  assert.equal(recorded.projectId, 'S-1');
  assert.equal(recorded.type, 'HXC Compliance');
});
test('draft HXC inspections have no final compliance score', () => {
  const db = migrateDatabase(storage);
  const draft = mockAudit('harmonix','DRAFT','Draft');
  const result = listInspections(db,'harmonix',key => key === 'harmonix' ? [draft] : []).find(a => a.source === 'hxc');
  assert.equal(result.score, null);
  assert.equal(result.status, 'Draft');
});
test('HXC checklist findings appear in the same corrective action register without copying database records', () => {
  const db = migrateDatabase(storage);
  const audit = mockAudit('harmonix');
  const before = db.actions.length;
  const actions = listCorrectiveActions(db, 'harmonix', key => key === 'harmonix' ? [audit] : []);
  const hxc = actions.find(a => a.source === 'hxc');
  assert.ok(hxc);
  assert.equal(hxc.inspectionId, hxcInspectionId('harmonix', audit.id));
  assert.equal(hxc.title, 'Correct fall protection');
  assert.equal(hxc.priority, 'High');
  assert.equal(db.actions.length, before);
});
test('client workspaces cannot read HXC audits belonging to another client', () => {
  const db = migrateDatabase(storage);
  const read = wid => wid === 'harmonix' ? [mockAudit('harmonix')] : wid === 'meridian' ? [mockAudit('meridian','002')] : [];
  assert.equal(listInspections(db,'northfield',read).filter(a => a.source === 'hxc').length,0);
  assert.deepEqual(listInspections(db,'harmonix',read).filter(a => a.source === 'hxc').map(a => a.workspaceId),['harmonix']);
  assert.equal(listInspections(db,'admin',read).filter(a => a.source === 'hxc').length,2);
  assert.equal(listCorrectiveActions(db,'admin',read).filter(a => a.source === 'hxc').length,2);
});
test('fictional HXC samples remain available but do not affect compliance KPI calculations', () => {
  const db = migrateDatabase(storage);
  const sample = { ...mockAudit('harmonix'), demo: true };
  const items = listInspections(db,'harmonix',wid => wid === 'harmonix' ? [sample] : []);
  assert.ok(items.some(i => i.demo));
  assert.equal(operational(items).some(i => i.demo),false);
  const actual = metrics(operational(items),[]);
  const all = metrics(items,[]);
  assert.equal(all.total, actual.total + 1);
});
test('deep links to inspections work and prior HXC/risk paths redirect safely', () => {
  const ws = workspaceSeed;
  const link = '#/workspace/harmonix/inspections/hxc%3Aharmonix%3AHXC-TEST-001';
  assert.equal(resolveRoute(link,ws).detailId, 'hxc:harmonix:HXC-TEST-001');
  assert.equal(resolveRoute('#/workspace/harmonix/hxc-audits',ws).redirect,'#/workspace/harmonix/inspections');
  assert.equal(resolveRoute('#/workspace/harmonix/risks',ws).redirect,'#/workspace/harmonix/dashboard');
});
