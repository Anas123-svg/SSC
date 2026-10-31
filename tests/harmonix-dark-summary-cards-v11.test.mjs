import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const css = read('../src/styles/harmonix-summary-cards-v11.css');
const appearance = read('../src/styles/appearance-upgrade.css');
const main = read('../src/main.jsx');
const toggle = read('../src/components/layout/AppearanceToggle.jsx');
const team = read('../src/pages/TeamPage.jsx');
const projects = read('../src/pages/SitesPage.jsx');
const settings = read('../src/pages/SettingsPage.jsx');
const adminSettings = read('../src/pages/AdminSettingsPage.jsx');

test('metric titles are not coloured as teal-blue header strips in dark mode', () => {
  assert.doesNotMatch(appearance, /\.ssc-v2-toggle-icon,\.ssc-v2-stat-label,/);
  assert.match(css, /\.ssc-v2-stat-label\s*\{[\s\S]*?background:transparent;/);
  assert.match(css, /\.ssc-v2-stat-label\s*>\s*span\s*\{[\s\S]*?background:transparent;/);
});

test('one consistent Harmonix dark palette is scoped only to Team and Projects metric tiles', () => {
  assert.match(css, /html\[data-workspace="harmonix"\]\[data-theme="dark"\]/);
  assert.match(css, /:is\(\.ssc-v2-team,\.ssc-v2-projects\)/);
  assert.match(css, /background:#232F28;/);
  assert.match(css, /color:#EBF2E9;/);
  assert.match(css, /color:#FAFCF6;/);
  assert.match(css, /color:#B6C5B6;/);
  assert.match(css, /color:#C4E37A;/);
  assert.ok(main.indexOf('theme-controls-v10.css') < main.indexOf('harmonix-summary-cards-v11.css'));
});

test('six actual metrics share the class structure covered by the new palette', () => {
  for (const label of ['Assigned team','Active members','Inspection roles']) assert.ok(team.includes(`<span>${label}</span>`));
  for (const label of ['Registered projects','Current projects','Completed projects']) assert.ok(projects.includes(`<span>${label}</span>`));
  assert.match(team, /ssc-v2-team-stats/);
  assert.match(projects, /ssc-v2-project-stats/);
});

test('one sun/moon icon button toggles modes in top bar and both settings pages', () => {
  assert.match(toggle, /const Icon = dark \? Moon : Sun/);
  assert.match(toggle, /setAppearance\(dark \? 'light' : 'dark'\)/);
  assert.match(toggle, /aria-label=\{dark \? 'Switch to light mode'/);
  assert.match(settings, /<AppearanceToggle\/>/);
  assert.match(adminSettings, /<AppearanceToggle\/>/);
  assert.doesNotMatch(settings, /<AppearanceToggle withLabel/);
  assert.doesNotMatch(adminSettings, /<AppearanceToggle withLabel/);
});
