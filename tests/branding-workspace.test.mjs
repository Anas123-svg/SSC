import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getWorkspaceLogo } from '../src/data/workspaceBranding.js';

const sidebar = readFileSync(new URL('../src/components/layout/Sidebar.jsx', import.meta.url), 'utf8');
const switcher = readFileSync(new URL('../src/components/layout/WorkspaceSwitcher.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/workspace-sidebar.css', import.meta.url), 'utf8');

test('Harmonix receives the uploaded transparent logo, including legacy saved workspaces', () => {
  const seeded = { id: 'harmonix', name: 'Harmonix', initials: 'HX' };
  assert.equal(getWorkspaceLogo(seeded), '/harmonix-logo.png');
  const source = readFileSync(new URL('../public/harmonix-logo.png', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), '631a85eaf6dd7d7650b336b6a3f1204cf757b59ce1d481d5f761f30270cd6b75');
});

test('Admin/other client workspaces do not display Harmonix branding; uploaded logos override defaults', () => {
  assert.equal(getWorkspaceLogo({ id:'admin', initials:'AD' }), '/ssc-logo-for-dark-sidebar.png');
  assert.equal(getWorkspaceLogo({ id:'meridian', initials:'MC' }), null);
  assert.equal(getWorkspaceLogo({ id:'harmonix', logo: { data: 'data:image/png;base64,original' } }), 'data:image/png;base64,original');
});

test('the sidebar header has an SSC corporate lockup and a compact, logo-aware workspace picker', () => {
  assert.match(sidebar, /ssc-brand-title/);
  assert.match(sidebar, /Site Safety/);
  assert.match(switcher, /getWorkspaceLogo\(w\)/);
  assert.match(switcher, /ssc-logo-avatar/);
  assert.match(css, /\.ssc-brand-divider\s*\{/);
  assert.match(css, /\.ssc-switcher-trigger\s*\{[^}]*background:\s*transparent;/s);
  assert.match(css, /\.ssc-workspace-avatar\.ssc-logo-avatar\s*\{[^}]*background:\s*#fff;/s);
  assert.match(css, /\.ssc-option-avatar\.ssc-logo-avatar\s*\{[^}]*background:\s*#fff;/s);
  assert.match(css, /\.ssc-switcher-menu::-webkit-scrollbar\s*\{[^}]*display:\s*none;/s);
});
