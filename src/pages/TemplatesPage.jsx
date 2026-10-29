import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { countQuestions, getHxcSchema } from '../features/templates/hxcSchema.js';
import HxcTemplatePage from './HxcTemplatePage.jsx';

/** A single-card catalog: open HXC to see and edit its full template. */
export default function TemplatesPage() {
  const { db, isAdmin } = usePortal();
  const [opened, setOpened] = useState(false);
  const hxc = db.templates.find(template => template.id === 'hxc');
  const schema = getHxcSchema(hxc);

  if (opened) return <HxcTemplatePage onBack={() => setOpened(false)} />;

  return <main className="workspace-page hxc-template-catalog">
    <header className="hxc-template-catalog-header">
      <div>
        <span className="hxc-template-catalog-eyebrow">INSPECTION TEMPLATES</span>
        <h1>Templates</h1>
        <p>Open a template to {isAdmin ? 'edit every section, field and table' : 'preview its inspection form'}.</p>
      </div>
    </header>

    <div className="hxc-template-catalog-grid">
      <button
        type="button"
        className="hxc-template-catalog-card"
        onClick={() => setOpened(true)}
        aria-label="Open HXC Audit template"
      >
        <span className="hxc-template-catalog-card-top">
          <span className="hxc-template-catalog-icon"><ClipboardCheck size={24} strokeWidth={1.8} /></span>
          <span className="hxc-template-catalog-tag"><CheckCircle2 size={13} /> Available</span>
        </span>
        <strong className="hxc-template-catalog-name">HXC Audit Template</strong>
        <span className="hxc-template-catalog-description">
          {isAdmin ? 'Open the visual builder to add, edit, remove and reorder fields, text, rows and tables.' : 'Preview the HXC inspection form.'}
        </span>
        <span className="hxc-template-catalog-meta">
          <span><FileText size={15} /> {schema.length} sections</span>
          <span>{countQuestions(schema)} questions</span>
        </span>
        <span className="hxc-template-catalog-card-action">
          {isAdmin ? 'Open visual template builder' : 'View template'} <ArrowRight size={16} />
        </span>
      </button>
    </div>
  </main>;
}
