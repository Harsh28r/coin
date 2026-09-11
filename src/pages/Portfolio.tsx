import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { coingeckoV3Url } from '../utils/coingeckoUrl';
import { SITE_URL } from '../utils/jsonLd';
import './tools/tools.css';

type Holding = {
  id: string;
  symbol: string;
  name: string;
  qty: number;
  costUsd: number;
};

const LS_KEY = 'coinsclarity_portfolio_v1';

const loadHoldings = (): Holding[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
};

const PortfolioPage: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings);
  const [coinId, setCoinId] = useState('bitcoin');
  const [symbol, setSymbol] = useState('BTC');
  const [name, setName] = useState('Bitcoin');
  const [qty, setQty] = useState('1');
  const [costUsd, setCostUsd] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [inr, setInr] = useState(83);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    const ids = holdings.map((h) => h.id);
    if (!ids.length) return;
    (async () => {
      try {
        const url = coingeckoV3Url(
          `simple/price?ids=${ids.join(',')}&vs_currencies=usd,inr`,
        );
        const res = await fetch(url);
        const data = await res.json();
        const map: Record<string, number> = {};
        let sampleInr = inr;
        for (const id of ids) {
          map[id] = data[id]?.usd ?? 0;
          if (data[id]?.usd && data[id]?.inr) {
            sampleInr = data[id].inr / data[id].usd;
          }
        }
        setPrices(map);
        if (sampleInr) setInr(sampleInr);
      } catch {
        /* ignore */
      }
    })();
  }, [holdings]);

  const rows = useMemo(() => {
    return holdings.map((h) => {
      const px = prices[h.id] || 0;
      const value = px * h.qty;
      const cost = h.costUsd * h.qty;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, px, value, cost, pnl, pnlPct };
    });
  }, [holdings, prices]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPnl = totalValue - totalCost;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setHoldings((prev) => [
      ...prev.filter((h) => h.id !== coinId),
      {
        id: coinId,
        symbol,
        name,
        qty: Number(qty) || 0,
        costUsd: Number(costUsd) || prices[coinId] || 0,
      },
    ]);
  };

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Crypto Portfolio Tracker — USD &amp; INR | CoinsClarity</title>
        <meta
          name="description"
          content="Free crypto portfolio tracker with USD and INR values. Add holdings, see PnL. Stored on your device."
        />
        <link rel="canonical" href={`${SITE_URL}/portfolio`} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <header className="tool-head">
            <span className="tool-eyebrow">India-ready</span>
            <h1 className="tool-title">Crypto Portfolio Tracker</h1>
            <p className="tool-tagline">
              Manual holdings · live CoinGecko prices · USD + INR. Saved in your browser (no login yet).
            </p>
          </header>

          <div className="gas-grid" style={{ marginBottom: 24 }}>
            <div className="gas-card">
              <div className="gas-card__chain">Value (USD)</div>
              <div className="gas-tier__price">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="gas-card">
              <div className="gas-card__chain">Value (INR)</div>
              <div className="gas-tier__price">
                ₹{(totalValue * inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="gas-card">
              <div className="gas-card__chain">PnL</div>
              <div className="gas-tier__price" style={{ color: totalPnl >= 0 ? '#16a34a' : '#dc2626' }}>
                {totalPnl >= 0 ? '+' : ''}
                ${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <form className="gas-card" onSubmit={add} style={{ marginBottom: 24, maxWidth: 560 }}>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
              <input
                value={coinId}
                onChange={(e) => setCoinId(e.target.value.toLowerCase())}
                placeholder="coingecko id (bitcoin)"
                style={{ padding: 8 }}
                required
              />
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="BTC"
                style={{ padding: 8 }}
                required
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                style={{ padding: 8 }}
              />
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qty"
                type="number"
                step="any"
                style={{ padding: 8 }}
                required
              />
              <input
                value={costUsd}
                onChange={(e) => setCostUsd(e.target.value)}
                placeholder="Avg cost USD (optional)"
                type="number"
                step="any"
                style={{ padding: 8, gridColumn: '1 / -1' }}
              />
            </div>
            <button type="submit" className="tool-refresh" style={{ marginTop: 12 }}>
              <Plus size={14} /> Add / update
            </button>
          </form>

          <div className="gas-grid" style={{ gridTemplateColumns: '1fr' }}>
            {rows.map((r) => (
              <div key={r.id} className="gas-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>
                    {r.symbol} · {r.qty}
                  </strong>
                  <div className="gas-tier__usd">
                    ${r.px.toLocaleString()} · value ${r.value.toFixed(2)} · ₹
                    {(r.value * inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })} · PnL{' '}
                    <span style={{ color: r.pnl >= 0 ? '#16a34a' : '#dc2626' }}>
                      {r.pnlPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="tool-refresh"
                  onClick={() => setHoldings((prev) => prev.filter((h) => h.id !== r.id))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <p className="tool-tagline" style={{ marginTop: 24 }}>
            Pair with <Link to="/tools/p2p">USDT/INR P2P</Link> for local rates and{' '}
            <Link to="/alerts">price alerts</Link> for entries/exits.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PortfolioPage;
