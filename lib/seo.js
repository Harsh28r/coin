const SITE = 'https://coinsclarity.com';
const BACKEND = process.env.SEO_BACKEND_URL || 'https://camify.fun.coinsclarity.com';

const CRAWLER_RE =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|petalbot/i;

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
  const host = req.headers.host || 'coinsclarity.com';
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
  fetchTopCoinIds,
};
