import { useState, useEffect, useCallback } from 'react';

interface UseSubscriptionPopupOptions {
  delay?: number; // Delay in milliseconds before showing popup
  scrollTrigger?: boolean; // Show popup when user scrolls to bottom of page
}

interface UseSubscriptionPopupReturn {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  triggerPopup: () => void;
}

export const useSubscriptionPopup = (options: UseSubscriptionPopupOptions = {}): UseSubscriptionPopupReturn => {
  const { delay = 20000, scrollTrigger = true } = options; // 60 seconds default
  const [showPopup, setShowPopup] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const triggerPopup = useCallback(() => {
    if (!hasTriggered) {
      setShowPopup(true);
      setHasTriggered(true);
      localStorage.setItem('subscription-popup-last-shown', new Date().toDateString());
    }
  }, [hasTriggered]);

  useEffect(() => {
    console.log('Subscription popup hook initialized');
    
    // Check if user has already seen the popup today
    const lastShown = localStorage.getItem('subscription-popup-last-shown');
    const today = new Date().toDateString();
    
    // Check if user has already subscribed
    const hasSubscribed = localStorage.getItem('user-subscribed') === 'true';
    
    console.log('Popup check:', { lastShown, today, hasSubscribed, delay });
    
    // Don't show if already subscribed
    if (hasSubscribed) {
      console.log('User already subscribed, not showing popup');
      return;
    }

    // Don't show if already shown today
    if (lastShown === today) {
      console.log('Popup already shown today, not showing again');
      return;
    }

    console.log('Setting up popup triggers...');

    // Time-based trigger - show after specified delay
    const timeTimer = setTimeout(() => {
      console.log('Time trigger activated - showing popup');
      triggerPopup();
    }, delay);

    // Scroll-based trigger - show when user scrolls to bottom of page
    let scrollHandler: (() => void) | null = null;
    if (scrollTrigger) {
      scrollHandler = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        console.log('Scroll percent:', scrollPercent);
        if (scrollPercent >= 95) {
          console.log('Scroll trigger activated - showing popup');
          triggerPopup();
        }
      };
      window.addEventListener('scroll', scrollHandler);
    }

    return () => {
      console.log('Cleaning up popup triggers');
      clearTimeout(timeTimer);
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
      }
    };
  }, [delay, scrollTrigger, triggerPopup]);

  return {
    showPopup,
    setShowPopup,
    triggerPopup
  };
};
