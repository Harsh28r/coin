/**
 * RSS / crypto API hosts.
 *
 * Order: same-origin `/backend/*` (Vercel → camify) → camify direct → Render → Vercel mirror.
 * On *.coinsclarity.com the SPA is same-origin with `/backend/*`; rewrites hit camify first.
 */
export const CAMIFY_PRIMARY = 'https://camify.fun.coinsclarity.com';

/** Apex + any subdomain: www.coinsclarity.com, camify.fun.coinsclarity.com, etc. */
export function isCoinsclarityHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'coinsclarity.com' || h.endsWith('.coinsclarity.com');
}

/**
 * e.g. https://www.coinsclarity.com/backend — proxied to camify by vercel.json (same-origin, no CORS).
 */
export function sameOriginBackendProxyBase(): string | null {
  if (typeof window === 'undefined') return null;
  const { hostname, origin } = window.location;
  if (!isCoinsclarityHost(hostname)) return null;
  return `${origin.replace(/\/$/, '')}/backend`;
}

/** Use in components (runtime). Never `const x = ...` at module scope — window is undefined at bundle init. */
export function defaultPublicBackend(): string {
  return sameOriginBackendProxyBase() || CAMIFY_PRIMARY;
}

/** Secondary / tertiary when camify is down or blocked */
const RENDER_FALLBACKS = [
  'https://c-back-1.onrender.com',
  'https://c-back-2.onrender.com',
];

const TERTIARY_MIRRORS = ['https://c-back-seven.vercel.app'];

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

/**
 * Failover chain: same-origin /backend → camify → Render → Vercel → optional REACT_APP_API_BASE_URL
 * (unless that env is localhost or already in the list).
 */
export function buildRssBackendBases(envBase?: string): string[] {
  const env = stripBase((envBase ?? process.env.REACT_APP_API_BASE_URL ?? '').trim());
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

  // Direct camify from www.coinsclarity.com is cross-origin and often blocked by CORS when camify 502s;
  // /backend proxy is the supported path on *.coinsclarity.com.
  if (!same) push(CAMIFY_PRIMARY);
  RENDER_FALLBACKS.forEach(push);
  TERTIARY_MIRRORS.forEach(push);

  if (env && !env.includes('camify.fun.coinsclarity.com')) push(env);
  return out;
}

/** CRA env only — no hardcoded mirror; order is still /backend → camify → Render → Vercel. */
export function buildRssBackendBasesFromEnv(): string[] {
  return buildRssBackendBases(
    (process.env.REACT_APP_API_URL as string | undefined) ||
      (process.env.REACT_APP_API_BASE_URL as string | undefined),
  );
}
