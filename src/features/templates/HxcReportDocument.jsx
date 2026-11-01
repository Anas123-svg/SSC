import { selectedPaletteVariables, hasCustomPalette, paletteStyle } from './hxcComplianceColors.js';
import React, { useState } from 'react';
import harmonixLogo from '../../assets/harmonix-logo.png';
import { FormBlock } from './FormBlock.jsx';
import DigitalSignature from './DigitalSignature.jsx';
import { getReportConfig } from './hxcReportConfig.js';
import { complianceScore, isComplianceBlock, normalizeCompliance, overallRating } from './hxcSchema.js';
import { COMPLIANCE_CODES, getComplianceLabels, getCellHint } from './hxcEditableChecklist.js';

const METHODS = [
  ['Item compliance', 'Select C (Compliant), MI (Minor Issue), MA (Major Issue) or N/A. Do not give individual items a numerical score.'],
  ['Section score', 'After reviewing all items in the section, assign one overall score from 0 to 10 using professional judgement and the rating guide below.'],
  ['Evidence', 'Record concise evidence or an Appendix reference. Any MI or MA item must have a corrective-action reference.'],
  ['Overall score', 'Average the applicable section scores and express the result as a percentage. N/A sections are excluded.'],
];
const BANDS = [['9–10', 'Excellent'], ['7–8', 'Good'], ['5–6', 'Improvement required'], ['3–4', 'Unsatisfactory'], ['0–2', 'Immediate intervention']];
const ACTION_COLUMNS = [['finding','Finding / required action'], ['priority','Priority'], ['responsible','Responsible person'], ['target','Target date'], ['closeout','Close-out date'], ['verified','Verified by']];
const nullable = value => value == null ? '' : value;

const Input = ({ value, set, placeholder, disabled, type = 'text', ariaLabel, ...props }) => (
  <input type={type} value={nullable(value)} onChange={e => set(e.target.value)} placeholder={placeholder || ''} disabled={disabled}
    aria-label={ariaLabel} {...props} />
);

/** Fit selected evidence images to a browser-local inspection without uploading them elsewhere. */
const readPhoto = file => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith('image/')) { reject(new Error('Choose a photo file.')); return; }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read this image.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Photo preview is unavailable.')); return; }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.68);
      if (data.length > 900000) { reject(new Error('Please choose a smaller photo.')); return; }
      resolve(data);
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

function ScoreField({ section, answers, setAnswer, disabled }) {
  const key = `section:${section.id}:score`;
  return <select aria-label={`${section.title} section score`} value={nullable(answers[key])} disabled={disabled} onChange={e => setAnswer(key, e.target.value)}>
    <option value="">— / 10</option>
    {Array.from({length:11},(_,i) => <option key={i} value={String(i)}>{i} / 10</option>)}
    <option value="N/A">N/A</option>
  </select>;
}

