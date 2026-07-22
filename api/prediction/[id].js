const { SITE, BACKEND, escape, isCrawler, serveSpaShell } = require('../../lib/seo');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const ua = req.headers['user-agent'] || '';

  if (!isCrawler(ua)) {
    return serveSpaShell(req, res);
  }

  const coinId = String(id || '').toLowerCase().trim();
  let post = null;

  try {
    const r = await fetch(`${BACKEND}/api/price-outlook/${encodeURIComponent(coinId)}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (r.ok) {
      const data = await r.json();
      post = data?.data || null;
    }
  } catch {}

  if (!post) {
    try {
      const slug = `price-outlook-${coinId}`;
      const r = await fetch(`${BACKEND}/posts/${encodeURIComponent(slug)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const data = await r.json();
        post = data?.data || data;
      }
    } catch {}
  }

  const o = post?.outlook || {};
  const title =
    post?.title ||
    `${o.coinName || coinId} Price Outlook ${o.horizon || '2026–2030'} | CoinsClarity`;
  const rawDesc = o.stanceSummary || post?.excerpt || post?.content || '';
  const description =
    String(rawDesc)
      .replace(/<[^>]*>/g, '')
      .slice(0, 160) || title;
  const image = post?.imageUrl || post?.image || `${SITE}/logo3.png`;
  const url = `${SITE}/prediction/${coinId}`;
  const date = post?.date ? new Date(post.date).toISOString() : new Date().toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: [image],
    datePublished: date,
    dateModified: o.asOf ? new Date(o.asOf).toISOString() : date,
    author: {
      '@type': 'Person',
      name: post?.author || 'Elena Vasquez',
      jobTitle: 'Markets Analyst',
      worksFor: { '@type': 'Organization', name: 'CoinsClarity' },
    },
    publisher: {
      '@type': 'Organization',
      name: 'CoinsClarity',
      logo: { '@type': 'ImageObject', url: `${SITE}/logo3.png` },
    },
    mainEntityOfPage: url,
    about: {
      '@type': 'Cryptocurrency',
      name: o.coinName || coinId,
      currency: o.symbol,
    },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="${escape(post?.author || 'Elena Vasquez')}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="${SITE}/logo3.png">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CoinsClarity">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${escape(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <article>
    <h1>${escape(title)}</h1>
    <p>${escape(description)}</p>
    <p><a href="${url}">Read full Markets Desk outlook on CoinsClarity</a></p>
  </article>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  return res.status(200).send(html);
};
