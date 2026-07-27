import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import InternalLinksBlock from '../Components/InternalLinksBlock';
import { getCoinById } from '../utils/coinRegistry';
import { coinNewsMeta } from '../utils/seoMetadata';
import { breadcrumbList, collectionPage, faqPage, SITE_URL } from '../utils/jsonLd';
import { buildInternalLinks } from '../utils/internalLinks';
import { fetchCoinMarket, fetchCoinNews, type NewsSnippet } from '../services/seoContentApi';
import './SeoProgrammatic.css';

const formatUsd = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
};

const CoinNewsHub: React.FC = () => {
  const { coinId = '' } = useParams<{ coinId: string }>();
  const coin = getCoinById(coinId);
  const [news, setNews] = useState<NewsSnippet[]>([]);
  const [market, setMarket] = useState<Awaited<ReturnType<typeof fetchCoinMarket>>>(null);
  const [loading, setLoading] = useState(true);

  const meta = useMemo(() => (coin ? coinNewsMeta(coin) : null), [coin]);

  const internalLinks = useMemo(
    () =>
      coin
        ? buildInternalLinks({
            text: `${coin.name} ${coin.symbol}`,
            coinIds: [coin.id],
            limit: 12,
          })
        : [],
    [coin],
  );

  const load = async () => {
    if (!coin) return;
    setLoading(true);
    try {
      const [items, mkt] = await Promise.all([fetchCoinNews(coin.id, 14), fetchCoinMarket(coin.id)]);
      setNews(items);
      setMarket(mkt);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [coinId]);

  if (!coin) {
    return (
      <div className="seo-page">
        <CoinsNavbar />
        <main className="seo-main seo-error">
          <p>Coin not found.</p>
          <Link to="/" className="seo-back">
            <ArrowLeft size={16} /> Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const faq = [
    {
      question: `What is the latest ${coin.name} news today?`,
      answer: news[0]
        ? `Top headline: ${news[0].title}. CoinsClarity refreshes ${coin.symbol} news hourly from major crypto publishers.`
        : `Check back shortly — ${coin.name} headlines update throughout the day.`,
    },
    {
      question: `How does news affect ${coin.symbol} price?`,
      answer: `ETF approvals, exchange listings, hacks, and macro events often move ${coin.name} faster than technical levels. Use this hub with the live chart and daily digest.`,
    },
  ];

  return (
    <div className="seo-page">
      {meta && <SeoHead meta={meta} />}
      <JsonLd
        data={[
          collectionPage({
            name: `${coin.name} News Today`,
            description: meta?.description || '',
            url: `${SITE_URL}/coin/${coin.id}/news`,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: coin.name, url: `${SITE_URL}/coin/${coin.id}` },
            { name: 'News', url: `${SITE_URL}/coin/${coin.id}/news` },
          ]),
          faqPage(faq),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <div className="seo-top">
          <Link to={`/coin/${coin.id}`} className="seo-back">
            <ArrowLeft size={16} /> {coin.name} chart
          </Link>
          <button type="button" className="seo-back" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <header>
          <div className="seo-hero__eyebrow">{coin.symbol} · Live news hub</div>
          <h1 className="seo-hero__title">
            {coin.name} News Today — Latest Headlines & Price Impact
          </h1>
          <p className="seo-hero__standfirst">
            Breaking {coin.name} stories, listing updates, and catalysts that move {coin.symbol}.
            Indexed for search — updated throughout the day.
          </p>
        </header>

        <div className="seo-stats">
          <div className="seo-stat">
            <span className="seo-stat__label">Price</span>
            <span className="seo-stat__value">{formatUsd(market?.price)}</span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">24h</span>
            <span
              className={`seo-stat__value ${(market?.change24h || 0) >= 0 ? 'is-up' : 'is-down'}`}
            >
              {market?.change24h != null ? `${market.change24h >= 0 ? '+' : ''}${market.change24h.toFixed(2)}%` : '—'}
            </span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">Market cap</span>
            <span className="seo-stat__value">{formatUsd(market?.marketCap)}</span>
          </div>
        </div>

        <section className="seo-section">
          <h2>Latest {coin.name} headlines</h2>
          {loading && <p className="seo-loading">Loading headlines…</p>}
          {!loading && news.length === 0 && (
            <p className="seo-loading">No matching headlines right now. Try the daily digest or trending desk.</p>
          )}
          <ul className="seo-news-list">
            {news.map((item) => (
              <li key={item.id} className="seo-news-item">
                <a href={item.link || '#'} target="_blank" rel="noopener noreferrer">
                  {item.title} <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
                </a>
                {item.description && <p>{item.description}</p>}
                <time dateTime={item.pubDate}>
                  {new Date(item.pubDate).toLocaleString()} {item.source ? `· ${item.source}` : ''}
                </time>
              </li>
            ))}
          </ul>
        </section>

        <InternalLinksBlock links={internalLinks} />
      </main>
      <Footer />
    </div>
  );
};

export default CoinNewsHub;