function ChecklistTable({ section, number, answers, setAnswer, disabled, config }) {
  const columns = config.checklistColumns;
  const hasCompliance = columns.some(c => c.id === 'compliance');
  const renderCell = (col, block) => {
    const compliance = isComplianceBlock(block);
    const decorative = ['heading','paragraph','list','row','columns','divider','richtext'].includes(block.type);
    if (col.id === 'ref') return <span className="hwd-ref">{block.ref || ''}</span>;
    if (col.id === 'requirement') return <div className="hwd-requirement">
      {(compliance || ['heading','paragraph','row','columns'].includes(block.type)) && block.label}
      {(!compliance && !decorative || compliance && !hasCompliance) && <FormBlock block={block} answers={answers} setAnswer={setAnswer} disabled={disabled}/>}
      {decorative && !['heading','paragraph'].includes(block.type) && <FormBlock block={block} answers={answers} setAnswer={setAnswer} disabled={disabled}/>}
    </div>;
    if (col.id === 'compliance') {
      if (!compliance) return null;
      const status = normalizeCompliance(answers[block.id] || '') || 'unset';
      return <select className={'hwd-compliance-select status-' + status.replace('/','')} style={selectedPaletteVariables(block,status)} data-custom-colors={hasCustomPalette(block,status)} aria-label={`Compliance for ${block.ref || block.label}`} value={normalizeCompliance(answers[block.id] || '')} disabled={disabled} onChange={e => setAnswer(block.id, e.target.value)}>
      <option value="">Choose compliance</option>{COMPLIANCE_CODES.map(code => <option value={code} key={code} style={hasCustomPalette(block,code) ? paletteStyle(block,code) : undefined}>{code} — {getComplianceLabels(block)[code]}</option>)}
    </select>;
    }
    const key = col.id === 'evidence' ? `${block.id}:evidence` : col.id === 'action' ? `${block.id}:action` : `${block.id}:column:${col.id}`;
    return <Input type={col.type || 'text'} ariaLabel={`${col.label} for ${block.ref || block.label}`} value={answers[key]} set={v => setAnswer(key,v)} disabled={disabled} placeholder={getCellHint(block,col.id,col.label)}/>;
  };
  const includes = id => columns.some(col=>col.id === id);
  return <><div className="hwd-table-wrap"><table className="hwd-table hwd-checklist-table">
    <thead><tr>{columns.map(col=><th key={col.id}>{col.label}</th>)}</tr></thead>
    <tbody>{(section.blocks || []).map(block => block.type === 'richtext' ? <tr key={block.id} className="hwd-document-content-row"><td colSpan={columns.length}><FormBlock block={block} answers={answers} setAnswer={setAnswer} disabled={disabled}/></td></tr> : <tr key={block.id}>{columns.map(col=><td key={col.id} data-label={col.label}>{renderCell(col,block)}</td>)}</tr>)}
      <tr className="hwd-section-score">{columns.map((col,i) => <td key={col.id} data-label={col.label}>
        {col.id === 'requirement' || i === 0 ? `SECTION ${number} ${config.sectionScoreLabel}` : null}
        {col.id === 'compliance' ? <ScoreField section={section} answers={answers} setAnswer={setAnswer} disabled={disabled}/> : null}
        {col.id === 'evidence' ? <Input ariaLabel={`Auditor rationale for ${section.title}`} value={answers[`section:${section.id}:rationale`]} set={v=>setAnswer(`section:${section.id}:rationale`,v)} disabled={disabled} placeholder="Rationale:"/> : null}
        {col.id === 'action' ? <Input ariaLabel={`Open actions for ${section.title}`} value={answers[`section:${section.id}:open`]} set={v=>setAnswer(`section:${section.id}:open`,v)} disabled={disabled} type="number" min="0" placeholder="Open actions: —"/> : null}
      </td>)}</tr>
    </tbody></table></div>
    {(!includes('requirement') || !includes('action') || !includes('evidence')) && <div className="hwd-missing-details">
      {(section.blocks || []).map(block => <div key={block.id} className="hwd-missing-row">
        <strong>{block.ref ? `${block.ref} · ` : ''}{block.label}</strong>
        {!includes('requirement') && !includes('compliance') && <FormBlock block={block} answers={answers} setAnswer={setAnswer} disabled={disabled}/>}
        {!includes('action') && <label>Action reference <Input value={answers[`${block.id}:action`]} set={v=>setAnswer(`${block.id}:action`,v)} disabled={disabled}/></label>}
        {!includes('evidence') && <label>Evidence / appendix <Input value={answers[`${block.id}:evidence`]} set={v=>setAnswer(`${block.id}:evidence`,v)} disabled={disabled}/></label>}
      </div>)}
    </div>}
    {(!includes('compliance') || !includes('evidence') || !includes('action')) && <div className="hwd-section-extras">
      {!includes('compliance') && <label>Section score <ScoreField section={section} answers={answers} setAnswer={setAnswer} disabled={disabled}/></label>}
      {!includes('evidence') && <label>Rationale <Input value={answers[`section:${section.id}:rationale`]} set={v=>setAnswer(`section:${section.id}:rationale`,v)} disabled={disabled}/></label>}
      {!includes('action') && <label>Open actions <Input type="number" min="0" value={answers[`section:${section.id}:open`]} set={v=>setAnswer(`section:${section.id}:open`,v)} disabled={disabled}/></label>}
    </div>}
  </>;
}

