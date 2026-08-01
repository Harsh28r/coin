const { BACKEND } = require('../lib/seo');

/** Proxy blog/prediction sitemap from API and normalize locs to www. */
module.exports = async function handler(req, res) {
  try {
    const upstream = await fetch(`${BACKEND}/sitemap-blog.xml`, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/xml,text/xml,*/*' },
    });
    if (!upstream.ok) {
      res.status(upstream.status).setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send('sitemap-blog upstream error');
    }
    let xml = await upstream.text();
    xml = xml
      .replace(/https:\/\/coinsclarity\.com\//g, 'https://www.coinsclarity.com/')
      .replace(/http:\/\/coinsclarity\.com\//g, 'https://www.coinsclarity.com/');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('[sitemap-blog] proxy failed:', error.message);
    res.status(502).setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send('sitemap-blog unavailable');
  }
};
