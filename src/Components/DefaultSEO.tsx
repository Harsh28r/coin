import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const DefaultSEO: React.FC = () => {
  const location = useLocation();
  const url = typeof window !== 'undefined' ? `${window.location.origin}${location.pathname}${location.search}` : 'https://www.coinsclarity.com';

  const { title, description } = useMemo(() => {
    const map: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Crypto News, Prices & Market Insights | CoinsClarity',
        description:
          'Stay updated with real-time crypto prices, market trends, and curated news. Explore in-depth analysis and learn about cryptocurrencies on CoinsClarity.',
      },
      '/listings': {
        title: 'Latest Crypto Exchange Listings & New Token Pairs | CoinsClarity',
        description:
          'Discover the newest crypto exchange listings and market pairs. Track listings as they go live and never miss a new token opportunity.',
      },
      '/All-Trending-news': {
        title: 'Top Trending Crypto News Stories Today | CoinsClarity',
        description:
          'See today\'s top trending crypto stories across major sources. Fast updates with summarized insights and full content on-platform.',
      },
      '/exclusive-news': {
        title: 'Exclusive Crypto News Stories & In-Depth Features | CoinsClarity',
        description:
          'Exclusive crypto stories and curated insights. Dive deeper into what matters with full articles, analysis and highlights.',
      },
      '/press-news': {
        title: 'Crypto Press Releases & Official Announcements | CoinsClarity',
        description:
          'Official crypto press releases and announcements curated from top sources. Stay informed on launches, partnerships and updates.',
      },
      '/learn': {
        title: 'Learn Cryptocurrency: Complete Guides & How-To Tutorials | CoinsClarity',
        description:
          'Beginner to advanced crypto guides, tips and how-tos. Learn key concepts, trading basics and blockchain fundamentals.',
      },
      '/events': {
        title: 'Upcoming Crypto Events, Conferences & Important Dates | CoinsClarity',
        description:
          'Track upcoming crypto events, conferences, and important dates in the digital asset space.',
      },
    };
    return (
      map[location.pathname] || {
        title: 'CoinsClarity | Real-Time Crypto News, Prices & Market Insights',
        description:
          'Real-time crypto news, market prices and insights. Track coins, NFTs, listings, and read full articles on CoinsClarity.',
      }
    );
  }, [location.pathname]);

  const GA_ID = process.env.REACT_APP_GA_ID;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content="/image.png" />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Optional Google Analytics via env var */}
      {GA_ID && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </script>
        </>
      )}
    </Helmet>
  );
};

export default DefaultSEO;


