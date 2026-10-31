import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const toggle = read('../src/components/layout/AppearanceToggle.jsx');
const topbar = read('../src/components/layout/Topbar.jsx');
const workspace = read('../src/components/layout/WorkspaceSwitcher.jsx');
const css = read('../src/styles/theme-controls-v10.css');
const app = read('../src/app/App.jsx');
const team = read('../src/pages/TeamPage.jsx');
const projects = read('../src/pages/SitesPage.jsx');
const settings = read('../src/pages/SettingsPage.jsx');
const adminSettings = read('../src/pages/AdminSettingsPage.jsx');
const main = read('../src/main.jsx');

test('theme mode uses one accessible button with current sun/moon icon and reversible action', () => {
  assert.match(toggle,/const dark = resolvedAppearance === 'dark'/);
  assert.match(toggle,/const Icon = dark \? Moon : Sun/);
  assert.match(toggle,/setAppearance\(dark \? 'light' : 'dark'\)/);
  assert.match(toggle,/aria-label=\{dark \? 'Switch to light mode'/);
  assert.match(toggle,/aria-pressed=\{dark\}/);
  assert.match(topbar,/<AppearanceToggle\/>/);
  assert.doesNotMatch(topbar,/<select aria-label="Appearance/);
  assert.match(settings,/<AppearanceToggle\/>/);
  assert.match(adminSettings,/<AppearanceToggle\/>/);
  assert.match(app,/ssc-appearance-mode/);
});

test('logo containers get a client-only class and transparent backdrop, leaving admin choice intact', () => {
  assert.match(workspace,/w\.id !== 'admin' \? ' ssc-client-logo'/);
  assert.match(css,/\.ssc-workspace-avatar\.ssc-client-logo/);
  assert.match(css,/\.ssc-option-avatar\.ssc-client-logo/);
  assert.match(css,/background:transparent;\s*border:0;\s*border-radius:0;/);
});

test('summary metrics expose separate text and icon spans across Team and Projects', () => {
  for (const text of ['Assigned team','Active members','Inspection roles']) assert.match(team,new RegExp(`<span>${text}</span>`));
  for (const text of ['Registered projects','Current projects','Completed projects']) assert.match(projects,new RegExp(`<span>${text}</span>`));
  assert.match(css,/\.ssc-v2-stat-label>span/);
  assert.match(css,/\.ssc-v2-stat-label>svg/);
  assert.match(css,/\.ssc-v2-stat>small/);
});

test('dark mode styles parent search box, input, placeholder, shortcut and other page fields', () => {
  for (const part of ['.topbar .search{','.topbar .search input{','.topbar .search input::placeholder','.topbar .search kbd{','.ssc-v2-toolbar .ssc-v2-search','.ssc-report-search','.insight-filters input','.sx-search','.ix-search']) assert.ok(css.includes(part),part);
  assert.match(css,/html\[data-theme="dark"\]\[data-workspace="harmonix"\]/);
  assert.ok(main.trim().endsWith('createRoot(document.getElementById(\'root\')).render(<React.StrictMode><App /><\/React.StrictMode>);'));
  assert.ok(main.indexOf('harmonix-complete-audit.css') < main.indexOf('theme-controls-v10.css'));
});