function SummaryTable({schema,answers,setAnswer,disabled,config}) {
  const score = complianceScore(schema, answers);
  const knownOpen = schema.reduce((sum,s) => {
    const value = answers[`section:${s.id}:open`];
    return sum + (value !== '' && value != null && Number.isFinite(Number(value)) ? Number(value) : 0);
  },0);
  const cell = (s,col) => {
    if (col.id === 'section') return s.title;
    if (col.id === 'score') return nullable(answers[`section:${s.id}:score`]) === '' ? '—' : answers[`section:${s.id}:score`];
    if (col.id === 'open') return nullable(answers[`section:${s.id}:open`]) === '' ? '—' : answers[`section:${s.id}:open`];
    const key = col.id === 'concern' ? `summary:${s.id}:concern` : `summary:${s.id}:${col.id}`;
    return <Input type={col.type || 'text'} ariaLabel={`${col.label} for ${s.title}`} value={answers[key]} set={v=>setAnswer(key,v)} disabled={disabled}/>;
  };
  return <><div className="hwd-table-wrap"><table className="hwd-table hwd-summary-table">
    <thead><tr>{config.summaryColumns.map(c=><th key={c.id}>{c.label}</th>)}</tr></thead>
    <tbody>{schema.map(s=><tr key={s.id}>{config.summaryColumns.map(col=><td key={col.id} data-label={col.label}>{cell(s,col)}</td>)}</tr>)}
      <tr className="hwd-summary-total">{config.summaryColumns.map((col,i)=><td key={col.id} data-label={col.label}>{col.id === 'score' ? (score == null ? '— %' : `${score}%`) : col.id === 'concern' ? <>Overall rating: <strong>{overallRating(score)}</strong></> : col.id === 'open' ? `Total open: ${knownOpen}` : i === 0 ? 'OVERALL COMPLIANCE SCORE' : ''}</td>)}</tr>
    </tbody>
  </table></div>
  <label className="hwd-long-note"><strong>{config.positiveLabel}</strong><textarea rows={3} disabled={disabled} value={nullable(answers['summary:positive'])} onChange={e=>setAnswer('summary:positive',e.target.value)}/></label>
  <label className="hwd-long-note"><strong>{config.concernsLabel}</strong><textarea rows={3} disabled={disabled} value={nullable(answers['summary:concerns'])} onChange={e=>setAnswer('summary:concerns',e.target.value)}/></label></>;
}

function ActionTracker({answers,setAnswer,disabled,config}) {
  const [extraRows,setExtraRows] = useState(0);
  const rows = Number(config.trackerRows || 12) + Math.max(extraRows, Number(answers['actions:extraRows'] || 0));
  return <><div className="hwd-table-wrap"><table className="hwd-table hwd-action-table">
    <thead><tr>{config.trackerColumns.map(c=><th key={c.id}>{c.label}</th>)}</tr></thead>
    <tbody>{Array.from({length:rows},(_,i)=><tr key={i}>{config.trackerColumns.map(col=>
      <td key={col.id} data-label={col.label}>{col.id === 'ref' ? <span className="hwd-ref">{i+1}</span> : <Input type={col.type || (['target','closeout'].includes(col.id) ? 'date' : 'text')} ariaLabel={`Corrective action ${i+1}, ${col.label}`} value={answers[`action:${i+1}:${col.id}`]} set={v=>setAnswer(`action:${i+1}:${col.id}`,v)} disabled={disabled}/>}</td>)}</tr>)}</tbody>
  </table></div>{!disabled && <button type="button" className="hwd-inline-action" onClick={()=>{setExtraRows(x=>x+1);setAnswer('actions:extraRows',rows+1-Number(config.trackerRows || 12));}}>+ Add corrective action row</button>}</>;
}

