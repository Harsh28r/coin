import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import { useWatchlist } from '../context/WatchlistContext';
import {
  cancelPriceAlert,
  createPriceAlert,
  listPriceAlerts,
  type PriceAlertRow,
} from '../utils/marketAlertsApi';
import { SITE_URL } from '../utils/jsonLd';
import './tools/tools.css';

const AlertsPage: React.FC = () => {
  const { watchlist } = useWatchlist();
  const [alerts, setAlerts] = useState<PriceAlertRow[]>([]);
  const [coinId, setCoinId] = useState(watchlist[0]?.id || 'bitcoin');
  const [symbol, setSymbol] = useState(watchlist[0]?.symbol || 'BTC');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [channel, setChannel] = useState<'email' | 'telegram' | 'web'>('email');
  const [email, setEmail] = useState('');
  const [chatId, setChatId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setAlerts(await listPriceAlerts());
    } catch {
      setAlerts([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const w = watchlist.find((c) => c.id === coinId);
    if (w) setSymbol(w.symbol);
  }, [coinId, watchlist]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const out = await createPriceAlert({
      coinId,
      symbol,
      target: Number(target),
      direction,
      channel,
      email: channel === 'email' ? email : undefined,
      chatId: channel === 'telegram' ? Number(chatId) : undefined,
    });
    setBusy(false);
    if (!out.ok) {
      setMsg(out.error || 'Failed');
      return;
    }
    setMsg('Alert saved. We check about every 2 minutes.');
    setTarget('');
    refresh();
  };

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Crypto Price Alerts — Email &amp; Telegram | CoinsClarity</title>
        <meta
          name="description"
          content="Free crypto price alerts by email or Telegram. Alert when Bitcoin, Ethereum or any coin crosses your target."
        />
        <link rel="canonical" href={`${SITE_URL}/alerts`} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <header className="tool-head">
            <span className="tool-eyebrow">Retention</span>
            <h1 className="tool-title">Crypto Price Alerts</h1>
            <p className="tool-tagline">
              Ping when price crosses your level. Email, Telegram bot, or save on-device (web).
            </p>
          </header>

          <form className="gas-card" onSubmit={onSubmit} style={{ marginBottom: 24, maxWidth: 520 }}>
            <label style={{ display: 'block', marginBottom: 12 }}>
              Coin
              <select
                value={coinId}
                onChange={(e) => {
                  setCoinId(e.target.value);
                  const w = watchlist.find((c) => c.id === e.target.value);
                  if (w) setSymbol(w.symbol);
                }}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
              >
                {watchlist.length === 0 && (
                  <>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="solana">Solana (SOL)</option>
                  </>
                )}
                {watchlist.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </label>
            {watchlist.length === 0 && (
              <p className="gas-tier__usd">
                Tip: <Link to="/watchlist">add coins to watchlist</Link> for a fuller list.
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
                style={{ padding: 8 }}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
              <input
                required
                type="number"
                step="any"
                placeholder="Target USD"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />
            </div>

            <label style={{ display: 'block', marginBottom: 12 }}>
              Channel
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
              >
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
                <option value="web">Web only (no push yet)</option>
              </select>
            </label>

            {channel === 'email' && (
              <input
                required
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: 8, marginBottom: 12 }}
              />
            )}
            {channel === 'telegram' && (
              <div style={{ marginBottom: 12 }}>
                <input
                  required
                  type="number"
                  placeholder="Telegram chat id"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  style={{ width: '100%', padding: 8 }}
                />
                <p className="gas-tier__usd">
                  Open <a href="https://t.me/Coinsclarity_bot" target="_blank" rel="noreferrer">@Coinsclarity_bot</a>
                  , send <code>/myid</code>, paste the number. Or set alerts with{' '}
                  <code>/alert btc above 100000</code>.
                </p>
              </div>
            )}

            <button type="submit" className="tool-refresh" disabled={busy}>
              <Bell size={14} /> {busy ? 'Saving…' : 'Create alert'}
            </button>
            {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
          </form>

          <h2 style={{ fontSize: '1.2rem' }}>Your alerts</h2>
          {alerts.length === 0 ? (
            <p className="tool-tagline">No alerts yet.</p>
          ) : (
            <div className="gas-grid" style={{ gridTemplateColumns: '1fr' }}>
              {alerts.map((a) => (
                <div key={a._id} className="gas-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>
                      {a.symbol} {a.direction} ${a.target.toLocaleString()}
                    </strong>
                    <div className="gas-tier__usd">
                      {a.channel} · {a.status}
                      {a.lastPrice != null ? ` · last $${a.lastPrice}` : ''}
                    </div>
                  </div>
                  {a.status === 'active' && (
                    <button
                      type="button"
                      className="tool-refresh"
                      onClick={async () => {
                        await cancelPriceAlert(a._id);
                        refresh();
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AlertsPage;
