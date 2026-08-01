import type { JsonLdObject } from './jsonLd';
import {
  aboutPage,
  breadcrumbList,
  collectionPage,
  contactPage,
  faqPage,
  webApplication,
  webPage,
  SITE_URL,
} from './jsonLd';

/** Dynamic routes — page components inject detailed JSON-LD */
const DYNAMIC_PREFIXES = [
  '/news/',
  '/blog/',
  '/coin/',
  '/airdrop/',
  '/today/',
  '/events/',
  '/prediction/',
  '/live/',
  '/tools/scam-check/',
];

function isDynamicRoute(pathname: string): boolean {
  if (pathname === '/blog') return false;
  return DYNAMIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function abs(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function crumbs(...items: Array<[string, string]>): JsonLdObject {
  return breadcrumbList(items.map(([name, path]) => ({ name, url: abs(path) })));
}

const TOOLS_FAQ = [
  {
    question: 'What is a crypto profit calculator?',
    answer:
      'A crypto profit calculator helps you determine potential gains or losses from trading. Enter your buy price, sell price, and investment amount to instantly see your profit percentage and total returns.',
  },
  {
    question: 'What is DCA (Dollar Cost Averaging) in crypto?',
    answer:
      'DCA is an investment strategy where you invest a fixed amount at regular intervals regardless of price. This reduces the impact of volatility and lowers your average cost over time.',
  },
  {
    question: 'What are funding rates in crypto trading?',
    answer:
      'Funding rates are periodic payments between long and short traders in perpetual futures markets. Positive rates mean longs pay shorts; negative rates mean shorts pay longs.',
  },
  {
    question: 'What is RSI in crypto trading?',
    answer:
      'RSI (Relative Strength Index) measures price momentum on a scale of 0-100. Below 30 indicates oversold; above 70 indicates overbought.',
  },
  {
    question: 'What is triangular arbitrage?',
    answer:
      'Triangular arbitrage exploits price differences between three trading pairs. If the final amount exceeds the starting amount after fees, there is a profit opportunity.',
  },
];

/** JSON-LD for every route — injected via DefaultSEO */
export function getJsonLdForRoute(pathname: string): JsonLdObject[] {
  if (isDynamicRoute(pathname)) return [];

  const schemas: JsonLdObject[] = [];
  const add = (s: JsonLdObject | JsonLdObject[]) => schemas.push(...(Array.isArray(s) ? s : [s]));

  switch (pathname) {
    case '/':
      add(
        webPage({
          name: 'CoinsClarity – Crypto News, Listings & Markets',
          description:
            'Real-time cryptocurrency news, Bitcoin and Ethereum updates, exchange listings, market data, and free crypto tools.',
          url: abs('/'),
        }),
      );
      break;

    case '/about':
      add(aboutPage(abs('/about')));
      add(crumbs(['Home', '/'], ['About', '/about']));
      break;

    case '/contact':
      add(contactPage(abs('/contact')));
      add(crumbs(['Home', '/'], ['Contact', '/contact']));
      break;

    case '/faq':
      add(
        webPage({
          name: 'FAQ | CoinsClarity',
          description: 'Frequently asked questions about CoinsClarity crypto news platform.',
          url: abs('/faq'),
        }),
      );
      add(crumbs(['Home', '/'], ['FAQ', '/faq']));
      break;

    case '/disclaimer':
      add(
        webPage({
          name: 'Disclaimer | CoinsClarity',
          description: 'Legal disclaimer: informational content only, not financial advice.',
          url: abs('/disclaimer'),
        }),
      );
      add(crumbs(['Home', '/'], ['Disclaimer', '/disclaimer']));
      break;

    case '/privacy-policy':
      add(
        webPage({
          name: 'Privacy Policy | CoinsClarity',
          description: 'How CoinsClarity collects, uses, and protects your personal information.',
          url: abs('/privacy-policy'),
        }),
      );
      add(crumbs(['Home', '/'], ['Privacy Policy', '/privacy-policy']));
      break;

    case '/terms':
      add(
        webPage({
          name: 'Terms of Service | CoinsClarity',
          description: 'Terms and conditions for using CoinsClarity.',
          url: abs('/terms'),
        }),
      );
      add(crumbs(['Home', '/'], ['Terms', '/terms']));
      break;

    case '/login':
      add(
        webPage({
          name: 'Login | CoinsClarity',
          description: 'Sign in to your CoinsClarity account.',
          url: abs('/login'),
        }),
      );
      break;

    case '/main-dashboard':
      add(
        webPage({
          name: 'Admin Dashboard | CoinsClarity',
          description: 'CoinsClarity administration dashboard.',
          url: abs('/main-dashboard'),
        }),
      );
      break;

    case '/blog':
      add(
        collectionPage({
          name: 'CoinsClarity Crypto Blog',
          description: 'Original crypto analysis, market insights, and expert commentary.',
          url: abs('/blog'),
        }),
      );
      add(crumbs(['Home', '/'], ['Blog', '/blog']));
      break;

    case '/learn':
      add(
        webPage({
          name: 'Learn Cryptocurrency | CoinsClarity',
          description: 'Beginner to advanced crypto guides, tips, and how-tos.',
          url: abs('/learn'),
          type: 'LearningResource',
        }),
      );
      add(crumbs(['Home', '/'], ['Learn', '/learn']));
      break;

    case '/daily-digest':
      add(
        collectionPage({
          name: 'Daily Crypto Digest | CoinsClarity',
          description: 'Daily curated cryptocurrency news digest with top stories.',
          url: abs('/daily-digest'),
        }),
      );
      add(crumbs(['Home', '/'], ['Daily Digest', '/daily-digest']));
      break;

    case '/trending-desk':
      add(
        collectionPage({
          name: 'Trending Desk | CoinsClarity',
          description: 'AI-curated trending cryptocurrency stories and daily desk articles.',
          url: abs('/trending-desk'),
        }),
      );
      add(crumbs(['Home', '/'], ['Trending Desk', '/trending-desk']));
      break;

    case '/market-movers':
      add(
        collectionPage({
          name: 'Crypto Market Movers This Week',
          description: 'Weekly crypto market movers: gainers, losers, and desk analysis.',
          url: abs('/market-movers'),
        }),
      );
      add(crumbs(['Home', '/'], ['Market Movers', '/market-movers']));
      break;

    case '/listings':
      add(
        collectionPage({
          name: 'Crypto Exchange Listings & New Token Pairs',
          description: 'Latest crypto exchange listings and new token pairs updated daily.',
          url: abs('/listings'),
        }),
      );
      add(crumbs(['Home', '/'], ['Listings', '/listings']));
      break;

    case '/All-exclusive-news':
      add(
        collectionPage({
          name: 'All Exclusive Crypto News | CoinsClarity',
          description: 'Browse all exclusive cryptocurrency news stories.',
          url: abs('/All-exclusive-news'),
        }),
      );
      add(crumbs(['Home', '/'], ['Exclusive News', '/All-exclusive-news']));
      break;

    case '/press-news':
      add(
        collectionPage({
          name: 'Crypto Press Releases | CoinsClarity',
          description: 'Official crypto press releases and project announcements.',
          url: abs('/press-news'),
        }),
      );
      add(crumbs(['Home', '/'], ['Press Releases', '/press-news']));
      break;

    case '/exclusive-news':
      add(
        collectionPage({
          name: 'Exclusive Crypto News | CoinsClarity',
          description: 'Exclusive crypto stories with full on-platform content.',
          url: abs('/exclusive-news'),
        }),
      );
      add(crumbs(['Home', '/'], ['Exclusive', '/exclusive-news']));
      break;

    case '/All-Trending-news':
      add(
        collectionPage({
          name: 'Trending Crypto News | CoinsClarity',
          description: "Today's top trending cryptocurrency news stories.",
          url: abs('/All-Trending-news'),
        }),
      );
      add(crumbs(['Home', '/'], ['Trending News', '/All-Trending-news']));
      break;

    case '/beyond-the-headlines':
      add(
        collectionPage({
          name: 'Beyond the Headlines | CoinsClarity',
          description: 'In-depth crypto analysis and long-form reads.',
          url: abs('/beyond-the-headlines'),
        }),
      );
      add(crumbs(['Home', '/'], ['Beyond the Headlines', '/beyond-the-headlines']));
      break;

    case '/events':
      add(
        collectionPage({
          name: 'Crypto Events Calendar | CoinsClarity',
          description: 'Upcoming crypto events, conferences, and important dates.',
          url: abs('/events'),
        }),
      );
      add(crumbs(['Home', '/'], ['Events', '/events']));
      break;

    case '/ai-news':
      add(
        collectionPage({
          name: 'AI & Machine Learning Crypto News | CoinsClarity',
          description: 'Latest AI and ML developments in cryptocurrency.',
          url: abs('/ai-news'),
        }),
      );
      add(crumbs(['Home', '/'], ['AI News', '/ai-news']));
      break;

    case '/advertise':
      add(
        webPage({
          name: 'Advertise on CoinsClarity',
          description: 'Advertising and sponsorship opportunities on CoinsClarity.',
          url: abs('/advertise'),
        }),
      );
      add(crumbs(['Home', '/'], ['Advertise', '/advertise']));
      break;

    case '/search':
      add(
        webPage({
          name: 'Search CoinsClarity',
          description: 'Search cryptocurrency news, coins, and articles.',
          url: abs('/search'),
        }),
      );
      add(crumbs(['Home', '/'], ['Search', '/search']));
      break;

    case '/watchlist':
      add(
        webPage({
          name: 'Crypto Watchlist | CoinsClarity',
          description: 'Track your favorite cryptocurrencies and related news.',
          url: abs('/watchlist'),
        }),
      );
      add(crumbs(['Home', '/'], ['Watchlist', '/watchlist']));
      break;

    case '/tools':
      add(
        webApplication({
          name: 'CoinsClarity Crypto Tools',
          description: 'Free professional crypto trading tools and calculators.',
          url: abs('/tools'),
          features: [
            'Profit Calculator',
            'DCA Calculator',
            'RSI Scanner',
            'Funding Rates',
            'Arbitrage Checker',
            'Gas Tracker',
            'Token Unlock Calendar',
          ],
        }),
      );
      add(faqPage(TOOLS_FAQ));
      add(crumbs(['Home', '/'], ['Tools', '/tools']));
      break;

    case '/arbitrage':
      add(
        webApplication({
          name: 'Triangular Arbitrage Calculator',
          description: 'Free triangular arbitrage calculator for cryptocurrency trading.',
          url: abs('/arbitrage'),
          features: ['Triangular arbitrage', 'Live prices', 'Multi-pair support'],
        }),
      );
      add(crumbs(['Home', '/'], ['Tools', '/tools'], ['Arbitrage', '/arbitrage']));
      break;

    case '/arbitrage-scanner':
      add(
        webApplication({
          name: 'Cross-Exchange Arbitrage Scanner',
          description: 'Scan crypto arbitrage opportunities across exchanges.',
          url: abs('/arbitrage-scanner'),
          features: ['Cross-exchange spreads', 'Real-time prices'],
        }),
      );
      add(crumbs(['Home', '/'], ['Arbitrage Scanner', '/arbitrage-scanner']));
      break;

    case '/tools/fear-greed':
      add(
        webApplication({
          name: 'Crypto Fear & Greed Index',
          description: 'Live Bitcoin and crypto market sentiment gauge.',
          url: abs('/tools/fear-greed'),
          features: ['Live sentiment index', '30-day history'],
        }),
      );
      add(crumbs(['Home', '/'], ['Tools', '/tools'], ['Fear & Greed', '/tools/fear-greed']));
      break;

    case '/tools/gas':
      add(
        webApplication({
          name: 'Ethereum & L2 Gas Tracker',
          description: 'Real-time gas fees for Ethereum, Polygon, Arbitrum, Optimism, Base, and BNB.',
          url: abs('/tools/gas'),
          features: ['Multi-chain gas fees', 'USD estimates'],
        }),
      );
      add(crumbs(['Home', '/'], ['Tools', '/tools'], ['Gas Tracker', '/tools/gas']));
      break;

    case '/tools/scam-check':
      add(
        webApplication({
          name: 'Crypto Token Scam Checker',
          description: 'Free security audit for ERC-20 and BEP-20 tokens.',
          url: abs('/tools/scam-check'),
          features: ['Token risk checks', 'Multi-chain support'],
        }),
      );
      add(crumbs(['Home', '/'], ['Tools', '/tools'], ['Scam Check', '/tools/scam-check']));
      break;

    case '/tools/unlocks':
      add(
        webApplication({
          name: 'Token Unlock Calendar',
          description: 'Upcoming token unlocks with USD values and supply impact.',
          url: abs('/tools/unlocks'),
          features: ['Unlock schedule', 'USD estimates'],
        }),
      );
      add(crumbs(['Home', '/'], ['Tools', '/tools'], ['Unlocks', '/tools/unlocks']));
      break;

    case '/compare':
      add(
        webApplication({
          name: 'Compare Cryptocurrencies',
          description: 'Side-by-side comparison of crypto coins: price, market cap, volume.',
          url: abs('/compare'),
          features: ['Multi-coin comparison', 'Live market data'],
        }),
      );
      add(crumbs(['Home', '/'], ['Compare', '/compare']));
      break;

    default:
      if (pathname.startsWith('/compare/')) {
        const slug = pathname.replace('/compare/', '');
        const label = slug.replace(/-/g, ' vs ');
        add(
          webApplication({
            name: `Compare ${label} | CoinsClarity`,
            description: `Compare ${label} cryptocurrency prices, market cap, and metrics.`,
            url: abs(pathname),
            features: ['Side-by-side metrics', 'Live prices'],
          }),
        );
        add(crumbs(['Home', '/'], ['Compare', '/compare'], [label, pathname]));
      } else {
        // 404 and any other unmatched path
        const label = pathname === '/' ? 'Home' : pathname.slice(1).replace(/-/g, ' ') || 'Page';
        add(
          webPage({
            name: pathname.includes('404') || !pathname.match(/^\/[\w-]+/)
              ? 'Page Not Found | CoinsClarity'
              : `${label} | CoinsClarity`,
            description: 'CoinsClarity — cryptocurrency news, market data, and free crypto tools.',
            url: abs(pathname),
          }),
        );
      }
      break;
  }

  return schemas;
}
