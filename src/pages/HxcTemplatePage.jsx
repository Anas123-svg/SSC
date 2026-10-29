import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, ClipboardList,
  Columns3, Copy, Eye, FileText, GripVertical, Image, LayoutGrid,
  ListChecks, Plus, RotateCcw, Save, Settings2,
  Signature, Table2, Trash2, Type, X,
} from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import {
  getHxcSchema, DEFAULT_HXC_SCHEMA, createBlockId, newBlock,
  INPUT_TYPES, countQuestions, validateSchema, cloneSchema,
} from '../features/templates/hxcSchema.js';
import HxcReportDocument from '../features/templates/HxcReportDocument.jsx';
import ReportSettingsEditor from '../features/templates/ReportSettingsEditor.jsx';
import {
  getReportConfig, validateReportConfig, cloneReportConfig, DEFAULT_REPORT_CONFIG,
} from '../features/templates/hxcReportConfig.js';
import '../styles/hxc-template-studio.css';

const LABELS = Object.fromEntries(INPUT_TYPES);
const NON_FIELDS = new Set(['heading', 'paragraph', 'list', 'row', 'columns', 'divider']);
const CHOICES = new Set(['radio', 'checkbox', 'select', 'list']);
const NESTED = new Set(['row', 'columns']);
const QUICK = [
  ['radio', 'Choice', ListChecks], ['text', 'Text', Type],
  ['heading', 'Heading', FileText], ['table', 'Table', Table2],
  ['columns', 'Columns', Columns3], ['photo', 'Photo', Image],
  ['signature', 'Signature', Signature],
];
const swap = (list, index, delta) => {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
};
const duplicateBlock = (block) => ({
  ...cloneSchema(block), id: createBlockId(),
  ...(Array.isArray(block.children) ? { children: block.children.map(duplicateBlock) } : {}),
});
const signature = (schema, config, workspaces) => JSON.stringify([schema, config, workspaces]);

function AddContent({ onAdd, compact = false, label = 'Add field' }) {
  const [more, setMore] = useState('textarea');
  return <div className={'hxstudio-add-content' + (compact ? ' is-compact' : '')}>
    {!compact && <div className="hxstudio-add-caption"><Plus size={15}/> Add content</div>}
    <div className="hxstudio-add-buttons">
      {QUICK.map(([type, name, Icon]) => <button key={type} type="button" className="hxstudio-add-chip" onClick={() => onAdd(type)} title={`Add ${name.toLowerCase()}`}>
        <Icon size={15}/> {name}
      </button>)}
      <div className="hxstudio-add-more">
        <select aria-label="More field types" value={more} onChange={e => setMore(e.target.value)}>
          {INPUT_TYPES.map(([type, name]) => <option value={type} key={type}>{name}</option>)}
        </select>
        <button type="button" className="hxstudio-add-chip hxstudio-add-other" onClick={() => onAdd(more)}><Plus size={14}/> {label}</button>
      </div>
    </div>
  </div>;
}

function OptionsEditor({ options, onChange, title }) {
  const list = options || [];
  return <div className="hxstudio-options">
    <div className="hxstudio-editor-caption"><strong>{title}</strong><span>These options appear in the inspection form</span></div>
    {list.map((option, index) => <div className="hxstudio-option-line" key={index}>
      <span className="hxstudio-option-index">{index + 1}</span>
      <input aria-label={`${title} ${index + 1}`} value={option} onChange={e => onChange(list.map((x, i) => i === index ? e.target.value : x))}/>
      <button type="button" aria-label={`Move option ${index + 1} up`} title="Move up" disabled={index === 0} onClick={() => onChange(swap(list,index,-1))}><ArrowUp size={14}/></button>
      <button type="button" aria-label={`Move option ${index + 1} down`} title="Move down" disabled={index === list.length-1} onClick={() => onChange(swap(list,index,1))}><ArrowDown size={14}/></button>
      <button type="button" className="hxstudio-danger-icon" aria-label={`Remove option ${index + 1}`} title="Remove" disabled={list.length < 2} onClick={() => onChange(list.filter((_,i) => i!==index))}><X size={15}/></button>
    </div>)}
    <button className="hxstudio-inline-add" type="button" onClick={() => onChange([...list, `Option ${list.length + 1}`])}><Plus size={14}/> Add option</button>
  </div>;
}

