import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getNavigationForWorkspace, canAccessPage, routeFor } from '../src/app/navigation.js';
import { resolveRoute } from '../src/app/routes.js';
import { ADMIN_WORKSPACE, workspaceSeed, normalizeWorkspace } from '../src/data/workspaces.js';
import { addWorkspace, loadDatabase, saveDatabase, migrateDatabase, upsertRecord, scopeRecords, metrics, trendData, DATABASE_KEY } from '../src/data/repository.js';
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};};
const ids=w=>getNavigationForWorkspace(w).flatMap(g=>g.items.map(i=>i.id));
test('Admin navigation has all organization pages and no operational-only pages',()=>{
 assert.deepEqual(ids(ADMIN_WORKSPACE),['overview','workspaces','audits','clients','users','templates','compliance','reports','analytics','notifications','settings']);
 assert.deepEqual(getNavigationForWorkspace(ADMIN_WORKSPACE,{role:'Viewer'}),[]);
});
test('workspace module examples produce distinct menus',()=>{
 const [h,n,m]=workspaceSeed;
 assert.ok(ids(h).includes('audits')&&ids(h).includes('schedule'));
 assert.ok(!ids(n).includes('schedule')&&!ids(n).includes('team'));
 assert.ok(ids(m).includes('audits')&&!ids(m).includes('documents'));
 for(const w of [h,n,m]) assert.ok(!ids(w).includes('hxc')&&!ids(w).includes('risks'));
 assert.ok(!ids(h).includes('users')&&!ids(h).includes('workspaces'));
});
test('canonical routes refresh with workspace and active page intact',()=>{
 for(const w of [ADMIN_WORKSPACE,...workspaceSeed]) for(const item of getNavigationForWorkspace(w).flatMap(g=>g.items)) {
  const result=resolveRoute(item.route,workspaceSeed,'northfield');
  assert.equal(result.workspaceId,w.id);assert.equal(result.page,item.id);assert.equal(result.redirect,null);
  assert.ok(getNavigationForWorkspace(w).flatMap(g=>g.items).some(i=>i.id===result.page));
 }
});
test('disabled modules redirect safely without deleting saved data',()=>{
 let db=migrateDatabase(storage());
 db=upsertRecord(db,'risks',{title:'Retained hazard',workspaceId:'harmonix'},'harmonix');
 db=upsertRecord(db,'workspaces',{...db.workspaces[0],modules:['overview','sites','settings']},'admin');
 assert.equal(db.risks.length,1);
 assert.ok(!db.workspaces[0].modules.includes('risks'));
 assert.equal(canAccessPage(db.workspaces[0],'risks'),false);
 assert.equal(resolveRoute('#/workspace/harmonix/risks',db.workspaces).redirect,'#/workspace/harmonix/dashboard');
});
test('invalid workspace, inactive workspace, invalid path and legacy routes',()=>{
 assert.equal(resolveRoute('#/workspace/deleted/dashboard',workspaceSeed).redirect,'#/admin/dashboard');
 assert.equal(resolveRoute('#/workspace/harmonix/unknown',workspaceSeed).page,'not-found');
 assert.equal(resolveRoute('#/admin/dashboard/extra',workspaceSeed).page,'not-found');
 assert.equal(resolveRoute('#/workspace/%ZZ/dashboard',workspaceSeed).page,'not-found');
 assert.equal(resolveRoute('#/audits',workspaceSeed,'harmonix').redirect,'#/workspace/harmonix/inspections');
 assert.equal(resolveRoute('#/hxc',workspaceSeed,'admin').redirect,'#/admin/inspections');
 assert.equal(resolveRoute('#/workspace/harmonix/hxc-audits',workspaceSeed).redirect,'#/workspace/harmonix/inspections');
 assert.equal(resolveRoute('',workspaceSeed,'meridian').redirect,'#/workspace/meridian/dashboard');
 assert.equal(resolveRoute('#/workspace/harmonix/dashboard',[{...workspaceSeed[0],status:'Inactive'}]).workspaceId,'admin');
});
test('project URLs retain detail ID and cannot become another module',()=>{
 assert.equal(resolveRoute(routeFor('harmonix','sites','P-1'),workspaceSeed).detailId,'P-1');
 assert.equal(resolveRoute('#/workspace/harmonix/risks/P-1',workspaceSeed).redirect, '#/workspace/harmonix/dashboard');
 assert.equal(resolveRoute(routeFor('harmonix','audits','hxc:harmonix:HXC-123'),workspaceSeed).detailId,'hxc:harmonix:HXC-123');
});
test('new workspace is empty, persistent, normalized and duplicate-safe',()=>{
 const s=storage(),original=loadDatabase(s);
 const {db,workspace}=addWorkspace(original,{name:'  ABC   Construction ',client:'ABC Limited',modules:['risks','hxc']});
 assert.ok(workspace.modules.includes('audits') && !workspace.modules.includes('risks'));
 assert.equal(workspace.name,'ABC Construction');assert.ok(workspace.modules.includes('overview'));
 for(const key of ['projects','audits','actions','users','risks','schedule','documents']) assert.equal(scopeRecords(db[key],workspace.id).length,0);
 assert.throws(()=>addWorkspace(db,{name:'abc construction'}),/already exists/);
 assert.throws(()=>addWorkspace(db,{name:'   '}),/Enter a site name/);
 saveDatabase(s,db);assert.deepEqual(loadDatabase(s),db);
 assert.equal(loadDatabase(s).workspaces.at(-1).id,workspace.id);
});
test('workspace display-name and client changes cannot change data ownership',()=>{
 let db=migrateDatabase(storage());const before=scopeRecords(db.audits,'harmonix').map(a=>a.id);
 db=upsertRecord(db,'workspaces',{...db.workspaces[0],name:'Renamed workspace',clientId:db.workspaces[1].clientId},'admin');
 assert.deepEqual(scopeRecords(db.audits,'harmonix').map(a=>a.id),before);
 assert.ok(scopeRecords(db.audits,'northfield').every(a=>!before.includes(a.id)));
});
test('record writes reject cross-workspace and mismatched project references',()=>{
 const db=migrateDatabase(storage());const foreign=db.audits.find(a=>a.workspaceId==='northfield');
 assert.throws(()=>upsertRecord(db,'audits',foreign,'harmonix'),/another workspace/);
 assert.throws(()=>upsertRecord(db,'actions',{projectId:'S-2',title:'Leak'},'harmonix'),/selected workspace/);
 assert.throws(()=>upsertRecord(db,'actions',{projectId:'S-1',inspectionId:foreign.id,title:'Mismatch'},'harmonix'),/selected project/);
});
test('legacy migration retains records, unknown ownership and all client projects',()=>{
 const s=storage();s.setItem('harmonix-actions',JSON.stringify([{id:'old',siteId:'missing',title:'Keep me'}]));
 const db=loadDatabase(s);assert.equal(db.actions[0].workspaceId,'unassigned');
 assert.equal(scopeRecords(db.actions,'harmonix').length,0);assert.equal(scopeRecords(db.actions,'admin').length,1);
 assert.ok(db.projects.every(p=>db.workspaces.some(w=>w.id===p.workspaceId)));
 assert.ok(s.getItem('harmonix-actions'));
});
test('scoped team assignments and actions remain independent after switching',()=>{
 const db=migrateDatabase(storage());
 assert.equal(scopeRecords(db.users,'northfield').length,0);
 const urlHistory=['#/workspace/harmonix/actions','#/workspace/northfield/dashboard','#/workspace/meridian/inspections'];
 for(const url of [...urlHistory,...urlHistory.toReversed()]){
 const r=resolveRoute(url,db.workspaces);assert.ok(scopeRecords(db.actions,r.workspaceId).every(a=>a.workspaceId===r.workspaceId));
 }
});
test('reports use completed scores and observed months; empty records have no compliance',()=>{
 assert.equal(metrics([],[]).compliance,null);
 const audits=[{date:'2026-01-01',status:'Completed',score:80},{date:'2026-01-20',status:'Completed',score:100},{date:'2026-02-01',status:'Draft',score:0}];
 assert.equal(metrics(audits,[]).compliance,90);
 assert.deepEqual(trendData(audits).map(r=>[r.month,r.audits,r.compliance]),[['2026-01',2,90],['2026-02',1,null]]);
});
test('invalid saved database and quota failures are not silently reported as success',()=>{
 const s=storage();s.setItem(DATABASE_KEY,'broken');assert.throws(()=>loadDatabase(s));
 assert.throws(()=>saveDatabase({setItem:()=>{throw Error('Quota');}},{}),/Quota/);
});
test('closing actions requires evidence and completion requires a valid score',()=>{
 const db=migrateDatabase(storage());
 assert.throws(()=>upsertRecord(db,'actions',{workspaceId:'harmonix',status:'Closed',title:'Finding'},'harmonix'),/evidence/);
 assert.throws(()=>upsertRecord(db,'audits',{workspaceId:'harmonix',status:'Completed',score:101},'harmonix'),/0 to 100/);
});

