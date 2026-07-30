import axios from 'axios';
import { buildRssBackendBases, joinBackendPath } from '../utils/rssBackendBases';
import { coingeckoV3Url } from '../utils/coingeckoUrl';

const arbBases = (): string[] =>
  buildRssBackendBases(
    process.env.REACT_APP_ARBITRAGE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL,
  );

async function axiosGetFirst<T = any>(
  pathWithQuery: string,
  timeout = 10000,
  headers?: Record<string, string>,
): Promise<T | null> {
  const p = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  for (const base of arbBases()) {
    try {
      const url = joinBackendPath(base, p);
      const response = await axios.get<T>(url, { timeout, headers });
      return response.data;
    } catch {
      /* try next mirror */
    }
  }
  return null;
}

const BINANCE_TICKER_URL = 'https://api.binance.com/api/v3/ticker/price';

const BASE_CURRENCIES = ['BTC', 'ETH', 'USDT', 'BNB'];
const INTERMEDIATE_CURRENCIES = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'USDT', 'USDC'];

const CG_COINS: { id: string; symbol: string }[] = [
  { id: 'bitcoin', symbol: 'BTC/USDT' },
  { id: 'ethereum', symbol: 'ETH/USDT' },
  { id: 'solana', symbol: 'SOL/USDT' },
  { id: 'ripple', symbol: 'XRP/USDT' },
  { id: 'cardano', symbol: 'ADA/USDT' },
  { id: 'dogecoin', symbol: 'DOGE/USDT' },
  { id: 'binancecoin', symbol: 'BNB/USDT' },
  { id: 'avalanche-2', symbol: 'AVAX/USDT' },
  { id: 'chainlink', symbol: 'LINK/USDT' },
  { id: 'polkadot', symbol: 'DOT/USDT' },
];

function toNum(v: unknown, fallback = NaN): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isStubId(id: unknown, prefix: string): boolean {
  return typeof id === 'string' && new RegExp(`^${prefix}-\\d+$`).test(id);
}

/** Map camify stub / real Mongo docs → SPA shape */
function normalizeCrossOpp(raw: any): ArbitrageOpportunity | null {
  if (!raw || typeof raw !== 'object') return null;
  const symbol = String(raw.symbol || raw.pair || '').trim();
  if (!symbol) return null;

  const buyPrice = toNum(raw.buyPrice);
  const sellPrice = toNum(raw.sellPrice);
  if (!Number.isFinite(buyPrice) || !Number.isFinite(sellPrice) || buyPrice <= 0) return null;

  let profitPercent = toNum(raw.profitPercent);
  if (!Number.isFinite(profitPercent)) {
    const spread = toNum(raw.spread);
    if (Number.isFinite(spread)) profitPercent = spread;
    else profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;
  }

  let netProfitPercent = toNum(raw.netProfitPercent);
  if (!Number.isFinite(netProfitPercent)) netProfitPercent = profitPercent;

  let profitAmount = toNum(raw.profitAmount);
  if (!Number.isFinite(profitAmount)) {
    const stubProfit = toNum(raw.profit);
    profitAmount = Number.isFinite(stubProfit) ? stubProfit : (1000 * netProfitPercent) / 100;
  }

  const volume24h = toNum(raw.volume24h, 0);
  const createdAt = String(raw.createdAt || raw.timestamp || new Date().toISOString());

  return {
    _id: String(raw._id || raw.id || `${symbol}-${raw.buyExchange}-${raw.sellExchange}`),
    symbol,
    buyExchange: String(raw.buyExchange || '—'),
    buyPrice,
    sellExchange: String(raw.sellExchange || '—'),
    sellPrice,
    profitPercent,
    netProfitPercent,
    profitAmount,
    volume24h,
    liquidity: (raw.liquidity as ArbitrageOpportunity['liquidity']) || 'medium',
    status: (raw.status as ArbitrageOpportunity['status']) || 'active',
    createdAt,
    expiresAt: String(raw.expiresAt || new Date(Date.now() + 120000).toISOString()),
  };
}

