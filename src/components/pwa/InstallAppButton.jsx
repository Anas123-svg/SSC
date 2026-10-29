import React, { useEffect, useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);
const isAppleMobile = () => /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Visible only on phone / small-tablet widths. Chrome provides beforeinstallprompt;
 * iOS Safari requires a manual Add to Home Screen action. */
export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => standalone());
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const beforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setHelp(false); };
    const mode = window.matchMedia?.('(display-mode: standalone)');
    const onModeChange = () => setInstalled(standalone());
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    mode?.addEventListener?.('change', onModeChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      mode?.removeEventListener?.('change', onModeChange);
    };
  }, []);

  async function install() {
    if (!installPrompt) { setHelp(true); return; }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice?.outcome === 'accepted') setHelp(false);
    } catch { setHelp(true); }
  }

  if (installed) return null;
  const apple = isAppleMobile();
  return <>
    <button type="button" className="ssc-pwa-install" onClick={install} aria-label="Install Harmonix app" title="Install Harmonix on this device">
      <Download size={17} strokeWidth={2}/><span>Install app</span>
    </button>
    {help && <div className="ssc-pwa-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setHelp(false)}>
      <section className="ssc-pwa-modal" role="dialog" aria-modal="true" aria-labelledby="ssc-install-title">
        <button type="button" className="ssc-pwa-close" onClick={() => setHelp(false)} aria-label="Close"><X size={20}/></button>
        <div className="ssc-pwa-modal-icon"><Smartphone size={24}/></div>
        <h2 id="ssc-install-title">Install Harmonix on your device</h2>
        {apple ? <>
          <p>Open this page in <strong>Safari</strong>, then:</p>
          <ol><li>Tap the <Share2 size={16} aria-label="Share"/> <strong>Share</strong> icon.</li><li>Choose <strong>Add to Home Screen</strong> (or <strong>Open as Web App</strong>, where shown).</li><li>Tap <strong>Add</strong>.</li></ol>
        </> : <>
          <p>In Chrome or another supported browser, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
          <p className="ssc-pwa-hint">Installation requires an HTTPS site (or localhost), a supported browser, and a successful first load.</p>
        </>}
        <button type="button" className="ssc-pwa-done" onClick={() => setHelp(false)}>Got it</button>
      </section>
    </div>}
  </>;
}
