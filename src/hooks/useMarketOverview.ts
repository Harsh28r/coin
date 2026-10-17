import { useEffect, useState } from 'react';
import { coingeckoV3Url } from '../utils/coingeckoUrl';

export interface MarketOverviewStats {
  total_market_cap: number;
  total_volume: number;
  btc_dominance: number;
  eth_dominance: number;
  market_cap_change_24h: number;
  active_cryptocurrencies: number;
}

export interface MarketSentiment {
  fearGreed: number;
  fearLabel: string;
  altSeason: number;
  avgRsi: number;
}

const FNG_URL = 'https://api.alternative.me/fng/?limit=1&format=json';

const MOCK: MarketOverviewStats = {
  total_market_cap: 2_400_000_000_000,
  total_volume: 90_000_000_000,
  btc_dominance: 52,
  eth_dominance: 17,
  market_cap_change_24h: 1.2,
  active_cryptocurrencies: 12000,
};

export const labelOfFear = (v: number): string => {
  if (v <= 24) return 'Extreme Fear';
  if (v <= 49) return 'Fear';
  if (v <= 54) return 'Neutral';
  if (v <= 74) return 'Greed';
  return 'Extreme Greed';
};

export const fearColor = (v: number): string => {
  if (v <= 24) return '#dc2626';
  if (v <= 49) return '#f97316';
  if (v <= 54) return '#eab308';
  if (v <= 74) return '#84cc16';
  return '#16a34a';
};

export const altSeasonFromDominance = (btcDom: number): number =>
  Math.round(Math.max(0, Math.min(100, ((62 - btcDom) / 22) * 100)));

const rsiFromChange = (change: number): number => {
  if (change > 10) return 75 + Math.min(20, change);
  if (change > 5) return 60 + change;
  if (change > 0) return 48 + change * 1.5;
  if (change > -5) return 42 + change;
  if (change > -10) return 28 + change * 0.5;
  return Math.max(12, 20 + change);
};

export function formatMarketUsd(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

type CacheBundle = { stats: MarketOverviewStats; sentiment: MarketSentiment; at: number };

let cache: CacheBundle | null = null;
let inflight: Promise<CacheBundle> | null = null;

async function loadMarketOverview(): Promise<CacheBundle> {
  if (cache && Date.now() - cache.at < 60_000) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const [globalRes, fngRes, marketsRes] = await Promise.allSettled([
        fetch(coingeckoV3Url('global'), { signal: AbortSignal.timeout(10000) }),
        fetch(FNG_URL, { signal: AbortSignal.timeout(8000) }),
        fetch(
          coingeckoV3Url(
            'coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=false&price_change_percentage=24h'
          ),
          { signal: AbortSignal.timeout(10000) }
        ),
      ]);

      let nextStats = MOCK;
      if (globalRes.status === 'fulfilled' && globalRes.value.ok) {
        const data = await globalRes.value.json();
        const global = data.data;
        nextStats = {
          total_market_cap: global.total_market_cap?.usd || MOCK.total_market_cap,
          total_volume: global.total_volume?.usd || MOCK.total_volume,
          btc_dominance: global.market_cap_percentage?.btc || MOCK.btc_dominance,
          eth_dominance: global.market_cap_percentage?.eth || MOCK.eth_dominance,
          market_cap_change_24h:
            global.market_cap_change_percentage_24h_usd || MOCK.market_cap_change_24h,
          active_cryptocurrencies:
            global.active_cryptocurrencies || MOCK.active_cryptocurrencies,
        };
      }

      let fearGreed = 50;
      let fearLabel = 'Neutral';
      if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
        const json = await fngRes.value.json();
        const row = json?.data?.[0];
        if (row) {
          fearGreed = parseInt(row.value, 10) || 50;
          fearLabel = row.value_classification || labelOfFear(fearGreed);
        }
      } else {
        fearLabel = labelOfFear(fearGreed);
      }

      let avgRsi = 50;
      if (marketsRes.status === 'fulfilled' && marketsRes.value.ok) {
        const markets = await marketsRes.value.json();
        if (Array.isArray(markets) && markets.length) {
          const values = markets
            .map((c: { price_change_percentage_24h?: number }) =>
              rsiFromChange(Number(c.price_change_percentage_24h) || 0)
            )
            .filter((n: number) => Number.isFinite(n));
          if (values.length) {
            avgRsi = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
          }
        }
      }

      const bundle: CacheBundle = {
        stats: nextStats,
        sentiment: {
          fearGreed,
          fearLabel,
          altSeason: altSeasonFromDominance(nextStats.btc_dominance),
          avgRsi,
        },
        at: Date.now(),
      };
      cache = bundle;
      return bundle;
    } catch {
      const fallback: CacheBundle = {
        stats: MOCK,
        sentiment: {
          fearGreed: 50,
          fearLabel: 'Neutral',
          altSeason: altSeasonFromDominance(MOCK.btc_dominance),
          avgRsi: 50,
        },
        at: Date.now(),
      };
      cache = fallback;
      return fallback;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function useMarketOverview(pollMs = 5 * 60 * 1000) {
  const [stats, setStats] = useState<MarketOverviewStats | null>(cache?.stats ?? null);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(cache?.sentiment ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;

    const apply = async () => {
      const bundle = await loadMarketOverview();
      if (cancelled) return;
      setStats(bundle.stats);
      setSentiment(bundle.sentiment);
      setLoading(false);
    };

    apply();
    const id = setInterval(apply, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { stats, sentiment, loading };
}
