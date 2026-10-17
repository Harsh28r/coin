/** Accepts `BlogPost`, translated `NewsItem`, or any row with `slug` / `id` / `_id`. */
export const getBlogUrl = (post: unknown): string => {
  const p = post as Record<string, unknown>;
  const slug = typeof p.slug === 'string' ? p.slug.trim() : '';
  const id =
    (typeof p.id === 'string' && p.id.trim()) ||
    (p._id != null && String(p._id).trim()) ||
    '';
  const key = slug || id;
  if (!key) return '/blog';
  // Always open the editorial article on /blog — never bounce to /coin
  // (price outlooks + Google Trends desk columns are full posts).
  return `/blog/${encodeURIComponent(key)}`;
};

/** Live market page for a coin (chart / tickers), not the blog article. */
export const getCoinMarketUrl = (post: unknown): string | null => {
  const p = post as Record<string, unknown>;
  const slug = typeof p.slug === 'string' ? p.slug.trim() : '';
  const outlook = p.outlook as { coinId?: string } | undefined;
  const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
  if (outlook?.coinId) return `/coin/${outlook.coinId}`;
  if (slug.startsWith('price-outlook-')) {
    return `/coin/${slug.replace(/^price-outlook-/, '')}`;
  }
  const coinTag = tags.find((t) => String(t).startsWith('coin:'));
  if (coinTag) return `/coin/${String(coinTag).slice(5)}`;
  return null;
};

// Reverse helper: given the :id route param, find the matching post by
// slug first (preferred) and fall back to id. Pure function so it can be
// unit-tested separately from BlogContext.
export const findPostByKey = <T extends { id: string; slug?: string }>(
  posts: T[],
  key: string,
): T | undefined => {
  if (!key) return undefined;
  const decoded = (() => {
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  })();
  return (
    posts.find((p) => p.slug && p.slug === decoded) ||
    posts.find((p) => p.id === decoded) ||
    posts.find((p) => p.slug && p.slug === key) ||
    posts.find((p) => p.id === key)
  );
};
