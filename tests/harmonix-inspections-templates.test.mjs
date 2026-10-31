import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/harmonix-inspections-templates.css', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const base = readFileSync(new URL('../src/styles/appearance-upgrade.css', import.meta.url), 'utf8');
const original = readFileSync(new URL('../src/styles/ssc-theme.css', import.meta.url), 'utf8');

test('Harmonix Inspection and Template stylesheet loads after the general finishing layer', () => {
  assert.ok(entry.includes("import './styles/harmonix-inspections-templates.css';"));
  assert.ok(entry.indexOf("import './styles/harmonix-inspections-templates.css';") > entry.indexOf("import './styles/harmonix-finish.css';"));
});

test('new styles are workspace-scoped and cover inspection filters, tabs, and template editor', () => {
  const selectors = css.split('{').slice(0, -1).map(s => s.slice(s.lastIndexOf('}') + 1).trim()).filter(s => s.startsWith('html'));
  assert.ok(selectors.length > 80, 'should include both page themes and dark-mode refinements');
  for (const selector of selectors) assert.match(selector, /^html\[data-workspace="harmonix"\]/);
  for (const selector of ['.ix-register-tabs button.active', '.ix-filter-toggle.active', '.ix-table-container .audit-table th', '.hxc-template-catalog-card-action', '.hxstudio-section-link.active', '.hxstudio-modebar>button.active', '.hxc-word-tabs button.active', '.hwd-inspection-page .sw-btn.sw-primary']) {
    assert.ok(css.includes(selector), `missing ${selector}`);
  }
  assert.match(css, /--hxit-primary:\s*#B6D552/);
});

test('SSC pink and HXC grade semantics are not replaced by Harmonix accents', () => {
  assert.match(original, /#EE3861/i);
  for (const selector of ['status-C', 'status-MI', 'status-MA', 'status-NA']) assert.ok(base.includes(selector));
  assert.ok(!css.includes('.status-C') && !css.includes('.status-MI') && !css.includes('.status-MA') && !css.includes('.status-NA'));
});
