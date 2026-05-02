import React, { useEffect, useMemo, useRef } from 'react';
import { ADSENSE_CLIENT, useShouldShowAds } from './AdSenseControl';
import './AdSenseSlot.css';

export type AdSensePlacement =
  | 'landing-a'
  | 'landing-b'
  | 'landing-c'
  | 'blog-atf'
  | 'blog-mid'
  | 'blog-btf'
  | 'coin-mid'
  | 'coin-btf'
  | 'tools-atf'
  | 'tools-mid'
  | 'compare-mid'
  | 'compare-btf';

type SizeVariant = 'leaderboard' | 'in-article' | 'tools';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    __adsenseDisabled?: boolean;
  }
}

function resolveSlotId(placement: AdSensePlacement): string {
  const env = process.env;
  const display = env.REACT_APP_ADSENSE_SLOT_DISPLAY || '';
  const map: Record<AdSensePlacement, string | undefined> = {
    'landing-a': env.REACT_APP_ADSENSE_SLOT_LANDING_A || env.REACT_APP_ADSENSE_SLOT_LANDING,
    'landing-b': env.REACT_APP_ADSENSE_SLOT_LANDING_B || env.REACT_APP_ADSENSE_SLOT_LANDING,
    'landing-c': env.REACT_APP_ADSENSE_SLOT_LANDING_C || env.REACT_APP_ADSENSE_SLOT_LANDING,
    'blog-atf': env.REACT_APP_ADSENSE_SLOT_BLOG_ATF,
    'blog-mid': env.REACT_APP_ADSENSE_SLOT_BLOG_MID,
    'blog-btf': env.REACT_APP_ADSENSE_SLOT_BLOG_BTF,
    'coin-mid': env.REACT_APP_ADSENSE_SLOT_COIN_MID,
    'coin-btf': env.REACT_APP_ADSENSE_SLOT_COIN_BTF,
    'tools-atf': env.REACT_APP_ADSENSE_SLOT_TOOLS_ATF,
    'tools-mid': env.REACT_APP_ADSENSE_SLOT_TOOLS_MID,
    'compare-mid': env.REACT_APP_ADSENSE_SLOT_COMPARE_MID,
    'compare-btf': env.REACT_APP_ADSENSE_SLOT_COMPARE_BTF,
  };
  return (map[placement] || display || '').trim();
}

export type AdSenseSlotProps = {
  placement: AdSensePlacement;
  size?: SizeVariant;
  lazy?: boolean;
  className?: string;
};

/**
 * One responsive display unit per mount. Set `REACT_APP_ADSENSE_SLOT_DISPLAY` (and optional per-placement slots)
 * in the CRA env; until then, a dashed placeholder keeps layout stable.
 */
const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  placement,
  size = 'leaderboard',
  lazy = true,
  className = '',
}) => {
  const shouldShow = useShouldShowAds();
  const slotId = useMemo(() => resolveSlotId(placement), [placement]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!shouldShow || !slotId) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const attempt = (): boolean => {
      if (cancelled || pushedRef.current) return true;
      if (typeof window === 'undefined' || window.__adsenseDisabled) return false;
      const ins = insRef.current;
      if (!ins || !window.adsbygoogle) return false;
      try {
        window.adsbygoogle.push({});
        pushedRef.current = true;
        return true;
      } catch {
        return false;
      }
    };

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (attempt() || cancelled) {
          if (intervalId) clearInterval(intervalId);
        }
      }, 100);
    };

    if (!lazy) {
      startPolling();
      return () => {
        cancelled = true;
        if (intervalId) clearInterval(intervalId);
      };
    }

    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || cancelled) return;
        startPolling();
        io.disconnect();
      },
      { rootMargin: '120px 0px', threshold: 0.01 },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, [shouldShow, slotId, lazy]);

  if (!shouldShow) return null;

  const sizeClass =
    size === 'in-article' ? 'ad-slot--in-article' : size === 'tools' ? 'ad-slot--tools' : 'ad-slot--leaderboard';

  if (!slotId) {
    return (
      <div
        ref={wrapRef}
        className={`ad-slot ad-slot--placeholder ${sizeClass} ${className}`.trim()}
        data-ad-placeholder={placement}
        aria-hidden
      >
        <span className="ad-slot__label">Advertisement</span>
        <div className="ad-slot__inner">Ad slot · set REACT_APP_ADSENSE_SLOT_DISPLAY in env</div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`ad-slot ${sizeClass} ${className}`.trim()} data-ad-wrap={placement}>
      <span className="ad-slot__label">Advertisement</span>
      <div className="ad-slot__inner">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default AdSenseSlot;