function TableEditor({ block, set }) {
  const columns = block.columns || [];
  const rows = Math.max(1,Number(block.rows) || 1);
  return <div className="hxstudio-table-settings">
    <div className="hxstudio-editor-caption"><strong>Table structure</strong><span>Add, rename, remove, or reorder columns. Choose the starting row count.</span></div>
    <div className="hxstudio-table-demo"><table><thead><tr>{columns.map((column,index) => <th key={index}>
      <div className="hxstudio-column-tools">
        <input aria-label={`Table column ${index + 1}`} value={column} onChange={e => set({columns:columns.map((v,i)=>i===index?e.target.value:v)})}/>
        <button type="button" aria-label={`Move column ${index + 1} left`} disabled={index === 0} onClick={()=>set({columns:swap(columns,index,-1)})}><ArrowLeft size={13}/></button>
        <button type="button" aria-label={`Move column ${index + 1} right`} disabled={index===columns.length-1} onClick={()=>set({columns:swap(columns,index,1)})}><ArrowRight size={13}/></button>
        <button type="button" className="hxstudio-danger-icon" aria-label={`Remove column ${index + 1}`} disabled={columns.length<=1} onClick={()=>set({columns:columns.filter((_,i)=>i!==index)})}><X size={13}/></button>
      </div>
    </th>)}</tr></thead>
    <tbody>{Array.from({length:Math.min(3,rows)},(_,i)=><tr key={i}>{columns.map((_,c)=><td key={c}><span className="hxstudio-table-placeholder"/></td>)}</tr>)}</tbody></table></div>
    <div className="hxstudio-table-bottom"><button type="button" className="hxstudio-inline-add" onClick={()=>set({columns:[...columns,`Column ${columns.length+1}`]})}><Plus size={14}/> Add column</button>
      <label>Starting rows <input type="number" min="1" max="100" value={rows} onChange={e=>set({rows:Math.max(1,Math.min(100,Number(e.target.value)||1))})}/></label>
      <button type="button" className="hxstudio-row-control" onClick={()=>set({rows:rows+1})}><Plus size={14}/> Row</button>
      <button type="button" className="hxstudio-row-control" disabled={rows<=1} onClick={()=>set({rows:rows-1})}><X size={14}/> Row</button>
    </div>
  </div>;
}

