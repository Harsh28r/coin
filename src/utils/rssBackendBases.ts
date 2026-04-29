/**
 * RSS / crypto API hosts.
 *
 * On *.coinsclarity.com the SPA is same-origin with `/backend/*`; Vercel rewrites that
 * to camify, so the browser never cross-origin calls camify (no CORS / nginx 502 HTML).
 * Mirrors + camify remain as fallbacks for local dev and non-coinsclarity deploys.
 */
const CAMIFY = 'https://camify.fun.coinsclarity.com';

/** e.g. https://www.coinsclarity.com/backend — proxied to camify by vercel.json */
export function sameOriginBackendProxyBase(): string | null {
  if (typeof window === 'undefined') return null;
  const { hostname, origin } = window.location;
  if (!/(^|\.)coinsclarity\.com$/i.test(hostname)) return null;
  return `${origin.replace(/\/$/, '')}/backend`;
}

/** Use in components (runtime). Never `const x = ...` at module scope — window is undefined at bundle init. */
export function defaultPublicBackend(): string {
  return sameOriginBackendProxyBase() || CAMIFY;
}

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

  const same = sameOriginBackendProxyBase();
  if (same) push(same);
  MIRRORS.forEach(push);
  if (env && !env.includes('camify.fun.coinsclarity.com')) push(env);
  // Avoid browser → camify CORS when /backend proxy is active (Vercel/Netlify rewrite).
  if (!same) push(CAMIFY);
  return out;
}
