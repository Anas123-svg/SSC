import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calendarPopoverPosition } from '../src/data/calendarRange.js';

const picker = readFileSync(new URL('../src/components/common/ChartDateRangePicker.jsx', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../src/pages/DashboardPage.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/dashboard-reports.css', import.meta.url), 'utf8');

test('popup appears below the trigger when enough space exists', () => {
  const position = calendarPopoverPosition({ top: 50, bottom: 90, right: 980 }, { width: 354, height: 390 }, { width: 1024, height: 800 });
  assert.deepEqual(position, { left: 626, top: 98, width: 354, maxHeight: 390, placement: 'bottom' });
});

test('popup flips above the trigger near the bottom of the viewport', () => {
  const position = calendarPopoverPosition({ top: 650, bottom: 690, right: 980 }, { width: 354, height: 390 }, { width: 1024, height: 800 });
  assert.equal(position.placement, 'top');
  assert.equal(position.top, 252);
  assert.equal(position.maxHeight, 390);
});

test('on narrow screens, popup fits the viewport and scrolls internally', () => {
  const position = calendarPopoverPosition({ top: 200, bottom: 240, right: 375 }, { width: 354, height: 460 }, { width: 390, height: 600 });
  assert.equal(position.left, 21);
  assert.equal(position.width, 354);
  assert.equal(position.placement, 'bottom');
  assert.equal(position.maxHeight, 340);
  const tiny = calendarPopoverPosition({ top: 30, bottom: 68, right: 290 }, { width: 354, height: 500 }, { width: 320, height: 500 });
  assert.equal(tiny.width, 296);
  assert.ok(tiny.left >= 12 && tiny.left + tiny.width <= 308);
});

test('popup respects scrolling/zoomed visual viewport offsets', () => {
  const position = calendarPopoverPosition({ top: 220, bottom: 260, right: 585 }, { width: 354, height: 390 }, { left: 200, top: 100, width: 400, height: 500 });
  assert.ok(position.left >= 212);
  assert.ok(position.left + position.width <= 588);
  assert.equal(position.placement, 'bottom');
  assert.equal(position.maxHeight, 320);
});

test('custom date picker never preselects dates and keeps the chart unchanged until Apply', () => {
  assert.match(picker, /setDraftStart\(''\)/);
  assert.match(picker, /setDraftEnd\(''\)/);
  assert.match(picker, /createPortal\(popup, document\.body\)/);
  assert.match(picker, /addEventListener\('scroll', schedule, \{ capture: true, passive: true \}\)/);
  assert.match(picker, /visualViewport\?\.addEventListener\('resize', schedule\)/);
  assert.match(picker, /popupRef\.current\?\.contains\(event\.target\)/);
  assert.match(dashboard, /const \[customStart, setCustomStart\] = useState\(''\)/);
  assert.match(dashboard, /const \[customEnd, setCustomEnd\] = useState\(''\)/);
  assert.match(dashboard, /setPeriod\('custom'\)/);
  assert.doesNotMatch(dashboard, /setCustomStart\(current\.start\)/);
  assert.match(css, /\.ssc-calendar-popover\s*\{\s*position:fixed/);
  assert.match(css, /overflow-y:auto/);
});
