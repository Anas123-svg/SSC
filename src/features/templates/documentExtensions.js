import { paletteVariableStyle } from './hxcComplianceColors.js';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { Plugin } from '@tiptap/pm/state';
import { fieldNodeNames } from './hxcDocumentModel.js';
import { createBlockId } from './hxcSchema.js';
import { checklistColumns, getCellHint, getComplianceLabels, COMPLIANCE_CODES, makeComplianceNodeView, makeValueNodeView, makeScoreNodeView } from './hxcEditableChecklist.js';

const sectionAttr = { default: '', parseHTML: el => el.getAttribute('data-section-id'), rendered: false };
const fieldAttrs = () => ({ fieldId: { default: '', rendered: false }, sectionId: sectionAttr, definition: { default: {}, rendered: false }, columns: { default: null, rendered: false } });
const placeholder = (key, label, kind = 'text') => ['span', { 'data-answer-key': key, 'data-kind': kind, class: 'hxc-value', contenteditable: 'false' }, label];
const basicField = name => Node.create({
  name, group: 'block', content: 'block+', defining: true, isolating: true,
  addAttributes: fieldAttrs,
  parseHTML: () => [{ tag: `div[data-hxc-node="${name}"]` }],
  renderHTML({ node }) {
    const { fieldId, sectionId, definition: b = {} } = node.attrs;
    const attrs = { 'data-hxc-node': name, 'data-field-id': fieldId, 'data-section-id': sectionId, class: `hxc-field ${name}` };
    if (name === 'hxcRichText' || name === 'hxcGroup') return ['div', attrs, 0];
    if (name === 'hxcComplianceField') {
      const visible = checklistColumns(node.attrs.columns);
      return ['div', attrs, ['table', { class: 'hxc-checklist' }, ['colgroup', ...visible.map(c=>['col',{style:`width:${({ref:7,requirement:43,compliance:16,evidence:24,action:10})[c.id]||15}%`}])], ['thead',{},['tr',{},...visible.map(c=>['th',{contenteditable:'false'},c.label])]], ['tbody', ['tr', ...visible.map(c=>c.id==='requirement'?['td',{class:'hxc-label'},0]:c.id==='ref'?['td',{class:'hxc-ref',contenteditable:'false'},b.ref||'—']:['td',{contenteditable:'false'},(c.id==='compliance' ? ['span',{ 'data-answer-key':fieldId,'data-kind':'compliance','data-compliance':COMPLIANCE_CODES.includes(b.previewCompliance)?b.previewCompliance:'',class:'hxc-value hxc-compliance-display',style:paletteVariableStyle(b),contenteditable:'false'},(b.previewCompliance ? `${b.previewCompliance} — ${getComplianceLabels(b)[b.previewCompliance] || b.previewCompliance} (template preview)` : COMPLIANCE_CODES.join(' / '))] : placeholder(`${fieldId}:${['evidence','action'].includes(c.id)?c.id:`column:${c.id}`}`,getCellHint(b,c.id,c.label),'text'))])]]]];
    }
    const children = [['div', { class: 'hxc-label' }, 0]];
    if (b.type === 'table') children.push(['table',{'data-answer-table':fieldId,contenteditable:'false'},['thead',{},['tr',{},...(b.columns||[]).map(col=>['th',{},col])]],['tbody',{},...Array.from({length:Math.max(1,Number(b.rows)||1)},(_,i)=>['tr',{},...(b.columns||[]).map((col,j)=>['td',{},placeholder(`${fieldId}:row:${i}:${j}`,'________')])])]]);
    else if (!['heading', 'paragraph', 'list', 'divider'].includes(b.type)) children.push(['div', { contenteditable: 'false', class: 'hxc-field-response' }, placeholder(fieldId, b.type === 'signature' ? 'Signature ____________________' : b.type === 'photo' ? 'Photo evidence · attach during inspection' : b.answerPlaceholder || (b.options || []).join(' / ') || `[${b.type || 'text'}]`, b.type)]);
    if (b.type === 'list') children.push(['ul', { contenteditable: 'false' }, ...(b.options || []).map(v => ['li', {}, v])]);
    if (b.type === 'divider') children.push(['hr']);
    return ['div', attrs, ...children];
  },
  ...(name === 'hxcComplianceField' ? {addNodeView(){ return ({ node, view, getPos }) => makeComplianceNodeView(node, view, getPos); }} : {}),
});
const HxcSection = Node.create({ name: 'hxcSection', group: 'block', content: 'inline*', defining: true,
  addAttributes: () => ({ sectionId: sectionAttr }), parseHTML: () => [{ tag: 'h2[data-section-id]' }],
  renderHTML: ({ node, HTMLAttributes }) => ['h2', mergeAttributes(HTMLAttributes, { 'data-section-id': node.attrs.sectionId, 'data-hxc-section': '', class: 'hxc-section-heading' }), 0],
  addKeyboardShortcuts(){return {Enter:()=>{const {$from}=this.editor.state.selection;if($from.parent.type.name!=='hxcSection')return false;const at=$from.after();return this.editor.chain().insertContentAt(at,{type:'paragraph'}).setTextSelection(at+1).run();}};},
});
const HxcDescription = Node.create({ name: 'hxcDescription', group: 'block', content: 'inline*',
  addAttributes: () => ({ sectionId: sectionAttr }), parseHTML: () => [{ tag: 'p[data-section-description]' }],
  renderHTML: ({ node, HTMLAttributes }) => ['p', mergeAttributes(HTMLAttributes, { 'data-section-description': node.attrs.sectionId, class: 'hxc-section-description' }), 0],
});
const HxcScore = Node.create({ name: 'hxcScoreField', group: 'block', atom: true,
  addAttributes: () => ({ sectionId: sectionAttr, label: { default: 'SCORE AND AUDITOR RATIONALE' }, scorePlaceholder:{default:'— / 10 or N/A'}, rationalePlaceholder:{default:'Auditor rationale'}, openPlaceholder:{default:'Open actions: —'} }), parseHTML: () => [{ tag: '[data-hxc-score]' }],
  renderHTML: ({ node }) => ['div', { 'data-hxc-score': node.attrs.sectionId, class: 'hxc-score', contenteditable: 'false' }, ['strong', {}, node.attrs.label], placeholder(`section:${node.attrs.sectionId}:score`, node.attrs.scorePlaceholder, 'score'), placeholder(`section:${node.attrs.sectionId}:rationale`, node.attrs.rationalePlaceholder), placeholder(`section:${node.attrs.sectionId}:open`, node.attrs.openPlaceholder)],
  addNodeView(){return ({node,view,getPos})=>makeScoreNodeView(node,view,getPos);},
});
const HxcValue = Node.create({ name: 'hxcValue', group: 'inline', inline: true, atom: true,
  addAttributes: () => ({ answerKey: { default: '' }, label: { default: 'Field' }, kind: { default: 'text' } }), parseHTML: () => [{ tag: 'span[data-answer-key]' }],
  renderHTML: ({ node }) => placeholder(node.attrs.answerKey, node.attrs.label, node.attrs.kind),
  addNodeView(){ return ({node,view,getPos})=>makeValueNodeView(node,view,getPos); },
});
const HxcReport = Node.create({ name: 'hxcReport', group: 'block', content: 'block+', defining: true, isolating: true,
  addAttributes: () => ({ part: { default: '' } }), parseHTML: () => [{ tag: 'section[data-report-part]' }],
  renderHTML: ({ node }) => ['section', { 'data-report-part': node.attrs.part }, 0],
});
const PageBreak = Node.create({ name: 'pageBreak', group: 'block', atom: true,
  parseHTML: () => [{ tag: 'div[data-page-break]' }], renderHTML: () => ['div', { 'data-page-break': '', class: 'hxc-page-break', contenteditable: 'false' }, 'Page break'],
});
const formatting = Extension.create({ name: 'documentFormatting', addGlobalAttributes: () => [
  { types: ['paragraph', 'heading', 'hxcSection', 'hxcDescription', 'blockquote', 'table', 'image', 'pageBreak'], attributes: {
    documentBlockId: { default: null, rendered: false }, configKey: { default: null, rendered: false },
    lineHeight: { default: null, parseHTML: el => el.style.lineHeight, renderHTML: a => a.lineHeight ? { style: `line-height:${a.lineHeight}` } : {} },
    spaceAfter: { default: null, parseHTML: el => el.style.marginBottom, renderHTML: a => a.spaceAfter ? { style: `margin-bottom:${a.spaceAfter}` } : {} },
    indent: { default: 0, parseHTML: el => parseInt(el.style.marginLeft) || 0, renderHTML: a => a.indent ? { style: `margin-left:${a.indent}px` } : {} },
  } },
  { types: ['textStyle'], attributes: { fontWeight: { default: null, parseHTML: el => el.style.fontWeight, renderHTML: a => a.fontWeight ? { style: `font-weight:${a.fontWeight}` } : {} } } },
  { types: ['tableCell', 'tableHeader'], attributes: Object.fromEntries(['backgroundColor','borderColor','borderWidth','padding','verticalAlign'].map(key => [key, { default: null, parseHTML: el => el.style[key], renderHTML: a => a[key] ? { style: `${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${a[key]}` } : {} }])) },
] });
const DocumentImage = Image.extend({ addAttributes() { return { ...this.parent?.(), width: { default: 240, parseHTML: el => Number(el.getAttribute('width')) || 240 }, align: { default: 'left', parseHTML: el => el.getAttribute('data-align') || 'left', renderHTML: a => ({ 'data-align': a.align, style: `display:block;margin-left:${a.align === 'left' ? '0' : 'auto'};margin-right:${a.align === 'right' ? '0' : 'auto'}` }) } }; } }).configure({ allowBase64: true });
// Only explicit structural commands may erase HXC identifiers. Normal typing,
// formatting, and copy/paste cannot silently disconnect questions from answers.
const StructureGuard = Extension.create({ name: 'hxcStructureGuard', addProseMirrorPlugins() {
  return [new Plugin({ appendTransaction(transactions, oldState, state) {
    if (!transactions.some(tr=>tr.docChanged)) return null;
    const tr=state.tr, seen=new Set();
    state.doc.descendants((node,pos)=>{if(!Object.hasOwn(node.attrs,'documentBlockId'))return;const id=node.attrs.documentBlockId;if(!id||seen.has(id))tr.setNodeMarkup(pos,undefined,{...node.attrs,documentBlockId:createBlockId()});else seen.add(id);});
    return tr.docChanged?tr.setMeta('addToHistory',false):null;
  }, filterTransaction(tr, state) {
    if (!tr.docChanged || tr.getMeta('hxcStructure') || tr.getMeta('history$')) return true;
    const ids = doc => { const result = []; doc.descendants(n => { if (n.attrs.fieldId) result.push(`field:${n.attrs.fieldId}`); if (n.type.name === 'hxcSection') result.push(`section:${n.attrs.sectionId}`); if (n.type.name === 'hxcValue') result.push(`value:${n.attrs.answerKey}`); }); return result; };
    const before = ids(state.doc), after = ids(tr.doc);
    return new Set(after).size === after.length && before.every(id => after.includes(id));
  } })];
} });
export function documentExtensions() {
  return [StarterKit.configure({ link: { openOnClick: false, protocols: ['https', 'http', 'mailto'], isAllowedUri: url => /^(https?:\/\/|mailto:)/i.test(url) } }), TextStyleKit, TextAlign.configure({ types: ['heading', 'paragraph', 'hxcSection', 'hxcDescription'] }), Highlight.configure({ multicolor: true }), Subscript, Superscript, Table.configure({ resizable: true }), TableRow, TableCell, TableHeader, DocumentImage, formatting, HxcSection, HxcDescription, HxcScore, HxcValue, HxcReport, PageBreak, ...fieldNodeNames.map(basicField), StructureGuard];
}
