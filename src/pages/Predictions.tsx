import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, Search } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import JsonLd from '../Components/JsonLd';
import { breadcrumbList, collectionPage, faqPage, SITE_URL } from '../utils/jsonLd';
import { listPriceOutlooks, type PriceOutlookPost } from '../services/priceOutlookApi';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import './PredictionPages.css';

const formatUsd = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
};

const FEATURED = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
];

const HUB_FAQ = [
  {
    question: 'What is a crypto price prediction on CoinsClarity?',
    answer:
      'A Markets Desk outlook with bear, base and bull USD ranges, catalysts, and what would invalidate the base case. Not a price target and not financial advice.',
  },
  {
    question: 'Do you publish a Bitcoin price prediction for 2026?',
    answer:
      'Yes. Open the Bitcoin page for the current 2026–2030 scenario map, spot at filing, and the full desk note.',
  },
  {
    question: 'How is this different from a generic crypto outlook?',
    answer:
      'Each coin has its own URL, named analyst, live market snapshot, and methodology. We do not scrape wire “price prediction 2030” listicles.',
  },
  {
    question: 'How often are predictions updated?',
    answer:
      'The desk refreshes top coins weekly. Stale notes show a refresh control on the coin page.',
  },
];

const PredictionsHub: React.FC = () => {
  const [posts, setPosts] = useState<PriceOutlookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await listPriceOutlooks(60);
        if (!cancelled) setPosts(list);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) => {
      const o = p.outlook;
      const blob = `${p.title} ${o?.coinName || ''} ${o?.symbol || ''} ${o?.coinId || ''}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [posts, q]);

  const missingFeatured = FEATURED.filter(
    (f) => !posts.some((p) => p.outlook?.coinId === f.id || p.slug === `price-outlook-${f.id}`),
  );

  const seoTitle = 'Crypto Price Predictions 2026 — Bitcoin, Ethereum & Altcoins';
  const seoDesc =
    'Bitcoin, Ethereum, Solana and altcoin price predictions with desk scenario ranges, catalysts and risks. Updated 2026–2030 outlooks.';

  return (
    <div className="po-page">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <meta
          name="keywords"
          content="crypto price predictions, bitcoin price prediction, bitcoin outlook, ethereum price prediction, cryptocurrency predictions, crypto outlook"
        />
        <link rel="canonical" href={`${SITE_URL}/predictions`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={`${SITE_URL}/predictions`} />
      </Helmet>
      <JsonLd
        data={[
          collectionPage({
            name: seoTitle,
            description: seoDesc,
            url: `${SITE_URL}/predictions`,
          }),
          faqPage(HUB_FAQ),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Price Predictions', url: `${SITE_URL}/predictions` },
          ]),
        ]}
      />

      <CoinsNavbar />

      <main className="po-main">
        <header className="po-hub-header">
          <div className="po-hero__eyebrow">
            <Compass size={14} /> Markets Desk
          </div>
          <h1 className="po-hub-title">Crypto Price Predictions</h1>
          <p className="po-hub-lead">
            Bitcoin, Ethereum and altcoin price predictions with bear / base / bull ranges. Desk-written. Not a
            target. Not advice.
          </p>

          <label className="po-search">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Bitcoin, ETH, SOL…"
              aria-label="Search price predictions"
            />
          </label>
        </header>

        {missingFeatured.length > 0 && (
          <section className="po-featured">
            <h2>Open a price prediction</h2>
            <p className="po-section-lead">
              No note on file yet — first open files the desk outlook.
            </p>
            <div className="po-featured__grid">
              {missingFeatured.map((f) => (
                <Link key={f.id} to={`/prediction/${f.id}`} className="po-featured__chip">
                  <strong>{f.name} price prediction</strong>
                  <span>{f.symbol}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading && <p className="po-muted">Loading predictions…</p>}

        {!loading && filtered.length === 0 && (
          <p className="po-muted">
            No outlooks filed yet. Start with{' '}
            <Link to="/prediction/bitcoin">Bitcoin price prediction</Link> or{' '}
            <Link to="/prediction/ethereum">Ethereum price prediction</Link>.
          </p>
        )}

        <ul className="po-hub-grid">
          {filtered.map((p) => {
            const o = p.outlook;
            const id = o?.coinId || (p.slug || '').replace(/^price-outlook-/, '');
            const name = o?.coinName || id;
            return (
              <li key={p.id || p.slug}>
                <Link to={`/prediction/${id}`} className="po-hub-card">
                  <div className="po-hub-card__img">
                    <img
                      src={resolveImageSrc(p.imageUrl, name, 'coin')}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleImageError(e, name, 'coin')}
                    />
                  </div>
                  <div className="po-hub-card__body">
                    <span className="po-hub-card__meta">
                      {o?.symbol || '—'} · {o?.stance || 'outlook'} · spot {formatUsd(o?.spotAtWrite)}
                    </span>
                    <h2>{name} price prediction</h2>
                    <p>{(o?.stanceSummary || p.excerpt || p.title || '').slice(0, 140)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <section className="po-faq" aria-labelledby="po-hub-faq">
          <h2 id="po-hub-faq">Price prediction FAQ</h2>
          {HUB_FAQ.map((f) => (
            <div key={f.question}>
              <h3>{f.question}</h3>
              <p>{f.answer}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PredictionsHub;
