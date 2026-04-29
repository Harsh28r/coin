import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Github,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCurrency } from '../context/CurrencyContext';
import WatchlistButton from './WatchlistButton';
import { resolveImageSrc, handleImageError } from '../utils/cryptoImages';
import AffiliateButtons from './AffiliateButtons';
import { coingeckoV3Url } from '../utils/coingeckoUrl';
import './CoinDetail.css';

type Timeframe = '1D' | '7D' | '30D' | '1Y' | 'MAX';

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  image: { large?: string; small?: string; thumb?: string } | string;
  market_cap_rank?: number;
  description?: { en?: string };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    twitter_screen_name?: string;
    subreddit_url?: string;
    chat_url?: string[];
    repos_url?: { github?: string[] };
  };
  market_data?: {
    current_price?: Record<string, number>;
    market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    fully_diluted_valuation?: Record<string, number>;
    high_24h?: Record<string, number>;
    low_24h?: Record<string, number>;
    ath?: Record<string, number>;
    ath_date?: Record<string, string>;
    ath_change_percentage?: Record<string, number>;
    atl?: Record<string, number>;
    atl_date?: Record<string, string>;
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
    price_change_percentage_1y?: number;
    circulating_supply?: number;
    total_supply?: number;
    max_supply?: number | null;
  };
}

interface ChartPoint {
  time: number;
  value: number;
}

const TF_TO_DAYS: Record<Timeframe, number | 'max'> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '1Y': 365,
  MAX: 'max',
};

