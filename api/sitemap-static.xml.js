const { SITE, STATIC_ROUTES, COMPARE_SLUGS, xmlUrl, xmlSitemap } = require('./_seo');

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC_ROUTES.map((r) =>
    xmlUrl(`${SITE}${r.path}`, {
      lastmod: today,
      changefreq: r.changefreq,
      priority: r.priority,
    }),
  );

  for (const slug of COMPARE_SLUGS) {
    urls.push(
      xmlUrl(`${SITE}/compare/${slug}`, {
        lastmod: today,
        changefreq: 'daily',
        priority: '0.8',
      }),
    );
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xmlSitemap(urls));
};
