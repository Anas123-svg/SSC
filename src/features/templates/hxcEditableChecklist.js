import { getCompliancePalette, hasCustomPalette, selectedPaletteVariables } from './hxcComplianceColors.js';
/** Template-only settings. Inspection answers remain in their own answers map. */
export const COMPLIANCE_CODES = Object.freeze(['C', 'MI', 'MA', 'N/A']);
export const COMPLIANCE_NAMES = Object.freeze({ C:'Compliant', MI:'Minor issue', MA:'Major issue', 'N/A':'Not applicable' });
export const DEFAULT_CHECKLIST_COLUMNS = Object.freeze([
  {id:'ref',label:'Ref'}, {id:'requirement',label:'Inspection requirement'},
  {id:'compliance',label:'Compliance'}, {id:'evidence',label:'Evidence / Appendix ref.'}, {id:'action',label:'Action ref.'},
]);
export const getComplianceLabels = definition => Object.fromEntries(COMPLIANCE_CODES.map(code => [code, String(definition?.complianceLabels?.[code] || COMPLIANCE_NAMES[code])]));
export const getCellHint = (definition, kind, fallback = '') => {
  if (kind === 'evidence') return definition?.evidencePlaceholder ?? (definition?.evidenceHint || definition?.help || fallback);
  if (kind === 'action') return definition?.actionPlaceholder ?? fallback;
  return definition?.columnPlaceholders?.[kind] ?? fallback;
};
export const checklistColumns = columns => {
  const base = Array.isArray(columns) && columns.length ? columns : DEFAULT_CHECKLIST_COLUMNS;
  return base.some(c => c.id === 'requirement') ? base : [...base, { id:'requirement', label:'Inspection requirement' }];
};
export function makeComplianceNodeView(initialNode, view, getPos) {
  let node = initialNode;
  const wrapper = document.createElement('div');
  wrapper.className = 'hxc-field hxcComplianceField hxc-editable-checklist';
  wrapper.dataset.hxcNode = 'hxcComplianceField';
  const table = document.createElement('table'); table.className = 'hxc-checklist';
  const colgroup = document.createElement('colgroup'), head = document.createElement('thead'), body = document.createElement('tbody'), headRow = document.createElement('tr'), valueRow = document.createElement('tr');
  const notify = () => wrapper.dispatchEvent(new CustomEvent('hxc-template-field-select', { bubbles:true, detail:{fieldId:node.attrs.fieldId} }));
  const patch = (properties) => {
    const pos = getPos();
    if (typeof pos !== 'number' || !view.editable) return;
    const nextDefinition = { ...node.attrs.definition, ...properties };
    const tr = view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, definition:nextDefinition });
    view.dispatch(tr);
    notify();
  };
  let contentDOM, controls=[];
  function build() {
    controls=[]; colgroup.replaceChildren();headRow.replaceChildren();valueRow.replaceChildren();
    const b = node.attrs.definition || {}, columns = checklistColumns(node.attrs.columns);
    for (const col of columns) {
      const width = ({ ref:7,requirement:43,compliance:16,evidence:24,action:10 })[col.id] || 15;
      const colEl = document.createElement('col'); colEl.style.width = `${width}%`;colgroup.append(colEl);
      const th = document.createElement('th');th.textContent = col.label;th.contentEditable = 'false';headRow.append(th);
      const td = document.createElement('td');valueRow.append(td);
      if (col.id === 'requirement') {
        td.className='hxc-label';contentDOM=td;
      } else if (col.id === 'ref') {
        td.className='hxc-ref';td.contentEditable='false';
        const input=document.createElement('input');input.type='text';input.className='hxc-checklist-field-control';
        input.setAttribute('aria-label',`Reference for ${b.label || 'audit requirement'}`);
        input.value=b.ref||'';input.placeholder='Ref';input.disabled=!view.editable;
        input.addEventListener('input',()=>patch({ref:input.value}));
        input.addEventListener('focus',notify);td.append(input);controls.push([input,()=>node.attrs.definition?.ref||'']);
      } else if (col.id === 'compliance') {
        td.className='hxc-compliance-template-cell';td.contentEditable='false';
        const select=document.createElement('select');select.className='hxc-checklist-field-control hxc-compliance-template-select';
        select.setAttribute('aria-label',`Compliance preview for ${b.ref || b.label || 'audit requirement'}`);
        select.title='Template preview only. Actual compliance is chosen during each inspection.';
        const labels=getComplianceLabels(b), blank=document.createElement('option');blank.value='';blank.textContent='Choose during inspection';select.append(blank);
        for(const code of COMPLIANCE_CODES){const option=document.createElement('option');option.value=code;option.textContent=`${code} — ${labels[code]}`;select.append(option);}
        select.value=COMPLIANCE_CODES.includes(b.previewCompliance) ? b.previewCompliance : '';select.dataset.status=select.value.replace('/','');select.disabled=!view.editable;
        const applyPalette = () => {
          const definition = node.attrs.definition || {};
          const selected = COMPLIANCE_CODES.includes(select.value) ? select.value : 'unset';
          const colors = selectedPaletteVariables(definition, selected);
          for (const [key, value] of Object.entries(colors)) select.style.setProperty(key, value);
          select.dataset.customColors = String(hasCustomPalette(definition, selected));
          for (const option of select.options) {
            const p = getCompliancePalette(definition, option.value || 'unset');
            option.style.backgroundColor = p.background;
            option.style.color = p.text;
          }
        };
        applyPalette();
        select.addEventListener('change', applyPalette);
        select.addEventListener('change',()=>patch({previewCompliance:select.value}));select.addEventListener('focus',notify);
        td.append(select);controls.push([select,()=>node.attrs.definition?.previewCompliance||'']);
      } else {
        td.contentEditable='false';
        const field=document.createElement('input');field.type='text';field.className='hxc-checklist-field-control';
        field.setAttribute('aria-label',`${col.label} placeholder for ${b.ref || b.label || 'audit requirement'}`);
        field.title='Edit the template placeholder. Inspection values are entered separately.';
        const current=()=>getCellHint(node.attrs.definition,col.id,col.label);
        field.value=current();field.placeholder=col.label;field.disabled=!view.editable;
        field.addEventListener('input',()=>{
          if(col.id==='evidence')patch({evidencePlaceholder:field.value});
          else if(col.id==='action')patch({actionPlaceholder:field.value});
          else patch({columnPlaceholders:{...node.attrs.definition?.columnPlaceholders,[col.id]:field.value}});
        });
        field.addEventListener('focus',notify);
        td.append(field);controls.push([field,current]);
      }
    }
    head.append(headRow);body.append(valueRow);
  }
  build();table.append(colgroup,head,body);wrapper.append(table);
  return { dom:wrapper, get contentDOM(){return contentDOM;}, update(next) {
    if(next.type !== node.type) return false;
    const oldColumns=JSON.stringify(node.attrs.columns);
    node=next;
    if(oldColumns!==JSON.stringify(next.attrs.columns)) return false;
    const complianceSelect=wrapper.querySelector('select.hxc-compliance-template-select');
    if(complianceSelect) {
      complianceSelect.dataset.status=String(next.attrs.definition?.previewCompliance||'').replace('/','');
      const nextStatus=COMPLIANCE_CODES.includes(next.attrs.definition?.previewCompliance) ? next.attrs.definition.previewCompliance : 'unset';
      for (const [key, value] of Object.entries(selectedPaletteVariables(next.attrs.definition,nextStatus))) complianceSelect.style.setProperty(key,value);
      complianceSelect.dataset.customColors=String(hasCustomPalette(next.attrs.definition,nextStatus));
      for(const option of complianceSelect.options){
        const p=getCompliancePalette(next.attrs.definition,option.value || 'unset');
        option.style.backgroundColor=p.background;option.style.color=p.text;
      }
      const labels=getComplianceLabels(next.attrs.definition);
      for(const option of complianceSelect.options)if(option.value && labels[option.value]) option.textContent=`${option.value} — ${labels[option.value]}`;
    }
    controls.forEach(([control,getValue])=>{control.disabled=!view.editable; if(document.activeElement!==control && control.value!==getValue())control.value=getValue(); });
    wrapper.dataset.fieldId=next.attrs.fieldId;
    return true;
  }, stopEvent(event){return !!event.target.closest('input,select,button');}, ignoreMutation(record){return record.type==='attributes' && !!record.target.closest('input,select');} };
}

