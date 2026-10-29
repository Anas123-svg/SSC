import React from 'react';
import { ArrowLeft, CheckCircle2, Download, FileCheck2, Printer } from 'lucide-react';
import { computed } from '../hxcModel.js';
import { printHxc } from '../hxcExport.js';
import { Button, Chip } from './HxcUI.jsx';
import { useHxcEditor } from '../HxcEditorContext.jsx';
export default function HxcEditorHeading() {
  const { onExit, active, readOnly, setValidation, complete, setActiveId, exportJson, update } = useHxcEditor();
  return (
    <div className="hxc-edit-heading"><div className="hxc-edit-heading-main"><button className="hxc-back" onClick={() => { setActiveId(null); setValidation([]) ;}}><ArrowLeft size={17} /> {onExit ? 'All inspections' : 'All HXC audits'}</button><div className="hxc-edit-label">AUDIT RECORD <span>/</span> {active.id} {active.demo && <Chip tone="warning">ILLUSTRATIVE</Chip>}</div><h2>{active.meta.projectName || 'New compliance audit'}<span>.</span></h2><p><span className="hxc-autosave-dot" /> {active.state === 'Completed' ? 'Completed and locally stored' : 'Auto-saved to this browser'} &nbsp;·&nbsp; {computed(active).answered}/65 assessed</p></div><div className="hxc-editor-buttons"><Button icon={Download} onClick={() => exportJson(active)}>Backup JSON</Button><Button icon={Printer} onClick={() => printHxc(active)}>Print / PDF</Button>{readOnly ? <Button variant="primary" icon={FileCheck2} onClick={() => { if (window.confirm('Reopen this completed audit? Existing acknowledgements will be cleared.')) update(a => ({ ...a, state: 'Draft', assessorSign: '', managerSign: '', assessorConfirmed: false, managerConfirmed: false, completedAt: null })) ;}}>Reopen</Button> : <Button variant="primary" icon={CheckCircle2} onClick={complete}>Complete audit</Button>}</div></div>
  );
}
