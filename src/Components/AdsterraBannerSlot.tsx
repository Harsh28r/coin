import React, { useEffect, useRef, useState } from 'react';
import { useShouldShowAds } from './AdSenseControl';
import './AdsterraBannerSlot.css';

type Props = {
  /** Full iframe src from Adsterra “Get code” (banner / native iframe — not invoke.js). */
  iframeSrc?: string;
  width?: number;
  height?: number;
  title?: string;
  lazy?: boolean;
  className?: string;
};

function resolveIframeSrc(override?: string): string | null {
  const raw = String(override || process.env.REACT_APP_ADSTERRA_BANNER_IFRAME_URL || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * Adsterra **iframe** banner only — counts in publisher stats, no `invoke.js`.
 * In [Adsterra](https://beta.publishers.adsterra.com/) → site → zone → get **iframe** embed
 * and set `REACT_APP_ADSTERRA_BANNER_IFRAME_URL` to the iframe `src` value.
 * Disable: `REACT_APP_ADSTERRA_ADS=0`
 */
const AdsterraBannerSlot: React.FC<Props> = ({
  iframeSrc: iframeSrcProp,
  width = 300,
  height = 250,
  title = 'Advertisement',
  lazy = true,
  className = '',
}) => {
  const shouldShow = useShouldShowAds();
  const disabled = process.env.REACT_APP_ADSTERRA_ADS === '0';
  const src = resolveIframeSrc(iframeSrcProp);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loadIframe, setLoadIframe] = useState(!lazy);

  useEffect(() => {
    if (!lazy || !shouldShow || disabled || !src) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoadIframe(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, shouldShow, disabled, src]);

  if (!shouldShow || disabled || !src) return null;

  return (
    <aside ref={wrapRef} className={`adsterra-banner ${className}`.trim()} aria-label="Advertisement">
      <span className="adsterra-banner__label">Advertisement</span>
      <div className="adsterra-banner__frame-wrap" style={{ width, height, maxWidth: '100%' }}>
        {loadIframe ? (
          <iframe
            title={title}
            src={src}
            width={width}
            height={height}
            style={{ border: 0, display: 'block', maxWidth: '100%' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="adsterra-banner__shim" style={{ width, height }} aria-hidden />
        )}
      </div>
    </aside>
  );
};

export default AdsterraBannerSlot;
