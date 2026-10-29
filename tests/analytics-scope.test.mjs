import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsForScope, analyticsWindow } from '../src/data/analytics.js';
import { getNavigationForWorkspace } from '../src/app/navigation.js';
import { ADMIN_WORKSPACE, isVisibleWorkspace, workspaceSeed } from '../src/data/workspaces.js';
import { getWorkspaceLogo } from '../src/data/workspaceBranding.js';
import { readFileSync } from 'node:fs';
const ids = workspace => getNavigationForWorkspace(workspace).flatMap(g=>g.items.map(x=>x.id));
const source = [
  { id:'a',projectId:'p1',date:'2026-10-01',status:'Completed',score:80 },
  { id:'b',projectId:'p1',date:'2026-10-10',status:'Completed',score:100 },
  { id:'c',projectId:'p2',date:'2026-09-10',status:'Draft',score:'' },
  { id:'demo',projectId:'p1',date:'2026-10-12',status:'Completed',score:0,demo:true },
];
const findings = [{id:'f1',projectId:'p1',priority:'High',due:'2026-10-12',status:'Open'}, {id:'f2',projectId:'p2',priority:'Low',due:'2026-09-14',status:'Closed'}];
const projects = [{id:'p1',name:'One',status:'Active'},{id:'p2',name:'Two',status:'Active'}];
test('analytics computes genuine completed scores and project comparisons without demo data',()=>{
 const data=analyticsForScope(source,findings,projects, {start:'2026-09-01',end:'2026-10-31'});
 assert.equal(data.metrics.total,3);
 assert.equal(data.metrics.compliance,90);
 assert.equal(data.metrics.completed,2);
 assert.equal(data.comparison.find(p=>p.id==='p1').inspections,2);
 assert.equal(data.trend.find(m=>m.month==='2026-10').completed,2);
});
test('analytics project filter excludes another project from all charts and metrics',()=>{
 const data=analyticsForScope(source,findings,projects,{projectId:'p1'});
 assert.equal(data.metrics.total,2);
 assert.equal(data.metrics.open,1);
 assert.equal(data.comparison.length,1);
 assert.deepEqual(data.statuses.map(s=>s.name),['Completed']);
});
test('analytics time window bounds and empty periods display no fabricated data',()=>{
 const window=analyticsWindow(3,'2026-10-29');
 assert.equal(window.end,'2026-10-29');
 const data=analyticsForScope(source,findings,projects,{start:'2025-01-01',end:'2025-02-01'});
 assert.equal(data.metrics.total,0);assert.equal(data.trend.length,0);assert.equal(data.metrics.compliance,null);
});
test('Admin and Harmonix have Analytics, retired showcase sites are hidden, Admin uses SSC asset',()=>{
 assert.ok(ids(ADMIN_WORKSPACE).includes('analytics'));
 assert.ok(ids(workspaceSeed[0]).includes('analytics'));
 assert.equal(getWorkspaceLogo({id:'admin'}),'/ssc-logo-for-dark-sidebar.png');
 assert.ok(!isVisibleWorkspace({id:'northfield'}));
 assert.ok(!isVisibleWorkspace({id:'meridian'}));
 assert.ok(isVisibleWorkspace({id:'site-user-created'}));
});
test('inspection register no longer renders top-level switcher tabs',()=>{
 const jsx=readFileSync(new URL('../src/pages/InspectionsPage.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(jsx,/inspection-subnav/);
 assert.doesNotMatch(jsx,/Findings & corrective actions/);
});
