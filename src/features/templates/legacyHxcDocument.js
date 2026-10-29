/** Adapter for legacy HXC audits. Keep original audit IDs/storage rather than copying
 * records into the generic database, and retain the original rich photo evidence. */
import { parseSaved, storageKey, dateToday } from '../hxc/hxcModel.js';
import { DEFAULT_HXC_SCHEMA, cloneSchema } from './hxcSchema.js';
import { cloneReportConfig, DEFAULT_REPORT_CONFIG } from './hxcReportConfig.js';

const readLegacy = unified => parseSaved(unified.workspaceId).find(a=>a.id===unified.nativeId);
export function legacyDocument(unified) {
  const source = readLegacy(unified);
  if (!source) return null;
  const answers={};
  for (const section of DEFAULT_HXC_SCHEMA) {
    const oldId=section.id.replace('section-','');
    const sec=source.sections?.[oldId]||{};
    answers[`section:${section.id}:score`] = sec.na ? 'N/A' : sec.score == null ? '' : String(sec.score);
    answers[`section:${section.id}:rationale`] = sec.rationale || '';
    answers[`summary:${section.id}:concern`] = sec.strength || '';
    for (const block of section.blocks) {
      const item=block.id.replace('hxc-',''); const response=source.responses?.[item]||{};
      answers[block.id] = response.status === 'NA' ? 'N/A' : response.status || '';
      answers[`${block.id}:evidence`] = response.evidenceRef || response.note || '';
      answers[`${block.id}:action`] = response.actionRef || '';
    }
  }
  (source.actions||[]).forEach((act,i)=>{
    const prefix=`action:${i+1}:`;
    answers[prefix+'finding']=act.requiredAction || act.finding || '';
    answers[prefix+'priority']=act.priority || '';
    answers[prefix+'responsible']=act.owner || '';
    answers[prefix+'target']=act.targetDate || '';
    answers[prefix+'closeout']=act.closedOn || '';
    answers[prefix+'verified']=act.verifiedBy || '';
  });
  answers['summary:positive']=source.positives||'';
  answers['summary:concerns']=source.priorities||'';
  answers['meta:projectName']=source.meta?.projectName||'';
  answers['meta:projectManager']=source.meta?.projectManager||'';
  answers['meta:siteAddress']=source.meta?.siteAddress||'';
  answers['meta:assessmentType']=source.meta?.type||'';
  answers['meta:declarationAssessor']=source.meta?.assessor||'';
  answers['meta:declarationManager']=source.meta?.projectManager||'';
  answers['meta:assessorSignature']=source.assessorSign||'';
  answers['meta:managerSignature']=source.managerSign||'';
  answers['meta:reportDate']=source.reportDate||'';
  answers['meta:nextReview']=source.nextReview||'';
  const savedAnswers=source.documentAnswers || {};
  // Original HXC editor stays authoritative for its native checklists and scores.
  // Document-only fields (digital signatures, custom columns and photos) remain intact.
  const mergedAnswers={...savedAnswers,...answers};
  for (const key of ['meta:assessorSignature','meta:managerSignature']) {
    if (Object.prototype.hasOwnProperty.call(savedAnswers,key)) mergedAnswers[key]=savedAnswers[key];
  }
  return {
    id:unified.id, legacySource: true, templateId:'hxc', type:'HXC compliance audit',
    status:source.state||'Draft', workspaceId:unified.workspaceId, projectId:unified.projectId||source.projectId||'',
    date:source.meta?.assessmentDate||dateToday(), inspector:source.meta?.assessor||'',
    answers:mergedAnswers,
    schemaSnapshot:cloneSchema(source.documentSchemaSnapshot || DEFAULT_HXC_SCHEMA),
    reportConfigSnapshot:cloneReportConfig(source.documentReportConfig || DEFAULT_REPORT_CONFIG),
  };
}
export function saveLegacyDocument(unified, record) {
  const audits=parseSaved(unified.workspaceId);
  const index=audits.findIndex(a=>a.id===unified.nativeId);
  if (index===-1) throw new Error('The original HXC inspection is missing.');
  const old=audits[index];
  const responses={...old.responses};
  const sections={...old.sections};
  for (const section of DEFAULT_HXC_SCHEMA) {
    const id=section.id.replace('section-','');
    const score=record.answers[`section:${section.id}:score`];
    sections[id]={...sections[id], score:score==='N/A'?'':score,na:score==='N/A',rationale:record.answers[`section:${section.id}:rationale`] || '',strength:record.answers[`summary:${section.id}:concern`]||''};
    for (const block of section.blocks) {
      const item=block.id.replace('hxc-','');
      const status=record.answers[block.id];
      responses[item]={...responses[item],status:status==='N/A'?'NA':status||'',evidenceRef:record.answers[`${block.id}:evidence`]||'',actionRef:record.answers[`${block.id}:action`]||''};
    }
  }
  const actions=(old.actions||[]).map((act,i)=>({
    ...act, requiredAction:record.answers[`action:${i+1}:finding`]??act.requiredAction,
    priority:record.answers[`action:${i+1}:priority`]??act.priority,
    owner:record.answers[`action:${i+1}:responsible`]??act.owner,
    targetDate:record.answers[`action:${i+1}:target`]??act.targetDate,
    closedOn:record.answers[`action:${i+1}:closeout`]??act.closedOn,
    verifiedBy:record.answers[`action:${i+1}:verified`]??act.verifiedBy,
  }));
  const next={...old,projectId:record.projectId,state:record.status,updatedAt:new Date().toISOString(),
    meta:{...old.meta,projectName:record.projectName||old.meta?.projectName||'',assessmentDate:record.date,assessor:record.inspector,projectManager:record.answers['meta:projectManager']||'',siteAddress:record.answers['meta:siteAddress']||old.meta?.siteAddress||'',type:record.answers['meta:assessmentType']||old.meta?.type||'Monthly'},
    sections,responses,actions,positives:record.answers['summary:positive']||'',priorities:record.answers['summary:concerns']||'',
    reportDate:record.answers['meta:reportDate']||'',nextReview:record.answers['meta:nextReview']||'',
    assessorSign:record.answers['meta:assessorSignature']?.startsWith('data:image/') ? 'Digital signature saved in document view' : old.assessorSign,
    managerSign:record.answers['meta:managerSignature']?.startsWith('data:image/') ? 'Digital signature saved in document view' : old.managerSign,
    assessorConfirmed:Boolean(record.answers['meta:assessorSignature']) || old.assessorConfirmed,
    managerConfirmed:Boolean(record.answers['meta:managerSignature']) || old.managerConfirmed,
    completedAt:record.status==='Completed' ? (old.completedAt || new Date().toISOString()) : old.completedAt,
    documentAnswers:{...record.answers},documentSchemaSnapshot:cloneSchema(record.schemaSnapshot),documentReportConfig:cloneReportConfig(record.reportConfigSnapshot),
  };
  audits[index]=next;
  localStorage.setItem(storageKey(unified.workspaceId),JSON.stringify(audits));
  window.dispatchEvent(new Event('ssc-hxc-changed'));
  return {id:unified.id};
}
