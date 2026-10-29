import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Printer, ShieldCheck } from 'lucide-react';
import { validate } from '../hxcModel.js';
import { sectionScore, printHxc } from '../hxcExport.js';
import { Button, Meter } from '../components/HxcUI.jsx';
import { useHxcEditor } from '../HxcEditorContext.jsx';

export default function ReviewTab() {
  const { active, readOnly, stats, setValidation, validation, complete, notify } = useHxcEditor();
  return (
    <section className="hxc-white-section"><div className="hxc-body-title"><div><span>FINAL / VALIDATION & QUALITY CHECKS</span><h3>{validation.length ? 'Some items need attention.' : 'Review before completing.'}</h3><p>The system checks all checklist answers, section rationale, evidence, linked actions, and both acknowledgements.</p></div></div><div className="hxc-final-card"><div className="hxc-final-icon"><ClipboardCheck size={25} /></div><div><span>ASSESSMENT PROGRESS</span><strong>{stats.answered} / 65 items · {stats.applicable} / 10 sections scored</strong><Meter value={stats.answered} max={65} /></div><span className="hxc-final-percent">{sectionScore(active)}</span></div>{validation.length > 0 ? <div className="hxc-error-list"><h4><AlertTriangle size={17} /> {validation.length} issue(s) to address</h4>{validation.slice(0, 30).map((x, i) => <p key={i}><span>{i + 1}.</span>{x}</p>)}{validation.length > 30 && <p>And {validation.length - 30} more. Resolve these and run validation again.</p>}</div> : <div className="hxc-method"><CheckCircle2 size={23} /><div><strong>{active.state === 'Completed' ? 'This audit has been marked complete.' : 'Run validation to check this audit.'}</strong><p>No completion errors are currently displayed. Complete audit will run all validations again before changing its status.</p></div></div>}<div className="hxc-bottom-actions"><Button icon={ShieldCheck} onClick={() => { const errs = validate(active); setValidation(errs); notify(errs.length ? `${errs.length} outstanding validation findings.` : 'All completion checks passed.') ;}}>Run all checks</Button><Button icon={Printer} onClick={() => printHxc(active)}>Print full report</Button>{!readOnly && <Button variant="primary" onClick={complete} icon={CheckCircle2}>Complete audit</Button>}</div></section>
  );
}
