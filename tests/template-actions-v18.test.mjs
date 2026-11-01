import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const catalog = read('src/pages/TemplatesPage.jsx');
const previewPage = read('src/pages/HxcTemplatePreviewPage.jsx');
const preview = read('src/features/templates/DocumentPreview.jsx');
const editor = read('src/pages/HxcTemplatePage.jsx');
const styles = read('src/styles/template-catalog-actions-v18.css');

test('template card has two independent, accessible actions', () => {
  assert.match(catalog, /className="hxc-template-catalog-card"/);
  assert.match(catalog, /<button type="button" className="hxc-template-catalog-card-action" onClick=\{\(\) => setOpened\('editor'\)\}/);
  assert.match(catalog, /Open document editor/);
  assert.match(catalog, /onClick=\{\(\) => setOpened\('preview'\)\}/);
  assert.match(catalog, /Preview template/);
  assert.match(catalog, /opened === 'editor'/);
  assert.match(catalog, /opened === 'preview'/);
  assert.doesNotMatch(catalog, /<button\s+type="button"\s+className="hxc-template-catalog-card"/);
});

test('standalone preview reads the saved template, with no editor or template writes', () => {
  assert.match(previewPage, /getHxcSchema\(template\)/);
  assert.match(previewPage, /getReportConfig\(template\)/);
  assert.match(previewPage, /config\.editorDocument/);
  assert.match(previewPage, /schemaToDocument\(schema, config, parseHTML\)/);
  assert.match(previewPage, /generateHTML\(doc, extensions\)/);
  assert.match(previewPage, /<DocumentPreview/);
  assert.match(previewPage, /savedTemplate/);
  assert.match(previewPage, /closeLabel="Back to templates"/);
  assert.doesNotMatch(previewPage, /WordTemplateWorkspace|useEditor\(|saveRecord\(|onSave=/);
});

test('preview retains actual page navigation, zoom and printing but no editing actions', () => {
  assert.match(preview, /paginateDocument\(/);
  assert.match(preview, /Previous page/);
  assert.match(preview, /Next page/);
  assert.match(preview, /Fit page/);
  assert.match(preview, /Print \/ Save as PDF/);
  assert.match(preview, /\{closeLabel\}/);
  assert.match(preview, /inspections\.length > 0/);
  assert.match(editor, /<WordTemplateWorkspace/);
  assert.match(styles, /\.hxc-template-preview-page/);
});

test('both template actions are differentiated in light/dark themes and remain responsive', () => {
  assert.match(styles, /\.hxc-template-catalog-actions/);
  assert.match(styles, /\.hxc-template-catalog-card-action--preview/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /max-width: 560px/);
  assert.match(read('src/main.jsx'), /template-catalog-actions-v18\.css/);
});
