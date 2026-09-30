import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronDown } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import { getCoinById, TOP_COINS } from '../utils/coinRegistry';
import { buildSeoMeta } from '../utils/seoMetadata';
import { breadcrumbList, faqPage, financialProduct, SITE_URL } from '../utils/jsonLd';
import { fetchCoinMarket } from '../services/seoContentApi';
import './SeoProgrammatic.css';

const formatUsd = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
};

const formatInr = (usd?: number, usdtInr = 84) => {
  if (usd == null || !Number.isFinite(usd)) return '—';
  return `₹${(usd * usdtInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/** /price/:coinId — price-first SEO page with FAQ */
const PricePage: React.FC = () => {
  const { coinId = '' } = useParams<{ coinId: string }>();
  const coin = getCoinById(coinId);
  const [market, setMarket] = useState<Awaited<ReturnType<typeof fetchCoinMarket>>>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [amount, setAmount] = useState('1');

  const meta = useMemo(
    () =>
      coin
        ? buildSeoMeta({
            title: `${coin.name} Price Today (USD & INR) — ${coin.symbol} Live Chart`,
            description: `Live ${coin.name} (${coin.symbol}) price, 24h change, market cap, and INR estimate. FAQ, converters, and links to news & tools on CoinsClarity.`,
            path: `/price/${coin.id}`,
            keywords: [
              `${coin.name} price`,
              `${coin.symbol} price today`,
              `${coin.name} price in India`,
              `${coin.symbol} to INR`,
            ],
          })
        : null,
    [coin],
  );

  const load = useCallback(async () => {
    if (!coin) return;
    setLoading(true);
    try {
      setMarket(await fetchCoinMarket(coin.id));
    } finally {
      setLoading(false);
    }
  }, [coin]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (!coin) {
    return (
      <div className="seo-page">
        <CoinsNavbar />
        <main className="seo-main seo-error">
          <p>Coin not found.</p>
          <Link to="/price/bitcoin" className="seo-back">
            <ArrowLeft size={16} /> Bitcoin price
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const qty = Number(amount) || 0;
  const usdVal = market?.price != null ? market.price * qty : null;
  const change = market?.change24h;
  const faq = [
    {
      question: `What is the ${coin.name} price today?`,
      answer: market?.price
        ? `${coin.name} trades near ${formatUsd(market.price)} (${change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'} 24h). Approx ${formatInr(market.price)} using a ~₹84 USDT/INR reference — check live P2P for exact INR.`
        : `Live ${coin.symbol} price loads from market data on this page.`,
    },
    {
      question: `How do I buy ${coin.symbol} in India?`,
      answer: `Use a KYC exchange or buy USDT via P2P then convert. See our India guides and live USDT/INR board.`,
    },
    {
      question: `Why is ${coin.symbol} moving today?`,
      answer: `Open the why-is-${coin.symbol}-up/down desks for catalysts, or the ${coin.name} news hub for headlines.`,
    },
    {
      question: `Is this financial advice?`,
      answer: `No. CoinsClarity publishes educational market data only.`,
    },
  ];

  return (
    <div className="seo-page">
      {meta && <SeoHead meta={meta} />}
      <JsonLd
        data={[
          financialProduct({
            name: coin.name,
            symbol: coin.symbol,
            url: `${SITE_URL}/price/${coin.id}`,
            description: meta?.description || '',
            price: market?.price,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Prices', url: `${SITE_URL}/price/bitcoin` },
            { name: `${coin.name} price`, url: `${SITE_URL}/price/${coin.id}` },
          ]),
          faqPage(faq),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <div className="seo-top">
          <Link to="/" className="seo-back">
            <ArrowLeft size={16} /> Home
          </Link>
          <button type="button" className="seo-refresh" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <header className="seo-hero">
          <p className="seo-hero__eyebrow">{coin.symbol} · Live price</p>
          <h1 className="seo-hero__title">
            {coin.name} price today
          </h1>
          <p className="seo-hero__standfirst">
            Real-time {coin.symbol} USD price with INR estimate, market cap, and desk links — built for traders searching “{coin.name} price”.
          </p>
        </header>

        <div className="seo-stats">
          <div className="seo-stat">
            <span className="seo-stat__label">Price (USD)</span>
            <span className="seo-stat__value">{formatUsd(market?.price)}</span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">≈ INR*</span>
            <span className="seo-stat__value">{formatInr(market?.price)}</span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">24h</span>
            <span
              className="seo-stat__value"
              style={{ color: change != null && change >= 0 ? '#15803d' : '#b91c1c' }}
            >
              {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
            </span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">Market cap</span>
            <span className="seo-stat__value">
              {market?.marketCap != null
                ? `$${(market.marketCap / 1e9).toFixed(2)}B`
                : '—'}
            </span>
          </div>
        </div>
        <p className="seo-muted">*INR uses a ~₹84/USDT reference. For executable rates see P2P.</p>

        <section className="seo-card" aria-label="Converter">
          <h2 className="seo-h2">Quick converter</h2>
          <label className="seo-label">
            Amount ({coin.symbol})
            <input
              className="seo-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <p className="seo-convert-out">
            ≈ {formatUsd(usdVal ?? undefined)} · {formatInr(usdVal ?? undefined)}
          </p>
        </section>

        <section className="seo-links-row">
          <Link to={`/coin/${coin.id}`}>Full chart</Link>
          <Link to={`/coin/${coin.id}/news`}>{coin.symbol} news</Link>
          <Link to={`/today/why-is-${coin.id}-up`}>Why up?</Link>
          <Link to={`/today/why-is-${coin.id}-down`}>Why down?</Link>
          <Link to="/tools/p2p">USDT/INR P2P</Link>
          <Link to="/in/how-to-buy-bitcoin">Buy in India</Link>
        </section>

        <section className="seo-faq" aria-label="FAQ">
          <h2 className="seo-h2">FAQ</h2>
          {faq.map((f, i) => (
            <div key={f.question} className={`seo-faq__item ${openFaq === i ? 'is-open' : ''}`}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.question}
                <ChevronDown size={16} />
              </button>
              {openFaq === i && <p>{f.answer}</p>}
            </div>
          ))}
        </section>

        <section>
          <h2 className="seo-h2">More prices</h2>
          <ul className="seo-chip-list">
            {TOP_COINS.slice(0, 16).map((c) => (
              <li key={c.id}>
                <Link to={`/price/${c.id}`}>{c.symbol}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PricePage;
