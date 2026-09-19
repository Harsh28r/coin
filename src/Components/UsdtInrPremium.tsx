import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { fetchP2PBoard } from '../utils/marketAlertsApi';
import './UsdtInrPremium.css';

type Snapshot = {
  mid: number | null;
  bestBuy: number | null;
  bestSell: number | null;
  forex: number | null;
  premiumPct: number | null;
  updatedAt: string;
};

async function fetchUsdInr(): Promise<number | null> {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const n = j?.rates?.INR;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Proprietary CoinsClarity signal: USDT/INR P2P mid vs USD/INR forex */
const UsdtInrPremium: React.FC = () => {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [board, forex] = await Promise.all([
        fetchP2PBoard('USDT', 'INR', true),
        fetchUsdInr(),
      ]);
      const mid = board.mid;
      const premiumPct =
        mid != null && forex != null && forex > 0 ? ((mid / forex) - 1) * 100 : null;
      setSnap({
        mid,
        bestBuy: board.bestBuy,
        bestSell: board.bestSell,
        forex,
        premiumPct,
        updatedAt: board.updatedAt || new Date().toISOString(),
      });
    } catch (e: any) {
      setErr(e?.message || 'Premium feed unavailable');
      setSnap(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const premium = snap?.premiumPct;
  const tone =
    premium == null ? 'flat' : premium > 1.5 ? 'hot' : premium < 0.3 ? 'cool' : 'mid';

  return (
    <section className="uip" aria-labelledby="uip-heading">
      <div className="uip-inner">
        <header className="uip-head">
          <div>
            <p className="uip-eyebrow">CoinsClarity Index</p>
            <h2 id="uip-heading" className="uip-title">
              USDT / INR premium
            </h2>
            <p className="uip-sub">
              P2P mid vs bank USD/INR — the India crypto on-ramp spread, live.
            </p>
          </div>
          <button type="button" className="uip-refresh" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw size={15} className={loading ? 'uip-spin' : ''} />
          </button>
        </header>

        {err && !snap && <p className="uip-err">{err}</p>}

        <div className={`uip-meter is-${tone}`} aria-live="polite">
          <div className="uip-meter__main">
            <span className="uip-meter__label">Premium</span>
            <span className="uip-meter__value">
              {premium == null
                ? '—'
                : `${premium >= 0 ? '+' : ''}${premium.toFixed(2)}%`}
            </span>
          </div>
          <div className="uip-meter__grid">
            <div>
              <span className="uip-k">P2P mid</span>
              <span className="uip-v">
                {snap?.mid != null ? `₹${snap.mid.toFixed(2)}` : '—'}
              </span>
            </div>
            <div>
              <span className="uip-k">USD/INR</span>
              <span className="uip-v">
                {snap?.forex != null ? `₹${snap.forex.toFixed(2)}` : '—'}
              </span>
            </div>
            <div>
              <span className="uip-k">Best buy</span>
              <span className="uip-v">
                {snap?.bestBuy != null ? `₹${snap.bestBuy.toFixed(2)}` : '—'}
              </span>
            </div>
            <div>
              <span className="uip-k">Best sell</span>
              <span className="uip-v">
                {snap?.bestSell != null ? `₹${snap.bestSell.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        <p className="uip-note">
          Source: Binance P2P (UPI) · Forex: open.er-api ·{' '}
          {snap?.updatedAt
            ? `Updated ${new Date(snap.updatedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Updating…'}
          . Not an offer.
        </p>

        <Link to="/tools/p2p" className="uip-cta">
          Full P2P board <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
};

export default UsdtInrPremium;
