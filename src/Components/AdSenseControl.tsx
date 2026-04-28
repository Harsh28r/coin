// AdSense Control — load adsbygoogle.js ONLY on routes with original content,
// and remove ad slots / scripts on aggregator (scraped-content) routes so
// Google reviewers never see ads on third-party material. This is a hard
// requirement of the AdSense program policy ("Valuable Inventory" /
// "Replicated content").

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ADSENSE_CLIENT = 'ca-pub-8105894285796694';
const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

// Pages that contain aggregated/external content — NEVER load AdSense here.
const BLOCKED_PREFIXES = [
  '/news/',
  '/news',
  '/ai-news',
  '/exclusive-news',
  '/All-exclusive-news',
  '/All-Trending-news',
  '/press-news',
  '/press-releases',
  '/beyond-the-headlines',
  '/search',
  '/admin',
];

const isBlockedPath = (pathname: string): boolean =>
  BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p));

const ensureScriptLoaded = (): void => {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[data-adsense-loader="1"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = ADSENSE_SRC;
  s.dataset.adsenseLoader = '1';
  document.head.appendChild(s);
};

const removeAdSlots = (): void => {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll<HTMLElement>('ins.adsbygoogle, .adsbygoogle')
    .forEach((el) => {
      el.style.display = 'none';
      el.setAttribute('data-adsbygoogle-status', 'unfilled');
    });
};

export const useAdSenseControl = (): void => {
  const location = useLocation();

  useEffect(() => {
    const blocked = isBlockedPath(location.pathname);
    (window as any).__adsenseDisabled = blocked;

    if (blocked) {
      removeAdSlots();
      return;
    }
    ensureScriptLoaded();
  }, [location.pathname]);
};

export const useShouldShowAds = (): boolean => {
  const location = useLocation();
  return !isBlockedPath(location.pathname);
};

export const AdSafeZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shouldShow = useShouldShowAds();
  if (!shouldShow) return null;
  return <>{children}</>;
};

export default useAdSenseControl;