function normalizeTriOpp(raw: any): TriangularOpportunity | null {
  if (!raw || typeof raw !== 'object') return null;

  // Full server / client shape
  if (raw.path && raw.step1 && raw.step2 && raw.step3) {
    return {
      _id: String(raw._id || raw.id),
      exchange: String(raw.exchange || 'binance').toLowerCase(),
      baseCurrency: String(raw.baseCurrency || String(raw.path).split(/[→>]/)[0] || 'BTC').trim()),
      path: String(raw.path),
      pairs: Array.isArray(raw.pairs) ? raw.pairs : [],
      step1: raw.step1,
      step2: raw.step2,
      step3: raw.step3,
      startAmount: toNum(raw.startAmount, 1),
      endAmount: toNum(raw.endAmount, 1),
      profitPercent: toNum(raw.profitPercent, 0),
      netProfitPercent: toNum(raw.netProfitPercent, toNum(raw.profitPercent, 0)),
      profitAmount: toNum(raw.profitAmount, 0),
      tradingFees: raw.tradingFees || { step1Fee: 0.1, step2Fee: 0.1, step3Fee: 0.1, totalFee: 0.3 },
      status: (raw.status as TriangularOpportunity['status']) || 'active',
      createdAt: String(raw.createdAt || raw.timestamp || new Date().toISOString()),
      expiresAt: String(raw.expiresAt || new Date(Date.now() + 120000).toISOString()),
    };
  }

  // Camify stub: { id, exchange, path: "BTC→ETH→USDT→BTC", profit, volume, timestamp }
  const pathRaw = String(raw.path || '');
  const legs = pathRaw.split(/[→>]/).map((s) => s.trim()).filter(Boolean);
  if (legs.length < 3) return null;

  const profit = toNum(raw.profit ?? raw.netProfitPercent ?? raw.profitPercent, 0);
  const volume = toNum(raw.volume ?? raw.volume24h, 0);
  const base = legs[0];
  const pairs =
    legs.length >= 4
      ? [`${legs[0]}${legs[1]}`, `${legs[1]}${legs[2]}`, `${legs[2]}${legs[3]}`]
      : [`${legs[0]}${legs[1]}`, `${legs[1]}${legs[2]}`, `${legs[2]}${legs[0]}`];

  const path =
    legs.length >= 4
      ? `${legs[0]} → ${legs[1]} → ${legs[2]} → ${legs[3]}`
      : `${legs[0]} → ${legs[1]} → ${legs[2]} → ${legs[0]}`;

  return {
    _id: String(raw._id || raw.id || `tri-${path}`),
    exchange: String(raw.exchange || 'binance').toLowerCase(),
    baseCurrency: base,
    path,
    pairs,
    step1: { pair: pairs[0], price: 0, direction: 'forward' },
    step2: { pair: pairs[1], price: 0, direction: 'forward' },
    step3: { pair: pairs[2], price: 0, direction: 'forward' },
    startAmount: 1,
    endAmount: 1 + profit / 100,
    profitPercent: profit,
    netProfitPercent: profit,
    profitAmount: (1000 * profit) / 100,
    tradingFees: { step1Fee: 0.1, step2Fee: 0.1, step3Fee: 0.1, totalFee: 0.3 },
    status: 'active',
    createdAt: String(raw.createdAt || raw.timestamp || new Date().toISOString()),
    expiresAt: new Date(Date.now() + 120000).toISOString(),
  };
}

function normalizeCrossStats(raw: any): ArbitrageStats {
  if (!raw || typeof raw !== 'object') return { ...defaultCrossStats };
  return {
    totalOpportunities: toNum(raw.totalOpportunities, 0),
    activeOpportunities: toNum(raw.activeOpportunities, toNum(raw.totalOpportunities, 0)),
    averageProfitPercent: String(
      raw.averageProfitPercent ?? raw.avgSpread ?? raw.avgProfit ?? '0.00',
    ),
    maxProfitPercent: String(raw.maxProfitPercent ?? raw.avgSpread ?? '0.00'),
    mostProfitablePair: raw.mostProfitablePair || raw.topPairs?.[0],
    period: String(raw.period || 'Last 7 days'),
  };
}

function normalizeTriStats(raw: any): TriangularStats {
  if (!raw || typeof raw !== 'object') return { ...defaultTriangularStats };
  return {
    totalOpportunities: toNum(raw.totalOpportunities, 0),
    activeOpportunities: toNum(raw.activeOpportunities, toNum(raw.totalOpportunities, 0)),
    averageProfitPercent: String(
      raw.averageProfitPercent ?? raw.avgProfit ?? '0.00',
    ),
    maxProfitPercent: String(raw.maxProfitPercent ?? raw.avgProfit ?? '0.00'),
    period: String(raw.period || 'Last 7 days'),
  };
}

