import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getOpportunities, ArbitrageOpportunity } from '../../services/arbitrageApi';
import './EmbedWidgets.css';

const EmbedArb: React.FC = () => {
  const [rows, setRows] = useState<ArbitrageOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const list = await getOpportunities(5);
        if (!alive) return;
        const profitable = (Array.isArray(list) ? list : [])
          .filter((o) => Number(o.netProfitPercent) > 0)
          .sort((a, b) => Number(b.netProfitPercent) - Number(a.netProfitPercent))
          .slice(0, 5);
        setRows(profitable);
        setUpdated(new Date());
        setError(null);
      } catch {
        if (alive) setError('Scanner unavailable');
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const time = updated
    ? updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="embed-root">
      <Helmet>
        <title>Arbitrage Embed — CoinsClarity</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="embed-card">
        <div className="embed-head">
          <div className="embed-brand">
            <strong>Live Arbitrage Spreads</strong>
            <span>CoinsClarity × Coinpedia · net after ~0.2% fees</span>
          </div>
          <span className="embed-live">
            <i /> {time}
          </span>
        </div>

        {error ? (
          <div className="embed-err">{error}</div>
        ) : rows.length === 0 ? (
          <div className="embed-empty">No positive net spreads right now — markets are tight.</div>
        ) : (
          <table className="embed-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Route</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o, i) => {
                const net = Number(o.netProfitPercent) || 0;
                return (
                  <tr key={o._id || `${o.symbol}-${i}`}>
                    <td>
                      <div className="embed-pair">{o.symbol}</div>
                    </td>
                    <td>
                      <div className="embed-route">
                        {o.buyExchange} → {o.sellExchange}
                      </div>
                    </td>
                    <td>
                      <span className={`embed-net ${net > 0 ? '' : 'neg'}`}>
                        {net.toFixed(3)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="embed-foot">
          <span>Spreads can vanish fast</span>
          <a
            href="https://www.coinsclarity.com/arbitrage-scanner"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full scanner →
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedArb;
