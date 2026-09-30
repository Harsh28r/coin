const { SITE, BACKEND, escape } = require('./seo');

const COIN_META = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
  tether: { name: 'Tether', symbol: 'USDT' },
  solana: { name: 'Solana', symbol: 'SOL' },
  binancecoin: { name: 'BNB', symbol: 'BNB' },
  ripple: { name: 'XRP', symbol: 'XRP' },
};

const INDIA_GUIDES = [
  {
    slug: 'buy-usdt',
    title: 'How to Buy USDT in India (2026) — UPI, P2P & Exchanges',
    description:
      'Step-by-step guide to buying USDT in India with UPI and P2P. Compare rates, avoid scams, and check live INR prices on CoinsClarity.',
    body: [
      'USDT is the most traded stablecoin for Indian crypto users.',
      'Use verified P2P sellers, match live USDT/INR rates, and never share OTPs.',
      'Run unknown token contracts through scam-check before approving.',
    ],
    links: ['/tools/p2p', '/tools/scam-check', '/price/tether'],
  },
  {
    slug: 'usdt-inr-p2p',
    title: 'USDT to INR P2P Rates Explained — Live Spreads & Tips',
    description: 'Understand USDT/INR P2P pricing, buy vs sell spreads, and how to read the CoinsClarity P2P board.',
    body: ['Buy vs sell ads define the spread.', 'UPI is usually fastest; compare top of book before confirming.'],
    links: ['/tools/p2p', '/in/buy-usdt'],
  },
  {
    slug: 'crypto-tax',
    title: 'Crypto Tax in India — TDS, 30% Flat Tax & Calculators',
    description: 'Plain-English overview of India’s crypto tax (flat 30% + TDS). Educational only.',
    body: ['VDA gains are generally taxed at a flat 30% under the current framework.', 'Keep exchange CSVs for filing.'],
    links: ['/tools/crypto-tax-calculator', '/in/buy-usdt'],
  },
  {
    slug: 'how-to-buy-bitcoin',
    title: 'How to Buy Bitcoin in India — Step by Step',
    description: 'Buy BTC in India via INR exchanges or USDT pairs. See live Bitcoin price on CoinsClarity.',
    body: ['INR on-ramp or USDT→BTC are the two common paths.', 'Withdraw to self-custody after purchase.'],
    links: ['/price/bitcoin', '/tools/p2p', '/tools/scam-check'],
  },
  {
    slug: 'scam-check-guide',
    title: 'Crypto Scam Check Guide for India — Honeypots & Fake Tokens',
    description: 'How Indian traders get drained by honeypots. Use CoinsClarity scam-check before approving contracts.',
    body: ['Paste contracts into scam-check.', 'Never share seed phrases; revoke stale approvals.'],
    links: ['/tools/scam-check', '/tools/p2p'],
  },
  {
    slug: 'upi-crypto',
    title: 'UPI and Crypto in India — What Actually Works',
    description: 'How UPI is used with crypto P2P in India and how to keep payment trails clean.',
    body: ['Pay only inside exchange P2P flows.', 'Match UPI name to KYC name on the platform.'],
    links: ['/tools/p2p', '/in/usdt-inr-p2p'],
  },
  {
    slug: 'best-crypto-apps',
    title: 'Best Crypto Apps for India (2026) — What to Look For',
    description: 'How to choose crypto apps in India: KYC, P2P depth, fees, withdrawals, and security.',
    body: ['Test small deposit/withdraw loops.', 'Prefer liquidity and withdrawal reliability over UI.'],
    links: ['/tools/p2p', '/tools/scam-check', '/price/bitcoin'],
  },
  {
    slug: 'crypto-banking',
    title: 'Crypto and Indian Banks — Freezes, TDS & Practical Tips',
    description: 'Why banks sometimes flag crypto-related UPI and how to keep clean trails.',
    body: ['Avoid circular transfers.', 'Keep exchange statements ready for source-of-funds questions.'],
    links: ['/in/crypto-tax', '/tools/p2p'],
  },
  {
    slug: 'ethereum-gas-india',
    title: 'Ethereum Gas Fees for Indian Traders — When to Transact',
    description: 'ETH gas eats profits on small trades. Track live gas and prefer L2s.',
    body: ['Check gas before bridging or claiming.', 'Prefer L2s for frequent small moves.'],
    links: ['/tools/gas/ethereum', '/tools/gas/polygon', '/tools/p2p'],
  },
  {
    slug: 'funding-rates-basics',
    title: 'Crypto Funding Rates Explained — For Indian Futures Traders',
    description: 'What perpetual funding rates mean and how to read CoinsClarity funding tool.',
    body: ['Positive funding: longs pay shorts.', 'Combine funding with liquidations heat.'],
    links: ['/tools/funding', '/tools/liquidations', '/tools/liquidation-calculator'],
  },
];

