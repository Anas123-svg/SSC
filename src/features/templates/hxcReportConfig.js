/** Editable layout/settings for the Word-matched HXC report.
 * Persisted on the HXC template and snapshotted with new inspections. */
export const DEFAULT_REPORT_CONFIG = {
  title: 'HXC COMPLIANCE REPORT',
  showMethod: true,
  showRatingBands: true,
  showSummary: true,
  showActionTracker: true,
  showDeclaration: true,
  showAppendix: true,
  logoMode: 'default',
  logoData: '',
  metadataLabels:{projectName:'Project Name',date:'Date of Assessment',assessor:'Assessor',projectManager:'Project Manager Met',siteAddress:'Site Address',assessmentType:'Assessment Type'},
  metadataExtra:[],
  reportDateLabel:'Report Date', nextReviewLabel:'Next Review / Follow-up',
  subtitle: 'Auditor-focused inspection, section scoring and evidence record',
  footerText:'HARMONIX',
  methodTitle: 'Audit Method and Scoring',
  methods: [
    {id:'item',label:'Item compliance',description:'Select C (Compliant), MI (Minor Issue), MA (Major Issue) or N/A. Do not give individual items a numerical score.'},
    {id:'section',label:'Section score',description:'After reviewing all items in the section, assign one overall score from 0 to 10 using professional judgement and the rating guide below.'},
    {id:'evidence',label:'Evidence',description:'Record concise evidence or an Appendix reference. Any MI or MA item must have a corrective-action reference.'},
    {id:'overall',label:'Overall score',description:'Average the applicable section scores and express the result as a percentage. N/A sections are excluded.'},
  ],
  bands: [
    {id:'excellent',label:'9–10',description:'Excellent'}, {id:'good',label:'7–8',description:'Good'},
    {id:'improve',label:'5–6',description:'Improvement required'}, {id:'poor',label:'3–4',description:'Unsatisfactory'},
    {id:'urgent',label:'0–2',description:'Immediate intervention'},
  ],
  checklistColumns: [
    {id:'ref',label:'Ref'}, {id:'requirement',label:'Inspection requirement'},
    {id:'compliance',label:'Compliance'}, {id:'evidence',label:'Evidence / Appendix ref.'}, {id:'action',label:'Action ref.'},
  ],
  sectionScoreLabel:'SCORE AND AUDITOR RATIONALE',
  summaryTitle:'Audit Summary',
  summaryColumns: [
    {id:'section',label:'Section'}, {id:'score',label:'Score /10'},
    {id:'concern',label:'Key concern / strength'}, {id:'open',label:'Open actions'},
  ],
  positiveLabel:'Key positive observations',
  concernsLabel:'Priority concerns and immediate actions',
  trackerTitle:'Corrective Action Tracker',
  trackerRows:12,
  trackerColumns: [
    {id:'ref',label:'Ref'}, {id:'finding',label:'Finding / required action'},
    {id:'priority',label:'Priority'}, {id:'responsible',label:'Responsible person'},
    {id:'target',label:'Target date',type:'date'}, {id:'closeout',label:'Close-out date',type:'date'},
    {id:'verified',label:'Verified by'},
  ],
  declarationTitle:'Declaration and Close-Out',
  declarationText:'This report records conditions and evidence reviewed at the time of assessment. Site management remains responsible for maintaining compliance and completing and verifying corrective actions.',
  assessorLabel:'Assessor',
  managerLabel:'Project Manager',
  appendixTitle:'Appendix A - Supporting Information & Photos',
  appendixDescription:'Use this appendix for all supporting information, photographs and document references. Cross-reference each entry to the relevant audit item and corrective-action reference where applicable.',
  appendixRows:20,
  appendixColumns:[
    {id:'ref',label:'Appendix Ref.'}, {id:'item',label:'Audit Item'}, {id:'photo',label:'Photo'},
  ],
};
export const cloneReportConfig = input => JSON.parse(JSON.stringify(input));
export const getReportConfig = source => {
  const overrides = source?.reportConfig || source || {};
  const result = cloneReportConfig(DEFAULT_REPORT_CONFIG);
  for (const [key, val] of Object.entries(overrides)) {
    if (Object.prototype.hasOwnProperty.call(result,key) && val !== undefined && val !== null) result[key] = cloneReportConfig(val);
  }
  return result;
};
export const makeColumn = (label='New column') => ({id:`custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,label});
export function validateReportConfig(config) {
  if (!config.title?.trim()) return 'The report needs a title.';
  for (const field of ['checklistColumns','summaryColumns','trackerColumns','appendixColumns']) {
    if (!Array.isArray(config[field]) || !config[field].length) return `Keep at least one column in ${field}.`;
    const ids = config[field].map(c=>c.id);
    if (new Set(ids).size !== ids.length) return `Duplicate column IDs in ${field}.`;
    if (config[field].some(c=>!c.label?.trim())) return `Name every column in ${field}.`;
  }
  for (const field of ['trackerRows','appendixRows']) if (!Number.isInteger(Number(config[field])) || Number(config[field]) < 1 || Number(config[field]) > 200) return `${field} must be between 1 and 200.`;
  return '';
}
