import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Link2, Undo2, Redo2, IndentIncrease, IndentDecrease, Table2, RemoveFormatting, Pilcrow, Subscript, Superscript } from 'lucide-react';
import { sanitizeRichText } from './richText.js';

const FONT_SIZES = ['10','11','12','14','16','18','20','24','28','36'];
const ACTIONS = [
  ['bold','Bold',Bold],['italic','Italic',Italic],['underline','Underline',Underline],['strikeThrough','Strikethrough',Strikethrough],
  ['justifyLeft','Align left',AlignLeft],['justifyCenter','Centre',AlignCenter],['justifyRight','Align right',AlignRight],['justifyFull','Justify',AlignJustify],
  ['insertUnorderedList','Bulleted list',List],['insertOrderedList','Numbered list',ListOrdered],
  ['outdent','Decrease indent',IndentDecrease],['indent','Increase indent',IndentIncrease],
  ['subscript','Subscript',Subscript],['superscript','Superscript',Superscript],
  ['undo','Undo',Undo2],['redo','Redo',Redo2],['removeFormat','Clear formatting',RemoveFormatting],
];

/** Offline, Word-style browser editing. Keeps existing HXC field blocks separate and functional. */
export default function RichTextEditor({ value = '', onChange, disabled = false }) {
  const editRef = useRef(null);
  const rangeRef = useRef(null);
  const rememberSelection = () => {
    const selection = window.getSelection?.();
    if (selection?.rangeCount && editRef.current?.contains(selection.anchorNode)) rangeRef.current = selection.getRangeAt(0).cloneRange();
  };
  const [tab,setTab] = useState('home');
  // Ignore parent re-renders while the user is typing: otherwise the caret jumps.
  useEffect(() => {
    if (editRef.current && document.activeElement !== editRef.current && editRef.current.innerHTML !== sanitizeRichText(value)) editRef.current.innerHTML = sanitizeRichText(value);
  }, [value]);
  const sync = () => { if (editRef.current) onChange(sanitizeRichText(editRef.current.innerHTML)); };
  const command = (name,argument) => {
    if (disabled) return;
    editRef.current?.focus();
    if (rangeRef.current && document.contains(rangeRef.current.commonAncestorContainer)) {
      const selection = window.getSelection?.();
      selection?.removeAllRanges(); selection?.addRange(rangeRef.current);
    }
    document.execCommand(name,false,argument);
    rememberSelection(); sync();
  };
  const insertLink = () => { const href = window.prompt('Enter a URL (https://...)'); if (href && /^https?:\/\//i.test(href)) command('createLink',href); };
  const insertTable = () => command('insertHTML','<table><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></tbody></table><p><br></p>');
  return <div className="hxc-word-editor">
    <div className="hxc-word-ribbon" aria-label="Document formatting ribbon">
      <div className="hxc-word-tabs"><button type="button" className={tab==='home'?'active':''} onClick={()=>setTab('home')}>Home</button><button type="button" className={tab==='insert'?'active':''} onClick={()=>setTab('insert')}>Insert</button><span>Document formatting · Offline</span></div>
      {!disabled && <div className="hxc-word-tools" onMouseDown={event=>{ if (event.target.closest('button')) event.preventDefault(); }}>
        {tab==='home' ? <>
          <label>Style<select aria-label="Paragraph style" defaultValue="p" onChange={e=>command('formatBlock',e.target.value)}><option value="p">Normal</option><option value="h1">Title</option><option value="h2">Heading 1</option><option value="h3">Heading 2</option><option value="blockquote">Quote</option></select></label>
          <label>Font<select aria-label="Font family" defaultValue="Arial" onChange={e=>command('fontName',e.target.value)}><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Verdana</option><option>Courier New</option></select></label>
          <label>Size<select aria-label="Text size" defaultValue="3" onChange={e=>command('fontSize',e.target.value)}>{FONT_SIZES.map((size,i)=><option key={size} value={String(Math.min(7,Math.max(1,Math.round((i+1)*.72))))}>{size} pt</option>)}</select></label>
          {ACTIONS.map(([id,title,Icon])=><button key={id} type="button" title={title} aria-label={title} onClick={()=>command(id)}><Icon size={16}/></button>)}
          <label className="hxc-word-color" title="Font colour">A<input type="color" aria-label="Font colour" defaultValue="#243447" onChange={e=>command('foreColor',e.target.value)}/></label>
          <label className="hxc-word-color" title="Text highlight">▰<input type="color" aria-label="Text highlight" defaultValue="#fff0a8" onChange={e=>command('hiliteColor',e.target.value)}/></label>
        </> : <><button type="button" onClick={insertLink}><Link2 size={16}/> Insert link</button><button type="button" onClick={insertTable}><Table2 size={16}/> Insert table</button><button type="button" onClick={()=>command('insertHorizontalRule')}><Pilcrow size={16}/> Divider</button><span className="hxc-word-note">Use the builder’s Add content for live questions, signatures, photos and editable inspection tables.</span></>}
      </div>}
    </div>
    <div className="hxc-word-paper"><div ref={editRef} className="hxc-word-content" role="textbox" aria-label="Rich document text" aria-multiline="true" contentEditable={!disabled} suppressContentEditableWarning spellCheck onInput={()=>{rememberSelection();sync();}} onMouseUp={rememberSelection} onKeyUp={rememberSelection} onBlur={()=>{rememberSelection();sync();}} onDrop={event=>event.preventDefault()} onPaste={event=>{
      // Plain-text paste prevents external HTML injecting hostile styles/markup.
      event.preventDefault(); const text=event.clipboardData.getData('text/plain'); document.execCommand('insertText',false,text); sync();
    }}/></div>
    <div className="hxc-word-foot">Use Ctrl/Cmd + B, I or U to format selected text. Formatting is saved with the template.</div>
  </div>;
}
