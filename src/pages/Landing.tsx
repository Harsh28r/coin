import React from 'react';
import CoinsNavbar from '../Components/navbar'
import  FeaturedCarousel from '../Components/sideCarousal'
import ExclusiveNews from '../Components/ExclusiveNews'
import  MarketPriceAndNews from '../Components/market'
import  ExploreSection from '../Components/ExploreCards'
import  PressRelease from '../Components/preRealse'
import BlogSection from '../Components/blog'
import  Footer from '../Components/footer'
import Chart from '../Components/Chart'
import { TopNav } from '../Components/belowNav'
import  NewsCarousel from '../Components/carusal'
import {ScrollingStats} from '../Components/scroll'
// import  './LandingPage.css'

const LandingPage: React.FC = () => {
  return (
    <div className="LandingPage">
      <div className="content-wrapper">
        <CoinsNavbar />
        <ScrollingStats />
        <FeaturedCarousel />
        <ExclusiveNews />
        <MarketPriceAndNews />
        <ExploreSection />
        <PressRelease />
        <BlogSection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
