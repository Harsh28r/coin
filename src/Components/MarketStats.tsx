import React from 'react';
import { Link } from 'react-router-dom';
import {
  fearColor,
  formatMarketUsd,
  useMarketOverview,
} from '../hooks/useMarketOverview';
import './MarketStats.css';

const rsiLabel = (v: number) => {
  if (v < 30) return 'Oversold';
  if (v > 70) return 'Overbought';
  return 'Neutral';
};

const seasonLabel = (v: number) => {
  if (v >= 75) return 'Altcoin Season';
  if (v <= 25) return 'Bitcoin Season';
  return 'Transition';
};

const arcPoint = (v: number) => {
  const angle = (v / 100) * 180 - 90;
  const r = 88;
  const cx = 110;
  const cy = 110;
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const MarketStats: React.FC = () => {
  const { stats, sentiment, loading } = useMarketOverview();

  if (loading && !stats) return null;
  if (!stats || !sentiment) return null;

  const fgColor = fearColor(sentiment.fearGreed);
  const needle = arcPoint(sentiment.fearGreed);
  const rsiColor =
    sentiment.avgRsi < 30 ? '#22c55e' : sentiment.avgRsi > 70 ? '#ef4444' : '#eab308';
  const seasonColor =
    sentiment.altSeason >= 75 ? '#a78bfa' : sentiment.altSeason <= 25 ? '#fb923c' : '#94a3b8';
  const capUp = stats.market_cap_change_24h >= 0;

  return (
    <section className="mkt-ov" aria-label="Market overview">
      <div className="mkt-ov__panel">
        <header className="mkt-ov__head">
          <div>
            <span className="mkt-ov__eyebrow">Market data</span>
            <h2 className="mkt-ov__title">Market Overview</h2>
            <p className="mkt-ov__dek">
              Live cap, dominance, Fear &amp; Greed, altcoin season, and average crypto RSI — same pulse
              stack traders scan on the big terminals.
            </p>
          </div>
          <span className="mkt-ov__live">
            <span className="mkt-ov__live-dot" aria-hidden />
            LIVE
          </span>
        </header>

        <div className="mkt-ov__grid">
          <Link to="/tools/fear-greed" className="mkt-ov__fg" aria-label="Fear and Greed index">
            <div className="mkt-ov__card-top">
              <span className="mkt-ov__meter-label">Fear &amp; Greed</span>
              <span className="mkt-ov__meter-cta">History →</span>
            </div>
            <div className="mkt-ov__fg-body">
              <svg viewBox="0 0 220 130" className="mkt-ov__arc" aria-hidden>
                <defs>
                  <linearGradient id="mkt-fg-arc" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="25%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="75%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <path
                  d="M 22 110 A 88 88 0 0 1 198 110"
                  fill="none"
                  stroke="url(#mkt-fg-arc)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <line
                  x1="110"
                  y1="110"
                  x2={needle.x}
                  y2={needle.y}
                  stroke="#f8fafc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="110" cy="110" r="5" fill="#f8fafc" />
              </svg>
              <div className="mkt-ov__fg-readout" style={{ color: fgColor }}>
                <strong>{sentiment.fearGreed}</strong>
                <span>{sentiment.fearLabel}</span>
              </div>
            </div>
            <div className="mkt-ov__spectrum mkt-ov__spectrum--light">
              <span>Fear</span>
              <span>Greed</span>
            </div>
          </Link>

          <div className="mkt-ov__meter" role="group" aria-label="Altcoin season index">
            <div className="mkt-ov__card-top">
              <span className="mkt-ov__meter-label">Altcoin Season</span>
              <span className="mkt-ov__meter-cta">{sentiment.altSeason} / 100</span>
            </div>
            <div className="mkt-ov__meter-value">
              <span className="mkt-ov__meter-num" style={{ color: seasonColor }}>
                {sentiment.altSeason}
              </span>
              <span className="mkt-ov__meter-tag" style={{ color: seasonColor }}>
                {seasonLabel(sentiment.altSeason)}
              </span>
            </div>
            <div className="mkt-ov__spectrum-bar" aria-hidden>
              <div
                className="mkt-ov__spectrum-thumb"
                style={{ left: `${sentiment.altSeason}%`, background: seasonColor }}
              />
            </div>
            <div className="mkt-ov__spectrum">
              <span>Bitcoin</span>
              <span>Altcoin</span>
            </div>
          </div>

          <div className="mkt-ov__meter" role="group" aria-label="Average crypto RSI">
            <div className="mkt-ov__card-top">
              <span className="mkt-ov__meter-label">Average Crypto RSI</span>
              <span className="mkt-ov__meter-cta">Top 25</span>
            </div>
            <div className="mkt-ov__meter-value">
              <span className="mkt-ov__meter-num" style={{ color: rsiColor }}>
                {sentiment.avgRsi.toFixed(0)}
              </span>
              <span className="mkt-ov__meter-tag" style={{ color: rsiColor }}>
                {rsiLabel(sentiment.avgRsi)}
              </span>
            </div>
            <div className="mkt-ov__spectrum-bar mkt-ov__spectrum-bar--rsi" aria-hidden>
              <div
                className="mkt-ov__spectrum-thumb"
                style={{ left: `${Math.min(100, sentiment.avgRsi)}%`, background: rsiColor }}
              />
            </div>
            <div className="mkt-ov__spectrum">
              <span>Oversold</span>
              <span>Overbought</span>
            </div>
          </div>
        </div>

        <div className="mkt-ov__stats">
          <div className="mkt-ov__stat">
            <h3 className="mkt-ov__stat-h">
              Total Market Cap : <span>{formatMarketUsd(stats.total_market_cap)}</span>
            </h3>
            <div className={`mkt-ov__stat-change ${capUp ? 'is-up' : 'is-down'}`}>
              {capUp ? '+' : ''}
              {stats.market_cap_change_24h.toFixed(2)}% 24h
            </div>
          </div>
          <div className="mkt-ov__stat">
            <h3 className="mkt-ov__stat-h">
              24h Volume : <span>{formatMarketUsd(stats.total_volume)}</span>
            </h3>
          </div>
          <div className="mkt-ov__stat">
            <h3 className="mkt-ov__stat-h">
              BTC Dominance : <span>{stats.btc_dominance.toFixed(2)} %</span>
            </h3>
          </div>
          <div className="mkt-ov__stat">
            <h3 className="mkt-ov__stat-h">
              ETH Dominance : <span>{stats.eth_dominance.toFixed(2)} %</span>
            </h3>
          </div>
          <div className="mkt-ov__stat">
            <h3 className="mkt-ov__stat-h">
              Cryptocurrencies : <span>{stats.active_cryptocurrencies.toLocaleString()}</span>
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketStats;
