import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGoogleTrends, type GoogleTrend } from '../services/api';
import './GoogleTrendsStrip.css';

function formatTraffic(t: GoogleTrend) {
  if (t.traffic) return t.traffic;
  const n = t.volume || t.tweet_volume;
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K+`;
  return `${n}+`;
}

/** Live Google Trends (IN + US). Finance queries are what the desk writes. */
const GoogleTrendsStrip: React.FC = () => {
  const [rows, setRows] = useState<GoogleTrend[] | null>(null);

  useEffect(() => {
    let cancel = false;
    fetchGoogleTrends().then((list) => {
      if (cancel || !list?.length) return;
      const finance = list.filter((t) => t.writable);
      setRows((finance.length ? finance : list).slice(0, 6));
    });
    return () => {
      cancel = true;
    };
  }, []);

  if (!rows?.length) return null;

  const finance = rows.some((t) => t.writable);

  return (
    <section className="gts" aria-label="Google Trends">
      <div className="gts-inner">
        <header className="gts-head">
          <h2 className="gts-title">What people are searching</h2>
          <p className="gts-sub">
            {finance
              ? 'Google Trends, India and the US. The desk writes the top market search — one column, not a template.'
              : 'Google Trends right now. No finance query is hot enough to write, so the desk stays quiet.'}
          </p>
        </header>
        <ol className="gts-list">
          {rows.map((t) => {
            const traffic = formatTraffic(t);
            const inner = (
              <>
                <span className="gts-name">{t.name}</span>
                <span className="gts-meta">
                  {t.geo || 'IN'}
                  {traffic ? ` · ${traffic}` : ''}
                  {t.writable ? ' · desk' : ''}
                </span>
              </>
            );
            return (
              <li key={`${t.geo}-${t.name}`}>
                {t.writable ? (
                  <Link to="/trending-desk" className="gts-row">
                    {inner}
                  </Link>
                ) : (
                  <a className="gts-row" href={t.url} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default GoogleTrendsStrip;
