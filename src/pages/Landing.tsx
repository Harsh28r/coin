import React from 'react';
import CoinsNavbar from '../Components/navbar'
import FeaturedCarousel from '../Components/sideCarousal'
import ExclusiveNews from '../Components/ExclusiveNews'
import MarketPriceAndNews from '../Components/market'
import TrendingCoins from '../Components/TrendingCoins'
import CryptoConverter from '../Components/CryptoConverter'
import MarketStats from '../Components/MarketStats'
import PressRelease from '../Components/preRealse'
import BlogSection from '../Components/blog'
import InDepthNews from '../Components/InDepthNews'
import Footer from '../Components/footer'
import { Helmet } from 'react-helmet-async';
import { ScrollingStats } from '../Components/scroll'
import NewsListing from '../Components/Listings';
import SubscriptionPopup from '../Components/SubscriptionPopup';
import { useSubscriptionPopup } from '../hooks/useSubscriptionPopup';
import AINews from '../Components/AINews';
import ArbitrageDashboard from './ArbitrageDashboard';
import CryptoBreakingBanner from '../Components/CryptoBreakingBanner';
import NewsletterCTA from '../Components/NewsletterCTA';

/* AdSense-compliant placeholder - clearly marked as ad space, not fake content */
const AdSpot: React.FC<{ variant?: 'leaderboard' | 'rectangle' | 'native'; label?: string; className?: string }> = ({ variant = 'leaderboard', label, className = '' }) => {
  if (variant === 'leaderboard') {
    return (
      <div 
        className={`cc-ad-spot ${variant} ${className}`} 
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '24px',
          minHeight: '90px',
          margin: '1.5rem 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        {/* AdSense-ready container - replace with actual AdSense code when approved */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '8px',
          color: '#64748b'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: '#94a3b8'
          }}>
            Advertisement
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#cbd5e1',
            textAlign: 'center'
          }}>
            Ad space available
          </div>
        </div>
        
        {/* Optional: Add real AdSense here when approved */}
        {/* 
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-8105894285796694"
          data-ad-slot="YOUR_AD_SLOT_ID"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
        */}
      </div>
    );
  }
  
  return (
    <div className={`cc-ad-spot ${variant} ${className}`} data-ad-slot={variant}>
      {label || `Ad · ${variant}`}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { showPopup, setShowPopup } = useSubscriptionPopup();

  const handleSubscribe = () => {
    localStorage.setItem('user-subscribed', 'true');
  };

  return (
    <div className="LandingPage">
      <div className="content-wrapper" style={{ background: 'var(--bg)' }}>
        <Helmet>
          <title>CoinsClarity - Crypto News, Listings, Markets</title>
          <meta name="description" content="Real-time crypto news with full articles, new listings, and market insights. Read everything on-platform in your language." />
          <meta name="keywords" content="crypto news, bitcoin news, ethereum news, coin listings, market analysis, arbitrage, ai crypto news" />
          <link rel="canonical" href={`${window.location.origin}/`} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="CoinsClarity — Crypto News, Listings, Markets" />
          <meta property="og:description" content="Real-time crypto news with full articles, new listings, and market insights." />
          <meta property="og:url" content={`${window.location.origin}/`} />
          <meta property="og:image" content={`${window.location.origin}/logo3.png`} />
          <meta property="og:site_name" content="CoinsClarity" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="CoinsClarity — Crypto News, Listings, Markets" />
          <meta name="twitter:description" content="Real-time crypto news with full articles, new listings, and market insights." />
          <meta name="twitter:image" content={`${window.location.origin}/logo3.png`} />
        </Helmet>

        {/* Sticky nav */}
        <CoinsNavbar />

        {/* Breaking banner + price ticker */}
        <CryptoBreakingBanner />
        <ScrollingStats />

        {/* Hero carousel section */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <FeaturedCarousel />
        </div>

        {/* Advertisement Space */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <AdSpot variant="leaderboard" />
        </div>

        {/* Exclusive News */}
        <ExclusiveNews />

        {/* Market prices + charts */}
        <MarketPriceAndNews />

        {/* Market Stats Overview */}
        <MarketStats />

        {/* Advertisement Space */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <AdSpot variant="leaderboard" />
        </div>

        {/* Crypto Converter Tool */}
        <CryptoConverter />

        {/* AI News */}
        <AINews />

        {/* Trending Coins */}
        <TrendingCoins />

        {/* Press Releases */}
        <PressRelease />

        {/* Advertisement Space */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <AdSpot variant="leaderboard" />
        </div>

        {/* In-depth News */}
        <InDepthNews />

        {/* Listings */}
        <NewsListing />

        {/* Arbitrage scanner */}
        <ArbitrageDashboard />

        {/* Blog */}
        <BlogSection />

        {/* Newsletter CTA */}
        <NewsletterCTA />

        {/* Footer */}
        <Footer />
      </div>

      {showPopup && (
        <SubscriptionPopup
          onClose={() => setShowPopup(false)}
          onSubscribe={handleSubscribe}
        />
      )}
    </div>
  );
};

export default LandingPage;
