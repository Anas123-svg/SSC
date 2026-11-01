import { complianceScore, overallRating } from './hxcSchema.js';
export const MM = 96 / 25.4;
export function pageGeometry(settings = {}) {
  let [width, height] = settings.paper === 'Letter' ? [215.9, 279.4] : [210, 297];
  if (settings.orientation === 'landscape') [width, height] = [height, width];
  const preset = { normal: 25.4, narrow: 12.7, wide: 32 }[settings.margins] || 25.4;
  const margins = Object.fromEntries(['top','right','bottom','left'].map(side => [side, settings.margins === 'custom' ? Math.max(8, Math.min(60, Number(settings.customMargins?.[side]) || 25.4)) : preset]));
  return { width, height, margins, bodyWidth: width - margins.left - margins.right, bodyHeight: height - margins.top - margins.bottom };
}
export function pageStyle(settings) {
  const p = pageGeometry(settings);
  return { width: `${p.width}mm`, height: `${p.height}mm`, padding: `${p.margins.top}mm ${p.margins.right}mm ${p.margins.bottom}mm ${p.margins.left}mm`, background: settings?.background || '#ffffff', border: settings?.border ? `1px solid ${settings.border}` : undefined };
}
export function fillInspectionHTML(html, record) {
  if (!record) return html;
  const root = new DOMParser().parseFromString(html, 'text/html').body;
  const answers = { ...record.answers, 'meta:date': record.date || record.answers?.['meta:date'], 'meta:assessor': record.inspector || record.answers?.['meta:assessor'], 'meta:projectName': record.projectName || record.answers?.['meta:projectName'] };
  const score=complianceScore(record.schemaSnapshot||[],answers);answers['computed:score']=score==null?'—':`${score}%`;answers['computed:rating']=overallRating(score);
  root.querySelectorAll('[data-answer-key]').forEach(el => {
    const rowKey=el.dataset.answerKey.match(/^(.*):row:(\d+):(\d+)$/);
    const value = rowKey ? answers[rowKey[1]]?.[Number(rowKey[2])]?.[Number(rowKey[3])] : answers[el.dataset.answerKey];
    el.textContent = value == null || value === '' ? '—' : Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (['photo','signature'].includes(el.dataset.kind) && /^data:image\/(png|jpeg|webp);base64,/.test(value || '')) { const img = document.createElement('img'); img.src = value; img.alt = el.dataset.kind; el.replaceChildren(img); }
    if (el.dataset.kind === 'compliance') el.dataset.compliance = value || '';
  });
  return root.innerHTML;
}

function splitTextElement(el, at) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let left = at, node;
  while ((node = walker.nextNode())) { if (left <= node.length) break; left -= node.length; }
  if (!node) return [el.cloneNode(true), null];
  const a = document.createRange(), b = document.createRange();
  a.selectNodeContents(el); a.setEnd(node, left); b.selectNodeContents(el); b.setStart(node, left);
  const first = el.cloneNode(false), second = el.cloneNode(false);
  first.append(a.cloneContents()); second.append(b.cloneContents());
  return [first, second];
}

/** Measured print pipeline. No estimates, fixed page counts, clipped rows, or
 * destructive edits to the ProseMirror model. Tables repeat their header rows. */
