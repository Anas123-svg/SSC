import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { MODULES, DEFAULT_MODULES, normalizeModules } from '../src/app/moduleRegistry.js';
import { canAccessPage, getNavigationForWorkspace, routeFor } from '../src/app/navigation.js';
import { resolveRoute } from '../src/app/routes.js';
import { ADMIN_WORKSPACE, workspaceSeed } from '../src/data/workspaces.js';
import { addWorkspace, migrateDatabase, upsertRecord } from '../src/data/repository.js';
const storage = {getItem:()=>null};
const ids = w => getNavigationForWorkspace(w).flatMap(g=>g.items.map(i=>i.id));
test('client sidebar has standalone Reports and Templates without redundant documents/actions',()=>{
 for (const w of workspaceSeed) {
  const active=ids(w);
  assert.ok(active.includes('audits') && active.includes('templates') && active.includes('reports'));
  assert.ok(!active.includes('documents') && active.includes('analytics') && !active.includes('actions'));
  assert.equal(canAccessPage(w,'documents'),false);
  assert.equal(canAccessPage(w,'reports'),true);
  assert.equal(canAccessPage(w,'actions'),false);
 }
 for (const w of [ADMIN_WORKSPACE, ...workspaceSeed]) {
  const reportItems = getNavigationForWorkspace(w).flatMap(g => g.items).filter(i => i.id === 'reports');
  assert.equal(reportItems.length, 1);
  assert.equal(reportItems[0].label, 'Reports');
 }
 assert.ok(ids(ADMIN_WORKSPACE).includes('reports'));
 assert.ok(!ids(ADMIN_WORKSPACE).includes('actions'));
 assert.equal(ids(ADMIN_WORKSPACE).filter(x=>x==='reports').length,1);
});
test('project sections are deep-linkable and former inspection links redirect to their new homes',()=>{
 for (const section of ['overview','inspections','actions','insights','reports','documents']) {
   const link=routeFor('harmonix','sites','S-1',section);
   const route=resolveRoute(link,workspaceSeed);
   assert.equal(route.page,'sites');assert.equal(route.detailId,'S-1');assert.equal(route.subview,section);assert.equal(route.redirect,null);
 }
 const bad=resolveRoute('#/workspace/harmonix/projects/S-1/invalid',workspaceSeed);
 assert.equal(bad.page,'not-found');
 assert.equal(resolveRoute('#/workspace/harmonix/analytics',workspaceSeed).page,'analytics');
 assert.equal(resolveRoute('#/workspace/harmonix/inspections/insights',workspaceSeed).redirect,routeFor('harmonix','reports'));
 assert.equal(resolveRoute('#/workspace/harmonix/inspections/documents',workspaceSeed).redirect,routeFor('harmonix','sites'));
 assert.equal(resolveRoute('#/workspace/harmonix/actions',workspaceSeed).redirect,routeFor('harmonix','audits','actions'));
 assert.equal(resolveRoute('#/admin/actions',workspaceSeed).redirect,routeFor('admin','audits','actions'));
 assert.equal(resolveRoute('#/admin/reports',workspaceSeed).page,'reports');
});
test('the Admin-only template assignment controls workspace access',()=>{
 const db=migrateDatabase(storage);
 const {db:created,workspace}=addWorkspace(db,{name:'Greenfield Site'});
 assert.equal(created.templates.filter(t=>t.workspaceIds.includes(workspace.id)).length,0);
 const result=upsertRecord(created,'templates',{...created.templates[0],workspaceIds:[workspace.id]},'admin');
 assert.equal(result.templates.filter(t=>t.workspaceIds.includes(workspace.id)).length,1);
 assert.throws(()=>upsertRecord(result,'templates',{...result.templates[0],workspaceIds:['missing']},'admin'),/existing workspaces/);
 assert.equal(normalizeModules(['reports','documents','analytics','hxc']).includes('audits'),true);
 assert.ok(DEFAULT_MODULES.includes('templates'));
 assert.ok(DEFAULT_MODULES.includes('reports'));
});
test('inspection register does not contain Documents, Reports or Assigned Templates navigation',()=>{
 const inspect=readFileSync(new URL('../src/pages/InspectionsPage.jsx',import.meta.url),'utf8');
 const assigned=readFileSync(new URL('../src/pages/AssignedTemplatesPage.jsx',import.meta.url),'utf8');
 const project=readFileSync(new URL('../src/pages/ProjectDetailPage.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(inspect,/<ReportingPage embedded\/>/);
 assert.doesNotMatch(inspect,/<RecordsPage embeddedPage="documents"\/>/);
 assert.doesNotMatch(inspect,/inspection-templates-link/);
 assert.match(inspect,/RecordsPage embeddedPage="actions"/);
 assert.match(assigned,/workspaceIds/);
 assert.match(assigned,/new-template-/);
 assert.match(project,/ReportsPage projectId=/);
 assert.match(project,/project-section-nav/);
});
