import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import JsonLd from '../../Components/JsonLd';
import { breadcrumbList, faqPage, SITE_URL } from '../../utils/jsonLd';
import './tools.css';
import { coingeckoV3Url } from '../../utils/coingeckoUrl';

interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  rpc: string;
  color: string;
  decimals: number;
  txGas: number;
  swapGas: number;
  nftGas: number;
  nativeId: string;
}

const CHAINS: ChainConfig[] = [
  {
    id: 'ethereum', name: 'Ethereum', symbol: 'ETH',
    rpc: 'https://eth.llamarpc.com',
    color: '#627eea', decimals: 9, txGas: 21000, swapGas: 200000, nftGas: 80000,
    nativeId: 'ethereum',
  },
  {
    id: 'polygon', name: 'Polygon', symbol: 'POL',
    rpc: 'https://polygon-rpc.com',
    color: '#8247e5', decimals: 9, txGas: 21000, swapGas: 200000, nftGas: 80000,
    nativeId: 'matic-network',
  },
  {
    id: 'arbitrum', name: 'Arbitrum One', symbol: 'ETH',
    rpc: 'https://arb1.arbitrum.io/rpc',
    color: '#28a0f0', decimals: 9, txGas: 400000, swapGas: 800000, nftGas: 600000,
    nativeId: 'ethereum',
  },
  {
    id: 'optimism', name: 'Optimism', symbol: 'ETH',
    rpc: 'https://mainnet.optimism.io',
    color: '#ff0420', decimals: 9, txGas: 21000, swapGas: 200000, nftGas: 80000,
    nativeId: 'ethereum',
  },
  {
    id: 'base', name: 'Base', symbol: 'ETH',
    rpc: 'https://mainnet.base.org',
    color: '#0052ff', decimals: 9, txGas: 21000, swapGas: 200000, nftGas: 80000,
    nativeId: 'ethereum',
  },
  {
    id: 'bsc', name: 'BNB Chain', symbol: 'BNB',
    rpc: 'https://bsc-dataseed.binance.org',
    color: '#f3ba2f', decimals: 9, txGas: 21000, swapGas: 200000, nftGas: 80000,
    nativeId: 'binancecoin',
  },
];

const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c])) as Record<string, ChainConfig>;

/** SEO slugs that match GSC strike-zone queries */
const CHAIN_SEO: Record<
  string,
  { title: string; h1: string; desc: string; queryLabel: string; faqs: Array<{ question: string; answer: string }> }
