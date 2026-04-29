import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, Check, X, HelpCircle } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import './tools.css';

interface CheckRow {
  key: string;
  label: string;
  desc: string;
  status: 'pass' | 'fail' | 'unknown';
  weight: number;
}

interface VerdictResult {
  score: number;        // 0-100, higher = safer
  level: 'safe' | 'warn' | 'danger';
  summary: string;
  checks: CheckRow[];
  raw: any;
  symbol?: string;
  name?: string;
}

const CHAINS = [
  { id: '1',     label: 'Ethereum',     scanner: 'https://etherscan.io/token/' },
  { id: '56',    label: 'BNB Chain',    scanner: 'https://bscscan.com/token/' },
  { id: '137',   label: 'Polygon',      scanner: 'https://polygonscan.com/token/' },
  { id: '42161', label: 'Arbitrum One', scanner: 'https://arbiscan.io/token/' },
  { id: '10',    label: 'Optimism',     scanner: 'https://optimistic.etherscan.io/token/' },
  { id: '8453',  label: 'Base',         scanner: 'https://basescan.org/token/' },
  { id: '43114', label: 'Avalanche',    scanner: 'https://snowtrace.io/token/' },
];

const isAddr = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s.trim());

// GoPlus Security free token-security API
// https://api.gopluslabs.io/api/v1/token_security/{chainId}?contract_addresses=0x...
const evaluate = (data: any): VerdictResult => {
  const ok = (b?: string | number) => b === '0' || b === 0;
  const bad = (b?: string | number) => b === '1' || b === 1;

  // Define every check with its weight. Pass = full weight, fail = -weight,
  // unknown = 0. Score is normalized to 0–100 at the end.
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

  let earned = 0, total = 0;
  for (const r of c) {
    total += r.weight;
    if (r.status === 'pass') earned += r.weight;
    else if (r.status === 'fail') earned -= r.weight * 0.5;
  }
  const score = Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
  const level: VerdictResult['level'] =
    score >= 80 ? 'safe' : score >= 55 ? 'warn' : 'danger';

  const summary =
    level === 'safe'
      ? `No major red flags found. Standard due diligence still recommended.`
      : level === 'warn'
      ? `Some risk indicators detected. Read every flagged item before interacting.`
      : `Multiple high-risk indicators. Treat as unsafe until proven otherwise.`;

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
  const [chain, setChain] = useState('1');
  const [addr, setAddr] = useState('');
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setVerdict(null);
    if (!isAddr(addr)) {
      setError('Please enter a valid 0x… contract address (42 chars).');
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.gopluslabs.io/api/v1/token_security/${chain}?contract_addresses=${addr.trim().toLowerCase()}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error('api');
      const json = await res.json();
      const data = json?.result?.[addr.trim().toLowerCase()];
      if (!data || !Object.keys(data).length) {
        setError('No data returned. The address may not be a token contract on this chain.');
        return;
      }
      setVerdict(evaluate(data));
    } catch {
      setError('Could not reach the security API. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const verdictIcon = verdict?.level === 'safe'
    ? <ShieldCheck size={36} />
    : verdict?.level === 'warn'
    ? <ShieldAlert size={36} />
    : <ShieldX size={36} />;

  const checkIcon = (s: CheckRow['status']) =>
    s === 'pass' ? <Check size={16} /> : s === 'fail' ? <X size={16} /> : <HelpCircle size={16} />;

  const scannerBase = CHAINS.find(c => c.id === chain)?.scanner || '';

  return (
    <>
      <CoinsNavbar />
      <Helmet>
        <title>Crypto Scam &amp; Honeypot Checker — Free Token Audit | CoinsClarity</title>
        <meta
          name="description"
          content="Paste any token contract and get an instant security audit: honeypot detection, mint privileges, hidden owners, blacklist functions and 7 more checks across 7 chains. Free, no signup."
        />
        <link rel="canonical" href="https://coinsclarity.com/tools/scam-check" />
        <meta property="og:title" content="Crypto Scam &amp; Honeypot Checker" />
        <meta property="og:description" content="Free instant security audit for any ERC-20 / BEP-20 token. 10 risk checks across 7 chains." />
      </Helmet>

      <div className="tool-shell">
        <div className="tool-container">
          <Link to="/tools" className="tool-back"><ArrowLeft size={16} /> All tools</Link>

          <header className="tool-head">
            <span className="tool-eyebrow">Risk &amp; Security</span>
            <h1 className="tool-title">Token Scam &amp; Honeypot Checker</h1>
            <p className="tool-tagline">
              Paste any token contract address and get an instant 10-point security audit. Detects honeypots, hidden
              owners, mint backdoors and more across Ethereum, BNB, Polygon, Arbitrum, Optimism, Base and Avalanche.
            </p>
          </header>

          <div className="sc-input-row">
            <select value={chain} onChange={e => setChain(e.target.value)}>
              {CHAINS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input
              placeholder="0x... contract address"
              value={addr}
              onChange={e => setAddr(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') run(); }}
              spellCheck={false}
            />
            <button onClick={run} disabled={loading}>{loading ? 'Scanning…' : 'Scan'}</button>
          </div>

          {error && (
            <div className="tool-warn">{error}</div>
          )}

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
                  {scannerBase && (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                      <a href={`${scannerBase}${addr}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                        View on block explorer →
                      </a>
                    </div>
                  )}
                </div>
                <div className="sc-verdict__score">{verdict.score}</div>
              </div>

              <div className="sc-checks">
                {verdict.checks.map(c => (
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
            <h2>How the audit works</h2>
            <p>
              This tool runs your contract address through GoPlus Security's open token-security API, then weights every
              individual check by its real-world severity. A score of 80+ means no major red flags were detected. A score
              of 55–79 means you should read every yellow item before interacting. Below 55 means multiple serious risks
              are present and the token should be treated as unsafe until investigated further.
            </p>

            <h3>The 10 checks, ranked by severity</h3>
            <ul>
              <li>
                <strong>Honeypot test (18 pts).</strong> The most important check. The API simulates a buy and a sell.
                If the buy succeeds but the sell reverts, the token is a honeypot — your money goes in, it never comes
                out. There is no recovery.
              </li>
              <li>
                <strong>Owner can change balances (12 pts).</strong> Some scam tokens contain a hidden function the
                owner can call to set anyone's balance to zero. If this flag is true, walk away.
              </li>
              <li>
                <strong>Source code verified (12 pts).</strong> Unverified contracts are opaque — you have no way to
                audit them. Always prefer verified contracts.
              </li>
              <li>
                <strong>Mintable supply (10 pts).</strong> If the owner can mint unlimited new tokens, your share gets
                diluted toward zero. Legit projects either renounce minting or cap it.
              </li>
              <li>
                <strong>Hidden owner (10 pts).</strong> An undeclared admin address with full privileges. A common rug
                pattern is showing a "renounced" public owner while a hidden one quietly retains control.
              </li>
              <li>
                <strong>Proxy contract (10 pts).</strong> Upgradeable proxies allow the owner to change the contract's
                logic at will. Useful for legitimate projects, abusable for rugs.
              </li>
              <li>
                <strong>Self-destruct (8 pts).</strong> If the contract contains the SELFDESTRUCT opcode, the owner can
                delete it, freezing every holder's tokens.
              </li>
              <li>
                <strong>Ownership reclaim (8 pts).</strong> A "renounced" owner that can be revived is a known scam
                pattern.
              </li>
              <li>
                <strong>Pausable transfers (6 pts).</strong> The owner can freeze every transfer with one transaction.
                Sometimes legit (compliance), often a rug enabler.
              </li>
              <li>
                <strong>Blacklist function (6 pts).</strong> The owner can block specific addresses from selling.
                Frequently used to prevent victims from exiting before a rug.
              </li>
            </ul>

            <h3>What this tool can NOT tell you</h3>
            <p>
              Static security checks miss several attack vectors: liquidity rugs (LP tokens not locked), social-engineering
              pumps, rebase manipulation, oracle exploits, and any off-chain risks like the team simply running away.
              Always combine this audit with: liquidity-locking proof (UNCX, Team Finance), holder concentration on the
              block explorer (top-10 holding under 30% is healthy), team doxxing if any, and whether the project has a
              real product.
            </p>

            <h3>Free, no signup, no wallet</h3>
            <p>
              We don't store anything you paste here. The address goes directly to the security API in your browser and
              the result renders client-side. You don't need to sign in, connect a wallet, or share an email. Bookmark
              this tool — it's faster than Etherscan's risk tab and covers more chains.
            </p>
          </section>

          <section className="tool-cross">
            <h3>Related tools</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/fear-greed" className="tool-cross-card">
                <h4>Fear &amp; Greed Index</h4><p>Live crypto sentiment gauge</p>
              </Link>
              <Link to="/tools/gas" className="tool-cross-card">
                <h4>Gas Tracker</h4><p>Live gas across 6 EVM chains</p>
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

export default ScamCheckPage;
