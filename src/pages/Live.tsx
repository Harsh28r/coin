import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Radio } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { listLiveThreads, type LiveThread } from '../services/liveApi';
import './LivePages.css';

const FILTERS = [
  { id: 'all', label: 'All', status: '' },
  { id: 'live', label: 'Live now', status: 'live' },
  { id: 'upcoming', label: 'Upcoming', status: 'upcoming' },
  { id: 'ended', label: 'Ended', status: 'ended' },
] as const;

const LiveHub: React.FC = () => {
  const [threads, setThreads] = useState<LiveThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await listLiveThreads({ limit: 40 });
      if (!cancelled) {
        setThreads(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    if (!f?.status) return threads;
    return threads.filter((t) => t.status === f.status);
  }, [threads, filter]);

  return (
    <div className="lv-page">
      <Helmet>
        <title>LIVE Crypto &amp; Macro Coverage — CoinsClarity</title>
        <meta
          name="description"
          content="Live desk threads for Fed, CPI, listings, and market-moving events — timestamped updates from CoinsClarity analysts."
        />
        <link rel="canonical" href={`${window.location.origin}/live`} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <CoinsNavbar />
      <main className="lv-main">
        <header>
          <div className="lv-eyebrow">
            <Radio size={14} /> Live desk
          </div>
          <h1 className="lv-title">Live coverage</h1>
          <p className="lv-lead">
            Timestamped updates as events unfold — FOMC, CPI, listings, crashes. Named analysts, not
            anonymous scrapes.
          </p>
          <div className="lv-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`lv-filter ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {loading && <p className="lv-muted">Loading threads…</p>}
        {!loading && filtered.length === 0 && (
          <p className="lv-muted">
            No live threads yet. Admins can seed a demo from CMS → Live Desk, or{' '}
            <code>POST /api/live/seed-demo</code>.
          </p>
        )}

        <ul className="lv-hub-grid">
          {filtered.map((t) => (
            <li key={t.slug}>
              <Link to={`/live/${t.slug}`} className="lv-hub-card">
                <div className="lv-hub-card__top">
                  <span className={`lv-status is-${t.status}`}>
                    {t.status === 'live' && <span className="lv-live-dot" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />}
                    {t.status}
                  </span>
                  <span className="lv-hub-card__meta">{t.updateCount || 0} updates</span>
                </div>
                <h2>{t.title}</h2>
                {t.summary && <p>{t.summary}</p>}
                <div className="lv-hub-card__meta">
                  {t.authorName || 'Markets Desk'}
                  {t.updatedAt
                    ? ` · updated ${new Date(t.updatedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''}
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

export default LiveHub;
