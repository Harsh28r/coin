const { isCrawler, serveSpaShell } = require('../lib/seo');
const { buildWhyCoinCrawlerHtml } = require('../lib/crawlerHtml');

module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  const coinId = req.query.coinId || req.query.id;
  const direction = req.query.direction === 'down' ? 'down' : 'up';

  if (!isCrawler(ua)) return serveSpaShell(req, res);
  if (!coinId) return res.status(400).send('coinId required');

  try {
    const html = await buildWhyCoinCrawlerHtml(String(coinId), direction);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
