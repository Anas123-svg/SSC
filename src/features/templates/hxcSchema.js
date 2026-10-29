import { hxcTemplate } from '../hxc/hxcTemplate.js';

export const createBlockId = () => 'block-' + (globalThis.crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2)));
export const INPUT_TYPES = [
  ['radio','Radio choice'], ['checkbox','Checkbox list'], ['select','Dropdown'], ['text','Short text'],
  ['textarea','Long text'], ['number','Number'], ['date','Date'], ['time','Time'], ['email','Email'],
  ['signature','Digital signature'], ['photo','Photo upload'], ['divider','Divider'],
  ['table','Table'], ['row','Row'], ['columns','Columns'], ['heading','Heading'], ['paragraph','Description'], ['list','Bullet list']
];
export const HXC_COMPLIANCE_OPTIONS = ['C', 'MI', 'MA', 'N/A'];
export const DEFAULT_HXC_SCHEMA = hxcTemplate.map(section => ({
  id: 'section-' + section.id,
  title: section.title,
  description: '',
  blocks: section.items.map(item => ({
    id: 'hxc-' + item.id,
    ref: item.ref?.startsWith('Additional') ? '' : (item.ref || ''),
    type: 'radio',
    label: item.requirement,
    help: item.evidenceHint || '',
    evidenceHint: item.evidenceHint || '',
    required: true,
    options: [...HXC_COMPLIANCE_OPTIONS],
  })),
}));
export const cloneSchema = schema => JSON.parse(JSON.stringify(schema));
const originalItems = new Map(DEFAULT_HXC_SCHEMA.flatMap(s => s.blocks.map(b => [b.id, b])));
/** Keep all user-edited questions while adding report-specific metadata to older saved templates. */
export const getHxcSchema = template => {
  if (!Array.isArray(template?.schema) || !template.schema.length) return cloneSchema(DEFAULT_HXC_SCHEMA);
  return cloneSchema(template.schema).map(section => ({
    ...section,
    blocks: (section.blocks || []).map(block => {
      const original = originalItems.get(block.id);
      return original ? { ...block, ref: block.ref ?? original.ref, evidenceHint: block.evidenceHint ?? block.help ?? original.evidenceHint } : block;
    }),
  }));
};
export const newBlock = (type = 'radio') => ({
  id: createBlockId(), type,
  label: type === 'heading' ? 'Section heading' : type === 'paragraph' ? 'Description text' : type === 'signature' ? 'Signature' : type === 'photo' ? 'Photo evidence' : type === 'divider' ? 'Section divider' : 'New question',
  help: '', ref: '', evidenceHint: '', required: false,
  ...(type === 'radio' ? { options: [...HXC_COMPLIANCE_OPTIONS] } : {}),
  ...(['checkbox','select'].includes(type) ? { options: ['Option 1', 'Option 2'] } : {}),
  ...(type === 'list' ? { options: ['First item', 'Second item'] } : {}),
  ...(type === 'table' ? { columns: ['Item', 'Details'], rows: 1 } : {}),
  ...(['row','columns'].includes(type) ? { children: [newBlock('text'), newBlock('text')] } : {}),
});
export const formBlocks = blocks => (blocks || []).flatMap(block => [block, ...formBlocks(block.children)]);
export const countQuestions = schema => (schema || []).reduce((n, s) => n + formBlocks(s.blocks).filter(b => !['heading','paragraph','list','row','columns','divider'].includes(b.type)).length, 0);
export const editableTypes = new Set(INPUT_TYPES.map(([type]) => type));
export function validateSchema(schema) {
  if (!Array.isArray(schema) || !schema.length) return 'Add at least one section.';
  const ids = new Set();
  for (const s of schema) {
    if (!s.id || ids.has(s.id)) return 'Section identifiers must be unique.';
    ids.add(s.id);
    if (!s.title?.trim()) return 'Each section needs a title.';
    for (const b of formBlocks(s.blocks)) {
      if (!b.id || ids.has(b.id)) return 'Question identifiers must be unique.';
      ids.add(b.id);
      if (!editableTypes.has(b.type)) return 'A question has an unsupported type.';
      if (!b.label?.trim()) return 'Every question and layout block needs a label.';
      if (['radio','checkbox','select'].includes(b.type) && !(b.options || []).some(x => x.trim())) return 'Choice questions need options.';
      if (b.type === 'table' && !(b.columns || []).some(x => x.trim())) return 'Tables need a column.';
    }
  }
  return '';
}
export const isComplianceBlock = b => b.type === 'radio' && (
  ['C','MI','MA'].every(v => (b.options || []).includes(v)) ||
  ['Compliant','Minor issue','Major issue'].every(v => (b.options || []).includes(v))
);
export const normalizeCompliance = value => ({'Compliant':'C','Minor issue':'MI','Major issue':'MA'}[value] || value);
export function completionStats(schema, answers) {
  const questions = schema.flatMap(s => formBlocks(s.blocks)).filter(b => !['heading','paragraph','list','row','columns','divider'].includes(b.type));
  return { total: questions.length, answered: questions.filter(b => {
    const a = answers?.[b.id];
    return Array.isArray(a) ? a.length > 0 : a !== '' && a !== null && a !== undefined;
  }).length };
}
/** Report rule: average manually assigned section scores, excluding N/A sections. */
export function complianceScore(schema, answers) {
  const scores = schema.map(s => answers?.[`section:${s.id}:score`]).filter(v => v !== '' && v !== 'N/A' && v != null && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 10);
  return scores.length ? Math.round(scores.reduce((sum, value) => sum + Number(value), 0) / scores.length * 10) : null;
}
export function overallRating(score) {
  if (score == null) return 'Not scored';
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Improvement required';
  if (score >= 30) return 'Unsatisfactory';
  return 'Immediate intervention';
}
export function validateCompletedHxc(schema, answers) {
  for (const section of schema) {
    const score = answers?.[`section:${section.id}:score`];
    if (score === '' || score == null || (score !== 'N/A' && (Number.isNaN(Number(score)) || Number(score) < 0 || Number(score) > 10))) {
      return `Enter the 0–10 score (or N/A) for ${section.title}.`;
    }
    for (const block of formBlocks(section.blocks)) {
      if (!block.required || ['heading','paragraph','list','row','columns','divider'].includes(block.type)) continue;
      const v = answers?.[block.id];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return `Complete the required check: ${block.label}.`;
      if (isComplianceBlock(block) && ['MI','MA'].includes(normalizeCompliance(v)) && !String(answers?.[`${block.id}:action`] || '').trim()) return `Add a corrective-action reference for ${block.ref || block.label}.`;
    }
  }
  if (complianceScore(schema, answers) == null) return 'At least one section needs a numerical score to calculate overall compliance.';
  return '';
}
