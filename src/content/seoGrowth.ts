/** Shared SEO growth content — India guides + calculator defs */

export type GuideSection = { h2: string; body: string[] };

export type IndiaGuide = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: GuideSection[];
  faqs: Array<{ question: string; answer: string }>;
  ctaLinks: Array<{ to: string; label: string }>;
};

export const INDIA_GUIDES: IndiaGuide[] = [
  {
    slug: 'buy-usdt',
    title: 'How to Buy USDT in India (2026) — UPI, P2P & Exchanges',
    description:
      'Step-by-step guide to buying USDT in India with UPI and P2P. Compare rates, avoid scams, and check live INR prices on CoinsClarity.',
    eyebrow: 'India desk',
    intro:
      'USDT is the most traded stablecoin for Indian crypto users. This guide covers legal-aware ways to buy USDT with INR, how P2P works, and how to avoid common traps.',
    sections: [
      {
        h2: 'Fastest ways to buy USDT with INR',
        body: [
          'Most Indians use P2P (peer-to-peer) on major exchanges or INR on-ramps. You pay via UPI/IMPS; the seller releases USDT after payment confirmation.',
          'Always match the rate against a live USDT/INR board before you confirm. Spreads of ₹0.5–2 per USDT are common depending on payment method and KYC level.',
        ],
      },
      {
        h2: 'UPI + P2P checklist',
        body: [
          'Use only verified sellers with high completion rates. Never release payment proof to strangers on Telegram “deals”.',
          'Send exact amounts from your own KYC’d bank account. Screenshot the UPI success page and keep the UTR.',
          'After USDT releases, move funds off-exchange if you are holding — exchange hacks and freezes happen.',
        ],
      },
      {
        h2: 'Scam red flags',
        body: [
          'Anyone asking you to pay “token listing fees” or share OTP is a scam.',
          'Before interacting with a random token contract, run it through a honeypot / scam checker.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is buying USDT legal in India?',
        answer:
          'Crypto trading is not banned in India, but it is taxed and regulated via exchanges’ KYC/AML. This is not legal advice — check current IT Act / exchange T&Cs.',
      },
      {
        question: 'What is a fair USDT INR rate?',
        answer:
          'Fair rates sit near the live P2P mid. Check CoinsClarity USDT INR P2P before you lock a trade.',
      },
    ],
    ctaLinks: [
      { to: '/tools/p2p', label: 'Live USDT/INR P2P board' },
      { to: '/tools/scam-check', label: 'Token scam checker' },
      { to: '/price/tether', label: 'USDT price page' },
    ],
  },
  {
    slug: 'usdt-inr-p2p',
    title: 'USDT to INR P2P Rates Explained — Live Spreads & Tips',
    description:
      'Understand USDT/INR P2P pricing, buy vs sell spreads, UPI timing, and how to read the CoinsClarity P2P board.',
    eyebrow: 'India desk',
    intro:
      'P2P rates move with demand, bank risk, and payment rails. Knowing the spread saves real money on every transfer.',
    sections: [
      {
        h2: 'Buy price vs sell price',
        body: [
          'Buy ads show what you pay in INR per USDT. Sell ads show what you receive. The gap is the spread.',
          'UPI is usually cheapest and fastest; bank transfer may price differently.',
        ],
      },
      {
        h2: 'How to use our live board',
        body: [
          'Open the USDT INR P2P tool for refreshed offers. Compare top of book before you leave the page.',
          'If the board looks stale, refresh — P2P books flip every few minutes in busy sessions.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why is P2P USDT above “dollar” INR?',
        answer:
          'Crypto on-ramp premium, payment risk, and local demand push USDT/INR above vanilla forex USDINR.',
      },
    ],
    ctaLinks: [
      { to: '/tools/p2p', label: 'Open P2P board' },
      { to: '/in/buy-usdt', label: 'How to buy USDT' },
    ],
  },
  {
    slug: 'crypto-tax',
    title: 'Crypto Tax in India — TDS, 30% Flat Tax & Calculators',
    description:
      'Plain-English overview of India’s crypto tax (flat 30% + TDS). Use our tax calculator and keep records for every trade.',
    eyebrow: 'India desk',
    intro:
      'India taxes virtual digital assets (VDAs) differently from equity. Understanding TDS and the flat rate helps you avoid surprises at filing time.',
    sections: [
      {
        h2: 'The headline rules (educational)',
        body: [
          'Gains on VDAs are generally taxed at a flat 30% (plus applicable surcharge/cess) with limited loss set-off under current framework.',
          'Exchanges often deduct TDS on transfers. Keep every buy/sell CSV.',
        ],
      },
      {
        h2: 'What to track',
        body: [
          'Date, pair, INR value, fees, and wallet addresses for self-custody moves.',
          'Use a crypto tax calculator to estimate liability before year-end.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I set off crypto losses against salary?',
        answer:
          'Under the current VDA framework, loss set-off is heavily restricted. Confirm with a CA — rules change.',
      },
    ],
    ctaLinks: [
      { to: '/tools/crypto-tax-calculator', label: 'Crypto tax calculator' },
      { to: '/tools/profit-calculator', label: 'Profit calculator' },
      { to: '/in/buy-usdt', label: 'Buy USDT guide' },
    ],
  },
  {
    slug: 'how-to-buy-bitcoin',
    title: 'How to Buy Bitcoin in India — Step by Step',
    description:
      'Buy BTC in India via INR exchanges or USDT pairs. See live Bitcoin price, avoid scams, and track gas when you withdraw.',
    eyebrow: 'India desk',
    intro:
      'Buying Bitcoin in India usually means KYC on an INR exchange or converting USDT → BTC on a global venue.',
    sections: [
      {
        h2: 'Two common paths',
        body: [
          'INR on-ramp: deposit rupees, buy BTC directly, withdraw to self-custody.',
          'USDT path: buy USDT via P2P, then swap to BTC. Check live BTC price before you convert.',
        ],
      },
      {
        h2: 'After you buy',
        body: [
          'Withdraw to a wallet you control. Verify the address on a hardware device when amounts are large.',
          'For network fees when moving on L2s, use a gas tracker.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the Bitcoin price in INR right now?',
        answer:
          'Open the Bitcoin price page on CoinsClarity for live USD and approximate INR using current USDT/INR context.',
      },
    ],
    ctaLinks: [
      { to: '/price/bitcoin', label: 'Bitcoin price' },
      { to: '/tools/p2p', label: 'USDT/INR P2P' },
      { to: '/tools/scam-check', label: 'Scam checker' },
    ],
  },
  {
    slug: 'scam-check-guide',
    title: 'Crypto Scam Check Guide for India — Honeypots & Fake Tokens',
    description:
      'How Indian traders get drained by honeypots and fake airdrops. Use CoinsClarity scam-check before you approve any contract.',
    eyebrow: 'India desk',
    intro:
      'Most retail losses in India are not “market dumps” — they are approvals to malicious contracts and fake support agents.',
    sections: [
      {
        h2: 'Before you buy a new token',
        body: [
          'Paste the contract into scam-check. Look for honeypot sell blocks, huge taxes, and unverified owners.',
          'Cross-check the contract on the project’s official site/X — not a Telegram forward.',
        ],
      },
      {
        h2: 'Wallet hygiene',
        body: [
          'Never share seed phrases. Revoke stale token approvals periodically.',
          'Keep a separate “degen” wallet with limited funds for experimental tokens.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is a honeypot token?',
        answer:
          'A token you can buy but cannot sell (or sell only with extreme tax). Scam-check flags many of these patterns.',
      },
    ],
    ctaLinks: [
      { to: '/tools/scam-check', label: 'Run scam-check' },
      { to: '/tools/p2p', label: 'Safe USDT rates' },
      { to: '/in/buy-usdt', label: 'Buy USDT safely' },
    ],
  },
  {
    slug: 'upi-crypto',
    title: 'UPI and Crypto in India — What Actually Works',
    description:
      'How UPI is used with crypto P2P in India, timing risks, and how to keep payment trails clean.',
    eyebrow: 'India desk',
    intro:
      'UPI powers most crypto on-ramps in India via P2P. Speed is great; dispute risk is real if you skip verification.',
    sections: [
      {
        h2: 'Best practices',
        body: [
          'Pay only inside the exchange P2P chat flow. Off-platform UPI to “agents” is how people lose money.',
          'Match the name on the UPI ID with the seller’s KYC name shown by the exchange.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does UPI support crypto directly?',
        answer:
          'UPI itself is a payments rail. Crypto happens via exchange P2P or partners that settle in INR — not as a native UPI “crypto transfer”.',
      },
    ],
    ctaLinks: [
      { to: '/tools/p2p', label: 'USDT/INR P2P' },
      { to: '/in/usdt-inr-p2p', label: 'P2P rates guide' },
    ],
  },
  {
    slug: 'best-crypto-apps',
    title: 'Best Crypto Apps for India (2026) — What to Look For',
    description:
      'How to choose crypto apps in India: KYC, P2P depth, fees, withdrawals, and security. Pair apps with live tools on CoinsClarity.',
    eyebrow: 'India desk',
    intro:
      'The “best” app depends on whether you need INR deposits, deep P2P, or global alt liquidity. Evaluate liquidity and withdrawal reliability over shiny UI.',
    sections: [
      {
        h2: 'Evaluation checklist',
        body: [
          'KYC clarity, INR deposit methods, USDT/INR spread, withdrawal fees, and proof of reserves if published.',
          'Test a small deposit/withdraw loop before parking size.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Should I keep crypto on an exchange?',
        answer:
          'Exchanges are convenient for trading. For long-term holds, self-custody is safer if you can secure keys.',
      },
    ],
    ctaLinks: [
      { to: '/tools/p2p', label: 'Compare USDT rates' },
      { to: '/tools/scam-check', label: 'Scam checker' },
      { to: '/price/bitcoin', label: 'BTC price' },
    ],
  },
  {
    slug: 'crypto-banking',
    title: 'Crypto and Indian Banks — Freezes, TDS & Practical Tips',
    description:
      'Why banks sometimes flag crypto-related UPI, how to keep clean trails, and what TDS means for your account.',
    eyebrow: 'India desk',
    intro:
      'Bank freezes linked to crypto P2P are a known pain point. Clean KYC trails and conservative payment hygiene reduce risk.',
    sections: [
      {
        h2: 'Reduce freeze risk',
        body: [
          'Avoid rapid circular transfers. Use accounts in your own name only.',
          'Keep exchange statements ready if your bank asks for source of funds.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Will my bank close my account for crypto?',
        answer:
          'Policies vary. Some banks scrutinize P2P volume. Stay transparent and within exchange KYC flows.',
      },
    ],
    ctaLinks: [
      { to: '/in/crypto-tax', label: 'Crypto tax overview' },
      { to: '/tools/p2p', label: 'P2P board' },
    ],
  },
  {
    slug: 'ethereum-gas-india',
    title: 'Ethereum Gas Fees for Indian Traders — When to Transact',
    description:
      'ETH gas eats profits on small trades. Track live gas and prefer L2s. Guide for Indian retail traders.',
    eyebrow: 'India desk',
    intro:
      'If you move small USDT or NFT amounts on Ethereum L1 during busy hours, gas can wipe the edge. Timing and chain choice matter.',
    sections: [
      {
        h2: 'Practical tips',
        body: [
          'Check a live gas tracker before bridging or claiming.',
          'For frequent small moves, prefer Polygon, Arbitrum, Base, or other L2s when the asset exists there.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What gas price is “cheap”?',
        answer:
          'It depends on congestion. Compare current gwei on the CoinsClarity gas tracker against your trade size.',
      },
    ],
    ctaLinks: [
      { to: '/tools/gas/ethereum', label: 'ETH gas tracker' },
      { to: '/tools/gas/polygon', label: 'Polygon gas' },
      { to: '/tools/p2p', label: 'USDT/INR' },
    ],
  },
  {
    slug: 'funding-rates-basics',
    title: 'Crypto Funding Rates Explained — For Indian Futures Traders',
    description:
      'What perpetual funding rates mean, when longs pay shorts, and how to read CoinsClarity funding tool.',
    eyebrow: 'India desk',
    intro:
      'Funding rates are the heartbeat of perpetual futures. Extreme positive funding often means crowded longs — and higher squeeze risk.',
    sections: [
      {
        h2: 'How to use funding',
        body: [
          'Positive funding: longs pay shorts. Negative: shorts pay longs.',
          'Combine funding with liquidations heat to spot crowded positioning.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is high funding a buy signal?',
        answer:
          'Not by itself. High funding can persist in strong trends or precede mean-reversion. Use risk limits.',
      },
    ],
    ctaLinks: [
      { to: '/tools/funding', label: 'Live funding rates' },
      { to: '/tools/liquidations', label: 'Liquidations' },
      { to: '/tools/liquidation-calculator', label: 'Liq calculator' },
    ],
  },
];

export function getIndiaGuide(slug: string): IndiaGuide | undefined {
  return INDIA_GUIDES.find((g) => g.slug === slug);
}

export type CalcDef = {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ to: string; label: string }>;
};

export const CALCULATORS: CalcDef[] = [
  {
    slug: 'profit-calculator',
    path: '/tools/profit-calculator',
    title: 'Crypto Profit Calculator — ROI & Gains',
    description:
      'Free crypto profit calculator. Enter buy price, sell price, and amount to see profit, ROI %, and fees impact.',
    h1: 'Crypto profit calculator',
    intro: 'Estimate gains or losses before you exit a trade. Educational only — not tax advice.',
    faqs: [
      {
        question: 'How do I calculate crypto profit?',
        answer:
          'Profit ≈ (sell price − buy price) × quantity − fees. ROI % = profit ÷ cost basis × 100.',
      },
      {
        question: 'Does this include Indian crypto tax?',
        answer:
          'No. Use the crypto tax calculator for a rough VDA tax estimate, then confirm with a CA.',
      },
    ],
    related: [
      { to: '/tools/crypto-tax-calculator', label: 'Tax calculator' },
      { to: '/tools/dca-calculator', label: 'DCA calculator' },
      { to: '/in/crypto-tax', label: 'India tax guide' },
    ],
  },
  {
    slug: 'dca-calculator',
    path: '/tools/dca-calculator',
    title: 'Crypto DCA Calculator — Dollar Cost Average',
    description:
      'Dollar-cost averaging calculator for Bitcoin and altcoins. Plan weekly/monthly buys and average entry.',
    h1: 'DCA calculator',
    intro: 'Model a fixed INR or USD buy every week/month and see total invested vs units accumulated (simplified).',
    faqs: [
      {
        question: 'What is DCA in crypto?',
        answer:
          'Dollar-cost averaging means investing a fixed amount on a schedule regardless of price, smoothing entry volatility.',
      },
    ],
    related: [
      { to: '/price/bitcoin', label: 'BTC price' },
      { to: '/tools/profit-calculator', label: 'Profit calculator' },
    ],
  },
  {
    slug: 'staking-calculator',
    path: '/tools/staking-calculator',
    title: 'Crypto Staking Calculator — APY Estimates',
    description:
      'Estimate staking rewards from APY and principal. Compare roughly what compound vs simple yield looks like.',
    h1: 'Staking rewards calculator',
    intro: 'Illustrative APY math only. Real protocols have fees, lockups, slashing, and variable rates.',
    faqs: [
      {
        question: 'Is staking APY guaranteed?',
        answer: 'No. On-chain yields change with network conditions and validator performance.',
      },
    ],
    related: [
      { to: '/tools/profit-calculator', label: 'Profit calculator' },
      { to: '/price/ethereum', label: 'ETH price' },
    ],
  },
  {
    slug: 'liquidation-calculator',
    path: '/tools/liquidation-calculator',
    title: 'Crypto Liquidation Calculator — Futures Price',
    description:
      'Estimate liquidation price for long/short perpetual positions from entry, leverage, and maintenance margin.',
    h1: 'Liquidation price calculator',
    intro: 'Simplified isolated-margin estimate. Exchange engines differ — verify on your venue.',
    faqs: [
      {
        question: 'How is liquidation price estimated?',
        answer:
          'For a long: entry × (1 − 1/leverage + maintenance). Short flips the sign. Real formulas include fees and margin mode.',
      },
    ],
    related: [
      { to: '/tools/liquidations', label: 'Live liquidations' },
      { to: '/tools/funding', label: 'Funding rates' },
      { to: '/in/funding-rates-basics', label: 'Funding explained' },
    ],
  },
  {
    slug: 'crypto-tax-calculator',
    path: '/tools/crypto-tax-calculator',
    title: 'India Crypto Tax Calculator — Flat 30% Estimate',
    description:
      'Rough India VDA tax estimator using flat 30% on gains. Educational — confirm with a chartered accountant.',
    h1: 'India crypto tax calculator',
    intro: 'Enter estimated gains to see a ballpark 30% tax figure. Does not model surcharge, cess, or TDS precisely.',
    faqs: [
      {
        question: 'Is crypto taxed at 30% in India?',
        answer:
          'VDA gains are generally taxed at a flat 30% under the current framework, with limited loss set-off. Verify latest law.',
      },
    ],
    related: [
      { to: '/in/crypto-tax', label: 'Tax guide' },
      { to: '/tools/profit-calculator', label: 'Profit calculator' },
      { to: '/tools/p2p', label: 'USDT/INR P2P' },
    ],
  },
];

export function getCalculator(slug: string): CalcDef | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}
