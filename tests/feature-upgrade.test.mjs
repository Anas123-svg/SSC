import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newBlock, countQuestions, validateSchema, completionStats, HXC_COMPLIANCE_OPTIONS } from '../src/features/templates/hxcSchema.js';
import { sanitizeRichText } from '../src/features/templates/richText.js';

const read = file => readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('formatted blocks preserve schema validation without becoming required inspection questions', () => {
  const rich = newBlock('richtext');
  assert.equal(rich.type,'richtext');
  assert.match(rich.html, /<p>/);
  const schema=[{id:'test-section',title:'Custom instructions',blocks:[rich,newBlock('radio')]}];
  assert.equal(validateSchema(schema),'');
  assert.equal(countQuestions(schema),1);
  assert.equal(completionStats(schema,{}).total,1);
});

test('HXC grade vocabulary and semantic colors are defined on the report and native checklist', () => {
  assert.deepEqual(HXC_COMPLIANCE_OPTIONS,['C','MI','MA','N/A']);
  const styles=read('src/styles/appearance-upgrade.css');
  for(const status of ['C','MI','MA','NA']) {
    assert.ok(styles.includes(`.hwd-compliance-select.status-${status}`),`report status ${status}`);
    assert.ok(styles.includes(`.hxc-choice.selected.status-${status}`),`legacy status ${status}`);
  }
  assert.match(styles,/\.hwd-checklist-table \.hwd-compliance-select\.status-NA[^\n]*background:#fff/);
});

test('workspace branding and appearance persist as independent concerns', () => {
  const app=read('src/app/App.jsx'), theme=read('src/styles/appearance-upgrade.css');
  assert.match(app,/document\.documentElement\.dataset\.workspace = activeWorkspaceId/);
  assert.match(app,/localStorage\.setItem\('ssc-appearance-mode'/);
  assert.match(theme,/html\[data-workspace="harmonix"\] \.sidebar\.ssc-sidebar/);
  assert.match(theme,/html\[data-theme="dark"\]/);
  assert.match(read('src/pages/AdminSettingsPage.jsx'),/Appearance & dark mode/);
});

test('project directory renders project image or map plus address and manager', () => {
  assert.match(read('src/pages/SitesPage.jsx'),/<ProjectCardMedia project=\{p\}/);
  assert.match(read('src/pages/SitesPage.jsx'),/p\.address\|\|p\.location/);
  assert.match(read('src/pages/SitesPage.jsx'),/p\.manager\|\|/);
  assert.match(read('src/pages/ProjectFormPage.jsx'),/uploadPhoto/);
});

test('server-safe rich text fallback does not return active markup', () => {
  assert.equal(sanitizeRichText('<b>Safety</b>'), 'Safety');
});
