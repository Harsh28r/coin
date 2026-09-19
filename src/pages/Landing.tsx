import React from 'react';
import { Newspaper } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CoinsNavbar from '../Components/navbar';
import BrandHero from '../Components/BrandHero';
import UsdtInrPremium from '../Components/UsdtInrPremium';
import LandingBrandTools from '../Components/LandingBrandTools';
import LandingSeoHub from '../Components/LandingSeoHub';
import ExclusiveNews from '../Components/ExclusiveNews';
import MarketPriceAndNews from '../Components/market';
import InDepthNews from '../Components/InDepthNews';
import BlogSection from '../Components/blog';
import NewsletterCTA from '../Components/NewsletterCTA';
import Footer from '../Components/footer';
import AdSenseSlot from '../Components/AdSenseSlot';
import { SITE_URL } from '../utils/jsonLd';

/**
 * Brand-first landing — India desk wedge.
 * Above fold: brand hero → USDT/INR premium → 3 tools → SEO hubs.
 * News / markets sit below so `/` reads as a product, not a dump.
 */
const LandingPage: React.FC = () => {
  return (
    <div className="LandingPage">
      <div className="content-wrapper" style={{ background: 'var(--bg)' }}>
        <Helmet>
          <title>CoinsClarity — INR Rates, Scam Checks & Clear Markets</title>
          <meta
            name="description"
            content="Live USDT/INR P2P rates, token scam checks, and gas trackers for Indian crypto traders. Clear markets — CoinsClarity."
          />
          <meta
            name="keywords"
            content="USDT INR, crypto India, P2P rate, scam check, ethereum gas, bitcoin price India"
          />
          <link rel="canonical" href={`${SITE_URL}/`} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="CoinsClarity — INR Rates, Scam Checks & Clear Markets" />
          <meta
            property="og:description"
            content="Live USDT/INR premium, P2P board, and security tools for Indian traders."
          />
          <meta property="og:url" content={`${SITE_URL}/`} />
          <meta property="og:image" content={`${SITE_URL}/image.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="628" />
          <meta property="og:site_name" content="CoinsClarity" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="CoinsClarity — INR Rates, Scam Checks & Clear Markets" />
          <meta
            name="twitter:description"
            content="Live USDT/INR premium, P2P board, and security tools for Indian traders."
          />
          <meta name="twitter:image" content={`${SITE_URL}/image.png`} />
        </Helmet>

        <CoinsNavbar />

        {/* —— First composition —— */}
        <BrandHero />
        <UsdtInrPremium />
        <LandingBrandTools />
        <LandingSeoHub />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <AdSenseSlot placement="landing-a" size="leaderboard" lazy />
        </div>

        {/* —— Below fold: markets & desk —— */}
        <ExclusiveNews />
        <MarketPriceAndNews />
        <InDepthNews />
        <BlogSection />
        <NewsletterCTA />

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
            Same team, different beat
          </span>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              India news on Daily
            </span>
          </div>
          <p style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: 18, marginTop: 0 }}>
            Current affairs & analysis — separate from the markets desk.
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
            }}
          >
            <Newspaper size={20} />
            Open Daily
          </a>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
