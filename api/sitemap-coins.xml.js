const { SITE, fetchTopCoinIds, xmlUrl, xmlSitemap } = require('./_seo');

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const ids = await fetchTopCoinIds(100);

  const urls = ids.map((id, i) =>
    xmlUrl(`${SITE}/coin/${id}`, {
      lastmod: today,
      changefreq: 'daily',
      priority: i < 10 ? '0.9' : i < 50 ? '0.8' : '0.7',
    }),
  );

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xmlSitemap(urls));
};
