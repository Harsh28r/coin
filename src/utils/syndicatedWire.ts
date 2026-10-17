/**
 * CoinsCapture /news-feeds + ?mode=live pattern:
 * merge third-party RSS server-side, attribute Source, open on-platform.
 */
import { buildRssBackendBasesFromEnv, joinBackendPath } from './rssBackendBases';

export type WireItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  pubDateRaw: string;
  image?: string;
  excerpt?: string;
  content?: string;
  creator?: string[];
};

export type WireSource = {
  path: string;
  source: string;
  fallbackUrl?: string;
};

/** Same publishers CoinsCapture lists on /news-feeds */
export const WIRE_SOURCES: WireSource[] = [
  { path: '/fetch-bitcoincom-rss?limit=10', source: 'Bitcoin News', fallbackUrl: 'https://news.bitcoin.com/feed/' },
  {
    path: '/fetch-blockchainnews-rss?limit=10',
    source: 'Blockchain News',
    fallbackUrl: 'https://blockchain.news/feed',
  },
  {
    path: '/fetch-cryptonews-rss?limit=10',
    source: 'CryptoNews',
    fallbackUrl: 'https://cryptonews.com/news/feed/',
  },
  {
    path: '/fetch-cryptonewsz-rss?limit=10',
    source: 'CryptoNewsZ',
    fallbackUrl: 'https://www.cryptonewsz.com/feed/',
  },
  { path: '/fetch-decrypt-rss?limit=10', source: 'Decrypt', fallbackUrl: 'https://decrypt.co/feed' },
  { path: '/fetch-coindesk-rss?limit=8', source: 'CoinDesk' },
  { path: '/fetch-cointelegraph-rss?limit=8', source: 'CoinTelegraph' },
];

export function normalizeWireItems(json: any, fallbackSource: string): WireItem[] {
  const arr: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.items)
      ? json.items
      : [];

  return arr.map((it: any, idx: number) => {
    const title = String(it.title || 'Untitled').trim();
    const link = String(it.link || '#');
    const source = String(it.source_name || it.source || fallbackSource);
    const pubDateRaw = String(it.pubDate || it.published || new Date().toISOString());
    const articleId = String(it.article_id || it.id || link || `${source}-${idx}`);
    const creator = Array.isArray(it.creator)
      ? it.creator
      : [it.creator || it.author || source];
    return {
      id: articleId,
      title,
      link,
      source,
      pubDateRaw,
      published: pubDateRaw
        ? new Date(pubDateRaw).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '',
      image: it.image_url || it.image || '',
      excerpt: String(it.description || '')
        .replace(/<[^>]*>/g, '')
        .slice(0, 180),
      content: String(it.content || it.content_encoded || it.description || ''),
      creator,
    };
  });
}

function interleave(buckets: WireItem[][], limit: number): WireItem[] {
  const seen = new Set<string>();
  const out: WireItem[] = [];
  let i = 0;
  let progressed = true;
  while (out.length < limit && progressed) {
    progressed = false;
    for (const bucket of buckets) {
      if (i >= bucket.length) continue;
      const it = bucket[i];
      const key = it.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(it);
        if (out.length >= limit) break;
      }
      progressed = true;
    }
    i += 1;
  }
  return out;
}

/** Newest-first merge (CoinsCapture live mode). */
function byRecency(items: WireItem[], limit: number): WireItem[] {
  const seen = new Set<string>();
  const uniq: WireItem[] = [];
  for (const it of items) {
    const key = it.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(it);
  }
  uniq.sort((a, b) => {
    const ta = Date.parse(a.pubDateRaw) || 0;
    const tb = Date.parse(b.pubDateRaw) || 0;
    return tb - ta;
  });
  return uniq.slice(0, limit);
}

export type FetchWireOpts = {
  limit?: number;
  /** `live` = sort all sources by recency (CoinsCapture ?mode=live) */
  mode?: 'interleave' | 'live';
  signal?: AbortSignal;
};

export async function fetchSyndicatedWire(opts: FetchWireOpts = {}): Promise<WireItem[]> {
  const limit = opts.limit ?? 24;
  const mode = opts.mode ?? 'interleave';
  const bases = buildRssBackendBasesFromEnv();
  const buckets: WireItem[][] = WIRE_SOURCES.map(() => []);

  for (const base of bases.slice(0, 3)) {
    await Promise.allSettled(
      WIRE_SOURCES.map(async (src, idx) => {
        const tryPaths = [src.path];
        if (src.fallbackUrl) {
          tryPaths.push(`/fetch-rss?url=${encodeURIComponent(src.fallbackUrl)}&limit=10`);
        }
        for (const path of tryPaths) {
          try {
            const res = await fetch(joinBackendPath(base, path), {
              signal: opts.signal ?? AbortSignal.timeout(12000),
            });
            if (!res.ok) continue;
            const json = await res.json();
            if (!json?.success && !Array.isArray(json?.data) && !Array.isArray(json?.items)) {
              continue;
            }
            const normalized = normalizeWireItems(json, src.source);
            if (normalized.length) {
              buckets[idx] = normalized;
              return;
            }
          } catch {
            // next path / base
          }
        }
      }),
    );

    const have = buckets.reduce((n, b) => n + b.length, 0);
    if (have >= 10) break;
  }

  if (mode === 'live') {
    return byRecency(buckets.flat(), limit);
  }
  return interleave(buckets, limit);
}

export function wireItemToNewsState(it: WireItem) {
  return {
    article_id: it.id,
    title: it.title,
    description: it.excerpt || '',
    creator: it.creator || [it.source],
    pubDate: it.pubDateRaw,
    image_url: it.image || '',
    link: it.link,
    content: it.content || it.excerpt || '',
    source_name: it.source,
  };
}
