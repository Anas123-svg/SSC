import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('../src/styles/workspace-sidebar.css', import.meta.url), 'utf8');

test('sidebar uses a charcoal gradient, light text and a restrained pink selection without changing the main page theme', () => {
  assert.match(styles, /\.sidebar\.ssc-sidebar\s*\{[^}]*background:\s*linear-gradient\(165deg,\s*#202833\s+0%,\s*#191f28\s+45%,\s*#151a21\s+100%\)/s);
  assert.match(styles, /\.sidebar\.ssc-sidebar \.nav-link\s*\{[^}]*color:\s*#c1cbd8/s);
  assert.match(styles, /\.sidebar\.ssc-sidebar \.nav-link\.selected\s*\{[^}]*color:\s*#fff4f7;\s*background:\s*#493341/s);
  assert.match(styles, /\.ssc-switcher-menu\s*\{[^}]*background:\s*#252e3a/s);
  const main = readFileSync(new URL('../src/styles/ssc-theme.css', import.meta.url), 'utf8');
  assert.match(main, /\.content\s*\{\s*background:\s*#FFFFFF/s);
  const sidebar = readFileSync(new URL('../src/components/layout/Sidebar.jsx', import.meta.url), 'utf8');
  assert.match(sidebar, /ssc-logo-for-dark-sidebar\.png/);
});

test('sidebar and workspace popup hide visual scrollbars without disabling scrolling', () => {
  assert.match(styles, /\.sidebar\.ssc-sidebar\s*\{[^}]*overflow-y:\s*auto;[^}]*scrollbar-width:\s*none;/s);
  assert.match(styles, /\.sidebar\.ssc-sidebar::-webkit-scrollbar\s*\{[^}]*display:\s*none;/s);
  assert.match(styles, /\.ssc-switcher-menu\s*\{[^}]*overflow-y:\s*auto;[^}]*scrollbar-width:\s*none;/s);
  assert.match(styles, /\.ssc-switcher-menu::-webkit-scrollbar\s*\{[^}]*display:\s*none;/s);
});
