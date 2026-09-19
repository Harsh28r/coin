import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle, Bell, ExternalLink } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import { createPriceAlert, fetchP2PBoard, type P2PBoard } from '../../utils/marketAlertsApi';
import { tradeLinks } from '../../utils/tradeLinks';
import { SITE_URL } from '../../utils/jsonLd';
import './tools.css';

const ASSETS = ['USDT', 'BTC', 'ETH'];

const P2PPage: React.FC = () => {
  const [asset, setAsset] = useState('USDT');
  const [upiOnly, setUpiOnly] = useState(true);
  const [board, setBoard] = useState<P2PBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alertDir, setAlertDir] = useState<'above' | 'below'>('above');
  const [alertTarget, setAlertTarget] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertBusy, setAlertBusy] = useState(false);

  const load = async (a = asset, upi = upiOnly) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchP2PBoard(a, 'INR', upi);
      setBoard(data);
      if (!alertTarget && data.bestBuy != null) {
        setAlertTarget(String(Math.ceil(data.bestBuy)));
      }
    } catch (e: any) {
      setError(e?.message || 'P2P board unavailable');
      setBoard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(asset, upiOnly);
    const id = setInterval(() => load(asset, upiOnly), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, upiOnly]);

  const binanceP2p =
    asset === 'USDT'
      ? 'https://p2p.binance.com/en/trade/buy/USDT?fiat=INR'
      : `https://p2p.binance.com/en/trade/buy/${asset}?fiat=INR`;

  const onAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertBusy(true);
    setAlertMsg(null);
    const out = await createPriceAlert({
      coinId: `${asset.toLowerCase()}-inr-p2p`,
      symbol: `${asset}/INR`,
      name: `${asset} INR P2P`,
      target: Number(alertTarget),
      direction: alertDir,
      channel: 'email',
      email: alertEmail,
      kind: 'p2p',
      upiOnly,
    });
    setAlertBusy(false);
    setAlertMsg(
      out.ok
        ? out.warning || 'Alert saved.'
        : out.error || 'Failed',
    );
  };

  const titleAsset = asset === 'USDT' ? 'USDT INR P2P Rate' : `${asset} INR P2P Rate`;

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>{titleAsset} — UPI Buy &amp; Sell Board | CoinsClarity</title>
        <meta
          name="description"
          content={`Live ${asset}/INR P2P rates with UPI filter, exchange premium vs spot, Binance + OKX ads. Free India crypto P2P board — not an escrow.`}
        />
        <link rel="canonical" href={`${SITE_URL}/tools/p2p`} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back">
            <ArrowLeft size={16} /> All tools
          </Link>
          <header className="tool-head">
            <span className="tool-eyebrow">India · P2P lite</span>
            <h1 className="tool-title">{titleAsset}</h1>
            <p className="tool-tagline">
              Live ads from Binance + OKX. UPI filter, premium vs exchange INR, alerts. We are a
              radar — not your counterparty.
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
            <button
              type="button"
              onClick={() => setUpiOnly((v) => !v)}
              className={upiOnly ? 'is-active' : undefined}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #e5e7eb',
                background: upiOnly ? 'rgba(232,93,44,0.06)' : '#fff',
                cursor: 'pointer',
              }}
            >
              {upiOnly ? 'UPI only ✓' : 'All payment methods'}
            </button>
          </nav>

          {/* Trade CTAs */}
          <div className="tool-cross-grid" style={{ marginBottom: 20 }}>
            <a
              href={binanceP2p}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="tool-cross-card"
            >
              <h4>
                Trade on Binance P2P <ExternalLink size={12} />
              </h4>
              <p>Open live {asset}/INR ads</p>
            </a>
            <a
              href={tradeLinks.binance.signup}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="tool-cross-card"
            >
              <h4>
                Binance signup <ExternalLink size={12} />
              </h4>
              <p>Affiliate link · we may earn a commission</p>
            </a>
            <a
              href={tradeLinks.coindcx.signup}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="tool-cross-card"
            >
              <h4>
                CoinDCX (INR) <ExternalLink size={12} />
              </h4>
              <p>Indian exchange alternative to P2P</p>
            </a>
          </div>

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
                {board.premiumBuyPct != null && (
                  <div className="gas-tier__usd">
                    {board.premiumBuyPct >= 0 ? '+' : ''}
                    {board.premiumBuyPct.toFixed(2)}% vs exchange
                  </div>
                )}
              </div>
              <div className="gas-card gas-card--featured">
                <div className="gas-card__chain">Best sell (you get INR)</div>
                <div className="gas-tier__price">
                  {board.bestSell != null ? `₹${board.bestSell.toFixed(2)}` : '—'}
                </div>
                {board.premiumSellPct != null && (
                  <div className="gas-tier__usd">
                    {board.premiumSellPct >= 0 ? '+' : ''}
                    {board.premiumSellPct.toFixed(2)}% vs exchange
                  </div>
                )}
              </div>
              <div className="gas-card gas-card--featured">
                <div className="gas-card__chain">Exchange INR ref</div>
                <div className="gas-tier__price">
                  {board.exchangeInr != null ? `₹${board.exchangeInr.toFixed(2)}` : '—'}
                </div>
                <div className="gas-tier__usd">
                  {board.exchangeSource || '—'} · spread{' '}
                  {board.spreadPct != null ? `${board.spreadPct.toFixed(2)}%` : '—'}
                </div>
              </div>
            </div>
          )}

          {/* Premium alert */}
          <form className="gas-card" onSubmit={onAlert} style={{ marginBottom: 24, maxWidth: 560 }}>
            <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>
              <Bell size={16} style={{ verticalAlign: 'middle' }} /> INR premium alert
            </h2>
            <p className="gas-tier__usd" style={{ marginBottom: 12 }}>
              Email when best {asset} buy crosses your ₹ level
              {upiOnly ? ' (UPI ads only)' : ''}.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <select
                value={alertDir}
                onChange={(e) => setAlertDir(e.target.value as 'above' | 'below')}
                style={{ padding: 8 }}
              >
                <option value="above">Buy ≥</option>
                <option value="below">Buy ≤</option>
              </select>
              <input
                required
                type="number"
                step="0.01"
                placeholder="₹ target"
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
                style={{ padding: 8, width: 120 }}
              />
              <input
                required
                type="email"
                placeholder="you@email.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                style={{ padding: 8, flex: 1, minWidth: 160 }}
              />
              <button type="submit" className="tool-refresh" disabled={alertBusy}>
                {alertBusy ? '…' : 'Set alert'}
              </button>
            </div>
            {alertMsg && <p style={{ margin: 0 }}>{alertMsg}</p>}
          </form>

          {board && (
            <div className="gas-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="gas-card">
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Buy {asset}</h2>
                {board.buy.slice(0, 10).map((ad, i) => (
                  <div key={`${ad.source}-${ad.merchant}-${i}`} className="gas-tier">
                    <span>
                      <strong>₹{ad.price.toFixed(2)}</strong>
                      <div className="gas-tier__usd">
                        {(ad.source || 'p2p').toUpperCase()} · {ad.merchant} ·{' '}
                        {ad.methods.slice(0, 2).join(', ') || (ad.hasUpi ? 'UPI' : '—')}
                      </div>
                    </span>
                    <a href={ad.url} target="_blank" rel="noopener noreferrer sponsored">
                      Open
                    </a>
                  </div>
                ))}
                {!board.buy.length && <p className="gas-tier__usd">No ads for this filter.</p>}
              </div>
              <div className="gas-card">
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Sell {asset}</h2>
                {board.sell.slice(0, 10).map((ad, i) => (
                  <div key={`${ad.source}-${ad.merchant}-${i}`} className="gas-tier">
                    <span>
                      <strong>₹{ad.price.toFixed(2)}</strong>
                      <div className="gas-tier__usd">
                        {(ad.source || 'p2p').toUpperCase()} · {ad.merchant} ·{' '}
                        {ad.methods.slice(0, 2).join(', ') || (ad.hasUpi ? 'UPI' : '—')}
                      </div>
                    </span>
                    <a href={ad.url} target="_blank" rel="noopener noreferrer sponsored">
                      Open
                    </a>
                  </div>
                ))}
                {!board.sell.length && <p className="gas-tier__usd">No ads for this filter.</p>}
              </div>
            </div>
          )}

          {board?.sources && (
            <p className="gas-tier__usd" style={{ marginTop: 12 }}>
              Sources — Binance buy {board.sources.binance?.buy ?? 0} / sell{' '}
              {board.sources.binance?.sell ?? 0}
              {board.sources.okx
                ? ` · OKX buy ${board.sources.okx.buy} / sell ${board.sources.okx.sell}`
                : ''}
            </p>
          )}

          <section className="tool-prose">
            <h2>USDT INR P2P lite — rate board, not a network</h2>
            <p>
              CoinsClarity shows public Binance and OKX P2P ads, optional UPI-only filter, and the
              premium versus an exchange INR reference. We do not escrow INR or crypto. Trade on the
              venue of your choice.
            </p>
            <p className="tool-tagline">{board?.disclaimer}</p>
            <div className="gas-faq">
              <h3>What is P2P premium?</h3>
              <p>
                If best P2P buy is ₹87 and exchange INR ref is ₹84, premium is ~3.6%. High premium
                usually means UPI friction or risk — not free alpha.
              </p>
            </div>
          </section>

          <section className="tool-cross">
            <h3>Related</h3>
            <div className="tool-cross-grid">
              <Link to="/alerts" className="tool-cross-card">
                <h4>Price alerts</h4>
                <p>USD coin alerts + manage list</p>
              </Link>
              <Link to="/portfolio" className="tool-cross-card">
                <h4>Portfolio (INR)</h4>
                <p>Track holdings in USD and INR</p>
              </Link>
              <Link to="/tools/funding" className="tool-cross-card">
                <h4>Funding rates</h4>
                <p>Perp funding board</p>
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
