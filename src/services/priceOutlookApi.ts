import axios from 'axios';
import { buildRssBackendBasesFromEnv, joinBackendPath } from '../utils/rssBackendBases';
import type { BlogPost } from '../types/blog';

export type OutlookScenario = {
  label: string;
  priceLow: number;
  priceHigh: number;
  thesis: string;
};

export type PriceOutlook = {
  coinId: string;
  coinName: string;
  symbol: string;
  horizon?: string;
  spotAtWrite?: number;
  currency?: string;
  stance?: string;
  stanceSummary?: string;
  scenarios?: OutlookScenario[];
  catalysts?: string[];
  risks?: string[];
  methodology?: string;
  asOf?: string | Date;
};

export type PriceOutlookPost = BlogPost & {
  outlook?: PriceOutlook;
};

function mapPost(raw: any): PriceOutlookPost {
  return {
    id: (raw.id as string) || (raw._id as string),
    _id: raw._id,
    slug: raw.slug,
    title: raw.title || '',
    content: raw.content || '',
    author: raw.author || '',
    imageUrl: raw.imageUrl || raw.image || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    excerpt: raw.excerpt || '',
    date: raw.date || new Date().toISOString(),
    outlook: raw.outlook || undefined,
  };
}

async function tryBases<T>(
  path: string,
  opts?: { params?: Record<string, string>; timeout?: number },
): Promise<T> {
  const bases = buildRssBackendBasesFromEnv();
  let lastErr: any;
  for (const base of bases) {
    try {
      const url = joinBackendPath(base, path);
      const res = await axios.get(url, {
        params: opts?.params,
        timeout: opts?.timeout ?? 90000,
      });
      return res.data as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function listPriceOutlooks(limit = 40): Promise<PriceOutlookPost[]> {
  try {
    const data = await tryBases<{ success?: boolean; data?: any[] }>('/api/price-outlook/list', {
      params: { limit: String(limit) },
      timeout: 20000,
    });
    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(mapPost);
  } catch {
    // Fallback: posts tagged price-outlook
    const bases = buildRssBackendBasesFromEnv();
    for (const base of bases) {
      try {
        const res = await axios.get(joinBackendPath(base, '/api/posts'), {
          params: { tag: 'price-outlook', limit },
          timeout: 20000,
        });
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        return list.map(mapPost);
      } catch {
        /* next */
      }
    }
    return [];
  }
}

export async function fetchPriceOutlook(
  coinId: string,
): Promise<{ data: PriceOutlookPost | null; stale?: boolean; missing?: boolean; error?: string }> {
  const id = String(coinId || '').toLowerCase().trim();
  try {
    const data = await tryBases<{
      success?: boolean;
      data?: any;
      stale?: boolean;
      missing?: boolean;
      error?: string;
    }>(`/api/price-outlook/${encodeURIComponent(id)}`, { timeout: 25000 });

    if (data?.missing) return { data: null, missing: true };
    if (data?.data) return { data: mapPost(data.data), stale: data.stale };
    return { data: null, error: data?.error || 'not_found', missing: true };
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 404) return { data: null, missing: true };
    return { data: null, error: e?.message || 'fetch_failed' };
  }
}

/** Triggers desk generation if missing/stale (can take 30–90s). */
export async function generatePriceOutlook(
  coinId: string,
  opts?: { force?: boolean },
): Promise<{ data: PriceOutlookPost | null; stale?: boolean; missing?: boolean; error?: string }> {
  const id = String(coinId || '').toLowerCase().trim();
  const params: Record<string, string> = { generate: '1' };
  if (opts?.force) params.force = '1';
  try {
    const data = await tryBases<{
      success?: boolean;
      data?: any;
      stale?: boolean;
      missing?: boolean;
      error?: string;
    }>(`/api/price-outlook/${encodeURIComponent(id)}`, { params, timeout: 120000 });
    if (data?.data) return { data: mapPost(data.data), stale: data.stale };
    return { data: null, missing: !!data?.missing, error: data?.error || 'generation_failed' };
  } catch (e: any) {
    const status = e?.response?.status;
    return {
      data: null,
      missing: status === 404,
      error: e?.response?.data?.error || e?.message || 'generation_failed',
    };
  }
}
