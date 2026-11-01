import React, { useMemo } from 'react';
import { generateHTML, generateJSON } from '@tiptap/core';
import { usePortal } from '../app/PortalContext.jsx';
import { documentExtensions } from '../features/templates/documentExtensions.js';
import { paragraph, schemaToDocument } from '../features/templates/hxcDocumentModel.js';
import { getHxcSchema } from '../features/templates/hxcSchema.js';
import { getReportConfig } from '../features/templates/hxcReportConfig.js';
import { sanitizeRichText } from '../features/templates/richText.js';
import DocumentPreview from '../features/templates/DocumentPreview.jsx';

/** Read-only preview of the saved template; no editor instance or save path. */
export default function HxcTemplatePreviewPage({ onBack }) {
  const { db } = usePortal();
  const template = db.templates.find(item => item.id === 'hxc');
  const preview = useMemo(() => {
    if (!template) return { error: 'HXC template not found. No saved records were changed.' };
    try {
      const schema = getHxcSchema(template);
      if (!schema.length) return { error: 'The saved HXC template has no sections to preview.' };
      const config = getReportConfig(template);
      const extensions = documentExtensions();
      const parseHTML = html => generateJSON(sanitizeRichText(html), extensions).content || [paragraph('')];
      const doc = config.editorDocument?.type === 'doc' && Array.isArray(config.editorDocument.content)
        ? config.editorDocument
        : schemaToDocument(schema, config, parseHTML);
      return {
        html: generateHTML(doc, extensions), settings: config.editorPage || {},
        title: config.title || 'HXC Audit Template', footer: config.footerText || '',
      };
    } catch (error) {
      return { error: `Unable to preview this template: ${error.message || 'Invalid document data.'}` };
    }
  }, [template]);

  return <main className="workspace-page hxc-template-preview-page" aria-label="HXC Audit Template preview">
    {preview.error ? <div className="hxc-template-preview-error" role="alert">
      <p>{preview.error}</p>
      <button type="button" onClick={onBack}>Back to templates</button>
    </div> : <DocumentPreview
      html={preview.html}
      settings={preview.settings}
      title={preview.title}
      footer={preview.footer}
      onClose={onBack}
      closeLabel="Back to templates"
      savedTemplate
      templateNote="Read-only preview of the saved HXC template. Inspection answers and template settings cannot be changed here."
    />}
  </main>;
}
