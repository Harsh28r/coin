import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Copy, ExternalLink, Handshake } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';
import CoinpediaPartner from '../Components/CoinpediaPartner';
import '../Components/CoinpediaPartner.css';

const FEAR_IFRAME = `<iframe
  src="https://www.coinsclarity.com/embed/fear-greed"
  title="Fear & Greed — CoinsClarity"
  width="100%"
  height="220"
  style="border:0;border-radius:10px;overflow:hidden"
  loading="lazy"
></iframe>`;

const ARB_IFRAME = `<iframe
  src="https://www.coinsclarity.com/embed/arb"
  title="Arbitrage — CoinsClarity"
  width="100%"
  height="320"
  style="border:0;border-radius:10px;overflow:hidden"
  loading="lazy"
></iframe>`;

const CopyBlock: React.FC<{ label: string; code: string }> = ({ label, code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="cp-embed__block">
      <div className="cp-embed__block-head">
        <span>{label}</span>
        <button type="button" className="cp-embed__copy" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="cp-embed__pre">{code}</pre>
    </div>
  );
};

const CoinpediaPartnerPage: React.FC = () => {
  return (
    <div className="cp-page">
      <Helmet>
        <title>Coinpedia × CoinsClarity — Official Media Partnership</title>
        <meta
          name="description"
          content="Official Coinpedia partnership on CoinsClarity. Partner stories with attribution, plus embeddable Fear & Greed and arbitrage widgets."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${window.location.origin}/partners/coinpedia`} />
      </Helmet>

      <CoinsNavbar />

      <header className="cp-page__hero">
        <div className="cp-page__hero-inner">
          <Link to="/" className="cp-page__back">
            <ArrowLeft size={15} /> Home
          </Link>
          <p className="cp-page__kicker">
            <Handshake size={14} /> Official media partnership
          </p>
          <h1 className="cp-page__title">
            Coinpedia <span>×</span> CoinsClarity
          </h1>
          <p className="cp-page__dek">
            Partner reporting from Coinpedia, shown on CoinsClarity with full attribution — plus
            live market widgets Coinpedia can embed on their site.
          </p>
          <div className="cp-page__cta">
            <a
              href="https://coinpedia.org/"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="cp-page__btn cp-page__btn--primary"
            >
              Visit Coinpedia <ExternalLink size={14} />
            </a>
            <a href="#embeds" className="cp-page__btn cp-page__btn--ghost">
              Embed widgets
            </a>
          </div>
        </div>
      </header>

      <CoinpediaPartner limit={18} pageMode showEmpty />

      <section id="embeds" className="cp-embed" aria-label="Embed widgets">
        <div className="cp-embed__inner">
          <header className="cp-embed__head">
            <p className="cp-embed__eyebrow">For Coinpedia</p>
            <h2>Drop-in widgets</h2>
            <p>
              iframe-ready Fear & Greed and arbitrage strips. Framed only for coinpedia.org — copy,
              paste, done.
            </p>
          </header>

          <div className="cp-embed__grid">
            <div className="cp-embed__preview">
              <p className="cp-embed__label">Fear & Greed preview</p>
              <iframe
                src="/embed/fear-greed"
                title="Fear & Greed preview"
                className="cp-embed__frame"
                style={{ height: 220 }}
                loading="lazy"
              />
              <CopyBlock label="Fear & Greed iframe" code={FEAR_IFRAME} />
            </div>
            <div className="cp-embed__preview">
              <p className="cp-embed__label">Arbitrage preview</p>
              <iframe
                src="/embed/arb"
                title="Arbitrage preview"
                className="cp-embed__frame"
                style={{ height: 320 }}
                loading="lazy"
              />
              <CopyBlock label="Arbitrage iframe" code={ARB_IFRAME} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CoinpediaPartnerPage;
