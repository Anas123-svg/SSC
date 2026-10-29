import { hxcTemplate } from './hxcTemplate.js';
const STORE = 'harmonix-hxc-audits-v2';
const dateToday = () => new Date().toLocaleDateString('en-CA');
const formatDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const uid = () => Math.random().toString(36).slice(2, 10);
const blankResponse = () => ({ status: '', note: '', evidenceRef: '', photos: [], actionRef: '' });
const createBlank = () => ({ id: 'HXC-' + Date.now().toString(36).toUpperCase() + '-' + uid().slice(0, 4), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), state: 'Draft', demo: false, meta: { projectName: '', siteAddress: '', assessmentDate: dateToday(), assessor: '', projectManager: '', type: 'Monthly' }, responses: {}, sections: {}, actions: [], positives: '', priorities: '', reportDate: dateToday(), nextReview: '', assessorSign: '', managerSign: '', assessorConfirmed: false, managerConfirmed: false, completedAt: null });
function makeExamples() {
  const a = createBlank(); a.id = 'HXC-DEMO-001'; a.demo = true; a.meta = { projectName: 'HXC Riverside Scheme · SAMPLE', siteAddress: 'Fictional UK project — demonstration only', assessmentDate: '2026-10-17', assessor: 'Tony Turner', projectManager: 'Example Site Manager', type: 'Monthly' };
  const score = [9, 8, 7, 8, 9, 7, 8, 8, 7, 9];
  for (const section of hxcTemplate) {
    a.sections[section.id] = { score: score[section.id - 1], na: false, rationale: `Demonstration judgement for ${section.title.toLowerCase()}. Verify all real-site evidence before completing an actual inspection.`, strength: '' };
    for (const item of section.items) { a.responses[item.id] = { ...blankResponse(), status: 'C', note: 'Demonstration observation only. No real site condition has been verified.' } ;}
  }
  const issues = [['1.4', 'MI', 'Confirm end-of-shift gate security procedure', 'Medium'], ['6.2', 'MA', 'Install and verify edge protection before access', 'Critical'], ['9.3', 'MI', 'Record inspection evidence for fire-stopping', 'High']];
  issues.forEach(([itemId, status, requiredAction, priority], i) => {
    const ref = `DEMO-ACT-${String(i + 1).padStart(2, '0')}`;
    a.responses[itemId] = { ...a.responses[itemId], status, note: 'Illustrative finding only; not an actual site observation.', actionRef: ref };
    a.actions.push({ id: ref, itemId, finding: hxcTemplate.flatMap(s => s.items).find(x => x.id === itemId)?.requirement || '', requiredAction, priority, owner: 'Example Site Manager', targetDate: '2026-10-30', closedOn: '', verifiedBy: '', status: 'Open' });
  });
  a.positives = 'Sample: Illustrative strong standards in presentation, welfare and management controls.';
  a.priorities = 'Sample: Illustrative major issue in edge protection, requiring urgent attention.';
  const b = createBlank(); b.id = 'HXC-DEMO-002'; b.demo = true; b.meta = { projectName: 'HXC Central Works · SAMPLE', siteAddress: 'Fictional UK project — demonstration only', assessmentDate: '2026-10-21', assessor: 'Tony Turner', projectManager: 'Example Project Manager', type: 'Follow-up' };
  b.responses['1.1'] = { ...blankResponse(), status: 'C', note: 'Demonstration observation only.' };
  return [a, b];
}
const storageKey = workspaceId => workspaceId === 'admin' ? STORE : `${STORE}-${workspaceId}`;
const parseSaved = (workspaceId = 'admin') => {
  const seed = workspaceId === 'admin' ? makeExamples : () => [];
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    const list = raw ? JSON.parse(raw) : seed();
    return Array.isArray(list) ? list : seed();
  } catch { return seed(); }
};
const allItems = hxcTemplate.flatMap(s => s.items);
const itemById = Object.fromEntries(allItems.map(i => [i.id, i]));
const sectionByItem = Object.fromEntries(hxcTemplate.flatMap(s => s.items.map(i => [i.id, s])));
const scoreLabel = n => { if (n == null || Number.isNaN(Number(n))) return 'Not scored'; const v = Number(n); if (v >= 9) return 'Excellent'; if (v >= 7) return 'Good'; if (v >= 5) return 'Improvement required'; if (v >= 3) return 'Unsatisfactory'; return 'Immediate intervention' ;};
const computed = a => { const assessed = hxcTemplate.filter(s => a.sections?.[s.id]?.na !== true && a.sections?.[s.id]?.score !== '' && a.sections?.[s.id]?.score != null).map(s => Number(a.sections[s.id].score)); const score = assessed.length ? Math.round((assessed.reduce((p, c) => p + c, 0) / assessed.length) * 10 * 10) / 10 : null; const answered = allItems.filter(i => a.responses?.[i.id]?.status).length; const issues = allItems.filter(i => ['MI', 'MA'].includes(a.responses?.[i.id]?.status)).length; return { score, answered, issues, applicable: assessed.length, open: (a.actions || []).filter(x => x.status !== 'Closed').length } ;};
function validate(a) {  
const errors = [];
  for (const [key, label] of [['projectName', 'Project name'], ['siteAddress', 'Site address'], ['assessmentDate', 'Assessment date'], ['assessor', 'Assessor'], ['projectManager', 'Project manager met']]) if (!a.meta?.[key]?.trim()) errors.push(`${label} is required.`);
  for (const section of hxcTemplate) {
    const sec = a.sections?.[section.id] || {};
    const responses = section.items.map(i => a.responses?.[i.id] || {});
    if (responses.some(r => !r.status)) errors.push(`Section ${section.id}: assess every checklist item.`);
    if (sec.na) { if (responses.some(r => r.status !== 'NA')) errors.push(`Section ${section.id}: every item must be N/A when the whole section is excluded.`) ;}
    else { if (sec.score == null || sec.score === '') errors.push(`Section ${section.id}: assign an auditor score from 0 to 10.`); else if (!Number.isInteger(Number(sec.score)) || Number(sec.score) < 0 || Number(sec.score) > 10) errors.push(`Section ${section.id}: score must be a whole number from 0 to 10.`); if (!String(sec.rationale || '').trim()) errors.push(`Section ${section.id}: add auditor rationale.`) ;}
  }
  for (const item of allItems) {    
const response = a.responses?.[item.id] || {};
    if (['C', 'MI', 'MA'].includes(response.status) && !response.note?.trim() && !response.evidenceRef?.trim() && !response.photos?.length) errors.push(`${item.ref}: add evidence, a note, or an appendix reference.`);
    if (['MI', 'MA'].includes(response.status)) { const action = (a.actions || []).find(x => x.id === response.actionRef && x.itemId === item.id); if (!action) errors.push(`${item.ref}: ${response.status} requires a linked corrective action.`); else if (!action.requiredAction?.trim() || !action.owner?.trim() || !action.targetDate || !action.priority) errors.push(`${item.ref}: complete the corrective action details.`); else if (action.status === 'Closed' && (!action.closedOn || !action.verifiedBy?.trim())) errors.push(`${item.ref}: closed actions need a close-out date and verifier.`) ;}
    if (item.evidenceHint.toLowerCase().includes('photos needed') && response.status !== 'NA' && !response.photos?.length) errors.push(`${item.ref}: Tony's template explicitly requests photographs.`);
  }
  if (!a.assessorSign?.trim() || !a.managerSign?.trim() || !a.assessorConfirmed || !a.managerConfirmed) errors.push('Both assessor and project manager must acknowledge the declaration.');
  return errors;
}
export { STORE, storageKey, dateToday, formatDate, uid, blankResponse, createBlank, parseSaved, allItems, itemById, sectionByItem, scoreLabel, computed, validate };
