import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { hxcTemplate } from './hxcTemplate.js';
import { storageKey, uid, blankResponse, createBlank, parseSaved, itemById, computed, validate } from './hxcModel.js';
import { sectionScore, commaCsv, printHxc } from './hxcExport.js';
import { photoCompress } from './hxcPhotos.js';
import { Chip } from './components/HxcUI.jsx';
import HxcAuditList from './components/HxcAuditList.jsx';
import '../../styles/hxc.css';


import { usePortal } from '../../app/PortalContext.jsx';
import { HxcEditorProvider } from './HxcEditorContext.jsx';
import HxcEditorSidebar from './components/HxcEditorSidebar.jsx';
import HxcEditorHeading from './components/HxcEditorHeading.jsx';
import AuditDetailsTab from './tabs/AuditDetailsTab.jsx';
import ChecklistTab from './tabs/ChecklistTab.jsx';
import AuditSummaryTab from './tabs/AuditSummaryTab.jsx';
import AuditActionsTab from './tabs/AuditActionsTab.jsx';
import PhotoAppendixTab from './tabs/PhotoAppendixTab.jsx';
import SignoffTab from './tabs/SignoffTab.jsx';
import ReviewTab from './tabs/ReviewTab.jsx';

export default function HxcAudits({ workspaceId, initialAuditId = null, createNew = false, onExit = null, initialTab = 'overview' } = {}) {
  const portal = usePortal();
  const activeWorkspaceId = workspaceId || portal.activeWorkspaceId;
  const projects = portal.db.projects.filter(p => p.workspaceId === activeWorkspaceId);
  const [startup] = useState(() => {
    const records = parseSaved(activeWorkspaceId);
    if (!createNew) return { records, id: initialAuditId };
    const fresh = { ...createBlank(), workspaceId: activeWorkspaceId, projectId: '' };
    return { records: [fresh, ...records], id: fresh.id };
  });
  const [audits, setAudits] = useState(startup.records);
  const [activeId, setActiveId] = useState(startup.id);
  const [tab, setTab] = useState(initialTab); const [selectedSection, setSelectedSection] = useState(1); const [filter, setFilter] = useState('All'); const [query, setQuery] = useState(''); const [notice, setNotice] = useState(''); const [validation, setValidation] = useState([]); const [actionItem, setActionItem] = useState(null);
  const active = audits.find(a => a.id === activeId); const stats = active ? computed(active) : null;
  const update = (fn) => { setAudits(old => old.map(a => a.id === activeId ? { ...fn(a), updatedAt: new Date().toISOString() } : a)); setValidation([]) ;};
  const notify = t => { setNotice(t); setTimeout(() => setNotice(''), 4000) ;};
  useEffect(() => { try { localStorage.setItem(storageKey(activeWorkspaceId), JSON.stringify(audits)); window.dispatchEvent(new CustomEvent('ssc-hxc-changed', { detail: { workspaceId: activeWorkspaceId } }));} catch (e) { console.warn('localStorage quota exceeded', e); setNotice('Storage limit reached. Export this audit to JSON and remove some photos.') ;} }, [audits, activeWorkspaceId]);
  const list = useMemo(() => audits.filter(a => (filter === 'All' || a.state === filter) && `${a.id} ${a.meta.projectName} ${a.meta.assessor} ${a.meta.type}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))), [audits, filter, query]);
  const overall = useMemo(() => { const sample = audits.filter(a => a.state === 'Completed' && !a.demo).map(a => computed(a).score).filter(x => x != null); return { total: audits.length, finished: audits.filter(a => a.state === 'Completed').length, opened: audits.reduce((n, a) => n + computed(a).open, 0), score: sample.length ? (sample.reduce((x, y) => x + y, 0) / sample.length).toFixed(1) + '%' : '—' } ;}, [audits, activeWorkspaceId]);
  const openAudit = a => { setActiveId(a.id); setSelectedSection(1); setTab('overview'); setValidation([]); setActionItem(null) ;};
  const newAudit = () => { const a = { ...createBlank(), workspaceId: activeWorkspaceId, projectId: '' }; setAudits(old => [a, ...old]); openAudit(a); notify('New HXC inspection created. Auto-save is enabled.') ;};
  const updateMeta = (field, value) => update(a => ({ ...a, meta: { ...a.meta, [field]: value } }));
  const updateResponse = (id, patch) => update(a => { const r = { ...blankResponse(), ...(a.responses?.[id] || {}), ...patch }; if (patch.status && !['MI', 'MA'].includes(patch.status)) r.actionRef = ''; return { ...a, responses: { ...a.responses, [id]: r } } ;});
  const updateSection = (id, patch) => update(a => ({ ...a, sections: { ...a.sections, [id]: { ...(a.sections?.[id] || {}), ...patch } } }));
  const updateField = (field, value) => update(a => ({ ...a, [field]: value }));
  const deleteAudit = id => {
    if (!window.confirm('Delete this audit and its local evidence? This cannot be undone.')) return;
    const next = audits.filter(a => a.id !== id);
    // Persist before leaving the editor. Otherwise a route change can unmount
    // this component before its normal auto-save effect has run.
    try {
      localStorage.setItem(storageKey(activeWorkspaceId), JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('ssc-hxc-changed', { detail: { workspaceId: activeWorkspaceId } }));
    } catch {
      notify('Could not delete audit: browser storage is unavailable.');
      return;
    }
    setAudits(next); setActiveId(null); onExit?.(); notify('Audit deleted from this browser.');
  };
  const exportJson = a => { const blob = new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const x = document.createElement('a'); x.href = url; x.download = `${a.id}.json`; x.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Audit JSON downloaded.') ;};
  const complete = () => { const errs = validate(active); if (errs.length) { setValidation(errs); setTab('review'); notify(`${errs.length} completion checks require attention.`); return ;} update(a => ({ ...a, state: 'Completed', completedAt: new Date().toISOString() })); notify('Audit marked completed; all validation checks passed.') ;};
  const startAction = item => { setActionItem(item.id); setTab('actions') ;};
  const addAction = itemId => { const cur = active.responses?.[itemId] || {}; const existing = active.actions.find(x => x.itemId === itemId && x.id === cur.actionRef); if (existing) { notify('Linked action already exists. Edit it below.'); return ;} const id = 'HXC-ACT-' + uid().toUpperCase().slice(0, 6); const x = { id, itemId, finding: itemById[itemId]?.requirement || '', requiredAction: '', priority: cur.status === 'MA' ? 'Critical' : 'Medium', owner: '', targetDate: '', closedOn: '', verifiedBy: '', status: 'Open' }; update(a => ({ ...a, actions: [...a.actions, x], responses: { ...a.responses, [itemId]: { ...blankResponse(), ...a.responses[itemId], actionRef: id } } })); setActionItem(itemId); notify('Corrective action linked to checklist item.') ;};
  const updateAction = (id, patch) => update(a => ({ ...a, actions: a.actions.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const removeAction = id => { if (!window.confirm('Remove this corrective action?')) return; update(a => ({ ...a, actions: a.actions.filter(x => x.id !== id), responses: Object.fromEntries(Object.entries(a.responses).map(([key, r]) => [key, r.actionRef === id ? { ...r, actionRef: '' } : r])) })); notify('Action removed.') ;};
  const addPhotos = async (item, files) => { try { const images = []; for (const file of Array.from(files).slice(0, 4)) { images.push(await photoCompress(file)) ;} const existing = active.responses?.[item.id]?.photos || []; if (existing.length + images.length > 12) { notify('Maximum 12 photos per checklist item.'); return ;} updateResponse(item.id, { photos: [...existing, ...images] }); notify(`${images.length} photo(s) attached locally.`) ;} catch (e) { notify(e.message || 'Photo upload failed.') ;} };
  const submitNAToAll = sec => { if (!window.confirm(`Mark all requirements in Section ${sec.id} as N/A and exclude the entire section from scoring?`)) return; update(a => { const responses = { ...a.responses }; for (const item of sec.items) responses[item.id] = { ...blankResponse(), status: 'NA' }; return { ...a, responses, sections: { ...a.sections, [sec.id]: { na: true, score: null, rationale: 'Not applicable to this assessment.', strength: '' } }, actions: (a.actions || []).filter(x => !sec.items.some(it => it.id === x.itemId)) } ;}) ;};
  const [photoLightbox, setPhotoLightbox] = useState(null);
  if (!active && onExit) return <section className="panel padded"><h2>Inspection not found</h2><button className="btn primary" onClick={onExit}>Return to inspections</button></section>;
  if (!active) return <HxcAuditList overall={overall} list={list} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} newAudit={newAudit} openAudit={openAudit} notice={notice} />;
  const section = hxcTemplate.find(s => s.id === selectedSection); const cursec = active.sections?.[selectedSection] || {}; const readOnly = active.state === 'Completed';
  const sectionDone = s => { const ss = active.sections?.[s.id] || {}; const itemsDone = s.items.every(i => active.responses?.[i.id]?.status); return itemsDone && (ss.na || ss.score !== '' && ss.score != null && ss.rationale?.trim()) ;};
  const editorValue = { onExit, active, projects, readOnly, stats, section, cursec, tab, setTab, selectedSection, setSelectedSection, sectionDone, updateMeta, updateResponse, updateSection, updateField, startAction, addAction, updateAction, removeAction, addPhotos, submitNAToAll, setPhotoLightbox, actionItem, setValidation, validation, complete, notify, setActiveId: onExit ? (id => id === null ? onExit() : setActiveId(id)) : setActiveId, exportJson, update, deleteAudit };
  return <HxcEditorProvider value={editorValue}><div className="hxc-page hxc-editor">
    <HxcEditorHeading />
    <div className="hxc-editor-shell"><HxcEditorSidebar />
      <div className="hxc-editor-main">
        <div className="hxc-current-banner"><div><span>HXC COMPLIANCE FRAMEWORK</span><strong>{tab === 'overview' ? 'Assessment details' : tab === 'section' ? `Section ${section.id} of 10` : tab === 'summary' ? 'Audit summary' : tab === 'actions' ? 'Corrective action register' : tab === 'appendix' ? 'Appendix A · Evidence' : tab === 'signoff' ? 'Declaration and close-out' : 'Quality review'}</strong></div><div><Chip tone={readOnly ? 'success' : 'draft'}>{active.state}</Chip><span className="hxc-compliance-number" title="Provisional until the whole audit is completed">{stats.score == null ? '—' : stats.score.toFixed(1) + '%'}</span></div></div>
        {tab === 'overview' && <AuditDetailsTab />}
        {tab === 'section' && <ChecklistTab />}
        {tab === 'summary' && <AuditSummaryTab />}
        {tab === 'actions' && <AuditActionsTab />}
        {tab === 'appendix' && <PhotoAppendixTab />}
        {tab === 'signoff' && <SignoffTab />}
        {tab === 'review' && <ReviewTab />}
      </div></div>
    {photoLightbox && <div className="hxc-lightbox" onClick={() => setPhotoLightbox(null)}><button aria-label="Close photo" onClick={() => setPhotoLightbox(null)}><X size={20} /></button><img src={photoLightbox.data} alt={photoLightbox.name} /><span>{photoLightbox.name}</span></div>}
    {notice && <div className="hxc-notice"><CheckCircle2 size={15} />{notice}</div>}
  </div></HxcEditorProvider>;
}
