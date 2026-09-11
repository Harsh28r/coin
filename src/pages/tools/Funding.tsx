import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import { fetchFundingRates, type FundingRow } from '../../utils/marketAlertsApi';
import { SITE_URL } from '../../utils/jsonLd';
import './tools.css';

const FundingPage: React.FC = () => {
  const [rows, setRows] = useState<FundingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFundingRates();
      setRows(data);
    } catch {
      setError('Could not load funding rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const hottest = useMemo(
    () => [...rows].sort((a, b) => Math.abs(b.ratePct) - Math.abs(a.ratePct))[0],
    [rows],
  );

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Crypto Funding Rates — BTC ETH Perpetual Funding | CoinsClarity</title>
        <meta
          name="description"
          content="Live crypto perpetual funding rates for BTC, ETH, SOL and more. 8h rate, annualized %, mark price. Free Binance futures board."
        />
        <link rel="canonical" href={`${SITE_URL}/tools/funding`} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back">
            <ArrowLeft size={16} /> All tools
          </Link>
          <header className="tool-head">
            <span className="tool-eyebrow">Derivatives</span>
            <h1 className="tool-title">Crypto Funding Rates</h1>
            <p className="tool-tagline">
              Perpetual futures funding (8h) with annualized %. Positive = longs pay shorts.
            </p>
            <button type="button" className="tool-refresh" onClick={load} disabled={loading}>
              <RefreshCcw size={14} className={loading ? 'spin' : ''} />{' '}
              {loading ? 'Updating…' : 'Refresh'}
            </button>
          </header>

          {error && (
            <div className="tool-warn">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {hottest && (
            <p className="tool-tagline" style={{ marginTop: 0 }}>
              Hottest: <strong>{hottest.symbol}</strong> at{' '}
              {hottest.ratePct >= 0 ? '+' : ''}
              {hottest.ratePct.toFixed(4)}% / 8h
            </p>
          )}

          <div className="gas-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="gas-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#525866' }}>
                    <th style={{ padding: '8px 0' }}>Asset</th>
                    <th>Rate (8h)</th>
                    <th>Annualized</th>
                    <th>Mark</th>
                    <th>Next</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '10px 0', fontWeight: 700 }}>{r.symbol}</td>
                      <td
                        style={{
                          color: r.ratePct >= 0 ? '#dc2626' : '#16a34a',
                          fontWeight: 600,
                        }}
                      >
                        {r.ratePct >= 0 ? '+' : ''}
                        {r.ratePct.toFixed(4)}%
                      </td>
                      <td>{r.annualizedPct.toFixed(1)}%</td>
                      <td>${r.markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>
                        {r.nextFundingTime
                          ? new Date(r.nextFundingTime).toLocaleTimeString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <section className="tool-prose">
            <h2>What are crypto funding rates?</h2>
            <p>
              Perpetual futures use funding payments so the contract stays near spot. When funding is
              positive, longs pay shorts every 8 hours. Negative funding means shorts pay longs —
              often a crowded short or a weak market.
            </p>
            <h3>FAQ</h3>
            <div className="gas-faq">
              <h3>Where does this funding rate data come from?</h3>
              <p>Binance USDT-M perpetual <code>premiumIndex</code> — live mark price and next funding time.</p>
            </div>
          </section>

          <section className="tool-cross">
            <h3>Related</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/liquidations" className="tool-cross-card">
                <h4>Liquidation levels</h4>
                <p>Estimated long/short cascade clusters</p>
              </Link>
              <Link to="/tools/p2p" className="tool-cross-card">
                <h4>INR P2P rates</h4>
                <p>USDT/INR Binance P2P board</p>
              </Link>
              <Link to="/alerts" className="tool-cross-card">
                <h4>Price alerts</h4>
                <p>Email or Telegram when price hits</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FundingPage;
