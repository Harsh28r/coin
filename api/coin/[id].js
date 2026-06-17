const { SITE, BACKEND, escape, isCrawler, serveSpaShell } = require('../_seo');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const ua = req.headers['user-agent'] || '';

  if (!isCrawler(ua)) {
    return serveSpaShell(req, res);
  }

  try {
    const cgPath = `coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const r = await fetch(`${BACKEND}/crypto/cg?u=${encodeURIComponent(cgPath)}`, {
      signal: AbortSignal.timeout(12000),
    });

    let coin = null;
    if (r.ok) coin = await r.json();

    const name = coin?.name || String(id).replace(/-/g, ' ');
    const symbol = (coin?.symbol || '').toUpperCase();
    const price = coin?.market_data?.current_price?.usd;
    const marketCap = coin?.market_data?.market_cap?.usd;
    const desc =
      coin?.description?.en?.replace(/<[^>]*>/g, '').slice(0, 160) ||
      `Live ${name} (${symbol}) price, chart, market cap, and trading data on CoinsClarity.`;
    const image = coin?.image?.large || coin?.image?.small || `${SITE}/logo3.png`;
    const url = `${SITE}/coin/${id}`;
    const title = `${name} (${symbol}) Price, Chart & Market Cap`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name,
      alternateName: symbol,
      url,
      description: desc,
      provider: { '@type': 'Organization', name: 'CoinsClarity', url: SITE },
      ...(price != null
        ? { offers: { '@type': 'Offer', price: String(price), priceCurrency: 'USD' } }
        : {}),
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escape(title)} | CoinsClarity</title>
  <meta name="description" content="${escape(desc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="${SITE}/logo3.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CoinsClarity">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(desc)}">
  <meta property="og:image" content="${escape(image)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(desc)}">
  <meta name="twitter:image" content="${escape(image)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <article>
    <h1>${escape(name)} (${escape(symbol)})</h1>
    <p>${escape(desc)}</p>
    ${price != null ? `<p>Price: $${Number(price).toLocaleString('en-US')}</p>` : ''}
    ${marketCap != null ? `<p>Market cap: $${Number(marketCap).toLocaleString('en-US')}</p>` : ''}
    <p><a href="${url}">View live chart on CoinsClarity</a></p>
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
