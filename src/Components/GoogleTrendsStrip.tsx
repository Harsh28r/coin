import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGoogleTrends, fetchPosts, type GoogleTrend } from '../services/api';
import type { BlogPost } from '../types/blog';
import { getBlogUrl } from '../utils/blogUrl';
import './GoogleTrendsStrip.css';

function formatTraffic(t: GoogleTrend) {
  if (t.traffic) return t.traffic;
  const n = t.volume || t.tweet_volume;
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K+`;
  return `${n}+`;
}

/** Live Google Trends (IN + US). Finance queries are what the desk writes into /blog. */
const GoogleTrendsStrip: React.FC = () => {
  const [rows, setRows] = useState<GoogleTrend[] | null>(null);
  const [latestDesk, setLatestDesk] = useState<BlogPost | null>(null);

  useEffect(() => {
    let cancel = false;
    fetchGoogleTrends().then((list) => {
      if (cancel || !list?.length) return;
      const finance = list.filter((t) => t.writable);
      setRows((finance.length ? finance : list).slice(0, 6));
    });
    fetchPosts({ tag: 'trending-desk', limit: 8 })
      .then((list) => {
        if (cancel || !list?.length) return;
        const sorted = [...list].sort((a, b) => {
          const ta = new Date((a as any).date || 0).getTime();
          const tb = new Date((b as any).date || 0).getTime();
          return tb - ta;
        });
        setLatestDesk(sorted[0] || null);
      })
      .catch(() => {
        /* strip still works without desk link */
      });
    return () => {
      cancel = true;
    };
  }, []);

  if (!rows?.length) return null;

  const finance = rows.some((t) => t.writable);
  const deskHref = latestDesk ? getBlogUrl(latestDesk) : '/trending-desk';

  return (
    <section className="gts" aria-label="Google Trends">
      <div className="gts-inner">
        <header className="gts-head">
          <h2 className="gts-title">What people are searching</h2>
          <p className="gts-sub">
            {finance
              ? 'Google Trends, India and the US — market searches become desk columns on the blog.'
              : 'Google Trends right now. No finance query is hot enough to write, so the desk stays quiet.'}
          </p>
          {latestDesk && (
            <Link to={deskHref} className="gts-latest">
              Latest Trends column: {latestDesk.title} →
            </Link>
          )}
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
                  <Link to={deskHref} className="gts-row">
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
