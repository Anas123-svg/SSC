import React, { useState } from 'react';
import { usePortal } from '../app/PortalContext.jsx';
import { DataTable, Button, RecordForm, FormModal, CollectionHeader, FilterBar } from '../components/common/WorkspaceUI.jsx';
import { Status } from '../components/common/PortalUI.jsx';
import { isOverdue, today } from '../data/repository.js';
import { csv } from '../utils/reporting.js';
import { hxcTemplate } from '../features/hxc/hxcTemplate.js';
import ProjectDetailPage from './ProjectDetailPage.jsx';
const text = (key,label,required=false) => ({key,label,required});
const select = (key,label,options,required=false) => ({key,label,options,type:'select',required});
const area = (key,label,required=false) => ({key,label,type:'textarea',wide:true,required});
const date = (key,label,required=false) => ({key,label,type:'date',required});
const number = (key,label,min,max) => ({key,label,type:'number',min,max,required:true});
const roles = ['Super Admin','Admin','Site Manager','Inspector','Viewer'];
const config = {
 sites: { collection:'projects', title:'Projects & Locations', add:'Add project' },
 actions: { collection:'actions', title:'Corrective action register', add:'Create action' },
 schedule: { collection:'schedule', title:'Planned inspections', add:'Schedule inspection' },
 documents: { collection:'documents', title:'Document library', add:'Upload document' },
 team: { collection:'users', title:'Workspace team', add:'Add member' },
 users: { collection:'users', title:'Users & Access', add:'Add user' },
 clients: { collection:'clients', title:'Client directory', add:'Add client' },
 templates: { collection:'templates', title:'Inspection templates', add:'Add register template' },
};
export default function RecordsPage({ embeddedPage = null }) {
 const ctx = usePortal();
 const { db, activeWorkspaceId, scoped, scopedSites, workspaces, matches, saveRecord, findProject, go, detailId, isAdmin, can } = ctx;
 const page = embeddedPage || ctx.page;
 const c = config[page], [editing,setEditing] = useState(null), [preview,setPreview] = useState(null);
 const [project,setProject] = useState(''), [status,setStatus] = useState(''), [type,setType] = useState(''), [from,setFrom] = useState(''), [to,setTo] = useState(''), [workspace,setWorkspace] = useState(''),  [calendar,setCalendar] = useState(false);
 const admin = activeWorkspaceId === 'admin';
 const projectOptions = v => scopedSites.filter(p => (!admin || p.workspaceId === v.workspaceId) && (p.status !== 'Archived' || p.id === v.projectId)).map(p => ({value:p.id,label:p.name}));
 const workspaceOptions = workspaces.filter(w => w.status !== 'Inactive').map(w => ({value:w.id,label:w.name}));
 const memberOptions = v => scoped('users').filter(u => u.status !== 'Inactive' && u.workspaceIds?.includes(admin ? v.workspaceId : activeWorkspaceId)).map(u => ({value:u.name,label:u.name}));
 const projectField = select('projectId','Project',projectOptions,true);
 const workspaceField = select('workspaceId','Workspace',workspaceOptions,true);
 const ownerField = text('assigned','Responsible person',true);
 const assignableTemplates = v => db.templates.filter(t => t.kind !== 'hxc' && t.workspaceIds?.includes(admin ? v.workspaceId : activeWorkspaceId)).map(t => ({value:t.name,label:t.name}));
 let fields;
 if (page === 'sites') fields = [text('name','Project name',true),text('reference','Project reference',true),text('address','Site address',true),text('manager','Project manager'),date('start','Start date'),date('end','Expected completion date'),select('status','Status',['Active','Planning','Completed','Archived'],true),area('description','Description')];
 if (page === 'actions') fields = [text('title','Finding / description',true),projectField,select('inspectionId','Related inspection',v => scoped('audits').filter(a => a.projectId === v.projectId).map(a => ({value:a.id,label:a.id + ' · ' + a.type}))),select('priority','Severity',['Low','Medium','High','Critical'],true),ownerField,date('due','Due date',true),select('status','Status',['Open','In Progress','Resolved','Closed'],true),area('notes','Progress notes'),area('evidence','Completion evidence / verification reference'),{key:'evidenceFile',label:'Completion attachment (up to 750 KB)',type:'file'}];
 if (page === 'schedule') fields = [projectField,select('inspector','Inspector',memberOptions,true),date('date','Date',true),{key:'time',label:'Time',type:'time',required:true},select('type','Inspection type',v => db.templates.filter(t => t.workspaceIds?.includes(admin ? v.workspaceId : activeWorkspaceId)).map(t=>t.name),true),select('status','Status',['Scheduled','Completed','Cancelled'],true),area('notes','Planning notes')];
 if (page === 'documents') fields = [text('name','Document title',true),{...projectField,required:false},select('category','Category',['Safety documentation','Method statements','Inspection reports','Certificates','Training records'],true),text('reference','Reference / revision'),area('description','Description'),{key:'file',label:'Local file (maximum 750 KB)',type:'file',hint:'Files are stored in this browser, not securely hosted.'}];
 if (['team','users'].includes(page)) fields = [text('name','Name',true),{key:'email',label:'Email',type:'email',required:true},select('role','Role',roles,true),select('status','Account status',['Active','Inactive'],true),{key:'workspaceIds',label:'Assigned workspaces',type:'multi',options:admin ? workspaceOptions : workspaceOptions.filter(w => w.value === activeWorkspaceId),wide:true},{key:'projectIds',label:'Project assignments',type:'multi',options:v => scopedSites.filter(p => v.workspaceIds?.includes(p.workspaceId)).map(p=>({value:p.id,label:p.name})),wide:true}];
 if (page === 'clients') fields = [text('name','Company name',true),text('contact','Contact person'),{key:'email',label:'Email',type:'email'},text('phone','Phone'),text('address','Address'),area('notes','Notes')];
 if (page === 'templates') fields = [text('name','Template name',true),select('category','Category',['General safety','Compliance','Equipment','Fire safety'],true),area('description','Description'),{key:'workspaceIds',label:'Assigned workspaces',type:'multi',options:workspaceOptions,wide:true}];
 if (admin && !['clients','users','templates'].includes(page)) fields = [workspaceField,...fields];
 const defaults = {workspaceId:admin ? '' : activeWorkspaceId,status:page==='actions' ? 'Open' : page==='schedule' ? 'Scheduled' : 'Active',date:today(),due:today(),role:'Viewer',workspaceIds:admin?[]:[activeWorkspaceId],modules:[],findings:0,likelihood:1,severity:1,residualLikelihood:1,residualSeverity:1,kind:'register'};
 let rows = page === 'actions' ? ctx.actions : ['clients','templates'].includes(c.collection) ? db[c.collection] : scoped(c.collection);
 rows = rows.filter(r => matches(r.id,r.name,r.title,r.type,r.inspector,r.email,r.assigned,r.hazard,r.category,findProject(r.projectId)) && (!project || r.projectId === project) && (!workspace || r.workspaceId === workspace || r.workspaceIds?.includes(workspace)) && (!status || (status==='Overdue'?isOverdue(r):r.status===status)) && (!type || (r.type || r.category)===type) && (!from || (r.date || r.updatedAt || '').slice(0,10)>=from) && (!to || (r.date || r.updatedAt || '').slice(0,10)<=to));
 const save = v => {
   if (['team','users'].includes(page) && !v.workspaceIds?.length && !['Admin','Super Admin'].includes(v.role)) throw new Error('Assign at least one workspace.');
   if (page === 'documents' && !v.file) throw new Error('Select a file to upload.');
   if (page === 'templates' && v.id === 'hxc') { v = {...v,name:'HXC compliance audit',kind:'hxc',questions:65}; }
   if (page === 'actions' && v.evidenceFile && !v.evidence?.trim()) v = {...v,evidence:'Attached: '+v.evidenceFile.name};
   saveRecord(c.collection,v);
 };
 const download = file => { const a=document.createElement('a'); a.href=file.data; a.download=file.name; a.click(); };
  const columns = [];
 columns.push({label:'Record',render:r=><><strong>{r.name || r.title || r.type}</strong><small>{r.reference || r.id}</small></>});
 if (admin && !['clients','templates'].includes(page)) columns.push({label:'Workspace',render:r=>r.workspaceIds ? r.workspaceIds.map(id=>workspaces.find(w=>w.id===id)?.name).filter(Boolean).join(', ') || 'None' : workspaces.find(w=>w.id===r.workspaceId)?.name || 'Unassigned legacy record'});
 if (['actions','schedule','documents'].includes(page)) columns.push({label:'Project',render:r=>findProject(r.projectId)});
 if (page==='sites') columns.push({label:'Address',key:'address'},{label:'Manager',key:'manager'},{label:'Client',render:r=>db.clients.find(c=>c.id===r.clientId)?.name || workspaces.find(w=>w.id===r.workspaceId)?.client});
 if (['schedule'].includes(page)) columns.push({label:'Inspector',key:'inspector'},{label:'Date / time',render:r=>[r.date,r.time].filter(Boolean).join(' ')});
 if (page==='actions') columns.push({label:'Source',render:r=>r.source==='hxc'?'HXC checklist':'General register'},{label:'Inspection',render:r=>r.inspectionId?.startsWith('hxc:')?r.inspectionId.split(':').slice(2).join(':'):r.inspectionId||'—'},{label:'Severity',key:'priority'},{label:'Owner',key:'assigned'},{label:'Due',key:'due'},{label:'Evidence',render:r=>r.evidenceFile ? <Button onClick={()=>download(r.evidenceFile)}>Download</Button> : r.evidence || '—'});
 if (['clients','users','team'].includes(page)) columns.push({label:'Email',key:'email'});
 if (['users','team'].includes(page)) columns.push({label:'Role',key:'role'},{label:'Projects',render:r=>(r.projectIds||[]).map(findProject).join(', ')||'None'});
 if (page==='clients') columns.push({label:'Contact',key:'contact'},{label:'Linked workspaces',render:r=>workspaces.filter(w=>w.clientId===r.id).map(w=>w.name).join(', ')||'None'});
 if (['documents','templates'].includes(page)) columns.push({label:'Category',key:'category'});
 if (page==='templates') columns.push({label:'Workflow',render:r=>r.kind==='hxc'?'65 checks · 10 sections':'Register record (no detailed checklist)'},{label:'Assigned workspaces',render:r=>(r.workspaceIds||[]).map(id=>workspaces.find(w=>w.id===id)?.name).join(', ')||'None'});
 if (!['clients','templates','documents'].includes(page)) columns.push({label:'Status',render:r=><Status text={isOverdue(r)?'Overdue':r.status || 'Active'}/>});
 columns.push({label:'Actions',render:r=><div className="row-actions">
 {page==='sites' && <Button onClick={()=>go('sites',r.id,r.workspaceId)}>View project</Button>}
 {page==='templates' && <Button onClick={()=>setPreview(r)}>Preview</Button>}
 {page==='documents' && r.file && <Button onClick={()=>download(r.file)}>Download</Button>}
 {(!['users','team','clients','templates'].includes(page)||isAdmin) && r.source !== 'hxc' && <Button onClick={()=>setEditing(r)}>{page==='templates'?'Edit / Assign':page==='actions'?'Update / Close':'Edit'}</Button>}
 {page==='actions' && r.source === 'hxc' && <Button onClick={()=>go('audits', r.inspectionId)}>Open HXC audit</Button>}
 {page==='sites' && r.status!=='Archived' && <Button onClick={()=>setPreview({...r,confirmArchive:true})}>Archive</Button>}
 </div>});
 if (page==='sites' && detailId) {
   const p=scopedSites.find(p=>p.id===detailId);
   if (!p) return <section className="panel padded"><h2>Project not found</h2><Button onClick={()=>go('sites')}>Back to projects</Button></section>;
   return <><ProjectDetailPage project={p} onEdit={() => setEditing(p)}/>{editing && <RecordForm title="Edit project" fields={fields} initial={editing} close={() => setEditing(null)} save={save}/>}</>;
 }
 const exportRows = () => { const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))].filter(k=>!['file','evidenceFile','logo'].includes(k)); csv(page+'-'+activeWorkspaceId+'.csv',[keys,...rows.map(r=>keys.map(k=>Array.isArray(r[k])?r[k].join('; '):r[k]))]); };
 return <div className="workspace-page">
 {['team','users'].includes(page)&&<p className="workspace-note">Roles and access assignments are simulated in this frontend demo. They do not authenticate users, send invitations or enforce secure access control.</p>}
 <section className="panel padded"><CollectionHeader title={c.title} description={page==='documents'?'Files stay in browser storage. Maximum 750 KB per file; browser quota also applies.':page==='schedule'?'Completing an appointment updates this schedule only; record the inspection separately.':undefined} onAdd={(!['users','team','clients','templates'].includes(page)||isAdmin)?()=>setEditing(defaults):undefined} label={c.add}><Button onClick={exportRows}>Export CSV</Button>{page==='schedule'&&<Button onClick={()=>setCalendar(!calendar)}>{calendar?'List view':'Calendar view'}</Button>}</CollectionHeader>
 <FilterBar>{admin&&!['clients','templates'].includes(page)&&<label>Workspace<select value={workspace} onChange={e=>setWorkspace(e.target.value)}><option value="">All workspaces</option>{workspaceOptions.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}</select></label>}
 {['actions','schedule','documents'].includes(page)&&<label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{scopedSites.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
 {!['clients','templates','documents'].includes(page)&&<label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{[...new Set((page==='actions' ? ctx.actions : scoped(c.collection)).map(r=>r.status).filter(Boolean)),...(page==='actions'?['Overdue']:[])].map(s=><option key={s}>{s}</option>)}</select></label>}
 {['schedule','documents','templates'].includes(page)&&<label>Type / category<select value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option>{[...new Set((page==='templates'?db.templates:page==='actions'?ctx.actions:scoped(c.collection)).map(r=>r.type||r.category).filter(Boolean))].map(t=><option key={t}>{t}</option>)}</select></label>}
 {['schedule'].includes(page)&&<><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}</FilterBar>
 {calendar&&page==='schedule'?<div className="schedule-calendar">{[...new Set(rows.map(r=>r.date))].sort().map(d=><section key={d}><h3>{d}</h3>{rows.filter(r=>r.date===d).map(r=><button key={r.id} onClick={()=>setEditing(r)}><strong>{r.time} · {r.type}</strong><small>{findProject(r.projectId)} · {r.inspector}</small><Status text={r.status}/></button>)}</section>)}{!rows.length&&<p>No scheduled inspections for these filters.</p>}</div>:<DataTable columns={columns} rows={rows}/>}</section>
 {editing&&<RecordForm title={editing.id?'Edit '+c.title:c.add} fields={fields} initial={editing} close={()=>setEditing(null)} save={save}/>}
 {preview&&<FormModal title={preview.confirmArchive?'Archive project?':preview.name} close={()=>setPreview(null)}><div className="dialog-body">{preview.confirmArchive?<><p>Archive {preview.name}? Its inspections and documents will be retained.</p><Button onClick={()=>{try{saveRecord('projects',{...preview,status:'Archived'});setPreview(null);}catch(e){ctx.setToast(e.message);}}}>Confirm archive</Button></>:<><p>{preview.description}</p>{preview.kind==='hxc'?hxcTemplate.map(s=><details key={s.id}><summary>{s.id}. {s.title} · {s.items.length} requirements</summary><ul>{s.items.map(i=><li key={i.id}>{i.ref} — {i.requirement}</li>)}</ul></details>):<p>This template creates a management register entry with project, inspector, date, notes, score and status. A detailed checklist is available only for HXC.</p>}</>}</div></FormModal>}
 </div>;
}


