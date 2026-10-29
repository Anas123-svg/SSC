import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { getHxcSchema, cloneSchema, completionStats, complianceScore, validateCompletedHxc, normalizeCompliance, formBlocks } from '../features/templates/hxcSchema.js';
import HxcReportDocument from '../features/templates/HxcReportDocument.jsx';
import { getReportConfig, cloneReportConfig } from '../features/templates/hxcReportConfig.js';
import { today } from '../data/repository.js';

/** Fillable HXC Word-style report. Previously completed inspection questions are snapshotted. */
export default function HxcInspectionForm({ existing = null, initialProjectId = '', onPersist = null, openOriginal = null }) {
  const { db, activeWorkspaceId, workspaces, scopedSites, saveRecord, go } = usePortal();
  const [record, setRecord] = useState(() => existing || {
    templateId: 'hxc', type: 'HXC compliance audit', status: 'Draft', date: today(),
    workspaceId: scopedSites.find(p => p.id === initialProjectId)?.workspaceId || (activeWorkspaceId === 'admin' ? '' : activeWorkspaceId),
    projectId: initialProjectId, inspector: '', answers: {},
    schemaSnapshot: getHxcSchema(db.templates.find(t => t.id === 'hxc')),
    reportConfigSnapshot: getReportConfig(db.templates.find(t => t.id === 'hxc')),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const assignedWorkspaces = db.templates.find(t => t.id === 'hxc')?.workspaceIds || [];
  const allowedWorkspaces = workspaces.filter(w => assignedWorkspaces.includes(w.id));
  const schema = record.schemaSnapshot || getHxcSchema(db.templates.find(t => t.id === 'hxc'));
  const reportConfig = record.reportConfigSnapshot || getReportConfig(db.templates.find(t=>t.id==='hxc'));
  const editable = record.status !== 'Completed';
  const projects = scopedSites.filter(p => p.workspaceId === record.workspaceId && p.status !== 'Archived');
  const project = projects.find(p => p.id === record.projectId);
  const set = (key, value) => setRecord(prev => ({ ...prev, [key]: value }));
  const setAnswer = (id, value) => setRecord(prev => ({ ...prev, answers: { ...prev.answers, [id]: value } }));
  const setMeta = (key, value) => setRecord(prev => ({ ...prev, [key]: value }));
  const stats = completionStats(schema, record.answers || {});

  const save = (status = record.status) => {
    setError('');
    if (!record.workspaceId || (!record.legacySource && !allowedWorkspaces.some(w => w.id === record.workspaceId))) { setError('Choose a workspace assigned to the HXC template.'); return; }
    if (!projects.some(p => p.id === record.projectId)) { setError('Choose a project.'); return; }
    if (!record.inspector?.trim()) { setError('Enter the assessor name.'); return; }
    if (!record.date) { setError('Select the date of assessment.'); return; }
    if (status === 'Completed') {
      const validationError = validateCompletedHxc(schema, record.answers || {});
      if (validationError) { setError(validationError + ' You can save a draft at any time.'); return; }
      if (reportConfig.showDeclaration !== false && (!String(record.answers?.['meta:assessorSignature'] || '').trim() || !String(record.answers?.['meta:managerSignature'] || '').trim())) {
        setError('Both assessor and project manager must add their digital signatures before completing. You can save a draft without signatures.'); return;
      }
    }
    setSaving(true);
    try {
      const findings = schema.flatMap(s => formBlocks(s.blocks)).filter(b => ['MI','MA'].includes(normalizeCompliance(record.answers?.[b.id]))).length;
      const saved = (onPersist || (payload => saveRecord('audits', payload)))({
        ...record, status, templateId: 'hxc', type: 'HXC compliance audit',
        score: status === 'Completed' ? complianceScore(schema, record.answers || {}) : null,
        findings, projectName: project?.name || '', schemaSnapshot: cloneSchema(schema), reportConfigSnapshot:cloneReportConfig(reportConfig),
      });
      go('audits', saved.id);
    } catch (e) { setError(e.message || 'Unable to save inspection. Check available browser storage if you added several photos.'); }
    finally { setSaving(false); }
  };

  return <main className="workspace-page sw-page sw-inspection hwd-inspection-page">
    <header className="hwd-inspection-toolbar">
      <div><button type="button" className="sw-back" onClick={() => go('audits')}><ArrowLeft size={15}/> Back to inspections</button>
        <h1>{existing ? 'HXC Compliance Report' : 'New HXC Compliance Report'}</h1>
        <p>Complete the report directly below, just like the Word document. {stats.answered} of {stats.total} checklist fields answered.</p></div>
      <div className="hwd-toolbar-actions">{record.projectId && <button type="button" className="sw-btn" onClick={() => go('sites',record.projectId,activeWorkspaceId,'inspections')}>Project inspections</button>}{openOriginal && <button type="button" className="sw-btn" onClick={openOriginal}>Original HXC evidence view</button>}<button type="button" className="sw-btn" disabled={saving || !editable} onClick={() => save('Draft')}><Save size={16}/> Save draft</button>
        <button type="button" className="sw-btn sw-primary" disabled={saving || !editable} onClick={() => save('Completed')}>Complete inspection</button></div>
    </header>
    {activeWorkspaceId === 'admin' && <div className="hwd-workspace-picker"><label>Workspace <select value={record.workspaceId || ''} disabled={!editable || Boolean(existing)} onChange={e => setRecord(prev => ({ ...prev, workspaceId:e.target.value, projectId:'' }))}>
      <option value="">Choose a workspace</option>{allowedWorkspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label></div>}
    {record.status === 'Completed' && <div className="sw-message">This inspection is completed. <button type="button" className="sw-inline-button" onClick={() => setRecord(prev => ({ ...prev, status:'Draft' }))}>Reopen for editing</button></div>}
    {!record.legacySource && !allowedWorkspaces.some(w => w.id === record.workspaceId) && <div className="sw-message">The HXC template is not assigned to this workspace. An administrator can enable it under Templates → Workspace access.</div>}
    {error && <div className="sw-error" role="alert">{error}</div>}
    <HxcReportDocument schema={schema} reportConfig={reportConfig} answers={record.answers || {}} setAnswer={setAnswer} disabled={!editable}
      meta={{date: record.date, inspector: record.inspector, projectId:record.projectId}} onMeta={setMeta}
      projects={projects} projectName={project?.address || project?.location || ''} />
    <div className="hwd-bottom-toolbar"><button type="button" className="sw-btn" onClick={() => go('audits')}>Back to inspections</button>
      <button type="button" className="sw-btn" disabled={saving || !editable} onClick={() => save('Draft')}>Save draft</button>
      <button type="button" className="sw-btn sw-primary" disabled={saving || !editable} onClick={() => save('Completed')}>Complete inspection</button></div>
  </main>;
}
