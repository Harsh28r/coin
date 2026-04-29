import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import './tools.css';
import { coingeckoV3Url } from '../../utils/coingeckoUrl';

interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  rpc: string;
  color: string;
  decimals: number;
  txGas: number;     // gas for a simple transfer
  swapGas: number;   // typical swap gas
  nftGas: number;    // typical NFT mint
  nativeId: string;  // CoinGecko id for fiat conversion
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

interface GasReading {
  slow: number;    // gwei
  standard: number;
  fast: number;
  nativePrice: number; // USD price of native token
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

const GasTrackerPage: React.FC = () => {
  const [readings, setReadings] = useState<Record<string, GasReading>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const uniqueNativeIds = Array.from(new Set(CHAINS.map(c => c.nativeId)));
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
          } catch {}
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
    const native = (gwei * 1e-9) * gasUnits;
    const usd = native * nativePrice;
    return `$${usd < 0.01 ? usd.toFixed(4) : usd.toFixed(2)}`;
  };

  const fmtGwei = (g: number): string =>
    g < 0.1 ? g.toFixed(3) : g < 10 ? g.toFixed(2) : g.toFixed(1);

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Live Crypto Gas Tracker — ETH, Polygon, Arbitrum, Base &amp; more | CoinsClarity</title>
        <meta
          name="description"
          content="Live gas prices for Ethereum, Polygon, Arbitrum, Optimism, Base and BNB Chain. Updated every 30 seconds with USD cost estimates for transfers, swaps and NFT mints."
        />
        <link rel="canonical" href="https://coinsclarity.com/tools/gas" />
        <meta property="og:title" content="Live Multi-Chain Gas Tracker" />
        <meta property="og:description" content="Real-time ETH, Polygon, Arbitrum, Optimism, Base and BNB gas fees with USD estimates." />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back"><ArrowLeft size={16} /> All tools</Link>

          <header className="tool-head">
            <span className="tool-eyebrow">On-chain</span>
            <h1 className="tool-title">Crypto Gas Tracker</h1>
            <p className="tool-tagline">
              Live gas prices across six major chains, refreshed every 30 seconds. Read in gwei, priced in USD — no wallet
              connect, no email.
            </p>
            <button className="tool-refresh" onClick={load} disabled={loading}>
              <RefreshCcw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Updating…' : 'Refresh now'}
            </button>
          </header>

          {error && (
            <div className="tool-warn"><AlertTriangle size={16} /> {error}</div>
          )}

          <div className="gas-grid">
            {CHAINS.map(c => {
              const r = readings[c.id];
              return (
                <div className="gas-card" key={c.id}>
                  <div className="gas-card__chain">
                    <span className="gas-card__icon" style={{ background: c.color }}>
                      {c.symbol[0]}
                    </span>
                    {c.name}
                  </div>

                  {!r ? (
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
                          <span className="gas-tier__price">{fmtGwei(r.slow)}</span>
                          <span className="gas-tier__usd">gwei · {fmtUsd(r.slow, c.txGas, r.nativePrice)} transfer</span>
                        </span>
                      </div>
                      <div className="gas-tier">
                        <span className="gas-tier__label">Standard</span>
                        <span>
                          <span className="gas-tier__price">{fmtGwei(r.standard)}</span>
                          <span className="gas-tier__usd">gwei · {fmtUsd(r.standard, c.swapGas, r.nativePrice)} swap</span>
                        </span>
                      </div>
                      <div className="gas-tier">
                        <span className="gas-tier__label">Fast</span>
                        <span>
                          <span className="gas-tier__price">{fmtGwei(r.fast)}</span>
                          <span className="gas-tier__usd">gwei · {fmtUsd(r.fast, c.nftGas, r.nativePrice)} NFT mint</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <section className="tool-prose">
            <h2>What is gas and why does it cost so much?</h2>
            <p>
              Gas is the fee you pay validators to include your transaction in a block. On Ethereum and most EVM-compatible
              chains, every operation — transferring tokens, swapping on Uniswap, minting an NFT — has a fixed gas cost,
              measured in <em>gas units</em>. Multiply that by the current <em>gas price</em> (denominated in gwei, where
              1 gwei = 0.000000001 ETH) and you get the total fee in the chain's native token.
            </p>
            <p>
              When the network is congested, gas prices spike because users bid against each other to be included sooner.
              That's why ETH gas is ~5 gwei on a quiet Sunday and 200+ gwei during a hot mint or volatile market hour.
              Layer-2 chains like Arbitrum, Base and Optimism inherit Ethereum's security but batch transactions, which is
              why their fees often run 10–100x cheaper.
            </p>

            <h3>How to read this tracker</h3>
            <ul>
              <li><strong>Slow</strong> — about 85% of standard. Confirms within several minutes. Cheapest, fine for non-urgent transfers.</li>
              <li><strong>Standard</strong> — the live <code>eth_gasPrice</code> reading. Confirms within 1–2 blocks.</li>
              <li><strong>Fast</strong> — about 125% of standard. Front of the next block on a busy day.</li>
            </ul>
            <p>
              The dollar estimates assume 21,000 gas for transfers, ~200,000 gas for swaps (typical Uniswap V3 single hop)
              and 80,000 gas for NFT mints (varies wildly per contract). Arbitrum's gas cost includes the L1 calldata
              component, which is why its <em>units</em> look high but the actual USD cost is still low.
            </p>

            <h3>Tips to pay less gas</h3>
            <ul>
              <li>Submit non-urgent transactions on weekends and during US night hours (UTC late evening) — fees can be 70% lower.</li>
              <li>Use an L2 (Arbitrum, Base, Optimism, Polygon) if your activity supports it. The bridge costs amortize over a few transactions.</li>
              <li>Never use the wallet's default <em>fast</em> tier when not needed — most wallets aggressively over-bid.</li>
              <li>Batch operations: many DeFi protocols offer multicall functions that bundle several actions into one transaction.</li>
              <li>Use account abstraction wallets (Argent, Safe) — they support gas sponsorship and ERC-4337 paymasters that can let dApps cover your fees.</li>
            </ul>

            <h3>Why prices move every block</h3>
            <p>
              Ethereum's EIP-1559 fee market splits gas into a <em>base fee</em> (burned) plus a <em>priority tip</em>
              (paid to validators). The base fee adjusts up or down each block based on whether the previous block was
              full. That's why you'll see the standard gwei reading tick up by 12.5% per block during a mint event and
              drop just as fast when activity quiets. The number you see here is whatever the RPC reports right now —
              if you wait two blocks (24 seconds) and refresh, it can be meaningfully different.
            </p>
          </section>

          <section className="tool-cross">
            <h3>Related tools</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/fear-greed" className="tool-cross-card">
                <h4>Fear &amp; Greed Index</h4><p>Live crypto sentiment gauge</p>
              </Link>
              <Link to="/tools/scam-check" className="tool-cross-card">
                <h4>Scam &amp; Honeypot Checker</h4><p>Check any token contract for red flags</p>
              </Link>
              <Link to="/compare" className="tool-cross-card">
                <h4>Compare Coins</h4><p>Side-by-side fundamentals for any two assets</p>
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