test('workspace settings save within the selected workspace and still reject foreign edits',()=>{
 const db=migrateDatabase(storage());
 const updated=upsertRecord(db,'workspaces',{...db.workspaces[0],modules:['overview','sites','settings']},'harmonix');
 assert.equal(canAccessPage(updated.workspaces[0],'risks'),false);
 assert.throws(()=>upsertRecord(db,'workspaces',db.workspaces[1],'harmonix'),/another workspace/);
});

test('new workspaces only see templates explicitly assigned by Admin and new records have identities',()=>{
 const {db,workspace}=addWorkspace(migrateDatabase(storage()),{name:'Template test'});
 assert.ok(db.templates.every(t=>!t.workspaceIds.includes(workspace.id)));
 const assigned=upsertRecord(db,'templates',{...db.templates[0],workspaceIds:[...db.templates[0].workspaceIds,workspace.id]},'admin');
 assert.ok(assigned.templates[0].workspaceIds.includes(workspace.id));
 assert.ok(assigned.templates.slice(1).every(t=>!t.workspaceIds.includes(workspace.id))); 
 const next=upsertRecord(db,'projects',{name:'Project',reference:'P-01'},workspace.id);
 const project=next.projects.at(-1);assert.equal(project.projectId,project.id);assert.equal(project.clientId,workspace.clientId);
});
