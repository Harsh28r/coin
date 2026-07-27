const { SITE, xmlUrl, xmlSitemap, buildProgrammaticPaths } = require('../lib/seo');

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const paths = buildProgrammaticPaths();
  const urls = paths.map((p) =>
    xmlUrl(`${SITE}${p.loc}`, {
      lastmod: p.lastmod || today,
      changefreq: p.changefreq,
      priority: p.priority,
    }),
  );

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  res.status(200).send(xmlSitemap(urls));
};
