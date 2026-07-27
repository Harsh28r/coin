import { SITE_URL, SITE_NAME } from './jsonLd';
import type { CoinEntry } from './coinRegistry';

export type SeoMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  robots?: string;
  canonical?: string;
};

export type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  robots: string;
  keywords?: string;
  article?: { publishedTime?: string; modifiedTime?: string; author?: string };
};

const clamp = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trim()}…`);

export function buildSeoMeta(input: SeoMetaInput): SeoMeta {
  const canonical = input.canonical || `${SITE_URL}${input.path.startsWith('/') ? input.path : `/${input.path}`}`;
  const title = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
  const description = clamp(input.description.replace(/\s+/g, ' ').trim(), 160);
  const image = input.image || `${SITE_URL}/logo3.png`;

  return {
    title,
    description,
    canonical,
    robots: input.robots || 'index, follow, max-image-preview:large, max-snippet:-1',
    keywords: input.keywords?.join(', '),
    og: {
      type: input.type || 'website',
      site_name: SITE_NAME,
      title,
      description,
      url: canonical,
      image,
      ...(input.publishedTime ? { article_published_time: input.publishedTime } : {}),
      ...(input.modifiedTime ? { article_modified_time: input.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@coinsclarity',
      title,
      description,
      image,
    },
    article:
      input.type === 'article'
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime || input.publishedTime,
            author: input.author,
          }
        : undefined,
  };
}

export function coinNewsMeta(coin: CoinEntry): SeoMeta {
  return buildSeoMeta({
    title: `${coin.name} (${coin.symbol}) News Today — Latest Headlines & Price Impact`,
    description: `Live ${coin.name} news, breaking headlines, ETF and listing updates, and price catalysts. Updated hourly on CoinsClarity.`,
    path: `/coin/${coin.id}/news`,
    keywords: [
      `${coin.name} news`,
      `${coin.symbol} news today`,
      `${coin.name} price news`,
      'crypto news',
    ],
  });
}

export function whyCoinMeta(coin: CoinEntry, direction: 'up' | 'down'): SeoMeta {
  const verb = direction === 'up' ? 'Up' : 'Down';
  const action = direction === 'up' ? 'pumping' : 'dumping';
  return buildSeoMeta({
    title: `Why Is ${coin.name} ${verb} Today? ${coin.symbol} Price Catalysts Explained`,
    description: `Why is ${coin.name} ${action} today? See live ${coin.symbol} price moves, breaking news catalysts, ETF flows, and trader sentiment — updated in real time.`,
    path: `/today/why-is-${coin.id}-${direction}`,
    keywords: [
      `why is ${coin.name} ${direction}`,
      `why is ${coin.symbol} ${action}`,
      `${coin.name} price today`,
      `${coin.symbol} ${direction} today`,
    ],
  });
}

export function eventHubMeta(kind: string, label: string): SeoMeta {
  return buildSeoMeta({
    title: `${label} Crypto Events — Coins Affected & Market Impact`,
    description: `Track upcoming ${label.toLowerCase()} events in crypto: affected coins, dates, and market impact analysis on CoinsClarity.`,
    path: `/events/${kind}`,
    keywords: [`crypto ${kind} events`, `${label} cryptocurrency`, 'crypto calendar'],
  });
}

export function quickAnswerFaq(
  question: string,
  answer: string,
): Array<{ question: string; answer: string }> {
  return [{ question, answer }];
}
