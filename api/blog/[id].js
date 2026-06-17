const { SITE, BACKEND, escape, isCrawler, serveSpaShell } = require('../_seo');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const ua = req.headers['user-agent'] || '';

  if (!isCrawler(ua)) {
    return serveSpaShell(req, res);
  }

  try {
    let post = null;
    for (const path of ['/posts', '/api/posts']) {
      try {
        const r = await fetch(`${BACKEND}${path}?limit=100`, {
          signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) continue;
        const data = await r.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        post = list.find(
          (p) => p.slug === id || String(p._id) === id || String(p.id) === id,
        );
        if (post) break;
      } catch {}
    }

    if (!post) {
      try {
        const r = await fetch(`${BACKEND}/posts/${encodeURIComponent(id)}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (r.ok) {
          const data = await r.json();
          post = data?.data || data;
        }
      } catch {}
    }

    const title = post?.title || 'CoinsClarity Blog';
    const rawDesc = post?.excerpt || post?.content || '';
    const description = rawDesc.replace(/<[^>]*>/g, '').slice(0, 160) || title;
    const image = post?.imageUrl || post?.image || `${SITE}/logo3.png`;
    const key = post?.slug || post?._id || id;
    const url = `${SITE}/blog/${key}`;
    const date = post?.date ? new Date(post.date).toISOString() : new Date().toISOString();

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      image: [image],
      datePublished: date,
      dateModified: date,
      author: { '@type': 'Person', name: post?.author || 'CoinsClarity' },
      publisher: {
        '@type': 'Organization',
        name: 'CoinsClarity',
        logo: { '@type': 'ImageObject', url: `${SITE}/logo3.png` },
      },
      mainEntityOfPage: url,
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escape(title)} | CoinsClarity</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="${SITE}/logo3.png">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CoinsClarity">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${escape(image)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <article>
    <h1>${escape(title)}</h1>
    <p>${escape(description)}</p>
    <p><a href="${url}">Read on CoinsClarity</a></p>
  </article>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch {
    return serveSpaShell(req, res);
  }
};
