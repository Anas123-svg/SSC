import React from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, UploadCloud } from 'lucide-react';
import { allItems } from '../hxcModel.js';
import { Button } from '../components/HxcUI.jsx';
import { useHxcEditor } from '../HxcEditorContext.jsx';

export default function PhotoAppendixTab() {
  const { active, setTab, setSelectedSection, setPhotoLightbox } = useHxcEditor();
  return (
    <section className="hxc-white-section"><div className="hxc-body-title"><div><span>APPENDIX A / SUPPORTING INFORMATION & PHOTOS</span><h3>A clear visual evidence trail.</h3><p>Photos automatically reference their associated checklist item. The final report uses appendix references A01, A02, etc.</p></div></div>{allItems.flatMap(item => (active.responses?.[item.id]?.photos || []).map(p => ({ item, p }))).length ? <div className="hxc-photo-grid">{allItems.flatMap(item => (active.responses?.[item.id]?.photos || []).map(p => ({ item, p }))).map(({ item, p }, i) => <button className="hxc-photo-card" key={p.id} onClick={() => setPhotoLightbox(p)}><img src={p.data} alt={p.name} /><div><strong>A{String(i + 1).padStart(2, '0')} · Item {item.ref}</strong><small>{p.name}</small></div></button>)}</div> : <div className="hxc-empty"><UploadCloud size={29} /><h4>No photographic evidence yet</h4><p>Add photos to individual checklist requirements in the inspection sections.</p><Button icon={ArrowLeft} onClick={() => { setTab('section'); setSelectedSection(1) ;}}>Go to checks</Button></div>}<div className="hxc-bottom-actions"><Button onClick={() => setTab('actions')} icon={ChevronLeft}>Previous</Button><Button variant="primary" onClick={() => setTab('signoff')}>Declaration & sign-off <ArrowRight size={16} /></Button></div></section>
  );
}
