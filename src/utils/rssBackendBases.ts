/**
 * RSS / crypto API hosts. Vercel + Render mirrors are tried before camify because
 * camify.fun.coinsclarity.com often returns 502 from nginx — the browser then shows
 * "CORS" even though the real failure is Bad Gateway (error pages have no ACAO).
 */
const CAMIFY = 'https://camify.fun.coinsclarity.com';

const MIRRORS = [
  'https://c-back-seven.vercel.app',
  'https://c-back-1.onrender.com',
  'https://c-back-2.onrender.com',
];

function stripBase(u: string): string {
  return u.replace(/\/$/, '').replace(/\/api$/i, '');
}

/**
 * Join API base with a path. If `path` starts with `/api/`, strips a trailing
 * `/api` from base first — prevents `https://host/api` + `/api/posts` → `/api/api/posts`.
 */
export function joinBackendPath(base: string, path: string): string {
  let b = String(base || '').trim().replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.toLowerCase().startsWith('/api/')) {
    b = b.replace(/\/api$/i, '');
  }
  return `${b}${p}`;
}

/** Mirrors first, optional env host (if not localhost / not camify), camify always last. */
export function buildRssBackendBases(envBase?: string): string[] {
  const env = stripBase((envBase || process.env.REACT_APP_API_BASE_URL || '').trim());
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const s = stripBase(raw);
    if (!s || s.includes('localhost')) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  MIRRORS.forEach(push);
  if (env && !env.includes('camify.fun.coinsclarity.com')) push(env);
  push(CAMIFY);
  return out;
}
