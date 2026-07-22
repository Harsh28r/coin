import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, Search } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
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

  return (
    <div className="po-page">
      <Helmet>
        <title>Cryptocurrency Price Predictions — CoinsClarity Markets Desk</title>
        <meta
          name="description"
          content="Original multi-year crypto price outlooks from the CoinsClarity Markets Desk — scenario maps, catalysts, and risks. Not scraped wire copy."
        />
        <meta
          name="keywords"
          content="crypto price prediction, bitcoin outlook, ethereum forecast, altcoin analysis 2026 2030"
        />
        <link rel="canonical" href={`${window.location.origin}/predictions`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <CoinsNavbar />

      <main className="po-main">
        <header className="po-hub-header">
          <div className="po-hero__eyebrow">
            <Compass size={14} /> Markets Desk
          </div>
          <h1 className="po-hub-title">Price predictions</h1>
          <p className="po-hub-lead">
            Multi-year scenario maps filed by analysts — live market data, named byline, methodology on
            every page. Open a coin to read the full desk note.
          </p>

          <label className="po-search">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search filed outlooks…"
              aria-label="Search predictions"
            />
          </label>
        </header>

        {missingFeatured.length > 0 && (
          <section className="po-featured">
            <h2>Request a desk filing</h2>
            <p className="po-section-lead">
              No note on file yet — open one and the desk will generate an original outlook.
            </p>
            <div className="po-featured__grid">
              {missingFeatured.map((f) => (
                <Link key={f.id} to={`/prediction/${f.id}`} className="po-featured__chip">
                  <strong>{f.name}</strong>
                  <span>{f.symbol}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading && <p className="po-muted">Loading desk archive…</p>}

        {!loading && filtered.length === 0 && (
          <p className="po-muted">
            No outlooks filed yet. Start with{' '}
            <Link to="/prediction/bitcoin">Bitcoin</Link> or{' '}
            <Link to="/prediction/ethereum">Ethereum</Link> — first open triggers the Markets Desk.
          </p>
        )}

        <ul className="po-hub-grid">
          {filtered.map((p) => {
            const o = p.outlook;
            const id = o?.coinId || (p.slug || '').replace(/^price-outlook-/, '');
            return (
              <li key={p.id || p.slug}>
                <Link to={`/prediction/${id}`} className="po-hub-card">
                  <div className="po-hub-card__img">
                    <img
                      src={resolveImageSrc(p.imageUrl, o?.coinName || p.title, 'coin')}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleImageError(e, o?.coinName || p.title, 'coin')}
                    />
                  </div>
                  <div className="po-hub-card__body">
                    <span className="po-hub-card__meta">
                      {o?.symbol || '—'} · {o?.stance || 'outlook'} · spot {formatUsd(o?.spotAtWrite)}
                    </span>
                    <h2>{p.title}</h2>
                    <p>{(o?.stanceSummary || p.excerpt || '').slice(0, 140)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>

      <Footer />
    </div>
  );
};

export default PredictionsHub;
