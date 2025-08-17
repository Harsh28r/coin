import axios from 'axios';
import { BlogPost } from '../types/blog';

const API_BASE: string = (process.env.REACT_APP_API_BASE_URL as string) || 'http://localhost:5000';
const FALLBACK_BASES: string[] = Array.from(new Set([
  API_BASE,
  API_BASE.endsWith('/api') ? API_BASE.replace(/\/api$/, '') : `${API_BASE}/api`,
  'https://c-back-seven.vercel.app',
  'https://c-back-1.onrender.com',
  'https://c-back-2.onrender.com'
]));

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

type AnyRecord = Record<string, any>;

const mapPost = (raw: AnyRecord): BlogPost => {
  return {
    id: (raw.id as string) || (raw._id as string),
    title: raw.title || '',
    content: raw.content || '',
    author: raw.author || '',
    imageUrl: raw.imageUrl || raw.image || '',
    date: raw.date || new Date().toISOString()
  } as BlogPost;
};

export const fetchPosts = async (): Promise<BlogPost[]> => {
  // Try multiple bases and path patterns
  const paths = ['/posts', '/api/posts'];
  let lastErr: any;
  for (const base of FALLBACK_BASES) {
    for (const path of paths) {
      try {
        const res = await axios.get(`${base.replace(/\/$/, '')}${path}`);
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
  for (const base of FALLBACK_BASES) {
    for (const path of paths) {
      try {
        const res = await axios.post(`${base.replace(/\/$/, '')}${path}`, post, { headers: { 'Content-Type': 'application/json' } });
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
  for (const base of FALLBACK_BASES) {
    for (const path of paths) {
      try {
        const res = await axios.put(`${base.replace(/\/$/, '')}${path}`, post, { headers: { 'Content-Type': 'application/json' } });
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
  for (const base of FALLBACK_BASES) {
    for (const path of paths) {
      try {
        await axios.delete(`${base.replace(/\/$/, '')}${path}`);
        return;
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw lastErr;
};