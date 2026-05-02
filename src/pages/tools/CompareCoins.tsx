import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import AffiliateButtons from '../../Components/AffiliateButtons';
import AdSenseSlot from '../../Components/AdSenseSlot';
import './tools.css';
import { coingeckoV3Url } from '../../utils/coingeckoUrl';

interface CoinSearchHit {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
  market_cap_rank?: number;
}

interface CoinFull {
  id: string;
  name: string;
  symbol: string;
  image: string;
  rank: number;
  price: number;
  marketCap: number;
  volume: number;
  fdv: number;
  ath: number;
  atl: number;
  change24h: number;
  change7d: number;
  change30d: number;
  change1y: number;
  circulating: number;
  total: number;
  max: number | null;
  description: string;
  homepage: string;
  genesis: string;
}

const fmtBig = (n?: number): string => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(2);
};
const fmtSupply = (n?: number | null): string => {
  if (n == null || isNaN(n as number)) return '—';
  const v = n as number;
  if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9)  return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6)  return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3)  return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(0);
};
const fmtPrice = (n?: number): string => {
  if (n == null || isNaN(n)) return '—';
  if (n < 0.01) return '$' + n.toFixed(6);
  if (n < 1) return '$' + n.toFixed(4);
  if (n < 100) return '$' + n.toFixed(2);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};
const fmtPct = (n?: number): { text: string; up: boolean } => {
  if (n == null || isNaN(n)) return { text: '—', up: true };
  return { text: (n >= 0 ? '+' : '') + n.toFixed(2) + '%', up: n >= 0 };
};

const PROXY = 'https://corsproxy.io/?';
const fetchJson = async (url: string, ttl = 5 * 60 * 1000): Promise<any> => {
  const cacheKey = `cmp:${url}`;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < ttl) return data;
    }
  } catch {}
  const tries = [url, `${PROXY}${encodeURIComponent(url)}`];
  for (const t of tries) {
    try {
      const res = await fetch(t, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const j = await res.json();
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: j })); } catch {}
      return j;
    } catch {}
  }
  return null;
};

