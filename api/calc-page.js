const { isCrawler, serveSpaShell } = require('../lib/seo');
const { buildCalcCrawlerHtml } = require('../lib/seoGrowthCrawler');

module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  const slug = String(req.query.slug || '');
  if (!isCrawler(ua) && !/google|bing|yandex|duckduck/i.test(ua)) {
    return serveSpaShell(req, res);
  }
  try {
    const html = buildCalcCrawlerHtml(slug);
    if (!html) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
