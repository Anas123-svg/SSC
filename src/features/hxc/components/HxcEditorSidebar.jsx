import React from 'react';
import { BadgeCheck, Check, ChevronRight, FileCheck2, FileImage, FileText, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { hxcTemplate } from '../hxcTemplate.js';
import { Meter } from './HxcUI.jsx';
import { useHxcEditor } from '../HxcEditorContext.jsx';
export default function HxcEditorSidebar() {
  const { stats, tab, setTab, selectedSection, setSelectedSection, sectionDone } = useHxcEditor();
  return (
    <aside className="hxc-step-nav"><div className="hxc-step-head"><span>AUDIT CONTENTS</span><strong>{stats.answered} <small>/ 65 checks</small></strong><Meter value={stats.answered} max={65} /></div><button className={'hxc-step ' + (tab === 'overview' ? 'active' : '')} onClick={() => setTab('overview')}><span className="hxc-step-icon"><FileText size={16} /></span>Assessment details <ChevronRight size={15} /></button><div className="hxc-nav-divider">INSPECTION SECTIONS</div>{hxcTemplate.map(s => <button key={s.id} className={'hxc-step ' + (tab === 'section' && selectedSection === s.id ? 'active' : '')} onClick={() => { setTab('section'); setSelectedSection(s.id) ;}}><span className={'hxc-step-number ' + (sectionDone(s) ? 'done' : '')}>{sectionDone(s) ? <Check size={12} /> : String(s.id).padStart(2, '0')}</span><span className="hxc-step-name">{s.title}</span><ChevronRight size={13} /></button>)}<div className="hxc-nav-divider">REPORT & CLOSE-OUT</div>{[['summary', 'Audit summary', FileCheck2], ['actions', 'Corrective actions', ShieldAlert], ['appendix', 'Photo appendix', FileImage], ['signoff', 'Declaration & sign-off', UserRoundCheck], ['review', 'Completion checks', BadgeCheck]].map(([key, label, Icon]) => <button key={key} className={'hxc-step ' + (tab === key ? 'active' : '')} onClick={() => setTab(key)}><span className="hxc-step-icon"><Icon size={16} /></span>{label}<ChevronRight size={14} /></button>)}</aside>
  );
}