const fetchCoin = async (id: string): Promise<CoinFull | null> => {
  const j = await fetchJson(
    coingeckoV3Url(
      `coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
    ),
  );
  if (!j) return null;
  const m = j.market_data || {};
  const usd = (o: any) => (o?.usd ?? null);
  return {
    id: j.id,
    name: j.name,
    symbol: (j.symbol || '').toUpperCase(),
    image: j.image?.large || j.image?.small || '',
    rank: j.market_cap_rank,
    price: usd(m.current_price),
    marketCap: usd(m.market_cap),
    volume: usd(m.total_volume),
    fdv: usd(m.fully_diluted_valuation),
    ath: usd(m.ath),
    atl: usd(m.atl),
    change24h: m.price_change_percentage_24h,
    change7d: m.price_change_percentage_7d,
    change30d: m.price_change_percentage_30d,
    change1y: m.price_change_percentage_1y,
    circulating: m.circulating_supply,
    total: m.total_supply,
    max: m.max_supply,
    description: (j.description?.en || '').replace(/<[^>]+>/g, '').split('. ').slice(0, 3).join('. '),
    homepage: j.links?.homepage?.[0] || '',
    genesis: j.genesis_date || '',
  };
};

// Search for a coin by name/symbol — used by autocomplete pickers.
const searchCoins = async (q: string): Promise<CoinSearchHit[]> => {
  if (!q || q.length < 2) return [];
  const j = await fetchJson(coingeckoV3Url(`search?query=${encodeURIComponent(q)}`), 60_000);
  return (j?.coins || []).slice(0, 8);
};

const slugFromUrl = (slug?: string): [string, string] | null => {
  if (!slug) return null;
  const parts = slug.toLowerCase().split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
};

const CompareCoinsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const initialIds = useMemo(() => slugFromUrl(slug) || ['bitcoin', 'ethereum'], [slug]);
  const [coinA, setCoinA] = useState<CoinFull | null>(null);
  const [coinB, setCoinB] = useState<CoinFull | null>(null);
  const [loading, setLoading] = useState(true);

  // Picker state
  const [qA, setQA] = useState('');
  const [qB, setQB] = useState('');
  const [hitsA, setHitsA] = useState<CoinSearchHit[]>([]);
  const [hitsB, setHitsB] = useState<CoinSearchHit[]>([]);
  const debounceA = useRef<any>(null);
  const debounceB = useRef<any>(null);

  const load = useCallback(async (idA: string, idB: string) => {
    setLoading(true);
    const [a, b] = await Promise.all([fetchCoin(idA), fetchCoin(idB)]);
    setCoinA(a); setCoinB(b); setLoading(false);
  }, []);

  useEffect(() => {
    load(initialIds[0], initialIds[1]);
  }, [initialIds, load]);

  const onPickA = (id: string) => {
    setHitsA([]); setQA('');
    if (coinB) navigate(`/compare/${id}-vs-${coinB.id}`);
    else navigate(`/compare/${id}-vs-ethereum`);
  };
  const onPickB = (id: string) => {
    setHitsB([]); setQB('');
    if (coinA) navigate(`/compare/${coinA.id}-vs-${id}`);
    else navigate(`/compare/bitcoin-vs-${id}`);
  };

  useEffect(() => {
    if (debounceA.current) clearTimeout(debounceA.current);
    if (!qA) { setHitsA([]); return; }
    debounceA.current = setTimeout(() => searchCoins(qA).then(setHitsA), 300);
  }, [qA]);
  useEffect(() => {
    if (debounceB.current) clearTimeout(debounceB.current);
    if (!qB) { setHitsB([]); return; }
    debounceB.current = setTimeout(() => searchCoins(qB).then(setHitsB), 300);
  }, [qB]);

  const swap = () => {
    if (coinA && coinB) navigate(`/compare/${coinB.id}-vs-${coinA.id}`);
  };

  // Derived: who wins each metric (higher is better unless inverted)
  const cmp = (a?: number, b?: number, higherIsBetter = true): 'a' | 'b' | 'tie' => {
    if (a == null || b == null || isNaN(a) || isNaN(b)) return 'tie';
    if (a === b) return 'tie';
    const aWins = higherIsBetter ? a > b : a < b;
    return aWins ? 'a' : 'b';
  };

  const titleText = coinA && coinB
    ? `${coinA.name} vs ${coinB.name} — Price, Market Cap & Performance Compared`
    : 'Compare Crypto Coins Side-by-Side';
  const descText = coinA && coinB
    ? `Compare ${coinA.name} (${coinA.symbol}) and ${coinB.name} (${coinB.symbol}) on price, market cap, supply, all-time-high, 24h / 7d / 30d / 1-year performance and more. Live data, updated every 5 minutes.`
    : 'Compare any two cryptocurrencies side-by-side. Price, market cap, supply, ATH, 24h-1y returns. Live, free, no signup.';

  const canonical = coinA && coinB
    ? `https://coinsclarity.com/compare/${coinA.id}-vs-${coinB.id}`
    : 'https://coinsclarity.com/compare';

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>{titleText} | CoinsClarity</title>
        <meta name="description" content={descText} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={titleText} />
        <meta property="og:description" content={descText} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back"><ArrowLeft size={16} /> All tools</Link>

          <header className="tool-head">
            <span className="tool-eyebrow">Side by side</span>
            <h1 className="tool-title">
              {coinA && coinB
                ? <>{coinA.name} <span style={{ color: 'var(--accent, #e85d2c)' }}>vs</span> {coinB.name}</>
                : 'Compare Crypto Coins'}
            </h1>
            <p className="tool-tagline">
              Live, side-by-side fundamentals for any two cryptocurrencies. Pick from 12,000+ assets, get an instant
              comparison across market cap, supply, performance and reach.
            </p>
          </header>

          <div className="cmp-pickers">
            <div className="cmp-picker">
              <input
                type="text"
                placeholder={coinA ? `${coinA.name} — type to change` : 'Pick first coin…'}
                value={qA}
                onChange={e => setQA(e.target.value)}
              />
              {hitsA.length > 0 && (
                <div className="cmp-suggestions">
                  {hitsA.map(h => (
                    <div key={h.id} className="cmp-suggestion" onClick={() => onPickA(h.id)}>
                      <img src={h.thumb} alt="" />
                      <span><strong>{h.symbol.toUpperCase()}</strong> {h.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="cmp-vs" onClick={swap} title="Swap coins" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <ArrowLeftRight size={20} />
            </button>

            <div className="cmp-picker">
              <input
                type="text"
                placeholder={coinB ? `${coinB.name} — type to change` : 'Pick second coin…'}
                value={qB}
                onChange={e => setQB(e.target.value)}
              />
              {hitsB.length > 0 && (
                <div className="cmp-suggestions">
                  {hitsB.map(h => (
                    <div key={h.id} className="cmp-suggestion" onClick={() => onPickB(h.id)}>
                      <img src={h.thumb} alt="" />
                      <span><strong>{h.symbol.toUpperCase()}</strong> {h.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading && (
            <>
              <div className="tool-skel" style={{ height: 50, marginBottom: 12 }} />
              <div className="tool-skel" style={{ height: 50, marginBottom: 12 }} />
              <div className="tool-skel" style={{ height: 50, marginBottom: 12 }} />
              <div className="tool-skel" style={{ height: 50, marginBottom: 12 }} />
              <div className="tool-skel" style={{ height: 50, marginBottom: 12 }} />
            </>
          )}

          {!loading && coinA && coinB && (
            <table className="cmp-table">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>Metric</th>
                  <th>
                    <Link to={`/coin/${coinA.id}`} className="cmp-coin-head" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <img src={coinA.image} alt={coinA.name} />
                      <span>{coinA.name} <small>({coinA.symbol})</small></span>
                    </Link>
                  </th>
                  <th>
                    <Link to={`/coin/${coinB.id}`} className="cmp-coin-head" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <img src={coinB.image} alt={coinB.name} />
                      <span>{coinB.name} <small>({coinB.symbol})</small></span>
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Rank',         a: coinA.rank,        b: coinB.rank,        fmt: (n: any) => n ? `#${n}` : '—', better: 'lower' },
                  { label: 'Price',        a: coinA.price,       b: coinB.price,       fmt: fmtPrice,    better: null },
                  { label: 'Market cap',   a: coinA.marketCap,   b: coinB.marketCap,   fmt: fmtBig,      better: 'higher' },
                  { label: '24h volume',   a: coinA.volume,      b: coinB.volume,      fmt: fmtBig,      better: 'higher' },
                  { label: 'FDV',          a: coinA.fdv,         b: coinB.fdv,         fmt: fmtBig,      better: null },
                  { label: 'All-time high',a: coinA.ath,         b: coinB.ath,         fmt: fmtPrice,    better: null },
                  { label: 'All-time low', a: coinA.atl,         b: coinB.atl,         fmt: fmtPrice,    better: null },
                  { label: '24h change',   a: coinA.change24h,   b: coinB.change24h,   fmt: (n: any) => fmtPct(n).text, better: 'higher', isPct: true },
                  { label: '7d change',    a: coinA.change7d,    b: coinB.change7d,    fmt: (n: any) => fmtPct(n).text, better: 'higher', isPct: true },
                  { label: '30d change',   a: coinA.change30d,   b: coinB.change30d,   fmt: (n: any) => fmtPct(n).text, better: 'higher', isPct: true },
                  { label: '1y change',    a: coinA.change1y,    b: coinB.change1y,    fmt: (n: any) => fmtPct(n).text, better: 'higher', isPct: true },
                  { label: 'Circulating',  a: coinA.circulating, b: coinB.circulating, fmt: fmtSupply,   better: null },
                  { label: 'Max supply',   a: coinA.max,         b: coinB.max,         fmt: (n: any) => n == null ? '∞' : fmtSupply(n), better: null },
                ].map((row, idx) => {
                  const winner = row.better ? cmp(row.a as any, row.b as any, row.better === 'higher') : 'tie';
                  return (
                    <tr key={idx}>
                      <td className="cmp-metric">{row.label}</td>
                      <td className={winner === 'a' ? 'cmp-winner' : ''}>{row.fmt(row.a)}</td>
                      <td className={winner === 'b' ? 'cmp-winner' : ''}>{row.fmt(row.b)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && coinA && coinB && (
            <AdSenseSlot placement="compare-mid" size="in-article" lazy />
          )}

          {!loading && coinA && coinB && (
            <>
              <AffiliateButtons symbol={coinA.symbol} coinName={`${coinA.name} or ${coinB.name}`} />
            </>
          )}

          {!loading && coinA && coinB && (
            <section className="tool-prose">
              <h2>{coinA.name} vs {coinB.name}: which is better?</h2>
              <p>
                {coinA.name} ({coinA.symbol}) currently trades at <strong>{fmtPrice(coinA.price)}</strong> with a market
                cap of <strong>{fmtBig(coinA.marketCap)}</strong>, while {coinB.name} ({coinB.symbol}) sits at{' '}
                <strong>{fmtPrice(coinB.price)}</strong> with a <strong>{fmtBig(coinB.marketCap)}</strong> cap.{' '}
                {coinA.marketCap > coinB.marketCap
                  ? `${coinA.name} is the larger asset by ${(coinA.marketCap / coinB.marketCap).toFixed(1)}x.`
                  : `${coinB.name} is the larger asset by ${(coinB.marketCap / coinA.marketCap).toFixed(1)}x.`}
              </p>
              <p>
                Over the last year, {coinA.name} has {coinA.change1y >= 0 ? 'gained' : 'lost'}{' '}
                <strong>{Math.abs(coinA.change1y || 0).toFixed(1)}%</strong> while {coinB.name} has{' '}
                {coinB.change1y >= 0 ? 'gained' : 'lost'}{' '}
                <strong>{Math.abs(coinB.change1y || 0).toFixed(1)}%</strong>. In the last 30 days the spread is{' '}
                <strong>{((coinA.change30d || 0) - (coinB.change30d || 0)).toFixed(1)}%</strong> in favour of{' '}
                {(coinA.change30d || 0) > (coinB.change30d || 0) ? coinA.name : coinB.name}.
              </p>

              <h3>About {coinA.name}</h3>
              <p>{coinA.description || `${coinA.name} (${coinA.symbol}) is a cryptocurrency listed in our database. Visit its dedicated coin page for full information.`}</p>

              <h3>About {coinB.name}</h3>
              <p>{coinB.description || `${coinB.name} (${coinB.symbol}) is a cryptocurrency listed in our database. Visit its dedicated coin page for full information.`}</p>

              <h3>How to use this comparison</h3>
              <p>
                Side-by-side numbers tell you about the present, not the future. Use this page to anchor questions, not to
                answer them. Three honest framings:
              </p>
              <ul>
                <li>
                  <strong>Liquidity.</strong> The asset with higher 24h volume relative to its market cap typically has
                  tighter spreads and easier large-position entry/exit.
                </li>
                <li>
                  <strong>Inflation risk.</strong> Compare circulating to max supply. A ratio close to 1 means most tokens
                  are already in the market — fewer surprises from unlocks. Far from 1 means significant supply still has
                  to enter circulation, which is structural sell pressure.
                </li>
                <li>
                  <strong>FDV gap.</strong> If FDV is dramatically higher than market cap, future dilution is large and
                  every long-term holder is competing with team / VC / ecosystem unlocks.
                </li>
              </ul>

              <p style={{ fontSize: 12, color: 'var(--text-muted, #525866)', marginTop: 24 }}>
                <em>This page is informational only. Nothing on it is financial advice. Always do your own research.</em>
              </p>
            </section>
          )}

          {!loading && coinA && coinB && (
            <AdSenseSlot placement="compare-btf" size="tools" lazy />
          )}

          <section className="tool-cross">
            <h3>Popular comparisons</h3>
            <div className="tool-cross-grid">
              {[
                ['bitcoin', 'ethereum', 'BTC vs ETH', 'The two pillars of crypto'],
                ['ethereum', 'solana', 'ETH vs SOL', 'Mainstays of smart contracts'],
                ['bitcoin', 'solana', 'BTC vs SOL', 'Store of value vs throughput'],
                ['ethereum', 'cardano', 'ETH vs ADA', 'Smart contract platforms'],
                ['solana', 'avalanche-2', 'SOL vs AVAX', 'High-throughput L1s'],
                ['ripple', 'stellar', 'XRP vs XLM', 'Cross-border payments rails'],
              ].map(([a, b, label, dek]) => (
                <Link key={`${a}-${b}`} to={`/compare/${a}-vs-${b}`} className="tool-cross-card">
                  <h4>{label}</h4><p>{dek}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CompareCoinsPage;