function PhotoCell({index,answers,setAnswer,disabled,config}) {
  const [error,setError] = useState('');
  const number = `A${String(index+1).padStart(2,'0')}`;
  const imageKey = `appendix:${number}:photo`;
  const img = answers[imageKey];
  const add = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError('');
    try { setAnswer(imageKey,await readPhoto(file)); }
    catch(e) { setError(e.message || 'Could not attach photo.'); }
  };
  return <tr>{config.appendixColumns.map(col=>{
    if (col.id === 'ref') return <td key={col.id} data-label={col.label} className="hwd-ref">{number}</td>;
    if (col.id === 'photo') return <td key={col.id} data-label={col.label} className="hwd-photo-cell">{img && <img src={img} alt={`Appendix ${number} evidence`} className="hwd-photo-preview"/>}
      {!disabled && <div className="hwd-photo-actions"><label className="hwd-upload">{img ? 'Replace photo' : 'Choose photo'}<input type="file" accept="image/*" onChange={add}/></label>{img && <button type="button" onClick={()=>setAnswer(imageKey,'')}>Remove</button>}</div>}
      {error && <small className="hwd-photo-error" role="alert">{error}</small>}</td>;
    return <td key={col.id} data-label={col.label}><Input type={col.type || 'text'} ariaLabel={`${col.label} for appendix ${number}`} value={answers[`appendix:${number}:${col.id}`]} set={v=>setAnswer(`appendix:${number}:${col.id}`,v)} disabled={disabled} placeholder={col.id === 'item' ? 'Item ref.' : ''}/></td>;
  })}</tr>;
}

