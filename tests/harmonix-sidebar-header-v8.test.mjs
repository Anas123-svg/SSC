import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sidebar = readFileSync(new URL('../src/components/layout/Sidebar.jsx', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../src/styles/harmonix-complete-audit.css', import.meta.url), 'utf8');
const cssImports = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

test('Harmonix brand header is a child of the real sidebar and stays on its brand', () => {
  assert.match(sidebar, /<aside[^>]*className=\{'sidebar ssc-sidebar /);
  assert.match(sidebar, /className="ssc-sidebar-head ssc-sidebar-head--integrated"/);
  assert.match(sidebar, /src=\{isHarmonix \? "\/harmonix-logo.png" : "\/ssc-logo-for-dark-sidebar.png"\}/);
  assert.match(theme, /html\[data-workspace="harmonix"\] \.sidebar\.ssc-sidebar \.ssc-sidebar-head--integrated\s*\{/);
  assert.match(theme, /background:transparent;/);
  assert.match(theme, /object-fit:contain;/);
  assert.equal(cssImports.trim().split('\n').filter(line => line.includes('harmonix-complete-audit.css')).length,1);
});

test('User-supplied logo is a PNG with an alpha channel', () => {
  const png = readFileSync(new URL('../public/harmonix-logo.png', import.meta.url));
  assert.equal(png.subarray(1,4).toString(), 'PNG');
  assert.ok(png.readUInt32BE(16) > 100 && png.readUInt32BE(20) > 40);
  assert.equal(png[25], 6); // RGBA, so transparent background is supported.
});
