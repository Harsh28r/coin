const SITE = 'https://www.coinsclarity.com';
const BACKEND = process.env.SEO_BACKEND_URL || 'https://camify.fun.coinsclarity.com';

const CRAWLER_RE =
  /googlebot|google-inspectiontool|storebot-google|adsbot-google|apis-google|mediapartners-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|petalbot|bytespider|gptbot|claudebot/i;

function escape(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isCrawler(userAgent) {
  return CRAWLER_RE.test(userAgent || '');
}

async function serveSpaShell(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'www.coinsclarity.com';
  try {
    const r = await fetch(`${proto}://${host}/index.html`, {
      headers: { 'User-Agent': 'CoinsClarity-SEO/1.0' },
    });
    const html = await r.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(html);
  } catch {
    return res.redirect(307, '/');
  }
}

function xmlUrl(loc, opts = {}) {
  const lastmod = opts.lastmod || new Date().toISOString().slice(0, 10);
  const changefreq = opts.changefreq || 'weekly';
  const priority = opts.priority ?? '0.7';
  return `  <url>\n    <loc>${escape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function xmlSitemap(urls) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls.join('\n')}\n</urlset>`
  );
}

function xmlSitemapIndex(entries) {
  const today = new Date().toISOString().slice(0, 10);
  const body = entries
    .map(
      (loc) =>
        `  <sitemap>\n    <loc>${escape(loc)}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
    )
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`
  );
}

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/blog', priority: '0.9', changefreq: 'daily' },
  { path: '/daily-digest', priority: '0.9', changefreq: 'daily' },
  { path: '/trending-desk', priority: '0.9', changefreq: 'daily' },
  { path: '/predictions', priority: '0.9', changefreq: 'daily' },
  { path: '/live', priority: '0.9', changefreq: 'hourly' },
  { path: '/authors', priority: '0.8', changefreq: 'weekly' },
  { path: '/author/elena-vasquez', priority: '0.7', changefreq: 'weekly' },
  { path: '/author/james-okonkwo', priority: '0.7', changefreq: 'weekly' },
  { path: '/author/maya-rao', priority: '0.7', changefreq: 'weekly' },
  { path: '/author/kenji-tanaka', priority: '0.7', changefreq: 'weekly' },
  { path: '/learn', priority: '0.8', changefreq: 'weekly' },
  { path: '/listings', priority: '0.8', changefreq: 'daily' },
  { path: '/events', priority: '0.7', changefreq: 'weekly' },
  { path: '/market-movers', priority: '0.85', changefreq: 'weekly' },
  { path: '/ai-news', priority: '0.6', changefreq: 'daily' },
  { path: '/beyond-the-headlines', priority: '0.7', changefreq: 'daily' },
  { path: '/tools', priority: '0.9', changefreq: 'weekly' },
  { path: '/tools/fear-greed', priority: '0.9', changefreq: 'daily' },
  { path: '/tools/gas', priority: '0.9', changefreq: 'daily' },
  { path: '/tools/scam-check', priority: '0.8', changefreq: 'weekly' },
  { path: '/tools/unlocks', priority: '0.9', changefreq: 'daily' },
  { path: '/arbitrage', priority: '0.8', changefreq: 'weekly' },
  { path: '/arbitrage-scanner', priority: '0.8', changefreq: 'daily' },
  { path: '/compare', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/advertise', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.5', changefreq: 'monthly' },
  { path: '/disclaimer', priority: '0.5', changefreq: 'monthly' },
];

/** Top coins for programmatic SEO sitemaps (keep in sync with src/utils/coinRegistry.ts) */
const PROGRAMMATIC_COINS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'usd-coin',
  'cardano', 'dogecoin', 'tron', 'avalanche-2', 'chainlink', 'polkadot',
  'polygon-ecosystem-token', 'litecoin', 'uniswap', 'stellar', 'cosmos', 'near',
  'aptos', 'arbitrum', 'optimism', 'sui', 'injective-protocol', 'render-token',
  'the-open-network', 'shiba-inu', 'pepe', 'fetch-ai', 'filecoin',
];

const EVENT_KIND_SLUGS = [
  'listing', 'etf', 'unlock', 'upgrade', 'fork', 'mainnet', 'court', 'delisting',
];

const COMPARE_SLUGS = [
  'bitcoin-vs-ethereum',
  'ethereum-vs-solana',
  'bitcoin-vs-solana',
  'ethereum-vs-cardano',
  'solana-vs-avalanche-2',
  'ripple-vs-stellar',
  'bitcoin-vs-cardano',
  'ethereum-vs-polkadot',
  'binancecoin-vs-ethereum',
  'dogecoin-vs-shiba-inu',
];

function buildProgrammaticPaths() {
  const today = new Date().toISOString().slice(0, 10);
  const paths = [];
  for (const id of PROGRAMMATIC_COINS) {
    paths.push({ loc: `/coin/${id}/news`, lastmod: today, changefreq: 'hourly', priority: '0.85' });
    paths.push({ loc: `/today/why-is-${id}-up`, lastmod: today, changefreq: 'hourly', priority: '0.8' });
    paths.push({ loc: `/today/why-is-${id}-down`, lastmod: today, changefreq: 'hourly', priority: '0.75' });
    paths.push({ loc: `/prediction/${id}`, lastmod: today, changefreq: 'daily', priority: '0.75' });
  }
  for (const kind of EVENT_KIND_SLUGS) {
    paths.push({ loc: `/events/${kind}`, lastmod: today, changefreq: 'daily', priority: '0.7' });
  }
  return paths;
}

async function fetchIndexableBlogPaths(limit = 500) {
  try {
    const r = await fetch(`${BACKEND}/sitemap-blog.xml`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return [];
    const xml = await r.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const today = new Date().toISOString().slice(0, 10);
    return locs.slice(0, limit).map((loc) => {
      const path = loc.replace(SITE, '');
      return { loc: path, lastmod: today, changefreq: 'weekly', priority: path.includes('/prediction/') ? '0.75' : '0.65' };
    });
  } catch {
    return [];
  }
}

async function fetchTopCoinIds(limit = 100) {
  const q = `coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
  const url = `${BACKEND}/crypto/cg?u=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) return [];
    const data = await r.json();
    if (!Array.isArray(data)) return [];
    return data.map((c) => c.id).filter(Boolean);
  } catch {
    return [
      'bitcoin',
      'ethereum',
      'tether',
      'binancecoin',
      'solana',
      'ripple',
      'usd-coin',
      'cardano',
      'dogecoin',
      'tron',
    ];
  }
}

module.exports = {
  SITE,
  BACKEND,
  escape,
  isCrawler,
  serveSpaShell,
  xmlUrl,
  xmlSitemap,
  xmlSitemapIndex,
  STATIC_ROUTES,
  COMPARE_SLUGS,
  PROGRAMMATIC_COINS,
  EVENT_KIND_SLUGS,
  buildProgrammaticPaths,
  fetchIndexableBlogPaths,
  fetchTopCoinIds,
};
