import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMPLIANCE_CODES, getComplianceLabels, getCellHint, checklistColumns } from '../src/features/templates/hxcEditableChecklist.js';
import { schemaToDocument, documentToSchema, configFromDocument } from '../src/features/templates/hxcDocumentModel.js';
import { DEFAULT_HXC_SCHEMA } from '../src/features/templates/hxcSchema.js';
import { DEFAULT_REPORT_CONFIG } from '../src/features/templates/hxcReportConfig.js';

const source = name => readFileSync(new URL(`../src/features/templates/${name}`, import.meta.url), 'utf8');

test('compliance choices retain stable safety codes while labels are editable', () => {
  assert.deepEqual(COMPLIANCE_CODES, ['C','MI','MA','N/A']);
  const labels=getComplianceLabels({ complianceLabels:{ C:'Fully compliant',MI:'Needs improvement' } });
  assert.equal(labels.C, 'Fully compliant');
  assert.equal(labels.MI, 'Needs improvement');
  assert.equal(labels.MA, 'Major issue');
});

test('evidence, action and custom column placeholders have independent metadata', () => {
  const block={ evidenceHint:'Site evidence', evidencePlaceholder:'Appendix A-01', actionPlaceholder:'Action ref code',columnPlaceholders:{'custom-1':'Owner initials'} };
  assert.equal(getCellHint(block,'evidence','Evidence'),'Appendix A-01');
  assert.equal(getCellHint(block,'action','Action'),'Action ref code');
  assert.equal(getCellHint(block,'custom-1','Custom'),'Owner initials');
  assert.ok(checklistColumns([{id:'compliance',label:'Result'}]).some(c=>c.id==='requirement'));
});

test('HXC checklist customizations round-trip by original field IDs', () => {
  const sections=JSON.parse(JSON.stringify(DEFAULT_HXC_SCHEMA));
  const original=sections[0].blocks[0];
  const doc=schemaToDocument(sections,DEFAULT_REPORT_CONFIG,()=>[{type:'paragraph'}]);
  const item=doc.content.find(n=>n.attrs?.fieldId===original.id);
  assert.ok(item);
  item.attrs.definition={...item.attrs.definition, complianceLabels:{C:'Pass',MI:'Minor',MA:'Major','N/A':'Not relevant'}, previewCompliance:'C', evidencePlaceholder:'Appendix 7', actionPlaceholder:'CA-01'};
  item.attrs.columns=item.attrs.columns.map(c=>c.id==='action'?{...c,label:'Corrective action ID'}:c);
  const saved=documentToSchema(doc,sections,()=>'<p></p>');
  assert.equal(saved[0].blocks[0].id,original.id);
  assert.equal(saved[0].blocks[0].previewCompliance,'C');
  assert.equal(saved[0].blocks[0].evidencePlaceholder,'Appendix 7');
  assert.equal(saved[0].blocks[0].actionPlaceholder,'CA-01');
  assert.equal(saved[0].blocks[0].complianceLabels.C,'Pass');
  assert.equal(configFromDocument(doc,DEFAULT_REPORT_CONFIG).checklistColumns.find(c=>c.id==='action').label,'Corrective action ID');
  assert.equal(saved[0].blocks[0].answers,undefined,'no inspection answers belong in the template');
});

test('document editor exposes real editable template cells and preserves inspection answer separation', () => {
  const ext=source('documentExtensions.js');
  const workspace=source('WordTemplateWorkspace.jsx');
  const report=source('HxcReportDocument.jsx');
  assert.match(ext,/makeComplianceNodeView/);
  assert.match(ext,/makeValueNodeView/);
  assert.match(workspace,/CompliancePaletteEditor/);
  assert.match(source('CompliancePaletteEditor.jsx'),/Compliance dropdown colors/);
  assert.match(workspace,/Evidence \/ Appendix Ref\. placeholder/);
  assert.match(workspace,/Action Ref\. placeholder/);
  assert.match(report,/getCellHint\(block,col.id,col.label\)/);
});
