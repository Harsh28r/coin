import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, MapPin } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import SeoHead from '../Components/SeoHead';
import JsonLd from '../Components/JsonLd';
import { INDIA_GUIDES, getIndiaGuide } from '../content/seoGrowth';
import { buildSeoMeta } from '../utils/seoMetadata';
import { breadcrumbList, faqPage, collectionPage, webPage, SITE_URL } from '../utils/jsonLd';
import './SeoProgrammatic.css';

export const IndiaHub: React.FC = () => {
  const meta = buildSeoMeta({
    title: 'Crypto in India — USDT, P2P, Tax & Scam Guides',
    description:
      'India crypto desk: buy USDT, USDT/INR P2P, tax basics, scam checks, UPI tips, and Bitcoin how-tos. Linked to live CoinsClarity tools.',
    path: '/in',
    keywords: ['crypto India', 'buy USDT India', 'USDT INR', 'crypto tax India'],
  });

  return (
    <div className="seo-page">
      <SeoHead meta={meta} />
      <JsonLd
        data={[
          collectionPage({
            name: meta.title,
            description: meta.description,
            url: `${SITE_URL}/in`,
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'India', url: `${SITE_URL}/in` },
          ]),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <Link to="/" className="seo-back">
          <ArrowLeft size={16} /> Home
        </Link>
        <header className="seo-hero">
          <p className="seo-hero__eyebrow">
            <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
            India desk
          </p>
          <h1 className="seo-hero__title">Crypto guides for India</h1>
          <p className="seo-hero__standfirst">
            Practical INR playbooks — P2P, tax, scams, gas — wired into live tools so you act on real rates, not blog fluff.
          </p>
        </header>
        <ul className="seo-guide-grid">
          {INDIA_GUIDES.map((g) => (
            <li key={g.slug}>
              <Link to={`/in/${g.slug}`} className="seo-guide-card">
                <span className="seo-guide-card__eye">{g.eyebrow}</span>
                <span className="seo-guide-card__title">{g.title.split('—')[0].trim()}</span>
                <span className="seo-guide-card__desc">{g.description.slice(0, 110)}…</span>
              </Link>
            </li>
          ))}
        </ul>
        <section className="seo-links-row">
          <Link to="/tools/p2p">USDT/INR P2P</Link>
          <Link to="/tools/scam-check">Scam-check</Link>
          <Link to="/price/bitcoin">BTC price</Link>
          <Link to="/tools/crypto-tax-calculator">Tax calculator</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export const IndiaGuidePage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const guide = getIndiaGuide(slug);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!guide) {
    return (
      <div className="seo-page">
        <CoinsNavbar />
        <main className="seo-main seo-error">
          <p>Guide not found.</p>
          <Link to="/in" className="seo-back">
            India hub
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = buildSeoMeta({
    title: guide.title,
    description: guide.description,
    path: `/in/${guide.slug}`,
  });

  return (
    <div className="seo-page">
      <SeoHead meta={meta} />
      <JsonLd
        data={[
          webPage({
            name: guide.title,
            description: guide.description,
            url: `${SITE_URL}/in/${guide.slug}`,
            type: 'WebPage',
          }),
          breadcrumbList([
            { name: 'Home', url: SITE_URL },
            { name: 'India', url: `${SITE_URL}/in` },
            { name: guide.title.slice(0, 48), url: `${SITE_URL}/in/${guide.slug}` },
          ]),
          faqPage(guide.faqs),
        ]}
      />
      <CoinsNavbar />
      <main className="seo-main">
        <Link to="/in" className="seo-back">
          <ArrowLeft size={16} /> India hub
        </Link>
        <header className="seo-hero">
          <p className="seo-hero__eyebrow">{guide.eyebrow}</p>
          <h1 className="seo-hero__title">{guide.title}</h1>
          <p className="seo-hero__standfirst">{guide.intro}</p>
        </header>

        {guide.sections.map((s) => (
          <section key={s.h2} className="seo-prose">
            <h2 className="seo-h2">{s.h2}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </section>
        ))}

        <section className="seo-links-row">
          {guide.ctaLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </section>

        <section className="seo-faq">
          <h2 className="seo-h2">FAQ</h2>
          {guide.faqs.map((f, i) => (
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

export default IndiaHub;
