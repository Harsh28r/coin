import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { fetchPosts } from '../services/api';
import type { BlogPost } from '../types/blog';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import { getBlogUrl } from '../utils/blogUrl';
import './DailyDigest.css';

const FILTERS = [
  { id: 'all', label: 'All desks', tag: null as string | null },
  { id: 'markets', label: 'Markets', tag: 'agent-markets' },
  { id: 'geopolitics', label: 'Geopolitics', tag: 'agent-geopolitics' },
  { id: 'india', label: 'India Policy', tag: 'agent-india' },
  { id: 'onchain', label: 'On-chain', tag: 'agent-onchain' },
] as const;

const stripTags = (html?: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const AiAgentsArchive: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await fetchPosts({ tag: 'ai-agent', limit: 100 });
        if (!cancelled) setPosts(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Could not load agent posts.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    let list = [...posts];
    if (f?.tag) list = list.filter((p) => (p.tags || []).includes(f.tag!));
    return list.sort((a, b) => {
      const ta = new Date((a as any).date || 0).getTime();
      const tb = new Date((b as any).date || 0).getTime();
      return tb - ta;
    });
  }, [posts, filter]);

  return (
    <div className="dd-page">
      <Helmet>
        <title>AI Agents newsroom — CoinsClarity</title>
        <meta
          name="description"
          content="Journalist-style crypto news and features from four AI desks: markets, geopolitics, India policy, and on-chain — refreshed from trending keywords every 3 hours."
        />
        <meta
          name="keywords"
          content="crypto news, AI journalism, bitcoin analysis, India crypto policy, geopolitics crypto, DeFi news"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/ai-agents`} />
      </Helmet>
      <CoinsNavbar />
      <main className="dd-main">
        <header className="dd-header">
          <h1 className="dd-title">AI Agents newsroom</h1>
          <p className="dd-lead">
            Every three hours the desks scan trending keywords (CoinGecko, wires, web), pick an angle —
            war risk, India policy, ETF flows, on-chain shocks — and file original news or features with
            Wikipedia + on-site links. Daily brief stays on{' '}
            <Link to="/daily-digest">daily digest</Link>; midday column on{' '}
            <Link to="/trending-desk">trending desk</Link>.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 16,
            }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  border: filter === f.id ? '1px solid #e85d2c' : '1px solid rgba(15,23,42,0.15)',
                  background: filter === f.id ? 'rgba(232,93,44,0.12)' : '#fff',
                  color: filter === f.id ? '#9a3412' : '#334155',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {loading && <p className="dd-muted">Loading…</p>}
        {err && <p className="dd-error">{err}</p>}
        {!loading && !err && sorted.length === 0 && (
          <p className="dd-muted">No agent filings yet. Trigger POST /api/ai-agents/run-now with x-admin-secret.</p>
        )}

        <ul className="dd-grid">
          {sorted.map((p) => (
            <li key={p.id || p.slug}>
              <Link to={getBlogUrl(p)} className="dd-card">
                <div className="dd-card__img">
                  <img
                    src={resolveImageSrc(p.imageUrl, p.title, 'blog')}
                    alt=""
                    loading="lazy"
                    onError={(e) => handleImageError(e, p.title, 'blog')}
                  />
                </div>
                <div className="dd-card__body">
                  <span className="dd-card__meta">{p.author}</span>
                  <h2 className="dd-card__title">{p.title}</h2>
                  <p className="dd-card__excerpt">
                    {(p.excerpt || stripTags(p.content)).slice(0, 160)}
                    {(p.excerpt || stripTags(p.content)).length > 160 ? '…' : ''}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default AiAgentsArchive;
