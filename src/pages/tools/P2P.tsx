import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import { fetchP2PBoard, type P2PBoard } from '../../utils/marketAlertsApi';
import { SITE_URL } from '../../utils/jsonLd';
import './tools.css';

const ASSETS = ['USDT', 'BTC', 'ETH'];

const P2PPage: React.FC = () => {
  const [asset, setAsset] = useState('USDT');
  const [board, setBoard] = useState<P2PBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (a = asset) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchP2PBoard(a, 'INR');
      setBoard(data);
    } catch (e: any) {
      setError(e?.message || 'P2P board unavailable');
      setBoard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(asset);
    const id = setInterval(() => load(asset), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>USDT INR P2P Rate — Binance P2P Buy &amp; Sell | CoinsClarity</title>
        <meta
          name="description"
          content="Live USDT/INR P2P rates from Binance. Best buy and sell ads, UPI/IMPS methods, spread. Free India crypto P2P board."
        />
        <link rel="canonical" href={`${SITE_URL}/tools/p2p`} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back">
            <ArrowLeft size={16} /> All tools
          </Link>
          <header className="tool-head">
            <span className="tool-eyebrow">India</span>
            <h1 className="tool-title">USDT INR P2P Rate</h1>
            <p className="tool-tagline">
              Live Binance P2P ads for {asset}/INR — best buy, best sell, spread. Not an exchange.
            </p>
            <button type="button" className="tool-refresh" onClick={() => load()} disabled={loading}>
              <RefreshCcw size={14} className={loading ? 'spin' : ''} />{' '}
              {loading ? 'Updating…' : 'Refresh'}
            </button>
          </header>

          <nav className="gas-chain-nav" aria-label="P2P asset">
            {ASSETS.map((a) => (
              <button
                key={a}
                type="button"
                className={asset === a ? 'is-active' : undefined}
                onClick={() => setAsset(a)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid #e5e7eb',
                  background: asset === a ? 'rgba(232,93,44,0.06)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {a}/INR
              </button>
            ))}
          </nav>

          {error && (
            <div className="tool-warn">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {board && (
            <div className="gas-grid" style={{ marginBottom: 24 }}>
              <div className="gas-card gas-card--featured">
                <div className="gas-card__chain">Best buy (you pay INR)</div>
                <div className="gas-tier__price">
                  {board.bestBuy != null ? `₹${board.bestBuy.toFixed(2)}` : '—'}
                </div>
              </div>
              <div className="gas-card gas-card--featured">
                <div className="gas-card__chain">Best sell (you get INR)</div>
                <div className="gas-tier__price">
                  {board.bestSell != null ? `₹${board.bestSell.toFixed(2)}` : '—'}
                </div>
              </div>
              <div className="gas-card gas-card--featured">
                <div className="gas-card__chain">Mid / spread</div>
                <div className="gas-tier__price">
                  {board.mid != null ? `₹${board.mid.toFixed(2)}` : '—'}
                </div>
                <div className="gas-tier__usd">
                  spread {board.spreadPct != null ? `${board.spreadPct.toFixed(2)}%` : '—'}
                </div>
              </div>
            </div>
          )}

          {board && (
            <div className="gas-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="gas-card">
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Buy {asset}</h2>
                {board.buy.slice(0, 8).map((ad, i) => (
                  <div key={`${ad.merchant}-${i}`} className="gas-tier">
                    <span>
                      <strong>₹{ad.price.toFixed(2)}</strong>
                      <div className="gas-tier__usd">
                        {ad.merchant} · {ad.methods.slice(0, 2).join(', ') || 'UPI/IMPS'}
                      </div>
                    </span>
                    <a href={ad.url} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  </div>
                ))}
              </div>
              <div className="gas-card">
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Sell {asset}</h2>
                {board.sell.slice(0, 8).map((ad, i) => (
                  <div key={`${ad.merchant}-${i}`} className="gas-tier">
                    <span>
                      <strong>₹{ad.price.toFixed(2)}</strong>
                      <div className="gas-tier__usd">
                        {ad.merchant} · {ad.methods.slice(0, 2).join(', ') || 'UPI/IMPS'}
                      </div>
                    </span>
                    <a href={ad.url} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className="tool-prose">
            <h2>USDT INR P2P rate — why it matters in India</h2>
            <p>
              Most Indian retail flow still clears through P2P (UPI / bank transfer), not only
              exchange INR pairs. This board mirrors public Binance P2P ads so you can see the live
              premium versus “official” USDT/INR.
            </p>
            <p className="tool-tagline">{board?.disclaimer}</p>
            <div className="gas-faq">
              <h3>Is this the best USDT INR rate?</h3>
              <p>
                “Best” depends on merchant trust, payment method, and limits. We show the cheapest
                buy and richest sell from the first page of ads — always verify the counterparty.
              </p>
            </div>
          </section>

          <section className="tool-cross">
            <h3>Related</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/funding" className="tool-cross-card">
                <h4>Funding rates</h4>
                <p>Perp funding board</p>
              </Link>
              <Link to="/portfolio" className="tool-cross-card">
                <h4>Portfolio (INR)</h4>
                <p>Track holdings in USD + INR</p>
              </Link>
              <Link to="/alerts" className="tool-cross-card">
                <h4>Price alerts</h4>
                <p>Get pinged on moves</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default P2PPage;