> = {
  ethereum: {
    title: 'ETH Gas Tracker — Live Ethereum Gwei & USD Fees | CoinsClarity',
    h1: 'ETH Gas Tracker',
    desc: 'Live Ethereum gas tracker in gwei and USD for transfers, swaps and NFT mints. Updates every 30 seconds.',
    queryLabel: 'ETH gas tracker',
    faqs: [
      {
        question: 'What is an ETH gas tracker?',
        answer:
          'An ETH gas tracker shows live Ethereum gas prices in gwei and estimated USD cost for transfers, swaps and NFT mints.',
      },
      {
        question: 'How often does this ETH gas tracker update?',
        answer: 'CoinsClarity refreshes eth.llamarpc eth_gasPrice every 30 seconds.',
      },
    ],
  },
  polygon: {
    title: 'Polygon Gas Tracker — Live POL Gwei & USD Fees | CoinsClarity',
    h1: 'Polygon Gas Tracker',
    desc: 'Live Polygon gas tracker for POL gwei and USD transfer, swap and NFT mint costs. Updates every 30 seconds.',
    queryLabel: 'Polygon gas tracker',
    faqs: [
      {
        question: 'Where can I find a Polygon gas tracker?',
        answer:
          'CoinsClarity Polygon gas tracker reads polygon-rpc every 30 seconds and shows slow, standard and fast POL gwei plus USD.',
      },
      {
        question: 'Is Polygon gas cheaper than Ethereum?',
        answer:
          'Usually yes. Polygon is an EVM sidechain; fees are typically far below Ethereum mainnet for the same transfer or swap.',
      },
    ],
  },
  arbitrum: {
    title: 'Arbitrum Gas Fees Tracker — Live Arb Gwei & USD | CoinsClarity',
    h1: 'Arbitrum Gas Fees Tracker',
    desc: 'Live Arbitrum gas fees tracker with gwei and USD estimates for transfers, swaps and NFT mints on Arbitrum One.',
    queryLabel: 'Arbitrum gas fees tracker',
    faqs: [
      {
        question: 'What is an Arbitrum gas fees tracker?',
        answer:
          'It shows live Arbitrum One gas from arb1.arbitrum.io, including L2 execution cost with USD estimates for common txs.',
      },
      {
        question: 'Why do Arbitrum gas units look high?',
        answer:
          'Arbitrum gas includes an L1 calldata component. Units can look large while USD cost stays low versus Ethereum.',
      },
    ],
  },
  base: {
    title: 'Base Gas Tracker — Live Base Gwei & USD Fees | CoinsClarity',
    h1: 'Base Gas Tracker',
    desc: 'Live Base gas tracker for Base L2 gwei and USD costs on transfers, swaps and NFT mints. Updates every 30 seconds.',
    queryLabel: 'Base gas tracker',
    faqs: [
      {
        question: 'What is a Base gas tracker?',
        answer:
          'A Base gas tracker shows live fees on Coinbase’s Base L2 via mainnet.base.org, in gwei and USD.',
      },
      {
        question: 'Is Base gas cheap?',
        answer:
          'Base is an Optimism-stack L2. Fees are usually much lower than Ethereum mainnet for the same activity.',
      },
    ],
  },
  optimism: {
    title: 'Optimism Gas Tracker — Live OP Gwei & USD Fees | CoinsClarity',
    h1: 'Optimism Gas Tracker',
    desc: 'Live Optimism gas tracker with gwei and USD estimates for transfers, swaps and NFT mints.',
    queryLabel: 'Optimism gas tracker',
    faqs: [
      {
        question: 'What is an Optimism gas tracker?',
        answer: 'It reads mainnet.optimism.io eth_gasPrice and shows slow, standard and fast gwei plus USD.',
      },
    ],
  },
  bsc: {
    title: 'BSC Gas Tracker — BNB Chain Gwei & USD Fees | CoinsClarity',
    h1: 'BSC Gas Tracker',
    desc: 'Live BNB Chain (BSC) gas tracker with gwei and USD costs for transfers, swaps and NFT mints.',
    queryLabel: 'BSC gas tracker',
    faqs: [
      {
        question: 'What is a BSC gas tracker?',
        answer:
          'It shows live BNB Chain gas from the public Binance seed node, in gwei and USD for common transactions.',
      },
    ],
  },
};

const HUB_SEO = {
  title: 'ETH Gas Tracker — Polygon, Arbitrum, Base & BSC Gwei | CoinsClarity',
  h1: 'ETH Gas Tracker',
  desc: 'Live ETH gas tracker plus Polygon gas tracker, Arbitrum gas fees, Base gas tracker and BSC gwei. USD cost for transfers, swaps and NFT mints.',
  faqs: [
    {
      question: 'What is an ETH gas tracker?',
      answer:
        'It shows live Ethereum gas in gwei and USD for transfers, swaps and NFT mints. CoinsClarity also has dedicated Polygon, Arbitrum, Base, Optimism and BSC pages.',
    },
    {
      question: 'Where can I find a Polygon gas tracker?',
      answer: 'Open /tools/gas/polygon for a dedicated Polygon gas tracker with live POL gwei and USD.',
    },
    {
      question: 'Does this include an Arbitrum gas fees tracker and Base gas tracker?',
      answer: 'Yes — /tools/gas/arbitrum and /tools/gas/base are dedicated pages for those L2s.',
    },
  ],
};

interface GasReading {
  slow: number;
  standard: number;
  fast: number;
  nativePrice: number;
  ts: number;
}

const hexToNumber = (hex: string): number => parseInt(hex, 16);
const weiToGwei = (wei: number): number => wei / 1e9;

const fetchGasPrice = async (chain: ChainConfig): Promise<number> => {
  const res = await fetch(chain.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
    signal: AbortSignal.timeout(7000),
  });
  const json = await res.json();
  if (!json.result) throw new Error('rpc-no-result');
  return weiToGwei(hexToNumber(json.result));
};

const fetchNativePrices = async (ids: string[]): Promise<Record<string, number>> => {
  try {
    const url = coingeckoV3Url(`simple/price?ids=${ids.join(',')}&vs_currencies=usd`);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const id of ids) out[id] = data[id]?.usd ?? 0;
    return out;
  } catch {
    return {};
  }
};

