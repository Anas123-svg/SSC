import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardSummary, inspectionActivity } from '../src/data/dashboardSummary.js';
import { buildReportCatalog } from '../src/data/reportCatalog.js';

test('dashboard totals use real inspections and keep unscored compliance empty', () => {
  const result = dashboardSummary([{ id: 'a', date: '2026-10-28', status: 'Draft', demo: false }, { id: 'sample', status: 'Completed', score: 100, demo: true }], [{ id: 'action', status: 'Open', priority: 'High' }], [{ id: 'p', status: 'Active' }, { id: 'archive', status: 'Archived' }]);
  assert.equal(result.projects, 1);
  assert.equal(result.total, 1);
  assert.equal(result.compliance, null);
  assert.equal(result.open, 1);
});
test('inspection activity shows exactly six real monthly buckets and no future or demo records', () => {
  const series = inspectionActivity([
    { date: '2026-10-01', status: 'Completed' },
    { date: '2026-10-29', status: 'Scheduled' },
    { date: '2026-09-22', status: 'Draft', demo: true },
    { date: '2026-09-19', status: 'Completed' },
    { date: 'invalid', status: 'Completed' },
  ], '2026-10-28');
  assert.equal(series.length, 6);
  assert.equal(series.at(-1).key, '2026-10');
  assert.equal(series.at(-1).inspections, 1);
  assert.equal(series.at(-1).completed, 1);
  assert.equal(series.at(-2).inspections, 1);
  assert.equal(series.at(-2).completed, 1);
});
test('reports list includes only completed inspections and actual report documents', () => {
  const records = buildReportCatalog({
    workspaceId: 'harmonix',
    inspections: [{ id:'1', workspaceId:'harmonix', projectId:'p1', source:'register', status:'Completed', type:'Site inspection', date:'2026-10-27' },
      { id:'2', workspaceId:'harmonix', projectId:'p1', status:'Draft' },
      { id:'3', workspaceId:'northfield', projectId:'p2', status:'Completed' },
      { id:'sample', workspaceId:'harmonix', projectId:'p1', demo:true, status:'Completed' }],
    documents: [{ id:'doc', workspaceId:'harmonix', projectId:'p1', category:'Inspection reports', name:'Uploaded inspection PDF', file: {name:'report.pdf',data:'data:application/pdf;base64,AA=='} },
      { id:'unrelated', workspaceId:'harmonix', projectId:'p1', category:'Certificates' }],
    projects:[{id:'p1',name:'Riverside Quarter'}],
  });
  assert.deepEqual(new Set(records.map(r => r.id)), new Set(['inspection-report:1', 'document-report:doc']));
  assert.equal(records[0].project, 'Riverside Quarter');
});
test('project report list stays scoped to one construction project', () => {
  const reportList = buildReportCatalog({workspaceId:'admin',projectId:'p1',
    inspections:[{id:'a',workspaceId:'harmonix',projectId:'p1',status:'Completed'},{id:'b',workspaceId:'northfield',projectId:'p2',status:'Completed'}],
    documents:[],projects:[{id:'p1',name:'Site 1'},{id:'p2',name:'Site 2'}]});
  assert.equal(reportList.length, 1);
  assert.equal(reportList[0].inspectionId, 'a');
});
