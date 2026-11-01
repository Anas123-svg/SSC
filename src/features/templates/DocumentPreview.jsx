import React, { useEffect, useRef, useState } from 'react';
import { pageGeometry, pageHTML, paginateDocument, printDocument, fillInspectionHTML } from './documentLayout.js';

export default function DocumentPreview({ html, settings = {}, title, footer, onClose, inspections = [], inspectionHTML, closeLabel = 'Return to editor', savedTemplate = false, templateNote }) {
  const [pages, setPages] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(true);
  const [zoom, setZoom] = useState(80), [mode, setMode] = useState('continuous'), [current, setCurrent] = useState(1), [inspectionId, setInspectionId] = useState('');
  const stage = useRef(null), selected = inspections.find(r => r.id === inspectionId);
  const source = selected ? inspectionHTML(selected) : html;
  useEffect(() => { let cancelled = false; setBusy(true); setError(''); paginateDocument(fillInspectionHTML(source, selected), selected?.reportConfigSnapshot?.editorPage || settings).then(result => { if (!cancelled) { setPages(result); setCurrent(1); setBusy(false); } }).catch(e => { if (!cancelled) { setError(e.message); setBusy(false); } }); return () => { cancelled = true; }; }, [source, selected, settings]);
  const effectiveSettings = selected?.reportConfigSnapshot?.editorPage || settings;
  const g = pageGeometry(effectiveSettings);
  const labels = { title: selected?.reportConfigSnapshot?.title || title, footer };
  const navigate = page => { const next = Math.max(1, Math.min(pages.length, page)); setCurrent(next); if (mode === 'continuous') stage.current?.querySelector(`[data-preview-page="${next}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  const fit = widthOnly => { const available = (stage.current?.clientWidth || 900) - 48; const width = available / (g.width * 96 / 25.4 * (mode === 'two' ? 2 : 1)); const height = ((stage.current?.clientHeight || 800) - 48) / (g.height * 96 / 25.4); setZoom(Math.max(20, Math.min(200, Math.floor((widthOnly ? width : Math.min(width, height)) * 100)))); };
  return <section className="hxc-preview" aria-label="Document preview">
    <div className="hxc-preview-toolbar">
      <strong>{selected ? 'Inspection preview · saved snapshot' : savedTemplate ? 'Template preview · saved version' : 'Template preview · current document'}</strong>
      {inspections.length > 0 && <select aria-label="Preview data" value={inspectionId} onChange={e => setInspectionId(e.target.value)}><option value="">Template placeholders</option>{inspections.map(r => <option key={r.id} value={r.id}>{r.projectName || r.id} · {r.date} · {r.status}</option>)}</select>}
      <button onClick={() => navigate(current - 1)} disabled={current <= 1}>Previous page</button><span>Page {current} of {pages.length || '…'}</span><button onClick={() => navigate(current + 1)} disabled={current >= pages.length}>Next page</button>
      <select aria-label="Page view" value={mode} onChange={e => setMode(e.target.value)}><option value="continuous">Continuous scroll</option><option value="single">Single page</option><option value="two">Two pages</option></select>
      <button onClick={() => setZoom(z => Math.max(50, z - 10))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(z => Math.min(200, z + 10))}>+</button>
      <button onClick={() => fit(false)}>Fit page</button><button onClick={() => fit(true)}>Fit width</button>
      <button disabled={busy || !!error} onClick={() => printDocument(pages, effectiveSettings, labels).catch(e => setError(e.message))}>Print / Save as PDF</button>
      {onClose && <button onClick={onClose}>{closeLabel}</button>}
    </div>
    {busy && <p role="status">Measuring document pages…</p>}{error && <p className="hxc-doc-error" role="alert">{error}</p>}
    <div className={`hxc-preview-stage view-${mode}`} ref={stage} onScroll={() => { if (mode !== 'continuous') return; const top = stage.current.getBoundingClientRect().top; const visible = [...stage.current.querySelectorAll('[data-preview-page]')].find(el => el.getBoundingClientRect().bottom > top + 80); if (visible) setCurrent(Number(visible.dataset.previewPage)); }}>
      {!busy && !error && pages.map((page, i) => (mode === 'continuous' || i === current - 1 || mode === 'two' && i === current) && <div className="hxc-preview-slot" data-preview-page={i + 1} key={i} style={{ width: g.width * 96 / 25.4 * zoom / 100, height: g.height * 96 / 25.4 * zoom / 100 }}><div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }} dangerouslySetInnerHTML={{ __html: pageHTML([page], effectiveSettings, labels).replace('Page 1 of 1', `Page ${i + 1} of ${pages.length}`) }}/></div>)}
    </div>
    <p className="hxc-preview-note">{templateNote || (selected ? 'Values and layout use this inspection’s saved template snapshot. No answers are changed.' : 'Field placeholders are part of the template. Save to apply edits to new inspections.')} PDF output uses your browser’s print dialog.</p>
  </section>;
}

