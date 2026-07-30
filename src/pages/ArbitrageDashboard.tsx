import React, { useState, useEffect, useMemo } from 'react';
import {
  getOpportunities,
  getStats,
  getTriangularOpportunitiesLive,
  getTriangularStats,
  ArbitrageOpportunity,
  ArbitrageStats,
  TriangularOpportunity,
  TriangularStats,
} from '../services/arbitrageApi';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Repeat,
  ArrowLeftRight,
} from 'lucide-react';
import './ArbitrageDashboard.css';

const ArbitrageDashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);
  const [triangularOpp, setTriangularOpp] = useState<TriangularOpportunity[]>([]);
  const [triangularStats, setTriangularStats] = useState<TriangularStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'cross-exchange' | 'triangular'>('cross-exchange');
  const [profitOnly, setProfitOnly] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const toNum = (value: unknown, fallback = 0): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const fixed = (value: unknown, digits: number): string => toNum(value).toFixed(digits);

  const fetchData = async () => {
    try {
      setError(null);
      const [opps, statistics, triangularOppsLive, triangularStat] = await Promise.all([
        getOpportunities(20),
        getStats(7),
        getTriangularOpportunitiesLive(20),
        getTriangularStats(7),
      ]);
      setOpportunities(Array.isArray(opps) ? opps : []);
      setStats(statistics ?? null);
      const triangularList = Array.isArray(triangularOppsLive) ? triangularOppsLive : [];
      setTriangularOpp(triangularList);
      if (triangularList.length > 0) {
        const avg =
          triangularList.reduce((s, o) => s + (o.netProfitPercent ?? 0), 0) / triangularList.length;
        const max = Math.max(...triangularList.map((o) => o.netProfitPercent ?? 0));
        setTriangularStats({
          totalOpportunities: triangularList.length,
          activeOpportunities: triangularList.length,
          averageProfitPercent: avg.toFixed(2),
          maxProfitPercent: max.toFixed(2),
          period: 'Live (now)',
        });
      } else {
        setTriangularStats(triangularStat ?? null);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch arbitrage data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getExchangeLink = (exchange: string, symbol?: string) => {
    const safeSymbol = typeof symbol === 'string' ? symbol : '';
    const baseSymbol = safeSymbol.replace(/\/USDT|\/USD/gi, '').toLowerCase();
    if (!baseSymbol) return '#';
    const key = exchange.toLowerCase();
    if (key.includes('binance')) return `https://www.binance.com/en/trade/${baseSymbol}_USDT`;
    if (key.includes('kraken')) return `https://www.kraken.com/prices/${baseSymbol}`;
    if (key.includes('coinbase') || key.includes('gdax'))
      return `https://www.coinbase.com/price/${baseSymbol}`;
    if (key.includes('kucoin')) return `https://www.kucoin.com/trade/${baseSymbol.toUpperCase()}-USDT`;
    if (key.includes('okx') || key.includes('okex'))
      return `https://www.okx.com/trade-spot/${baseSymbol}-usdt`;
    if (key.includes('bybit')) return `https://www.bybit.com/trade/spot/${baseSymbol.toUpperCase()}/USDT`;
    return '#';
  };

  const crossRows = useMemo(() => {
    const list = profitOnly
      ? opportunities.filter((o) => toNum(o.netProfitPercent) > 0)
      : opportunities;
    return [...list].sort((a, b) => toNum(b.netProfitPercent) - toNum(a.netProfitPercent));
  }, [opportunities, profitOnly]);

  const triRows = useMemo(() => {
    const list = profitOnly
      ? triangularOpp.filter((o) => toNum(o.netProfitPercent) > 0)
      : triangularOpp;
    return [...list].sort((a, b) => toNum(b.netProfitPercent) - toNum(a.netProfitPercent));
  }, [triangularOpp, profitOnly]);

  const pathLegs = (path: string): string[] =>
    String(path || '')
      .split(/\u2192|>/)
      .map((s) => s.trim())
      .filter(Boolean);

  const formatTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—';

  if (loading) {
    return (
      <div className="arb-page">
        <div className="arb-loading">
          <div>
            <div className="arb-spinner" />
            <strong style={{ color: 'var(--arb-ink)' }}>Scanning markets…</strong>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
              Pulling cross-exchange & triangular routes
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeStats = activeTab === 'cross-exchange' ? stats : triangularStats;
  const statCards = [
    {
      label: 'Active',
      value: String(activeStats?.activeOpportunities ?? 0),
    },
    {
      label: activeTab === 'triangular' ? 'Live paths' : 'Total (7d)',
      value: String(activeStats?.totalOpportunities ?? 0),
    },
    {
      label: 'Avg net',
      value: `${activeStats?.averageProfitPercent ?? '0.00'}%`,
    },
    {
      label: 'Best net',
      value: `${activeStats?.maxProfitPercent ?? '0.00'}%`,
    },
  ];

  return (
    <div className="arb-page">
      <div className="arb-shell">
        <header className="arb-header">
          <div>
            <p className="arb-kicker">CoinsClarity Tools</p>
            <h1 className="arb-title">Arbitrage Scanner</h1>
            <p className="arb-sub">
              Live spreads across CEXes and triangular paths on Binance — fees baked into net %.
            </p>
          </div>
          <div className="arb-header-actions">
            <span className="arb-live">
              <span className="arb-live-dot" />
              Updated {formatTime(lastUpdated)}
            </span>
            <button
              type="button"
              className="arb-btn arb-btn-primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'arb-spin-icon' : undefined} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div className="arb-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <div className="arb-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cross-exchange'}
            className={`arb-tab${activeTab === 'cross-exchange' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('cross-exchange')}
          >
            <ArrowLeftRight size={16} />
            Cross-exchange
            <span className="arb-tab-count">{opportunities.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'triangular'}
            className={`arb-tab${activeTab === 'triangular' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('triangular')}
          >
            <Repeat size={16} />
            Triangular
            <span className="arb-tab-count">{triangularOpp.length}</span>
          </button>
        </div>

        <div className="arb-stats">
          {statCards.map((s) => (
            <div className="arb-stat" key={s.label}>
              <p className="arb-stat-label">{s.label}</p>
              <p className="arb-stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        {activeTab === 'cross-exchange' && (
          <section>
            <div className="arb-toolbar">
              <div>
                <h2 className="arb-section-title">Cross-exchange spreads</h2>
                <p className="arb-hint">Buy low on one venue, sell high on another. Net ≈ after ~0.2% fees.</p>
              </div>
              <label className="arb-toggle">
                <input
                  type="checkbox"
                  checked={profitOnly}
                  onChange={(e) => setProfitOnly(e.target.checked)}
                />
                Profitable only
              </label>
            </div>

            <div className="arb-panel">
              {crossRows.length === 0 ? (
                <div className="arb-empty">
                  <strong>No spreads right now</strong>
                  Scanner refreshes every 30s — majors are usually tight.
                </div>
              ) : (
                <div className="arb-table-wrap">
                  <table className="arb-table">
                    <thead>
                      <tr>
                        <th>Pair</th>
                        <th>Buy</th>
                        <th>Sell</th>
                        <th>Net</th>
                        <th>On $1k</th>
                        <th>Liq</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crossRows.map((opp, idx) => {
                        const net = toNum(opp.netProfitPercent);
                        const hrefBuy = getExchangeLink(opp.buyExchange, opp.symbol);
                        const hrefSell = getExchangeLink(opp.sellExchange, opp.symbol);
                        return (
                          <tr key={opp._id ?? `cross-${idx}`}>
                            <td>
                              <span className="arb-pair">{opp.symbol ?? '—'}</span>
                            </td>
                            <td>
                              <div className="arb-side">
                                <span className="arb-side-label buy">Buy</span>
                                <span className="arb-ex">{opp.buyExchange}</span>
                                <span className="arb-mono">${fixed(opp.buyPrice, opp.buyPrice < 10 ? 4 : 2)}</span>
                                {hrefBuy !== '#' && (
                                  <a
                                    className="arb-link"
                                    href={hrefBuy}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Trade <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="arb-side">
                                <span className="arb-side-label sell">Sell</span>
                                <span className="arb-ex">{opp.sellExchange}</span>
                                <span className="arb-mono">${fixed(opp.sellPrice, opp.sellPrice < 10 ? 4 : 2)}</span>
                                {hrefSell !== '#' && (
                                  <a
                                    className="arb-link"
                                    href={hrefSell}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Trade <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`arb-profit ${net > 0 ? 'pos' : 'neg'}`}>
                                {net > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {fixed(net, 3)}%
                              </span>
                            </td>
                            <td>
                              <span className={`arb-mono arb-profit ${net > 0 ? 'pos' : 'neg'}`}>
                                ${fixed(opp.profitAmount, 2)}
                              </span>
                            </td>
                            <td>
                              <span className={`arb-liq ${(opp.liquidity || 'medium').toLowerCase()}`}>
                                {opp.liquidity || 'medium'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'triangular' && (
          <section>
            <div className="arb-toolbar">
              <div>
                <h2 className="arb-section-title">Triangular paths</h2>
                <p className="arb-hint">
                  Live Binance tickers. Net % after 0.3% fees (3 × 0.1%).
                </p>
              </div>
              <label className="arb-toggle">
                <input
                  type="checkbox"
                  checked={profitOnly}
                  onChange={(e) => setProfitOnly(e.target.checked)}
                />
                Profitable only
              </label>
            </div>

            <div className="arb-panel">
              {triRows.length === 0 ? (
                <div className="arb-empty">
                  <strong>No positive net paths</strong>
                  Markets are efficient — hit Refresh or turn off “Profitable only”.
                </div>
              ) : (
                <div className="arb-table-wrap">
                  <table className="arb-table">
                    <thead>
                      <tr>
                        <th>Exchange</th>
                        <th>Path</th>
                        <th>Steps</th>
                        <th>Net</th>
                        <th>On $1k</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triRows.map((opp, idx) => {
                        const net = toNum(opp.netProfitPercent);
                        const legs = pathLegs(opp.path);
                        return (
                          <tr key={opp._id ?? `tri-${idx}`}>
                            <td>
                              <span className="arb-ex">{(opp.exchange || '—').toUpperCase()}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--arb-muted)', marginTop: 2 }}>
                                Base {opp.baseCurrency || '—'}
                              </div>
                            </td>
                            <td>
                              <div className="arb-path">
                                {legs.map((leg, i) => (
                                  <React.Fragment key={`${leg}-${i}`}>
                                    {i > 0 && <span className="arb-arrow">→</span>}
                                    <span className="arb-chip">{leg}</span>
                                  </React.Fragment>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="arb-steps">
                                <span>
                                  1 {opp.step1?.pair ?? '—'} @ {fixed(opp.step1?.price, 6)}
                                </span>
                                <span>
                                  2 {opp.step2?.pair ?? '—'} @ {fixed(opp.step2?.price, 6)}
                                </span>
                                <span>
                                  3 {opp.step3?.pair ?? '—'} @ {fixed(opp.step3?.price, 6)}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`arb-profit ${net > 0 ? 'pos' : 'neg'}`}>
                                {net > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {fixed(net, 4)}%
                              </span>
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--arb-muted)',
                                  marginTop: 4,
                                  fontFamily: 'var(--arb-mono)',
                                }}
                              >
                                {fixed(opp.startAmount, 0)} → {fixed(opp.endAmount, 6)}{' '}
                                {opp.baseCurrency}
                              </div>
                            </td>
                            <td>
                              <span className={`arb-mono arb-profit ${net > 0 ? 'pos' : 'neg'}`}>
                                ${fixed(opp.profitAmount, 2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        <p className="arb-footer-note">
          Educational only — spreads can vanish before you execute. Always check fees, withdrawal
          limits, and slippage.
        </p>
      </div>
    </div>
  );
};

export default ArbitrageDashboard;
