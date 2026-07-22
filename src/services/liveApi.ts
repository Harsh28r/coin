import axios from 'axios';
import { buildRssBackendBasesFromEnv, joinBackendPath } from '../utils/rssBackendBases';

export type LiveUpdate = {
  _id?: string;
  at: string | Date;
  title: string;
  html: string;
  kind?: 'update' | 'alert' | 'summary';
};

export type LiveThread = {
  _id?: string;
  slug: string;
  title: string;
  summary?: string;
  status: 'upcoming' | 'live' | 'ended';
  coverImage?: string;
  tags?: string[];
  authorSlug?: string;
  authorName?: string;
  startedAt?: string | Date | null;
  endedAt?: string | Date | null;
  updates?: LiveUpdate[];
  updateCount?: number;
  latestUpdateAt?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

async function tryBases<T>(
  path: string,
  init?: { method?: string; data?: any; headers?: Record<string, string>; timeout?: number },
): Promise<T> {
  const bases = buildRssBackendBasesFromEnv();
  let lastErr: any;
  for (const base of bases) {
    try {
      const url = joinBackendPath(base, path);
      const res = await axios({
        url,
        method: init?.method || 'GET',
        data: init?.data,
        headers: init?.headers,
        timeout: init?.timeout ?? 25000,
      });
      return res.data as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function listLiveThreads(opts?: {
  status?: string;
  limit?: number;
}): Promise<LiveThread[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.limit) params.set('limit', String(opts.limit));
  const qs = params.toString() ? `?${params}` : '';
  try {
    const data = await tryBases<{ success?: boolean; data?: LiveThread[] }>(`/api/live${qs}`);
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export async function fetchLiveThread(
  slug: string,
): Promise<{ data: LiveThread | null; missing?: boolean; error?: string }> {
  const s = String(slug || '')
    .toLowerCase()
    .trim();
  try {
    const data = await tryBases<{ success?: boolean; data?: LiveThread; missing?: boolean }>(
      `/api/live/${encodeURIComponent(s)}`,
    );
    if (data?.data) return { data: data.data };
    return { data: null, missing: true };
  } catch (e: any) {
    if (e?.response?.status === 404) return { data: null, missing: true };
    return { data: null, error: e?.message || 'fetch_failed' };
  }
}

export async function adminCreateLiveThread(
  secret: string,
  body: Partial<LiveThread> & { title: string },
): Promise<LiveThread> {
  const data = await tryBases<{ data: LiveThread }>('/api/live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
    data: body,
  });
  return data.data;
}

export async function adminPatchLiveThread(
  secret: string,
  slug: string,
  body: Partial<LiveThread>,
): Promise<LiveThread> {
  const data = await tryBases<{ data: LiveThread }>(`/api/live/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
    data: body,
  });
  return data.data;
}

export async function adminAppendLiveUpdate(
  secret: string,
  slug: string,
  update: { title: string; html?: string; kind?: string },
): Promise<LiveThread> {
  const data = await tryBases<{ data: LiveThread }>(
    `/api/live/${encodeURIComponent(slug)}/updates`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      data: update,
    },
  );
  return data.data;
}

export async function adminSeedLiveDemo(secret: string, force = false): Promise<LiveThread | null> {
  const data = await tryBases<{ data?: LiveThread }>('/api/live/seed-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
    data: { force },
  });
  return data.data || null;
}