const GasCard: React.FC<{
  chain: ChainConfig;
  reading?: GasReading;
  fmtGwei: (g: number) => string;
  fmtUsd: (gwei: number, gasUnits: number, nativePrice: number) => string;
  featured?: boolean;
}> = ({ chain, reading, fmtGwei, fmtUsd, featured }) => (
  <div className={`gas-card${featured ? ' gas-card--featured' : ''}`}>
    <div className="gas-card__chain">
      <span className="gas-card__icon" style={{ background: chain.color }}>
        {chain.symbol[0]}
      </span>
      {chain.name}
    </div>
    {!reading ? (
      <>
        <div className="tool-skel" style={{ height: 18, marginBottom: 12 }} />
        <div className="tool-skel" style={{ height: 18, marginBottom: 12 }} />
        <div className="tool-skel" style={{ height: 18 }} />
      </>
    ) : (
      <>
        <div className="gas-tier">
          <span className="gas-tier__label">Slow</span>
          <span>
            <span className="gas-tier__price">{fmtGwei(reading.slow)}</span>
            <span className="gas-tier__usd">
              gwei · {fmtUsd(reading.slow, chain.txGas, reading.nativePrice)} transfer
            </span>
          </span>
        </div>
        <div className="gas-tier">
          <span className="gas-tier__label">Standard</span>
          <span>
            <span className="gas-tier__price">{fmtGwei(reading.standard)}</span>
            <span className="gas-tier__usd">
              gwei · {fmtUsd(reading.standard, chain.swapGas, reading.nativePrice)} swap
            </span>
          </span>
        </div>
        <div className="gas-tier">
          <span className="gas-tier__label">Fast</span>
          <span>
            <span className="gas-tier__price">{fmtGwei(reading.fast)}</span>
            <span className="gas-tier__usd">
              gwei · {fmtUsd(reading.fast, chain.nftGas, reading.nativePrice)} NFT mint
            </span>
          </span>
        </div>
      </>
    )}
  </div>
);

