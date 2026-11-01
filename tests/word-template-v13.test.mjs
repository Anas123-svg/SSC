import test from 'node:test';
import assert from 'node:assert/strict';
import { getHxcSchema, newBlock, validateSchema, countQuestions } from '../src/features/templates/hxcSchema.js';
import { getReportConfig } from '../src/features/templates/hxcReportConfig.js';
import { schemaToDocument, documentToSchema, duplicateDocumentSection, configFromDocument } from '../src/features/templates/hxcDocumentModel.js';
import { migrateDatabase, upsertRecord } from '../src/data/repository.js';
import { pageGeometry } from '../src/features/templates/documentLayout.js';

test('Full document contains every original audit field and all report parts', () => {
  const schema=getHxcSchema(null),doc=schemaToDocument(schema,getReportConfig({}));
  assert.equal(doc.content.filter(n=>n.type==='hxcSection').length,10);
  assert.equal(doc.content.filter(n=>n.type==='hxcComplianceField').length,65);
  assert.deepEqual(doc.content.filter(n=>n.type==='hxcReport').map(n=>n.attrs.part),['cover','summary','actions','declaration','appendix']);
  const roundtrip=documentToSchema(doc,schema);
  assert.equal(validateSchema(roundtrip),'');
  assert.deepEqual(roundtrip.flatMap(s=>s.blocks.map(b=>[b.id,b.type,b.label,b.ref,b.options])),schema.flatMap(s=>s.blocks.map(b=>[b.id,b.type,b.label,b.ref,b.options])));
});
test('Editing a formatted requirement updates its original ID and preserves custom metadata', () => {
  const schema=getHxcSchema(null);schema[0].blocks[0].customBusinessRule={x:1};
  const doc=schemaToDocument(schema,getReportConfig({})),field=doc.content.find(n=>n.type==='hxcComplianceField');
  field.content=[{type:'paragraph',content:[{type:'text',text:'Revised safety requirement',marks:[{type:'bold'}]}]}];
  const result=documentToSchema(doc,schema);
  assert.equal(result[0].blocks[0].id,schema[0].blocks[0].id);
  assert.equal(result[0].blocks[0].label,'Revised safety requirement');
  assert.deepEqual(result[0].blocks[0].customBusinessRule,{x:1});
  assert.equal(result[0].blocks[0].documentContent[0].content[0].marks[0].type,'bold');
});
test('Nested fields and duplicated sections keep unique stable identifiers', () => {
  const schema=getHxcSchema(null);schema[0].blocks.push(newBlock('columns'));
  const doc=schemaToDocument(schema,getReportConfig({}));
  const result=documentToSchema(duplicateDocumentSection(doc,schema[0].id),schema);
  assert.equal(result.length,11);assert.equal(validateSchema(result),'');
  assert.notEqual(result[0].blocks.at(-1).children[0].id,result[1].blocks.at(-1).children[0].id);
  assert.equal(result[2].id,schema[1].id);
});
test('New narrative content is persisted as rich text without becoming an inspection question', () => {
  const schema=getHxcSchema(null),doc=schemaToDocument(schema,getReportConfig({}));
  const index=doc.content.findIndex(n=>n.type==='hxcSection');
  doc.content.splice(index+2,0,{type:'paragraph',attrs:{documentBlockId:'stable-narrative'},content:[{type:'text',text:'Site guidance'}]});
  const result=documentToSchema(doc,schema,()=>'<p>Site guidance</p>');
  assert.equal(result[0].blocks[0].id,'stable-narrative');assert.equal(result[0].blocks[0].html,'<p>Site guidance</p>');assert.equal(countQuestions(result),65);
});
test('Saving the edited template leaves completed inspection answers and snapshots unchanged', () => {
  const db=migrateDatabase({getItem:()=>null}),schema=getHxcSchema(null),reportConfig=getReportConfig({});
  db.audits.push({id:'historical',workspaceId:'harmonix',status:'Completed',schemaSnapshot:structuredClone(schema),reportConfigSnapshot:structuredClone(reportConfig),answers:{[schema[0].blocks[0].id]:'MA'}});
  const before=JSON.stringify(db.audits),doc=schemaToDocument(schema,reportConfig);
  doc.content.find(n=>n.type==='hxcComplianceField').content[0].content[0].text='Latest version';
  const next=upsertRecord(db,'templates',{...db.templates[0],schema:documentToSchema(doc,schema),reportConfig:{...reportConfig,editorDocument:doc}},'admin');
  assert.equal(JSON.stringify(next.audits),before);assert.equal(getHxcSchema(next.templates[0])[0].blocks[0].label,'Latest version');
});
test('Title mapping and physical page settings affect the actual document', () => {
  const config=getReportConfig({}),doc=schemaToDocument(getHxcSchema(null),config);
  doc.content[0].content.find(n=>n.attrs?.configKey==='title').content[0].text='Updated audit';
  assert.equal(configFromDocument(doc,config).title,'Updated audit');
  assert.equal(pageGeometry({paper:'A4',orientation:'landscape'}).width,297);
  assert.equal(pageGeometry({paper:'Letter'}).height,279.4);
  assert.equal(pageGeometry({margins:'custom',customMargins:{left:10,right:12}}).bodyWidth,188);
  assert.throws(()=>documentToSchema({type:'doc',content:[]},getHxcSchema(null)),/no HXC sections/);
});
