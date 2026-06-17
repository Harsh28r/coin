const { SITE, BACKEND, escape, isCrawler, serveSpaShell } = require('../../lib/seo');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const ua = req.headers['user-agent'] || '';

  if (!isCrawler(ua)) {
    return serveSpaShell(req, res);
  }

  try {
    const endpoints = [
      '/fetch-cryptoslate-rss?limit=50',
      '/fetch-cointelegraph-rss?limit=50',
      '/fetch-all-rss?limit=100',
      '/posts',
    ];

    let article = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BACKEND}${endpoint}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const data = await response.json();
          const arr = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data)
                ? data
                : [];
          article = arr.find(
            (item) => item.article_id === id || item._id === id || String(item.guid) === id,
          );
          if (article) break;
        }
      } catch {}
    }

    const title = article?.title || 'CoinsClarity – Crypto News';
    const description = (
      article?.description ||
      article?.content?.substring(0, 160) ||
      'Real-time crypto news, listings, and market data.'
    ).replace(/<[^>]*>/g, '');
    const image = article?.image_url || article?.imageUrl || `${SITE}/logo3.png`;
    const url = `${SITE}/news/${id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escape(title)} | CoinsClarity</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escape(article?.link || url)}">
  <link rel="icon" href="${SITE}/logo3.png">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CoinsClarity">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${escape(image)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@coinsclarity">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
</head>
<body>
  <p>${escape(title)}</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
