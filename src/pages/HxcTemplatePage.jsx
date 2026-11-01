import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, RotateCcw, Save, X } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { getHxcSchema, DEFAULT_HXC_SCHEMA, countQuestions, validateSchema, cloneSchema } from '../features/templates/hxcSchema.js';
import { getReportConfig, validateReportConfig, cloneReportConfig, DEFAULT_REPORT_CONFIG } from '../features/templates/hxcReportConfig.js';
import ReportSettingsEditor from '../features/templates/ReportSettingsEditor.jsx';
import WordTemplateWorkspace from '../features/templates/WordTemplateWorkspace.jsx';
import '../styles/hxc-template-studio.css';

const signature = (schema, config, assigned) => JSON.stringify([schema, config, assigned]);

/** The document is the single main editing surface. The former Fields & Structure
 * tab and its side navigation were intentionally removed; HXC fields stay editable
 * on the page or in the selected field's properties. */
export default function HxcTemplatePage({ onBack }) {
  const { db, saveRecord, isAdmin, activeWorkspaceId } = usePortal();
  const template = db.templates.find(item => item.id === 'hxc');
  const editorRef = useRef(null);
  const saveRef = useRef(null);
  const [schema, setSchema] = useState(() => getHxcSchema(template));
  const [reportConfig, setReportConfig] = useState(() => getReportConfig(template));
  const [assigned, setAssigned] = useState(() => template?.workspaceIds || []);
  const [view, setView] = useState('document');
  const [editorDirty, setEditorDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(() => signature(getHxcSchema(template), getReportConfig(template), template?.workspaceIds || []));
  const dirty = useMemo(() => editorDirty || signature(schema, reportConfig, assigned) !== saved, [editorDirty, schema, reportConfig, assigned, saved]);

  const save = async () => {
    if (!isAdmin || saving || !template) return;
    setSaving(true);
    try {
      const draft = editorRef.current?.snapshot() || { schema, reportConfig };
      const invalid = validateSchema(draft.schema) || validateReportConfig(draft.reportConfig);
      if (invalid) throw new Error(invalid);
      await saveRecord('templates', {
        ...template, id: 'hxc', schema: cloneSchema(draft.schema),
        reportConfig: cloneReportConfig(draft.reportConfig), workspaceIds: [...assigned], questions: countQuestions(draft.schema),
      });
      setSchema(draft.schema);
      setReportConfig(draft.reportConfig);
      setSaved(signature(draft.schema, draft.reportConfig, assigned));
      setEditorDirty(false);
      setError('');
      setNotice('Template saved. Future inspections use these changes; existing inspections retain their saved snapshots.');
    } catch (err) { setError(err.message || 'Unable to save template.'); setNotice(''); }
    finally { setSaving(false); }
  };
  saveRef.current = save;
  const exit = () => { if (dirty && !window.confirm('Leave without saving your template edits?')) return; onBack?.(); };
  const openSettings = () => {
    try {
      const draft = editorRef.current?.snapshot();
      if (draft) { setSchema(draft.schema); setReportConfig(draft.reportConfig); }
      setView('settings');
    } catch (err) { setError(err.message); }
  };
  const reset = () => {
    if (!window.confirm('Restore the original HXC template? Your unsaved edits will be replaced. Existing inspections will not change.')) return;
    setSchema(cloneSchema(DEFAULT_HXC_SCHEMA));
    setReportConfig(cloneReportConfig(DEFAULT_REPORT_CONFIG));
    setEditorDirty(true);
    setError('');
    setNotice('Original template restored locally. Save to apply it.');
    setView('document');
  };
  useEffect(() => {
    const beforeUnload = event => { if (!dirty) return; event.preventDefault(); event.returnValue = ''; };
    const shortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault(); event.stopPropagation(); saveRef.current?.();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('keydown', shortcut, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('keydown', shortcut, true); };
  }, [dirty]);
  if (!template) return <main className="hxstudio"><p role="alert">HXC template not found. No saved records were changed.</p><button onClick={onBack}>Back to templates</button></main>;

  return <main className={`workspace-page sw-page hxstudio ${view === 'document' ? 'hxc-document-mode' : ''}`} aria-label="HXC template workspace">
    {view === 'document' ? <WordTemplateWorkspace
      ref={editorRef} schema={schema} reportConfig={reportConfig} workspaceId={activeWorkspaceId}
      onSave={save} onDirty={() => setEditorDirty(true)} dirty={dirty} saving={saving}
      onSettings={openSettings} onClose={exit} readOnly={!isAdmin}
      externalError={error} externalNotice={notice} onDismissExternalError={() => setError('')} onDismissExternalNotice={() => setNotice('')}
      inspections={db.audits.filter(r => r.templateId === 'hxc' && Array.isArray(r.schemaSnapshot) && (activeWorkspaceId === 'admin' || r.workspaceId === activeWorkspaceId))}
    /> : <>
      <div className="hxstudio-breadcrumb"><button type="button" onClick={() => setView('document')}><ArrowLeft size={15}/> Return to Word editor</button><span>/</span><strong>Report layout & tables</strong></div>
      <div className="hxstudio-settings-screen">
        <div className="hxstudio-settings-intro"><div><h2>Report layout & tables</h2><p>Configure HXC report columns, cover, summary, and appendices. The Word editor handles text and template field editing.</p></div><button type="button" onClick={() => setView('document')}><ArrowLeft size={15}/> Back to document</button></div>
        <fieldset disabled={!isAdmin} className="hxc-settings-fieldset"><ReportSettingsEditor config={reportConfig} onChange={next => { setReportConfig({ ...next, editorDocument: null }); setEditorDirty(true); }}/></fieldset>
        {isAdmin && <details className="hxstudio-access"><summary>Workspace access ({assigned.length} selected)</summary><div>{db.workspaces.filter(w => w.status !== 'Inactive' && !w.migrated).map(w => <label key={w.id}><input type="checkbox" checked={assigned.includes(w.id)} onChange={event => setAssigned(old => event.target.checked ? [...old, w.id] : old.filter(id => id !== w.id))}/>{w.name}</label>)}</div></details>}
        <div className="hxstudio-settings-actions"><button type="button" onClick={() => setView('document')}><ArrowLeft size={15}/> Back to Word editor</button>{isAdmin && <><button type="button" onClick={reset}><RotateCcw size={15}/> Restore original template</button><button type="button" className="hxstudio-save-button" onClick={save} disabled={saving}><Save size={16}/> Save changes</button></>}</div>
      </div>
    </>}
    {view === 'settings' && error && <div className="hxstudio-alert is-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    {view === 'settings' && notice && <div className="hxstudio-alert is-success" role="status"><Check size={15}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </main>;
}
