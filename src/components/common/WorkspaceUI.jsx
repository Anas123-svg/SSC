import React, { useEffect, useRef, useState } from 'react';
import { Plus, X, FolderOpen } from 'lucide-react';
import { MODULES } from '../../app/moduleRegistry.js';
export function EmptyState({ title = 'No records yet', description = 'Add the first record to get started.', action }) { return <div className="empty"><FolderOpen size={26}/><strong>{title}</strong><p>{description}</p>{action}</div>; }
export function DataTable({ columns, rows, empty }) { return <div className="table-scroll"><table className="audit-table"><thead><tr>{columns.map(c => <th key={c.label}>{c.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{columns.map(c => <td key={c.label} data-label={c.label}>{c.render ? c.render(row) : row[c.key] || '—'}</td>)}</tr>)}</tbody></table>{!rows.length && (empty || <EmptyState />)}</div>; }
export const Button = ({ children, primary, ...props }) => <button type="button" className={'btn ' + (primary ? 'primary' : 'outline')} {...props}>{children}</button>;
export function FormModal({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, node = ref.current;
    node.querySelector('input, select, textarea, button')?.focus();
    const listener = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const items = [...node.querySelectorAll('button, input, select, textarea, a[href]')].filter(x => !x.disabled && x.offsetParent !== null);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    node.addEventListener('keydown', listener);
    return () => { node.removeEventListener('keydown', listener); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="dialog-shade" onMouseDown={e => e.target === e.currentTarget && close()}><div ref={ref} className="dialog workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="form-modal-title"><div className="dialog-header"><h2 id="form-modal-title">{title}</h2><button type="button" className="icon-button" onClick={close} aria-label="Close dialog"><X size={20}/></button></div>{children}</div></div>;
}
export function ModulesInput({ value = [], onChange }) { return <fieldset className="module-grid"><legend>Enabled modules</legend>{Object.entries(MODULES).filter(([,m]) => !m.adminOnly).map(([id,m]) => <label key={id}><input type="checkbox" checked={m.required || value.includes(id)} disabled={m.required} onChange={e => onChange(e.target.checked ? [...value,id] : value.filter(x => x !== id))}/>{m.label}{m.required && <small>Required</small>}</label>)}</fieldset>; }
export function RecordForm({ title, fields, initial = {}, close, save, children }) {
  const [values, setValues] = useState(initial), [error, setError] = useState(''), [busy,setBusy] = useState(false);
  const change = (key,value) => setValues(v => ({ ...v, [key]: value }));
  const submit = async e => { e.preventDefault(); const form = new FormData(e.currentTarget); const submitted = { ...values }; for (const f of fields) if (!['file','multi','modules'].includes(f.type) && form.has(f.key)) submitted[f.key] = form.get(f.key); setBusy(true); try { await save(submitted); close(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <FormModal title={title} close={close}><form className="dialog-body" onSubmit={submit}><div className="workspace-form-grid">{fields.filter(f => !f.when || f.when(values)).map(f => {
    const options = typeof f.options === 'function' ? f.options(values) : f.options || [];
    return <div className={'field ' + (f.wide ? 'wide' : '')} key={f.key}><label htmlFor={'field-' + f.key}>{f.label}{f.required ? ' *' : ''}</label>
    {f.type === 'textarea' ? <textarea id={'field-' + f.key} name={f.key} rows={3} required={f.required} value={values[f.key] || ''} onChange={e => change(f.key,e.target.value)}/> :
    f.type === 'modules' ? <div id={'field-' + f.key}><ModulesInput value={values[f.key]} onChange={v => change(f.key,v)}/></div> :
    f.type === 'multi' ? <span id={'field-' + f.key} className="check-list" role="group" aria-label={f.label}>{options.map(o => <label key={o.value}><input type="checkbox" checked={(values[f.key] || []).includes(o.value)} onChange={e => change(f.key, e.target.checked ? [...(values[f.key] || []), o.value] : (values[f.key] || []).filter(x => x !== o.value))}/>{o.label}</label>)}</span> :
    f.type === 'select' ? <select id={'field-' + f.key} name={f.key} required={f.required} value={values[f.key] ?? ''} onChange={e => change(f.key,e.target.value)}><option value="">Select…</option>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select> :
    f.type === 'file' ? <><input id={'field-' + f.key} type="file" accept={f.accept} onChange={async e => { const file = e.target.files[0]; if (!file) return; if (file.size > (f.maxBytes || 750000)) { setError('File is too large. Maximum size is ' + Math.round((f.maxBytes || 750000)/1000) + ' KB.'); e.target.value = ''; return; } try { const data = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); change(f.key, { name: file.name, type: file.type, data }); setError(''); } catch { setError('The file could not be read.'); } }}/>{values[f.key]?.name && <small>{values[f.key].name} saved locally</small>}</> :
    <input id={'field-' + f.key} name={f.key} type={f.type || 'text'} required={f.required} min={f.min} max={f.max} step={f.step} maxLength={f.maxLength || 1000} value={values[f.key] ?? ''} onChange={e => change(f.key,e.target.value)}/>}
    {f.hint && <small>{f.hint}</small>}</div>;
  })}</div>{children}{error && <p className="error" role="alert">{error}</p>}<div className="dialog-footer"><Button onClick={close}>Cancel</Button><button className="btn primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button></div></form></FormModal>;
}
export function FilterBar({ children }) { return <div className="workspace-filters">{children}</div>; }
export function CollectionHeader({ title, description, onAdd, label = 'Add record', children }) { return <div className="clean-panel-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><div className="actions-row">{children}{onAdd && <Button primary onClick={onAdd}><Plus size={16}/>{label}</Button>}</div></div>; }


