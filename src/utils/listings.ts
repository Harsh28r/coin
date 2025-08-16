import type { RawItem } from './events';

export interface ListingItem {
  title: string;
  pubDate?: string;
  link?: string;
  source_name?: string;
  image_url?: string;
  content?: string;
  description?: string;
  article_id?: string;
  coins: string[];
  exchange?: string;
  raw: any;
}

const LISTING_RE = /(lists|listing|listed|trading\s+starts|launch(?:es)?\s+on|now\s+available\s+on)/i;
const EXCHANGE_RE = /(binance|coinbase|kraken|bybit|okx|okex|kucoin|bitget|gate\.io|huobi|mexc|bitfinex|gemini|bitstamp)/i;

function extractCoins(text: string): string[] {
  const set = new Set<string>();
  // $SOL, $ARB
  const dollar = text.match(/\$[A-Z0-9]{2,10}\b/g) || [];
  dollar.forEach(s => set.add(s.replace('$', '').toUpperCase()));
  // (SOL), (ARB)
  const paren = text.match(/\(([A-Z0-9]{2,10})\)/g) || [];
  paren.forEach(p => set.add(p.replace(/[()]/g, '').toUpperCase()));
  // plain tokens before \/USDT or -USDT etc.
  const pair = text.match(/\b([A-Z0-9]{2,10})[\/-](USDT|USD|BTC|ETH|EUR)\b/g) || [];
  pair.forEach(m => {
    const t = m.split(/[\/-]/)[0];
    set.add(t.toUpperCase());
  });
  // Heuristic: ALLCAPS 2-6 chars near 'lists' word
  const near = text.match(/\b[A-Z]{2,6}\b/g) || [];
  near.forEach(s => { if (s.length >= 2 && s.length <= 6) set.add(s.toUpperCase()); });
  return Array.from(set).slice(0, 6);
}

function extractExchange(text: string): string | undefined {
  const m = text.match(EXCHANGE_RE);
  if (!m) return undefined;
  const name = m[1];
  if (!name) return undefined;
  return name.toUpperCase().replace(/\.IO$/, '.IO');
}

export function extractListingNews(items: RawItem[]): ListingItem[] {
  const out: ListingItem[] = [];
  for (const it of items) {
    const text = `${it.title || ''} ${it.description || ''} ${it.content || ''}`;
    if (!LISTING_RE.test(text)) continue;
    const coins = extractCoins(text);
    const exchange = extractExchange(text);
    out.push({
      title: it.title || 'Untitled',
      pubDate: it.pubDate,
      link: (it as any).link,
      source_name: (it as any).source_name,
      image_url: (it as any).image_url,
      content: (it as any).content,
      description: (it as any).description,
      article_id: (it as any).article_id,
      coins,
      exchange,
      raw: it,
    });
  }
  // de-duplicate by title+link
  const seen = new Set<string>();
  const dedup: ListingItem[] = [];
  for (const e of out) {
    const key = `${e.title}|${e.link}`;
    if (!seen.has(key)) { seen.add(key); dedup.push(e); }
  }
  // sort by pubDate desc
  dedup.sort((a, b) => (Date.parse(b.pubDate || '') || 0) - (Date.parse(a.pubDate || '') || 0));
  return dedup.slice(0, 100);
}


