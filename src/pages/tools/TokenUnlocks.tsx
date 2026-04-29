import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle, CalendarClock, ExternalLink, Search } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import './tools.css';

interface UnlockEvent {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  unlockTs: number;          // unix seconds
  unlockUSD: number;
  totalSupplyUSD: number;
  pctOfFloat: number;        // unlocks as % of circulating
  category?: string;         // "team", "investors", "community", etc.
  defillamaSlug?: string;
}

const fmtUsd = (v: number): string => {
  if (!v || isNaN(v)) return '—';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
};

const fmtCountdown = (target: number): string => {
  const diff = target * 1000 - Date.now();
  if (diff <= 0) return 'now';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
};

const fmtDate = (ts: number): string =>
  new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

const PROXY = 'https://corsproxy.io/?';

const fetchJson = async (url: string): Promise<any> => {
  const tries = [url, `${PROXY}${encodeURIComponent(url)}`];
  for (const t of tries) {
    try {
      const r = await fetch(t, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      return await r.json();
    } catch {}
  }
  return null;
};

// DefiLlama emissions endpoint — free, no key.
// Each protocol object contains an `events` array with future unlock cliffs.
const fetchUnlocks = async (): Promise<UnlockEvent[]> => {
  const data = await fetchJson('https://api.llama.fi/emissions');
  if (!Array.isArray(data)) return [];

  const now = Math.floor(Date.now() / 1000);
  const out: UnlockEvent[] = [];

  for (const p of data) {
    const events: any[] = p.events || [];
    const tokenPrice: number = p.tokenPrice || 0;
    const circulating: number = (p.circSupply || 0) * tokenPrice;
    if (!tokenPrice) continue;

    for (const e of events) {
      const ts = Number(e.timestamp || 0);
      if (ts <= now || ts > now + 365 * 86400) continue;
      const tokensUnlocked = Number(e.noOfTokens || 0);
      if (!tokensUnlocked) continue;
      const usd = tokensUnlocked * tokenPrice;
      if (usd < 200_000) continue;

      out.push({
        id: `${p.token || p.gecko_id || p.name}-${ts}`,
        symbol: (p.token || p.symbol || '').toUpperCase(),
        name: p.name || p.token || 'Unknown',
        logo: p.tokenImage || p.logo || '',
        unlockTs: ts,
        unlockUSD: usd,
        totalSupplyUSD: circulating,
        pctOfFloat: circulating > 0 ? (usd / circulating) * 100 : 0,
        category: (e.category || '').toLowerCase(),
        defillamaSlug: p.gecko_id || p.token,
      });
    }
  }

  return out.sort((a, b) => a.unlockTs - b.unlockTs);
};

const TokenUnlocksPage: React.FC = () => {
  const [events, setEvents] = useState<UnlockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'big'>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUnlocks();
      if (data.length === 0) {
        setError('Could not load unlocks data right now. Refresh in a moment.');
      }
      setEvents(data);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return events.filter(e => {
      if (filter === 'week' && e.unlockTs > now + 7 * 86400) return false;
      if (filter === 'month' && e.unlockTs > now + 30 * 86400) return false;
      if (filter === 'big' && e.unlockUSD < 10_000_000) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.symbol.toLowerCase().includes(q)) return false;
      }
      return true;
    }).slice(0, 100);
  }, [events, filter, query]);

  const next7d = events.filter(e => e.unlockTs - Math.floor(Date.now() / 1000) <= 7 * 86400);
  const total7d = next7d.reduce((s, e) => s + e.unlockUSD, 0);
  const biggestNext7 = [...next7d].sort((a, b) => b.unlockUSD - a.unlockUSD)[0];

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Crypto Token Unlock Calendar — Live Vesting Schedule | CoinsClarity</title>
        <meta
          name="description"
          content="Live token unlock calendar for 200+ crypto projects. See upcoming cliffs, unlock value in USD, percentage of circulating supply, and why it matters for price."
        />
        <link rel="canonical" href="https://coinsclarity.com/tools/unlocks" />
        <meta property="og:title" content="Crypto Token Unlock Calendar — Live Schedule" />
        <meta property="og:description" content="Upcoming token unlocks across 200+ projects, with USD values and supply impact." />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back"><ArrowLeft size={16} /> All tools</Link>

          <header className="tool-head">
            <span className="tool-eyebrow">Schedules</span>
            <h1 className="tool-title">Token Unlock Calendar</h1>
            <p className="tool-tagline">
              Upcoming token unlocks across 200+ crypto projects, ranked by USD value and percentage of circulating supply.
              Live data from DefiLlama, refreshed every 5 minutes.
            </p>
            <button className="tool-refresh" onClick={load} disabled={loading}>
              <RefreshCcw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Updating…' : 'Refresh'}
            </button>
          </header>

          {error && (
            <div className="tool-warn"><AlertTriangle size={16} /> {error}</div>
          )}

          {/* ── KPI strip ── */}
          <div className="ul-kpis">
            <div className="ul-kpi">
              <div className="ul-kpi__label">Next 7 days</div>
              <div className="ul-kpi__value">{fmtUsd(total7d)}</div>
              <div className="ul-kpi__sub">{next7d.length} events</div>
            </div>
            <div className="ul-kpi">
              <div className="ul-kpi__label">Biggest this week</div>
              <div className="ul-kpi__value">{biggestNext7 ? biggestNext7.symbol : '—'}</div>
              <div className="ul-kpi__sub">
                {biggestNext7 ? `${fmtUsd(biggestNext7.unlockUSD)} · ${biggestNext7.pctOfFloat.toFixed(1)}% of float` : 'No big unlocks'}
              </div>
            </div>
            <div className="ul-kpi">
              <div className="ul-kpi__label">Tracked tokens</div>
              <div className="ul-kpi__value">{new Set(events.map(e => e.symbol)).size}</div>
              <div className="ul-kpi__sub">Updated every 5 min</div>
            </div>
          </div>

          {/* ── Filter row ── */}
          <div className="ul-filters">
            <div className="ul-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search token (BTC, ARB, PYTH…)"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="ul-tabs">
              {(['all', 'week', 'month', 'big'] as const).map(f => (
                <button
                  key={f}
                  className={`ul-tab ${filter === f ? 'is-on' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All upcoming'
                    : f === 'week' ? 'Next 7 days'
                    : f === 'month' ? 'Next 30 days'
                    : 'Big ($10M+)'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Events table ── */}
          {loading && events.length === 0 ? (
            <>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="tool-skel" style={{ height: 60, marginBottom: 8 }} />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="tool-empty">
              <h3>No unlocks match those filters</h3>
              <p>Try widening the date range or clearing your search.</p>
            </div>
          ) : (
            <div className="ul-table-wrap">
              <table className="ul-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Unlock date</th>
                    <th>Countdown</th>
                    <th className="num">Unlock value</th>
                    <th className="num">% of float</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div className="ul-tok">
                          {e.logo
                            ? <img src={e.logo} alt={e.symbol} onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="ul-tok__placeholder">{e.symbol.slice(0, 2)}</span>}
                          <div>
                            <div className="ul-tok__sym">
                              {e.defillamaSlug
                                ? <Link to={`/coin/${e.defillamaSlug}`} style={{ color: 'inherit' }}>{e.symbol}</Link>
                                : e.symbol}
                            </div>
                            <div className="ul-tok__name">{e.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{fmtDate(e.unlockTs)}</td>
                      <td className="ul-countdown">{fmtCountdown(e.unlockTs)}</td>
                      <td className="num"><strong>{fmtUsd(e.unlockUSD)}</strong></td>
                      <td className={`num ${e.pctOfFloat >= 5 ? 'ul-hot' : e.pctOfFloat >= 2 ? 'ul-warm' : ''}`}>
                        {e.pctOfFloat.toFixed(2)}%
                      </td>
                      <td>{e.category || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="ul-source">
            Source: <a href="https://defillama.com/unlocks" target="_blank" rel="noopener noreferrer">DefiLlama Unlocks <ExternalLink size={11} /></a> ·
            Cross-reference with the project's own vesting docs before trading.
          </p>

          {/* ── Long-form prose for SEO + AdSense ── */}
          <section className="tool-prose">
            <h2>Why token unlocks matter</h2>
            <p>
              A "token unlock" is the moment when previously-locked supply becomes transferable. Most crypto projects launch
              with the majority of their supply sitting in vesting contracts — allocated to the team, investors, the
              ecosystem fund, and a community treasury. These tokens drip out over months or years on a schedule called the
              vesting curve. When a cliff hits, that drip turns into a flood: hundreds of millions of dollars of new
              supply enter the market in a single day.
            </p>
            <p>
              Unlocks matter because they almost always change the supply/demand math. A typical large unlock represents
              5–25% of the current circulating float, which is a lot of new sell pressure if even a fraction of recipients
              decide to take profit. Empirically, tokens with a major cliff in the next 30 days underperform peers by
              roughly 4–8% on a 30-day window, with the gap widening when the unlock is &gt;10% of float and the cohort is
              VC investors (who are typically the first to sell, since their cost basis is much lower than market price).
            </p>

            <h3>How to read this calendar</h3>
            <ul>
              <li><strong>Unlock value</strong> is the USD worth of newly-unlocked tokens at the current price. The bigger the number, the bigger the potential sell pressure.</li>
              <li><strong>% of float</strong> is the unlock as a percentage of the token's current circulating supply. Anything above 2% is meaningful, above 5% is significant, above 10% is potentially price-defining.</li>
              <li><strong>Category</strong> tells you who's getting the tokens. Team and investor unlocks tend to create the most sell pressure. Ecosystem and community unlocks are often spent or staked rather than dumped immediately.</li>
              <li><strong>Countdown</strong> is the live time remaining until the cliff. Use this to align trading decisions — many traders flat positions 24–48 hours before a major unlock.</li>
            </ul>

            <h3>Common unlock categories</h3>
            <p>
              Most projects break their token allocation into 4–6 categories, each with its own vesting curve. Knowing the
              category context tells you whether the unlock is likely to be sold, held, or used.
            </p>
            <ul>
              <li><strong>Team / founders</strong> — Usually 1–2 year cliff followed by 24–48 month linear vest. Tax loss harvesting and personal liquidity needs make team unlocks reliably price-suppressing for the first few cliffs.</li>
              <li><strong>Investors / private sale</strong> — Cost basis is usually 5–50× below current market. Even a partial sell is highly accretive for them. Tracker monitoring shows a clear sell-the-unlock pattern in the first 14 days post-cliff.</li>
              <li><strong>Ecosystem / liquidity</strong> — Often deployed into staking incentives, market-making, or grants. Doesn't hit spot order books directly but increases passive supply over time.</li>
              <li><strong>Community / airdrop</strong> — Heavily fragmented. Tens of thousands of small wallets each receive a portion. Some sell immediately, some never claim. Net impact is moderate.</li>
              <li><strong>Foundation / treasury</strong> — Used for OpEx and strategic spend. Usually market-sold gradually via OTC desks rather than CEX dumps.</li>
            </ul>

            <h3>How traders actually trade unlocks</h3>
            <p>
              The smart money playbook isn't to short into the unlock — that trade is too obvious and front-runners have
              priced it in by the time the date arrives. The cleaner edges are:
            </p>
            <ul>
              <li><strong>Avoid being long</strong> for 7 days before an unlock &gt; 5% of float. The expected value is negative.</li>
              <li><strong>Buy 3–10 days after</strong> a major cliff if the post-unlock dump completes without breaking key support. The "selling exhausted" reversal is a high-probability bounce setup.</li>
              <li><strong>Watch the funding rate</strong> in the perp market on unlock day. Persistently negative funding means traders have already shorted; the squeeze risk on any positive surprise is high.</li>
              <li><strong>Cross-reference with on-chain</strong>. If wallets receiving the unlocked tokens move them to exchanges within hours, sell pressure is imminent. If they go to staking contracts, the unlock is largely benign.</li>
            </ul>

            <h3>Limitations of this data</h3>
            <p>
              This calendar surfaces scheduled, on-chain-verifiable unlocks tracked by DefiLlama. It does <strong>not</strong>{' '}
              capture: (a) projects that release tokens via off-chain or multisig-controlled distributions outside a
              published vesting curve; (b) governance-decided emissions changes; (c) "stealth" unlocks that result from
              admin-controlled mint functions. For projects with non-transparent tokenomics, treat the absence of an entry
              here as missing data, not as proof of zero unlock pressure.
            </p>
          </section>

          <section className="tool-cross">
            <h3>Related tools</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/fear-greed" className="tool-cross-card">
                <h4>Fear &amp; Greed Index</h4><p>Gauge the macro mood before unlock days</p>
              </Link>
              <Link to="/tools/scam-check" className="tool-cross-card">
                <h4>Scam &amp; Honeypot Checker</h4><p>Verify token contract before any trade</p>
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

export default TokenUnlocksPage;