const CALCS = [
  {
    slug: 'profit-calculator',
    title: 'Crypto Profit Calculator — ROI & Gains',
    description: 'Free crypto profit calculator. Enter buy price, sell price, and amount to see profit and ROI %.',
  },
  {
    slug: 'dca-calculator',
    title: 'Crypto DCA Calculator — Dollar Cost Average',
    description: 'Dollar-cost averaging calculator for Bitcoin and altcoins.',
  },
  {
    slug: 'staking-calculator',
    title: 'Crypto Staking Calculator — APY Estimates',
    description: 'Estimate staking rewards from APY and principal.',
  },
  {
    slug: 'liquidation-calculator',
    title: 'Crypto Liquidation Calculator — Futures Price',
    description: 'Estimate liquidation price for long/short perpetual positions.',
  },
  {
    slug: 'crypto-tax-calculator',
    title: 'India Crypto Tax Calculator — Flat 30% Estimate',
    description: 'Rough India VDA tax estimator using flat 30% on gains. Educational only.',
  },
];

function publisher() {
  return {
    '@type': 'Organization',
    name: 'CoinsClarity',
    url: SITE,
    logo: { '@type': 'ImageObject', url: `${SITE}/logo-square.png`, width: 512, height: 512 },
  };
}

function pageShell({ title, description, url, bodyHtml, jsonLdBlocks = [] }) {
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
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(url)}">
  ${ld}
</head>
<body><article>${bodyHtml}</article></body>
</html>`;
}

async function fetchCg(coinId) {
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

async function buildPriceCrawlerHtml(coinId) {
  const meta = COIN_META[coinId] || {
    name: coinId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    symbol: coinId.slice(0, 4).toUpperCase(),
  };
  const coin = await fetchCg(coinId);
  const price = coin?.market_data?.current_price?.usd;
  const change = coin?.market_data?.price_change_percentage_24h;
  const url = `${SITE}/price/${coinId}`;
  const title = `${meta.name} Price Today (USD & INR) — ${meta.symbol} Live`;
  const description = `Live ${meta.name} (${meta.symbol}) price, 24h change, market cap, and INR estimate on CoinsClarity.`;
  const priceLine =
    price != null
      ? `${meta.symbol} trades near $${Number(price).toLocaleString('en-US', { maximumFractionDigits: 6 })}${
          change != null ? ` (${change >= 0 ? '+' : ''}${Number(change).toFixed(2)}% 24h)` : ''
        }.`
      : `${meta.name} live price updates on CoinsClarity.`;

  const bodyHtml = `
    <nav><a href="${SITE}/">Home</a> › <a href="${SITE}/price/bitcoin">Prices</a> › <span>${escape(meta.name)}</span></nav>
    <h1>${escape(meta.name)} price today</h1>
    <p>${escape(priceLine)} Approximate INR uses a USDT/INR reference — check <a href="${SITE}/tools/p2p">live P2P</a> for executable rates.</p>
    <h2>What traders check next</h2>
    <ul>
      <li><a href="${SITE}/coin/${escape(coinId)}">${escape(meta.name)} full chart</a></li>
      <li><a href="${SITE}/coin/${escape(coinId)}/news">${escape(meta.name)} news hub</a></li>
      <li><a href="${SITE}/today/why-is-${escape(coinId)}-up">Why is ${escape(meta.symbol)} up?</a></li>
      <li><a href="${SITE}/today/why-is-${escape(coinId)}-down">Why is ${escape(meta.symbol)} down?</a></li>
      <li><a href="${SITE}/in/how-to-buy-bitcoin">Buy crypto in India</a></li>
    </ul>
    <h2>FAQ</h2>
    <h3>What is the ${escape(meta.name)} price today?</h3>
    <p>${escape(priceLine)}</p>
    <h3>Is this financial advice?</h3>
    <p>No. Educational market data only.</p>`;

  return pageShell({
    title,
    description,
    url,
    bodyHtml,
    jsonLdBlocks: [
      {
        '@context': 'https://schema.org',
        '@type': 'FinancialProduct',
        name: meta.name,
        alternateName: meta.symbol,
        url,
        ...(price != null
          ? { offers: { '@type': 'Offer', price: String(price), priceCurrency: 'USD' } }
          : {}),
        provider: publisher(),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is the ${meta.name} price today?`,
            acceptedAnswer: { '@type': 'Answer', text: priceLine },
          },
        ],
      },
    ],
  });
}

