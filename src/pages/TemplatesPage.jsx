import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, Eye, FileText, PencilLine } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { countQuestions, getHxcSchema } from '../features/templates/hxcSchema.js';
import HxcTemplatePage from './HxcTemplatePage.jsx';
import HxcTemplatePreviewPage from './HxcTemplatePreviewPage.jsx';

/** HXC template catalog: editing and read-only preview are separate actions. */
export default function TemplatesPage() {
  const { db, isAdmin } = usePortal();
  const [opened, setOpened] = useState(null);
  const hxc = db.templates.find(template => template.id === 'hxc');
  const schema = getHxcSchema(hxc);

  if (opened === 'editor') return <HxcTemplatePage onBack={() => setOpened(null)} />;
  if (opened === 'preview') return <HxcTemplatePreviewPage onBack={() => setOpened(null)} />;

  return <main className="workspace-page hxc-template-catalog">
    <header className="hxc-template-catalog-header">
      <div>
        <span className="hxc-template-catalog-eyebrow">INSPECTION TEMPLATES</span>
        <h1>Templates</h1>
        <p>Choose whether to {isAdmin ? 'edit the HXC document' : 'open the document in read-only mode'} or preview its saved layout.</p>
      </div>
    </header>

    <div className="hxc-template-catalog-grid">
      <article className="hxc-template-catalog-card" aria-label="HXC Audit Template">
        <div className="hxc-template-catalog-card-top">
          <span className="hxc-template-catalog-icon"><ClipboardCheck size={24} strokeWidth={1.8} /></span>
          <span className="hxc-template-catalog-tag"><CheckCircle2 size={13} /> Available</span>
        </div>
        <strong className="hxc-template-catalog-name">HXC Audit Template</strong>
        <p className="hxc-template-catalog-description">
          {isAdmin ? 'Edit the audit document or preview the saved template without making changes.' : 'View the HXC document or preview the saved template in a read-only layout.'}
        </p>
        <div className="hxc-template-catalog-meta">
          <span><FileText size={15} /> {schema.length} sections</span>
          <span>{countQuestions(schema)} questions</span>
        </div>
        <div className="hxc-template-catalog-actions">
          <button type="button" className="hxc-template-catalog-card-action" onClick={() => setOpened('editor')}>
            <PencilLine size={16} aria-hidden="true" /><span>Open document editor</span><ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="hxc-template-catalog-card-action hxc-template-catalog-card-action--preview" onClick={() => setOpened('preview')}>
            <Eye size={17} aria-hidden="true" /><span>Preview template</span><ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  </main>;
}
