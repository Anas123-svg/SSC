import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { documentExtensions } from './documentExtensions.js';
import { sanitizeRichText } from './richText.js';

/** Compact rich text engine used by the advanced field builder. */
export default function RichTextEditor({ value = '', onChange, disabled = false }) {
  const editor = useEditor({ extensions: documentExtensions(), content: sanitizeRichText(value), editable: !disabled,
    editorProps: { attributes: { class: 'hxc-doc-content', spellcheck: 'true', 'aria-label': 'Formatted field text' }, transformPastedHTML: html => sanitizeRichText(html) },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });
  if (!editor) return <p role="status">Loading text editor…</p>;
  return <div className="hxc-compact-editor"><div className="hxc-compact-tools">
    {[['Bold','bold','toggleBold'],['Italic','italic','toggleItalic'],['Underline','underline','toggleUnderline'],['Bullets','bulletList','toggleBulletList'],['Numbering','orderedList','toggleOrderedList']].map(([label,type,command]) => <button key={type} type="button" disabled={disabled} aria-pressed={editor.isActive(type)} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus()[command]().run()}>{label}</button>)}
    <button type="button" disabled={disabled} onClick={() => editor.chain().focus().undo().run()}>Undo</button><button type="button" disabled={disabled} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
    </div><EditorContent editor={editor}/></div>;
}
