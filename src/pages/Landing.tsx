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
// import  './LandingPage.css'

const LandingPage: React.FC = () => {
  return (
    <div className="LandingPage">
      <div className="content-wrapper">
        <Helmet>
          <title> Coinsclarity— Crypto News, Listings, Markets</title>
          <meta name="description" content="Real-time crypto news with full articles, new listings, and market insights. Read everything on-platform in your language." />
          <link rel="canonical" href={`${window.location.origin}/`} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="CoinsCapture — Crypto News, Listings, Markets" />
          <meta property="og:description" content="Real-time crypto news with full articles, new listings, and market insights." />
          <meta property="og:url" content={`${window.location.origin}/`} />
          <meta property="og:image" content={`${window.location.origin}/logo3.png`} />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        <CoinsNavbar />
        <ScrollingStats />
        <FeaturedCarousel />
        <ExclusiveNews />
        <MarketPriceAndNews />
        <ExploreSection />
        <PressRelease />
        <InDepthNews />
        <NewsListing />
        <BlogSection />
       
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
