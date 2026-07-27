import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronDown } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import InternalLinksBlock from '../Components/InternalLinksBlock';
import DeskAuthorCard from '../Components/DeskAuthorCard';
import { getAuthorBySlug } from '../config/authors';
import { getCoinById } from '../utils/coinRegistry';
import { whyCoinMeta } from '../utils/seoMetadata';
import { breadcrumbList, faqPage, newsArticle, SITE_URL } from '../utils/jsonLd';
import { buildInternalLinks } from '../utils/internalLinks';
import {
  buildWhyAnswer,
  fetchCoinMarket,
  fetchCoinNews,
  type NewsSnippet,
} from '../services/seoContentApi';
import './SeoProgrammatic.css';

const MARKETS_DESK = getAuthorBySlug('elena-vasquez')!;

const formatUsd = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
};

const WhyCoinToday: React.FC = () => {
  const { coinId = '' } = useParams<{ coinId: string }>();
  const location = useLocation();
  const dir: 'up' | 'down' = location.pathname.endsWith('-down') ? 'down' : 'up';
  const coin = getCoinById(coinId);
  const [news, setNews] = useState<NewsSnippet[]>([]);
  const [market, setMarket] = useState<Awaited<ReturnType<typeof fetchCoinMarket>>>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  const meta = useMemo(() => (coin ? whyCoinMeta(coin, dir) : null), [coin, dir]);
  const answer = useMemo(
    () => (coin ? buildWhyAnswer(coin, dir, market, news) : ''),
    [coin, dir, market, news],
  );

  const internalLinks = useMemo(
    () =>
      coin
        ? buildInternalLinks({ text: answer, coinIds: [coin.id], limit: 12 })
        : [],
    [coin, answer],
  );

  const load = async () => {
    if (!coin) return;
    setLoading(true);
    try {
      const [items, mkt] = await Promise.all([fetchCoinNews(coin.id, 8), fetchCoinMarket(coin.id)]);
      setNews(items);
      setMarket(mkt);
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [coinId, dir]);

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

  const path = `/today/why-is-${coin.id}-${dir}`;
  const verb = dir === 'up' ? 'Up' : 'Down';
  const updatedIso = updatedAt.toISOString();
  const updatedLabel = `Updated ${updatedAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const faq = [
    {
      question: `Why is ${coin.name} ${dir} today?`,
      answer: answer || `${coin.name} price moved ${dir} over the last 24 hours. Check live catalysts below.`,
    },
    {
      question: `What is ${coin.symbol} price right now?`,
      answer: market?.price
        ? `${coin.name} trades near ${formatUsd(market.price)} with a 24h change of ${market.change24h?.toFixed(2) ?? '—'}%.`
        : `See the live ${coin.name} chart for current price.`,
    },
    {
      question: `Is ${coin.symbol} a good buy after this move?`,
      answer: `CoinsClarity does not give financial advice. Use the ${coin.symbol} chart, today's headlines, and your own risk rules before trading.`,
    },
    {
      question: `Where can I follow more ${coin.name} news?`,
      answer: `Open the ${coin.name} news hub and live chart on CoinsClarity for ongoing catalysts and price context.`,
    },
  ];

  return (
    <div className="seo-page">
      {meta && <SeoHead meta={meta} />}
      <JsonLd
        data={[
          newsArticle({
            headline: `Why Is ${coin.name} ${verb} Today?`,
            description: answer,
            url: `${SITE_URL}${path}`,
            datePublished: updatedIso,
            dateModified: updatedIso,
            author: MARKETS_DESK.name,
            section: 'Market Movers',
            keywords: `${coin.name}, ${coin.symbol}, why ${dir}, crypto price`,
            articleBody: answer,
            wordCount: answer.split(/\s+/).filter(Boolean).length,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Today', url: `${SITE_URL}/trending-desk` },
            { name: `Why ${coin.symbol} ${dir}`, url: `${SITE_URL}${path}` },
          ]),
          faqPage(faq),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <div className="seo-top">
          <Link to={`/coin/${coin.id}`} className="seo-coin-link">
            <ArrowLeft size={16} /> {coin.name} live chart
          </Link>
          <button type="button" className="seo-back" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <header>
          <div className="seo-hero__eyebrow">Market movers · {coin.symbol}</div>
          <h1 className="seo-hero__title">Why Is {coin.name} {verb} Today?</h1>
          <p className="seo-hero__standfirst">
            Quick answer for traders searching why {coin.symbol} is {dir === 'up' ? 'pumping' : 'dumping'} —
            price data plus today's catalyst headlines.
          </p>
        </header>

        <DeskAuthorCard author={MARKETS_DESK} updatedLabel={updatedLabel} compact />

        <div className="seo-answer">
          <span className="seo-answer__label">Quick answer</span>
          <p>{loading ? 'Pulling live data…' : answer}</p>
        </div>

        <div className="seo-stats">
          <div className="seo-stat">
            <span className="seo-stat__label">{coin.symbol} price</span>
            <span className="seo-stat__value">{formatUsd(market?.price)}</span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">24h change</span>
            <span
              className={`seo-stat__value ${(market?.change24h || 0) >= 0 ? 'is-up' : 'is-down'}`}
            >
              {market?.change24h != null ? `${market.change24h >= 0 ? '+' : ''}${market.change24h.toFixed(2)}%` : '—'}
            </span>
          </div>
        </div>

        {news.length > 0 && (
          <section className="seo-section">
            <h2>Headlines moving {coin.symbol}</h2>
            <ul className="seo-news-list">
              {news.slice(0, 6).map((item) => (
                <li key={item.id} className="seo-news-item">
                  <a href={item.link || '#'} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                  {item.description && <p>{item.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="seo-section seo-faq" aria-label="Frequently asked questions">
          <h2>FAQ</h2>
          <div className="seo-faq__list">
            {faq.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.question} className={`seo-faq__item${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="seo-faq__q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    {item.question}
                    <ChevronDown size={18} />
                  </button>
                  {open ? <p className="seo-faq__a">{item.answer}</p> : null}
                </div>
              );
            })}
          </div>
        </section>

        <DeskAuthorCard author={MARKETS_DESK} updatedLabel={updatedLabel} />

        <InternalLinksBlock links={internalLinks} />
      </main>
      <Footer />
    </div>
  );
};

export default WhyCoinToday;
