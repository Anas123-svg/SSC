/** Restricted HTML allowed inside saved HXC document text. Never render unsanitised user markup. */
const TAGS = new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','STRIKE','H1','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','SPAN','A','HR','TABLE','THEAD','TBODY','TR','TH','TD','SUB','SUP']);
const STYLE_NAMES = new Set(['color','background-color','text-align','font-size','font-family','font-weight','font-style','text-decoration']);
export function sanitizeRichText(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, '');
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const clean = node => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 8) { child.remove(); continue; }
      if (child.nodeType !== 1) continue;
      if (child.tagName === 'FONT') {
        const span = doc.createElement('span');
        for (const key of ['color','face','size']) { const v = child.getAttribute(key); if (!v) continue;
          if (key === 'color' && /^(#[a-f\d]{3,8}|[a-z]+)$/i.test(v)) span.style.color = v;
          if (key === 'face' && /^[a-z ,'-]{1,45}$/i.test(v)) span.style.fontFamily = v;
          if (key === 'size' && Number(v)>=1 && Number(v)<=7) span.style.fontSize = `${[0,10,13,16,18,24,32,48][Number(v)]}px`; }
        while(child.firstChild) span.appendChild(child.firstChild);
        child.replaceWith(span); clean(span); continue;
      }
      if (!TAGS.has(child.tagName)) {
        if (['SCRIPT','STYLE','IFRAME','OBJECT','SVG','FORM','IMG','VIDEO','AUDIO','META','LINK'].includes(child.tagName)) { child.remove(); continue; }
        clean(child); child.replaceWith(...Array.from(child.childNodes)); continue;
      }
      const href = child.tagName === 'A' ? child.getAttribute('href') : null;
      const styles = [...child.style].filter(property => STYLE_NAMES.has(property)).map(property => [property,child.style.getPropertyValue(property)]);
      for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
      if (child.tagName === 'A' && href && /^(https?:\/\/|mailto:)/i.test(href)) { child.setAttribute('href', href); child.setAttribute('target','_blank'); child.setAttribute('rel','noopener noreferrer'); }
      for (const [key,value] of styles) {
        // Reject CSS functions, URLs and escaping. Text appearance only.
        if (/url\s*\(|expression\s*\(|[\\<>;]/i.test(value)) continue;
        if ((key === 'color' || key === 'background-color') && !/^(#[a-f\d]{3,8}|rgb\([\d\s,.%]+\)|rgba\([\d\s,.%]+\)|[a-z]+)$/i.test(value.trim())) continue;
        if (key === 'font-size' && !/^(\d{1,2}(px|pt|em|rem|%)|small|medium|large|x-large)$/.test(value.trim())) continue;
        child.style.setProperty(key,value);
      }
      clean(child);
    }
  };
  clean(root);
  return root.innerHTML;
}
