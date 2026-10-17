import React from 'react';
import { Link } from 'react-router-dom';
import {
  fearColor,
  formatMarketUsd,
  useMarketOverview,
} from '../hooks/useMarketOverview';
import './MarketPulseBar.css';

/** CoinsCapture-style top global strip — cap, dominance, sentiment meters. */
const MarketPulseBar: React.FC = () => {
  const { stats, sentiment } = useMarketOverview();

  if (!stats || !sentiment) return null;

  const fg = fearColor(sentiment.fearGreed);

  return (
    <div className="mpb" role="region" aria-label="Live market pulse">
      <div className="mpb__inner">
        <div className="mpb__live">
          <span className="mpb__live-dot" aria-hidden />
          LIVE
        </div>

        <div className="mpb__track">
          <span className="mpb__item">
            <span className="mpb__k">Cryptocurrencies</span>
            <span className="mpb__v">{stats.active_cryptocurrencies.toLocaleString()}</span>
          </span>
          <span className="mpb__item">
            <span className="mpb__k">Market Cap</span>
            <span className="mpb__v mpb__v--accent">{formatMarketUsd(stats.total_market_cap)}</span>
          </span>
          <span className="mpb__item">
            <span className="mpb__k">24h Vol</span>
            <span className="mpb__v">{formatMarketUsd(stats.total_volume)}</span>
          </span>
          <span className="mpb__item">
            <span className="mpb__k">BTC Dom</span>
            <span className="mpb__v mpb__v--accent">{stats.btc_dominance.toFixed(2)}%</span>
          </span>
          <Link to="/tools/fear-greed" className="mpb__item mpb__item--link">
            <span className="mpb__k">Fear &amp; Greed</span>
            <span className="mpb__v" style={{ color: fg }}>
              {sentiment.fearGreed} {sentiment.fearLabel}
            </span>
          </Link>
          <span className="mpb__item">
            <span className="mpb__k">Altcoin Season</span>
            <span className="mpb__v">
              {sentiment.altSeason}
              <span className="mpb__muted"> / 100</span>
            </span>
          </span>
          <span className="mpb__item">
            <span className="mpb__k">Avg RSI</span>
            <span className="mpb__v">{sentiment.avgRsi}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketPulseBar;
