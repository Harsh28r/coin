import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import { CALCULATORS, getCalculator } from '../content/seoGrowth';
import { buildSeoMeta } from '../utils/seoMetadata';
import { breadcrumbList, faqPage, webApplication, SITE_URL } from '../utils/jsonLd';
import './SeoProgrammatic.css';

type Num = number | '';

const n = (v: Num) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

const CalculatorPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const calc = getCalculator(slug);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Shared inputs — unused fields ignored per calculator
  const [buy, setBuy] = useState<Num>(40000);
  const [sell, setSell] = useState<Num>(45000);
  const [qty, setQty] = useState<Num>(0.1);
  const [feePct, setFeePct] = useState<Num>(0.1);
  const [periodic, setPeriodic] = useState<Num>(5000);
  const [periods, setPeriods] = useState<Num>(12);
  const [avgPrice, setAvgPrice] = useState<Num>(42000);
  const [principal, setPrincipal] = useState<Num>(100000);
  const [apy, setApy] = useState<Num>(5);
  const [years, setYears] = useState<Num>(1);
  const [entry, setEntry] = useState<Num>(100);
  const [leverage, setLeverage] = useState<Num>(10);
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [mm, setMm] = useState<Num>(0.5);
  const [gains, setGains] = useState<Num>(100000);

  const result = useMemo(() => {
    if (!calc) return null;
    switch (calc.slug) {
      case 'profit-calculator': {
        const cost = n(buy) * n(qty);
        const proceeds = n(sell) * n(qty);
        const fees = ((cost + proceeds) * n(feePct)) / 100;
        const profit = proceeds - cost - fees;
        const roi = cost > 0 ? (profit / cost) * 100 : 0;
        return [
          { label: 'Profit / loss', value: `$${profit.toFixed(2)}` },
          { label: 'ROI', value: `${roi.toFixed(2)}%` },
          { label: 'Fees (est.)', value: `$${fees.toFixed(2)}` },
        ];
      }
      case 'dca-calculator': {
        const invested = n(periodic) * n(periods);
        const units = n(avgPrice) > 0 ? invested / n(avgPrice) : 0;
        return [
          { label: 'Total invested', value: invested.toLocaleString() },
          { label: 'Units accumulated', value: units.toFixed(6) },
          { label: 'Avg entry used', value: String(avgPrice) },
        ];
      }
      case 'staking-calculator': {
        const simple = n(principal) * (n(apy) / 100) * n(years);
        const compound = n(principal) * (Math.pow(1 + n(apy) / 100, n(years)) - 1);
        return [
          { label: 'Simple yield', value: simple.toFixed(2) },
          { label: 'Compound (annual)', value: compound.toFixed(2) },
          { label: 'End value (compound)', value: (n(principal) + compound).toFixed(2) },
        ];
      }
      case 'liquidation-calculator': {
        const lev = Math.max(n(leverage), 1);
        const maint = n(mm) / 100;
        const liq =
          side === 'long'
            ? n(entry) * (1 - 1 / lev + maint)
            : n(entry) * (1 + 1 / lev - maint);
        return [
          { label: 'Est. liquidation', value: liq.toFixed(4) },
          { label: 'Side', value: side },
          { label: 'Leverage', value: `${lev}x` },
        ];
      }
      case 'crypto-tax-calculator': {
        const tax = n(gains) * 0.3;
        return [
          { label: 'Estimated gains', value: `₹${n(gains).toLocaleString('en-IN')}` },
          { label: 'Flat 30% estimate', value: `₹${tax.toLocaleString('en-IN')}` },
          { label: 'Note', value: 'Excludes surcharge/cess/TDS' },
        ];
      }
      default:
        return null;
    }
  }, [calc, buy, sell, qty, feePct, periodic, periods, avgPrice, principal, apy, years, entry, leverage, side, mm, gains]);

  if (!calc) {
    return (
      <div className="seo-page">
        <CoinsNavbar />
        <main className="seo-main seo-error">
          <p>Calculator not found.</p>
          <Link to="/tools" className="seo-back">
            Tools
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = buildSeoMeta({
    title: calc.title,
    description: calc.description,
    path: calc.path,
  });

  return (
    <div className="seo-page">
      <SeoHead meta={meta} />
      <JsonLd
        data={[
          webApplication({
            name: calc.title,
            description: calc.description,
            url: `${SITE_URL}${calc.path}`,
            features: ['Free', 'No signup', 'Educational'],
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'Tools', url: `${SITE_URL}/tools` },
            { name: calc.h1, url: `${SITE_URL}${calc.path}` },
          ]),
          faqPage(calc.faqs),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <Link to="/tools" className="seo-back">
          <ArrowLeft size={16} /> Tools
        </Link>
        <header className="seo-hero">
          <p className="seo-hero__eyebrow">Free calculator</p>
          <h1 className="seo-hero__title">{calc.h1}</h1>
          <p className="seo-hero__standfirst">{calc.intro}</p>
        </header>

        <section className="seo-card seo-calc">
          {calc.slug === 'profit-calculator' && (
            <>
              <label className="seo-label">Buy price<input className="seo-input" type="number" value={buy} onChange={(e) => setBuy(Number(e.target.value))} /></label>
              <label className="seo-label">Sell price<input className="seo-input" type="number" value={sell} onChange={(e) => setSell(Number(e.target.value))} /></label>
              <label className="seo-label">Quantity<input className="seo-input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
              <label className="seo-label">Fee % (round-trip)<input className="seo-input" type="number" value={feePct} onChange={(e) => setFeePct(Number(e.target.value))} /></label>
            </>
          )}
          {calc.slug === 'dca-calculator' && (
            <>
              <label className="seo-label">Amount each period<input className="seo-input" type="number" value={periodic} onChange={(e) => setPeriodic(Number(e.target.value))} /></label>
              <label className="seo-label">Number of periods<input className="seo-input" type="number" value={periods} onChange={(e) => setPeriods(Number(e.target.value))} /></label>
              <label className="seo-label">Assumed avg price<input className="seo-input" type="number" value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} /></label>
            </>
          )}
          {calc.slug === 'staking-calculator' && (
            <>
              <label className="seo-label">Principal<input className="seo-input" type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} /></label>
              <label className="seo-label">APY %<input className="seo-input" type="number" value={apy} onChange={(e) => setApy(Number(e.target.value))} /></label>
              <label className="seo-label">Years<input className="seo-input" type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} /></label>
            </>
          )}
          {calc.slug === 'liquidation-calculator' && (
            <>
              <label className="seo-label">Entry price<input className="seo-input" type="number" value={entry} onChange={(e) => setEntry(Number(e.target.value))} /></label>
              <label className="seo-label">Leverage<input className="seo-input" type="number" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} /></label>
              <label className="seo-label">Maintenance margin %<input className="seo-input" type="number" value={mm} onChange={(e) => setMm(Number(e.target.value))} /></label>
              <label className="seo-label">
                Side
                <select className="seo-input" value={side} onChange={(e) => setSide(e.target.value as 'long' | 'short')}>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </label>
            </>
          )}
          {calc.slug === 'crypto-tax-calculator' && (
            <label className="seo-label">
              Estimated VDA gains (₹)
              <input className="seo-input" type="number" value={gains} onChange={(e) => setGains(Number(e.target.value))} />
            </label>
          )}

          {result && (
            <div className="seo-stats" style={{ marginTop: 16 }}>
              {result.map((r) => (
                <div key={r.label} className="seo-stat">
                  <span className="seo-stat__label">{r.label}</span>
                  <span className="seo-stat__value">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="seo-links-row">
          {calc.related.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </section>

        <section className="seo-faq">
          <h2 className="seo-h2">FAQ</h2>
          {calc.faqs.map((f, i) => (
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
          <h2 className="seo-h2">All calculators</h2>
          <ul className="seo-chip-list">
            {CALCULATORS.map((c) => (
              <li key={c.slug}>
                <Link to={c.path}>{c.h1}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CalculatorPage;
