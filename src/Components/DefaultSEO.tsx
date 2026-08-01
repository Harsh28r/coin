import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import JsonLd from './JsonLd';
import { getJsonLdForRoute } from '../utils/routeJsonLd';
import { SITE_URL } from '../utils/jsonLd';

const DefaultSEO: React.FC = () => {
  const location = useLocation();
  // Always emit production www canonicals — never preview/localhost/apex variants.
  const url = `${SITE_URL}${location.pathname}${location.search}`;

  const { title, description } = useMemo(() => {
    const map: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Crypto News, Prices & Market Insights | CoinsClarity',
        description:
          'Stay updated with real-time crypto news, crypto market trends, and curated cryptocurrency insights. Explore in-depth crypto analysis and learn about cryptocurrencies on CoinsClarity.',
      },
      '/listings': {
        title: 'Latest Crypto Exchange Listings & New Token Pairs | CoinsClarity',
        description:
          'Discover the newest crypto exchange listings and market pairs. Track crypto listings as they go live and never miss a new token opportunity.',
      },
      '/All-Trending-news': {
        title: 'Top Trending Crypto News Stories Today | CoinsClarity',
        description:
          'See today\'s top trending crypto news stories across major sources. Fast crypto updates with summarized insights and full content on-platform.',
      },
      '/exclusive-news': {
        title: 'Exclusive Crypto News Stories & In-Depth Features | CoinsClarity',
        description:
          'Exclusive crypto news stories and curated insights. Dive deeper into what matters with full crypto articles, analysis and highlights.',
      },
      '/press-news': {
        title: 'Crypto Press Releases & Official Announcements | CoinsClarity',
        description:
          'Official crypto press releases and announcements curated from top sources. Stay informed on crypto launches, partnerships and updates.',
      },
      '/learn': {
        title: 'Learn Cryptocurrency: Complete Guides & How-To Tutorials | CoinsClarity',
        description:
          'Beginner to advanced crypto guides, tips and how-tos. Learn key crypto concepts, trading basics and blockchain fundamentals.',
      },
      '/events': {
        title: 'Upcoming Crypto Events, Conferences & Important Dates | CoinsClarity',
        description:
          'Track upcoming crypto events, conferences, and important dates in the digital asset space.',
      },
      '/tools': {
        title: 'Free Crypto Trading Tools & Calculators | CoinsClarity',
        description:
          'Professional crypto trading tools: profit calculator, DCA calculator, RSI scanner, funding rates, arbitrage checker, liquidation calculator, staking APY comparison. 100% free.',
      },
      '/tools/scam-check': {
        title: 'Free Crypto Token Scam & Honeypot Checker | CoinsClarity',
        description:
          'Free honeypot checker and token scam audit. Paste any contract to detect rugs, honeypots, hidden owners, mint backdoors and blacklist risks across Ethereum, BNB, Polygon and more.',
      },
      '/arbitrage': {
        title: 'Triangular Arbitrage Calculator | Free Crypto Tool | CoinsClarity',
        description:
          'Free triangular arbitrage calculator. Find profit opportunities across BTC, ETH, USDT and 15+ crypto pairs with real-time prices.',
      },
      '/blog': {
        title: 'Crypto Blog: Expert Analysis & Insights | CoinsClarity',
        description:
          'Original crypto analysis, market insights, and expert commentary from CoinsClarity. In-depth articles on Bitcoin, Ethereum, DeFi and more.',
      },
      '/ai-news': {
        title: 'AI & Machine Learning News in Crypto | CoinsClarity',
        description:
          'Latest AI and machine learning developments in cryptocurrency. Track AI crypto projects, research, and innovations.',
      },
      '/predictions': {
        title: 'Crypto Price Outlooks & Market Predictions | CoinsClarity',
        description:
          'Desk-written price outlooks for Bitcoin, Ethereum, Solana and top altcoins. Catalysts, levels, and risk — not wire copy.',
      },
      '/live': {
        title: 'Live Crypto News Desk | CoinsClarity',
        description:
          'Breaking crypto stories with live updates, timestamps, and market context from the CoinsClarity news desk.',
      },
      '/daily-digest': {
        title: 'Daily Crypto Digest — Curated Headlines | CoinsClarity',
        description:
          'One daily read: top crypto stories, market moves, and what matters for traders. Original CoinsClarity editorial.',
      },
      '/trending-desk': {
        title: 'Trending Crypto Desk — Stories Moving Markets | CoinsClarity',
        description:
          'AI-curated trending crypto stories with desk analysis. Updated throughout the day.',
      },
      '/market-movers': {
        title: 'Crypto Market Movers This Week | CoinsClarity',
        description:
          'Weekly crypto market movers: top gainers, losers, ETF catalysts, and desk analysis.',
      },
    };
    return (
      map[location.pathname] || {
        title: 'CoinsClarity | Real-Time Crypto News, Prices & Market Insights',
        description:
          'Real-time crypto news, crypto market prices and insights. Track coins, NFTs, listings, and read full crypto articles on CoinsClarity.',
      }
    );
  }, [location.pathname]);

  const GA_ID = process.env.REACT_APP_GA_ID;
  const jsonLd = useMemo(() => getJsonLdForRoute(location.pathname), [location.pathname]);

  return (
    <>
    {jsonLd.length > 0 && <JsonLd data={jsonLd} />}
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
      <meta property="og:image" content={`${SITE_URL}/logo3.png`} />
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
    </>
  );
};

export default DefaultSEO;