/** Cross-exchange scan via CoinGecko tickers (real CEX prices) */
async function crossExchangeScanClient(limit: number): Promise<ArbitrageOpportunity[]> {
  const results: ArbitrageOpportunity[] = [];

  for (const coin of CG_COINS) {
    try {
      const url = coingeckoV3Url(
        `coins/${coin.id}/tickers?exchange_ids=binance,gdax,kraken,kucoin,bybit,okex`,
      );
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const tickers = Array.isArray(data?.tickers) ? data.tickers : [];
      if (tickers.length === 0) continue;

      const exchangePrices: { exchange: string; price: number; volume24h: number }[] = [];
      const seen = new Set<string>();

      for (const t of tickers) {
        const target = String(t.target || '').toUpperCase();
        if (!['USDT', 'USD', 'BUSD'].includes(target)) continue;
        const name = String(t.market?.name || t.market?.identifier || '').trim();
        if (!name || seen.has(name) || !(t.last > 0)) continue;
        seen.add(name);
        exchangePrices.push({
          exchange: name,
          price: Number(t.last),
          volume24h: Number(t.volume) || 0,
        });
        if (exchangePrices.length >= 5) break;
      }

      if (exchangePrices.length < 2) continue;

      const sorted = [...exchangePrices].sort((a, b) => a.price - b.price);
      const lowest = sorted[0];
      const highest = sorted[sorted.length - 1];
      const profitPercent = ((highest.price - lowest.price) / lowest.price) * 100;
      if (!Number.isFinite(profitPercent) || profitPercent <= 0 || profitPercent > 2) continue;

      results.push({
        _id: `cg-${coin.id}-${lowest.exchange}-${highest.exchange}`,
        symbol: coin.symbol,
        buyExchange: lowest.exchange,
        buyPrice: lowest.price,
        sellExchange: highest.exchange,
        sellPrice: highest.price,
        profitPercent,
        netProfitPercent: Math.max(0, profitPercent - 0.2),
        profitAmount: (1000 * Math.max(0, profitPercent - 0.2)) / 100,
        volume24h: Math.max(lowest.volume24h, highest.volume24h),
        liquidity: profitPercent > 0.5 ? 'high' : profitPercent > 0.2 ? 'medium' : 'low',
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      });
    } catch {
      /* skip coin */
    }
  }

  return results
    .sort((a, b) => b.netProfitPercent - a.netProfitPercent)
    .slice(0, limit);
}

