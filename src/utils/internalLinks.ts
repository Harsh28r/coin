import { TOP_COINS, detectCoinsInText, type CoinEntry } from './coinRegistry';
import { SITE_URL } from './jsonLd';

export type InternalLink = {
  href: string;
  label: string;
  kind: 'coin' | 'news' | 'why-up' | 'why-down' | 'prediction' | 'event';
};

const SKIP_TAGS = new Set(['A', 'SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'NOSCRIPT']);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build contextual internal links for a page (8–12 targets) */
export function buildInternalLinks(opts: {
  text?: string;
  coinIds?: string[];
  limit?: number;
}): InternalLink[] {
  const limit = opts.limit ?? 12;
  const detected = detectCoinsInText(opts.text || '', 6);
  const explicit = (opts.coinIds || [])
    .map((id) => TOP_COINS.find((c) => c.id === id))
    .filter(Boolean) as CoinEntry[];

  const coins = [...explicit, ...detected].filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
  );

  const links: InternalLink[] = [];

  for (const coin of coins) {
    links.push({ href: `/coin/${coin.id}`, label: `${coin.name} price`, kind: 'coin' });
    links.push({ href: `/coin/${coin.id}/news`, label: `${coin.name} news`, kind: 'news' });
    links.push({
      href: `/today/why-is-${coin.id}-up`,
      label: `Why is ${coin.symbol} up?`,
      kind: 'why-up',
    });
    links.push({
      href: `/prediction/${coin.id}`,
      label: `${coin.name} outlook`,
      kind: 'prediction',
    });
    if (links.length >= limit) break;
  }

  links.push(
    { href: '/blog', label: 'Crypto blog', kind: 'news' },
    { href: '/daily-digest', label: 'Daily digest', kind: 'news' },
    { href: '/trending-desk', label: 'Trending desk', kind: 'news' },
    { href: '/events/listing', label: 'Listing events', kind: 'event' },
    { href: '/events/etf', label: 'ETF events', kind: 'event' },
  );

  return links.slice(0, limit);
}

/**
 * Auto-link coin names/tickers in HTML (first occurrence only, skips existing anchors).
 * Use on original CoinsClarity content — not syndicated RSS articles.
 */
export function applyInternalLinks(html: string, opts?: { maxLinks?: number }): string {
  if (!html || typeof document === 'undefined') return html;

  const maxLinks = opts?.maxLinks ?? 10;
  const root = document.createElement('div');
  root.innerHTML = html;

  let linked = 0;

  const walk = (node: Node) => {
    if (linked >= maxLinks) return;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (SKIP_TAGS.has(el.tagName)) return;
    }

    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return;

      const text = node.textContent;
      let best: { coin: CoinEntry; index: number; length: number } | null = null;

      for (const coin of TOP_COINS) {
        const patterns = [coin.name, coin.symbol, ...coin.aliases];
        for (const p of patterns) {
          if (p.length < 3) continue;
          const re = new RegExp(`\\b${escapeRegExp(p)}\\b`, 'i');
          const m = re.exec(text);
          if (!m) continue;
          if (!best || m.index < best.index) {
            best = { coin, index: m.index, length: m[0].length };
          }
        }
      }

      if (!best) return;

      const { coin, index, length } = best;
      const before = text.slice(0, index);
      const match = text.slice(index, index + length);
      const after = text.slice(index + length);

      const a = document.createElement('a');
      a.href = `${SITE_URL}/coin/${coin.id}`;
      a.className = 'cc-internal-link';
      a.setAttribute('data-cc-link', 'coin');
      a.textContent = match;

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(a);
      if (after) frag.appendChild(document.createTextNode(after));

      parent.replaceChild(frag, node);
      linked += 1;
      return;
    }

    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (linked >= maxLinks) break;
      walk(child);
    }
  };

  walk(root);
  return root.innerHTML;
}

export function renderInternalLinksList(links: InternalLink[]): string {
  const items = links
    .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
    .join('\n');
  return `<nav class="cc-related" aria-label="Related coverage"><h2>Related coverage</h2><ul>${items}</ul></nav>`;
}