function buildIndiaCrawlerHtml(slug) {
  if (!slug) {
    const url = `${SITE}/in`;
    const title = 'Crypto in India — USDT, P2P, Tax & Scam Guides';
    const description =
      'India crypto desk: buy USDT, USDT/INR P2P, tax basics, scam checks, UPI tips, and Bitcoin how-tos.';
    const bodyHtml = `
      <h1>Crypto guides for India</h1>
      <p>${escape(description)}</p>
      <ul>
        ${INDIA_GUIDES.map(
          (g) => `<li><a href="${SITE}/in/${g.slug}">${escape(g.title)}</a> — ${escape(g.description)}</li>`,
        ).join('\n')}
      </ul>
      <p><a href="${SITE}/tools/p2p">USDT/INR P2P</a> · <a href="${SITE}/tools/scam-check">Scam-check</a> · <a href="${SITE}/price/bitcoin">BTC price</a></p>`;
    return pageShell({
      title,
      description,
      url,
      bodyHtml,
      jsonLdBlocks: [
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url, publisher: publisher() },
      ],
    });
  }

  const g = INDIA_GUIDES.find((x) => x.slug === slug);
  if (!g) return null;
  const url = `${SITE}/in/${g.slug}`;
  const bodyHtml = `
    <nav><a href="${SITE}/">Home</a> › <a href="${SITE}/in">India</a> › <span>${escape(g.slug)}</span></nav>
    <h1>${escape(g.title)}</h1>
    <p>${escape(g.description)}</p>
    ${g.body.map((p) => `<p>${escape(p)}</p>`).join('\n')}
    <h2>Tools</h2>
    <ul>${g.links.map((l) => `<li><a href="${SITE}${l}">${escape(l)}</a></li>`).join('')}</ul>`;
  return pageShell({
    title: g.title,
    description: g.description,
    url,
    bodyHtml,
    jsonLdBlocks: [
      { '@context': 'https://schema.org', '@type': 'WebPage', name: g.title, description: g.description, url, publisher: publisher() },
    ],
  });
}

function buildCalcCrawlerHtml(slug) {
  const c = CALCS.find((x) => x.slug === slug);
  if (!c) return null;
  const url = `${SITE}/tools/${c.slug}`;
  const bodyHtml = `
    <nav><a href="${SITE}/">Home</a> › <a href="${SITE}/tools">Tools</a> › <span>${escape(c.slug)}</span></nav>
    <h1>${escape(c.title)}</h1>
    <p>${escape(c.description)}</p>
    <p>Open the interactive calculator on CoinsClarity (free, no signup). Educational estimates only.</p>
    <ul>
      ${CALCS.map((x) => `<li><a href="${SITE}/tools/${x.slug}">${escape(x.title)}</a></li>`).join('')}
      <li><a href="${SITE}/in/crypto-tax">India crypto tax guide</a></li>
      <li><a href="${SITE}/tools/p2p">USDT/INR P2P</a></li>
    </ul>`;
  return pageShell({
    title: c.title,
    description: c.description,
    url,
    bodyHtml,
    jsonLdBlocks: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: c.title,
        description: c.description,
        url,
        applicationCategory: 'FinanceApplication',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: publisher(),
      },
    ],
  });
}

function buildEtfCrawlerHtml() {
  const url = `${SITE}/etf/bitcoin-flows`;
  const title = 'Bitcoin ETF Flows Today — Spot BTC ETF Inflows & Outflows';
  const description =
    'Track Bitcoin spot ETF flow context with live BTC price. Understand inflows vs outflows for traders.';
  const bodyHtml = `
    <h1>Bitcoin ETF flows</h1>
    <p>${escape(description)}</p>
    <p>Spot BTC ETF creations and redemptions are a major daily demand signal. Pair official issuer prints with live price, funding, and liquidations.</p>
    <ul>
      <li><a href="${SITE}/price/bitcoin">Bitcoin price page</a></li>
      <li><a href="${SITE}/today/why-is-bitcoin-up">Why is Bitcoin up?</a></li>
      <li><a href="${SITE}/tools/funding">Funding rates</a></li>
      <li><a href="${SITE}/tools/liquidations">Liquidations</a></li>
    </ul>
    <h2>FAQ</h2>
    <h3>What are Bitcoin ETF flows?</h3>
    <p>Net creations vs redemptions in spot Bitcoin ETFs. Positive = net demand via ETFs that day.</p>`;
  return pageShell({
    title,
    description,
    url,
    bodyHtml,
    jsonLdBlocks: [
      { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, publisher: publisher() },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What are Bitcoin ETF flows?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Net creations vs redemptions in spot Bitcoin ETFs.',
            },
          },
        ],
      },
    ],
  });
}

module.exports = {
  buildPriceCrawlerHtml,
  buildIndiaCrawlerHtml,
  buildCalcCrawlerHtml,
  buildEtfCrawlerHtml,
  INDIA_GUIDES,
  CALCS,
};
