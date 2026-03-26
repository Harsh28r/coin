// AdSense Control - Disable ads on aggregated content pages to comply with AdSense policies
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Pages that contain aggregated/external content - NO ADS on these
const AGGREGATED_ROUTES = [
  '/news/',           // News detail pages (aggregated content)
  '/ai-news',         // AI news (from MIT, arXiv)
  '/exclusive-news',  // Exclusive news (aggregated)
  '/press-releases',  // Press releases (aggregated)
];

// Pages with ORIGINAL content - ADS are OK
const ORIGINAL_ROUTES = [
  '/blog/',           // Original blog posts
  '/learn/',          // Original educational content
  '/about',           // About page
  '/contact',         // Contact page
  '/',                // Landing (mixed, but mostly navigation)
];

export const useAdSenseControl = () => {
  const location = useLocation();

  useEffect(() => {
    const isAggregatedPage = AGGREGATED_ROUTES.some(route => 
      location.pathname.startsWith(route)
    );

    // Hide AdSense on aggregated content pages
    const adElements = document.querySelectorAll('.adsbygoogle, ins.adsbygoogle');
    adElements.forEach((el) => {
      (el as HTMLElement).style.display = isAggregatedPage ? 'none' : 'block';
    });

    // Also set a flag for conditional rendering
    (window as any).__adsenseDisabled = isAggregatedPage;
  }, [location.pathname]);
};

// Hook to check if ads should be shown
export const useShouldShowAds = (): boolean => {
  const location = useLocation();
  return !AGGREGATED_ROUTES.some(route => location.pathname.startsWith(route));
};

// Component wrapper that hides children on aggregated pages
export const AdSafeZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shouldShow = useShouldShowAds();
  if (!shouldShow) return null;
  return <>{children}</>;
};

export default useAdSenseControl;

