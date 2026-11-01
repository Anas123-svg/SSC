import { createBlockId, cloneSchema, isComplianceBlock, newBlock } from './hxcSchema.js';
import { getReportConfig } from './hxcReportConfig.js';

export const text = value => value ? [{ type: 'text', text: String(value) }] : [];
export const paragraph = value => ({ type: 'paragraph', content: text(value) });
const heading = (value, level = 2, configKey) => ({ type: 'heading', attrs: { level, configKey }, content: text(value) });
const valueNode = (key, label, kind = 'text') => ({ type: 'hxcValue', attrs: { answerKey: key, label, kind } });
const cell = (content, header = false) => ({ type: header ? 'tableHeader' : 'tableCell', content: [typeof content === 'string' ? paragraph(content) : { type: 'paragraph', content: [content] }] });
const table = (headers, rows) => ({ type: 'table', content: [
  ...(headers ? [{ type: 'tableRow', content: headers.map(h => cell(h, true)) }] : []),
  ...rows.map(row => ({ type: 'tableRow', content: row.map(c => cell(c)) })),
] });
export const nodeText = node => node.type === 'text' ? node.text : (node.content || []).map(nodeText).join(node.type === 'doc' ? '\n' : '');
export const fieldNodeNames = ['hxcComplianceField', 'hxcInspectionField', 'hxcSignatureField', 'hxcEvidenceField', 'hxcResponseTable', 'hxcRichText', 'hxcGroup'];
export const fieldNodeName = block => block.type === 'richtext' ? 'hxcRichText' : ['row', 'columns'].includes(block.type) ? 'hxcGroup' : isComplianceBlock(block) ? 'hxcComplianceField' : ({ signature: 'hxcSignatureField', photo: 'hxcEvidenceField', table: 'hxcResponseTable' }[block.type] || 'hxcInspectionField');
const reportFingerprint = config => JSON.stringify(Object.fromEntries(Object.entries(config).filter(([key])=>!['editorDocument','editorReportParts','editorPage'].includes(key))));

export function blockToNode(block, sectionId, parseHTML = () => [paragraph('')]) {
  let content = block.documentContent && block.documentContent.map(nodeText).join('\n') === block.label ? block.documentContent : [paragraph(block.label)];
  if (block.type === 'richtext') content = block.documentContent || parseHTML(block.html || '<p></p>');
  if (['row', 'columns'].includes(block.type)) content = (block.children || []).map(b => blockToNode(b, sectionId, parseHTML));
  return { type: fieldNodeName(block), attrs: { fieldId: block.id, sectionId, definition: { ...block, documentContent: undefined, children: undefined } }, content: content.length ? content : [paragraph('')] };
}

