import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const workspace = read('src/features/templates/WordTemplateWorkspace.jsx');
const template = read('src/pages/HxcTemplatePage.jsx');
const ribbon = read('src/features/templates/DocumentRibbon.jsx');
const css = read('src/styles/word-workspace-v14.css');
const main = read('src/main.jsx');

test('HXC uses a single Word editor, without fields/structure tab or page-level outline navigation', () => {
  assert.match(template, /view === 'document' \? <WordTemplateWorkspace/);
  assert.doesNotMatch(template, /Fields & structure|hxstudio-modebar|hxstudio-sidebar|view==='builder'/);
  assert.doesNotMatch(workspace, /hxword-outline|onBuilder|PanelLeftClose|setNav\(/);
  assert.doesNotMatch(ribbon, /Navigation pane|Heading navigation/);
  assert.match(workspace, /Go to section/);
});

test('full screen button preserves mounted editor and supports native fullscreen plus CSS fallback', () => {
  assert.match(workspace, /onClick=\{toggleExpanded\}/);
  assert.match(workspace, /Expand editor to full screen/);
  assert.match(workspace, /Exit full screen/);
  assert.match(workspace, /requestFullscreen\?\./);
  assert.match(workspace, /fullscreenchange/);
  assert.match(workspace, /event\.key === 'Escape'/);
  assert.match(css, /\.hxword\.hxword-is-expanded\s*\{/);
  assert.match(css, /position:fixed!important;inset:0!important/);
});

test('Word canvas fills available screen; SSC shell is hidden only while editor is mounted', () => {
  assert.match(workspace, /classList\.add\('hxc-word-open'\)/);
  assert.match(workspace, /classList\.remove\('hxc-word-open'\)/);
  assert.match(css, /html\.hxc-word-open \.shell > \.sidebar/);
  assert.match(css, /\.hxword \.hxword-workspace\.has-properties/);
  assert.match(css, /\.hxword \.hxword-outline \{display:none!important;\}/);
  assert.ok(main.indexOf("word-template-v13.css") < main.indexOf("word-workspace-v14.css"));
});

test('existing HXC saving, paginated preview and template snapshot integration survive UI changes', () => {
  assert.match(template, /saveRecord\('templates'/);
  assert.match(template, /countQuestions\(draft\.schema\)/);
  assert.match(workspace, /const nextSchema = documentToSchema\(/);
  assert.match(workspace, /<DocumentPreview html=/);
  assert.match(workspace, /schemaSnapshot/);
  assert.match(workspace, /onInsertField=\{insertField\}/);
});
