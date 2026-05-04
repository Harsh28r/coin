import React, { useEffect, useRef } from 'react';
import { useShouldShowAds } from './AdSenseControl';
import './HighPerformanceFormatSlot.css';

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

const DEFAULT_ZONE_KEY = 'f389f4619d8225acd5e82afa806cd54b';

type Props = {
  /** Override env `REACT_APP_HPF_ZONE_KEY` */
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
 * HighPerformanceFormat / iframe invoke unit.
 * Set `REACT_APP_HPF_ZONE_KEY` to rotate zones; `REACT_APP_HPF_ADS=0` disables.
 */
const HighPerformanceFormatSlot: React.FC<Props> = ({
  zoneKey: zoneKeyProp,
  width = 160,
  height = 300,
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

    const node = wrapRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (cancelled || !entries[0]?.isIntersecting) return;
        inject();
        io.disconnect();
      },
      { rootMargin: '160px 0px', threshold: 0.01 },
    );
    io.observe(node);

    return () => {
      cancelled = true;
      io.disconnect();
      mountedRef.current = false;
      if (wrapRef.current) wrapRef.current.innerHTML = '';
    };
  }, [shouldShow, disabled, zoneKey, width, height, lazy]);

  if (!shouldShow || disabled) return null;

  return (
    <aside className={`hpf-ad-slot ${className}`.trim()} data-hpf-zone={zoneKey} aria-label="Advertisement">
      <span className="hpf-ad-slot__label">Advertisement</span>
      <div ref={wrapRef} className="hpf-ad-slot__target" />
    </aside>
  );
};

export default HighPerformanceFormatSlot;
