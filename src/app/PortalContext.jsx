import React, { createContext, useContext } from 'react';

const PortalContext = createContext(null);

export function PortalProvider({ children, value }) {
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error('Portal components must be rendered inside PortalProvider');
  return context;
}
