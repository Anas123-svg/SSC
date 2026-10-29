import React, { useEffect, useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';

const isInstalled = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone);
};

const isAppleMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isSafariOnApple = () => {
  if (!isAppleMobile()) return false;
  const agent = navigator.userAgent;
  return /Safari/i.test(agent) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA/i.test(agent);
};

/** On iOS/iPadOS, Apple intentionally does not expose a one-click install API.
 * Offer the real Safari Add to Home Screen workflow instead. */
export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(isInstalled);
  const [help, setHelp] = useState(false);
  const apple = isAppleMobile();

  useEffect(() => {
    const onBeforeInstall = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setHelp(false);
    };
    const mode = window.matchMedia?.('(display-mode: standalone)');
    const onModeChange = () => setInstalled(isInstalled());
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    mode?.addEventListener?.('change', onModeChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      mode?.removeEventListener?.('change', onModeChange);
    };
  }, []);

  useEffect(() => {
    if (!help) return;
    const onEscape = event => { if (event.key === 'Escape') setHelp(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [help]);

  async function install() {
    // iPhone and iPad require a user-operated Safari Share action, not prompt().
    if (apple || !installPrompt) {
      setHelp(true);
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice?.outcome !== 'accepted') setHelp(true);
    } catch {
      setHelp(true);
    }
  }

  if (installed) return null;
  return <>
    <button
      type="button"
      className={'ssc-pwa-install' + (apple ? ' is-apple' : '')}
      onClick={install}
      aria-label={apple ? 'Add SSC to iPhone or iPad Home Screen' : 'Install SSC app'}
      title={apple ? 'Add SSC to your Home Screen' : 'Install Site Safety Consultants on this device'}
    >
      <Download size={17} strokeWidth={2}/>
      <span>{apple ? 'Get SSC App' : 'Install SSC'}</span>
    </button>

    {help && <div className="ssc-pwa-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setHelp(false)}>
      <section className="ssc-pwa-modal" role="dialog" aria-modal="true" aria-labelledby="ssc-install-title" aria-describedby="ssc-install-description">
        <button type="button" className="ssc-pwa-close" onClick={() => setHelp(false)} aria-label="Close"><X size={20}/></button>
        <div className="ssc-pwa-modal-icon"><Smartphone size={24}/></div>
        <h2 id="ssc-install-title">{apple ? 'Add SSC to your Home Screen' : 'Install Site Safety Consultants (SSC)'}</h2>
        {apple ? <>
          {!isSafariOnApple() && <p className="ssc-pwa-apple-notice">Open this website in <strong>Safari</strong> first. If you are viewing it inside another app, use that app's menu to open it in Safari.</p>}
          <p id="ssc-install-description">On your iPhone or iPad, use Safari to install the <strong>SSC</strong> app with its original logo:</p>
          <ol>
            <li>Tap the <Share2 size={16} aria-label="Share"/> <strong>Share</strong> button. On newer iPhones, first tap the page menu, then Share.</li>
            <li>Scroll and choose <strong>Add to Home Screen</strong>.</li>
            <li>Keep <strong>Open as Web App</strong> enabled, if shown.</li>
            <li>Tap <strong>Add</strong>. The SSC icon will appear on your Home Screen.</li>
          </ol>
          <p className="ssc-pwa-hint">Can't find Add to Home Screen? In Safari's Share sheet, scroll down and choose Edit Actions. Open SSC online once before using it offline.</p>
        </> : <>
          <p id="ssc-install-description">Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
          <p className="ssc-pwa-hint">The app must be served over HTTPS (or localhost) and opened online once before offline use.</p>
        </>}
        <button type="button" className="ssc-pwa-done" onClick={() => setHelp(false)}>Got it</button>
      </section>
    </div>}
  </>;
}