/** Layout and wording replicate the 12-page Harmonix HXC Site Compliance Audit Word document. */
export default function HxcReportDocument({ schema = [], answers = {}, setAnswer = () => {}, disabled = false, preview = false, meta = {}, onMeta = () => {}, projects = [], projectName = '', reportConfig }) {
  const config = getReportConfig(reportConfig || {});
  const score = complianceScore(schema,answers);
  const projectSelected = Boolean(projects?.length);
  const value = (key) => nullable(answers[`meta:${key}`]);
  const extraNumber = {
    summary: schema.length + 1,
    tracker: schema.length + 1 + Number(config.showSummary !== false),
    declaration: schema.length + 1 + Number(config.showSummary !== false) + Number(config.showActionTracker !== false),
    appendix: schema.length + 1 + Number(config.showSummary !== false) + Number(config.showActionTracker !== false) + Number(config.showDeclaration !== false),
  };
  const ml = config.metadataLabels;
  const field = (key, label, type='text') => <Input type={type} ariaLabel={label} disabled={disabled} value={value(key)} set={v=>setAnswer(`meta:${key}`,v)}/>;
  return <article className="hwd-document" aria-label="HXC Compliance Report">
    <div className="hwd-word-page">
      <div className="hwd-logo-row">{config.logoMode !== 'none' && <img src={config.logoMode === 'custom' && config.logoData ? config.logoData : harmonixLogo} alt="Report branding" />}</div>
      <div className="hwd-report-title"><h1>{config.title}</h1><p>{config.subtitle}</p></div>
      <div className="hwd-table-wrap"><table className="hwd-table hwd-metadata-table"><tbody>
        <tr><th>{ml.projectName}</th><td>{projectSelected ? <select aria-label="Project Name" disabled={disabled} value={meta.projectId || ''} onChange={e=>onMeta('projectId',e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select> : field('projectName','Project Name')}</td><th>{ml.date}</th><td><Input type="date" ariaLabel="Date of Assessment" disabled={disabled} value={meta.date ?? value('date')} set={v=>meta.date !== undefined ? onMeta('date',v) : setAnswer('meta:date',v)}/></td></tr>
        <tr><th>{ml.assessor}</th><td><Input ariaLabel="Assessor" disabled={disabled} value={meta.inspector ?? value('assessor')} set={v=>meta.inspector !== undefined ? onMeta('inspector',v) : setAnswer('meta:assessor',v)}/></td><th>{ml.projectManager}</th><td>{field('projectManager',ml.projectManager)}</td></tr>
        <tr><th>{ml.siteAddress}</th><td><Input ariaLabel="Site Address" value={value('siteAddress') || projectName} disabled={disabled} set={v=>setAnswer('meta:siteAddress',v)}/></td><th>{ml.assessmentType}</th><td><select aria-label="Assessment Type" disabled={disabled} value={value('assessmentType')} onChange={e=>setAnswer('meta:assessmentType',e.target.value)}><option value="">Monthly / Follow-up / Other</option><option>Monthly</option><option>Follow-up</option><option>Other</option></select></td></tr>
        {config.metadataExtra.map((entry)=><tr key={entry.id}><th>{entry.label}</th><td colSpan={3}><Input ariaLabel={entry.label} type={entry.type || 'text'} disabled={disabled} value={value(`custom:${entry.id}`)} set={v=>setAnswer(`meta:custom:${entry.id}`,v)}/></td></tr>)}
      </tbody></table></div>

      {(config.showMethod !== false || config.showRatingBands !== false) && <section className="hwd-method">
        {config.showMethod !== false && <><h2>{config.methodTitle}</h2><div className="hwd-table-wrap"><table className="hwd-table hwd-method-table"><tbody>{config.methods.map(method=><tr key={method.id}><th>{method.label}</th><td>{method.description}</td></tr>)}</tbody></table></div></>}
        {config.showRatingBands !== false && <div className="hwd-table-wrap"><table className="hwd-table hwd-bands"><thead><tr>{config.bands.map(b=><th key={b.id}>{b.label}</th>)}</tr></thead><tbody><tr>{config.bands.map(b=><td key={b.id}>{b.description}</td>)}</tr></tbody></table></div>}
      </section>}

      {schema.map((section,i) => <section className="hwd-audit-section" key={section.id}>
        <h2>{i+1}. {section.title}</h2>{section.description && <p className="hwd-section-description">{section.description}</p>}
        <ChecklistTable section={section} number={i+1} answers={answers} setAnswer={setAnswer} disabled={disabled} config={config}/>
      </section>)}

      {config.showSummary !== false && <section className="hwd-audit-section"><h2>{extraNumber.summary}. {config.summaryTitle}</h2><SummaryTable schema={schema} answers={answers} setAnswer={setAnswer} disabled={disabled} config={config}/></section>}
      {config.showActionTracker !== false && <section className="hwd-audit-section"><h2>{extraNumber.tracker}. {config.trackerTitle}</h2><ActionTracker answers={answers} setAnswer={setAnswer} disabled={disabled} config={config}/></section>}
      {config.showDeclaration !== false && <section className="hwd-audit-section"><h2>{extraNumber.declaration}. {config.declarationTitle}</h2><p className="hwd-declaration">{config.declarationText}</p>
        <div className="hwd-table-wrap"><table className="hwd-table hwd-signoff-table"><tbody>
          <tr><th>{config.assessorLabel}</th><td>{field('declarationAssessor',config.assessorLabel)}</td><th>Signature</th><td><DigitalSignature label={`${config.assessorLabel} signature`} disabled={disabled} value={value('assessorSignature')} onChange={v=>setAnswer('meta:assessorSignature',v)}/></td></tr>
          <tr><th>{config.managerLabel}</th><td>{field('declarationManager',config.managerLabel)}</td><th>Signature</th><td><DigitalSignature label={`${config.managerLabel} signature`} disabled={disabled} value={value('managerSignature')} onChange={v=>setAnswer('meta:managerSignature',v)}/></td></tr>
          <tr><th>{config.reportDateLabel}</th><td>{field('reportDate',config.reportDateLabel,'date')}</td><th>{config.nextReviewLabel}</th><td>{field('nextReview',config.nextReviewLabel,'date')}</td></tr>
        </tbody></table></div>
      </section>}
      {config.showAppendix !== false && <section className="hwd-audit-section hwd-appendix"><h2>{extraNumber.appendix}. {config.appendixTitle}</h2><p>{config.appendixDescription}</p>
        <div className="hwd-table-wrap"><table className="hwd-table hwd-photos-table"><thead><tr>{config.appendixColumns.map(col=><th key={col.id}>{col.label}</th>)}</tr></thead><tbody>{Array.from({length:Number(config.appendixRows || 20)},(_,i)=><PhotoCell key={i} index={i} answers={answers} setAnswer={setAnswer} disabled={disabled} config={config}/>)}</tbody></table></div>
      </section>}
      <footer className="hwd-document-footer">{config.footerText} · {config.title} {score == null ? '' : `· ${score}% ${overallRating(score)}`} {preview ? '· TEMPLATE PREVIEW' : ''}</footer>
    </div>
  </article>;
}
