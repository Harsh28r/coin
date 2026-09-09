import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, HelpCircle, ShieldAlert, ShieldCheck, ShieldX, X } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import { SITE_URL } from '../../utils/jsonLd';
import './tools.css';

interface CheckRow {
  key: string;
  label: string;
  desc: string;
  status: 'pass' | 'fail' | 'unknown';
  weight: number;
}

interface VerdictResult {
  score: number;
  level: 'safe' | 'warn' | 'danger';
  summary: string;
  checks: CheckRow[];
  raw: any;
  symbol?: string;
  name?: string;
}

const CHAINS = [
  { id: '1', label: 'Ethereum', scanner: 'https://etherscan.io/token/' },
  { id: '56', label: 'BNB Chain', scanner: 'https://bscscan.com/token/' },
  { id: '137', label: 'Polygon', scanner: 'https://polygonscan.com/token/' },
  { id: '42161', label: 'Arbitrum One', scanner: 'https://arbiscan.io/token/' },
  { id: '10', label: 'Optimism', scanner: 'https://optimistic.etherscan.io/token/' },
  { id: '8453', label: 'Base', scanner: 'https://basescan.org/token/' },
  { id: '43114', label: 'Avalanche', scanner: 'https://snowtrace.io/token/' },
];

const isAddr = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s.trim());
const isChainId = (s?: string) => !!s && CHAINS.some((c) => c.id === s);

const evaluate = (data: any): VerdictResult => {
  const ok = (b?: string | number) => b === '0' || b === 0;
  const bad = (b?: string | number) => b === '1' || b === 1;

  const c: CheckRow[] = [
    {
      key: 'is_open_source',
      label: 'Source code verified',
      desc: 'Contract source has been published & verified on a block explorer.',
      status: ok(data.is_open_source) ? 'pass' : bad(data.is_open_source) ? 'fail' : 'unknown',
      weight: 12,
    },
    {
      key: 'is_proxy',
      label: 'Not a proxy contract',
      desc: 'Proxy contracts can be silently upgraded by the owner — high risk.',
      status: ok(data.is_proxy) ? 'pass' : bad(data.is_proxy) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'is_mintable',
      label: 'Supply not mintable',
      desc: 'Owner cannot inflate supply on demand.',
      status: ok(data.is_mintable) ? 'pass' : bad(data.is_mintable) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'can_take_back_ownership',
      label: 'Ownership cannot be reclaimed',
      desc: 'Renounced ownership stays renounced.',
      status: ok(data.can_take_back_ownership) ? 'pass' : bad(data.can_take_back_ownership) ? 'fail' : 'unknown',
      weight: 8,
    },
    {
      key: 'owner_change_balance',
      label: 'Owner cannot change balances',
      desc: 'No back-door function that adjusts holder balances.',
      status: ok(data.owner_change_balance) ? 'pass' : bad(data.owner_change_balance) ? 'fail' : 'unknown',
      weight: 12,
    },
    {
      key: 'hidden_owner',
      label: 'No hidden owner',
      desc: 'No undeclared admin address with privileges.',
      status: ok(data.hidden_owner) ? 'pass' : bad(data.hidden_owner) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'selfdestruct',
      label: 'No self-destruct',
      desc: 'Contract cannot be destroyed by its owner.',
      status: ok(data.selfdestruct) ? 'pass' : bad(data.selfdestruct) ? 'fail' : 'unknown',
      weight: 8,
    },
    {
      key: 'is_honeypot',
      label: 'Not a honeypot',
      desc: 'Buys succeed AND sells succeed in simulation.',
      status: ok(data.is_honeypot) ? 'pass' : bad(data.is_honeypot) ? 'fail' : 'unknown',
      weight: 18,
    },
    {
      key: 'transfer_pausable',
      label: 'Transfers cannot be paused',
      desc: 'Owner cannot freeze the entire token at will.',
      status: ok(data.transfer_pausable) ? 'pass' : bad(data.transfer_pausable) ? 'fail' : 'unknown',
      weight: 6,
    },
    {
      key: 'is_blacklisted',
      label: 'No blacklist function',
      desc: 'No mechanism to block specific addresses from selling.',
      status: ok(data.is_blacklisted) ? 'pass' : bad(data.is_blacklisted) ? 'fail' : 'unknown',
      weight: 6,
    },
  ];

  let earned = 0;
  let total = 0;
  for (const r of c) {
    total += r.weight;
    if (r.status === 'pass') earned += r.weight;
    else if (r.status === 'fail') earned -= r.weight * 0.5;
  }
  const score = Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
  const level: VerdictResult['level'] = score >= 80 ? 'safe' : score >= 55 ? 'warn' : 'danger';

  const summary =
    level === 'safe'
      ? 'No major red flags found. Standard due diligence still recommended.'
      : level === 'warn'
        ? 'Some risk indicators detected. Read every flagged item before interacting.'
        : 'Multiple high-risk indicators. Treat as unsafe until proven otherwise.';

  return {
    score,
    level,
    summary,
    checks: c,
    raw: data,
    symbol: data.token_symbol,
    name: data.token_name,
  };
};

const ScamCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const { chainId: routeChain, address: routeAddress } = useParams<{
    chainId?: string;
    address?: string;
  }>();

  const initialChain = isChainId(routeChain) ? routeChain! : '1';
  const initialAddr = routeAddress && isAddr(routeAddress) ? routeAddress.toLowerCase() : '';

  const [chain, setChain] = useState(initialChain);
  const [addr, setAddr] = useState(initialAddr);
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reportPath =
    isAddr(addr) && isChainId(chain)
      ? `/tools/scam-check/${chain}/${addr.trim().toLowerCase()}`
      : '/tools/scam-check';
  const reportUrl = `${SITE_URL}${reportPath}`;

  const run = useCallback(
    async (overrideAddr?: string, overrideChain?: string, syncUrl = true) => {
      const nextAddr = (overrideAddr ?? addr).trim().toLowerCase();
      const nextChain = overrideChain ?? chain;
      setError(null);
      setVerdict(null);
      if (!isAddr(nextAddr)) {
        setError('Please enter a valid 0x… contract address (42 chars).');
        return;
      }
      if (!isChainId(nextChain)) {
        setError('Pick a supported chain.');
        return;
      }
      setLoading(true);
      try {
        const url = `https://api.gopluslabs.io/api/v1/token_security/${nextChain}?contract_addresses=${nextAddr}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error('api');
        const json = await res.json();
        const data = json?.result?.[nextAddr];
        if (!data || !Object.keys(data).length) {
          setError('No data returned. The address may not be a token contract on this chain.');
          return;
        }
        setVerdict(evaluate(data));
        if (syncUrl) {
          navigate(`/tools/scam-check/${nextChain}/${nextAddr}`, { replace: true });
        }
      } catch {
        setError('Could not reach the security API. Try again in a moment.');
      } finally {
        setLoading(false);
      }
    },
    [addr, chain, navigate],
  );

  useEffect(() => {
    if (!routeAddress || !isAddr(routeAddress) || !isChainId(routeChain)) return;
    const nextAddr = routeAddress.toLowerCase();
    const nextChain = routeChain!;
    setAddr(nextAddr);
    setChain(nextChain);
    run(nextAddr, nextChain, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeChain, routeAddress]);

  const seo = useMemo(() => {
    if (verdict && isAddr(addr)) {
      const label =
        verdict.name && verdict.symbol
          ? `${verdict.name} (${verdict.symbol})`
          : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
      return {
        title: `${label} Token Audit Score ${verdict.score}/100 | Honeypot & Scam Check`,
        description: `${label} security report: score ${verdict.score}/100. Instant honeypot, rug, mint, hidden-owner and blacklist checks on CoinsClarity.`,
        canonical: reportUrl,
      };
    }
    return {
      title: 'Honeypot Checker — Free Token Scam Checker (ETH, BSC) | CoinsClarity',
      description:
        'Free honeypot checker and token scam checker for ETH, BSC, Polygon, Base and more. Paste a contract to detect rugs, hidden owners, mint backdoors and blacklist risks.',
      canonical: `${SITE_URL}/tools/scam-check`,
    };
  }, [verdict, addr, reportUrl]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const verdictIcon =
    verdict?.level === 'safe' ? (
      <ShieldCheck size={36} />
    ) : verdict?.level === 'warn' ? (
      <ShieldAlert size={36} />
    ) : (
      <ShieldX size={36} />
    );

  const checkIcon = (s: CheckRow['status']) =>
    s === 'pass' ? <Check size={16} /> : s === 'fail' ? <X size={16} /> : <HelpCircle size={16} />;

  const scannerBase = CHAINS.find((c) => c.id === chain)?.scanner || '';

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back">
            <ArrowLeft size={16} /> All tools
          </Link>

          <header className="tool-head">
            <span className="tool-eyebrow">Risk &amp; Security</span>
            <h1 className="tool-title">Honeypot Checker</h1>
            <p className="tool-tagline">
              Instant honeypot checker and token audit for any ERC-20 / BEP-20 contract. Detect rugs, honeypots, hidden
              owners, mint backdoors and blacklist risks across Ethereum, BNB, Polygon, Arbitrum, Optimism, Base and
              Avalanche. Free, no signup, shareable report link.
            </p>
          </header>

          <div className="sc-input-row">
            <select value={chain} onChange={(e) => setChain(e.target.value)}>
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              placeholder="0x... contract address"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') run();
              }}
              spellCheck={false}
            />
            <button onClick={() => run()} disabled={loading}>
              {loading ? 'Scanning…' : 'Scan'}
            </button>
          </div>

          {error && <div className="tool-warn">{error}</div>}

          {verdict && (
            <>
              <div className={`sc-verdict ${verdict.level}`}>
                {verdictIcon}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>
                    {verdict.name && verdict.symbol
                      ? `${verdict.name} (${verdict.symbol})`
                      : 'Token'}
                  </div>
                  <div>{verdict.summary}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                    {scannerBase && (
                      <a
                        href={`${scannerBase}${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                      >
                        View on block explorer →
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={copyShareLink}
                      style={{
                        background: 'transparent',
                        border: '1px solid currentColor',
                        borderRadius: 999,
                        color: 'inherit',
                        padding: '4px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} /> {copied ? 'Link copied' : 'Copy shareable report'}
                    </button>
                  </div>
                </div>
                <div className="sc-verdict__score">{verdict.score}</div>
              </div>

              <div className="sc-checks">
                {verdict.checks.map((c) => (
                  <div key={c.key} className={`sc-check ${c.status}`}>
                    <span className="sc-check__icon">{checkIcon(c.status)}</span>
                    <div>
                      <div className="sc-check__label">{c.label}</div>
                      <div className="sc-check__desc">{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <section className="tool-prose">
            <h2>Honeypot checker for ETH, BSC and more</h2>
            <p>
              Paste any 0x contract. This honeypot checker (GoPlus) simulates buy and sell. Works as a token scam checker
              on Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base and Avalanche — same idea as Token Sniffer, no
              signup.
            </p>

            <h2>How the honeypot &amp; scam audit works</h2>
            <p>
              This free crypto token scam checker runs your contract through GoPlus Security&apos;s token-security API,
              then weights every check by real-world severity. Use it as a honeypot checker, rug detector and quick
              contract audit before you buy. A score of 80+ means no major red flags. 55–79 means review every warning.
              Below 55 means treat the token as unsafe until proven otherwise.
            </p>

            <h3>The 10 checks, ranked by severity</h3>
            <ul>
              <li>
                <strong>Honeypot test (18 pts).</strong> Simulates a buy and a sell. If buy works but sell reverts, the
                token is a honeypot.
              </li>
              <li>
                <strong>Owner can change balances (12 pts).</strong> Hidden balance-write functions are a classic rug
                pattern.
              </li>
              <li>
                <strong>Source code verified (12 pts).</strong> Unverified contracts are opaque.
              </li>
              <li>
                <strong>Mintable supply (10 pts).</strong> Unlimited minting can dilute holders to zero.
              </li>
              <li>
                <strong>Hidden owner (10 pts).</strong> Undeclared admin with privileges.
              </li>
              <li>
                <strong>Proxy contract (10 pts).</strong> Upgradeable logic can be swapped later.
              </li>
              <li>
                <strong>Self-destruct (8 pts).</strong> Owner can delete the contract.
              </li>
              <li>
                <strong>Ownership reclaim (8 pts).</strong> Fake renounces that can be revived.
              </li>
              <li>
                <strong>Pausable transfers (6 pts).</strong> Owner can freeze trading.
              </li>
              <li>
                <strong>Blacklist function (6 pts).</strong> Owner can block wallets from selling.
              </li>
            </ul>

            <h3>What this tool can NOT tell you</h3>
            <p>
              Static security checks miss liquidity rugs, social-engineering pumps, rebase games, oracle exploits and
              off-chain team risk. Always combine this audit with LP lock proofs, holder concentration and whether the
              project has a real product.
            </p>

            <h3>Free, no signup, shareable report</h3>
            <p>
              We don&apos;t store addresses. Results render in your browser and get a shareable URL like{' '}
              <code>/tools/scam-check/1/0x…</code> so you can send the report in Telegram or X. Bookmark this honeypot
              checker — it covers more chains than most explorer risk tabs.
            </p>
          </section>

          <section className="tool-cross">
            <h3>Related tools</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/fear-greed" className="tool-cross-card">
                <h4>Fear &amp; Greed Index</h4>
                <p>Live crypto sentiment gauge</p>
              </Link>
              <Link to="/tools/gas" className="tool-cross-card">
                <h4>Gas Tracker</h4>
                <p>Live gas across 6 EVM chains</p>
              </Link>
              <Link to="/compare" className="tool-cross-card">
                <h4>Compare Coins</h4>
                <p>Side-by-side fundamentals for any two assets</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ScamCheckPage;
