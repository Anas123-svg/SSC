import React from 'react';
import { usePortal } from '../../app/PortalContext.jsx';
import { DEFAULT_MODULES } from '../../app/moduleRegistry.js';
import { RecordForm } from '../common/WorkspaceUI.jsx';
export const workspaceFields = [
  { key: 'name', label: 'Workspace name', required: true, maxLength: 80 },
  { key: 'client', label: 'Client / company name' },
  { key: 'contact', label: 'Contact person' }, { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' }, { key: 'address', label: 'Address' },
  { key: 'description', label: 'Description', type: 'textarea', wide: true },
  { key: 'logo', label: 'Workspace logo (PNG / JPEG / WebP)', type: 'file', accept: 'image/png,image/jpeg,image/webp', maxBytes: 150000 },
  { key: 'modules', label: 'Module configuration', type: 'modules', wide: true },
];
export default function CreateWorkspaceDialog({ close }) {
  const { createWorkspace } = usePortal();
  return <RecordForm title="Add workspace" fields={[{ key: 'name', label: 'Workspace name', required: true, maxLength: 80 }, { key: 'client', label: 'Client / company (optional)', maxLength: 100 }]} initial={{ modules: DEFAULT_MODULES }} close={close} save={v => { const result = createWorkspace(v); if (!result.ok) throw new Error(result.error); }}><p className="workspace-note">Projects and inspections can be added after creating the workspace.</p></RecordForm>;
}

