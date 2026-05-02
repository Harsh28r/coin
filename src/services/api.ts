import axios from 'axios';
import { BlogPost } from '../types/blog';
import { buildRssBackendBases, joinBackendPath } from '../utils/rssBackendBases';

/** Must be called at request time so `sameOriginBackendProxyBase()` sees `window`. */
function getFallbackBases(): string[] {
  return buildRssBackendBases(process.env.REACT_APP_API_BASE_URL as string | undefined);
}

type AnyRecord = Record<string, any>;

export type FetchPostsOpts = {
  /** Only posts whose `tags` array contains this value (e.g. `daily-digest`) */
  tag?: string;
  /** Exclude posts that have this tag in `tags` (e.g. hide auto digest from main blog list) */
  excludeTag?: string;
  limit?: number;
};

function postsQueryString(opts?: FetchPostsOpts): string {
  const p = new URLSearchParams();
  if (opts?.tag) p.set('tag', opts.tag);
  if (opts?.excludeTag) p.set('excludeTag', opts.excludeTag);
  if (opts?.limit != null) p.set('limit', String(Math.min(Math.max(1, opts.limit), 100)));
  const s = p.toString();
  return s ? `?${s}` : '';
}

const mapPost = (raw: AnyRecord): BlogPost => {
  return {
    id: (raw.id as string) || (raw._id as string),
    _id: raw._id as string | undefined,
    slug: raw.slug || undefined,
    title: raw.title || '',
    content: raw.content || '',
    author: raw.author || '',
    imageUrl: raw.imageUrl || raw.image || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    excerpt: raw.excerpt || '',
    date: raw.date || new Date().toISOString()
  } as BlogPost;
};

export const fetchPosts = async (opts?: FetchPostsOpts): Promise<BlogPost[]> => {
  const qs = postsQueryString(opts);
  const paths = ['/posts', '/api/posts'];
  let lastErr: any;
  for (const base of getFallbackBases()) {
    for (const path of paths) {
      try {
        const res = await axios.get(`${joinBackendPath(base, path)}${qs}`);
        const data = res.data as any;
        const list = Array.isArray(data)
          ? data
          : (data && data.success && Array.isArray(data.data))
            ? data.data
            : [];
        return list.map(mapPost);
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr;
};

export const createPost = async (post: Omit<BlogPost, 'id'>): Promise<BlogPost> => {
  const paths = ['/posts', '/api/posts'];
  let lastErr: any;
  for (const base of getFallbackBases()) {
    for (const path of paths) {
      try {
        const res = await axios.post(joinBackendPath(base, path), post, { headers: { 'Content-Type': 'application/json' } });
        const data = res.data as any;
        const item = (data && data.success && data.data) ? data.data : data;
        return mapPost(item || {});
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr;
};

export const updatePost = async (post: BlogPost): Promise<BlogPost> => {
  const identifier = (post as any).id || (post as any)._id;
  const paths = [`/posts/${identifier}`, `/api/posts/${identifier}`];
  let lastErr: any;
  for (const base of getFallbackBases()) {
    for (const path of paths) {
      try {
        const res = await axios.put(joinBackendPath(base, path), post, { headers: { 'Content-Type': 'application/json' } });
        const data = res.data as any;
        const item = (data && data.success && data.data) ? data.data : data;
        return mapPost(item || {});
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr;
};

export const deletePost = async (id: string): Promise<void> => {
  const paths = [`/posts/${id}`, `/api/posts/${id}`];
  let lastErr: any;
  for (const base of getFallbackBases()) {
    for (const path of paths) {
      try {
        await axios.delete(joinBackendPath(base, path));
        return;
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr;
};
