import { buildRssBackendBasesFromEnv } from './rssBackendBases';

const CLIENT_KEY = 'coinsclarity_client_id';

export function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = `cc_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return `cc_anon_${Date.now()}`;
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const bases = buildRssBackendBasesFromEnv();
  let lastErr: unknown;
  for (const raw of bases) {
    const base = raw.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.ok || res.status < 500) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('backend unreachable');
}

export type PriceAlertRow = {
  _id: string;
  coinId: string;
  symbol: string;
  name?: string;
  kind?: string;
  target: number;
  direction: 'above' | 'below';
  channel: string;
  status: string;
  email?: string;
  chatId?: number;
  lastPrice?: number;
  unlockLabel?: string;
  createdAt?: string;
};

export async function createPriceAlert(body: {
  coinId: string;
  symbol: string;
  name?: string;
  target: number;
  direction: 'above' | 'below';
  channel: 'email' | 'telegram' | 'web';
  email?: string;
  chatId?: number;
  kind?: 'price' | 'unlock' | 'p2p';
  unlockLabel?: string;
  unlockTs?: number;
  upiOnly?: boolean;
}): Promise<{ ok: boolean; data?: PriceAlertRow; error?: string }> {
  const res = await apiFetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, clientId: getClientId() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  }
  return { ok: true, data: data.data };
}

export async function listPriceAlerts(): Promise<PriceAlertRow[]> {
  const res = await apiFetch(`/api/alerts?clientId=${encodeURIComponent(getClientId())}&status=all`);
  const data = await res.json().catch(() => ({}));
  return data.data || [];
}

export async function cancelPriceAlert(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/alerts/${id}`, { method: 'DELETE' });
  return res.ok;
}

export type FundingRow = {
  symbol: string;
  ratePct: number;
  annualizedPct: number;
  markPrice: number;
  nextFundingTime: number;
};

export async function fetchFundingRates(): Promise<FundingRow[]> {
  try {
    const res = await apiFetch('/api/tools/funding');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) return data.data;
  } catch {
    /* fall through */
  }
  // client fallback
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
  const rows = await Promise.all(
    symbols.map(async (symbol) => {
      const r = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`);
      const d = await r.json();
      const ratePct = parseFloat(d.lastFundingRate) * 100;
      return {
        symbol: symbol.replace('USDT', ''),
        ratePct,
        annualizedPct: ratePct * 3 * 365,
        markPrice: parseFloat(d.markPrice),
        nextFundingTime: d.nextFundingTime,
      };
    }),
  );
  return rows;
}

export type P2PAd = {
  source?: string;
  price: number;
  available: number;
  minFiat: number;
  maxFiat: number;
  merchant: string;
  methods: string[];
  hasUpi?: boolean;
  url: string;
};

export type P2PBoard = {
  asset: string;
  fiat: string;
  upiOnly?: boolean;
  mid: number | null;
  bestBuy: number | null;
  bestSell: number | null;
  spreadPct: number | null;
  exchangeInr?: number | null;
  exchangeSource?: string | null;
  premiumBuyPct?: number | null;
  premiumSellPct?: number | null;
  sources?: Record<string, { buy: number; sell: number }>;
  buy: P2PAd[];
  sell: P2PAd[];
  disclaimer: string;
  updatedAt: string;
};

export async function fetchP2PBoard(
  asset = 'USDT',
  fiat = 'INR',
  upiOnly = false,
): Promise<P2PBoard> {
  const q = `asset=${asset}&fiat=${fiat}${upiOnly ? '&upi=1' : ''}`;
  const res = await apiFetch(`/api/tools/p2p?${q}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'P2P unavailable');
  return data as P2PBoard;
}
