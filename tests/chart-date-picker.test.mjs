import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { monthGrid, moveMonth, rangeIsComplete, selectRangeDay } from '../src/data/calendarRange.js';

const jsx = readFileSync(new URL('../src/components/common/ChartDateRangePicker.jsx', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../src/pages/DashboardPage.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/dashboard-reports.css', import.meta.url), 'utf8');

test('calendar month grid starts on Sunday and has six stable weeks', () => {
  const dates = monthGrid('2026-10');
  assert.equal(dates.length, 42);
  assert.equal(dates[0].iso, '2026-09-27');
  assert.equal(dates.find(d => d.iso === '2026-10-01').label, 1);
  assert.equal(dates.find(d => d.iso === '2026-10-17').inMonth, true);
  assert.equal(dates.at(-1).iso, '2026-11-07');
});

test('month navigation is correct across year boundaries and leap years', () => {
  assert.equal(moveMonth('2026-12',1), '2027-01');
  assert.equal(moveMonth('2026-01',-1), '2025-12');
  assert.equal(monthGrid('2024-02').filter(d => d.inMonth).length, 29);
});

test('two-click range: first date, second date; earlier second date restarts', () => {
  assert.deepEqual(selectRangeDay('2026-10-01','2026-10-20','2026-10-05',false),{start:'2026-10-05',end:'',awaitingEnd:true});
  assert.deepEqual(selectRangeDay('2026-10-05','','2026-10-17',true),{start:'2026-10-05',end:'2026-10-17',awaitingEnd:false});
  assert.deepEqual(selectRangeDay('2026-10-17','','2026-10-05',true),{start:'2026-10-05',end:'',awaitingEnd:true});
  assert.deepEqual(selectRangeDay('2026-10-05','','2026-10-05',true),{start:'2026-10-05',end:'2026-10-05',awaitingEnd:false});
});

test('incomplete, reversed, or future selections cannot be applied', () => {
  assert.equal(rangeIsComplete('2026-10-05','','2026-10-29'),false);
  assert.equal(rangeIsComplete('2026-10-17','2026-10-05','2026-10-29'),false);
  assert.equal(rangeIsComplete('2026-10-05','2026-11-01','2026-10-29'),false);
  assert.equal(rangeIsComplete('2026-10-05','2026-10-17','2026-10-29'),true);
  assert.equal(rangeIsComplete('2026-02-30','2026-10-17','2026-10-29'),false);
});

test('picker uses an anchored dropdown with dialog, outside-click, Escape and Apply/Cancel', () => {
  assert.match(jsx, /role="dialog"/);
  assert.match(jsx, /pointerdown/);
  assert.match(jsx, /Escape/);
  assert.match(jsx, /onApply\(draftStart, draftEnd\)/);
  assert.match(jsx, /Next month/);
  assert.match(jsx, /Previous month/);
  assert.match(css, /\.ssc-calendar-popover\s*\{/);
  assert.match(css, /background:#1b2230/);
  assert.match(dashboard, /ChartDateRangePicker/);
});
