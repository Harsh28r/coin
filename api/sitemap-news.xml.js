const {
  SITE,
  xmlUrl,
  xmlSitemap,
  buildProgrammaticPaths,
  fetchIndexableBlogPaths,
} = require('../lib/seo');

/** Indexable original + programmatic pages (NOT syndicated /news/* aggregator URLs) */
module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];

  const programmatic = buildProgrammaticPaths();
  for (const p of programmatic) {
    urls.push(
      xmlUrl(`${SITE}${p.loc}`, {
        lastmod: p.lastmod || today,
        changefreq: p.changefreq,
        priority: p.priority,
      }),
    );
  }

  const blogPaths = await fetchIndexableBlogPaths(500);
  for (const p of blogPaths) {
    urls.push(
      xmlUrl(`${SITE}${p.loc}`, {
        lastmod: p.lastmod || today,
        changefreq: p.changefreq || 'weekly',
        priority: p.priority || '0.65',
      }),
    );
  }

  // Desk archives — high crawl priority
  for (const path of ['/daily-digest', '/trending-desk', '/predictions', '/live', '/blog']) {
    urls.push(xmlUrl(`${SITE}${path}`, { lastmod: today, changefreq: 'daily', priority: '0.9' }));
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  res.status(200).send(xmlSitemap(urls));
};
