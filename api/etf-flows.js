const { isCrawler, serveSpaShell } = require('../lib/seo');
const { buildEtfCrawlerHtml } = require('../lib/seoGrowthCrawler');

module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  if (!isCrawler(ua) && !/google|bing|yandex|duckduck/i.test(ua)) {
    return serveSpaShell(req, res);
  }
  try {
    const html = buildEtfCrawlerHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
