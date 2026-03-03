import React from 'react';
import CoinsNavbar from '../Components/navbar'
import  FeaturedCarousel from '../Components/sideCarousal'
import ExclusiveNews from '../Components/ExclusiveNews'
import  MarketPriceAndNews from '../Components/market'
import  ExploreSection from '../Components/ExploreCards'
import  PressRelease from '../Components/preRealse'
import BlogSection from '../Components/blog'
import InDepthNews from '../Components/InDepthNews'
import  Footer from '../Components/footer'
import Chart from '../Components/Chart'
import  NewsCarousel from '../Components/carusal'
import { Helmet } from 'react-helmet-async';
import {ScrollingStats} from '../Components/scroll'
import NewsListing from '../Components/Listings';
import SubscriptionPopup from '../Components/SubscriptionPopup';
import { useSubscriptionPopup } from '../hooks/useSubscriptionPopup';
import AINews from '../Components/AINews';
import ArbitrageDashboard from './ArbitrageDashboard';
import CryptoBreakingBanner from '../Components/CryptoBreakingBanner';
// import  './LandingPage.css'

const LandingPage: React.FC = () => {
  const { showPopup, setShowPopup } = useSubscriptionPopup();
  //e

  const handleSubscribe = () => {
    // Mark user as subscribed to prevent future popupsvhg
    localStorage.setItem('user-subscribed', 'true');
  };


  return (
    <div className="LandingPage">
      <div className="content-wrapper" style={{ background: 'linear-gradient(180deg, #fff7ed 0%, #ffffff 15%, #ffffff 100%)' }}>
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
        <CoinsNavbar />
        <CryptoBreakingBanner />
        <ScrollingStats />
        <FeaturedCarousel />
        <ExclusiveNews />
        <MarketPriceAndNews />
        <AINews />
        <ExploreSection />
        <PressRelease />
        <InDepthNews />
        <NewsListing />
        <ArbitrageDashboard />
        <BlogSection />
       
        <Footer />
      </div>

      {/* Subscription Popup */}
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
