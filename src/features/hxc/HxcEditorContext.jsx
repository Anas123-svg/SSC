import React, { createContext, useContext } from 'react';

const EditorContext = createContext(null);
export function HxcEditorProvider({ children, value }) {
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
export function useHxcEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error('HXC editor components must be inside HxcEditorProvider');
  return editor;
}
