import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { generateHTML, generateJSON } from '@tiptap/core';
import { Undo2, Redo2, Save, Eye, Printer, Settings2, Maximize2, Minimize2, ArrowUp, ArrowDown, Copy, Trash2, Plus, X } from 'lucide-react';
import { documentExtensions } from './documentExtensions.js';
import { COMPLIANCE_CODES, COMPLIANCE_NAMES, getComplianceLabels, getCellHint, checklistColumns } from './hxcEditableChecklist.js';
import { blockToNode, configFromDocument, documentToSchema, duplicateDocumentSection, fieldNodeNames, paragraph, schemaToDocument, synchronizeSummary } from './hxcDocumentModel.js';
import { createBlockId, newBlock, validateSchema } from './hxcSchema.js';
import { getReportConfig, validateReportConfig } from './hxcReportConfig.js';
import { sanitizeRichText } from './richText.js';
import { pageGeometry, paginateDocument, printDocument } from './documentLayout.js';
import DocumentRibbon from './DocumentRibbon.jsx';
import DocumentPreview from './DocumentPreview.jsx';
import CompliancePaletteEditor from './CompliancePaletteEditor.jsx';

/** A single ProseMirror instance owns the complete logical document. Pagination is
 * a measured, non-destructive print pipeline, separate from caret/undo state. */