export async function paginateDocument(html, settings = {}, labels = {}) {
  await document.fonts?.ready;
  const geometry = pageGeometry(settings);
  const host = document.createElement('div'); host.className = 'hxc-pagination-measure';
  Object.assign(host.style, { position: 'absolute', left: '-100000px', top: '0', width: `${geometry.bodyWidth}mm`, visibility: 'hidden' });
  const body = document.createElement('div'); body.className = 'hxc-doc-content hxc-page-body'; host.append(body); document.body.append(host);
  const source = document.createElement('div'); source.innerHTML = html;
  source.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  const units = [];
  const flatten = el => {
    if (el.matches('[data-report-part], .hxcRichText, .hxcGroup')) [...el.children].forEach(flatten);
    else if (el.tagName === 'TABLE') {
      const rows = [...el.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr')];
      const header = rows[0]?.querySelector('th') ? rows.shift().cloneNode(true) : null;
      rows.forEach((row, index) => units.push({ row, table: el, header, first: index === 0 }));
    } else if (['UL','OL'].includes(el.tagName)) [...el.children].forEach((li, i) => { const list = el.cloneNode(false); if (el.tagName === 'OL') list.start = (Number(el.start) || 1) + i; list.append(li.cloneNode(true)); units.push({ element: list }); });
    else units.push({ element: el.cloneNode(true) });
  };
  [...source.children].forEach(flatten);
  // Decode before measuring. Broken images retain their alt text and never block export.
  await Promise.all([...source.querySelectorAll('img')].map(img => img.decode?.().catch(() => {})));
  const pages = []; const max = geometry.bodyHeight * MM - 2;
  let activeTable = null, tableSource = null;
  const commit = () => { if (body.childNodes.length) pages.push(body.innerHTML); body.replaceChildren(); activeTable = null; tableSource = null; };
  const fits = () => body.getBoundingClientRect().height <= max + .5;
  const add = unit => {
    if (unit.row) {
      if (tableSource !== unit.table) {
        activeTable = unit.table.cloneNode(false); const cols = unit.table.querySelector('colgroup'); if (cols) activeTable.append(cols.cloneNode(true));
        const tbody = document.createElement('tbody'); if (unit.header) tbody.append(unit.header.cloneNode(true)); activeTable.append(tbody); body.append(activeTable); tableSource = unit.table;
      }
      const row = unit.row.cloneNode(true); activeTable.lastElementChild.append(row); return row;
    }
    activeTable = null; tableSource = null; const el = unit.element.cloneNode(true); body.append(el); return el;
  };
  try {
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (unit.element?.matches('[data-page-break]')) { commit(); continue; }
      let inserted = add(unit);
      if (fits()) continue;
      inserted.remove();
      if (activeTable && activeTable.rows.length <= (unit.header ? 1 : 0)) activeTable.remove();
      // Keep headings with at least the next row/paragraph, including empty descriptions.
      const carry = [];
      while (body.lastElementChild?.matches('h1,h2,h3,h4,h5,h6,p:empty,[data-section-description]:empty')) carry.unshift(body.lastElementChild), body.lastElementChild.remove();
      commit(); carry.forEach(el => body.append(el)); inserted = add(unit);
      if (fits()) continue;
      if (!unit.row && inserted.matches('p,blockquote,ul,ol') && inserted.textContent.length > 100) {
        inserted.remove(); let low = 1, high = unit.element.textContent.length - 1, best = 0;
        while (low <= high) { const mid = Math.floor((low + high) / 2), [piece] = splitTextElement(unit.element, mid); body.append(piece); const ok = fits(); piece.remove(); if (ok) { best = mid; low = mid + 1; } else high = mid - 1; }
        if (best > 0) { const boundary = unit.element.textContent.lastIndexOf(' ', best); const [first, rest] = splitTextElement(unit.element, boundary > best / 2 ? boundary + 1 : best); body.append(first); commit(); if (rest?.textContent) units.splice(i + 1, 0, { element: rest }); continue; }
      }
      throw new Error('A table row, field, or image is taller than the printable page. Reduce its size or choose narrower margins. Content is preserved in the editor.');
    }
    commit();
    if (!pages.length) throw new Error('There is no document content to preview.');
    return pages;
  } finally { host.remove(); }
}

export function pageHTML(contents, settings, labels = {}) {
  const g = pageGeometry(settings);
  const safe = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  return contents.map((html, i) => `<article class="hxc-print-page" style="width:${g.width}mm;height:${g.height}mm;padding:${g.margins.top}mm ${g.margins.right}mm ${g.margins.bottom}mm ${g.margins.left}mm;background:${/^#[\da-f]{6}$/i.test(settings.background) ? settings.background : '#ffffff'};${settings.border ? `border:1px solid ${safe(settings.border)};` : ''}"><header style="left:${g.margins.left}mm;right:${g.margins.right}mm">${safe(settings.header || labels.title || 'HXC COMPLIANCE AUDIT')}</header><div class="hxc-doc-content hxc-page-body">${html}</div><footer style="left:${g.margins.left}mm;right:${g.margins.right}mm"><span>${safe(settings.footer || labels.footer || 'HARMONIX')}</span>${settings.pageNumbers === false ? '' : `<span>Page ${i + 1} of ${contents.length}</span>`}</footer></article>`).join('');
}

export async function printDocument(pages, settings, labels) {
  const frame = document.createElement('iframe'); frame.title = 'HXC print document'; frame.style.cssText = 'position:fixed;left:-10000px;width:1px;height:1px;border:0'; document.body.append(frame);
  const doc = frame.contentDocument; doc.open(); doc.write('<!doctype html><html><head><title>HXC Audit</title></head><body></body></html>'); doc.close();
  const base=doc.createElement('base');base.href=document.baseURI;doc.head.append(base);
  // Copy the app's bundled styles into an isolated print document; no app chrome enters it.
  document.querySelectorAll('style,link[rel="stylesheet"]').forEach(style => doc.head.append(style.cloneNode(true)));
  const g = pageGeometry(settings), rules = doc.createElement('style');
  rules.textContent = `@page{size:${g.width}mm ${g.height}mm;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}.hxc-print-page{box-shadow:none!important;margin:0!important;break-after:page;overflow:visible!important}.hxc-print-page:last-child{break-after:auto}.hxc-page-body{display:flow-root}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}`; doc.head.append(rules);
  doc.body.innerHTML = pageHTML(pages, settings, labels);
  await Promise.all([...doc.querySelectorAll('link')].map(link => new Promise(resolve => { link.onload = resolve; link.onerror = resolve; setTimeout(resolve, 2500); })));
  await doc.fonts?.ready; await Promise.all([...doc.images].map(img => img.decode().catch(() => {})));
  frame.contentWindow.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 500), { once: true });
  frame.contentWindow.focus(); frame.contentWindow.print();
  setTimeout(() => frame.remove(), 60000);
}
