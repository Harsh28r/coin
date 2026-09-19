const { SITE, xmlSitemapIndex } = require('../lib/seo');

/** Sitemap index → static pages, coins, blog posts */
module.exports = async function handler(req, res) {
  const xml = xmlSitemapIndex([
    `${SITE}/sitemap-static.xml`,
    `${SITE}/sitemap-coins.xml`,
    `${SITE}/sitemap-programmatic.xml`,
    `${SITE}/sitemap-news.xml`,
    `${SITE}/sitemap-blog.xml`,
  ]);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