/** Template labels for all non-checklist answer slots (cover, tracker, appendix, summary). */
export function makeValueNodeView(initialNode, view, getPos) {
  let node=initialNode;
  const outer=document.createElement('span');outer.className='hxc-value-editor';outer.contentEditable='false';
  const input=document.createElement('input');input.type='text';input.className='hxc-inline-placeholder';
  input.value=node.attrs.label||'';input.disabled=!view.editable;
  input.title='Edit template placeholder; actual inspection answers are stored separately.';
  input.setAttribute('aria-label',`Edit placeholder for ${node.attrs.answerKey}`);
  input.addEventListener('input',()=>{
    if(!view.editable)return;
    const pos=getPos();if(typeof pos!=='number')return;
    view.dispatch(view.state.tr.setNodeMarkup(pos,undefined,{...node.attrs,label:input.value}));
  });
  outer.append(input);
  return {dom:outer,update(next){if(next.type!==node.type)return false;node=next;input.disabled=!view.editable;if(document.activeElement!==input)input.value=next.attrs.label||'';return true;},stopEvent:()=>true,ignoreMutation:()=>true};
}

/** Editable section-score captions; these are placeholders, never scored answers. */
export function makeScoreNodeView(initialNode, view, getPos) {
  let node=initialNode;
  const box=document.createElement('div');box.className='hxc-score hxc-editable-score';box.contentEditable='false';
  const inputs=[];
  const descriptions=[['label','Score row title'],['scorePlaceholder','Section score placeholder'],['rationalePlaceholder','Auditor rationale placeholder'],['openPlaceholder','Open actions placeholder']];
  for(const [attr,caption] of descriptions){
    const label=document.createElement('label');label.title='Edit template wording, not a completed inspection answer.';
    label.className='hxc-score-caption';
    const field=document.createElement('input');field.type='text';field.disabled=!view.editable;
    field.setAttribute('aria-label',caption);
    field.value=node.attrs[attr]||'';
    field.addEventListener('input',()=>{
      if(!view.editable)return;
      const pos=getPos();if(typeof pos!=='number')return;
      view.dispatch(view.state.tr.setNodeMarkup(pos,undefined,{...node.attrs,[attr]:field.value}));
    });
    label.append(field);box.append(label);inputs.push([field,attr]);
  }
  return {dom:box,update(next){if(next.type!==node.type)return false;node=next;
    for(const [field,attr] of inputs){field.disabled=!view.editable;if(document.activeElement!==field)field.value=next.attrs[attr]||'';}
    return true;},stopEvent:()=>true,ignoreMutation:()=>true};
}
