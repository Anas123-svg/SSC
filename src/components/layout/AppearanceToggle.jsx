import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { usePortal } from '../../app/PortalContext.jsx';

/** Single, keyboard-accessible light/dark toggle. The glyph shows the active mode. */
export default function AppearanceToggle({ withLabel = false }) {
  const { resolvedAppearance, setAppearance } = usePortal();
  const dark = resolvedAppearance === 'dark';
  const Icon = dark ? Moon : Sun;
  return <button
    type="button"
    className={'ssc-theme-toggle' + (withLabel ? ' ssc-theme-toggle--labelled' : '')}
    aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    aria-pressed={dark}
    title={dark ? 'Dark mode active · Switch to light mode' : 'Light mode active · Switch to dark mode'}
    onClick={() => setAppearance(dark ? 'light' : 'dark')}
  ><Icon size={19} aria-hidden="true"/>{withLabel && <span>{dark ? 'Dark mode' : 'Light mode'}</span>}</button>;
}
