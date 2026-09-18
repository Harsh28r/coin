import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, HelpCircle, ShieldAlert, ShieldCheck, ShieldX, X } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import { SITE_URL } from '../../utils/jsonLd';
import { buildRssBackendBasesFromEnv } from '../../utils/rssBackendBases';
import './tools.css';

interface CheckRow {
  key: string;
  label: string;
  desc: string;
  status: 'pass' | 'fail' | 'unknown';
  weight: number;
}

interface TokenDetails {
  buyTax?: string;
  sellTax?: string;
  transferTax?: string;
  holderCount?: string;
  totalSupply?: string;
  ownerAddress?: string;
  creatorAddress?: string;
  ownerPercent?: string;
  creatorPercent?: string;
  isInDex?: boolean;
  lpHolderCount?: string;
  cannotBuy?: boolean;
  cannotSellAll?: boolean;
  tradingCooldown?: boolean;
  antiWhale?: boolean;
  honeypotSameCreator?: boolean;
  dexPairs?: { name?: string; liquidity?: string; pair?: string }[];
}

interface VerdictResult {
  score: number;
  level: 'safe' | 'warn' | 'danger';
  summary: string;
  checks: CheckRow[];
  raw: any;
  symbol?: string;
  name?: string;
  details: TokenDetails;
  failedCount: number;
  passCount: number;
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

/** One-tap demos so first-time visitors see a full report without hunting an address */
const EXAMPLES = [
  { chain: '1', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', label: 'USDT · ETH' },
  { chain: '56', address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', label: 'ETH · BSC' },
  { chain: '1', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'USDC · ETH' },
  { chain: '8453', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', label: 'USDC · Base' },
];

const RECENT_KEY = 'cc_scam_recent_v1';
const MAX_RECENT = 8;

type RecentScan = { chain: string; address: string; name?: string; symbol?: string; score?: number; ts: number };

function loadRecent(): RecentScan[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(entry: RecentScan) {
  try {
    const prev = loadRecent().filter(
      (r) => !(r.chain === entry.chain && r.address.toLowerCase() === entry.address.toLowerCase()),
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...prev].slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

const chainLabel = (id: string) => CHAINS.find((c) => c.id === id)?.label || id;

type FetchTokenResult =
  | { ok: true; data: any; chain: string }
  | { ok: false; error: string; goplusCode?: number };

/** Direct GoPlus — CORS allows www / apex / localhost. Prefer this; backends lag behind deploys. */
async function fetchGoPlusDirect(chainId: string, address: string): Promise<FetchTokenResult> {
  const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const json = await res.json().catch(() => ({}));
  if (json?.code === 2007) {
    return { ok: false, error: 'not_contract', goplusCode: 2007 };
  }
  const result = json?.result;
  if (result == null || typeof result !== 'object') {
    return { ok: false, error: 'not_contract', goplusCode: Number(json?.code) || 2007 };
  }
  const data =
    result[address] ||
    result[Object.keys(result).find((k) => k.toLowerCase() === address) || ''];
  if (data && Object.keys(data).length) {
    return { ok: true, data, chain: chainId };
  }
  // Empty `{}` = not a token on this chain (GoPlus code 1)
  return { ok: false, error: 'not_contract', goplusCode: Number(json?.code) || 1 };
}

async function fetchViaProxy(chainId: string, address: string): Promise<FetchTokenResult> {
  const bases = buildRssBackendBasesFromEnv();
  let lastErr = 'Security API unavailable';

  for (const raw of bases) {
    const base = raw.replace(/\/$/, '');
    // Skip known-dead Vercel mirror — FUNCTION_INVOCATION_FAILED + no CORS on 500
    if (base.includes('c-back-seven.vercel.app')) continue;
    try {
      const res = await fetch(
        `${base}/api/tools/scam-check?chain=${encodeURIComponent(chainId)}&address=${encodeURIComponent(address)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      // Express "Cannot GET" HTML when route not deployed yet
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        lastErr = `HTTP ${res.status}`;
        continue;
      }
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success && json?.data) {
        return { ok: true, data: json.data, chain: chainId };
      }
      if (json?.goplusCode === 2007 || /not contract/i.test(String(json?.error || ''))) {
        return { ok: false, error: 'not_contract', goplusCode: 2007 };
      }
      lastErr = json?.error || `HTTP ${res.status}`;
    } catch (e: any) {
      lastErr = e?.message || 'network';
    }
  }
  return { ok: false, error: lastErr };
}

async function fetchTokenSecurity(chainId: string, address: string): Promise<FetchTokenResult> {
  try {
    return await fetchGoPlusDirect(chainId, address);
  } catch {
    /* CORS / network — try our proxy */
  }
  return fetchViaProxy(chainId, address);
}

/** If the picked chain has no token, probe other EVM chains in parallel (Binance-peg ETH → BSC, etc.). */
async function fetchTokenSecurityWithFallback(
  preferredChain: string,
  address: string,
): Promise<FetchTokenResult & { switchedFrom?: string }> {
  const primary = await fetchTokenSecurity(preferredChain, address);
  if (primary.ok) return primary;

  const others = CHAINS.map((c) => c.id).filter((id) => id !== preferredChain);
  const hits = await Promise.all(
    others.map(async (id) => {
      try {
        return await fetchTokenSecurity(id, address);
      } catch {
        return { ok: false as const, error: 'network' };
      }
    }),
  );
  const found = hits.find((h) => h.ok);
  if (found && found.ok) {
    return { ...found, switchedFrom: preferredChain };
  }
  return primary;
}

const isAddr = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s.trim());
const isChainId = (s?: string) => !!s && CHAINS.some((c) => c.id === s);

const flag = (b?: string | number | boolean) => b === '1' || b === 1 || b === true;
const clear = (b?: string | number | boolean) => b === '0' || b === 0 || b === false;

const evaluate = (data: any): VerdictResult => {
  const ok = (b?: string | number) => clear(b);
  const bad = (b?: string | number) => flag(b);

  const c: CheckRow[] = [
    {
      key: 'is_honeypot',
      label: 'Not a honeypot',
      desc: 'Buy + sell simulation both succeed. Fail = classic trap.',
      status: ok(data.is_honeypot) ? 'pass' : bad(data.is_honeypot) ? 'fail' : 'unknown',
      weight: 18,
    },
    {
      key: 'cannot_buy',
      label: 'Can be bought',
      desc: 'Token is purchasable in simulation (not buy-locked).',
      status: ok(data.cannot_buy) ? 'pass' : bad(data.cannot_buy) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'cannot_sell_all',
      label: 'Can sell full bag',
      desc: 'No max-sell restriction that traps most of your balance.',
      status: ok(data.cannot_sell_all) ? 'pass' : bad(data.cannot_sell_all) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'owner_change_balance',
      label: 'Owner cannot change balances',
      desc: 'No back-door that rewrites holder balances.',
      status: ok(data.owner_change_balance) ? 'pass' : bad(data.owner_change_balance) ? 'fail' : 'unknown',
      weight: 12,
    },
    {
      key: 'is_open_source',
      label: 'Source code verified',
      desc: 'Contract source published on the block explorer.',
      // GoPlus: "1" = open source (good) — inverted vs risk flags
      status: flag(data.is_open_source) ? 'pass' : clear(data.is_open_source) ? 'fail' : 'unknown',
      weight: 12,
    },
    {
      key: 'is_mintable',
      label: 'Supply not mintable',
      desc: 'Owner cannot inflate supply on demand.',
      status: ok(data.is_mintable) ? 'pass' : bad(data.is_mintable) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'hidden_owner',
      label: 'No hidden owner',
      desc: 'No undeclared admin with privileges.',
      status: ok(data.hidden_owner) ? 'pass' : bad(data.hidden_owner) ? 'fail' : 'unknown',
      weight: 10,
    },
    {
      key: 'is_proxy',
      label: 'Not a proxy contract',
      desc: 'Logic cannot be silently upgraded later.',
      status: ok(data.is_proxy) ? 'pass' : bad(data.is_proxy) ? 'fail' : 'unknown',
      weight: 8,
    },
    {
      key: 'can_take_back_ownership',
      label: 'Ownership cannot be reclaimed',
      desc: 'Renounced ownership stays renounced.',
      status: ok(data.can_take_back_ownership) ? 'pass' : bad(data.can_take_back_ownership) ? 'fail' : 'unknown',
      weight: 8,
    },
    {
      key: 'selfdestruct',
      label: 'No self-destruct',
      desc: 'Contract cannot be destroyed by its owner.',
      status: ok(data.selfdestruct) ? 'pass' : bad(data.selfdestruct) ? 'fail' : 'unknown',
      weight: 8,
    },
    {
      key: 'transfer_pausable',
      label: 'Transfers cannot be paused',
      desc: 'Owner cannot freeze trading for everyone.',
      status: ok(data.transfer_pausable) ? 'pass' : bad(data.transfer_pausable) ? 'fail' : 'unknown',
      weight: 6,
    },
    {
      key: 'is_blacklisted',
      label: 'No blacklist function',
      desc: 'Owner cannot block wallets from selling.',
      status: ok(data.is_blacklisted) ? 'pass' : bad(data.is_blacklisted) ? 'fail' : 'unknown',
      weight: 6,
    },
    {
      key: 'trading_cooldown',
      label: 'No trading cooldown',
      desc: 'No forced wait between buys/sells that traps traders.',
      status: ok(data.trading_cooldown) ? 'pass' : bad(data.trading_cooldown) ? 'fail' : 'unknown',
      weight: 4,
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
  const failedCount = c.filter((x) => x.status === 'fail').length;
  const passCount = c.filter((x) => x.status === 'pass').length;

  const buyTax = data.buy_tax != null ? String(data.buy_tax) : undefined;
  const sellTax = data.sell_tax != null ? String(data.sell_tax) : undefined;
  const highTax =
    (buyTax && parseFloat(buyTax) >= 10) || (sellTax && parseFloat(sellTax) >= 10);

  const summary =
    level === 'safe'
      ? highTax
        ? `Looks structurally OK, but tax is elevated (buy ${buyTax ?? '?'}% / sell ${sellTax ?? '?'}%). Size carefully.`
        : 'No major contract red flags. Still verify LP lock, team, and liquidity before size.'
      : level === 'warn'
        ? `${failedCount} warning${failedCount === 1 ? '' : 's'} — read every failed check before you touch this token.`
        : `${failedCount} high-risk flag${failedCount === 1 ? '' : 's'}. Treat as unsafe until proven otherwise.`;

  const dexRaw = Array.isArray(data.dex) ? data.dex : [];
  const details: TokenDetails = {
    buyTax,
    sellTax,
    transferTax: data.transfer_tax != null ? String(data.transfer_tax) : undefined,
    holderCount: data.holder_count != null ? String(data.holder_count) : undefined,
    totalSupply: data.total_supply != null ? String(data.total_supply) : undefined,
    ownerAddress: data.owner_address || undefined,
    creatorAddress: data.creator_address || undefined,
    ownerPercent: data.owner_percent != null ? String(data.owner_percent) : undefined,
    creatorPercent: data.creator_percent != null ? String(data.creator_percent) : undefined,
    isInDex: flag(data.is_in_dex) ? true : clear(data.is_in_dex) ? false : undefined,
    lpHolderCount: data.lp_holder_count != null ? String(data.lp_holder_count) : undefined,
    cannotBuy: flag(data.cannot_buy),
    cannotSellAll: flag(data.cannot_sell_all),
    tradingCooldown: flag(data.trading_cooldown),
    antiWhale: flag(data.is_anti_whale),
    honeypotSameCreator: flag(data.honeypot_with_same_creator),
    dexPairs: dexRaw.slice(0, 4).map((d: any) => ({
      name: d?.name || d?.dex_name,
      liquidity: d?.liquidity != null ? String(d.liquidity) : undefined,
      pair: d?.pair || d?.pair_address,
    })),
  };

  return {
    score,
    level,
    summary,
    checks: c,
    raw: data,
    symbol: data.token_symbol,
    name: data.token_name,
    details,
    failedCount,
    passCount,
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
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkFilter, setCheckFilter] = useState<'all' | 'fail'>('all');
  const [recent, setRecent] = useState<RecentScan[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

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
      setNotice(null);
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
        const found = await fetchTokenSecurityWithFallback(nextChain, nextAddr);
        if (!found.ok) {
          setError(
            found.goplusCode === 2007 || found.error === 'not_contract'
              ? `Not a token contract on ${chainLabel(nextChain)} (or any supported chain). Check the address / network.`
              : `No data returned (${found.error}). Confirm the address is a token on this chain.`,
          );
          return;
        }
        if (found.switchedFrom) {
          setChain(found.chain);
          setNotice(
            `Not found on ${chainLabel(found.switchedFrom)} — auto-scanned on ${chainLabel(found.chain)} (this address is a token there).`,
          );
        }
        const v = evaluate(found.data);
        setVerdict(v);
        pushRecent({
          chain: found.chain,
          address: nextAddr,
          name: v.name,
          symbol: v.symbol,
          score: v.score,
          ts: Date.now(),
        });
        setRecent(loadRecent());
        if (syncUrl) {
          navigate(`/tools/scam-check/${found.chain}/${nextAddr}`, { replace: true });
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

  const pasteAddress = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      const match = text.match(/0x[a-fA-F0-9]{40}/);
      if (match) {
        setAddr(match[0].toLowerCase());
        run(match[0].toLowerCase(), chain);
      } else {
        setError('Clipboard doesn’t contain a 0x… address.');
      }
    } catch {
      setError('Couldn’t read clipboard — paste manually into the box.');
    }
  };

  const onAddrChange = (value: string) => {
    setAddr(value);
    const match = value.trim().match(/^0x[a-fA-F0-9]{40}$/);
    if (match) {
      // auto-scan when a full address is pasted/typed
      window.setTimeout(() => run(match[0].toLowerCase(), chain), 0);
    }
  };

  const shareTweet = () => {
    if (!verdict) return;
    const label = verdict.symbol || addr.slice(0, 8);
    const text = `${label} scored ${verdict.score}/100 on CoinsClarity honeypot check (${verdict.failedCount} flags). ${reportUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const shareTelegram = () => {
    if (!verdict) return;
    const label = verdict.symbol || addr.slice(0, 8);
    const text = `${label} scored ${verdict.score}/100 — ${verdict.summary}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(reportUrl)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener',
    );
  };

  const visibleChecks = useMemo(() => {
    if (!verdict) return [];
    if (checkFilter === 'fail') return verdict.checks.filter((c) => c.status === 'fail');
    return [...verdict.checks].sort((a, b) => {
      const order = { fail: 0, unknown: 1, pass: 2 };
      return order[a.status] - order[b.status] || b.weight - a.weight;
    });
  }, [verdict, checkFilter]);

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
              Paste any token contract → get a scored audit in seconds. Buy/sell tax, honeypot simulation, owner powers,
              LP presence. Free, no signup — share the report link with your group chat.
            </p>
          </header>

          <div className="sc-input-row">
            <select value={chain} onChange={(e) => setChain(e.target.value)} aria-label="Network">
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              placeholder="Paste 0x… contract address"
              value={addr}
              onChange={(e) => onAddrChange(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                const match = text.match(/0x[a-fA-F0-9]{40}/);
                if (match) {
                  e.preventDefault();
                  setAddr(match[0].toLowerCase());
                  run(match[0].toLowerCase(), chain);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') run();
              }}
              spellCheck={false}
              autoComplete="off"
            />
            <button type="button" className="sc-paste" onClick={pasteAddress} title="Paste from clipboard">
              Paste
            </button>
            <button type="button" onClick={() => run()} disabled={loading}>
              {loading ? 'Scanning…' : 'Scan'}
            </button>
          </div>

          <div className="sc-easy">
            <div className="sc-easy__label">Try a known token</div>
            <div className="sc-chips">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.address + ex.chain}
                  type="button"
                  className="sc-chip"
                  disabled={loading}
                  onClick={() => {
                    setChain(ex.chain);
                    setAddr(ex.address);
                    run(ex.address, ex.chain);
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            {recent.length > 0 && (
              <>
                <div className="sc-easy__label" style={{ marginTop: 12 }}>
                  Your recent scans
                </div>
                <div className="sc-chips">
                  {recent.slice(0, 5).map((r) => (
                    <button
                      key={`${r.chain}-${r.address}`}
                      type="button"
                      className="sc-chip sc-chip--recent"
                      disabled={loading}
                      onClick={() => {
                        setChain(r.chain);
                        setAddr(r.address);
                        run(r.address, r.chain);
                      }}
                    >
                      {r.symbol || `${r.address.slice(0, 6)}…`}
                      {typeof r.score === 'number' ? ` · ${r.score}` : ''}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {error && <div className="tool-warn">{error}</div>}
          {notice && (
            <div
              className="tool-warn"
              style={{ borderColor: '#86efac', background: 'rgba(34,197,94,0.08)', color: '#166534' }}
            >
              {notice}
            </div>
          )}

          {loading && !verdict && (
            <div className="sc-loading">
              <div className="sc-loading__bar" />
              Running buy/sell simulation + owner-power checks across chains…
            </div>
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
                    <span className="sc-verdict__badge">{verdict.level.toUpperCase()}</span>
                  </div>
                  <div>{verdict.summary}</div>
                  <div className="sc-verdict__meta">
                    {verdict.passCount} passed · {verdict.failedCount} failed · {chainLabel(chain)}
                  </div>
                  <div className="sc-share-row">
                    {scannerBase && (
                      <a href={`${scannerBase}${addr}`} target="_blank" rel="noopener noreferrer">
                        Explorer →
                      </a>
                    )}
                    <button type="button" onClick={copyShareLink}>
                      <Copy size={13} /> {copied ? 'Copied' : 'Copy link'}
                    </button>
                    <button type="button" onClick={shareTweet}>
                      Post on X
                    </button>
                    <button type="button" onClick={shareTelegram}>
                      Share Telegram
                    </button>
                  </div>
                </div>
                <div className="sc-verdict__score" aria-label={`Score ${verdict.score} of 100`}>
                  {verdict.score}
                  <span>/100</span>
                </div>
              </div>

              <div className="sc-stats">
                {[
                  { k: 'Buy tax', v: verdict.details.buyTax != null ? `${verdict.details.buyTax}%` : '—', mobile: true },
                  { k: 'Sell tax', v: verdict.details.sellTax != null ? `${verdict.details.sellTax}%` : '—', mobile: true },
                  {
                    k: 'Holders',
                    v: verdict.details.holderCount
                      ? Number(verdict.details.holderCount).toLocaleString()
                      : '—',
                    mobile: true,
                  },
                  {
                    k: 'On DEX',
                    v:
                      verdict.details.isInDex === true
                        ? 'Yes'
                        : verdict.details.isInDex === false
                          ? 'No'
                          : '—',
                    mobile: true,
                  },
                  {
                    k: 'Owner %',
                    v: (() => {
                      const raw = verdict.details.ownerPercent;
                      if (raw == null) return '—';
                      const n = parseFloat(raw);
                      if (Number.isNaN(n)) return '—';
                      return `${(n <= 1 ? n * 100 : n).toFixed(2)}%`;
                    })(),
                    mobile: false,
                  },
                  {
                    k: 'LP holders',
                    v: verdict.details.lpHolderCount || '—',
                    mobile: false,
                  },
                ].map((s) => (
                  <div key={s.k} className={`sc-stat${s.mobile ? '' : ' sc-stat--desktop'}`}>
                    <div className="sc-stat__k">{s.k}</div>
                    <div className="sc-stat__v">{s.v}</div>
                  </div>
                ))}
              </div>

              {(verdict.details.ownerAddress ||
                verdict.details.creatorAddress ||
                (verdict.details.dexPairs && verdict.details.dexPairs.length > 0) ||
                verdict.details.honeypotSameCreator) && (
                <div className="sc-detail-panel">
                  <h3>Who controls this?</h3>
                  <ul>
                    {verdict.details.ownerAddress && (
                      <li>
                        <strong>Owner</strong>{' '}
                        <code>{verdict.details.ownerAddress}</code>
                        {verdict.details.ownerAddress === '0x0000000000000000000000000000000000000000'
                          ? ' (renounced)'
                          : ''}
                      </li>
                    )}
                    {verdict.details.creatorAddress && (
                      <li>
                        <strong>Creator</strong> <code>{verdict.details.creatorAddress}</code>
                        {verdict.details.creatorPercent != null
                          ? ` · ${(() => {
                              const n = parseFloat(verdict.details.creatorPercent!);
                              return `${(n <= 1 ? n * 100 : n).toFixed(2)}%`;
                            })()} supply`
                          : ''}
                      </li>
                    )}
                    {verdict.details.honeypotSameCreator && (
                      <li className="sc-detail-panel__warn">
                        Same creator has launched honeypots before — treat as high risk.
                      </li>
                    )}
                    {verdict.details.dexPairs?.map((p, i) => (
                      <li key={i}>
                        <strong>{p.name || 'DEX'}</strong>
                        {p.liquidity ? ` · liq ~${Number(p.liquidity).toLocaleString()}` : ''}
                        {p.pair ? (
                          <>
                            {' '}
                            <code>{p.pair.slice(0, 10)}…</code>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="sc-next">
                <h3>What to do next</h3>
                <ol>
                  {verdict.level === 'danger' ? (
                    <>
                      <li>Do not buy. Failed checks mean the contract can trap or dilute you.</li>
                      <li>If you already hold it, try a tiny sell test — never approve unlimited spend.</li>
                      <li>Share this report so others in your chat avoid it.</li>
                    </>
                  ) : verdict.level === 'warn' ? (
                    <>
                      <li>Read every failed check below before sizing up.</li>
                      <li>
                        Check gas on <Link to="/tools/gas">Gas Tracker</Link> so a failed tx doesn’t burn fees.
                      </li>
                      <li>
                        Scan unlock cliffs on <Link to="/tools/unlocks">Token Unlocks</Link> if this is a VC token.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>Contract looks clean — still verify LP lock &amp; team off-chain.</li>
                      <li>
                        Before swapping, peek at <Link to="/tools/gas">live gas</Link> on this chain.
                      </li>
                      <li>
                        Track the bag in <Link to="/portfolio">Portfolio</Link> and set a{' '}
                        <Link to="/tools/p2p">P2P rate alert</Link> if you cash out to INR.
                      </li>
                    </>
                  )}
                </ol>
              </div>

              <div className="sc-checks-head">
                <h3>Security checks</h3>
                <div className="sc-filter">
                  <button
                    type="button"
                    className={checkFilter === 'all' ? 'is-on' : ''}
                    onClick={() => setCheckFilter('all')}
                  >
                    All ({verdict.checks.length})
                  </button>
                  <button
                    type="button"
                    className={checkFilter === 'fail' ? 'is-on' : ''}
                    onClick={() => setCheckFilter('fail')}
                  >
                    Failed only ({verdict.failedCount})
                  </button>
                </div>
              </div>

              <div className="sc-checks">
                {visibleChecks.length === 0 && (
                  <div className="sc-check pass">
                    <span className="sc-check__icon">
                      <Check size={16} />
                    </span>
                    <div>
                      <div className="sc-check__label">No failed checks</div>
                      <div className="sc-check__desc">Switch to All to review every item.</div>
                    </div>
                  </div>
                )}
                {visibleChecks.map((c) => (
                  <div key={c.key} className={`sc-check ${c.status}`}>
                    <span className="sc-check__icon">{checkIcon(c.status)}</span>
                    <div>
                      <div className="sc-check__label">
                        {c.label}
                        <span className="sc-check__weight">{c.weight} pts</span>
                      </div>
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
              We pull GoPlus token-security data, weight each check by real-world severity, and surface tax / holder /
              owner concentration so you can decide in one screen. Score 80+ = no major red flags. 55–79 = review every
              warning. Below 55 = unsafe until proven otherwise.
            </p>

            <h3>What this tool can NOT tell you</h3>
            <p>
              Static checks miss liquidity rugs, social pumps, rebase games and off-chain team risk. Pair this with LP
              lock proofs and whether the project has a real product.
            </p>
          </section>

          <section className="tool-cross">
            <h3>Keep researching</h3>
            <div className="tool-cross-grid">
              <Link to="/tools/gas" className="tool-cross-card">
                <h4>Gas Tracker</h4>
                <p>Cheap moment to approve / swap</p>
              </Link>
              <Link to="/tools/unlocks" className="tool-cross-card">
                <h4>Token Unlocks</h4>
                <p>Supply dumps on the calendar</p>
              </Link>
              <Link to="/tools/p2p" className="tool-cross-card">
                <h4>USDT INR P2P</h4>
                <p>Cash out rates for India</p>
              </Link>
              <Link to="/portfolio" className="tool-cross-card">
                <h4>Portfolio</h4>
                <p>Track bags after you buy</p>
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
