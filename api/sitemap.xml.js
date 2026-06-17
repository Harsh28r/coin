const { SITE, xmlSitemapIndex } = require('./_seo');

/** Sitemap index → static pages, coins, blog posts */
module.exports = async function handler(req, res) {
  const host = req.headers.host?.includes('coinsclarity.com')
    ? SITE
    : `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

  const xml = xmlSitemapIndex([
    `${host}/api/sitemap-static.xml`,
    `${host}/api/sitemap-coins.xml`,
    `${process.env.SEO_BACKEND_URL || 'https://camify.fun.coinsclarity.com'}/sitemap-blog.xml`,
  ]);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
