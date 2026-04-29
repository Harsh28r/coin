import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import './tools.css';

interface FngPoint {
  value: number;
  classification: string;
  timestamp: number;
}

const ENDPOINT = 'https://api.alternative.me/fng/?limit=30&format=json';

const ringColor = (v: number): string => {
  if (v <= 24) return '#dc2626';
  if (v <= 49) return '#f97316';
  if (v <= 54) return '#eab308';
  if (v <= 74) return '#84cc16';
  return '#16a34a';
};

const labelOf = (v: number): string => {
  if (v <= 24) return 'Extreme Fear';
  if (v <= 49) return 'Fear';
  if (v <= 54) return 'Neutral';
  if (v <= 74) return 'Greed';
  return 'Extreme Greed';
};

const FearGreedPage: React.FC = () => {
  const [history, setHistory] = useState<FngPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      const data: FngPoint[] = (json?.data || []).map((d: any) => ({
        value: parseInt(d.value, 10),
        classification: d.value_classification,
        timestamp: parseInt(d.timestamp, 10) * 1000,
      }));
      setHistory(data);
    } catch (e: any) {
      setError('Live index unavailable. Showing cached values where possible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const today = history[0];
  const yesterday = history[1];
  const lastWeek = history[6];
  const lastMonth = history[history.length - 1];
  const delta = today && yesterday ? today.value - yesterday.value : 0;

  const arc = (v: number) => {
    const angle = (v / 100) * 180 - 90;
    const r = 110;
    const cx = 130;
    const cy = 130;
    const x = cx + r * Math.cos((angle * Math.PI) / 180);
    const y = cy + r * Math.sin((angle * Math.PI) / 180);
    return { x, y, color: ringColor(v) };
  };

  const indicator = today ? arc(today.value) : arc(50);

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Crypto Fear & Greed Index — Live Sentiment Tracker | CoinsClarity</title>
        <meta
          name="description"
          content="Live Bitcoin Fear & Greed Index updated every 5 minutes. Track 30-day market sentiment history, learn how the index works, and use it to time entries and exits."
        />
        <link rel="canonical" href="https://coinsclarity.com/tools/fear-greed" />
        <meta property="og:title" content="Crypto Fear & Greed Index — Live Tracker" />
        <meta property="og:description" content="Live sentiment gauge for Bitcoin and crypto markets. Updated every 5 minutes with 30-day history." />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back"><ArrowLeft size={16} /> All tools</Link>

          <header className="tool-head">
            <span className="tool-eyebrow">Sentiment</span>
            <h1 className="tool-title">Crypto Fear &amp; Greed Index</h1>
            <p className="tool-tagline">
              When others are fearful, be greedy — and vice versa. Live market mood, updated every 5 minutes.
            </p>
            <button className="tool-refresh" onClick={load} disabled={loading}>
              <RefreshCcw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Updating…' : 'Refresh'}
            </button>
          </header>

          {error && (
            <div className="tool-warn"><AlertTriangle size={16} /> {error}</div>
          )}

          <div className="fg-grid">
            <div className="fg-gauge">
              <svg viewBox="0 0 260 160" width="100%" height="auto">
                <defs>
                  <linearGradient id="fg-arc" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="25%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="75%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 130 A 110 110 0 0 1 240 130"
                  fill="none"
                  stroke="url(#fg-arc)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {today && (
                  <>
                    <line
                      x1="130"
                      y1="130"
                      x2={indicator.x}
                      y2={indicator.y}
                      stroke="#111"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="130" cy="130" r="6" fill="#111" />
                  </>
                )}
              </svg>
              <div className="fg-readout" style={{ color: today ? ringColor(today.value) : '#999' }}>
                <div className="fg-value">{today ? today.value : '—'}</div>
                <div className="fg-label">{today ? labelOf(today.value) : 'Loading'}</div>
                {today && yesterday && (
                  <div className={`fg-delta ${delta >= 0 ? 'up' : 'down'}`}>
                    {delta >= 0 ? '+' : ''}{delta} vs yesterday
                  </div>
                )}
              </div>
            </div>

            <div className="fg-snapshot">
              <h3 className="fg-snapshot__h">Quick reading</h3>
              {today ? (
                <p className="fg-snapshot__p">
                  Bitcoin sentiment is currently <strong style={{ color: ringColor(today.value) }}>{labelOf(today.value)}</strong> at{' '}
                  <strong>{today.value}/100</strong>. {' '}
                  {today.value <= 24 && 'Extreme fear historically marks accumulation zones — but it can persist for weeks.'}
                  {today.value > 24 && today.value <= 49 && 'Fear means investors are de-risking. Counter-trend entries here have favourable risk/reward.'}
                  {today.value > 49 && today.value <= 54 && 'Neutral conditions — the market is undecided. Wait for breakout confirmation.'}
                  {today.value > 54 && today.value <= 74 && 'Greed is creeping in. Trim profits incrementally and tighten stops.'}
                  {today.value > 74 && 'Extreme greed has historically preceded local tops. Take chips off the table.'}
                </p>
              ) : (
                <p className="fg-snapshot__p">Loading sentiment…</p>
              )}

              <div className="fg-stats">
                <div className="fg-stat">
                  <span>Yesterday</span>
                  <strong style={{ color: yesterday ? ringColor(yesterday.value) : '' }}>
                    {yesterday ? `${yesterday.value} · ${labelOf(yesterday.value)}` : '—'}
                  </strong>
                </div>
                <div className="fg-stat">
                  <span>Last week</span>
                  <strong style={{ color: lastWeek ? ringColor(lastWeek.value) : '' }}>
                    {lastWeek ? `${lastWeek.value} · ${labelOf(lastWeek.value)}` : '—'}
                  </strong>
                </div>
                <div className="fg-stat">
                  <span>30 days ago</span>
                  <strong style={{ color: lastMonth ? ringColor(lastMonth.value) : '' }}>
                    {lastMonth ? `${lastMonth.value} · ${labelOf(lastMonth.value)}` : '—'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <section className="fg-history">
            <h2 className="fg-h2">30-day history</h2>
            <div className="fg-bars">
              {[...history].reverse().map((p, i) => (
                <div
                  key={i}
                  className="fg-bar"
                  style={{ height: `${p.value}%`, background: ringColor(p.value) }}
                  title={`${labelOf(p.value)} (${p.value}) on ${new Date(p.timestamp).toLocaleDateString()}`}
                />
              ))}
            </div>
            <div className="fg-axis">
              <span>30d ago</span>
              <span>Today</span>
            </div>
          </section>

          <section className="tool-prose">
            <h2>How the Crypto Fear &amp; Greed Index works</h2>
            <p>
              The Crypto Fear &amp; Greed Index is a composite sentiment score from 0 (extreme fear) to 100 (extreme greed)
              that aggregates six market signals into a single number. Originally inspired by CNN's Money Fear &amp; Greed
              gauge for equities, the crypto version tracks Bitcoin specifically because BTC dominance still drives the mood
              of the entire digital asset market.
            </p>

            <h3>Inputs that move the dial</h3>
            <ul>
              <li><strong>Volatility (25%)</strong> — current 30 / 90-day average BTC volatility. Spiking volatility almost always coincides with fear.</li>
              <li><strong>Market momentum &amp; volume (25%)</strong> — buy-volume relative to the prior month. Persistent green candles on rising volume = greed.</li>
              <li><strong>Social media (15%)</strong> — Twitter/X mention rate and engagement on Bitcoin hashtags.</li>
              <li><strong>Surveys (15%, paused)</strong> — historic weekly polls; weight redistributed when offline.</li>
              <li><strong>Bitcoin dominance (10%)</strong> — rising BTC.D usually signals risk-off rotation out of altcoins.</li>
              <li><strong>Google Trends (10%)</strong> — search-volume changes for "bitcoin price manipulation", "buy bitcoin", etc.</li>
            </ul>

            <h3>How traders actually use it</h3>
            <p>
              The index is a contrarian signal, not a buy/sell trigger. Warren Buffett's famous "be fearful when others are
              greedy, and greedy when others are fearful" applies cleanly here. Historically, every reading below 20
              ("Extreme Fear") in the last four years has marked a local accumulation zone on the daily chart, while readings
              above 80 have preceded short-term pullbacks within 1–3 weeks roughly 70% of the time.
            </p>
            <p>
              The catch: extreme readings can stay extreme. In bear markets, the gauge sat below 25 for months at a time. Use
              the index alongside structure (higher highs / lower lows), funding rates, and on-chain flows — not in
              isolation. A reading by itself does not call a bottom; a reading combined with a divergence, a positive funding
              flush, and exchange outflows often does.
            </p>

            <h3>Reading the colour bands</h3>
            <p>
              0–24 is extreme fear (red), 25–49 is fear (orange), 50–54 is neutral (yellow), 55–74 is greed (lime), and 75+
              is extreme greed (green). Most retail blow-up tops cluster in the 80–95 zone; most pure-panic capitulation
              wicks cluster at 5–15. The middle is statistical noise.
            </p>
          </section>

          <section className="tool-cross">
            <h3>Related tools</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/gas" className="tool-cross-card">
                <h4>Gas Tracker</h4><p>Live ETH, Polygon &amp; Arbitrum gas prices</p>
              </Link>
              <Link to="/tools/scam-check" className="tool-cross-card">
                <h4>Scam &amp; Honeypot Checker</h4><p>Paste any contract address, get an instant risk verdict</p>
              </Link>
              <Link to="/compare" className="tool-cross-card">
                <h4>Compare Coins</h4><p>Side-by-side fundamentals for any two assets</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FearGreedPage;
