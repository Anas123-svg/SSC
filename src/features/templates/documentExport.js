import { pageGeometry } from './documentLayout.js';
import { sanitizeRichText } from './richText.js';

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportHTML(html, title, settings) {
  const root=new DOMParser().parseFromString(html,'text/html').body;
  await Promise.all([...root.querySelectorAll('img')].map(async img=>{if(!img.getAttribute('src')?.startsWith('/'))return;const response=await fetch(img.src);if(!response.ok)throw new Error('A branding image could not be exported.');const blob=await response.blob();img.src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}));
  html=root.innerHTML;
  const safeTitle = title.replace(/[<>&"]/g, '');
  downloadBlob(new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>body{font:11pt Arial;margin:25.4mm;color:#17212b}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{border:1px solid #aab2bb;padding:6px}img{max-width:100%}h2{break-after:avoid}tr{break-inside:avoid}.hxc-value{color:#596775}.hxc-score{padding:12px;background:#edf1e9}[data-page-break]{break-before:page}@page{size:${settings.paper === 'Letter' ? 'Letter' : 'A4'} ${settings.orientation || 'portrait'}}</style></head><body>${sanitizeRichText(html, { trustedDocument: true })}</body></html>`], { type: 'text/html;charset=utf-8' }), 'hxc-audit.html');
}

/** Real Office Open XML, with a separate custom XML payload for safe HXC round trips. */
export async function exportDOCX(pages, settings, payload) {
  const d = await import('docx'); const { default: JSZip } = await import('jszip');
  const hex = value => { const match = String(value || '').match(/^#([0-9a-f]{6})$/i); if (match) return match[1]; const rgb = String(value || '').match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/); return rgb ? rgb.slice(1).map(n => Number(n).toString(16).padStart(2,'0')).join('') : undefined; };
  const runs = async (node, inherited = {}) => {
    if (node.nodeType === 3) return [new d.TextRun({ text: node.textContent, ...inherited })];
    if (node.nodeType !== 1) return [];
    if (node.tagName === 'BR') return [new d.TextRun({ break: 1 })];
    if (node.tagName === 'IMG') {
      if (!/^(data:image\/(png|jpeg|gif);base64,|\/[^/])/.test(node.getAttribute('src') || '')) throw new Error('DOCX supports local PNG, JPEG and GIF images. Convert this image before exporting.');
      const response = await fetch(node.src); if (!response.ok) throw new Error('An image could not be included in DOCX.');
      const data = new Uint8Array(await response.arrayBuffer()), img = new Image(); img.src = node.src; await img.decode();
      const width = Math.min(Number(node.getAttribute('width')) || img.width, 600), height = width * img.height / img.width;
      return [new d.ImageRun({ data, type: response.headers.get('content-type')?.includes('jpeg') ? 'jpg' : response.headers.get('content-type')?.includes('gif') ? 'gif' : 'png', transformation: { width, height } })];
    }
    const style = { ...inherited };
    if (['STRONG','B'].includes(node.tagName)) style.bold = true;
    if (['EM','I'].includes(node.tagName)) style.italics = true;
    if (node.tagName === 'U') style.underline = {};
    if (['S','STRIKE'].includes(node.tagName)) style.strike = true;
    if (node.tagName === 'SUP') style.superScript = true;
    if (node.tagName === 'SUB') style.subScript = true;
    if (node.style.fontFamily) style.font = node.style.fontFamily.replaceAll('"','');
    if (node.style.fontSize) style.size = Math.round(parseFloat(node.style.fontSize) * (node.style.fontSize.endsWith('px') ? 1.5 : 2));
    if (hex(node.style.color)) style.color = hex(node.style.color);
    if (hex(node.style.backgroundColor)) style.shading = { fill: hex(node.style.backgroundColor) };
    if (Number(node.style.fontWeight) >= 600) style.bold = true;
    const result = (await Promise.all([...node.childNodes].map(n => runs(n, style)))).flat();
    return node.tagName === 'A' && /^(https?:\/\/|mailto:)/.test(node.getAttribute('href')) ? [new d.ExternalHyperlink({ link: node.getAttribute('href'), children: result })] : result;
  };
  const blocks = async root => {
    const result = [];
    for (const node of root.children) {
      if (node.tagName === 'TABLE') {
        const rows = [];
        for (const tr of node.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr')) {
          const cells = [];
          for (const td of tr.children) {
            const paragraphs = td.querySelector(':scope > p, :scope > table, :scope > div') ? await blocks(td) : [new d.Paragraph({ children: await runs(td) })];
            cells.push(new d.TableCell({ children: paragraphs.length ? paragraphs : [new d.Paragraph('')], columnSpan: Number(td.getAttribute('colspan')) || 1, rowSpan: Number(td.getAttribute('rowspan')) || 1, shading: { fill: hex(td.style.backgroundColor) || (td.tagName === 'TH' ? 'E9EDE5' : 'FFFFFF') }, margins: { top: 80, bottom: 80, left: 80, right: 80 } }));
          }
          rows.push(new d.TableRow({ children: cells, cantSplit: true, tableHeader: !!tr.querySelector('th') }));
        }
        result.push(new d.Table({ rows, width: { size: 100, type: d.WidthType.PERCENTAGE }, layout: d.TableLayoutType.FIXED }));
      } else if (node.matches('div[data-page-break]')) result.push(new d.Paragraph({ children: [new d.PageBreak()] }));
      else if (node.matches('section,div') && node.children.length) result.push(...await blocks(node));
      else if (['UL','OL'].includes(node.tagName)) {
        let i = Number(node.start) || 1;
        for (const li of node.children) result.push(new d.Paragraph({ children: [...(node.tagName === 'OL' ? [new d.TextRun(`${i++}. `)] : []), ...await runs(li)], bullet: node.tagName === 'UL' ? { level: 0 } : undefined }));
      } else {
        const level = /^H[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : 0;
        result.push(new d.Paragraph({ children: await runs(node), heading: level ? d.HeadingLevel[`HEADING_${level}`] : undefined, alignment: ({ left: d.AlignmentType.LEFT, center: d.AlignmentType.CENTER, right: d.AlignmentType.RIGHT, justify: d.AlignmentType.JUSTIFIED })[node.style.textAlign], spacing: { after: parseFloat(node.style.marginBottom) * 15 || 100, line: Number(node.style.lineHeight) * 240 || 276 }, keepNext: !!level }));
      }
    }
    return result;
  };
  const children = [];
  for (let i = 0; i < pages.length; i++) { const root = new DOMParser().parseFromString(pages[i], 'text/html').body; if (i) children.push(new d.Paragraph({ children: [new d.PageBreak()] })); children.push(...await blocks(root)); }
  const g = pageGeometry(settings), twips = mm => Math.round(mm / 25.4 * 1440);
  const document = new d.Document({ title: payload.reportConfig.title, creator: 'SSC / Harmonix', sections: [{ properties: { page: { size: { width: twips(g.width), height: twips(g.height) }, margin: Object.fromEntries(Object.entries(g.margins).map(([k,v]) => [k, twips(v)])) } }, headers: { default: new d.Header({ children: [new d.Paragraph(settings.header || payload.reportConfig.title)] }) }, footers: { default: new d.Footer({ children: [new d.Paragraph({ children: [new d.TextRun(settings.footer || payload.reportConfig.footerText), ...(settings.pageNumbers === false ? [] : [new d.TextRun({ children: [' · Page ', d.PageNumber.CURRENT, ' of ', d.PageNumber.TOTAL_PAGES] })])] })] }) }, children }] });
  const zip = await JSZip.loadAsync(await d.Packer.toBlob(document));
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, ...payload })); let binary = ''; bytes.forEach(b => { binary += String.fromCharCode(b); });
  zip.file('customXml/hxc-template.xml', `<hxcDocument xmlns="urn:harmonix:hxc:1"><payload>${btoa(binary)}</payload></hxcDocument>`);
  const relPath = 'word/_rels/document.xml.rels';
  zip.file(relPath, (await zip.file(relPath).async('string')).replace('</Relationships>', '<Relationship Id="hxcTemplate" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/hxc-template.xml"/></Relationships>'));
  downloadBlob(await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'hxc-audit.docx');
}

export async function importDOCX(file) {
  if (!file || !/\.docx$/i.test(file.name) || file.size > 8 * 1024 * 1024) throw new Error('Choose a .docx file smaller than 8 MB.');
  const [{ default: JSZip }, mammoth] = await Promise.all([import('jszip'), import('mammoth/mammoth.browser')]);
  const buffer = await file.arrayBuffer(), zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files);
  if (entries.length > 1500 || entries.reduce((n, f) => n + (f._data?.uncompressedSize || 0), 0) > 30 * 1024 * 1024) throw new Error('This DOCX is too large when expanded.');
  const result = await (mammoth.default || mammoth).convertToHtml({ arrayBuffer: buffer });
  const metadata = zip.file('customXml/hxc-template.xml'); let payload = null;
  if (metadata) {
    const xml = new DOMParser().parseFromString(await metadata.async('string'), 'application/xml');
    const encoded = xml.getElementsByTagName('payload')[0]?.textContent;
    if (encoded && encoded.length < 5000000) payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0))));
  }
  return { html: sanitizeRichText(result.value), payload, warnings: ['DOCX conversion preserves supported text, headings, lists, tables and embedded images. Page layout, floating objects, comments, revisions and advanced Word features may change or be omitted.', ...result.messages.map(m => m.message)] };
}
