import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLiveThreads, type LiveThread } from '../services/liveApi';
import './LandingLiveStrip.css';

/** Compact LIVE teaser for homepage middle — mirrors /live hub. */
const LandingLiveStrip: React.FC = () => {
  const [threads, setThreads] = useState<LiveThread[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listLiveThreads({ limit: 3 });
      if (!cancelled) setThreads(list.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!threads.length) return null;

  return (
    <section className="lls" aria-label="Live coverage">
      <div className="lls-inner">
        <header className="lls-head">
          <div>
            <span className="lls-badge">
              <span className="lls-dot" /> LIVE
            </span>
            <h2 className="lls-title">Live coverage</h2>
            <p className="lls-dek">Desk threads updating as macro and market events unfold.</p>
          </div>
          <Link to="/live" className="lls-all">
            All live →
          </Link>
        </header>
        <ul className="lls-grid">
          {threads.map((t) => (
            <li key={t.slug}>
              <Link to={`/live/${t.slug}`} className="lls-card">
                <span className={`lls-status is-${t.status}`}>{t.status}</span>
                <strong>{t.title}</strong>
                <span className="lls-meta">
                  {t.updateCount || 0} updates · {t.authorName || 'Markets Desk'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LandingLiveStrip;
