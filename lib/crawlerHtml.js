const { SITE, BACKEND, escape } = require('./seo');

const COIN_NAMES = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
  solana: { name: 'Solana', symbol: 'SOL' },
  ripple: { name: 'XRP', symbol: 'XRP' },
  binancecoin: { name: 'BNB', symbol: 'BNB' },
  cardano: { name: 'Cardano', symbol: 'ADA' },
  dogecoin: { name: 'Dogecoin', symbol: 'DOGE' },
};

async function fetchCoinMarket(coinId) {
  try {
    const cgPath = `coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const r = await fetch(`${BACKEND}/crypto/cg?u=${encodeURIComponent(cgPath)}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

function publisherJsonLd() {
  return {
    '@type': 'Organization',
    name: 'CoinsClarity',
    url: SITE,
    logo: { '@type': 'ImageObject', url: `${SITE}/logo3.png` },
  };
}

function buildCrawlerPage({ title, description, url, bodyHtml, jsonLdBlocks = [] }) {
  const ld = jsonLdBlocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escape(title)} | CoinsClarity</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${escape(url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CoinsClarity">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(url)}">
  <meta name="twitter:card" content="summary_large_image">
  ${ld}
</head>
<body>
  <article>${bodyHtml}</article>
</body>
</html>`;
}

async function buildCoinNewsCrawlerHtml(coinId) {
  const meta = COIN_NAMES[coinId] || { name: coinId.replace(/-/g, ' '), symbol: coinId.toUpperCase() };
  const coin = await fetchCoinMarket(coinId);
  const price = coin?.market_data?.current_price?.usd;
  const change = coin?.market_data?.price_change_percentage_24h;
  const url = `${SITE}/coin/${coinId}/news`;
  const title = `${meta.name} (${meta.symbol}) News Today`;
  const description = `Latest ${meta.name} news, price catalysts, and market impact. Live ${meta.symbol} headlines on CoinsClarity.`;

  const bodyHtml = `
    <h1>${escape(title)}</h1>
    <p>${escape(description)}</p>
    ${price != null ? `<p>${escape(meta.symbol)} price: $${Number(price).toLocaleString('en-US')}${change != null ? ` (${change >= 0 ? '+' : ''}${change.toFixed(2)}% 24h)` : ''}</p>` : ''}
    <p><a href="${url}">Read live ${escape(meta.name)} news on CoinsClarity</a></p>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    publisher: publisherJsonLd(),
  };

  return buildCrawlerPage({ title, description, url, bodyHtml, jsonLdBlocks: [jsonLd] });
}

async function buildWhyCoinCrawlerHtml(coinId, direction) {
  const meta = COIN_NAMES[coinId] || { name: coinId.replace(/-/g, ' '), symbol: coinId.toUpperCase() };
  const coin = await fetchCoinMarket(coinId);
  const change = coin?.market_data?.price_change_percentage_24h;
  const verb = direction === 'down' ? 'Down' : 'Up';
  const url = `${SITE}/today/why-is-${coinId}-${direction}`;
  const title = `Why Is ${meta.name} ${verb} Today?`;
  const pct = change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'moving';
  const description = `${meta.name} (${meta.symbol}) is ${direction === 'up' ? 'up' : 'down'} ${pct} in 24h. See catalysts, headlines, and trader context on CoinsClarity.`;

  const bodyHtml = `
    <h1>${escape(title)}</h1>
    <p><strong>Quick answer:</strong> ${escape(description)}</p>
    <p><a href="${url}">Full analysis on CoinsClarity</a></p>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    url,
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    publisher: publisherJsonLd(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return buildCrawlerPage({ title, description, url, bodyHtml, jsonLdBlocks: [jsonLd] });
}

module.exports = {
  buildCoinNewsCrawlerHtml,
  buildWhyCoinCrawlerHtml,
};
