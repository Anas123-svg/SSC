import React, { useMemo, useState } from 'react';
import { ClipboardCheck, FileText, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { Button, CollectionHeader, EmptyState, FilterBar, FormModal } from '../components/common/WorkspaceUI.jsx';
import { hxcTemplate } from '../features/hxc/hxcTemplate.js';

/** Client-facing, read-only template catalog. Assignment is managed exclusively in Admin. */
export default function AssignedTemplatesPage() {
  const { db, activeWorkspaceId, activeWorkspace, go, matches } = usePortal();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [preview, setPreview] = useState(null);
  const assigned = useMemo(() => db.templates.filter(t => (t.workspaceIds || []).includes(activeWorkspaceId)), [db.templates, activeWorkspaceId]);
  const available = assigned.filter(t => (!category || t.category === category)
    && [t.name, t.description, t.category, t.kind].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    && matches(t.name, t.description, t.category));
  const categories = [...new Set(assigned.map(t => t.category).filter(Boolean))].sort();
  return <div className="workspace-page assigned-templates-page">
    <section className="panel padded">
      <CollectionHeader title="Assigned inspection templates" description={`Only frameworks assigned to ${activeWorkspace.name} by an administrator are available here.`}>
        <Button onClick={() => go('audits')}>View all inspections</Button>
      </CollectionHeader>
      <FilterBar>
        <label>Search <span className="inspection-search"><Search size={15}/><input placeholder="Template name, category…" value={search} onChange={e => setSearch(e.target.value)}/></span></label>
        <label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
      </FilterBar>
      {!assigned.length ? <EmptyState title="No inspection templates assigned" description="An administrator must assign a template to this workspace under Admin → Manage Templates before inspections can be started."/> : !available.length ? <EmptyState title="No matching templates" description="Try another search term or category."/> : <div className="assigned-template-grid">{available.map(t => <article className="assigned-template-card" key={t.id}>
        <div className="assigned-template-card-head"><span className="assigned-template-symbol">{t.kind === 'hxc' ? <ClipboardCheck size={24}/> : <FileText size={24}/>}</span><span className="assigned-template-category">{t.category || 'Inspection'}</span></div>
        <h3>{t.name}</h3><p>{t.description || 'Workspace-assigned inspection framework.'}</p>
        <div className="assigned-template-meta"><CheckCircle2 size={15}/>{t.kind === 'hxc' ? '65 requirements · 10 sections · HXC workflow' : 'General inspection register template'}</div>
        <div className="assigned-template-actions"><Button onClick={() => setPreview(t)}>Preview</Button><Button primary onClick={() => go('audits', `new-template-${t.id}`)}>Start inspection <ArrowRight size={15}/></Button></div>
      </article>)}</div>}
      <p className="workspace-note">Templates are centrally managed by Admin and are read-only in client workspaces. HXC uses the existing full compliance checklist. General templates currently create inspection register records rather than custom multi-question forms.</p>
    </section>
    {preview && <FormModal title={preview.name} close={() => setPreview(null)}><div className="dialog-body">
      <p>{preview.description || 'No description entered.'}</p>
      <p><strong>Category:</strong> {preview.category || 'Uncategorized'}</p>
      {preview.kind === 'hxc' ? <><p>HXC includes {hxcTemplate.length} sections, with 65 requirements and its dedicated scoring and sign-off process.</p>{hxcTemplate.map(s => <details key={s.id}><summary>{s.id}. {s.title} — {s.items.length} requirements</summary><ul>{s.items.map(i => <li key={i.id}>{i.ref} — {i.requirement}</li>)}</ul></details>)}</> : <p>This template uses the general inspection register with project, inspector, date, findings, notes and compliance score.</p>}
      <div className="dialog-footer"><Button onClick={() => setPreview(null)}>Close</Button><Button primary onClick={() => go('audits', `new-template-${preview.id}`)}>Start inspection</Button></div>
    </div></FormModal>}
  </div>;
}
