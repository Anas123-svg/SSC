import React from 'react';
export function Chip({ children, tone = '' }) { return <span className={'hxc-chip ' + tone}>{children}</span> ;}
export function Meter({ value, max = 100 }) { return <div className="hxc-meter"><i style={{ width: `${Math.min(100, Math.max(0, (value || 0) * 100 / max))}%` }} /></div> ;}
export function Button({ children, onClick, variant = 'secondary', icon: Icon, disabled, title }) { return <button title={title} disabled={disabled} onClick={onClick} className={'hxc-btn ' + variant}>{Icon && <Icon size={16} />} {children}</button> ;}