function BlockCard({ block, index, total, onChange, onRemove, onDuplicate, onUp, onDown, activeId, setActiveId, disabled=false, depth=0 }) {
  const editing = activeId === block.id && !disabled;
  const expanded = editing || (!disabled && (block.children || []).some(function containsActive(item) {
    return item.id === activeId || (item.children || []).some(containsActive);
  }));
  const set = patch => onChange({...block, ...patch});
  const changeType = type => {
    const initial = newBlock(type);
    set({...initial,id:block.id,label:block.label,ref:block.ref,help:block.help,required:block.required});
  };
  const nested = NESTED.has(block.type);
  const childUpdate = (i, fn) => set({children:fn(block.children || [],i)});
  return <article className={'hxstudio-block' + (expanded ? ' is-editing' : '') + (depth ? ' is-nested' : '')}>
    <div className="hxstudio-block-line">
      <span className="hxstudio-block-grip"><GripVertical size={16}/></span>
      <span className="hxstudio-block-type">{LABELS[block.type] || block.type}</span>
      <div className="hxstudio-block-info">
        {block.ref && <span className="hxstudio-block-ref">{block.ref}</span>}
        <strong>{block.label || 'Untitled field'}</strong>
        {!editing && block.type === 'table' && <small>{(block.columns || []).length} columns · {block.rows || 1} starting rows</small>}
        {!editing && CHOICES.has(block.type) && <small>{(block.options||[]).join(' · ')}</small>}
        {!editing && block.help && !CHOICES.has(block.type) && <small>{block.help}</small>}
      </div>
      <div className="hxstudio-block-actions">
        <button type="button" className="hxstudio-edit-button" onClick={()=>setActiveId(editing?null:block.id)} aria-expanded={editing} aria-label={`${editing?'Close editor for':'Edit'} ${block.label}`}>
          {editing ? 'Done' : 'Edit'} <ChevronDown size={14}/>
        </button>
        {!disabled && <>
          <button type="button" title="Move up" aria-label={`Move ${block.label} up`} disabled={index===0} onClick={onUp}><ArrowUp size={15}/></button>
          <button type="button" title="Move down" aria-label={`Move ${block.label} down`} disabled={index===total-1} onClick={onDown}><ArrowDown size={15}/></button>
          <button type="button" title="Duplicate" aria-label={`Duplicate ${block.label}`} onClick={onDuplicate}><Copy size={15}/></button>
          <button type="button" title="Delete" className="hxstudio-danger-icon" aria-label={`Delete ${block.label}`} onClick={onRemove}><Trash2 size={15}/></button>
        </>}
      </div>
    </div>
    {expanded && <div className="hxstudio-field-editor">
      <div className="hxstudio-properties">
        <label><span>Field / content type</span><select value={block.type} onChange={e=>changeType(e.target.value)}>{INPUT_TYPES.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
        <label className="hxstudio-wide"><span>{NON_FIELDS.has(block.type) ? 'Text / heading' : 'Question / field label'}</span><input value={block.label || ''} onChange={e=>set({label:e.target.value})} placeholder="Enter a label"/></label>
        {!NON_FIELDS.has(block.type) && <>
          <label><span>Item reference <em>optional</em></span><input value={block.ref||''} onChange={e=>set({ref:e.target.value})} placeholder="e.g. 1.1"/></label>
          <label className="hxstudio-wide"><span>Helper / evidence note <em>optional</em></span><input value={block.evidenceHint ?? block.help ?? ''} onChange={e=>set({help:e.target.value,evidenceHint:e.target.value})} placeholder="What should an auditor provide?"/></label>
          <label className="hxstudio-check"><input type="checkbox" checked={Boolean(block.required)} onChange={e=>set({required:e.target.checked})}/> Required to complete inspection</label>
        </>}
      </div>
      {CHOICES.has(block.type) && <OptionsEditor options={block.options || []} onChange={options=>set({options})} title={block.type==='list'?'List items':'Answer options'}/ >}
      {block.type==='table' && <TableEditor block={block} set={set}/>}
      {nested && <div className="hxstudio-child-layout"><div className="hxstudio-editor-caption"><strong>Fields in this {block.type}</strong><span>Each field can be edited, moved or removed individually.</span></div>
        <div className={'hxstudio-children '+(block.type==='columns'?'as-columns':'')}>
          {(block.children||[]).map((child,i)=><BlockCard key={child.id} block={child} index={i} total={block.children.length} depth={depth+1} activeId={activeId} setActiveId={setActiveId}
            onChange={next=>childUpdate(i,items=>items.map((v,j)=>j===i?next:v))}
            onRemove={()=>childUpdate(i,items=>items.filter((_,j)=>j!==i))}
            onDuplicate={()=>childUpdate(i,items=>items.flatMap((v,j)=>j===i?[v,duplicateBlock(v)]:[v]))}
            onUp={()=>childUpdate(i,items=>swap(items,i,-1))} onDown={()=>childUpdate(i,items=>swap(items,i,1))}/>)}</div>
        <AddContent compact label="Add field inside" onAdd={type=>set({children:[...(block.children||[]),newBlock(type)]})}/>
      </div>}
      <div className="hxstudio-field-editor-footer"><button type="button" className="hxstudio-done" onClick={()=>setActiveId(null)}><Check size={15}/> Done editing</button></div>
    </div>}
  </article>;
}

export default function HxcTemplatePage({onBack}) {
  const {db, isAdmin, saveRecord} = usePortal();
  const template = db.templates.find(t=>t.id==='hxc');
  const [schema,setSchema] = useState(()=>getHxcSchema(template));
  const [reportConfig,setReportConfig] = useState(()=>getReportConfig(template));
  const [assigned,setAssigned] = useState(()=>template?.workspaceIds || []);
  // The builder is the DEFAULT destination when someone opens the HXC template card.
  const [view,setView] = useState(isAdmin?'builder':'preview');
  const [selectedSectionId,setSelectedSectionId] = useState(()=>getHxcSchema(template)[0]?.id || '');
  const [activeId,setActiveId] = useState(null);
  const [findSection,setFindSection] = useState('');
  const [addedType,setAddedType] = useState('radio');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [saved,setSaved] = useState(()=>signature(getHxcSchema(template),getReportConfig(template),template?.workspaceIds||[]));
  const dirty = useMemo(()=>signature(schema,reportConfig,assigned)!==saved,[schema,reportConfig,assigned,saved]);
  const sectionIndex = schema.findIndex(s=>s.id===selectedSectionId);
  const selectedSection = schema[sectionIndex] || schema[0];
  const shownSections = schema.filter(s=>s.title.toLowerCase().includes(findSection.toLowerCase()));
  const setSection = (sectionId,patch) => {setSchema(old=>old.map(s=>s.id===sectionId?{...s,...patch}:s));setNotice('');};
  const addSection = () => {const section={id:createBlockId(),title:'New section',description:'',blocks:[]};setSchema(old=>[...old,section]);setSelectedSectionId(section.id);setActiveId(null);setView('builder');setNotice('');};
  const addField = (type) => {if(!selectedSection)return;const block=newBlock(type);setSection(selectedSection.id,{blocks:[...selectedSection.blocks,block]});setActiveId(block.id);setAddedType(type);};
  const duplicateSection = () => {if(!selectedSection)return;const section={...cloneSchema(selectedSection),id:createBlockId(),title:`${selectedSection.title} (copy)`,blocks:selectedSection.blocks.map(duplicateBlock)};setSchema(old=>old.flatMap(s=>s.id===selectedSection.id?[s,section]:[s]));setSelectedSectionId(section.id);setActiveId(null);};
  const removeSection = () => {if(schema.length<2){setError('Keep at least one section in the template.');return;}if(!window.confirm(`Delete "${selectedSection.title}" and its fields from the template?`))return;setSchema(old=>old.filter(s=>s.id!==selectedSection.id));setSelectedSectionId(schema.find(s=>s.id!==selectedSection.id)?.id||'');setActiveId(null);setNotice('');};
  const moveSection = delta => {setSchema(old=>swap(old,sectionIndex,delta));setNotice('');};
  const save = () => {
    const invalid = validateSchema(schema) || validateReportConfig(reportConfig);
    if(invalid){setError(invalid);setNotice('');return;}
    try {
      saveRecord('templates', {...template,id:'hxc',schema:cloneSchema(schema),reportConfig:cloneReportConfig(reportConfig),workspaceIds:[...assigned],questions:countQuestions(schema)});
      setSaved(signature(schema,reportConfig,assigned));setNotice('All changes saved. New inspections will use this template. Existing inspections keep their saved versions.');setError('');
    } catch(e){setError(e.message||'Could not save template.');setNotice('');}
  };
  const reset=()=>{if(!window.confirm('Restore the original HXC template? Your unsaved changes will be replaced. Existing inspections will not change.'))return;setSchema(cloneSchema(DEFAULT_HXC_SCHEMA));setReportConfig(cloneReportConfig(DEFAULT_REPORT_CONFIG));setSelectedSectionId(DEFAULT_HXC_SCHEMA[0].id);setActiveId(null);setView('builder');setError('');setNotice('Original HXC content restored in the editor. Click Save changes to apply it.');};
  const exit=()=>{if(dirty && !window.confirm('You have unsaved template edits. Leave without saving?'))return;onBack?.();};
  useEffect(()=>{
    const leave = event=>{if(!dirty)return;event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',leave);
    return ()=>window.removeEventListener('beforeunload',leave);
  },[dirty]);
  return <main className="workspace-page sw-page hxstudio" aria-label="HXC template workspace">
    <div className="hxstudio-breadcrumb"><button type="button" onClick={exit}><ArrowLeft size={15}/> Back to templates</button><span>/</span><strong>HXC Audit Template</strong></div>
    <header className="hxstudio-hero">
      <div className="hxstudio-hero-icon"><ClipboardList size={25}/></div>
      <div className="hxstudio-hero-text"><span className="hxstudio-eyebrow">TEMPLATE WORKSPACE</span><h1>HXC Audit Template</h1><p>Build your inspection, one field at a time. Select a section, edit its contents, then save.</p></div>
      <div className="hxstudio-hero-actions">
        <span className={'hxstudio-save-state '+(dirty?'is-unsaved':'is-saved')}><span/>{dirty?'Unsaved changes':'All changes saved'}</span>
        {isAdmin && <button className="hxstudio-save-button" type="button" onClick={save}><Save size={16}/> Save changes</button>}
      </div>
    </header>
    <div className="hxstudio-modebar" role="tablist" aria-label="Template workspace views">
      <button type="button" role="tab" aria-selected={view==='builder'} className={view==='builder'?'active':''} onClick={()=>setView('builder')}><LayoutGrid size={17}/> Builder</button>
      <button type="button" role="tab" aria-selected={view==='preview'} className={view==='preview'?'active':''} onClick={()=>setView('preview')}><Eye size={17}/> Preview form</button>
      <button type="button" role="tab" aria-selected={view==='settings'} className={view==='settings'?'active':''} onClick={()=>setView('settings')}><Settings2 size={17}/> Report layout & tables</button>
      <span className="hxstudio-mode-count">{schema.length} sections · {countQuestions(schema)} fields</span>
    </div>
    {error && <div className="hxstudio-alert is-error" role="alert">{error}<button type="button" onClick={()=>setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    {notice && <div className="hxstudio-alert is-success" role="status"><Check size={16}/>{notice}<button type="button" onClick={()=>setNotice('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
    {!isAdmin && <div className="hxstudio-alert">Editing is available to administrators. You can preview the form.</div>}
    {view==='builder' && <div className="hxstudio-workspace">
      <aside className="hxstudio-sidebar">
        <div className="hxstudio-sidebar-top"><strong>Sections</strong><span>{schema.length}</span></div>
        <input className="hxstudio-section-search" type="search" value={findSection} placeholder="Find a section..." aria-label="Find a section" onChange={e=>setFindSection(e.target.value)}/>
        <div className="hxstudio-section-nav">{shownSections.map(section=>{
          const i=schema.findIndex(s=>s.id===section.id);
          return <button type="button" key={section.id} className={'hxstudio-section-link'+(selectedSection?.id===section.id?' active':'')} onClick={()=>{setSelectedSectionId(section.id);setActiveId(null);}}>
            <span className="hxstudio-section-index">{String(i+1).padStart(2,'0')}</span><span className="hxstudio-section-link-text"><strong>{section.title}</strong><small>{section.blocks.length} blocks</small></span>
          </button>;
        })}</div>
        {isAdmin && <button type="button" className="hxstudio-add-section" onClick={addSection}><Plus size={16}/> Add section</button>}
        <div className="hxstudio-sidebar-foot"><span><Check size={14}/> Inspections will use saved edits</span></div>
      </aside>
      {selectedSection && <section className="hxstudio-canvas" aria-label={`Editing ${selectedSection.title}`}>
        <div className="hxstudio-canvas-head"><div><span className="hxstudio-canvas-kicker">SECTION {String(Math.max(0,sectionIndex)+1).padStart(2,'0')}</span><h2>{selectedSection.title}</h2><p>Edit text and questions directly below. Use the controls on each field to move, duplicate or delete it.</p></div>
          {isAdmin && <div className="hxstudio-section-actions">
            <button type="button" title="Move section up" aria-label="Move section up" disabled={sectionIndex===0} onClick={()=>moveSection(-1)}><ArrowUp size={17}/></button>
            <button type="button" title="Move section down" aria-label="Move section down" disabled={sectionIndex===schema.length-1} onClick={()=>moveSection(1)}><ArrowDown size={17}/></button>
            <button type="button" title="Duplicate section" aria-label="Duplicate section" onClick={duplicateSection}><Copy size={17}/></button>
            <button type="button" title="Delete section" aria-label="Delete section" className="hxstudio-danger-icon" onClick={removeSection}><Trash2 size={17}/></button>
          </div>}
        </div>
        {isAdmin && <div className="hxstudio-section-fields"><label><span>Section title</span><input value={selectedSection.title} onChange={e=>setSection(selectedSection.id,{title:e.target.value})}/></label><label><span>Section description <em>optional</em></span><textarea rows={2} placeholder="Add a short note for inspectors..." value={selectedSection.description||''} onChange={e=>setSection(selectedSection.id,{description:e.target.value})}/></label></div>}
        <div className="hxstudio-block-list">
          <div className="hxstudio-block-list-head"><strong>Section content</strong><span>{selectedSection.blocks.length} items</span></div>
          {selectedSection.blocks.map((block,i)=><BlockCard key={block.id} block={block} index={i} total={selectedSection.blocks.length} activeId={activeId} setActiveId={setActiveId} disabled={!isAdmin}
            onChange={value=>setSection(selectedSection.id,{blocks:selectedSection.blocks.map((v,j)=>i===j?value:v)})}
            onRemove={()=>{setSection(selectedSection.id,{blocks:selectedSection.blocks.filter((_,j)=>i!==j)});if(activeId===block.id)setActiveId(null);}}
            onDuplicate={()=>setSection(selectedSection.id,{blocks:selectedSection.blocks.flatMap((v,j)=>j===i?[v,duplicateBlock(v)]:[v])})}
            onUp={()=>setSection(selectedSection.id,{blocks:swap(selectedSection.blocks,i,-1)})}
            onDown={()=>setSection(selectedSection.id,{blocks:swap(selectedSection.blocks,i,1)})}/>) }
          {!selectedSection.blocks.length && <div className="hxstudio-empty"><FileText size={23}/><strong>No fields yet</strong><span>Choose a field type below to build this section.</span></div>}
        </div>
        {isAdmin && <AddContent onAdd={addField}/>}
        <div className="hxstudio-canvas-foot"><span>Section scores and the audit summary are configured under <button type="button" onClick={()=>setView('settings')}>Report layout & tables</button>.</span></div>
      </section>}
    </div>}
    {view==='preview' && <div className="hxstudio-preview-screen"><div className="hxstudio-preview-banner"><div><strong>Live inspection preview</strong><span>Read-only preview of the latest template edits. Changes here are not inspection responses.</span></div><button type="button" onClick={()=>setView('builder')}><ArrowLeft size={15}/> Back to builder</button></div><HxcReportDocument schema={schema} reportConfig={reportConfig} answers={{}} disabled preview/></div>}
    {view==='settings' && <div className="hxstudio-settings-screen"><div className="hxstudio-settings-intro"><div><h2>Report layout & tables</h2><p>Change the report title, cover fields, checklist columns, summary, action tracker and photo appendix here.</p></div><button type="button" onClick={()=>setView('builder')}><ArrowLeft size={15}/> Back to builder</button></div><ReportSettingsEditor config={reportConfig} onChange={isAdmin?setReportConfig:()=>{}}/>
      {isAdmin && <details className="hxstudio-access"><summary>Workspace access ({assigned.length} selected)</summary><div>{db.workspaces.filter(w=>w.status!=='Inactive'&&!w.migrated).map(w=><label key={w.id}><input type="checkbox" checked={assigned.includes(w.id)} onChange={e=>setAssigned(old=>e.target.checked?[...old,w.id]:old.filter(id=>id!==w.id))}/>{w.name}</label>)}</div></details>}
      {isAdmin && <div className="hxstudio-settings-actions"><button type="button" className="hxstudio-reset" onClick={reset}><RotateCcw size={15}/> Restore original HXC</button></div>}
    </div>}
    <footer className="hxstudio-bottom-bar"><span>{dirty?'Changes have not been saved yet.':'Template is up to date.'} Existing inspections retain their saved form.</span>{isAdmin && <button type="button" onClick={save} disabled={!dirty}><Save size={15}/> Save changes</button>}</footer>
  </main>;
}
