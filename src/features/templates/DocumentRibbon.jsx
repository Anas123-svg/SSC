import React, { useEffect, useId, useRef, useState } from 'react';
import { useEditorState } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Subscript, Superscript, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo2, Redo2, Image, Table2, Link2, Search, Pilcrow, Save, Printer, Eye, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { readDocumentImage, sanitizeRichText } from './richText.js';

const MAIN_RIBBON_TABS = ['File','Home','Insert','Layout','References','Review','View','Help'];
const fonts = ['Arial','Aptos','Calibri','Georgia','Times New Roman','Verdana','Tahoma','Courier New'];
export default function DocumentRibbon({ editor, tab, setTab, settings, onSettings, onSave, onPreview, onPrint, onExport, onImport, onInsertField, onStructure, onNotice, readOnly, ruler, setRuler, zoom, setZoom }) {
  useEditorState({ editor, selector: ({ editor: current }) => ({ from: current.state.selection.from, to: current.state.selection.to, marks: current.state.storedMarks?.map(m=>m.toJSON()), active: ['bold','italic','underline','strike','subscript','superscript','table','image','heading','bulletList','orderedList'].map(name=>current.isActive(name)), style: current.getAttributes('textStyle'), paragraph: current.getAttributes('paragraph'), heading: current.getAttributes('heading') }) });
  const imageInput = useRef(null), importInput = useRef(null);
  const [ribbonExpanded, setRibbonExpanded] = useState(true);
  const menuScroll = useRef(null);
  const ribbonId = useId();
  const contextualTabs = [
    ...(editor.isActive('table') ? ['Table Design', 'Table Layout'] : []),
    ...(editor.isActive('image') ? ['Picture'] : []),
  ];
  const tabs = [...MAIN_RIBBON_TABS, ...contextualTabs];
  const tabKey = tabs.join('|');
  useEffect(() => {
    if (!tabs.includes(tab)) setTab('Home');
  // tabKey tracks the set of contextual tabs without retriggering on every editor transaction.
  }, [tab, tabKey, setTab]);
  const selectTab = name => { setTab(name); setRibbonExpanded(true); };
  const scrollTabs = direction => menuScroll.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  const onTabsKeyDown = event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll('[role="tab"]')];
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    const target = buttons[next];
    if (!target) return;
    selectTab(target.dataset.ribbonTab);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const [find, setFind] = useState(false), [query, setQuery] = useState(''), [replacement, setReplacement] = useState('');
  const run = fn => { if (!readOnly) fn(editor.chain().focus()).run(); };
  const btn = (label, action, active = false, disabled = false, Icon) => <button key={label} type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={action}>{Icon && <Icon size={16}/>}<span>{label}</span></button>;
  const command = (label, method, active, Icon) => btn(label, () => run(c => c[method]()), editor.isActive(active), readOnly, Icon);
  const select = (label, value, options, change, disabled = readOnly) => <label className="hxc-ribbon-select"><span>{label}</span><select aria-label={label} value={value} disabled={disabled} onChange={e => change(e.target.value)}>{options.map(o => <option key={Array.isArray(o) ? o[0] : o} value={Array.isArray(o) ? o[0] : o}>{Array.isArray(o) ? o[1] : o}</option>)}</select></label>;
  const group = (label, children) => <div className="hxword-group"><div className="hxword-tools">{children}</div><small>{label}</small></div>;
  const textStyle = editor.getAttributes('textStyle');
  const paragraphAttr = key => editor.getAttributes(editor.isActive('heading') ? 'heading' : 'paragraph')[key];
  const updateParagraph = patch => run(c => c.updateAttributes('paragraph', patch).updateAttributes('heading', patch).updateAttributes('hxcSection', patch).updateAttributes('hxcDescription', patch));
  const indent = delta => {
    if (editor.isActive('listItem')) run(c => delta > 0 ? c.sinkListItem('listItem') : c.liftListItem('listItem'));
    else updateParagraph({ indent: Math.max(0, Math.min(160, (Number(paragraphAttr('indent')) || 0) + delta * 20)) });
  };
  const findMatches = () => { const matches = []; if (!query) return matches; editor.state.doc.descendants((node, pos) => { if (!node.isText) return; let start = 0, at; while ((at = node.text.toLowerCase().indexOf(query.toLowerCase(), start)) >= 0) { matches.push({ from: pos + at, to: pos + at + query.length }); start = at + query.length; } }); return matches; };
  const findNext = () => { const matches = findMatches(); if (!matches.length) { onNotice('No matches.'); return; } const match = matches.find(m => m.from >= editor.state.selection.to) || matches[0]; editor.commands.setTextSelection(match); editor.commands.scrollIntoView(); onNotice(`${matches.length} matches in document.`); };
  const replace = all => { if (readOnly) return; const matches = findMatches(); const targets = all ? matches : matches.filter(m => m.from === editor.state.selection.from && m.to === editor.state.selection.to); if (!targets.length) { findNext(); return; } const tr = editor.state.tr; targets.reverse().forEach(m => tr.insertText(replacement, m.from, m.to)); editor.view.dispatch(tr); onNotice(`Replaced ${targets.length} match(es).`); };
  const clipboard = async action => {
    try {
      if (action === 'paste' || action === 'plain') {
        if (action === 'paste' && navigator.clipboard.read) { const items = await navigator.clipboard.read(); let pasted = false; for (const item of items) if (item.types.includes('text/html')) { editor.chain().focus().insertContent(sanitizeRichText(await (await item.getType('text/html')).text())).run(); pasted = true; break; } if (pasted) return; }
        const value = await navigator.clipboard.readText(); editor.chain().focus().insertContent(value.split('\n').map(line => ({ type: 'paragraph', content: line ? [{ type: 'text', text: line }] : [] }))).run();
      } else { const { from, to } = editor.state.selection; await navigator.clipboard.writeText(editor.state.doc.textBetween(from, to, '\n')); if (action === 'cut') editor.chain().focus().deleteSelection().run(); }
    } catch { onNotice('Clipboard access is unavailable. Use Ctrl/Cmd+C, X or V (Shift+V for plain text).'); }
  };
  const insertLink = () => { const href = window.prompt('Link URL (https:// or mailto:)', editor.getAttributes('link').href || 'https://'); if (href === null) return; if (!href) run(c => c.unsetLink()); else if (/^(https?:\/\/|mailto:)/i.test(href)) run(c => c.extendMarkRange('link').setLink({ href })); else onNotice('Use an https://, http:// or mailto: link.'); };
  const table = () => { const rows = Number(window.prompt('Rows (1–30)', '3')); if (!Number.isInteger(rows) || rows < 1 || rows > 30) return; const cols = Number(window.prompt('Columns (1–10)', '3')); if (!Number.isInteger(cols) || cols < 1 || cols > 10) return; run(c => c.insertTable({ rows, cols, withHeaderRow: true })); };
  const protectedTable = editor.isActive('hxcReport') || editor.isActive('hxcResponseTable');
  const color = (label, value, change) => <label className="hxc-color" title={label}>{label}<input type="color" aria-label={label} value={/^#[\da-f]{6}$/i.test(value) ? value : '#000000'} disabled={readOnly} onChange={e => change(e.target.value)}/></label>;
  const change = patch => onSettings({ ...settings, ...patch });
  return <>
    <nav className="hxword-menu" aria-label="Document editing menu">
      <div className="hxword-menu-scroller" ref={menuScroll}>
        <div className="hxword-tabs" role="tablist" aria-label="Document ribbon tabs" onKeyDown={onTabsKeyDown}>
          {tabs.map((name, index) => <button
            key={name}
            type="button"
            role="tab"
            data-ribbon-tab={name}
            id={`${ribbonId}-tab-${index}`}
            aria-controls={ribbonId}
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            className={[
              'hxword-menu-tab',
              name === 'File' ? 'is-file' : '',
              contextualTabs.includes(name) ? 'is-contextual' : '',
              tab === name ? 'active' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => selectTab(name)}
            onDoubleClick={() => setRibbonExpanded(value => !value)}
          >{name}</button>)}
        </div>
      </div>
      <div className="hxword-menu-actions">
        <button type="button" className="hxword-menu-scroll hxword-menu-scroll-prev" onClick={() => scrollTabs(-1)} aria-label="Scroll ribbon tabs left" title="Previous tabs"><ChevronLeft size={16}/></button>
        <button type="button" className="hxword-menu-scroll hxword-menu-scroll-next" onClick={() => scrollTabs(1)} aria-label="Scroll ribbon tabs right" title="Next tabs"><ChevronRight size={16}/></button>
        <span className="hxword-menu-divider" aria-hidden="true"/>
        <button type="button" className="hxword-ribbon-toggle" aria-expanded={ribbonExpanded} aria-controls={ribbonId} aria-label={ribbonExpanded ? 'Collapse ribbon' : 'Expand ribbon'} title={ribbonExpanded ? 'Hide commands' : 'Show commands'} onClick={() => setRibbonExpanded(value => !value)}>
          {ribbonExpanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}<span>{ribbonExpanded ? 'Hide ribbon' : 'Show ribbon'}</span>
        </button>
      </div>
    </nav>
    <div className="hxword-ribbon" id={ribbonId} role="tabpanel" aria-label={`${tab} ribbon`} aria-labelledby={`${ribbonId}-tab-${Math.max(tabs.indexOf(tab), 0)}`} hidden={!ribbonExpanded} onMouseDown={e => { if (e.target.closest('button')) e.preventDefault(); }}>
      {tab === 'Home' && <>
        {group('Clipboard', <>{btn('Cut', () => clipboard('cut'), false, readOnly)}{btn('Copy', () => clipboard('copy'))}{btn('Paste', () => clipboard('paste'), false, readOnly)}{btn('Paste plain text', () => clipboard('plain'), false, readOnly)}</>)}
        {group('Font', <>{select('Font family', textStyle.fontFamily || 'Arial', fonts, fontFamily => run(c => c.setFontFamily(fontFamily)))}{select('Font size', textStyle.fontSize || '11pt', [8,9,10,11,12,14,16,18,20,24,28,36,48,72].map(n => [`${n}pt`,String(n)]), size => run(c => c.setFontSize(size)))}
          <div className="hxc-icon-tools">{command('Bold','toggleBold','bold',Bold)}{command('Italic','toggleItalic','italic',Italic)}{command('Underline','toggleUnderline','underline',Underline)}{command('Strikethrough','toggleStrike','strike',Strikethrough)}{command('Subscript','toggleSubscript','subscript',Subscript)}{command('Superscript','toggleSuperscript','superscript',Superscript)}</div>
          {color('Text color', textStyle.color || '#17212b', color => run(c => c.setColor(color)))}{color('Highlight', editor.getAttributes('highlight').color || '#fff2a8', color => run(c => c.toggleHighlight({ color })))}{btn('Clear formatting', () => run(c => c.unsetAllMarks().clearNodes()), false, readOnly)}
        </>)}
        {group('Paragraph', <><div className="hxc-icon-tools">{[['left',AlignLeft],['center',AlignCenter],['right',AlignRight],['justify',AlignJustify]].map(([align,Icon]) => btn(`Align ${align}`, () => run(c => c.setTextAlign(align)), editor.isActive({ textAlign: align }), readOnly, Icon))}{command('Bullets','toggleBulletList','bulletList',List)}{command('Numbering','toggleOrderedList','orderedList',ListOrdered)}</div>{btn('Decrease indent', () => indent(-1), false, readOnly)}{btn('Increase indent', () => indent(1), false, readOnly)}{select('Line spacing', paragraphAttr('lineHeight') || '1.4', ['1','1.15','1.4','1.5','2','2.5','3'], lineHeight => updateParagraph({ lineHeight }))}{select('After paragraph', paragraphAttr('spaceAfter') || '6pt', ['0pt','6pt','12pt','18pt','24pt'], spaceAfter => updateParagraph({ spaceAfter }))}</>)}
        {group('Styles', <>{select('Paragraph style', editor.isActive('heading') ? `h${editor.getAttributes('heading').level}` : editor.isActive('blockquote') ? 'quote' : 'p', [['p','Normal'], ...[1,2,3,4,5,6].map(i => [`h${i}`,`Heading ${i}`]), ['quote','Blockquote']], value => run(c => value === 'p' ? c.setParagraph() : value === 'quote' ? c.toggleBlockquote() : c.setHeading({ level: Number(value[1]) })))}{select('Font weight', textStyle.fontWeight || '400', [['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Heavy']], fontWeight => run(c => c.setMark('textStyle', { fontWeight })))}</>)}
        {group('Editing', <>{btn('Find & replace', () => setFind(v => !v), find, false, Search)}{btn('Select all', () => editor.chain().focus().selectAll().run())}</>)}
      </>}
      {tab === 'File' && <>{group('Document', <>{btn('Save', onSave, false, readOnly, Save)}{btn('Preview document', onPreview, false, false, Eye)}{btn('Print / Save as PDF', onPrint, false, false, Printer)}</>)}{group('Export & import', <>{btn('Export DOCX', () => onExport('docx'))}{btn('Export HTML', () => onExport('html'))}{btn('Import DOCX', () => importInput.current.click(), false, readOnly)}</>)}</>}
      {tab === 'Insert' && <>{group('Elements', <>{btn('Table', table, false, readOnly, Table2)}{btn('Image', () => imageInput.current.click(), false, readOnly, Image)}{btn('Link', insertLink, editor.isActive('link'), readOnly, Link2)}{btn('Horizontal line', () => run(c => c.setHorizontalRule()), false, readOnly)}{btn('Page break', () => run(c => c.insertContent({ type: 'pageBreak' })), false, readOnly)}{btn('Paragraph', () => onStructure('paragraph'), false, readOnly, Pilcrow)}{btn('Date', () => run(c => c.insertContent(new Date().toLocaleDateString())), false, readOnly)}{btn('© symbol', () => run(c => c.insertContent('©')), false, readOnly)}</>)}{group('HXC fields', <>{[['radio','Checklist row'],['text','Inspection field'],['table','Response table'],['signature','Signature field'],['photo','Photo evidence']].map(([type,label]) => btn(label, () => onInsertField(type), false, readOnly))}</>)}</>}
      {tab === 'Layout' && <>{group('Page setup', <>{select('Paper size', settings.paper || 'A4', [['A4','A4'],['Letter','US Letter']], paper => change({ paper }))}{select('Page orientation', settings.orientation || 'portrait', [['portrait','Portrait'],['landscape','Landscape']], orientation => change({ orientation }))}{select('Page margins', settings.margins || 'normal', [['normal','Normal'],['narrow','Narrow'],['wide','Wide'],['custom','Custom']], margins => change({ margins }))}{settings.margins === 'custom' && ['top','right','bottom','left'].map(side => <label key={side}>{side} mm<input aria-label={`${side} margin mm`} type="number" min="8" max="60" value={settings.customMargins?.[side] || 25.4} onChange={e => change({ customMargins: { ...settings.customMargins, [side]: Number(e.target.value) } })}/></label>)}{color('Page background', settings.background || '#ffffff', background => change({ background }))}{select('Page border', settings.border || '', [['','None'],['#525b65','Charcoal'],['#b6d552','Lime']], border => change({ border }))}</>)}{group('Header & footer', <><label>Header<input aria-label="Page header" value={settings.header || ''} disabled={readOnly} onChange={e => change({ header: e.target.value })}/></label><label>Footer<input aria-label="Page footer" value={settings.footer || ''} disabled={readOnly} onChange={e => change({ footer: e.target.value })}/></label>{btn('Page numbers', () => change({ pageNumbers: settings.pageNumbers === false }), settings.pageNumbers !== false, readOnly)}</>)}</>}
      {tab === 'References' && <>{group('References', <>{btn('Reference link', insertLink, false, readOnly)}{btn('Image caption', () => run(c => c.insertContent({ type: 'paragraph', content: [{ type: 'text', text: 'Figure — enter caption', marks: [{ type: 'italic' }] }] })), false, readOnly)}</>)}<p className="hxc-ribbon-help">HXC evidence and action references remain attached to each field ID.</p></>}
      {tab === 'Review' && <>{group('Proofing', <>{btn('Find & replace', () => setFind(v => !v))}{btn('Browser spellcheck', () => { editor.view.dom.spellcheck = !editor.view.dom.spellcheck; onNotice(`Browser spellcheck ${editor.view.dom.spellcheck ? 'enabled' : 'disabled'}. Right-click underlined words for suggestions.`); })}</>)}<p className="hxc-ribbon-help">Spelling uses your browser. Changes are saved in this browser; there is no live coauthoring or tracked changes.</p></>}
      {tab === 'View' && <>{group('Display', <>{btn('Ruler', () => setRuler(!ruler), ruler)}{btn('Print layout preview', onPreview)}{select('Zoom', String(zoom), [50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200].map(v => [String(v),`${v}%`]), v => setZoom(Number(v)), false)}</>)}</>}
      {tab === 'Help' && <p className="hxc-ribbon-help">Ctrl/Cmd+B, I, U: format · Z / Shift+Z: undo / redo · S: save · F: find. Edit requirements on the paper. Select a field for its properties. Preview measures print pages; the editor keeps a continuous document. Use the field controls to remove protected HXC fields.</p>}
      {tab === 'Table Layout' && editor.isActive('table') && <>{group('Rows & columns', <>{[['Row above','addRowBefore'],['Row below','addRowAfter'],['Column left','addColumnBefore'],['Column right','addColumnAfter'],['Delete row','deleteRow'],['Delete column','deleteColumn'],['Delete table','deleteTable'],['Merge cells','mergeCells'],['Split cell','splitCell']].map(([label,method]) => btn(label, () => run(c => c[method]()), false, readOnly || protectedTable || !editor.can()[method]()))}</>)}{protectedTable && <p className="hxc-ribbon-help">These are HXC report fields. Change their structure in Report layout & tables to preserve response keys.</p>}</>}
      {tab === 'Table Design' && editor.isActive('table') && <>{group('Cells', <>{color('Cell background', editor.getAttributes('tableCell').backgroundColor || '#ffffff', color => run(c => c.setCellAttribute('backgroundColor', color)))}{color('Border color', editor.getAttributes('tableCell').borderColor || '#aab2bb', color => run(c => c.setCellAttribute('borderColor', color)))}{select('Border thickness', editor.getAttributes('tableCell').borderWidth || '1px', ['0px','1px','2px','3px'], value => run(c => c.setCellAttribute('borderWidth', value)))}{select('Cell padding', editor.getAttributes('tableCell').padding || '6px', ['2px','4px','6px','10px','16px'], value => run(c => c.setCellAttribute('padding', value)))}{select('Cell alignment', editor.getAttributes('tableCell').verticalAlign || 'top', ['top','middle','bottom'], value => run(c => c.setCellAttribute('verticalAlign', value)))}{btn('Toggle header row', () => run(c => c.toggleHeaderRow()), false, readOnly || protectedTable)}{btn('Lime cell style', () => run(c => c.setCellAttribute('backgroundColor','#edf3dc').setCellAttribute('borderColor','#81975c')), false, readOnly)}</>)}<p className="hxc-ribbon-help">Drag column boundaries to resize. Paragraph alignment controls align text inside cells.</p></>}
      {tab === 'Picture' && editor.isActive('image') && <>{group('Picture', <><label>Width px<input aria-label="Image width" type="number" min="30" max="1200" value={editor.getAttributes('image').width || 240} onChange={e => run(c => c.updateAttributes('image', { width: Math.max(30, Math.min(1200, Number(e.target.value))) }))}/></label>{select('Image alignment', editor.getAttributes('image').align || 'left', ['left','center','right'], align => run(c => c.updateAttributes('image', { align })))}{btn('Replace image', () => imageInput.current.click(), false, readOnly)}{btn('Delete image', () => run(c => c.deleteSelection()), false, readOnly)}</>)}</>}
    </div>
    <input ref={imageInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; try { const src = await readDocumentImage(file); if (editor.isActive('image')) run(c => c.updateAttributes('image', { src })); else run(c => c.setImage({ src, alt: file.name, width: 240 })); } catch (error) { onNotice(error.message); } }}/>
    <input ref={importInput} hidden type="file" accept=".docx" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onImport(file); }}/>
    {find && <div className="hxword-find" role="search"><input aria-label="Find in document" placeholder="Find in document" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') findNext(); }}/><button onClick={findNext}>Find next</button><input aria-label="Replace with" placeholder="Replace with" value={replacement} onChange={e => setReplacement(e.target.value)}/><button disabled={readOnly} onClick={() => replace(false)}>Replace</button><button disabled={readOnly} onClick={() => replace(true)}>Replace all</button><button aria-label="Close find" onClick={() => setFind(false)}><X size={16}/></button></div>}
  </>;
}
