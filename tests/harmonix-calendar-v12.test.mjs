import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const entry = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/harmonix-calendar-v12.css', import.meta.url), 'utf8');
const base = readFileSync(new URL('../src/styles/inspection-experience.css', import.meta.url), 'utf8');
const chartPicker = readFileSync(new URL('../src/components/common/ChartDateRangePicker.jsx', import.meta.url), 'utf8');
const schedule = readFileSync(new URL('../src/pages/InspectionSchedule.jsx', import.meta.url), 'utf8');

const selector = name => css.includes(name);

test('calendar override loads last and only targets the Harmonix workspace', () => {
  assert.ok(entry.includes("import './styles/harmonix-calendar-v12.css';"));
  assert.ok(entry.lastIndexOf("'./styles/harmonix-calendar-v12.css'") > entry.lastIndexOf("'./styles/harmonix-summary-cards-v11.css'"));
  // All top-level selectors are explicit workspace overrides, never global replacements.
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = withoutComments.match(/(?:^|\n)\s*[^{}]+\{/g) || [];
  assert.ok(selectors.length > 90);
  for (const full of selectors) {
    const head = full.replace(/^\s*/, '').replace(/\{\s*$/, '').trim();
    assert.ok(head.startsWith('html[data-workspace="harmonix"]'), `Unexpected global CSS rule: ${head}`);
  }
  assert.match(css, /--hx-calendar-accent:#B6D552/);
});

test('dashboard date range calendar has lime endpoints, focus, today and in-range dates', () => {
  assert.match(chartPicker, /ssc-calendar-days/);
  for (const s of ['.ssc-calendar-days button.is-endpoint','.ssc-calendar-days button.is-today:not(.is-endpoint)','.ssc-calendar-days button.is-in-range','.ssc-calendar-draft .active small','.ssc-calendar-apply:hover:not(:disabled)', '.ssc-calendar-trigger:focus-visible']) {
    assert.ok(selector(s), `Missing ${s}`);
  }
});

test('inspection schedule calendar replaces the inherited pink for every interactive state', () => {
  assert.match(schedule, /className={`sx-day/);
  assert.match(base, /\.sx-day\.is-selected\{background:#fff9fb/);
  for (const s of [
    '.sx-day.is-selected', '.sx-day.is-today .sx-day-number',
    '.sx-day.is-selected:not(.is-today) .sx-day-number',
    '.sx-calendar-navigation button:hover', '.sx-view-switch button.active',
    '.sx-event:not(.sx-event--completed):not(.sx-event--cancelled)',
    '.sx-day-panel-head > button', '.sx-status-dot:not(.sx-status-dot--completed):not(.sx-status-dot--cancelled)',
    '.sx-status:not(.sx-status--completed):not(.sx-status--cancelled)',
    '.sx-legend-dot:not(.done):not(.cancelled)', '.sx-agenda-date',
    '.sx-no-day button', '.sx-more'
  ]) assert.ok(selector(s), `Missing ${s}`);
});

test('dark mode and semantic statuses retain usable independent palettes', () => {
  assert.match(css, /html\[data-workspace="harmonix"\]\[data-theme="dark"\]/);
  for (const s of ['.sx-event--completed', '.sx-event--cancelled','.sx-status--completed','.sx-status--cancelled','.sx-day.is-outside','.sx-day-panel','.ssc-calendar-popover']) {
    assert.ok(selector(s), `Missing ${s}`);
  }
  assert.ok(!css.includes('.hwd-compliance-select.status-'), 'Compliance grades should not be overwritten by calendar rules');
});
