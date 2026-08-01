const { SITE, xmlSitemapIndex } = require('../lib/seo');

/** Sitemap index → static pages, coins, blog posts */
module.exports = async function handler(req, res) {
  const host = req.headers.host?.includes('coinsclarity.com')
    ? SITE
    : `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

  const xml = xmlSitemapIndex([
    `${host}/sitemap-static.xml`,
    `${host}/sitemap-coins.xml`,
    `${host}/sitemap-programmatic.xml`,
    `${host}/sitemap-news.xml`,
    `${host}/sitemap-blog.xml`,
  ]);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
