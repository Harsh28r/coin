/** Top coins for programmatic SEO pages + internal linking */

export type CatalogCoin = {
  id: string;
  name: string;
  symbol: string;
  aliases?: string[];
};

export const PILLAR_COINS: CatalogCoin[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', aliases: ['btc'] },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', aliases: ['ether', 'eth'] },
  { id: 'solana', name: 'Solana', symbol: 'SOL', aliases: ['sol'] },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', aliases: ['ripple', 'xrp'] },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB', aliases: ['binance coin', 'bnb'] },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', aliases: ['ada'] },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', aliases: ['doge'] },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', aliases: ['avax'] },
  { id: 'tron', name: 'TRON', symbol: 'TRX', aliases: ['trx'] },
  { id: 'toncoin', name: 'Toncoin', symbol: 'TON', aliases: ['ton'] },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', aliases: ['link'] },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', aliases: ['dot'] },
  { id: 'polygon-ecosystem-token', name: 'Polygon', symbol: 'POL', aliases: ['matic', 'polygon'] },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', aliases: ['ltc'] },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', aliases: ['atom'] },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', aliases: ['uni'] },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', aliases: ['xlm'] },
  { id: 'aptos', name: 'Aptos', symbol: 'APT', aliases: ['apt'] },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', aliases: ['arb'] },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', aliases: ['op'] },
  { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', aliases: ['shib'] },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', aliases: ['near'] },
  { id: 'sui', name: 'Sui', symbol: 'SUI', aliases: ['sui'] },
  { id: 'pepe', name: 'Pepe', symbol: 'PEPE', aliases: ['pepe'] },
  { id: 'render-token', name: 'Render', symbol: 'RENDER', aliases: ['rndr', 'render'] },
  { id: 'filecoin', name: 'Filecoin', symbol: 'FIL', aliases: ['fil'] },
  { id: 'internet-computer', name: 'Internet Computer', symbol: 'ICP', aliases: ['icp'] },
  { id: 'hedera-hashgraph', name: 'Hedera', symbol: 'HBAR', aliases: ['hbar'] },
  { id: 'injective-protocol', name: 'Injective', symbol: 'INJ', aliases: ['inj'] },
  { id: 'kaspa', name: 'Kaspa', symbol: 'KAS', aliases: ['kas'] },
];

export const EVENT_HUBS = [
  {
    slug: 'binance-listing',
    title: 'Binance Listing Impact',
    kind: 'Listing' as const,
    keywords: ['binance list', 'binance listing', 'lists on binance'],
    description:
      'Coins and tokens reacting to Binance listings — price impact, volume spikes, and related coverage.',
  },
  {
    slug: 'etf-approval',
    title: 'Crypto ETF Approvals',
    kind: 'ETF' as const,
    keywords: ['etf approval', 'spot etf', 'sec approves', 'bitcoin etf', 'ethereum etf'],
    description:
      'How ETF filings and approvals move Bitcoin, Ethereum, and related crypto markets.',
  },
  {
    slug: 'token-unlock',
    title: 'Token Unlock Impact',
    kind: 'Unlock' as const,
    keywords: ['token unlock', 'vesting', 'unlocks', 'cliff unlock'],
    description:
      'Upcoming and recent token unlocks — supply impact and coins most at risk.',
  },
  {
    slug: 'mainnet-launch',
    title: 'Mainnet & Network Launches',
    kind: 'Mainnet' as const,
    keywords: ['mainnet', 'go live', 'genesis', 'network launch'],
    description:
      'Mainnet launches and go-live events shaping crypto prices and narratives.',
  },
  {
    slug: 'hard-fork',
    title: 'Hard Fork & Upgrades',
    kind: 'Fork' as const,
    keywords: ['hard fork', 'soft fork', 'network upgrade', 'hardfork'],
    description:
      'Hard forks and protocol upgrades — which coins are affected and what traders watch.',
  },
  {
    slug: 'exchange-delisting',
    title: 'Exchange Delistings',
    kind: 'Delisting' as const,
    keywords: ['delist', 'delisting', 'trading halt', 'suspension'],
    description:
      'Exchange delistings and trading halts — liquidity risk and coins under pressure.',
  },
  {
    slug: 'sec-lawsuit',
    title: 'SEC & Court Cases',
    kind: 'Court' as const,
    keywords: ['sec', 'lawsuit', 'court', 'settlement', 'hearing'],
    description:
      'Regulatory lawsuits and court rulings with measurable crypto market impact.',
  },
  {
    slug: 'protocol-upgrade',
    title: 'Protocol Upgrades',
    kind: 'Upgrade' as const,
    keywords: ['upgrade', 'v2', 'v3', 'release candidate'],
    description:
      'Protocol upgrades and major releases — catalysts for price and developer activity.',
  },
];

export function findCatalogCoin(idOrSymbol: string): CatalogCoin | undefined {
  const q = idOrSymbol.toLowerCase().trim();
  return PILLAR_COINS.find(
    (c) =>
      c.id === q ||
      c.symbol.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      (c.aliases || []).some((a) => a.toLowerCase() === q),
  );
}

export function displayCoinName(id: string): string {
  return findCatalogCoin(id)?.name || id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function coinNewsPath(id: string): string {
  return `/coins/${id}/news`;
}

export function whyCoinPath(id: string): string {
  return `/today/why-is-${id}-up`;
}

export function eventHubPath(slug: string): string {
  return `/events/${slug}`;
}
