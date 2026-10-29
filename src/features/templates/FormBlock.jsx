import React from 'react';
import DigitalSignature from './DigitalSignature.jsx';
import PhotoUploadField from './PhotoUploadField.jsx';
const isBlank = v => v === undefined || v === null || v === '';
export function FormBlock({ block, answers, setAnswer, disabled = false }) {
  const id = `inspection-${block.id}`;
  const value = answers?.[block.id];
  const set = v => setAnswer(block.id, v);
  if (block.type === 'divider') return <hr className="hxc-block-divider"/>;
  if (block.type === 'signature') return <div className="sw-field"><strong>{block.label}</strong><DigitalSignature label={block.label} value={value || ''} onChange={set} disabled={disabled}/></div>;
  if (block.type === 'photo') return <div className="sw-field"><strong>{block.label}</strong><PhotoUploadField label={block.label} value={value || ''} onChange={set} disabled={disabled}/></div>;
  if (block.type === 'heading') return <h4 className="sw-field-heading">{block.label}</h4>;
  if (block.type === 'paragraph') return <p className="sw-field-paragraph">{block.label}</p>;
  if (block.type === 'list') return <div className="sw-field"><strong>{block.label}</strong><ul>{(block.options || []).filter(Boolean).map((v,i) => <li key={i}>{v}</li>)}</ul></div>;
  if (['row','columns'].includes(block.type)) return <div className={`sw-layout sw-layout-${block.type}`} aria-label={block.label}>{(block.children || []).map(c => <FormBlock key={c.id} block={c} answers={answers} setAnswer={setAnswer} disabled={disabled}/>)}</div>;
  if (block.type === 'table') {
    const columns = (block.columns || []).filter(Boolean);
    const rows = Array.isArray(value) ? value : Array.from({ length: Math.max(1, Number(block.rows) || 1) }, () => ({}));
    return <div className="sw-field sw-table-field"><label>{block.label}{block.required ? <span className="sw-required"> *</span> : ''}</label>{block.help && <small>{block.help}</small>}
      <div className="sw-table-scroll"><table><thead><tr>{columns.map((col,i) => <th key={i}>{col}</th>)}<th aria-label="Row actions"/></tr></thead><tbody>{rows.map((row,ri) => <tr key={ri}>{columns.map((col,ci) => <td key={ci}><input aria-label={`${block.label}, row ${ri+1}, ${col}`} disabled={disabled} value={row[ci] || ''} onChange={e => set(rows.map((r,i) => i === ri ? {...r,[ci]:e.target.value} : r))}/></td>)}<td>{!disabled && <button className="sw-table-remove" type="button" onClick={() => set(rows.filter((_,i) => ri !== i))}>Remove</button>}</td></tr>)}</tbody></table></div>{!disabled && <button className="sw-table-add" type="button" onClick={() => set([...rows,{}])}>+ Add row</button>}
    </div>;
  }
  const options = (block.options || []).filter(Boolean);
  return <div className="sw-field"><label htmlFor={!['radio','checkbox'].includes(block.type) ? id : undefined}>{block.label}{block.required ? <span className="sw-required"> *</span> : ''}</label>{block.help && <small>{block.help}</small>}
    {block.type === 'radio' && <div className="sw-choices">{options.map(option => <label key={option}><input type="radio" name={id} value={option} checked={value === option} disabled={disabled} onChange={() => set(option)}/>{option}</label>)}</div>}
    {block.type === 'checkbox' && <div className="sw-choices">{options.map(option => <label key={option}><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} disabled={disabled} onChange={e => set(e.target.checked ? [...(Array.isArray(value)?value:[]),option] : (Array.isArray(value)?value:[]).filter(x => x !== option))}/>{option}</label>)}</div>}
    {block.type === 'select' && <select id={id} value={isBlank(value)?'':value} disabled={disabled} onChange={e => set(e.target.value)}><option value="">Select an option</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>}
    {block.type === 'textarea' && <textarea id={id} rows={3} disabled={disabled} value={value ?? ''} onChange={e => set(e.target.value)}/>}
    {['text','number','date','time','email'].includes(block.type) && <input id={id} type={block.type} disabled={disabled} value={value ?? ''} onChange={e => set(e.target.value)}/>}
  </div>;
}
