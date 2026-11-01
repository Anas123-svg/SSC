import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../src/styles/harmonix-complete-audit.css', import.meta.url), 'utf8');
const projectForm = readFileSync(new URL('../src/components/projects/ProjectLocationPicker.jsx', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/pages/SettingsPage.jsx', import.meta.url), 'utf8');

const styles = [...source.matchAll(/import '\.\/styles\/([^']+\.css)'/g)].map(match => match[1]);

test('Harmonix completion layer follows earlier styles, followed by V10, V11 and V12 fixes', () => {
  assert.equal(styles.at(-1), 'template-catalog-actions-v18.css');
  assert.ok(styles.indexOf('template-catalog-actions-v18.css') > styles.indexOf('word-workspace-v17.css'));
  assert.ok(styles.indexOf('word-workspace-v17.css') > styles.indexOf('word-workspace-v16.css'));
  assert.ok(styles.indexOf('word-workspace-v16.css') > styles.indexOf('word-workspace-v14.css'));
  assert.ok(styles.indexOf('word-workspace-v14.css') > styles.indexOf('word-template-v13.css'));
  assert.ok(styles.indexOf('word-template-v13.css') > styles.indexOf('harmonix-calendar-v12.css'));
  assert.ok(styles.indexOf('harmonix-calendar-v12.css') > styles.indexOf('harmonix-summary-cards-v11.css'));
  assert.ok(styles.indexOf('harmonix-summary-cards-v11.css') > styles.indexOf('theme-controls-v10.css'));
  assert.ok(styles.indexOf('theme-controls-v10.css') > styles.indexOf('harmonix-complete-audit.css'));
  assert.ok(styles.indexOf('harmonix-complete-audit.css') > styles.indexOf('harmonix-inspections-templates.css'));
});

test('detail page and edit map retain lime / charcoal workspace tokens', () => {
  assert.match(theme, /--hx-primary:#B6D552/);
  assert.match(theme, /--pd-pink:var\(--hx-action\)/);
  assert.match(theme, /\.pd-page \.pd-tabs\.project-section-nav button\.active/);
  assert.match(theme, /\.pd-page \.pd-date-tile/);
  assert.match(theme, /\.ssc-pform \.ssc-pmap-search>button/);
  assert.match(projectForm, /--project-map-pin, #d84b73/);
});

test('safety and printable grades are deliberately outside the workspace decoration rules', () => {
  assert.match(theme, /safety.*severity-coded/i);
  assert.match(theme, /\.pd-note:not\(\.is-safety\)/);
  assert.doesNotMatch(theme, /\.hwd-compliance-select\.status-MA\s*\{/);
  assert.doesNotMatch(theme, /\.pd-overdue\s*\{/);
});

test('Harmonix dark mode and SSC Admin isolation are explicit', () => {
  assert.match(theme, /html\[data-workspace="harmonix"\]\[data-theme="dark"\]/);
  assert.doesNotMatch(theme, /html\[data-workspace="admin"\]/);
  assert.doesNotMatch(settings, /Harmonix uses its teal brand/);
  assert.match(settings, /Harmonix uses its lime and charcoal/);
});
