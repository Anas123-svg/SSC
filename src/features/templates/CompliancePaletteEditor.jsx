import React, { useState } from 'react';
import { Check, Palette, RotateCcw } from 'lucide-react';
import { COMPLIANCE_PALETTE_KEYS, getCompliancePalette, contrastRatio, suggestedTextColor } from './hxcComplianceColors.js';

const TITLES = { C: 'Compliant', MI: 'Minor issue', MA: 'Major issue', 'N/A': 'Not applicable', unset: 'No selection' };

/** Template-only, per-field color design. No inspection data is modified. */
export default function CompliancePaletteEditor({ definition = {}, onPatch, onApplyAll, readOnly = false }) {
  const [active, setActive] = useState('C');
  const colors = getCompliancePalette(definition, active);
  const ratio = contrastRatio(colors.background, colors.text);
  const patchColors = (key, colorPatch) => {
    onPatch({ complianceColors: {
      ...(definition.complianceColors || {}),
      [key]: { ...getCompliancePalette(definition, key), ...colorPatch },
    } });
  };
  const resetActive = () => {
    const next = { ...(definition.complianceColors || {}) };
    delete next[active];
    onPatch({ complianceColors: next });
  };
  const resetAll = () => onPatch({ complianceColors: {} });
  return <div className="hxc-palette-editor" aria-label="Compliance dropdown colors">
    <div className="hxc-palette-heading"><Palette size={16}/><div><strong>Dropdown appearance</strong><small>Choose a response to adjust its colors.</small></div></div>
    <div className="hxc-palette-options" role="group" aria-label="Compliance response color">
      {COMPLIANCE_PALETTE_KEYS.map(code => {
        const palette = getCompliancePalette(definition, code);
        return <button type="button" key={code} className={active === code ? 'active' : ''} aria-pressed={active === code} title={TITLES[code]} onClick={() => setActive(code)}>
          <span className="hxc-palette-option-sample" style={{ backgroundColor: palette.background, color: palette.text, borderColor: palette.border }}>{code === 'unset' ? '—' : code}</span>
          <span>{code === 'unset' ? 'Empty' : code}</span>
          {active === code && <Check size={11} aria-hidden="true"/>}
        </button>;
      })}
    </div>
    <div className="hxc-palette-preview" style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }}><span>{active === 'unset' ? 'Choose during inspection' : `${active} — ${TITLES[active]}`}</span><span aria-hidden="true">⌄</span></div>
    <div className="hxc-palette-inputs">
      {[
        ['background', 'Fill'], ['text', 'Text'], ['border', 'Outline'],
      ].map(([key, label]) => <label className="hxc-palette-input" key={key}>
        <span>{label}</span>
        <span className="hxc-palette-input-row">
          <input type="color" aria-label={`${active} ${label.toLowerCase()} color`} value={colors[key]} disabled={readOnly} onChange={e => patchColors(active, { [key]: e.target.value })}/>
          <span>{colors[key]}</span>
        </span>
      </label>)}
    </div>
    <div className={`hxc-palette-contrast ${ratio < 4.5 ? 'needs-attention' : ''}`}>
      <span>{ratio < 4.5 ? `Low contrast · ${ratio.toFixed(1)}:1` : `Readable contrast · ${ratio.toFixed(1)}:1`}</span>
      {ratio < 4.5 && <button type="button" disabled={readOnly} onClick={() => patchColors(active, { text: suggestedTextColor(colors.background) })}>Fix text color</button>}
    </div>
    <div className="hxc-palette-actions">
      <button type="button" disabled={readOnly} onClick={resetActive}><RotateCcw size={13}/> Reset {active === 'unset' ? 'empty' : active}</button>
      <button type="button" disabled={readOnly} onClick={resetAll}>Reset all</button>
    </div>
    <button type="button" className="hxc-palette-apply" disabled={readOnly} onClick={() => onApplyAll(Object.fromEntries(COMPLIANCE_PALETTE_KEYS.map(code => [code, getCompliancePalette(definition,code)])))}>
      Apply these colors to all compliance fields
    </button>
    <p className="hxc-palette-hint">Colors affect the document, preview and future inspections. C / MI / MA / N/A codes and scoring never change. Use accessible color combinations for safety indicators.</p>
  </div>;
}
