import { sameOriginBackendProxyBase } from './rssBackendBases';

const CG = 'https://api.coingecko.com/api/v3';

/**
 * CoinGecko v3 URL. On coinsclarity.com production, uses same-origin `/backend/crypto/cg`
 * (Vercel → camify) so the browser is not blocked by CoinGecko CORS.
 */
export function coingeckoV3Url(pathWithQuery: string): string {
  let p = pathWithQuery.trim().replace(/^\//, '');
  if (/^api\/v3\//i.test(p)) p = p.replace(/^api\/v3\//i, '');
  const proxy = sameOriginBackendProxyBase();
  if (proxy) return `${proxy}/crypto/cg?u=${encodeURIComponent(p)}`;
  return `${CG}/${p}`;
}