const GasTrackerPage: React.FC = () => {
  const { chain: chainParam } = useParams<{ chain?: string }>();
  const chainSlug = (chainParam || '').toLowerCase();
  const focused = chainSlug ? CHAIN_BY_ID[chainSlug] : undefined;

  const [readings, setReadings] = useState<Record<string, GasReading>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const uniqueNativeIds = Array.from(new Set(CHAINS.map((c) => c.nativeId)));
      const prices = await fetchNativePrices(uniqueNativeIds);
      const next: Record<string, GasReading> = {};
      await Promise.allSettled(
        CHAINS.map(async (c) => {
          try {
            const standard = await fetchGasPrice(c);
            next[c.id] = {
              slow: Math.max(standard * 0.85, 0.01),
              standard,
              fast: standard * 1.25,
              nativePrice: prices[c.nativeId] ?? 0,
              ts: Date.now(),
            };
          } catch {
            /* skip failed RPC */
          }
        }),
      );
      setReadings(next);
      if (Object.keys(next).length === 0) {
        setError('Could not reach any RPC endpoint. Try refreshing.');
      }
    } catch {
      setError('Network error. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const fmtUsd = (gwei: number, gasUnits: number, nativePrice: number): string => {
    if (!nativePrice) return '—';
    const native = gwei * 1e-9 * gasUnits;
    const usd = native * nativePrice;
    return `$${usd < 0.01 ? usd.toFixed(4) : usd.toFixed(2)}`;
  };

  const fmtGwei = (g: number): string =>
    g < 0.1 ? g.toFixed(3) : g < 10 ? g.toFixed(2) : g.toFixed(1);

  const seo = focused ? CHAIN_SEO[focused.id] : HUB_SEO;
  const canonical = focused
    ? `${SITE_URL}/tools/gas/${focused.id}`
    : `${SITE_URL}/tools/gas`;

  const jsonLd = useMemo(() => {
    const crumbs = breadcrumbList([
      { name: 'Home', url: SITE_URL },
      { name: 'Tools', url: `${SITE_URL}/tools` },
      { name: 'ETH Gas Tracker', url: `${SITE_URL}/tools/gas` },
      ...(focused
        ? [{ name: seo.h1, url: `${SITE_URL}/tools/gas/${focused.id}` }]
        : []),
    ]);
    return [faqPage(seo.faqs), crumbs];
  }, [focused, seo]);

  const otherChains = focused ? CHAINS.filter((c) => c.id !== focused.id) : CHAINS;

  if (chainSlug && !focused) {
    return <Navigate to="/tools/gas" replace />;
  }

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.desc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={seo.h1} />
        <meta property="og:description" content={seo.desc} />
        <meta property="og:url" content={canonical} />
      </Helmet>
      {focused ? <JsonLd data={jsonLd} /> : null}

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back">
            <ArrowLeft size={16} /> All tools
          </Link>

          <header className="tool-head">
            <span className="tool-eyebrow">On-chain</span>
            <h1 className="tool-title">{seo.h1}</h1>
            <p className="tool-tagline">
              {focused
                ? `Live ${focused.name} gas in gwei and USD. No wallet. No email. Refreshes every 30 seconds.`
                : 'Ethereum gas tracker plus Polygon, Arbitrum, Base, Optimism and BSC — live, in USD. No wallet. No email.'}
            </p>
            <button className="tool-refresh" onClick={load} disabled={loading} type="button">
              <RefreshCcw size={14} className={loading ? 'spin' : ''} />{' '}
              {loading ? 'Updating…' : 'Refresh now'}
            </button>
          </header>

          <nav className="gas-chain-nav" aria-label="Gas tracker by chain">
            <Link to="/tools/gas" className={!focused ? 'is-active' : undefined}>
              All chains
            </Link>
            {CHAINS.map((c) => (
              <Link
                key={c.id}
                to={`/tools/gas/${c.id}`}
                className={focused?.id === c.id ? 'is-active' : undefined}
              >
                {CHAIN_SEO[c.id]?.queryLabel || c.name}
              </Link>
            ))}
          </nav>

          {error && (
            <div className="tool-warn">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {focused ? (
            <div className="gas-grid gas-grid--focus">
              <GasCard
                chain={focused}
                reading={readings[focused.id]}
                fmtGwei={fmtGwei}
                fmtUsd={fmtUsd}
                featured
              />
            </div>
          ) : (
            <div className="gas-grid">
              {CHAINS.map((c) => (
                <Link key={c.id} to={`/tools/gas/${c.id}`} className="gas-card-link">
                  <GasCard chain={c} reading={readings[c.id]} fmtGwei={fmtGwei} fmtUsd={fmtUsd} />
                </Link>
              ))}
            </div>
          )}

          <section className="tool-prose">
            {focused ? (
              <>
                <h2>{seo.h1} — live readings</h2>
                <p>
                  This page is the dedicated {CHAIN_SEO[focused.id].queryLabel.toLowerCase()}. RPC:{' '}
                  <code>{focused.rpc}</code>. Standard is live <code>eth_gasPrice</code>; slow is ~85%;
                  fast is ~125%. USD uses CoinGecko spot for {focused.symbol}.
                </p>
              </>
            ) : (
              <>
                <h2>Polygon gas tracker, Arbitrum gas fees, Base gas tracker</h2>
                <p>
                  One hub, six RPCs — and a dedicated URL for each strike-zone query. Use{' '}
                  <Link to="/tools/gas/polygon">Polygon gas tracker</Link>,{' '}
                  <Link to="/tools/gas/arbitrum">Arbitrum gas fees tracker</Link>,{' '}
                  <Link to="/tools/gas/base">Base gas tracker</Link>, or{' '}
                  <Link to="/tools/gas/ethereum">ETH gas tracker</Link>.
                </p>
              </>
            )}

            <h2>FAQ</h2>
            {seo.faqs.map((f) => (
              <div key={f.question} className="gas-faq">
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}

            <h3>How to read this tracker</h3>
            <ul>
              <li>
                <strong>Slow</strong> — about 85% of standard. Cheapest for non-urgent transfers.
              </li>
              <li>
                <strong>Standard</strong> — live <code>eth_gasPrice</code>. Usually 1–2 blocks.
              </li>
              <li>
                <strong>Fast</strong> — about 125% of standard. Prefer for busy minutes.
              </li>
            </ul>
          </section>

          {focused && (
            <section className="tool-cross">
              <h3>Other chain gas trackers</h3>
              <div className="tool-cross-grid">
                {otherChains.map((c) => (
                  <Link key={c.id} to={`/tools/gas/${c.id}`} className="tool-cross-card">
                    <h4>{CHAIN_SEO[c.id]?.h1 || c.name}</h4>
                    <p>Live {c.symbol} gwei and USD</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="tool-cross">
            <h3>Related tools</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/fear-greed" className="tool-cross-card">
                <h4>Fear &amp; Greed Index</h4>
                <p>Live crypto sentiment gauge</p>
              </Link>
              <Link to="/tools/scam-check" className="tool-cross-card">
                <h4>Honeypot Checker</h4>
                <p>Free token scam checker</p>
              </Link>
              <Link to="/tools/unlocks" className="tool-cross-card">
                <h4>Token Unlock Schedule</h4>
                <p>Crypto unlock calendar</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GasTrackerPage;
