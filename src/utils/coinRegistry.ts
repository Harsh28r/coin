/** Canonical coin slugs + aliases for programmatic SEO pages and internal linking */

export type CoinEntry = {
  id: string;
  name: string;
  symbol: string;
  aliases: string[];
};

export const TOP_COINS: CoinEntry[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', aliases: ['bitcoin', 'btc'] },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', aliases: ['ethereum', 'eth', 'ether'] },
  { id: 'tether', name: 'Tether', symbol: 'USDT', aliases: ['tether', 'usdt'] },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB', aliases: ['bnb', 'binance coin', 'binancecoin'] },
  { id: 'solana', name: 'Solana', symbol: 'SOL', aliases: ['solana', 'sol'] },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', aliases: ['xrp', 'ripple'] },
  { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', aliases: ['usdc', 'usd coin'] },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', aliases: ['cardano', 'ada'] },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', aliases: ['dogecoin', 'doge'] },
  { id: 'tron', name: 'TRON', symbol: 'TRX', aliases: ['tron', 'trx'] },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', aliases: ['avalanche', 'avax'] },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', aliases: ['chainlink', 'link'] },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', aliases: ['polkadot', 'dot'] },
  { id: 'polygon-ecosystem-token', name: 'Polygon', symbol: 'POL', aliases: ['polygon', 'matic', 'pol'] },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', aliases: ['litecoin', 'ltc'] },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', aliases: ['uniswap', 'uni'] },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', aliases: ['stellar', 'xlm'] },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', aliases: ['cosmos', 'atom'] },
  { id: 'near', name: 'NEAR', symbol: 'NEAR', aliases: ['near protocol', 'near'] },
  { id: 'aptos', name: 'Aptos', symbol: 'APT', aliases: ['aptos', 'apt'] },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', aliases: ['arbitrum', 'arb'] },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', aliases: ['optimism'] },
  { id: 'sui', name: 'Sui', symbol: 'SUI', aliases: ['sui'] },
  { id: 'injective-protocol', name: 'Injective', symbol: 'INJ', aliases: ['injective', 'inj'] },
  { id: 'render-token', name: 'Render', symbol: 'RNDR', aliases: ['render', 'rndr'] },
  { id: 'the-open-network', name: 'Toncoin', symbol: 'TON', aliases: ['toncoin', 'ton'] },
  { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', aliases: ['shiba inu', 'shib'] },
  { id: 'pepe', name: 'Pepe', symbol: 'PEPE', aliases: ['pepe'] },
  { id: 'fetch-ai', name: 'Fetch.ai', symbol: 'FET', aliases: ['fetch.ai', 'fetch ai', 'fet'] },
  { id: 'filecoin', name: 'Filecoin', symbol: 'FIL', aliases: ['filecoin', 'fil'] },
];

const byId = new Map(TOP_COINS.map((c) => [c.id, c]));
const aliasToId = new Map<string, string>();

for (const coin of TOP_COINS) {
  aliasToId.set(coin.id, coin.id);
  aliasToId.set(coin.symbol.toLowerCase(), coin.id);
  for (const a of coin.aliases) aliasToId.set(a.toLowerCase().trim(), coin.id);
}

export function resolveCoinId(input: string): string | null {
  const key = String(input || '').toLowerCase().trim();
  if (!key) return null;
  if (byId.has(key)) return key;
  return aliasToId.get(key) || null;
}

export function getCoinById(id: string): CoinEntry | null {
  return byId.get(id) || null;
}

export function coinMatchesText(coin: CoinEntry, text: string): boolean {
  const hay = ` ${text.toLowerCase()} `;
  if (hay.includes(` ${coin.id} `)) return true;
  if (hay.includes(` ${coin.symbol.toLowerCase()} `)) return true;
  return coin.aliases.some((a) => hay.includes(` ${a.toLowerCase()} `));
}

export function detectCoinsInText(text: string, limit = 8): CoinEntry[] {
  const out: CoinEntry[] = [];
  for (const coin of TOP_COINS) {
    if (coinMatchesText(coin, text)) out.push(coin);
    if (out.length >= limit) break;
  }
  return out;
}

export function slugifyEventTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
