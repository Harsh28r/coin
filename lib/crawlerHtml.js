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
    <nav aria-label="Breadcrumb">
      <a href="${SITE}/">Home</a> ›
      <a href="${SITE}/coin/${escape(coinId)}">${escape(meta.name)}</a> ›
      <span>News</span>
    </nav>
    <h1>${escape(title)}</h1>
    <p>${escape(description)}</p>
    ${price != null ? `<p>${escape(meta.symbol)} price: $${Number(price).toLocaleString('en-US')}${change != null ? ` (${change >= 0 ? '+' : ''}${Number(change).toFixed(2)}% 24h)` : ''}</p>` : ''}
    <h2>How to use this ${escape(meta.name)} news hub</h2>
    <p>
      This page tracks ${escape(meta.name)} (${escape(meta.symbol)}) headlines and price context for traders.
      Pair it with the live chart, daily digest, and price outlook for a full desk view.
    </p>
    <ul>
      <li><a href="${SITE}/coin/${escape(coinId)}">${escape(meta.name)} live chart</a></li>
      <li><a href="${SITE}/today/why-is-${escape(coinId)}-up">Why is ${escape(meta.symbol)} up today?</a></li>
      <li><a href="${SITE}/today/why-is-${escape(coinId)}-down">Why is ${escape(meta.symbol)} down today?</a></li>
      <li><a href="${SITE}/prediction/${escape(coinId)}">${escape(meta.name)} price outlook</a></li>
      <li><a href="${SITE}/trending-desk">Trending desk</a></li>
    </ul>
    <p><em>Educational market coverage only. Not financial advice.</em></p>`;

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
  const price = coin?.market_data?.current_price?.usd;
  const change = coin?.market_data?.price_change_percentage_24h;
  const mcap = coin?.market_data?.market_cap?.usd;
  const volume = coin?.market_data?.total_volume?.usd;
  const verb = direction === 'down' ? 'Down' : 'Up';
  const url = `${SITE}/today/why-is-${coinId}-${direction}`;
  const title = `Why Is ${meta.name} ${verb} Today?`;
  const pct = change != null ? `${change >= 0 ? '+' : ''}${Number(change).toFixed(2)}%` : 'moving';
  const description = `${meta.name} (${meta.symbol}) is ${direction === 'up' ? 'up' : 'down'} ${pct} in 24h. See catalysts, headlines, and trader context on CoinsClarity.`;
  const priceLine =
    price != null
      ? `${meta.symbol} trades near $${Number(price).toLocaleString('en-US', { maximumFractionDigits: 6 })}.`
      : `${meta.name} price is updating live on CoinsClarity.`;
  const mcapLine =
    mcap != null ? `Market cap is about $${Number(mcap).toLocaleString('en-US', { maximumFractionDigits: 0 })}.` : '';
  const volLine =
    volume != null ? `24h volume is about $${Number(volume).toLocaleString('en-US', { maximumFractionDigits: 0 })}.` : '';

  const bodyHtml = `
    <nav aria-label="Breadcrumb">
      <a href="${SITE}/">Home</a> ›
      <a href="${SITE}/coin/${escape(coinId)}">${escape(meta.name)}</a> ›
      <span>Why ${escape(meta.symbol)} ${escape(direction)}</span>
    </nav>
    <h1>${escape(title)}</h1>
    <p><strong>Quick answer:</strong> ${escape(description)}</p>
    <h2>${escape(meta.name)} live market snapshot</h2>
    <p>${escape(priceLine)} ${escape(mcapLine)} ${escape(volLine)}</p>
    <p>
      Traders usually check ETF flows, funding rates, BTC correlation, exchange listings, and major headlines
      when ${escape(meta.symbol)} is ${direction === 'up' ? 'pumping' : 'dumping'}. This page refreshes with live
      CoinGecko market data and links into CoinsClarity news and outlook desks.
    </p>
    <h2>What to check next</h2>
    <ul>
      <li><a href="${SITE}/coin/${escape(coinId)}">${escape(meta.name)} live price chart</a></li>
      <li><a href="${SITE}/coin/${escape(coinId)}/news">${escape(meta.name)} news hub</a></li>
      <li><a href="${SITE}/prediction/${escape(coinId)}">${escape(meta.name)} price outlook</a></li>
      <li><a href="${SITE}/today/why-is-${escape(coinId)}-${direction === 'up' ? 'down' : 'up'}">Why is ${escape(meta.symbol)} ${direction === 'up' ? 'down' : 'up'}?</a></li>
      <li><a href="${SITE}/trending-desk">Trending desk</a></li>
      <li><a href="${SITE}/daily-digest">Daily digest</a></li>
    </ul>
    <h2>FAQ</h2>
    <h3>Why is ${escape(meta.name)} ${escape(direction)} today?</h3>
    <p>${escape(description)} Use the live chart and ${escape(meta.symbol)} news hub to confirm catalysts before trading.</p>
    <h3>Is this financial advice?</h3>
    <p>No. CoinsClarity content is educational market coverage only, not investment advice.</p>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: title,
      description,
      url,
      dateModified: new Date().toISOString(),
      datePublished: new Date().toISOString(),
      publisher: publisherJsonLd(),
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleBody: description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Why is ${meta.name} ${direction} today?`,
          acceptedAnswer: { '@type': 'Answer', text: description },
        },
        {
          '@type': 'Question',
          name: `What is ${meta.symbol} price right now?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: priceLine || `${meta.name} price is available on CoinsClarity.`,
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: meta.name, item: `${SITE}/coin/${coinId}` },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  ];

  return buildCrawlerPage({ title, description, url, bodyHtml, jsonLdBlocks: jsonLd });
}

module.exports = {
  buildCoinNewsCrawlerHtml,
  buildWhyCoinCrawlerHtml,
};
