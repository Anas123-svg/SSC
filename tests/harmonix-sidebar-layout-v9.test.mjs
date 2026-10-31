import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sidebar = readFileSync(new URL('../src/components/layout/Sidebar.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/harmonix-complete-audit.css', import.meta.url), 'utf8');
const switcher = readFileSync(new URL('../src/components/layout/WorkspaceSwitcher.jsx', import.meta.url), 'utf8');

test('Harmonix header reuses SSC two-part lockup layout with logo, divider and two-line title', () => {
  assert.match(sidebar, /className="ssc-brand-divider"/);
  assert.match(sidebar, /className="ssc-brand-title"/);
  assert.match(sidebar, /isHarmonix \? 'Harmonix' : 'Site Safety'/);
  assert.match(sidebar, /isHarmonix \? 'Construction' : 'Consultants'/);
  assert.match(sidebar, /src=\{isHarmonix \? "\/harmonix-logo.png"/);
  assert.ok(sidebar.indexOf('<WorkspaceSwitcher/>') > sidebar.indexOf('ssc-product-caption'));
  assert.match(switcher, /CURRENT WORKSPACE/);
  assert.match(switcher, /ssc-switcher-trigger/);
});

test('Harmonix sidebar layout rules are workspace-scoped and keep logo transparent', () => {
  const section = styles.slice(styles.indexOf('/* V9 — Harmonix top-sidebar lockup'));
  assert.ok(section.includes('.ssc-brand-divider'));
  assert.ok(section.includes('.ssc-brand-title'));
  assert.ok(section.includes('.ssc-product-caption'));
  assert.match(section, /background:transparent;/);
  assert.match(section, /border-bottom:1px solid/);
  for (const selector of section.match(/^html[^\n{]*\{/gm) || []) {
    assert.match(selector, /^html\[data-workspace="harmonix"\]/);
  }
});