/** Client-side triangular scan using Binance public API (works when backend has no data) */
async function triangularScanClient(limit: number): Promise<TriangularOpportunity[]> {
  let tickers: { symbol: string; price: string }[] = [];
  try {
    const res = await fetch(BINANCE_TICKER_URL);
    if (res.ok) tickers = await res.json();
  } catch (_) {
    try {
      const proxyRes = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(BINANCE_TICKER_URL)}`,
      );
      if (proxyRes.ok) tickers = await proxyRes.json();
    } catch (__) {}
  }
  if (!Array.isArray(tickers) || tickers.length === 0) return [];
  const priceMap: Record<string, number> = {};
  tickers.forEach((t) => {
    priceMap[t.symbol] = parseFloat(t.price);
  });
  if (Object.keys(priceMap).length === 0) return [];

  const opportunities: TriangularOpportunity[] = [];
  const totalFees = 0.3;

  for (const base of BASE_CURRENCIES) {
    for (const mid of INTERMEDIATE_CURRENCIES) {
      if (mid === base) continue;
      for (const final of INTERMEDIATE_CURRENCIES) {
        if (final === base || final === mid) continue;
        const step1Pair = `${base}${mid}`;
        const step2Pair = `${mid}${final}`;
        const step3Pair = `${final}${base}`;
        let p1 = priceMap[step1Pair],
          d1 = 'forward';
        if (p1 == null) {
          const rev = `${mid}${base}`;
          if (priceMap[rev] != null) {
            p1 = priceMap[rev];
            d1 = 'reverse';
          }
        }
        let p2 = priceMap[step2Pair],
          d2 = 'forward';
        if (p2 == null) {
          const rev = `${final}${mid}`;
          if (priceMap[rev] != null) {
            p2 = priceMap[rev];
            d2 = 'reverse';
          }
        }
        let p3 = priceMap[step3Pair],
          d3 = 'forward';
        if (p3 == null) {
          const rev = `${base}${final}`;
          if (priceMap[rev] != null) {
            p3 = priceMap[rev];
            d3 = 'reverse';
          }
        }
        if (p1 == null || p2 == null || p3 == null) continue;

        let amount = 1;
        amount = d1 === 'forward' ? amount * p1 : amount / p1;
        amount = d2 === 'forward' ? amount * p2 : amount / p2;
        amount = d3 === 'forward' ? amount * p3 : amount / p3;
        const rawProfitPercent = ((amount - 1) / 1) * 100;
        const netProfitPercent = rawProfitPercent - totalFees;
        const profitAmount = (1000 * netProfitPercent) / 100;

        const s1Pair = d1 === 'reverse' ? `${mid}${base}` : step1Pair;
        const s2Pair = d2 === 'reverse' ? `${final}${mid}` : step2Pair;
        const s3Pair = d3 === 'reverse' ? `${base}${final}` : step3Pair;

        opportunities.push({
          _id: `client-${base}-${mid}-${final}`,
          exchange: 'binance',
          baseCurrency: base,
          path: `${base} → ${mid} → ${final} → ${base}`,
          pairs: [s1Pair, s2Pair, s3Pair],
          step1: { pair: s1Pair, price: p1, direction: d1 },
          step2: { pair: s2Pair, price: p2, direction: d2 },
          step3: { pair: s3Pair, price: p3, direction: d3 },
          startAmount: 1,
          endAmount: amount,
          profitPercent: rawProfitPercent,
          netProfitPercent,
          profitAmount,
          tradingFees: { step1Fee: 0.1, step2Fee: 0.1, step3Fee: 0.1, totalFee: totalFees },
          status: 'active',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 120000).toISOString(),
        });
      }
    }
  }

  opportunities.sort((a, b) => b.netProfitPercent - a.netProfitPercent);
  return opportunities.slice(0, limit);
}

export interface ArbitrageOpportunity {
  _id: string;
  symbol: string;
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  profitPercent: number;
  netProfitPercent: number;
  profitAmount: number;
  volume24h: number;
  liquidity: 'low' | 'medium' | 'high';
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface ArbitrageStats {
  totalOpportunities: number;
  activeOpportunities: number;
  averageProfitPercent: string;
  maxProfitPercent: string;
  mostProfitablePair?: string;
  period: string;
}

export interface TriangularOpportunity {
  _id: string;
  exchange: string;
  baseCurrency: string;
  path: string;
  pairs: string[];
  step1: {
    pair: string;
    price: number;
    direction: string;
  };
  step2: {
    pair: string;
    price: number;
    direction: string;
  };
  step3: {
    pair: string;
    price: number;
    direction: string;
  };
  startAmount: number;
  endAmount: number;
  profitPercent: number;
  netProfitPercent: number;
  profitAmount: number;
  tradingFees: {
    step1Fee: number;
    step2Fee: number;
    step3Fee: number;
    totalFee: number;
  };
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface TriangularStats {
  totalOpportunities: number;
  activeOpportunities: number;
  averageProfitPercent: string;
  maxProfitPercent: string;
  period: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

/**
 * Fetch active arbitrage opportunities
 */
export const getOpportunities = async (limit: number = 20): Promise<ArbitrageOpportunity[]> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any[]>>(
      `/arbitrage/opportunities?limit=${Math.max(limit * 3, 30)}`,
    );
    const oppList = responseData?.data;
    const raw = Array.isArray(oppList) ? oppList : [];
    const looksLikeStub = raw.length > 0 && raw.every((r) => isStubId(r?.id, 'arb'));

    // Stub placeholder data from camify index.js — prefer live CG scan
    if (looksLikeStub) {
      const live = await crossExchangeScanClient(limit);
      if (live.length > 0) return live;
    }

    const bestBySymbol = new Map<string, ArbitrageOpportunity>();
    for (const row of raw) {
      const opp = normalizeCrossOpp(row);
      if (!opp) continue;
      const profit = Number(opp.profitPercent);
      if (!Number.isFinite(profit) || profit > 2) continue;
      const existing = bestBySymbol.get(opp.symbol);
      if (!existing || Number(opp.netProfitPercent) > Number(existing.netProfitPercent)) {
        bestBySymbol.set(opp.symbol, opp);
      }
    }
    const filtered = Array.from(bestBySymbol.values())
      .sort((a, b) => Number(b.netProfitPercent) - Number(a.netProfitPercent))
      .slice(0, limit);

    if (filtered.length > 0) return filtered;
    return crossExchangeScanClient(limit);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return crossExchangeScanClient(limit);
  }
};

const defaultCrossStats: ArbitrageStats = {
  totalOpportunities: 0,
  activeOpportunities: 0,
  averageProfitPercent: '0.00',
  maxProfitPercent: '0.00',
  period: 'Last 7 days',
};

/**
 * Fetch arbitrage statistics
 */
export const getStats = async (days: number = 7): Promise<ArbitrageStats> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any>>(`/arbitrage/stats?days=${days}`);
    const data = responseData?.data;
    return data != null ? normalizeCrossStats(data) : defaultCrossStats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return defaultCrossStats;
  }
};

/**
 * Fetch opportunity history
 */
export const getHistory = async (days: number = 7, limit: number = 100): Promise<ArbitrageOpportunity[]> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any[]>>(
      `/arbitrage/history?days=${days}&limit=${limit}`,
    );
    if (!responseData) throw new Error('No arbitrage backend reachable');
    return (responseData.data || []).map(normalizeCrossOpp).filter(Boolean) as ArbitrageOpportunity[];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

/**
 * Get single opportunity by ID
 */
export const getOpportunityById = async (id: string): Promise<ArbitrageOpportunity> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any>>(`/arbitrage/opportunity/${id}`);
    const opp = normalizeCrossOpp(responseData?.data);
    if (!opp) throw new Error('Opportunity not found');
    return opp;
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    throw error;
  }
};

/**
 * Trigger manual scan (admin only)
 */
export const triggerScan = async (token: string): Promise<ArbitrageOpportunity[]> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any[]>>(
      `/arbitrage/scan`,
      10000,
      { Authorization: `Bearer ${token}` },
    );
    return (responseData?.data || []).map(normalizeCrossOpp).filter(Boolean) as ArbitrageOpportunity[];
  } catch (error) {
    console.error('Error triggering scan:', error);
    throw error;
  }
};

/**
 * Fetch triangular opportunities from DB (cached)
 */
export const getTriangularOpportunities = async (limit: number = 20): Promise<TriangularOpportunity[]> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any[]>>(
      `/triangular/opportunities?limit=${limit}`,
    );
    const tri = responseData?.data;
    if (!Array.isArray(tri)) return [];
    return tri.map(normalizeTriOpp).filter(Boolean) as TriangularOpportunity[];
  } catch (error) {
    console.error('Error fetching triangular opportunities:', error);
    return [];
  }
};

/**
 * Fetch real-time triangular arbitrage opportunities.
 * Tries backend /triangular/live → /triangular/opportunities → client Binance scan.
 */
export const getTriangularOpportunitiesLive = async (limit: number = 20): Promise<TriangularOpportunity[]> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any[]>>(
      `/triangular/live?limit=${limit}`,
      8000,
    );
    const live = responseData?.data;
    const list = Array.isArray(live)
      ? (live.map(normalizeTriOpp).filter(Boolean) as TriangularOpportunity[])
      : [];
    if (list.length > 0) return list;
  } catch (_) {
    /* fall through */
  }

  try {
    const cached = await getTriangularOpportunities(limit);
    const looksLikeStub = cached.length > 0 && cached.every((o) => isStubId(o._id, 'tri'));
    // Stub has no real step prices — prefer live Binance client scan
    if (cached.length > 0 && !looksLikeStub) return cached;
  } catch (_) {
    /* fall through */
  }

  return triangularScanClient(limit);
};

const defaultTriangularStats: TriangularStats = {
  totalOpportunities: 0,
  activeOpportunities: 0,
  averageProfitPercent: '0.00',
  maxProfitPercent: '0.00',
  period: 'Last 7 days',
};

/**
 * Fetch triangular arbitrage statistics
 */
export const getTriangularStats = async (days: number = 7): Promise<TriangularStats> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any>>(`/triangular/stats?days=${days}`);
    const data = responseData?.data;
    return data != null ? normalizeTriStats(data) : defaultTriangularStats;
  } catch (error) {
    console.error('Error fetching triangular stats:', error);
    return defaultTriangularStats;
  }
};

/**
 * Trigger manual triangular scan (admin only)
 */
export const triggerTriangularScan = async (token: string): Promise<TriangularOpportunity[]> => {
  try {
    const responseData = await axiosGetFirst<ApiResponse<any[]>>(
      `/triangular/scan`,
      10000,
      { Authorization: `Bearer ${token}` },
    );
    return (responseData?.data || []).map(normalizeTriOpp).filter(Boolean) as TriangularOpportunity[];
  } catch (error) {
    console.error('Error triggering triangular scan:', error);
    throw error;
  }
};
