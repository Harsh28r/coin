/** Desk authors — static E-E-A-T profiles (no DB until CMS needs it). */

export type DeskAuthor = {
  slug: string;
  name: string;
  role: string;
  desk: string;
  /** Match Post.author strings */
  aliases: string[];
  /** Match Post.tags */
  tags: string[];
  bio: string;
  focus: string[];
  initials: string;
  accent: string;
};

export const AUTHORS: DeskAuthor[] = [
  {
    slug: 'elena-vasquez',
    name: 'Elena Vasquez',
    role: 'Senior Markets Analyst',
    desk: 'Markets Desk',
    aliases: ['Elena Vasquez', 'CoinsClarity Markets Desk', 'CoinsClarity Desk'],
    tags: ['agent-markets', 'price-outlook', 'ai-desk', 'trending-desk'],
    bio: 'Elena covers macro liquidity, ETF flows, and multi-year crypto cycles for CoinsClarity. Her outlooks and live macro threads are desk products — sourced from live market data, not recycled wire copy.',
    focus: ['Bitcoin & ETH', 'ETF flows', 'Fear & Greed', 'Rate cycles', 'Price outlooks'],
    initials: 'EV',
    accent: '#ea580c',
  },
  {
    slug: 'james-okonkwo',
    name: 'James Okonkwo',
    role: 'Geopolitics Correspondent',
    desk: 'Geopolitics Desk',
    aliases: ['James Okonkwo', 'CoinsClarity Geopolitics Desk'],
    tags: ['agent-geopolitics'],
    bio: 'James tracks war risk, sanctions, and energy shocks — and how they reprice crypto liquidity and safe-haven flows. He writes for readers who want the chain of causation, not the hot take.',
    focus: ['Sanctions', 'Energy shocks', 'Capital controls', 'Conflict risk'],
    initials: 'JO',
    accent: '#0f766e',
  },
  {
    slug: 'maya-rao',
    name: 'Maya Rao',
    role: 'India Policy Editor',
    desk: 'India Policy Desk',
    aliases: ['Maya Rao', 'CoinsClarity India Policy Desk'],
    tags: ['agent-india'],
    bio: 'Maya covers RBI, FIU, tax, and exchange policy across India. She translates regulatory moves into what they mean for INR on-ramps, compliance, and domestic traders.',
    focus: ['RBI & FIU', 'Tax & GST', 'Exchange licensing', 'INR rails'],
    initials: 'MR',
    accent: '#7c3aed',
  },
  {
    slug: 'kenji-tanaka',
    name: 'Kenji Tanaka',
    role: 'On-chain Analyst',
    desk: 'On-chain Desk',
    aliases: ['Kenji Tanaka', 'CoinsClarity On-chain Desk'],
    tags: ['agent-onchain'],
    bio: 'Kenji digs into TVL, L2 throughput, unlocks, and protocol upgrades. When the tape is noisy, he follows the chain — hacks, flows, and code — not the timeline.',
    focus: ['DeFi TVL', 'L2s', 'Unlocks', 'Protocol upgrades', 'Security'],
    initials: 'KT',
    accent: '#2563eb',
  },
  {
    slug: 'editorial',
    name: 'CoinsClarity Editorial',
    role: 'Newsroom',
    desk: 'Editorial',
    aliases: ['CoinsClarity Editorial', 'CoinsClarity', 'CoinsClarity Trending Desk'],
    tags: ['daily-digest', 'editorial', 'trending-desk'],
    bio: 'The CoinsClarity newsroom files daily digests, trending columns, and coordinated desk coverage. Named analysts byline major outlooks and live threads; Editorial covers the rest.',
    focus: ['Daily digest', 'Trending desk', 'Wire synthesis'],
    initials: 'CC',
    accent: '#334155',
  },
];

export function getAuthorBySlug(slug?: string | null): DeskAuthor | undefined {
  const s = String(slug || '')
    .toLowerCase()
    .trim();
  if (!s) return undefined;
  return AUTHORS.find((a) => a.slug === s);
}

export function resolveAuthorFromPost(post: {
  author?: string;
  tags?: string[];
}): DeskAuthor | undefined {
  const author = String(post?.author || '').trim();
  const tags = Array.isArray(post?.tags) ? post.tags : [];

  for (const a of AUTHORS) {
    if (author && a.aliases.some((x) => x.toLowerCase() === author.toLowerCase())) return a;
  }
  for (const a of AUTHORS) {
    if (tags.some((t) => a.tags.includes(t))) return a;
  }
  if (author) {
    // fuzzy: name contained
    const hit = AUTHORS.find(
      (a) =>
        a.name.toLowerCase() === author.toLowerCase() ||
        author.toLowerCase().includes(a.name.toLowerCase()),
    );
    if (hit) return hit;
  }
  return undefined;
}

export function authorPath(slug: string): string {
  return `/author/${slug}`;
}
