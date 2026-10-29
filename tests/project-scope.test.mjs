import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectRecords } from '../src/data/projectScope.js';
import { routeFor } from '../src/app/navigation.js';
import { resolveRoute } from '../src/app/routes.js';
import { workspaceSeed } from '../src/data/workspaces.js';

test('only exact project and owning workspace contribute to reports and documents', () => {
 const project={id:'P1',workspaceId:'harmonix'};
 const records=[{id:'I1',projectId:'P1',workspaceId:'harmonix'},
   {id:'I2',projectId:'P1',workspaceId:'northfield'},
   {id:'I3',projectId:'P2',workspaceId:'harmonix'},
   {id:'I4',projectId:'',workspaceId:'harmonix'}];
 assert.deepEqual(projectRecords(records,project).map(x=>x.id),['I1']);
 assert.deepEqual(projectRecords([],project),[]);
});
test('project reports and documents routes retain project identity, and invalid nested routes fail closed',()=>{
 for(const section of ['insights','reports','documents','actions']) {
  const route=resolveRoute(routeFor('northfield','sites','PROJECT/2',section),workspaceSeed);
  assert.equal(route.page,'sites');assert.equal(route.detailId,'PROJECT/2');assert.equal(route.subview,section);
 }
 assert.equal(resolveRoute('#/workspace/harmonix/inspections/ref/extra',workspaceSeed).page,'not-found');
 assert.equal(resolveRoute('#/workspace/harmonix/reports/extra',workspaceSeed).page,'not-found');
});
