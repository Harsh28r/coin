import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronDown } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import { buildSeoMeta } from '../utils/seoMetadata';
import { breadcrumbList, faqPage, webPage, SITE_URL } from '../utils/jsonLd';
import { fetchCoinMarket } from '../services/seoContentApi';
import './SeoProgrammatic.css';

type EtfRow = { name: string; flow?: number; aum?: number };

const FAQS = [
  {
    question: 'What are Bitcoin ETF flows?',
    answer:
      'ETF flows measure net creations vs redemptions in spot Bitcoin ETFs. Positive flow means more BTC demand via ETFs that day; negative means net outflows.',
  },
  {
    question: 'Why do ETF flows move BTC price?',
    answer:
      'Large spot ETFs buy/sell Bitcoin to match shares. Sustained inflows tighten liquid supply; outflows can pressure price — alongside rates, risk appetite, and funding.',
  },
  {
    question: 'Where should I verify official numbers?',
    answer:
      'Cross-check issuer filings and aggregators (e.g. Farside, SoSoValue). CoinsClarity shows live BTC context plus educational flow framing.',
  },
];

/** /etf/bitcoin-flows — SEO + live BTC context */
const EtfFlowsPage: React.FC = () => {
  const [btc, setBtc] = useState<Awaited<ReturnType<typeof fetchCoinMarket>>>(null);
  const [rows, setRows] = useState<EtfRow[]>([]);
  const [note, setNote] = useState('Loading flow snapshot…');
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const meta = buildSeoMeta({
    title: 'Bitcoin ETF Flows Today — Spot BTC ETF Inflows & Outflows',
    description:
      'Track Bitcoin spot ETF flow context with live BTC price. Understand inflows vs outflows and what they mean for traders — CoinsClarity markets desk.',
    path: '/etf/bitcoin-flows',
    keywords: ['Bitcoin ETF flows', 'BTC ETF inflow', 'spot bitcoin ETF', 'IBIT FLOW'],
  });

  const load = async () => {
    setLoading(true);
    try {
      const mkt = await fetchCoinMarket('bitcoin');
      setBtc(mkt);

      // Best-effort public aggregators — page stays useful if they fail
      let loaded = false;
      try {
        const r = await fetch('https://api.llama.fi/etfs/overview', {
          signal: AbortSignal.timeout(10000),
        });
        if (r.ok) {
          const data = await r.json();
          const list = Array.isArray(data) ? data : data?.etfs || data?.data || [];
          if (Array.isArray(list) && list.length) {
            setRows(
              list.slice(0, 12).map((e: any) => ({
                name: e.name || e.ticker || e.fund || 'ETF',
                flow: e.flows?.['1d'] ?? e.flow1d ?? e.dailyFlow ?? e.flow,
                aum: e.aum ?? e.totalAssets,
              })),
            );
            setNote('Snapshot from public ETF overview feed. Verify with issuer data.');
            loaded = true;
          }
        }
      } catch {
        /* fall through */
      }
      if (!loaded) {
        setRows([
          { name: 'Spot BTC ETFs (aggregate)' },
          { name: 'Check Farside / issuer dashboards for official daily prints' },
        ]);
        setNote(
          'Live ETF aggregator unavailable right now. Use BTC price below + funding/liquidations for positioning context.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="seo-page">
      <SeoHead meta={meta} />
      <JsonLd
        data={[
          webPage({
            name: meta.title,
            description: meta.description,
            url: `${SITE_URL}/etf/bitcoin-flows`,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'ETF flows', url: `${SITE_URL}/etf/bitcoin-flows` },
          ]),
          faqPage(FAQS),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <div className="seo-top">
          <Link to="/" className="seo-back">
            <ArrowLeft size={16} /> Home
          </Link>
          <button type="button" className="seo-refresh" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <header className="seo-hero">
          <p className="seo-hero__eyebrow">Markets desk</p>
          <h1 className="seo-hero__title">Bitcoin ETF flows</h1>
          <p className="seo-hero__standfirst">
            Spot BTC ETF creations and redemptions are one of the strongest daily demand signals since January 2024.
            Pair flow prints with live price, funding, and liquidations.
          </p>
        </header>

        <div className="seo-stats">
          <div className="seo-stat">
            <span className="seo-stat__label">BTC price</span>
            <span className="seo-stat__value">
              {btc?.price != null
                ? `$${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                : '—'}
            </span>
          </div>
          <div className="seo-stat">
            <span className="seo-stat__label">24h</span>
            <span className="seo-stat__value">
              {btc?.change24h != null
                ? `${btc.change24h >= 0 ? '+' : ''}${btc.change24h.toFixed(2)}%`
                : '—'}
            </span>
          </div>
        </div>

        <p className="seo-muted">{note}</p>

        <section className="seo-card">
          <h2 className="seo-h2">Fund snapshot</h2>
          <ul className="seo-etf-list">
            {rows.map((r, i) => (
              <li key={`${r.name}-${i}`}>
                <strong>{r.name}</strong>
                {r.flow != null && (
                  <span>
                    {' '}
                    · 1d flow: {typeof r.flow === 'number' ? r.flow.toLocaleString() : r.flow}
                  </span>
                )}
                {r.aum != null && (
                  <span>
                    {' '}
                    · AUM: {typeof r.aum === 'number' ? `$${Number(r.aum).toLocaleString()}` : r.aum}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-prose">
          <h2 className="seo-h2">How traders use ETF flows</h2>
          <p>
            Multi-day inflow streaks often coincide with trend continuation; abrupt outflow days can mark risk-off
            sessions — especially when funding is already crowded. Flows are lagging prints (T+1), so combine with
            intraday liquidations and perpetual funding.
          </p>
        </section>

        <section className="seo-links-row">
          <Link to="/price/bitcoin">BTC price page</Link>
          <Link to="/today/why-is-bitcoin-up">Why is BTC up?</Link>
          <Link to="/tools/funding">Funding rates</Link>
          <Link to="/tools/liquidations">Liquidations</Link>
          <Link to="/prediction/bitcoin">BTC outlook</Link>
        </section>

        <section className="seo-faq">
          <h2 className="seo-h2">FAQ</h2>
          {FAQS.map((f, i) => (
            <div key={f.question} className={`seo-faq__item ${openFaq === i ? 'is-open' : ''}`}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.question}
                <ChevronDown size={16} />
              </button>
              {openFaq === i && <p>{f.answer}</p>}
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EtfFlowsPage;
