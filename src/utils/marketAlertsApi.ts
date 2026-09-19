import { buildRssBackendBasesFromEnv } from './rssBackendBases';

const CLIENT_KEY = 'coinsclarity_client_id';
const LOCAL_ALERTS_KEY = 'coinsclarity_local_alerts';

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

/** Try each backend. 404/405 = route missing on that host → try next (camify lags Render). */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const bases = buildRssBackendBasesFromEnv();
  let lastRes: Response | null = null;
  let lastErr: unknown;
  for (const raw of bases) {
    const base = raw.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.ok) return res;
      // Missing route on this host — keep looking
      if (res.status === 404 || res.status === 405) {
        lastRes = res;
        continue;
      }
      // 4xx from a live route (validation etc.) — return to caller
      if (res.status < 500) return res;
      lastRes = res;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastRes) return lastRes;
  throw lastErr || new Error('backend unreachable');
}

function readLocalAlerts(): PriceAlertRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAlerts(rows: PriceAlertRow[]) {
  try {
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(rows.slice(0, 50)));
  } catch {
    /* ignore */
  }
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
  localOnly?: boolean;
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
}): Promise<{ ok: boolean; data?: PriceAlertRow; error?: string; warning?: string }> {
  try {
    const res = await apiFetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, clientId: getClientId() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) return { ok: true, data: data.data };
    if (res.status !== 404 && res.status !== 405) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
  } catch {
    /* local fallback */
  }

  const row: PriceAlertRow = {
    _id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    coinId: body.coinId,
    symbol: body.symbol,
    name: body.name,
    kind: body.kind || 'price',
    target: body.target,
    direction: body.direction,
    channel: body.channel,
    status: 'active',
    email: body.email,
    chatId: body.chatId,
    createdAt: new Date().toISOString(),
    localOnly: true,
  };
  writeLocalAlerts([row, ...readLocalAlerts()]);
  return {
    ok: true,
    data: row,
    warning:
      'Saved on this device only — server alert API not live on camify yet. Redeploy backend for email/Telegram delivery.',
  };
}

export async function listPriceAlerts(): Promise<PriceAlertRow[]> {
  const local = readLocalAlerts();
  try {
    const res = await apiFetch(
      `/api/alerts?clientId=${encodeURIComponent(getClientId())}&status=all`,
    );
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const remote: PriceAlertRow[] = data.data || [];
      const remoteIds = new Set(remote.map((r) => r._id));
      return [...remote, ...local.filter((l) => !remoteIds.has(l._id))];
    }
  } catch {
    /* local only */
  }
  return local;
}

export async function cancelPriceAlert(id: string): Promise<boolean> {
  if (id.startsWith('local_')) {
    writeLocalAlerts(readLocalAlerts().filter((a) => a._id !== id));
    return true;
  }
  try {
    const res = await apiFetch(`/api/alerts/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {
    /* ignore */
  }
  writeLocalAlerts(readLocalAlerts().filter((a) => a._id !== id));
  return true;
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
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) return data.data;
    }
  } catch {
    /* fall through */
  }
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

function mapBinanceAds(
  list: any[],
  asset: string,
  fiat: string,
  tradeType: 'BUY' | 'SELL',
): P2PAd[] {
  return (list || []).map((row) => {
    const adv = row.adv || {};
    const advertiser = row.advertiser || {};
    const methods = (adv.tradeMethods || []).map((m: any) => m.tradeMethodName).filter(Boolean);
    return {
      source: 'binance',
      price: parseFloat(adv.price),
      available: parseFloat(adv.surplusAmount),
      minFiat: parseFloat(adv.minSingleTransAmount),
      maxFiat: parseFloat(adv.maxSingleTransAmount),
      merchant: advertiser.nickName || 'Merchant',
      methods,
      hasUpi: methods.some((m: string) => /upi/i.test(m)),
      url: `https://p2p.binance.com/en/trade/${tradeType === 'BUY' ? 'buy' : 'sell'}/${asset}?fiat=${fiat}`,
    };
  });
}

async function postBinanceP2P(body: object): Promise<any> {
  const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  };

  // Direct (works when Binance allows CORS)
  try {
    const res = await fetch(url, init);
    if (res.ok) return res.json();
  } catch {
    /* CORS / network */
  }

  // Public CORS proxies (GET wrappers that forward POST body via query — limited)
  // Use corsproxy.io POST form
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, init);
    if (res.ok) return res.json();
  } catch {
    /* next */
  }

  throw new Error('Binance P2P blocked in browser');
}

async function fetchP2PBoardClient(
  asset: string,
  fiat: string,
  upiOnly: boolean,
): Promise<P2PBoard> {
  const baseBody = {
    asset,
    fiat,
    merchantCheck: false,
    page: 1,
    rows: 15,
    payTypes: upiOnly ? ['UPI'] : [],
    publisherType: null as null,
  };

  const [buyRaw, sellRaw] = await Promise.all([
    postBinanceP2P({ ...baseBody, tradeType: 'BUY' }),
    postBinanceP2P({ ...baseBody, tradeType: 'SELL' }),
  ]);

  let buy = mapBinanceAds(buyRaw?.data || [], asset, fiat, 'BUY');
  let sell = mapBinanceAds(sellRaw?.data || [], asset, fiat, 'SELL');
  if (upiOnly) {
    buy = buy.filter((a) => a.hasUpi);
    sell = sell.filter((a) => a.hasUpi);
  }

  const bestBuy = buy.length ? Math.min(...buy.map((a) => a.price)) : null;
  const bestSell = sell.length ? Math.max(...sell.map((a) => a.price)) : null;
  const mid =
    bestBuy != null && bestSell != null ? (bestBuy + bestSell) / 2 : bestBuy ?? bestSell;

  return {
    asset,
    fiat,
    upiOnly,
    mid,
    bestBuy,
    bestSell,
    spreadPct:
      bestBuy != null && bestSell != null && mid
        ? ((bestBuy - bestSell) / mid) * 100
        : null,
    buy: buy.slice(0, 12),
    sell: sell.slice(0, 12),
    disclaimer:
      'Live Binance P2P ads (browser). Not an offer or escrow. Verify merchants. CoinsClarity is not a counterparty.',
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchP2PBoard(
  asset = 'USDT',
  fiat = 'INR',
  upiOnly = false,
): Promise<P2PBoard> {
  const q = `asset=${asset}&fiat=${fiat}${upiOnly ? '&upi=1' : ''}`;
  try {
    const res = await apiFetch(`/api/tools/p2p?${q}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data as P2PBoard;
    }
  } catch {
    /* client fallback */
  }
  return fetchP2PBoardClient(asset.toUpperCase(), fiat.toUpperCase(), upiOnly);
}
