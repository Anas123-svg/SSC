import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectionActivityForRange, inspectionPeriodForMonths, validInspectionDate } from '../src/data/dashboardSummary.js';

test('rolling month presets are true calendar months, including end-of-month and leap day', () => {
  assert.deepEqual(inspectionPeriodForMonths('2026-10-29', 1), { start: '2026-09-29', end: '2026-10-29' });
  assert.deepEqual(inspectionPeriodForMonths('2026-03-31', 1), { start: '2026-02-28', end: '2026-03-31' });
  assert.deepEqual(inspectionPeriodForMonths('2024-03-31', 1), { start: '2024-02-29', end: '2024-03-31' });
  for (const months of [1,2,3,4]) {
    const period = inspectionPeriodForMonths('2026-10-29', months);
    assert.equal(period.end, '2026-10-29');
    assert.ok(period.start < period.end);
  }
});

test('custom range includes exact boundary dates and excludes other records and demos', () => {
  const records = [
    {date:'2026-09-01',status:'Completed'}, {date:'2026-09-15',status:'Draft'},
    {date:'2026-09-30',status:'Completed'}, {date:'2026-08-31',status:'Completed'},
    {date:'2026-10-01',status:'Completed'}, {date:'2026-09-22',status:'Completed',demo:true},
    {date:'2026-09-31',status:'Completed'}, {date:'2026-09-28',status:'Scheduled'},
  ];
  const series = inspectionActivityForRange(records,'2026-09-01','2026-09-30','2026-10-28');
  assert.equal(series.reduce((count,row)=>count+row.inspections,0),4);
  assert.equal(series.reduce((count,row)=>count+row.completed,0),2);
  assert.equal(series.reduce((count,row)=>count+row.other,0),2);
  assert.equal(series[0].key,'2026-09-01');
  assert.equal(series.at(-1).end,'2026-09-30');
});

test('future dated inspections do not count as completed inspection activity', () => {
  const series = inspectionActivityForRange([{date:'2026-11-01',status:'Scheduled'},{date:'2026-10-28',status:'Completed'}], '2026-10-01', '2026-11-10', '2026-10-29');
  assert.equal(series.reduce((sum,row)=>sum+row.inspections,0),1);
});

test('adaptive chart is daily for 14 days, weekly for 4 months, monthly for a year, quarterly for three years', () => {
  const options = [
    ['2026-10-20','2026-10-29',10],
    ['2026-07-01','2026-10-29',18],
    ['2025-11-01','2026-10-29',12],
    ['2023-01-01','2025-12-31',12],
  ];
  for (const [from,to,expected] of options) {
    const series=inspectionActivityForRange([],from,to,'2026-10-29');
    assert.equal(series.length,expected,`${from} to ${to}`);
  }
});

test('invalid or backwards custom dates are rejected instead of producing fake zero-valued charts', () => {
  assert.equal(validInspectionDate('2026-02-30'),false);
  assert.equal(validInspectionDate('2026-10-01'),true);
  assert.deepEqual(inspectionActivityForRange([],'2026-10-30','2026-10-01'),[]);
  assert.deepEqual(inspectionActivityForRange([],'2026-02-30','2026-03-01'),[]);
});

test('dashboard has wide chart and preset/custom date controls, no needs-attention panel',()=>{
  const source=readFileSync(new URL('../src/pages/DashboardPage.jsx',import.meta.url),'utf8');
  assert.match(source,/ssc-dash-chart-wide/);
  assert.match(source,/\[1, 2, 3, 4\]/);
  assert.match(source,/ChartDateRangePicker/);
  assert.doesNotMatch(source,/type="date"/);
  assert.doesNotMatch(source,/Needs attention/);
});
