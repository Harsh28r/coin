import axios from 'axios';

// Dedicated base for arbitrage APIs so it doesn't get overridden by the news/RSS host
// Priority: explicit ARBITRAGE base → generic API base → deployed arbitrage backend
const ARB_API_BASE =
  process.env.REACT_APP_ARBITRAGE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'https://c-back-seven.vercel.app';

const BINANCE_TICKER_URL = 'https://api.binance.com/api/v3/ticker/price';

const BASE_CURRENCIES = ['BTC', 'ETH', 'USDT', 'BNB'];
const INTERMEDIATE_CURRENCIES = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'USDT', 'USDC'];

/** Client-side triangular scan using Binance public API (works when backend has no data) */
async function triangularScanClient(limit: number): Promise<TriangularOpportunity[]> {
  let tickers: { symbol: string; price: string }[] = [];
  try {
    const res = await fetch(BINANCE_TICKER_URL);
    if (res.ok) tickers = await res.json();
  } catch (_) {
    // CORS or network: try proxy
    try {
      const proxyRes = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(BINANCE_TICKER_URL)}`
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
  path: string; // e.g., "BTC → ETH → USDT → BTC"
  pairs: string[]; // e.g., ["BTCETH", "ETHUSDT", "USDTBTC"]
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
    const response = await axios.get<ApiResponse<ArbitrageOpportunity[]>>(
      `${ARB_API_BASE}/arbitrage/opportunities?limit=${limit}`
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return [];
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
    const response = await axios.get<ApiResponse<ArbitrageStats>>(
      `${ARB_API_BASE}/arbitrage/stats?days=${days}`
    );
    const data = response.data?.data;
    return data != null ? { ...defaultCrossStats, ...data } : defaultCrossStats;
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
    const response = await axios.get<ApiResponse<ArbitrageOpportunity[]>>(
      `${ARB_API_BASE}/arbitrage/history?days=${days}&limit=${limit}`
    );
    return response.data.data || [];
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
    const response = await axios.get<ApiResponse<ArbitrageOpportunity>>(
      `${ARB_API_BASE}/arbitrage/opportunity/${id}`
    );
    return response.data.data;
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
    const response = await axios.get<ApiResponse<ArbitrageOpportunity[]>>(
      `${ARB_API_BASE}/arbitrage/scan`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
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
    const response = await axios.get<ApiResponse<TriangularOpportunity[]>>(
      `${ARB_API_BASE}/triangular/opportunities?limit=${limit}`
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error('Error fetching triangular opportunities:', error);
    return [];
  }
};

/**
 * Fetch real-time triangular arbitrage opportunities.
 * Tries backend /triangular/live first; if empty or fails, runs client-side Binance fetch so you always get data.
 */
export const getTriangularOpportunitiesLive = async (limit: number = 20): Promise<TriangularOpportunity[]> => {
  try {
    const response = await axios.get<ApiResponse<TriangularOpportunity[]> & { data?: { source?: string } }>(
      `${ARB_API_BASE}/triangular/live?limit=${limit}`,
      { timeout: 8000 }
    );
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    if (list.length > 0) return list;
  } catch (_) {
    // Backend failed or no data; fall through to client-side
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
    const response = await axios.get<ApiResponse<TriangularStats>>(
      `${ARB_API_BASE}/triangular/stats?days=${days}`
    );
    const data = response.data?.data;
    return data != null ? { ...defaultTriangularStats, ...data } : defaultTriangularStats;
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
    const response = await axios.get<ApiResponse<TriangularOpportunity[]>>(
      `${ARB_API_BASE}/triangular/scan`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error triggering triangular scan:', error);
    throw error;
  }
};
