const { isCrawler, serveSpaShell } = require('../lib/seo');
const { buildPriceCrawlerHtml } = require('../lib/seoGrowthCrawler');

module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  const coinId = req.query.coinId || req.query.id;
  if (!coinId) return res.status(400).send('coinId required');
  if (!isCrawler(ua) && !/google|bing|yandex|duckduck/i.test(ua)) {
    return serveSpaShell(req, res);
  }
  try {
    const html = await buildPriceCrawlerHtml(String(coinId));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
