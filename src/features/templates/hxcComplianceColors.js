/**
 * Visual-only HXC compliance palettes. The keys are stable HXC response codes;
 * styling never alters grading or persisted inspection answers.
 * Accept #RRGGBB exclusively so document HTML and printed CSS cannot contain
 * arbitrary user-provided CSS or URLs.
 */
export const COMPLIANCE_PALETTE_KEYS = Object.freeze(['C', 'MI', 'MA', 'N/A', 'unset']);
export const DEFAULT_COMPLIANCE_PALETTE = Object.freeze({
  C: Object.freeze({ background: '#DAF4E6', text: '#11603C', border: '#8DD2AA' }),
  MI: Object.freeze({ background: '#FFF0C7', text: '#89500B', border: '#EBBC60' }),
  MA: Object.freeze({ background: '#FFE0E0', text: '#AA1D24', border: '#E99A9A' }),
  'N/A': Object.freeze({ background: '#FFFFFF', text: '#344054', border: '#DCE2E9' }),
  unset: Object.freeze({ background: '#FFFFFF', text: '#344054', border: '#DCE2E9' }),
});

export function validPaletteColor(value) {
  return typeof value === 'string' && /^#[a-fA-F0-9]{6}$/.test(value);
}

export function getCompliancePalette(definition, code = 'unset') {
  const key = COMPLIANCE_PALETTE_KEYS.includes(code) ? code : 'unset';
  const defaults = DEFAULT_COMPLIANCE_PALETTE[key];
  const override = definition?.complianceColors?.[key] || {};
  return Object.fromEntries(Object.entries(defaults).map(([property, fallback]) => [
    property, validPaletteColor(override[property]) ? override[property].toUpperCase() : fallback,
  ]));
}

export function hasCustomPalette(definition, code = 'unset') {
  const override = definition?.complianceColors?.[code];
  return Boolean(override && Object.values(override).some(validPaletteColor));
}

export function paletteStyle(definition, code = 'unset') {
  const palette = getCompliancePalette(definition, code);
  return { backgroundColor: palette.background, color: palette.text, borderColor: palette.border };
}

/** Inline CSS variables are applied to serialized ProseMirror HTML, allowing
 * print/inspection previews to switch colors when data-compliance changes. */
export function compliancePaletteVariables(definition) {
  const variables = {};
  for (const key of COMPLIANCE_PALETTE_KEYS) {
    const name = key === 'N/A' ? 'na' : key.toLowerCase();
    const palette = getCompliancePalette(definition, key);
    variables[`--hxc-${name}-bg`] = palette.background;
    variables[`--hxc-${name}-fg`] = palette.text;
    variables[`--hxc-${name}-border`] = palette.border;
  }
  return variables;
}

export function paletteVariableStyle(definition) {
  return Object.entries(compliancePaletteVariables(definition)).map(([key, value]) => `${key}:${value}`).join(';');
}

/** CSS variables also help against older !important inspection status rules. */
export function selectedPaletteVariables(definition, code) {
  const p = getCompliancePalette(definition, code);
  return { '--hxc-selected-bg': p.background, '--hxc-selected-text': p.text, '--hxc-selected-border': p.border };
}

/** WCAG contrast ratio for the color editor's text/readability preview. */
export function contrastRatio(first, second) {
  if (!validPaletteColor(first) || !validPaletteColor(second)) return 0;
  const luminance = color => {
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i,i+2),16) / 255);
    const channels = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const hi=Math.max(luminance(first),luminance(second));
  const lo=Math.min(luminance(first),luminance(second));
  return (hi+.05)/(lo+.05);
}

export function suggestedTextColor(background) {
  return contrastRatio(background, '#FFFFFF') > contrastRatio(background, '#18261D') ? '#FFFFFF' : '#18261D';
}