const formatBig = (n?: number): string => {
  if (n === undefined || n === null || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatSupply = (n?: number | null): string => {
  if (n === undefined || n === null || !isFinite(n)) return '—';
  return Math.round(n).toLocaleString();
};

const safePct = (n?: number): number => (typeof n === 'number' && isFinite(n) ? n : 0);

const niceFmtPercent = (n?: number): string => {
  if (n === undefined || n === null || !isFinite(n)) return '0.00%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const formatRelativeDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const stripHostname = (url: string): string => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

// ── Custom SVG price chart ──────────────────────────────────────
interface PriceChartProps {
  data: ChartPoint[];
  width: number;
  height: number;
  timeframe: Timeframe;
  formatPrice: (v: number) => string;
  hover: { x: number; y: number; idx: number } | null;
  onHover: (h: { x: number; y: number; idx: number } | null) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, width, height, timeframe, formatPrice, hover, onHover }) => {
  const PAD_L = 8;
  const PAD_R = 64;
  const PAD_T = 18;
  const PAD_B = 28;

  const svgRef = useRef<SVGSVGElement>(null);

  const { pathLine, pathArea, minV, maxV, xs, ys } = useMemo(() => {
    if (!data.length) {
      return { pathLine: '', pathArea: '', minV: 0, maxV: 0, xs: [] as number[], ys: [] as number[] };
    }
    const values = data.map((p) => p.value);
    let mn = Math.min(...values);
    let mx = Math.max(...values);
    if (mn === mx) {
      mn = mn * 0.99;
      mx = mx * 1.01;
    }
    // Pad range a touch
    const range = mx - mn;
    mn -= range * 0.06;
    mx += range * 0.06;

    const innerW = Math.max(width - PAD_L - PAD_R, 50);
    const innerH = Math.max(height - PAD_T - PAD_B, 50);

    const xs: number[] = [];
    const ys: number[] = [];
    let line = '';
    for (let i = 0; i < data.length; i++) {
      const x = PAD_L + (i / (data.length - 1)) * innerW;
      const y = PAD_T + innerH - ((data[i].value - mn) / (mx - mn)) * innerH;
      xs.push(x);
      ys.push(y);
      line += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    const area = `${line} L ${xs[xs.length - 1].toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${xs[0].toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`;
    return { pathLine: line, pathArea: area, minV: mn, maxV: mx, xs, ys };
  }, [data, width, height]);

  const startVal = data[0]?.value ?? 0;
  const endVal = data[data.length - 1]?.value ?? 0;
  const isUp = endVal >= startVal;
  const stroke = isUp ? '#10b981' : '#ef4444';
  const gradId = isUp ? 'cdg-up' : 'cdg-down';
  const topColor = isUp ? 'rgba(16, 185, 129, 0.32)' : 'rgba(239, 68, 68, 0.32)';
  const botColor = isUp ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)';

  const yTicks = useMemo(() => {
    const n = 5;
    const out: { y: number; v: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const v = maxV - (i / n) * (maxV - minV);
      const y = PAD_T + (i / n) * (height - PAD_T - PAD_B);
      out.push({ y, v });
    }
    return out;
  }, [minV, maxV, height]);

  const xTickIndices = useMemo(() => {
    const target = 6;
    if (data.length <= target) return data.map((_, i) => i);
    const step = Math.max(1, Math.floor((data.length - 1) / (target - 1)));
    const out: number[] = [];
    for (let i = 0; i < data.length; i += step) out.push(i);
    if (out[out.length - 1] !== data.length - 1) out.push(data.length - 1);
    return out;
  }, [data]);

  const formatX = useCallback((time: number) => {
    const d = new Date(time * 1000);
    if (timeframe === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    if (timeframe === 'MAX' || timeframe === '1Y') return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, [timeframe]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !data.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const innerW = width - PAD_L - PAD_R;
    const ratio = (x - PAD_L) / innerW;
    if (ratio < 0 || ratio > 1) {
      onHover(null);
      return;
    }
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    onHover({ x: xs[idx], y: ys[idx], idx });
  };

  const handleLeave = () => onHover(null);

  if (!data.length) return null;

  const tooltip = hover && data[hover.idx];
  const tooltipX = hover ? Math.min(Math.max(hover.x + 10, 60), width - 120) : 0;
  const tooltipY = hover ? Math.max(hover.y - 60, 6) : 0;

  return (
    <svg
      ref={svgRef}
      className="cd-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={topColor} />
          <stop offset="100%" stopColor={botColor} />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => (
        <g key={`y${i}`}>
          <line
            x1={PAD_L}
            x2={width - PAD_R}
            y1={t.y}
            y2={t.y}
            stroke="var(--border, #e5e7eb)"
            strokeWidth={1}
            strokeDasharray={i === yTicks.length - 1 ? '0' : '3 3'}
            opacity={i === yTicks.length - 1 ? 1 : 0.4}
          />
          <text x={width - PAD_R + 6} y={t.y + 4} fontSize={11} fill="var(--text-muted, #6b7280)" fontFamily="Inter, sans-serif">
            {formatPrice(t.v)}
          </text>
        </g>
      ))}

      <path d={pathArea} fill={`url(#${gradId})`} />
      <path d={pathLine} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {xTickIndices.map((i) => (
        <text
          key={`x${i}`}
          x={xs[i]}
          y={height - 8}
          fontSize={11}
          fill="var(--text-muted, #6b7280)"
          fontFamily="Inter, sans-serif"
          textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
        >
          {formatX(data[i].time)}
        </text>
      ))}

      {hover && tooltip && (
        <g>
          <line x1={hover.x} x2={hover.x} y1={PAD_T} y2={height - PAD_B} stroke="#f97316" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
          <circle cx={hover.x} cy={hover.y} r={5} fill="#fff" stroke={stroke} strokeWidth={2} />
          <g transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect width={120} height={50} rx={8} fill="rgba(15, 23, 42, 0.92)" />
            <text x={10} y={20} fontSize={12} fill="#94a3b8" fontFamily="Inter, sans-serif">
              {new Date(tooltip.time * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </text>
            <text x={10} y={38} fontSize={13} fill="#ffffff" fontWeight={700} fontFamily="Inter, sans-serif">
              {formatPrice(tooltip.value)}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

const CoinDetail: React.FC = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { currency, formatPrice } = useCurrency();
  const cur = (currency || 'usd').toLowerCase();

  const [coin, setCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ w: 800, h: 380 });
  const [hover, setHover] = useState<{ x: number; y: number; idx: number } | null>(null);

  // ── Resilient JSON fetcher with cache + multi-proxy fallback ───
  const fetchJsonResilient = useCallback(async (path: string, ttlMs: number): Promise<any> => {
    const cacheKey = `cd:${path}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && cached.t && Date.now() - cached.t < ttlMs && cached.d) {
          return cached.d;
        }
      }
    } catch { /* ignore */ }

    const cgRel = path.startsWith('/api/v3/') ? path.slice(8) : path.replace(/^\/+/, '');
    const proxied = coingeckoV3Url(cgRel);
    const direct = `https://api.coingecko.com${path}`;
    const candidates = [
      proxied,
      direct,
      `https://corsproxy.io/?${encodeURIComponent(direct)}`,
      `https://c-back-seven.vercel.app${direct}`,
    ];
    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
        const json = await res.json();
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: json })); } catch { /* ignore */ }
        return json;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('All endpoints failed');
  }, []);

  // ── Fetch coin data ─────────────────────────────────────────────
  useEffect(() => {
    if (!coinId) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const path = `/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        const data = await fetchJsonResilient(path, 60_000);
        if (!cancelled) setCoin(data);
      } catch (err: any) {
        if (!cancelled) {
          console.error('coin fetch failed', err);
          setError('Live data unavailable. Showing cached metadata.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    const id = setInterval(run, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [coinId, fetchJsonResilient]);

  // ── Fetch chart series ──────────────────────────────────────────
  useEffect(() => {
    if (!coinId) return;
    let cancelled = false;

    const fetchChart = async () => {
      setChartLoading(true);
      setChartError(null);
      try {
        const days = TF_TO_DAYS[timeframe];
        const interval = timeframe === '1D' ? 'hourly' : 'daily';
        const path = `/api/v3/coins/${coinId}/market_chart?vs_currency=${cur}&days=${days}${days === 1 ? `&interval=${interval}` : ''}`;
        const ttl = timeframe === '1D' ? 60_000 : timeframe === '7D' ? 5 * 60_000 : 15 * 60_000;
        const data = await fetchJsonResilient(path, ttl);
        const prices: [number, number][] = data?.prices || [];
        if (!prices.length) throw new Error('empty series');
        // Dedupe timestamps (lightweight-charts requires monotonic, unique time)
        const seen = new Set<number>();
        const points: ChartPoint[] = [];
        for (const [ms, v] of prices) {
          const t = Math.floor(ms / 1000);
          if (seen.has(t)) continue;
          seen.add(t);
          if (typeof v === 'number' && isFinite(v)) {
            points.push({ time: t, value: v });
          }
        }
        points.sort((a, b) => a.time - b.time);
        if (!cancelled) setChartData(points);
      } catch (err: any) {
        if (!cancelled) {
          console.error('chart fetch failed', err);
          setChartError('Could not load chart data.');
          setChartData([]);
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    fetchChart();
    return () => { cancelled = true; };
  }, [coinId, cur, timeframe, fetchJsonResilient]);

  // ── Track chart container size ──────────────────────────────────
  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(el.clientWidth, 320);
      const h = Math.max(el.clientHeight, 280);
      setChartSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Derived view-model ──────────────────────────────────────────
  const md = coin?.market_data;
  const price = md?.current_price?.[cur] ?? md?.current_price?.usd;
  const marketCap = md?.market_cap?.[cur] ?? md?.market_cap?.usd;
  const volume = md?.total_volume?.[cur] ?? md?.total_volume?.usd;
  const fdv = md?.fully_diluted_valuation?.[cur] ?? md?.fully_diluted_valuation?.usd;
  const high24 = md?.high_24h?.[cur] ?? md?.high_24h?.usd;
  const low24 = md?.low_24h?.[cur] ?? md?.low_24h?.usd;
  const ath = md?.ath?.[cur] ?? md?.ath?.usd;
  const athDate = md?.ath_date?.[cur] ?? md?.ath_date?.usd;
  const athPct = md?.ath_change_percentage?.[cur] ?? md?.ath_change_percentage?.usd;
  const atl = md?.atl?.[cur] ?? md?.atl?.usd;
  const atlDate = md?.atl_date?.[cur] ?? md?.atl_date?.usd;
  const change24 = md?.price_change_percentage_24h;
  const change7 = md?.price_change_percentage_7d;
  const change30 = md?.price_change_percentage_30d;
  const change1y = md?.price_change_percentage_1y;
  const supplyCirc = md?.circulating_supply;
  const supplyTotal = md?.total_supply;
  const supplyMax = md?.max_supply ?? null;

  const supplyPct = supplyMax && supplyCirc ? Math.min(100, (supplyCirc / supplyMax) * 100) : null;

  const coinImage = useMemo(() => {
    if (!coin) return '';
    if (typeof coin.image === 'string') return coin.image;
    return coin.image?.large || coin.image?.small || coin.image?.thumb || '';
  }, [coin]);

  const description = useMemo(() => {
    const raw = coin?.description?.en || '';
    return raw.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
  }, [coin]);

  const shortDesc = useMemo(() => {
    if (!description) return '';
    const text = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length <= 320) return text;
    return text.slice(0, 320).replace(/\s\S*$/, '') + '…';
  }, [description]);

  const homepage = coin?.links?.homepage?.find((u) => !!u && /^https?:\/\//i.test(u));
  const explorer = coin?.links?.blockchain_site?.find((u) => !!u && /^https?:\/\//i.test(u));
  const twitter = coin?.links?.twitter_screen_name;
  const subreddit = coin?.links?.subreddit_url;
  const github = coin?.links?.repos_url?.github?.find((u) => !!u);

  // ── Render ──────────────────────────────────────────────────────
  if (loading && !coin) {
    return (
      <div className="cd-shell">
        <div className="cd-container cd-skel">
          <div className="cd-skel__back" />
          <div className="cd-skel__head">
            <div className="cd-skel__avatar" />
            <div className="cd-skel__title" />
          </div>
          <div className="cd-skel__price" />
          <div className="cd-skel__stats">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="cd-skel__stat" />
            ))}
          </div>
          <div className="cd-skel__chart" />
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="cd-shell">
        <div className="cd-container cd-empty">
          <h1>Couldn't find “{coinId}”.</h1>
          <p>{error || 'CoinGecko returned no data for this asset.'}</p>
          <button className="cd-btn cd-btn--ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back home
          </button>
        </div>
      </div>
    );
  }

  const change24Class = safePct(change24) >= 0 ? 'is-up' : 'is-down';

  return (
    <div className="cd-shell">
      <Helmet>
        <title>{coin.name} ({coin.symbol?.toUpperCase()}) Price, Chart & Market Cap | CoinsClarity</title>
        <meta name="description" content={`Live ${coin.name} (${coin.symbol?.toUpperCase()}) price, chart and market data.`} />
      </Helmet>

      <div className="cd-topbar">
        <div className="cd-container cd-topbar__inner">
          <button className="cd-back" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={16} /> Back
          </button>
          <Link to="/" className="cd-crumbs">
            <span>Home</span>
            <span className="cd-crumbs__sep">/</span>
            <span>Markets</span>
            <span className="cd-crumbs__sep">/</span>
            <strong>{coin.name}</strong>
          </Link>
          <div className="cd-topbar__refresh">
            <RefreshCw size={14} />
            <span>Live · refreshes every 60s</span>
          </div>
        </div>
      </div>

      <div className="cd-container cd-main">
        {error && (
          <div className="cd-banner cd-banner--warn">
            <span>{error}</span>
          </div>
        )}

        {/* HERO */}
        <header className="cd-hero">
          <div className="cd-hero__id">
            <img
              className="cd-hero__logo"
              src={resolveImageSrc(coinImage, coin.name, 'coin')}
              alt={coin.name}
              loading="eager"
              onError={(e) => handleImageError(e, coin.name, 'coin')}
            />
            <div className="cd-hero__meta">
              <h1 className="cd-hero__name">
                {coin.name}
                <span className="cd-hero__symbol">{coin.symbol?.toUpperCase()}</span>
              </h1>
              {coin.market_cap_rank ? <span className="cd-hero__rank">Rank #{coin.market_cap_rank}</span> : null}
            </div>
          </div>

          <div className="cd-hero__price-block">
            <div className="cd-hero__price">
              {price !== undefined ? formatPrice(price) : '—'}
            </div>
            <div className={`cd-hero__change ${change24Class}`}>
              {safePct(change24) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {niceFmtPercent(change24)}
              <span className="cd-hero__change-label">24h</span>
            </div>
          </div>

          <div className="cd-hero__actions">
            <WatchlistButton
              coin={{
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                image: coinImage,
                priceAtAdd: price,
              }}
              variant="button"
            />
          </div>
        </header>

        {/* PERFORMANCE STRIP */}
        <section className="cd-perf">
          {[
            { label: '24h', val: change24 },
            { label: '7d', val: change7 },
            { label: '30d', val: change30 },
            { label: '1y', val: change1y },
          ].map((p) => (
            <div key={p.label} className={`cd-perf__cell ${safePct(p.val) >= 0 ? 'is-up' : 'is-down'}`}>
              <span className="cd-perf__label">{p.label}</span>
              <span className="cd-perf__value">{niceFmtPercent(p.val)}</span>
            </div>
          ))}
        </section>

        {/* CHART */}
        <section className="cd-card cd-chart">
          <div className="cd-chart__head">
            <div>
              <h2>Price chart</h2>
              <p>{coin.name} · {timeframe === 'MAX' ? 'all time' : timeframe}</p>
            </div>
            <div className="cd-tabs">
              {(['1D', '7D', '30D', '1Y', 'MAX'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`cd-tab ${timeframe === tf ? 'is-active' : ''}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="cd-chart__canvas" ref={chartWrapRef}>
            {chartData.length > 1 ? (
              <PriceChart
                data={chartData}
                width={chartSize.w}
                height={chartSize.h}
                timeframe={timeframe}
                formatPrice={(v) => formatPrice(v)}
                hover={hover}
                onHover={setHover}
              />
            ) : !chartLoading && !chartError ? (
              <div className="cd-chart__overlay">
                <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: 13 }}>No chart data.</p>
              </div>
            ) : null}
            {chartLoading && (
              <div className="cd-chart__overlay">
                <div className="cd-spinner" />
              </div>
            )}
            {chartError && !chartLoading && (
              <div className="cd-chart__overlay cd-chart__error">
                <p>{chartError}</p>
                <button className="cd-btn cd-btn--ghost" onClick={() => setTimeframe(timeframe)}>Retry</button>
              </div>
            )}
          </div>
        </section>

        {/* STATS */}
        <section className="cd-stats">
          <div className="cd-stat">
            <span className="cd-stat__label">Market cap</span>
            <span className="cd-stat__value">{marketCap !== undefined ? formatPrice(marketCap) : '—'}</span>
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">24h volume</span>
            <span className="cd-stat__value">{volume !== undefined ? formatPrice(volume) : '—'}</span>
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">Fully diluted valuation</span>
            <span className="cd-stat__value">{fdv !== undefined ? formatPrice(fdv) : '—'}</span>
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">24h range</span>
            <span className="cd-stat__value cd-stat__value--small">
              {low24 !== undefined ? formatPrice(low24) : '—'} – {high24 !== undefined ? formatPrice(high24) : '—'}
            </span>
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">All-time high</span>
            <span className="cd-stat__value">{ath !== undefined ? formatPrice(ath) : '—'}</span>
            {athPct !== undefined && (
              <span className={`cd-stat__sub ${safePct(athPct) >= 0 ? 'is-up' : 'is-down'}`}>
                {niceFmtPercent(athPct)} {athDate ? `· ${formatRelativeDate(athDate)}` : ''}
              </span>
            )}
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">All-time low</span>
            <span className="cd-stat__value">{atl !== undefined ? formatPrice(atl) : '—'}</span>
            {atlDate && <span className="cd-stat__sub">{formatRelativeDate(atlDate)}</span>}
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">Circulating supply</span>
            <span className="cd-stat__value">{formatSupply(supplyCirc)} <small>{coin.symbol?.toUpperCase()}</small></span>
            {supplyPct !== null && (
              <div className="cd-supply">
                <div className="cd-supply__bar"><div style={{ width: `${supplyPct}%` }} /></div>
                <span>{supplyPct.toFixed(1)}% of max</span>
              </div>
            )}
          </div>
          <div className="cd-stat">
            <span className="cd-stat__label">Total / Max supply</span>
            <span className="cd-stat__value cd-stat__value--small">
              {formatSupply(supplyTotal)} / {supplyMax ? formatSupply(supplyMax) : '∞'}
            </span>
          </div>
        </section>

        {/* WHERE TO BUY (affiliate revenue) */}
        <AffiliateButtons symbol={coin.symbol} coinName={coin.name} />

        {/* ABOUT + LINKS */}
        <section className="cd-grid">
          {description && (
            <div className="cd-card cd-about">
              <h2>About {coin.name}</h2>
              <div
                className={`cd-prose ${showFullDesc ? '' : 'is-clamped'}`}
                dangerouslySetInnerHTML={{ __html: showFullDesc ? description : `<p>${shortDesc}</p>` }}
              />
              {description.length > 320 && (
                <button className="cd-link" onClick={() => setShowFullDesc((v) => !v)}>
                  {showFullDesc ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          <aside className="cd-card cd-links">
            <h3>Links</h3>
            <ul>
              {homepage && (
                <li>
                  <a href={homepage} target="_blank" rel="noopener noreferrer">
                    <Globe size={16} /> <span>{stripHostname(homepage)}</span> <ExternalLink size={12} />
                  </a>
                </li>
              )}
              {explorer && (
                <li>
                  <a href={explorer} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} /> <span>{stripHostname(explorer)}</span> <ExternalLink size={12} />
                  </a>
                </li>
              )}
              {twitter && (
                <li>
                  <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer">
                    <Twitter size={16} /> <span>@{twitter}</span> <ExternalLink size={12} />
                  </a>
                </li>
              )}
              {subreddit && (
                <li>
                  <a href={subreddit} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} /> <span>Reddit</span> <ExternalLink size={12} />
                  </a>
                </li>
              )}
              {github && (
                <li>
                  <a href={github} target="_blank" rel="noopener noreferrer">
                    <Github size={16} /> <span>GitHub</span> <ExternalLink size={12} />
                  </a>
                </li>
              )}
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default CoinDetail;