/** The schema remains authoritative. Editor JSON stores formatting, not inspection responses. */
export function schemaToDocument(schema, configInput, parseHTML) {
  const c = getReportConfig(configInput);
  const report = (key, content) => ({ type: 'hxcReport', attrs: { part: key }, content });
  const meta = Object.entries(c.metadataLabels).map(([key, label]) => [label, valueNode(`meta:${key}`, label)]);
  meta.push(...c.metadataExtra.map(f => [f.label, valueNode(`meta:custom:${f.id}`, f.label, f.type)]));
  const content = [report('cover', [
    ...(c.logoMode === 'none' ? [] : [{ type: 'image', attrs: { src: c.logoMode === 'custom' && c.logoData ? c.logoData : '/harmonix-logo.png', alt: 'Harmonix', width: 180 } }]),
    heading(c.title, 1, 'title'), { ...paragraph(c.subtitle), attrs: { configKey: 'subtitle' } }, table(null, meta),
    ...(c.showMethod ? [heading(c.methodTitle, 2, 'methodTitle'), table(['Method', 'Guidance'], c.methods.map(m => [m.label, m.description]))] : []),
    ...(c.showRatingBands ? [table(c.bands.map(b => b.label), [c.bands.map(b => b.description)])] : []),
  ])];
  schema.forEach(s => {
    content.push({ type: 'hxcSection', attrs: { sectionId: s.id }, content: s.headingContent?.map(nodeText).join('') === s.title ? s.headingContent : text(s.title) });
    content.push({ type: 'hxcDescription', attrs: { sectionId: s.id }, content: s.descriptionContent?.map(nodeText).join('') === s.description ? s.descriptionContent : text(s.description) });
    content.push(...s.blocks.map(b => { const node=blockToNode(b, s.id, parseHTML);node.attrs.columns=c.checklistColumns;return node; }));
    content.push({ type: 'hxcScoreField', attrs: { sectionId: s.id, label: c.sectionScoreLabel } });
  });
  if (c.showSummary) content.push(report('summary', [heading(c.summaryTitle, 2, 'summaryTitle'), table(c.summaryColumns.map(x => x.label), schema.map(s => c.summaryColumns.map(col => col.id === 'section' ? s.title : valueNode(col.id === 'concern' ? `summary:${s.id}:concern` : `section:${s.id}:${col.id}`, col.id === 'score' ? '— / 10' : col.label)))), {type:'paragraph',content:[...text('Overall compliance: '),valueNode('computed:score','— %'),...text(' · '),valueNode('computed:rating','Overall rating')]}, paragraph(c.positiveLabel), {type:'paragraph',content:[valueNode('summary:positive','Positive observations')]}, paragraph(c.concernsLabel), {type:'paragraph',content:[valueNode('summary:concerns','Priority concerns and immediate actions')]}]));
  if (c.showActionTracker) content.push(report('actions', [heading(c.trackerTitle, 2, 'trackerTitle'), table(c.trackerColumns.map(x => x.label), Array.from({ length: Number(c.trackerRows) }, (_, i) => c.trackerColumns.map(col => col.id === 'ref' ? String(i + 1) : valueNode(`action:${i + 1}:${col.id}`, col.label, col.type))))]));
  if (c.showDeclaration) content.push(report('declaration', [heading(c.declarationTitle, 2, 'declarationTitle'), { ...paragraph(c.declarationText), attrs: { configKey: 'declarationText' } }, table(null, [
    [c.assessorLabel, valueNode('meta:declarationAssessor', c.assessorLabel), valueNode('meta:assessorSignature', 'Signature', 'signature')],
    [c.managerLabel, valueNode('meta:declarationManager', c.managerLabel), valueNode('meta:managerSignature', 'Signature', 'signature')],
    [c.reportDateLabel, valueNode('meta:reportDate', 'Date', 'date'), valueNode('meta:nextReview', c.nextReviewLabel, 'date')],
  ])]));
  if (c.showAppendix) content.push(report('appendix', [heading(c.appendixTitle, 2, 'appendixTitle'), { ...paragraph(c.appendixDescription), attrs: { configKey: 'appendixDescription' } }, table(c.appendixColumns.map(x => x.label), Array.from({ length: Number(c.appendixRows) }, (_, i) => c.appendixColumns.map(col => col.id === 'ref' ? `A${String(i + 1).padStart(2, '0')}` : valueNode(`appendix:A${String(i + 1).padStart(2, '0')}:${col.id}`, col.label, col.id === 'photo' ? 'photo' : col.type))))]));
  const fingerprint=reportFingerprint(c);
  return { type: 'doc', content: content.map(node=>node.type==='hxcReport' && node.attrs.part!=='summary' && c.editorReportParts?.[node.attrs.part]?.fingerprint===fingerprint ? cloneSchema(c.editorReportParts[node.attrs.part].node) : node) };
}

/** Lossless updates by ID, including nested definitions and custom properties. */
export function documentToSchema(document, previous, serialize = () => '') {
  const originals = new Map();
  const visit = blocks => blocks.forEach(b => { originals.set(b.id, b); visit(b.children || []); });
  previous.forEach(s => visit(s.blocks));
  const sections = [];
  let section;
  const fromNode = node => {
    const original = originals.get(node.attrs.fieldId) || node.attrs.definition;
    if (!original) throw new Error('An HXC field has no definition. Use Fields & structure to repair it.');
    const block = { ...cloneSchema(original), ...cloneSchema(node.attrs.definition), id: node.attrs.fieldId };
    if (node.type === 'hxcGroup') block.children = node.content.filter(n => fieldNodeNames.includes(n.type)).map(fromNode);
    else {
      block.documentContent = cloneSchema(node.content || []);
      if (block.type === 'richtext') block.html = serialize(node.content);
      else block.label = (node.content || []).map(nodeText).join('\n');
    }
    return block;
  };
  for (const node of document.content || []) {
    if (node.type === 'hxcSection') {
      const old = previous.find(s => s.id === node.attrs.sectionId);
      section = { ...old, id: node.attrs.sectionId, title: nodeText(node), headingContent: cloneSchema(node.content || []), blocks: [] };
      sections.push(section);
    } else if (node.type === 'hxcDescription' && section) {
      section.description = nodeText(node); section.descriptionContent = cloneSchema(node.content || []);
    } else if (fieldNodeNames.includes(node.type) && section) section.blocks.push(fromNode(node));
    else if (section && !['hxcReport', 'hxcScoreField'].includes(node.type)) {
      const id = node.attrs?.documentBlockId || createBlockId();
      node.attrs = { ...node.attrs, documentBlockId: id };
      section.blocks.push({ ...newBlock('richtext'), id, html: serialize([node]), documentContent: [cloneSchema(node)] });
    }
  }
  if (!sections.length) throw new Error('The document has no HXC sections. The saved template has not been replaced.');
  return sections;
}

