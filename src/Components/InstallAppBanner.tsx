import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'cc_pwa_install_dismissed';

const InstallAppBanner: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(ios);
    if (ios) {
      setVisible(true);
      return;
    }

    const onbip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onbip);
    return () => window.removeEventListener('beforeinstallprompt', onbip);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install CoinsClarity app"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 420,
        margin: '0 auto',
        background: '#0b1220',
        color: '#f8fafc',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          Install CoinsClarity
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>
          {isIos
            ? 'Safari → Share → Add to Home Screen. Opens like an app: P2P, gas, alerts.'
            : 'Add to your home screen for one-tap P2P, gas, funding and alerts.'}
        </div>
        {!isIos && deferred && (
          <button
            type="button"
            onClick={install}
            style={{
              marginTop: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#e85d2c',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Install app
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallAppBanner;
