const { isCrawler, serveSpaShell } = require('../lib/seo');
const { buildWhyCoinCrawlerHtml } = require('../lib/crawlerHtml');

module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  const coinId = req.query.coinId || req.query.id;
  const direction = req.query.direction === 'down' ? 'down' : 'up';

  if (!coinId) return res.status(400).send('coinId required');

  // Always serve indexable HTML for bots + Google Inspection Tool.
  // Humans still get SPA when UA is normal browser.
  const forceBotHtml = isCrawler(ua) || /google|bing|yandex|duckduck/i.test(ua);

  if (!forceBotHtml) return serveSpaShell(req, res);

  try {
    const html = await buildWhyCoinCrawlerHtml(String(coinId), direction);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