const WordTemplateWorkspace = forwardRef(function WordTemplateWorkspace({ schema, reportConfig, onSave, onSettings, onClose, onDirty, dirty, saving, readOnly, initialPreview = false, inspections = [], workspaceId = 'harmonix', externalError = '', externalNotice = '', onDismissExternalError, onDismissExternalNotice }, ref) {
  const source = useRef({ schema, reportConfig }), importedSource = useRef(null); source.current = importedSource.current || { schema, reportConfig };
  const callbacks = useRef({ onSave, onDirty }); callbacks.current = { onSave, onDirty };
  const extensions = useMemo(() => documentExtensions(), []);
  const parseHTML = html => generateJSON(sanitizeRichText(html), extensions).content || [paragraph('')];
  const initial = useMemo(() => reportConfig.editorDocument || schemaToDocument(schema, reportConfig, parseHTML), []);
  const [tab, setTab] = useState('Home'), [zoom, setZoom] = useState(100), [ruler, setRuler] = useState(true), [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(initialPreview || readOnly), [previewHTML, setPreviewHTML] = useState(''), [notice, setNotice] = useState(''), [error, setError] = useState('');
  const [layout, setLayout] = useState(reportConfig.editorPage || {}), layoutRef = useRef(layout); layoutRef.current = layout;
  const [selection, setSelection] = useState(null), [headings, setHeadings] = useState(schema.map(s => ({ id: s.id, title: s.title })));
  const [counts, setCounts] = useState({ words: 0, characters: 0 }), [revision, setRevision] = useState(0), [pageCount, setPageCount] = useState(null);
  const stage = useRef(null), wordRoot = useRef(null), timer = useRef(null), initialized = useRef(false), autoTimer = useRef(null), autoSaveRef = useRef(false);
  const [autoSave,setAutoSave]=useState(false);autoSaveRef.current=autoSave;
  const updateStats = editor => {
    const plain = editor.state.doc.textContent; setCounts({ words: plain.trim() ? plain.trim().split(/\s+/).length : 0, characters: plain.length });
    const list = []; editor.state.doc.forEach((n, pos) => { if (n.type.name === 'hxcSection') list.push({ id: n.attrs.sectionId, title: n.textContent, pos }); }); setHeadings(list); setRevision(v => v + 1);
  };
  const readSelection = editor => {
    const { $from } = editor.state.selection; let found = null;
    for (let depth = $from.depth; depth > 0; depth--) { const node = $from.node(depth); if (fieldNodeNames.includes(node.type.name)) { found = { node, pos: $from.before(depth), id: node.attrs.fieldId, sectionId: node.attrs.sectionId }; break; } }
    if (!found) { let current = null; editor.state.doc.forEach((node, pos) => { if (pos <= $from.pos && node.type.name === 'hxcSection') current = node.attrs.sectionId; }); found = { sectionId: current }; }
    setSelection(old=>old?.id===found?.id&&old?.sectionId===found?.sectionId&&old?.node?.attrs.definition===found?.node?.attrs.definition ? old : found);
  };
  const editor = useEditor({ extensions, content: initial, editable: !readOnly, shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { class: 'hxc-doc-content hxc-editable', spellcheck: 'true', 'aria-label': 'HXC audit document', role: 'textbox', 'aria-multiline': 'true' },
      transformPastedHTML: html => sanitizeRichText(html),
      handleKeyDown: (view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); callbacks.current.onSave?.(); return true; }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); setTab('Home'); setTimeout(() => document.querySelector('[aria-label="Find & replace"]')?.click(), 0); return true; }
        return false;
      },
    },
    onCreate: ({ editor }) => { updateStats(editor); if (initialPreview || readOnly) setPreviewHTML(editor.getHTML()); initialized.current=true; },
    onUpdate: ({ editor }) => { if(!initialized.current)return;setSelection(old => {if(!old?.id)return old;let found=null;editor.state.doc.descendants((node,pos)=>{if(node.attrs.fieldId===old.id)found={id:old.id,node,pos,sectionId:node.attrs.sectionId};});return found||old;});callbacks.current.onDirty?.(); setPageCount(null); clearTimeout(timer.current); timer.current = setTimeout(() => updateStats(editor), 450);clearTimeout(autoTimer.current);if(autoSaveRef.current)autoTimer.current=setTimeout(()=>callbacks.current.onSave?.(),2000); },
    onSelectionUpdate: ({ editor }) => readSelection(editor),
  });
  useEffect(() => () => {clearTimeout(timer.current);clearTimeout(autoTimer.current);}, []);
  // Embedded inputs live outside ProseMirror's editable contentDOM; selecting them
  // still opens the matching field's contextual properties without remounting the editor.
  useEffect(() => {
    const root=wordRoot.current;
    if(!root || !editor)return;
    const selectField=event=>{
      const id=event.detail?.fieldId;
      if(!id)return;
      let found=null;
      editor.state.doc.descendants((node,pos)=>{if(node.attrs.fieldId===id)found={id,node,pos,sectionId:node.attrs.sectionId};});
      if(found)setSelection(found);
    };
    root.addEventListener('hxc-template-field-select',selectField);
    return ()=>root.removeEventListener('hxc-template-field-select',selectField);
  },[editor]);
  // Word is an immersive workspace, separate from the normal SSC navigation chrome.
  // The editor is never remounted by expanding it: caret, history and edits survive.
  useEffect(() => {
    document.documentElement.classList.add('hxc-word-open');
    return () => document.documentElement.classList.remove('hxc-word-open');
  }, []);
  useEffect(() => {
    const onFullscreenChange = () => { if (!document.fullscreenElement) setExpanded(false); };
    const onEscape = event => { if (event.key === 'Escape' && expanded) setExpanded(false); };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onEscape);
    return () => { document.removeEventListener('fullscreenchange', onFullscreenChange); window.removeEventListener('keydown', onEscape); };
  }, [expanded]);
  const toggleExpanded = () => {
    if (expanded) {
      setExpanded(false);
      if (document.fullscreenElement === wordRoot.current) document.exitFullscreen?.().catch(() => {});
    } else {
      setExpanded(true);
      // Browsers without the Fullscreen API still receive the full-viewport CSS layout.
      wordRoot.current?.requestFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => { editor?.setEditable(!readOnly); }, [readOnly, editor]);
  const snapshot = () => {
    if (!editor) throw new Error('The document editor is still loading.');
    const doc = editor.getJSON();
    const nextSchema = documentToSchema(doc, source.current.schema, content => generateHTML({ type: 'doc', content }, extensions));
    const nextConfig = { ...configFromDocument(doc, source.current.reportConfig), editorPage: layoutRef.current, editorDocument: doc };
    synchronizeSummary(doc,nextSchema,nextConfig);
    const problem = validateSchema(nextSchema) || validateReportConfig(nextConfig); if (problem) throw new Error(problem);
    return { schema: nextSchema, reportConfig: nextConfig };
  };
  useImperativeHandle(ref, () => ({ snapshot, showPreview: () => showPreview(), showEditor: () => { if(!readOnly)setPreview(false); } }));
  useEffect(() => { if (!editor || preview) return; let cancelled = false; const id = setTimeout(() => { paginateDocument(editor.getHTML(), layout).then(pages => { if (!cancelled) { setPageCount(pages.length); setError(''); } }).catch(e => { if (!cancelled) setError(e.message); }); }, 700); return () => { cancelled = true; clearTimeout(id); }; }, [editor, revision, layout, preview]);
  if (!schema?.length) return <div className="hxc-doc-error" role="alert">This template has no sections. Restore or import a valid HXC template before saving; your existing saved template remains unchanged.</div>;
  if (!editor) return <div role="status">Loading the complete HXC document…</div>;
  const geometry = pageGeometry(layout);
  const setSettings = settings => { if (readOnly) return; setLayout(settings); onDirty?.();clearTimeout(autoTimer.current);if(autoSaveRef.current)autoTimer.current=setTimeout(()=>callbacks.current.onSave?.(),2000); };
  const showPreview = () => { try{const draft=snapshot();setPreviewHTML(generateHTML(draft.reportConfig.editorDocument,extensions));setPreview(true);}catch(e){setError(e.message);} };
  const print = async () => { try { const s = snapshot(); await printDocument(await paginateDocument(generateHTML(s.reportConfig.editorDocument,extensions), layout), layout, { title: s.reportConfig.title, footer: s.reportConfig.footerText }); } catch (e) { setError(e.message); } };
  const selectedSection = selection?.sectionId || headings[0]?.id;
  const selectedField = selection?.node?.attrs.definition;
  const selectHeading = id => { let target; editor.state.doc.forEach((n, pos) => { if (n.type.name === 'hxcSection' && n.attrs.sectionId === id) target = pos; }); if (target !== undefined) { editor.commands.setTextSelection(target + 1); editor.view.nodeDOM(target)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); readSelection(editor); } };
  const structural = (fn, focus=true) => { if (readOnly) return; const tr = editor.state.tr; fn(tr); tr.setMeta('hxcStructure', true); editor.view.dispatch(tr); if(focus)editor.commands.focus(); readSelection(editor); };
  const insertField = type => {
    const field = blockToNode(newBlock(type), selectedSection, parseHTML); let at = null;
    editor.state.doc.forEach((n, pos) => { if (n.type.name === 'hxcScoreField' && n.attrs.sectionId === selectedSection) at = pos; });
    if (selection?.id) { const current=editor.state.doc.nodeAt(selection.pos);if(current?.attrs.fieldId===selection.id)at=selection.pos+current.nodeSize; }
    if (at == null) { setNotice('Select an audit section before inserting a field.'); return; }
    structural(tr => tr.insert(at, editor.schema.nodeFromJSON(field))); editor.commands.setTextSelection(at + 2);
  };
  const updateChecklistHeading=(columnId, label)=>{
    if(readOnly || !label.trim())return;
    structural(tr=>{
      editor.state.doc.descendants((node,pos)=>{
        if(node.type.name!=='hxcComplianceField')return;
        const columns=checklistColumns(node.attrs.columns || reportConfig.checklistColumns);
        tr.setNodeMarkup(pos,undefined,{...node.attrs,columns:columns.map(col=>col.id===columnId?{...col,label}:col)});
      });
    },false);
  };
  const fieldPatch = patch => {
    if (!selection?.id || readOnly) return;
    const node = editor.state.doc.nodeAt(selection.pos); if (!node || node.attrs.fieldId !== selection.id) return;
    structural(tr => tr.setNodeMarkup(selection.pos, undefined, { ...node.attrs, definition: { ...node.attrs.definition, ...patch } }),false);
  };
  const applyComplianceColorsToAll = colors => {
    if (readOnly) return;
    structural(tr => {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'hxcComplianceField') return;
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          definition: { ...node.attrs.definition, complianceColors: structuredClone(colors) },
        });
      });
    }, false);
    setNotice('Dropdown colors applied to every compliance field. Save the template to keep the changes.');
  };
  const fieldAction = action => {
    if (!selection?.id) return; const { pos } = selection;const node=editor.state.doc.nodeAt(pos);if(node?.attrs.fieldId!==selection.id)return;
    if (action === 'delete' && !window.confirm('Remove this field from the template? Saved inspection snapshots are retained.')) return;
    structural(tr => {
      if (action === 'delete') tr.delete(pos, pos + node.nodeSize);
      if (action === 'duplicate') { const copy = node.toJSON(); copy.attrs.fieldId = createBlockId(); copy.attrs.definition.id = copy.attrs.fieldId; tr.insert(pos + node.nodeSize, editor.schema.nodeFromJSON(copy)); }
      if (action === 'up' || action === 'down') { const parent = editor.state.doc.resolve(pos).parent; if (parent !== editor.state.doc) return; const siblings = []; editor.state.doc.forEach((n,p) => siblings.push({ node:n,pos:p })); const i = siblings.findIndex(s => s.pos === pos), other = siblings[i + (action === 'up' ? -1 : 1)]; if (!other || other.node.attrs.sectionId !== node.attrs.sectionId || !fieldNodeNames.includes(other.node.type.name)) return; tr.delete(pos,pos + node.nodeSize); tr.insert(action === 'up' ? other.pos : other.pos + other.node.nodeSize - node.nodeSize, node); }
    });
  };
  const sectionAction = action => {
    const document = editor.getJSON(), start = document.content.findIndex(n => n.type === 'hxcSection' && n.attrs.sectionId === selectedSection);
    if (start < 0) return;
    if (action === 'duplicate') { const next = duplicateDocumentSection(document, selectedSection); structural(tr => tr.replaceWith(0, tr.doc.content.size, editor.schema.nodeFromJSON(next).content)); return; }
    let end = start + 1; while (end < document.content.length && !['hxcSection','hxcReport'].includes(document.content[end].type)) end++;
    if (action === 'paragraph') { let at = 0; for (let i = 0; i < end - 1; i++) at += editor.state.doc.child(i).nodeSize; structural(tr => tr.insert(at, editor.schema.nodes.paragraph.create())); editor.commands.setTextSelection(at + 1); return; }
    if (action === 'add') { const id = createBlockId(); document.content.splice(end,0,{type:'hxcSection',attrs:{sectionId:id},content:[{type:'text',text:'New section'}]},{type:'hxcDescription',attrs:{sectionId:id}}, {type:'hxcScoreField',attrs:{sectionId:id,label:'SCORE AND AUDITOR RATIONALE'}}); }
    if (action === 'up' || action === 'down') {
      const starts = document.content.map((n,i) => n.type === 'hxcSection' ? i : -1).filter(i => i >= 0), index = starts.indexOf(start);
      if (action === 'up' && index > 0) { const nodes = document.content.splice(start,end - start); document.content.splice(starts[index - 1],0,...nodes); }
      if (action === 'down' && index < starts.length - 1) { let nextEnd = starts[index + 1] + 1; while (nextEnd < document.content.length && !['hxcSection','hxcReport'].includes(document.content[nextEnd].type)) nextEnd++; const nodes = document.content.splice(start,end - start); document.content.splice(nextEnd - nodes.length,0,...nodes); }
    }
    structural(tr => tr.replaceWith(0, tr.doc.content.size, editor.schema.nodeFromJSON(document).content));
  };
  const exportFile = async type => { try { setNotice('Preparing export…'); const s = snapshot(); const exports = await import('./documentExport.js'); if (type === 'html') await exports.exportHTML(generateHTML(s.reportConfig.editorDocument,extensions),s.reportConfig.title,layout); else await exports.exportDOCX(await paginateDocument(generateHTML(s.reportConfig.editorDocument,extensions),layout),layout,s); setNotice(type === 'docx' ? 'DOCX exported with HXC metadata. Word may reflow page layout.' : 'Complete document exported as HTML.'); } catch (e) { setError(e.message); } };
  const importFile = async file => {
    if (readOnly) return;
    try {
      const { importDOCX } = await import('./documentExport.js'), result = await importDOCX(file); setNotice(result.warnings.join(' '));
      if (result.payload?.version === 1 && window.confirm('This file contains Harmonix template metadata. Restore that original HXC document? Edits made externally in Word are not in the metadata. Cancel appends the converted Word content to the selected section.')) {
        const payload = result.payload, problem = validateSchema(payload.schema) || validateReportConfig(payload.reportConfig); if (problem) throw new Error(problem);
        const json = payload.reportConfig.editorDocument; if (!json) throw new Error('HXC metadata has no editable document.');
        const check = node => { if (node.attrs?.src && !/^(data:image\/(png|jpeg|webp|gif);base64,|\/[^/])/.test(node.attrs.src)) throw new Error('Unsafe image in document metadata.'); for (const mark of node.marks || []) if (mark.type === 'link' && !/^(https?:\/\/|mailto:)/i.test(mark.attrs.href)) throw new Error('Unsafe link in document metadata.'); (node.content || []).forEach(check); }; check(json);
        const model = editor.schema.nodeFromJSON(json); model.check(); structural(tr => tr.replaceWith(0,tr.doc.content.size,model.content)); setSettings(payload.reportConfig.editorPage); importedSource.current = { schema: payload.schema, reportConfig: payload.reportConfig };
      } else {
        const block = newBlock('richtext'); block.html = result.html; block.documentContent = parseHTML(result.html); block.label = `Imported: ${file.name}`;
        let at; editor.state.doc.forEach((n,p) => { if (n.type.name === 'hxcScoreField' && n.attrs.sectionId === selectedSection) at = p; });
        if (at == null) throw new Error('Select an audit section for the imported content.');
        structural(tr => tr.insert(at,editor.schema.nodeFromJSON(blockToNode(block,selectedSection,parseHTML))));
      }
    } catch (e) { setError(e.message); }
  };
  const inspectionHTML = record => { const config = getReportConfig(record.reportConfigSnapshot); return generateHTML(config.editorDocument || schemaToDocument(record.schemaSnapshot,config,parseHTML),extensions); };
  return <section ref={wordRoot} className={`hxword ${expanded ? 'hxword-is-expanded' : ''}`} aria-label="Word-style template document workspace">
    <div className="hxword-titlebar">
      <div className="hxword-brand"><img src={workspaceId === 'harmonix' ? '/harmonix-logo.png' : '/ssc-logo-transparent.png'} alt={workspaceId === 'harmonix' ? 'Harmonix' : 'Site Safety Consultants'}/><span>HXC</span></div>
      <div className="hxword-title"><input aria-label="Document title" value={(() => { let title=reportConfig.title;editor.state.doc.descendants(n=>{if(n.attrs.configKey==='title')title=n.textContent;});return title; })()} readOnly={readOnly} onChange={e => { let found; editor.state.doc.descendants((n,p) => { if (n.attrs.configKey === 'title') found = { node:n,pos:p }; }); if (found) editor.commands.insertContentAt({from:found.pos + 1,to:found.pos + found.node.nodeSize - 1},e.target.value ? [{type:'text',text:e.target.value}] : []); }}/><span role="status">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'} <span className="hxword-status-dot">·</span> {readOnly ? 'Read-only template' : 'Editable template'}</span></div>
      <div className="hxword-title-actions">
        <button title="Undo" aria-label="Undo" disabled={readOnly || !editor.can().undo()} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={17}/></button>
        <button title="Redo" aria-label="Redo" disabled={readOnly || !editor.can().redo()} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={17}/></button>
        <label className="hxc-autosave"><input type="checkbox" checked={autoSave} disabled={readOnly} onChange={e=>setAutoSave(e.target.checked)}/> Autosave</label>
        <button className="hxc-save" onClick={onSave} disabled={readOnly || saving}><Save size={16}/> <span>Save</span></button>
        <button onClick={preview ? () => setPreview(false) : showPreview} disabled={readOnly && !preview}><Eye size={16}/><span>{preview ? 'Edit' : 'Preview'}</span></button>
        <button onClick={print}><Printer size={16}/><span>Print</span></button>
        {onSettings && !readOnly && <button onClick={onSettings} title="HXC report layout & tables"><Settings2 size={16}/><span>Report setup</span></button>}
        <button className="hxword-expand-button" onClick={toggleExpanded} title={expanded ? 'Exit full screen (Esc)' : 'Expand editor to full screen'} aria-label={expanded ? 'Exit full screen' : 'Expand editor to full screen'} aria-pressed={expanded}>{expanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}<span>{expanded ? 'Exit full screen' : 'Full screen'}</span></button>
        <button className="hxword-close" onClick={onClose} title="Close document editor" aria-label="Close document editor"><X size={18}/></button>
      </div>
    </div>
    {externalError && <div className="hxc-doc-error" role="alert">{externalError}<button onClick={onDismissExternalError} aria-label="Dismiss save error"><X size={14}/></button></div>}
    {externalNotice && <div className="hxc-doc-notice" role="status">{externalNotice}<button onClick={onDismissExternalNotice} aria-label="Dismiss save notice"><X size={14}/></button></div>}
    {error && <div className="hxc-doc-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss document error"><X size={14}/></button></div>}
    {notice && <div className="hxc-doc-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss document notice"><X size={14}/></button></div>}
    {preview ? <DocumentPreview html={previewHTML || editor.getHTML()} settings={layout} title={reportConfig.title} footer={reportConfig.footerText} inspections={inspections} inspectionHTML={inspectionHTML} onClose={readOnly ? undefined : () => setPreview(false)}/> : <>
      <DocumentRibbon editor={editor} tab={tab} setTab={setTab} settings={layout} onSettings={setSettings} onSave={onSave} onPreview={showPreview} onPrint={print} onExport={exportFile} onImport={importFile} onInsertField={insertField} onStructure={sectionAction} onNotice={setNotice} readOnly={readOnly} ruler={ruler} setRuler={setRuler} zoom={zoom} setZoom={setZoom}/>
      <div className={`hxword-workspace ${selection?.id ? 'has-properties' : ''}`}>
        <div className="hxword-stage" ref={stage}><div className="hxc-flow-label"><span className="hxword-flow-dot"/> Editing view <span aria-hidden="true">·</span> Print pages available in Preview</div><div className="hxword-paper-holder" style={{ width: `${geometry.width}mm`, zoom: zoom / 100 }}>
          {ruler && <div className="hxword-ruler" aria-label="Ruler in centimetres">{Array.from({length:Math.floor(geometry.width / 10)},(_,i) => <span key={i}>{i}</span>)}</div>}
          <div className="hxword-sheet" style={{ width: `${geometry.width}mm`, minHeight: `${geometry.height}mm`, padding: `${geometry.margins.top}mm ${geometry.margins.right}mm ${geometry.margins.bottom}mm ${geometry.margins.left}mm`, background: layout.background || '#ffffff', border: layout.border ? `1px solid ${layout.border}` : undefined }}><div className="hxc-edit-header">{layout.header || `${workspaceId === 'harmonix' ? 'HARMONIX' : 'SITE SAFETY CONSULTANTS'} · HXC COMPLIANCE AUDIT`}</div><EditorContent editor={editor}/><div className="hxc-edit-footer">{layout.footer || reportConfig.footerText}</div></div>
        </div></div>
        {selection?.id && <aside className="hxc-properties"><div><strong>Field settings</strong><button aria-label="Close field properties" onClick={() => setSelection(null)}><X size={14}/></button></div><small className="hxc-properties-subtitle">Edit this {selectedField?.type === 'compliance' ? 'compliance field' : 'template field'} without changing inspection answers.</small>{selection?.node?.type.name === 'hxcComplianceField' && <>
            <CompliancePaletteEditor key={selection.id} definition={selectedField} onPatch={fieldPatch} onApplyAll={applyComplianceColorsToAll} readOnly={readOnly}/>
            <label>Example selection<select disabled={readOnly} value={selectedField?.previewCompliance || ''} onChange={e=>fieldPatch({previewCompliance:e.target.value})}><option value="">Choose during inspection</option>{COMPLIANCE_CODES.map(code=><option value={code} key={code}>{code} — {getComplianceLabels(selectedField)[code]}</option>)}</select></label>
            <details className="hxc-field-column-headings"><summary>Customize option names</summary>{COMPLIANCE_CODES.map(code=><label key={code}>{code} option name<input disabled={readOnly} aria-label={`${code} compliance option label`} value={getComplianceLabels(selectedField)[code]} onChange={e=>fieldPatch({complianceLabels:{...getComplianceLabels(selectedField),[code]:e.target.value}})}/></label>)}</details>
            <div className="hxc-field-properties-section"><strong>Response columns</strong><small>These placeholders appear in your audit document.</small></div>
            <label>Evidence / Appendix Ref. placeholder<input disabled={readOnly} value={getCellHint(selectedField,'evidence','Evidence / Appendix ref.')} onChange={e=>fieldPatch({evidencePlaceholder:e.target.value})}/></label>
            <label>Action Ref. placeholder<input disabled={readOnly} value={getCellHint(selectedField,'action','Action ref.')} onChange={e=>fieldPatch({actionPlaceholder:e.target.value})}/></label>
            <details className="hxc-field-column-headings"><summary>Edit checklist column headings</summary>{checklistColumns(selection.node.attrs.columns || reportConfig.checklistColumns).map(column=><label key={column.id}>{column.id}<input disabled={readOnly} defaultValue={column.label} onBlur={e=>updateChecklistHeading(column.id,e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/></label>)}</details>
          </>}
          <div className="hxc-field-properties-section"><strong>Field details</strong><small>Changes apply to this template field only.</small></div>
          <label>Reference<input disabled={readOnly} value={selectedField?.ref || ''} onChange={e => fieldPatch({ref:e.target.value})}/></label>
          <label>Evidence guidance<textarea disabled={readOnly} value={selectedField?.evidenceHint || selectedField?.help || ''} onChange={e => fieldPatch({evidenceHint:e.target.value,help:e.target.value})}/></label>
          <label className="hxc-check"><input type="checkbox" disabled={readOnly} checked={!!selectedField?.required} onChange={e => fieldPatch({required:e.target.checked})}/> Required</label>
          {['radio','select','checkbox','list'].includes(selectedField?.type) && selection?.node?.type.name !== 'hxcComplianceField' && <label>Available options (one per line)<textarea rows={5} disabled={readOnly} value={(selectedField.options || []).join('\n')} onChange={e=>fieldPatch({options:e.target.value.split('\n')})}/></label>}
          {!['richtext','divider','heading','paragraph','list','row','columns'].includes(selectedField?.type) && <label>Answer placeholder / guidance<input disabled={readOnly} value={selectedField?.answerPlaceholder || ''} onChange={e=>fieldPatch({answerPlaceholder:e.target.value})}/></label>}
          {selectedField?.type === 'table' && <><label>Column names (one per line)<textarea value={(selectedField.columns || []).join('\n')} onChange={e => fieldPatch({ columns: e.target.value.split('\n') })}/></label><label>Response rows<input type="number" min="1" max="100" value={selectedField.rows || 1} onChange={e => fieldPatch({ rows: Math.max(1,Math.min(100,Number(e.target.value))) })}/></label></>}
          <div className="hxc-field-buttons"><button disabled={readOnly} onClick={() => fieldAction('up')}><ArrowUp size={14}/> Up</button><button disabled={readOnly} onClick={() => fieldAction('down')}><ArrowDown size={14}/> Down</button><button disabled={readOnly || selection.node.type.name === 'hxcGroup'} onClick={() => fieldAction('duplicate')}><Copy size={14}/> Duplicate</button><button disabled={readOnly} onClick={() => fieldAction('delete')}><Trash2 size={14}/> Delete field</button></div></aside>}
      </div>
      <div className="hxword-status"><span>{pageCount ? `${pageCount} printable pages` : 'Measuring pages…'} · {counts.words} words · {counts.characters} characters</span><label className="hxword-section-jump">Go to section <select aria-label="Jump to document section" value={selectedSection || ''} onChange={event => selectHeading(event.target.value)}>{headings.map((h,i) => <option value={h.id} key={h.id}>{i + 1}. {h.title.slice(0,50)}</option>)}</select></label><span>English · {preview ? 'Print preview' : 'Editing'}</span><label>Zoom <input aria-label="Document zoom" type="range" min="50" max="200" step="10" value={zoom} onChange={e => setZoom(Number(e.target.value))}/>{zoom}%</label><button onClick={showPreview}>Print layout</button></div>
    </>}
  </section>;
});
export default WordTemplateWorkspace;




