import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const ribbon = read('src/features/templates/DocumentRibbon.jsx');
const css = read('src/styles/word-workspace-v17.css');
const appEntry = read('src/main.jsx');

test('modern Word ribbon renders eight functional tabs and keeps contextual tabs', () => {
  for (const name of ['File','Home','Insert','Layout','References','Review','View','Help']) {
    assert.match(ribbon, new RegExp(`'${name}'`));
  }
  assert.match(ribbon, /Table Design/);
  assert.match(ribbon, /Table Layout/);
  assert.match(ribbon, /Picture/);
  assert.match(ribbon, /onClick=\{\(\) => selectTab\(name\)\}/);
  assert.match(ribbon, /setTab\(name\)/);
  assert.match(ribbon, /aria-selected=\{tab === name\}/);
  assert.match(ribbon, /role="tablist"/);
  assert.match(ribbon, /role="tabpanel"/);
});

test('responsive tab menu handles overflow and keyboard traversal', () => {
  assert.match(ribbon, /onKeyDown=\{onTabsKeyDown\}/);
  assert.match(ribbon, /ArrowLeft.*ArrowRight.*Home.*End/);
  assert.match(ribbon, /Scroll ribbon tabs left/);
  assert.match(ribbon, /Scroll ribbon tabs right/);
  assert.match(ribbon, /scrollBy\(\{ left: direction \* 240/);
  assert.match(css, /\.hxword \.hxword-menu-scroller[\s\S]+?overflow-x:\s*auto/);
  assert.match(css, /\.hxword \.hxword-tabs[\s\S]+?gap:\s*5px/);
  assert.match(css, /@media\(max-width:\s*600px\)/);
});

test('collapse ribbon is functional and the document editing engine is not remounted', () => {
  assert.match(ribbon, /ribbonExpanded, setRibbonExpanded/);
  assert.match(ribbon, /aria-label=\{ribbonExpanded \? 'Collapse ribbon' : 'Expand ribbon'\}/);
  assert.match(ribbon, /hidden=\{!ribbonExpanded\}/);
  assert.match(css, /\.hxword \.hxword-ribbon\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
  assert.doesNotMatch(ribbon, /setContent\(.*ribbonExpanded/);
});

test('modern ribbon is scoped to Word, works in dark mode and prints without chrome', () => {
  assert.match(css, /html\[data-theme="dark"\] \.hxword/);
  assert.match(css, /@media print\s*\{\s*\.hxword \.hxword-menu\s*\{\s*display:none!important/);
  assert.ok(appEntry.indexOf('word-workspace-v16.css') < appEntry.indexOf('word-workspace-v17.css'));
  assert.ok(appEntry.indexOf('word-workspace-v17.css') > appEntry.indexOf('word-workspace-v14.css'));
  assert.match(css, /\.hxword \.hxword-tabs \.hxword-menu-tab\.is-file/);
});
