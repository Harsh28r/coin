import { BlogPost } from '../types/blog';

// Prefer the SEO-friendly slug, fall back to the Mongo id.
// Used everywhere we render <Link to={...}> for a blog post so the URL
// shape is consistent across the app and search engines see clean paths.
export const getBlogUrl = (post: Pick<BlogPost, 'id' | 'slug'>): string => {
  const key = (post.slug && post.slug.trim()) || post.id;
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
