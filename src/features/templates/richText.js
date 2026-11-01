import DOMPurify from 'dompurify';

const allowed = ['p','div','br','strong','b','em','i','u','s','strike','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','span','a','hr','table','colgroup','col','thead','tbody','tr','th','td','sub','sup','img','mark','section'];
/** Sanitize imported, pasted, and legacy rich text before parsing or displaying it. */
export function sanitizeRichText(html, { trustedDocument = false } = {}) {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined' || !DOMPurify.sanitize) return html.replace(/<[^>]*>/g, '');
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: allowed, ALLOWED_ATTR: ['style','href','src','alt','title','width','height','colspan','rowspan','colwidth','start','class'], ALLOW_DATA_ATTR: trustedDocument, FORBID_TAGS: ['svg','math','script','style','iframe','object','form'] });
  const root = new DOMParser().parseFromString(clean, 'text/html').body;
  root.querySelectorAll('*').forEach(el => {
    if (el.hasAttribute('href') && !/^(https?:\/\/|mailto:)/i.test(el.getAttribute('href'))) el.removeAttribute('href');
    if (el.tagName === 'IMG' && !/^(data:image\/(png|jpeg|webp|gif);base64,|\/[^/])/i.test(el.getAttribute('src') || '')) { el.replaceWith(root.ownerDocument.createTextNode('[External image omitted; upload a local image]')); return; }
    for (const name of [...el.style]) {
      const value = el.style.getPropertyValue(name);
      if (!/^(color|background-color|text-align|font-size|font-family|font-weight|font-style|text-decoration|line-height|margin-(left|right|top|bottom)|padding|border-(color|width)|vertical-align|width|height)$/.test(name) || /url\s*\(|expression|[\\<>]/i.test(value)) el.style.removeProperty(name);
    }
  });
  return root.innerHTML;
}
export async function readDocumentImage(file) {
  if (!file || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or GIF image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be smaller than 5 MB.');
  const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Unable to read image.')); reader.readAsDataURL(file); });
  const img = new window.Image(); img.src = data; await img.decode();
  const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/png');
  if (result.length > 1000000) throw new Error('The optimized image exceeds 750 KB. Choose a smaller image.');
  return result;
}
