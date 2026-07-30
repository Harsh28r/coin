import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './EmbedWidgets.css';

const ENDPOINT = 'https://api.alternative.me/fng/?limit=2&format=json';

const ringColor = (v: number) => {
  if (v <= 24) return '#dc2626';
  if (v <= 49) return '#f97316';
  if (v <= 54) return '#eab308';
  if (v <= 74) return '#84cc16';
  return '#16a34a';
};

const labelOf = (v: number) => {
  if (v <= 24) return 'Extreme Fear';
  if (v <= 49) return 'Fear';
  if (v <= 54) return 'Neutral';
  if (v <= 74) return 'Greed';
  return 'Extreme Greed';
};

const EmbedFearGreed: React.FC = () => {
  const [value, setValue] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        const json = await res.json();
        const rows = json?.data || [];
        if (!alive) return;
        setValue(parseInt(rows[0]?.value, 10));
        setPrev(rows[1] ? parseInt(rows[1].value, 10) : null);
        setError(null);
      } catch {
        if (alive) setError('Index unavailable');
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const v = Number.isFinite(value as number) ? (value as number) : 50;
  const delta = prev != null && value != null ? value - prev : 0;

  return (
    <div className="embed-root">
      <Helmet>
        <title>Fear & Greed Embed — CoinsClarity</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="embed-card">
        <div className="embed-head">
          <div className="embed-brand">
            <strong>Fear & Greed Index</strong>
            <span>Powered by CoinsClarity × Coinpedia</span>
          </div>
          <span className="embed-live">
            <i /> Live
          </span>
        </div>

        {error ? (
          <div className="embed-err">{error}</div>
        ) : (
          <div className="embed-fng">
            <div
              className="embed-gauge"
              style={
                {
                  '--pct': v,
                  '--gauge': ringColor(v),
                } as React.CSSProperties
              }
            >
              <div className="embed-gauge-inner">
                <b style={{ color: ringColor(v) }}>{value ?? '—'}</b>
                <small>/ 100</small>
              </div>
            </div>
            <div className="embed-meta">
              <div className="embed-label" style={{ color: ringColor(v) }}>
                {labelOf(v)}
              </div>
              {prev != null && (
                <div className={`embed-delta ${delta >= 0 ? 'up' : 'down'}`}>
                  {delta >= 0 ? '+' : ''}
                  {delta} vs yesterday
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--e-muted)' }}>
                Updates ~every few minutes
              </div>
            </div>
          </div>
        )}

        <div className="embed-foot">
          <span>Educational · not financial advice</span>
          <a
            href="https://www.coinsclarity.com/tools/fear-greed"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full tool →
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedFearGreed;
