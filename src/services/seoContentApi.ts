import { buildRssBackendBasesFromEnv } from '../utils/rssBackendBases';
import { coingeckoV3Url } from '../utils/coingeckoUrl';
import { coinMatchesText, getCoinById, type CoinEntry } from '../utils/coinRegistry';

export type NewsSnippet = {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  link?: string;
  image?: string;
  source?: string;
};

const RSS_SOURCES = [
  '/fetch-all-rss?limit=120',
  '/fetch-cointelegraph-rss?limit=60',
  '/fetch-coindesk-rss?limit=60',
  '/fetch-cryptoslate-rss?limit=60',
  '/fetch-decrypt-rss?limit=40',
];

function stripHtml(s: string): string {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeItem(raw: any): NewsSnippet | null {
  const title = String(raw?.title || '').trim();
  if (!title) return null;
  const id = String(raw?.article_id || raw?._id || raw?.guid || raw?.link || title)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 120);
  return {
    id,
    title,
    description: stripHtml(raw?.description || raw?.content || '').slice(0, 220),
    pubDate: raw?.pubDate || raw?.date || new Date().toISOString(),
    link: raw?.link,
    image: raw?.image_url || raw?.imageUrl,
    source: raw?.source_name || raw?.source,
  };
}

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchCoinMarket(coinId: string): Promise<{
  price?: number;
  change24h?: number;
  marketCap?: number;
  volume?: number;
  image?: string;
  name?: string;
  symbol?: string;
} | null> {
  try {
    const url = coingeckoV3Url(
      `coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    );
    const data = await fetchJson(url);
    return {
      price: data?.market_data?.current_price?.usd,
      change24h: data?.market_data?.price_change_percentage_24h,
      marketCap: data?.market_data?.market_cap?.usd,
      volume: data?.market_data?.total_volume?.usd,
      image: data?.image?.small || data?.image?.thumb,
      name: data?.name,
      symbol: data?.symbol?.toUpperCase(),
    };
  } catch {
    return null;
  }
}

export async function fetchNewsPool(limit = 200): Promise<NewsSnippet[]> {
  const bases = buildRssBackendBasesFromEnv();
  const seen = new Set<string>();
  const out: NewsSnippet[] = [];

  for (const base of bases) {
    for (const path of RSS_SOURCES) {
      try {
        const data = await fetchJson(`${base.replace(/\/$/, '')}${path}`);
        const arr = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [];
        for (const raw of arr) {
          const item = normalizeItem(raw);
          if (!item || seen.has(item.id)) continue;
          seen.add(item.id);
          out.push(item);
          if (out.length >= limit) return out;
        }
      } catch {
        /* try next source */
      }
    }
    if (out.length >= 40) break;
  }

  return out;
}

export function filterNewsForCoin(items: NewsSnippet[], coin: CoinEntry, limit = 12): NewsSnippet[] {
  return items
    .filter((item) => coinMatchesText(coin, `${item.title} ${item.description}`))
    .slice(0, limit);
}

export async function fetchCoinNews(coinId: string, limit = 12): Promise<NewsSnippet[]> {
  const coin = getCoinById(coinId);
  if (!coin) return [];
  const pool = await fetchNewsPool(200);
  return filterNewsForCoin(pool, coin, limit);
}

export function buildWhyAnswer(
  coin: CoinEntry,
  direction: 'up' | 'down',
  market: { price?: number; change24h?: number } | null,
  headlines: NewsSnippet[],
): string {
  const pct = market?.change24h;
  const pctStr =
    pct != null && Number.isFinite(pct)
      ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
      : 'moving';
  const lead =
    direction === 'up'
      ? `${coin.name} (${coin.symbol}) is up ${pctStr} over the last 24 hours.`
      : `${coin.name} (${coin.symbol}) is down ${pctStr.replace('+', '')} over the last 24 hours.`;

  if (headlines.length > 0) {
    const catalyst = headlines[0].title;
    return `${lead} The main catalyst in today's headlines: ${catalyst}. Traders are also watching ETF flows, funding rates, and broader risk sentiment across crypto markets.`;
  }

  return `${lead} No single headline dominates — price action is likely driven by macro liquidity, BTC correlation, and spot order flow. Check ${coin.symbol} news and the live chart for confirmation.`;
}
