import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMPLIANCE_PALETTE_KEYS, DEFAULT_COMPLIANCE_PALETTE, validPaletteColor,
  getCompliancePalette, hasCustomPalette, paletteVariableStyle, selectedPaletteVariables, contrastRatio, suggestedTextColor,
} from '../src/features/templates/hxcComplianceColors.js';

import { DEFAULT_HXC_SCHEMA } from '../src/features/templates/hxcSchema.js';
import { DEFAULT_REPORT_CONFIG } from '../src/features/templates/hxcReportConfig.js';
import { schemaToDocument, documentToSchema } from '../src/features/templates/hxcDocumentModel.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('compliance codes keep distinct semantic defaults, with N/A and empty white', () => {
  assert.deepEqual(COMPLIANCE_PALETTE_KEYS, ['C','MI','MA','N/A','unset']);
  assert.equal(getCompliancePalette({},'C').background, '#DAF4E6');
  assert.equal(getCompliancePalette({},'MI').background, '#FFF0C7');
  assert.equal(getCompliancePalette({},'MA').background, '#FFE0E0');
  assert.equal(getCompliancePalette({},'N/A').background, '#FFFFFF');
  assert.equal(getCompliancePalette({},'unset').background, '#FFFFFF');
});

test('field-specific colors are normalized and cannot inject CSS', () => {
  const definition = { complianceColors: { C:{background:'#123abc',text:'url(javascript:alert(1))',border:'#ffffff'}, MA:{background:'red'} } };
  assert.deepEqual(getCompliancePalette(definition,'C'), { background:'#123ABC', text:'#11603C', border:'#FFFFFF' });
  assert.equal(getCompliancePalette(definition,'MA').background, DEFAULT_COMPLIANCE_PALETTE.MA.background);
  assert.equal(validPaletteColor('#112233'),true);
  assert.equal(validPaletteColor('rgba(1,2,3,.5)'),false);
  assert.equal(validPaletteColor('#123;position:absolute'),false);
  assert.equal(hasCustomPalette(definition,'C'),true);
  assert.equal(hasCustomPalette(definition,'MA'),false);
  assert.equal(selectedPaletteVariables(definition,'C')['--hxc-selected-bg'],'#123ABC');
});

test('serialized palette variables cover changing answers in document previews', () => {
  const style = paletteVariableStyle({ complianceColors:{'N/A':{background:'#FDFDFD'}} });
  assert.match(style,/--hxc-c-bg:#DAF4E6/);
  assert.match(style,/--hxc-na-bg:#FDFDFD/);
  assert.match(style,/--hxc-unset-bg:#FFFFFF/);
  assert.doesNotMatch(style,/url\(/);
});

test('template editor provides live color swatches, per-field reset and apply-all, with persistence', () => {
  const workspace=read('src/features/templates/WordTemplateWorkspace.jsx');
  const palette=read('src/features/templates/CompliancePaletteEditor.jsx');
  const nodeView=read('src/features/templates/hxcEditableChecklist.js');
  const extension=read('src/features/templates/documentExtensions.js');
  const inspection=read('src/features/templates/HxcReportDocument.jsx');
  const css=read('src/styles/word-workspace-v16.css');
  const entry=read('src/main.jsx');
  assert.match(workspace,/CompliancePaletteEditor/);
  assert.match(workspace,/complianceColors:\s*structuredClone\(colors\)/);
  assert.match(palette,/type="color"/);
  assert.match(palette,/Reset all/);
  assert.match(nodeView,/selectedPaletteVariables/);
  assert.match(extension,/paletteVariableStyle\(b\)/);
  assert.match(inspection,/selectedPaletteVariables\(block,status\)/);
  assert.match(css,/\.hxc-compliance-display\[data-compliance="MA"\]/);
  assert.match(css,/\.hwd-compliance-select\[data-custom-colors="true"\]/);
  assert.match(entry,/word-workspace-v16\.css/);
});

test('custom dropdown colors round-trip through HXC schema with the same field ID', () => {
  const original = structuredClone(DEFAULT_HXC_SCHEMA);
  const id = original[0].blocks[0].id;
  const doc = schemaToDocument(original, DEFAULT_REPORT_CONFIG, () => [{ type:'paragraph' }]);
  const compliance = doc.content.find(node => node.attrs?.fieldId === id);
  assert.ok(compliance);
  compliance.attrs.definition = { ...compliance.attrs.definition,
    complianceColors:{ C:{background:'#112233',text:'#FFFFFF',border:'#334455'}, 'N/A':{background:'#FFFFFF',text:'#000000',border:'#CCCCCC'} },
  };
  const stored = documentToSchema(doc, original, () => '<p></p>');
  assert.equal(stored[0].blocks[0].id, id);
  assert.deepEqual(stored[0].blocks[0].complianceColors.C, {background:'#112233',text:'#FFFFFF',border:'#334455'});
  assert.equal(stored[0].blocks[0].complianceColors['N/A'].background, '#FFFFFF');
  assert.equal(stored[0].blocks[0].answers, undefined);
});

test('contrast helper identifies unreadable colors and suggests readable text', () => {
  assert.ok(contrastRatio('#FFFFFF','#FFFFFF') < 4.5);
  assert.ok(contrastRatio('#FFFFFF',suggestedTextColor('#FFFFFF')) >= 4.5);
  assert.ok(contrastRatio('#18261D',suggestedTextColor('#18261D')) >= 4.5);
});
