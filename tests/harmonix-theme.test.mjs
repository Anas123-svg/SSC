import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles/harmonix-finish.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/pages/DashboardPage.jsx', import.meta.url), 'utf8');
const analytics = fs.readFileSync(new URL('../src/pages/AnalyticsPage.jsx', import.meta.url), 'utf8');
const reports = fs.readFileSync(new URL('../src/pages/ReportingPage.jsx', import.meta.url), 'utf8');

// With the exception of deliberately unused comments, rules in the last layer
// must be workspace-scoped so switching to SSC cannot retain Harmonix colours.
test('Harmonix finishing stylesheet loads last and scopes every top-level selector', () => {
  assert.ok(app.lastIndexOf("'./styles/harmonix-finish.css'") > app.lastIndexOf("'./styles/appearance-upgrade.css'"));
  assert.match(css, /html\[data-workspace="harmonix"\]/);
  assert.match(css, /--hx-lime:#B6D552;/);
  assert.match(css, /\.sidebar\.ssc-sidebar \.nav-link\.selected/);
  assert.match(css, /data-theme="dark"/);
  const selectors = css.match(/(^|\n)\s*([^{}]+)\s*\{/g) ?? [];
  const scoped = selectors.filter(s => !s.includes('@media'));
  assert.ok(scoped.length > 80);
  for (const selector of scoped) {
    assert.ok(selector.includes('html[data-workspace="harmonix"]'), `Unscoped selector: ${selector}`);
  }
});

test('Harmonix charts use the same lime accent, while SSC retains its independent pink', () => {
  assert.match(dashboard, /harmonix \? '#B6D552' : '#d74b72'/);
  assert.match(analytics, /HARMONIX_PALETTE\s*=\s*\{\s*pink: '#B6D552'/);
  assert.match(analytics, /const palette = activeWorkspaceId === 'harmonix' \? HARMONIX_PALETTE : SSC_PALETTE/);
  assert.match(reports, /activeWorkspaceId === 'harmonix' \? '#B6D552' : '#ee3861'/);
});

test('Existing audit C, MI and MA semantic colours are preserved', () => {
  const base = fs.readFileSync(new URL('../src/styles/appearance-upgrade.css', import.meta.url), 'utf8');
  for (const grade of ['C', 'MI', 'MA', 'NA']) assert.ok(base.includes(`.status-${grade}`));
  assert.match(css, /Semantic grading, urgency, negative outcomes, white print/i);
});
