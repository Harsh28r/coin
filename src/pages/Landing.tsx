import React from 'react';
import { Newspaper } from 'lucide-react';
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
import DailyNewsSection from '../Components/DailyNewsSection';
import AirdropSection from '../Components/AirdropSection';

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

        {/* New Airdrops (RSS: Airdrop Alert) */}
        <AirdropSection />

        {/* Newsletter CTA */}
        <NewsletterCTA />

        {/* Daily — 4 news teasers */}
        {/* <DailyNewsSection /> */}

        {/* Our platforms — Daily (India news) */}
        <div
          className="daily-cta-strip"
          style={{
            margin: '0 auto',
            maxWidth: 1280,
            padding: '32px 20px',
            background: '#0f172a',
            borderTop: '1px solid rgba(249, 115, 22, 0.4)',
            borderBottom: '1px solid rgba(249, 115, 22, 0.4)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              marginBottom: 12,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#ffffff',
              background: 'rgba(249, 115, 22, 0.3)',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            ✦ Same team, different beat
          </span>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              India + World. One feed. Every day.
            </span>
          </div>
          <p style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: 18, marginTop: 0 }}>
            Headlines, current affairs & analysis — no fluff.
          </p>
          <a
            href="https://daily.coinsclarity.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: '#f97316',
              border: 'none',
              borderRadius: 10,
              textDecoration: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(249, 115, 22, 0.4)';
            }}
          >
            <Newspaper size={20} style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Open Daily</span>
          </a>
        </div>

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
