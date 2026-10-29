import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { makeColumn } from './hxcReportConfig.js';
const LABELS = [['projectName','Project name'],['date','Assessment date'],['assessor','Assessor'],['projectManager','Project manager met'],['siteAddress','Site address'],['assessmentType','Assessment type']];

const move = (array,index,offset) => { const next=[...array], j=index+offset; if(j<0||j>=next.length) return next; [next[index],next[j]]=[next[j],next[index]]; return next; };
const fresh = () => makeColumn();
function SettingsField({label,value,onChange,multiline=false,type='text'}) {
  return <label className="hxc-config-input"><span>{label}</span>{multiline ? <textarea rows={3} value={value||''} onChange={e=>onChange(e.target.value)}/> : label==='Input type' ? <select value={value||'text'} onChange={e=>onChange(e.target.value)}>{['text','date','number','time','email'].map(t=><option key={t} value={t}>{t}</option>)}</select> : <input type={type} value={value??''} onChange={e=>onChange(type==='number'?Number(e.target.value):e.target.value)}/>}</label>;
}
function EditableList({title,items,onChange,fields=['label'],newEntry=fresh,addLabel='Add row',min=0}) {
  const patch = (i,key,value) => onChange(items.map((entry,j)=>i===j?{...entry,[key]:value}:entry));
  return <div className="hxc-config-list"><div className="hxc-config-list-title"><strong>{title}</strong><span>{items.length} entries</span></div>
    {items.map((entry,i)=><div key={entry.id} className="hxc-config-row"><div className="hxc-config-row-fields">{fields.map(field=><SettingsField key={field} label={{label:'Column / label',description:'Description',type:'Input type'}[field]||field} value={entry[field]||''} onChange={value=>patch(i,field,value)}/>)}</div>
      <div className="hxc-config-row-actions"><button type="button" title="Move up" aria-label={`Move ${entry.label} up`} disabled={i===0} onClick={()=>onChange(move(items,i,-1))}><ArrowUp size={15}/></button><button type="button" title="Move down" aria-label={`Move ${entry.label} down`} disabled={i===items.length-1} onClick={()=>onChange(move(items,i,1))}><ArrowDown size={15}/></button><button type="button" title="Remove" aria-label={`Remove ${entry.label}`} disabled={items.length<=min} onClick={()=>onChange(items.filter((_,j)=>j!==i))}><Trash2 size={15}/></button></div></div>)}
    <button className="sw-btn" type="button" onClick={()=>onChange([...items,newEntry()])}><Plus size={14}/>{addLabel}</button>
  </div>;
}
const row = () => ({...makeColumn('New rating'),description:'Description'});
const method = () => ({...makeColumn('New guidance'),description:'Instructions'});
export default function ReportSettingsEditor({config,onChange}) {
  const [tab,setTab] = useState('sections');
  const set=(key,value)=>onChange({...config,[key]:value});
  return <section className="hxc-config-root">
    <div className="hxc-config-tabs" role="tablist" aria-label="Report layout sections">
      {[['sections','Show / hide sections'],['intro','Cover & guidance'],['tables','Checklist & summary'],['actions','Actions & close-out'],['appendix','Photo appendix']].map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}
    </div>
    {tab==='sections' && <div className="hxc-config-panel"><h2>What belongs in the report?</h2><p>Turn optional document sections on or off. This changes new inspections and the live preview without deleting previously saved reports.</p>
      <div className="hxstudio-visibility-grid">{[
        ['showMethod','Audit method & scoring instructions','Instructions at the start of the document'],
        ['showRatingBands','Scoring rating guide','Excellent / good / improvement bands'],
        ['showSummary','Audit summary','Section scores, overview and observations'],
        ['showActionTracker','Corrective-action tracker','Table of findings, owners and deadlines'],
        ['showDeclaration','Declaration & digital signatures','Assessor and project manager sign-off'],
        ['showAppendix','Photo appendix','Supporting images and audit references'],
      ].map(([key,label,help])=><label key={key} className="hxstudio-visibility-row"><input type="checkbox" checked={config[key] !== false} onChange={e=>set(key,e.target.checked)}/><span><strong>{label}</strong><small>{help}</small></span></label>)}</div>
      <p className="hxstudio-settings-tip">The assessment header and actual inspection questions remain part of every inspection. You can edit their labels and fields in the other editor tabs.</p>
    </div>}
    {tab==='intro' && <div className="hxc-config-panel"><h2>Cover and assessment guide</h2><p>These are the fixed parts of the Word-style report. You can edit their text, add or delete instructions, and rearrange rating bands.</p>
      <div className="hxc-config-brand"><label>Report logo <select value={config.logoMode} onChange={e=>set('logoMode',e.target.value)}><option value="default">Harmonix logo (original)</option><option value="none">No logo</option><option value="custom">Custom logo</option></select></label>{config.logoMode==='custom' && <label>Upload logo (maximum 150 KB) <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return; if(file.size>150000){window.alert('Choose a logo under 150 KB.');return;}const reader=new FileReader();reader.onload=()=>set('logoData',String(reader.result));reader.readAsDataURL(file);}}/></label>}</div>
      <SettingsField label="Report heading" value={config.title} onChange={v=>set('title',v)}/>
      <SettingsField label="Subtitle" value={config.subtitle} onChange={v=>set('subtitle',v)} multiline/>
      <SettingsField label="Report footer / brand name" value={config.footerText} onChange={v=>set('footerText',v)}/>
      <h3>Project and assessment details</h3><div className="hxc-config-two">{LABELS.map(([key,label])=><SettingsField key={key} label={label+' field label'} value={config.metadataLabels[key]} onChange={v=>set('metadataLabels',{...config.metadataLabels,[key]:v})}/>)}</div>
      <EditableList title="Additional project information rows" items={config.metadataExtra} onChange={v=>set('metadataExtra',v)} fields={['label','type']} addLabel="Add project detail row"/>
      <SettingsField label="Scoring guide heading" value={config.methodTitle} onChange={v=>set('methodTitle',v)}/>
      <EditableList title="Audit method instructions" items={config.methods} onChange={v=>set('methods',v)} fields={['label','description']} newEntry={method} addLabel="Add instruction"/>
      <EditableList title="Score rating bands" items={config.bands} onChange={v=>set('bands',v)} fields={['label','description']} newEntry={row} addLabel="Add rating band"/>
    </div>}
    {tab==='tables' && <div className="hxc-config-panel"><h2>Audit tables and summary</h2><p>Edit, add, remove, or rearrange table columns. Compliance, score, evidence and action fields stay accessible even if you remove their columns.</p>
      <EditableList title="Inspection checklist table columns" items={config.checklistColumns} onChange={v=>set('checklistColumns',v)} fields={['label','type']} min={1} addLabel="Add checklist column"/>
      <SettingsField label="End-of-section score row label" value={config.sectionScoreLabel} onChange={v=>set('sectionScoreLabel',v)}/>
      <SettingsField label="Audit summary heading" value={config.summaryTitle} onChange={v=>set('summaryTitle',v)}/>
      <EditableList title="Audit summary table columns" items={config.summaryColumns} onChange={v=>set('summaryColumns',v)} fields={['label','type']} min={1} addLabel="Add summary column"/>
      <SettingsField label="Positive observations heading" value={config.positiveLabel} onChange={v=>set('positiveLabel',v)}/>
      <SettingsField label="Priority concerns heading" value={config.concernsLabel} onChange={v=>set('concernsLabel',v)}/>
    </div>}
    {tab==='actions' && <div className="hxc-config-panel"><h2>Corrective actions and signatures</h2><p>Choose the fields in the action tracker, its starting number of rows, and the declaration text. The signature boxes stay as digital drawing pads.</p>
      <SettingsField label="Corrective-action tracker heading" value={config.trackerTitle} onChange={v=>set('trackerTitle',v)}/>
      <SettingsField label="Starting action rows (1–200)" value={config.trackerRows} type="number" onChange={v=>set('trackerRows',v)}/>
      <EditableList title="Corrective action table columns" items={config.trackerColumns} onChange={v=>set('trackerColumns',v)} fields={['label','type']} min={1} addLabel="Add corrective-action column"/>
      <SettingsField label="Declaration heading" value={config.declarationTitle} onChange={v=>set('declarationTitle',v)}/>
      <SettingsField label="Declaration text" value={config.declarationText} onChange={v=>set('declarationText',v)} multiline/>
      <div className="hxc-config-two"><SettingsField label="Report date label" value={config.reportDateLabel} onChange={v=>set('reportDateLabel',v)}/><SettingsField label="Follow-up date label" value={config.nextReviewLabel} onChange={v=>set('nextReviewLabel',v)}/></div>
      <div className="hxc-config-two"><SettingsField label="Assessor title" value={config.assessorLabel} onChange={v=>set('assessorLabel',v)}/><SettingsField label="Project manager title" value={config.managerLabel} onChange={v=>set('managerLabel',v)}/></div>
    </div>}
    {tab==='appendix' && <div className="hxc-config-panel"><h2>Supporting photos</h2><p>Set the appendix headings and choose which columns the photo evidence table displays.</p>
      <SettingsField label="Appendix heading" value={config.appendixTitle} onChange={v=>set('appendixTitle',v)}/>
      <SettingsField label="Appendix instructions" value={config.appendixDescription} onChange={v=>set('appendixDescription',v)} multiline/>
      <SettingsField label="Starting appendix rows (1–200)" value={config.appendixRows} type="number" onChange={v=>set('appendixRows',v)}/>
      <EditableList title="Appendix table columns" items={config.appendixColumns} onChange={v=>set('appendixColumns',v)} fields={['label','type']} min={1} addLabel="Add appendix column"/>
    </div>}
  </section>;
}
