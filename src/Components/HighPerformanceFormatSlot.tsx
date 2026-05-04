import React, { useEffect, useRef } from 'react';
import { useShouldShowAds } from './AdSenseControl';
import './HighPerformanceFormatSlot.css';

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

const DEFAULT_ZONE_KEY = '2503a138f0f2b6add8e925b6ad53a0c4';

type Props = {
  zoneKey?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  className?: string;
};

function safeZoneKey(raw: string): string {
  const s = String(raw || '').trim();
  if (/^[a-f0-9]{20,64}$/i.test(s)) return s;
  return DEFAULT_ZONE_KEY;
}

/**
 * HighPerformanceFormat (atOptions + invoke.js). Zone: env `REACT_APP_HPF_ZONE_KEY` or default.
 * Disable: `REACT_APP_HPF_ADS=0`.
 */
const HighPerformanceFormatSlot: React.FC<Props> = ({
  zoneKey: zoneKeyProp,
  width = 300,
  height = 250,
  lazy = true,
  className = '',
}) => {
  const shouldShow = useShouldShowAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const zoneKey = safeZoneKey(zoneKeyProp || process.env.REACT_APP_HPF_ZONE_KEY || DEFAULT_ZONE_KEY);
  const disabled = process.env.REACT_APP_HPF_ADS === '0';

  useEffect(() => {
    if (!shouldShow || disabled) return;

    const inject = () => {
      const el = wrapRef.current;
      if (!el || mountedRef.current) return;
      mountedRef.current = true;
      el.innerHTML = '';

      const opts = document.createElement('script');
      opts.text = `atOptions = {
  'key' : '${zoneKey}',
  'format' : 'iframe',
  'height' : ${height},
  'width' : ${width},
  'params' : {}
};`;
      el.appendChild(opts);

      const inv = document.createElement('script');
      inv.src = `https://www.highperformanceformat.com/${zoneKey}/invoke.js`;
      inv.async = true;
      el.appendChild(inv);
    };

    let cancelled = false;

    if (!lazy) {
      inject();
      return () => {
        cancelled = true;
        mountedRef.current = false;
        if (wrapRef.current) wrapRef.current.innerHTML = '';
      };
    }

    let io: IntersectionObserver | undefined;
    const timer = window.setTimeout(() => {
      const node = wrapRef.current;
      if (cancelled || !node) return;
      io = new IntersectionObserver(
        (entries) => {
          if (cancelled || !entries[0]?.isIntersecting) return;
          inject();
          io?.disconnect();
        },
        { rootMargin: '400px 0px', threshold: 0 },
      );
      io.observe(node);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      io?.disconnect();
      mountedRef.current = false;
      if (wrapRef.current) wrapRef.current.innerHTML = '';
    };
  }, [shouldShow, disabled, zoneKey, width, height, lazy]);

  if (!shouldShow || disabled) return null;

  return (
    <aside className={`hpf-ad-slot ${className}`.trim()} data-hpf-zone={zoneKey} aria-label="Advertisement">
      <span className="hpf-ad-slot__label">Advertisement</span>
      <div ref={wrapRef} className="hpf-ad-slot__target" style={{ minWidth: width, minHeight: height }} />
    </aside>
  );
};

export default HighPerformanceFormatSlot;
