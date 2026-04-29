// Hover-prefetch helper for /news/<id> deep-links. Drop onMouseEnter into any
// news-card link to warm the article cache before the user clicks. Failures
// are swallowed silently so this is always safe to call.

const CAMIFY = 'https://camify.fun.coinsclarity.com';
const inflight = new Set<string>();
const PER_SOURCE_RSS = [
  'coindesk', 'cryptoslate', 'cointelegraph', 'decrypt', 'blockworks',
  'beincrypto', 'finbold', 'coingape', 'bitcoinist', 'cryptobriefing',
  'protos', 'unchained', 'thecryptobasic', 'blockonomi', 'coincu',
  'cryptonewsz', 'ethereumworldnews', 'chaingpt', 'watcherguru', 'coinpedia',
  'smartliquidity',
];

const writeCache = (id: string, item: any): void => {
  try {
    const entry = { item, ts: Date.now() };
    const json = JSON.stringify(entry);
    localStorage.setItem(`news:${id}`, json);
    sessionStorage.setItem(`news:${id}`, json);
  } catch {}
};

const hasCached = (id: string): boolean => {
  try {
    return Boolean(localStorage.getItem(`news:${id}`) || sessionStorage.getItem(`news:${id}`));
  } catch { return false; }
};

const matchAndCache = async (url: string, articleId: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.success && data.data && !Array.isArray(data.data) && data.data.article_id === articleId) {
      writeCache(articleId, data.data);
      return true;
    }
    const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : null;
    const hit = arr?.find((it: any) => it?.article_id === articleId || it?._id === articleId);
    if (hit) { writeCache(articleId, hit); return true; }
  } catch {}
  return false;
};

export const prefetchNews = (articleId: string): void => {
  if (!articleId || inflight.has(articleId) || hasCached(articleId)) return;
  inflight.add(articleId);

  // Fastest endpoint first, others as fallback. We don't await — fire & forget.
  (async () => {
    try {
      if (await matchAndCache(`${CAMIFY}/article/${encodeURIComponent(articleId)}`, articleId)) return;
      for (const src of PER_SOURCE_RSS) {
        if (hasCached(articleId)) return;
        if (await matchAndCache(`${CAMIFY}/fetch-${src}-rss?limit=50`, articleId)) return;
      }
      await matchAndCache(`${CAMIFY}/fetch-all-rss?limit=100`, articleId);
    } finally {
      inflight.delete(articleId);
    }
  })();
};

// React-friendly attribute spread:
//   <Link to={`/news/${id}`} {...prefetchOnHover(id)}>…</Link>
export const prefetchOnHover = (articleId: string) => ({
  onMouseEnter: () => prefetchNews(articleId),
  onTouchStart: () => prefetchNews(articleId),
  onFocus: () => prefetchNews(articleId),
});

export default prefetchNews;