export function configFromDocument(document, config) {
  const next = cloneSchema(config);
  const walk = node => { if (node.attrs?.configKey && typeof config[node.attrs.configKey] === 'string') next[node.attrs.configKey] = nodeText(node); (node.content || []).forEach(walk); };
  walk(document);
  const firstChecklist=(document.content||[]).find(n=>n.type==='hxcComplianceField' && Array.isArray(n.attrs?.columns));
  if(firstChecklist)next.checklistColumns=cloneSchema(firstChecklist.attrs.columns);
  const parts=(document.content||[]).filter(n=>n.type==='hxcReport');
  const rows=table=>table?.content||[];
  const value=cell=>nodeText(cell||{});
  const columns=(table,list)=>list.map((col,i)=>({...col,label:value(rows(table)[0]?.content?.[i])||col.label}));
  for(const part of parts){
    const tables=part.content.filter(n=>n.type==='table');
    if(part.attrs.part==='cover'){
      const metadata=rows(tables[0]);Object.keys(next.metadataLabels).forEach((key,i)=>{next.metadataLabels[key]=value(metadata[i]?.content?.[0])||next.metadataLabels[key];});
      next.metadataExtra=next.metadataExtra.map((entry,i)=>({...entry,label:value(metadata[Object.keys(next.metadataLabels).length+i]?.content?.[0])||entry.label}));
      if(next.showMethod)next.methods=next.methods.map((m,i)=>({...m,label:value(rows(tables[1])[i+1]?.content?.[0])||m.label,description:value(rows(tables[1])[i+1]?.content?.[1])||m.description}));
      if(next.showRatingBands){const bands=tables[next.showMethod?2:1];next.bands=next.bands.map((b,i)=>({...b,label:value(rows(bands)[0]?.content?.[i])||b.label,description:value(rows(bands)[1]?.content?.[i])||b.description}));}
    }
    if(part.attrs.part==='summary')next.summaryColumns=columns(tables[0],next.summaryColumns);
    if(part.attrs.part==='actions')next.trackerColumns=columns(tables[0],next.trackerColumns);
    if(part.attrs.part==='appendix')next.appendixColumns=columns(tables[0],next.appendixColumns);
  }
  const fingerprint=reportFingerprint(next);next.editorReportParts=Object.fromEntries(parts.map(node=>[node.attrs.part,{fingerprint,node:cloneSchema(node)}]));
  return next;
}

/** Derived summary rows follow section IDs while preserving notes and styling. */
export function synchronizeSummary(document, schema, config) {
  const part=document.content.find(n=>n.type==='hxcReport'&&n.attrs.part==='summary');
  const summary=part?.content.find(n=>n.type==='table');if(!summary)return document;
  const generated=schemaToDocument(schema,{...config,editorReportParts:{}},()=>[paragraph('')]).content.find(n=>n.type==='hxcReport'&&n.attrs.part==='summary')?.content.find(n=>n.type==='table');
  if(!generated)return document;
  const existing=new Map();
  for(const row of summary.content.slice(1)){let id;const walk=node=>{const key=node.attrs?.answerKey;if(key?.startsWith('section:'))id=key.slice(8,key.lastIndexOf(':'));(node.content||[]).forEach(walk);};walk(row);if(id)existing.set(id,row);}
  summary.content=[summary.content[0],...schema.map((s,i)=>{const row=cloneSchema(existing.get(s.id)||generated.content[i+1]);const index=config.summaryColumns.findIndex(c=>c.id==='section');if(index>=0)row.content[index].content=[paragraph(s.title)];return row;})];
  return document;
}

export function duplicateDocumentSection(document, sectionId) {
  const content = document.content, start = content.findIndex(n => n.type === 'hxcSection' && n.attrs.sectionId === sectionId);
  if (start < 0) return document;
  let end = start + 1;
  while (end < content.length && !['hxcSection', 'hxcReport'].includes(content[end].type)) end++;
  const nodes = cloneSchema(content.slice(start, end)), nextId = createBlockId();
  const remap = node => { if (node.attrs?.sectionId) node.attrs.sectionId = nextId; if (node.attrs?.fieldId) { node.attrs.fieldId = createBlockId(); if (node.attrs.definition) node.attrs.definition.id = node.attrs.fieldId; } if (node.attrs?.documentBlockId) node.attrs.documentBlockId = createBlockId(); (node.content || []).forEach(remap); };
  nodes.forEach(remap); nodes[0].content.push(...text(' (copy)'));
  return { ...document, content: [...content.slice(0, end), ...nodes, ...content.slice(end)] };
}

