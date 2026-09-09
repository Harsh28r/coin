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
  if (slug.startsWith('price-outlook-')) {
    return `/prediction/${slug.replace(/^price-outlook-/, '')}`;
  }
  const outlook = p.outlook as { coinId?: string } | undefined;
  const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
  if (outlook?.coinId || tags.includes('price-outlook')) {
    const coinId = outlook?.coinId || slug.replace(/^price-outlook-/, '');
    if (coinId) return `/prediction/${coinId}`;
  }
  return `/blog/${key}`;
};

// Reverse helper: given the :id route param, find the matching post by
// slug first (preferred) and fall back to id. Pure function so it can be
// unit-tested separately from BlogContext.
export const findPostByKey = <T extends { id: string; slug?: string }>(
  posts: T[],
  key: string,
): T | undefined => {
  if (!key) return undefined;
  return (
    posts.find((p) => p.slug && p.slug === key) ||
    posts.find((p) => p.id === key)
  );
};
