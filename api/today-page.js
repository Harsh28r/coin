const { isCrawler, serveSpaShell } = require('../lib/seo');
const { buildWhyCoinCrawlerHtml } = require('../lib/crawlerHtml');
const {
  buildPriceCrawlerHtml,
  buildIndiaCrawlerHtml,
  buildCalcCrawlerHtml,
  buildEtfCrawlerHtml,
} = require('../lib/seoGrowthCrawler');

/** Multi-route crawler HTML — keep as ONE serverless fn (Hobby hates new api/*.js). */
module.exports = async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  const kind = String(req.query.kind || 'why');
  const coinId = req.query.coinId || req.query.id;
  const direction = req.query.direction === 'down' ? 'down' : 'up';
  const slug = String(req.query.slug || '');

  const forceBotHtml = isCrawler(ua) || /google|bing|yandex|duckduck/i.test(ua);
  if (!forceBotHtml) return serveSpaShell(req, res);

  try {
    let html = null;
    if (kind === 'price') {
      if (!coinId) return res.status(400).send('coinId required');
      html = await buildPriceCrawlerHtml(String(coinId));
    } else if (kind === 'india') {
      html = buildIndiaCrawlerHtml(slug);
      if (!html) return res.status(404).send('Not found');
    } else if (kind === 'calc') {
      html = buildCalcCrawlerHtml(slug);
      if (!html) return res.status(404).send('Not found');
    } else if (kind === 'etf') {
      html = buildEtfCrawlerHtml();
    } else {
      if (!coinId) return res.status(400).send('coinId required');
      html = await buildWhyCoinCrawlerHtml(String(coinId), direction);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
