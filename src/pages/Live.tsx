import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Radio } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { listLiveThreads, type LiveThread } from '../services/liveApi';
import {
  fetchSyndicatedWire,
  wireItemToNewsState,
  type WireItem,
} from '../utils/syndicatedWire';
import './LivePages.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'desk', label: 'Live desk' },
  { id: 'wire', label: 'Live wire' },
] as const;

const LiveHub: React.FC = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<LiveThread[]>([]);
  const [wire, setWire] = useState<WireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      const [list, feed] = await Promise.all([
        listLiveThreads({ limit: 40 }),
        fetchSyndicatedWire({ limit: 36, mode: 'live', signal: ac.signal }).catch(() => [] as WireItem[]),
      ]);
      if (!cancelled) {
        setThreads(list);
        setWire(feed);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const showDesk = filter === 'all' || filter === 'desk';
  const showWire = filter === 'all' || filter === 'wire';

  const deskFiltered = useMemo(() => {
    if (!showDesk) return [];
    return threads;
  }, [threads, showDesk]);

  const openWire = (it: WireItem) => {
    navigate(`/news/${encodeURIComponent(it.id || it.title)}`, {
      state: { item: wireItemToNewsState(it) },
    });
  };

  return (
    <div className="lv-page">
      <Helmet>
        <title>LIVE Crypto News Wire — CoinsClarity</title>
        <meta
          name="description"
          content="Live crypto coverage: CoinsClarity desk threads plus a merged wire from Bitcoin News, Blockchain News, CryptoNews, Decrypt and more — same pattern as CoinsCapture news-feeds live mode."
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
            Timestamped desk threads plus a live merged wire — Bitcoin News, Blockchain News,
            CryptoNews, CryptoNewsZ, Decrypt, CoinDesk, CoinTelegraph. Open on CoinsClarity; source
            credited on the article.
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

        {loading && <p className="lv-muted">Loading live feed…</p>}

        {showDesk && !loading && (
          <section className="lv-section" aria-label="Live desk threads">
            <h2 className="lv-section__title">Desk threads</h2>
            {deskFiltered.length === 0 ? (
              <p className="lv-muted">
                No desk threads yet — wire below stays live. Admins can seed from CMS → Live Desk.
              </p>
            ) : (
              <ul className="lv-hub-grid">
                {deskFiltered.map((t) => (
                  <li key={t.slug}>
                    <Link to={`/live/${t.slug}`} className="lv-hub-card">
                      <div className="lv-hub-card__top">
                        <span className={`lv-status is-${t.status}`}>
                          {t.status === 'live' && (
                            <span
                              className="lv-live-dot"
                              style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}
                            />
                          )}
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
            )}
          </section>
        )}

        {showWire && !loading && (
          <section className="lv-section" aria-label="Syndicated live wire">
            <h2 className="lv-section__title">Live wire</h2>
            <p className="lv-section__dek">
              CoinsCapture-style merge — newest first across syndicated RSS. Tap to read on-platform.
            </p>
            {wire.length === 0 ? (
              <p className="lv-muted">Wire feeds unavailable right now. Try again in a minute.</p>
            ) : (
              <ul className="lv-hub-grid">
                {wire.map((it) => (
                  <li key={`${it.source}-${it.id}`}>
                    <button type="button" className="lv-hub-card lv-hub-card--wire" onClick={() => openWire(it)}>
                      <div className="lv-hub-card__top">
                        <span className="lv-status is-live">
                          <span
                            className="lv-live-dot"
                            style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}
                          />
                          wire
                        </span>
                        <span className="lv-hub-card__meta">{it.source}</span>
                      </div>
                      <h2>{it.title}</h2>
                      {it.excerpt ? <p>{it.excerpt}</p> : null}
                      <div className="lv-hub-card__meta">
                        Source: {it.source}
                        {it.published ? ` · ${it.published}` : ''}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LiveHub;
