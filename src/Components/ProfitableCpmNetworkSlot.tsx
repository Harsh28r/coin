import React, { useEffect, useRef } from 'react';
import { useShouldShowAds } from './AdSenseControl';
import './ProfitableCpmNetworkSlot.css';

const DEFAULT_SCRIPT_SRC =
  'https://pl29332375.profitablecpmratenetwork.com/32/6a/20/326a20ab88476db253a7a800fe3a7224.js';

function resolveScriptSrc(override?: string): string | null {
  const raw = String(override || process.env.REACT_APP_PCRN_SCRIPT_URL || DEFAULT_SCRIPT_SRC).trim();
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    if (!u.hostname.endsWith('profitablecpmratenetwork.com')) return null;
    if (!/\.js($|\?)/i.test(u.pathname + u.search)) return null;
    return u.href;
  } catch {
    return null;
  }
}

type Props = {
  /** Full https URL on profitablecpmratenetwork.com */
  scriptSrc?: string;
  lazy?: boolean;
  className?: string;
};

/**
 * ProfitableCPMRateNetwork tag. Disable: `REACT_APP_PCRN_ADS=0`.
 * Override URL: `REACT_APP_PCRN_SCRIPT_URL` (must stay on same host for safety).
 */
const ProfitableCpmNetworkSlot: React.FC<Props> = ({ scriptSrc: scriptSrcProp, lazy = true, className = '' }) => {
  const shouldShow = useShouldShowAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);
  const disabled = process.env.REACT_APP_PCRN_ADS === '0';

  const src = resolveScriptSrc(scriptSrcProp);

  useEffect(() => {
    if (!shouldShow || disabled || !src) return;

    const inject = () => {
      const el = wrapRef.current;
      if (!el || injectedRef.current) return;
      if (el.querySelector('script[data-pcrn-loader="1"]')) {
        injectedRef.current = true;
        return;
      }
      injectedRef.current = true;
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.pcrnLoader = '1';
      el.appendChild(s);
    };

    let cancelled = false;

    if (!lazy) {
      inject();
      return () => {
        cancelled = true;
        injectedRef.current = false;
        wrapRef.current?.querySelector('script[data-pcrn-loader="1"]')?.remove();
      };
    }

    const node = wrapRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (cancelled || !entries[0]?.isIntersecting) return;
        inject();
        io.disconnect();
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    );
    io.observe(node);

    return () => {
      cancelled = true;
      io.disconnect();
      injectedRef.current = false;
      wrapRef.current?.querySelector('script[data-pcrn-loader="1"]')?.remove();
    };
  }, [shouldShow, disabled, src, lazy]);

  if (!shouldShow || disabled || !src) return null;

  return (
    <aside className={`pcrn-ad-slot ${className}`.trim()} aria-label="Advertisement">
      <span className="pcrn-ad-slot__label">Advertisement</span>
      <div ref={wrapRef} className="pcrn-ad-slot__target" />
    </aside>
  );
};

export default ProfitableCpmNetworkSlot;
