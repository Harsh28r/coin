import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Megaphone, Layout, Newspaper, Sparkles } from 'lucide-react';
import Navbar from './navbar';
import Footer from './footer';
import './advertise.css';

const Advertise: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Advertise with CoinsClarity | Crypto Media Partnerships</title>
        <meta
          name="description"
          content="Reach high-intent crypto readers on CoinsClarity. Sponsored content, display, newsletter, and homepage placements. Contact advertise@coinsclarity.com."
        />
        <link rel="canonical" href={`${window.location.origin}/advertise`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Advertise with CoinsClarity" />
        <meta
          property="og:description"
          content="Partner with CoinsClarity — editorial crypto media for traders and builders."
        />
        <meta property="og:url" content={`${window.location.origin}/advertise`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <main className="cc-ad">
        <section className="cc-ad__hero">
          <div className="cc-ad__hero-bg" aria-hidden />
          <div className="cc-ad__hero-grid" aria-hidden />
          <div className="cc-ad__hero-inner">
            <h1 className="cc-ad__brand">
              Coins<span>Clarity</span>
            </h1>
            <p className="cc-ad__headline">Put your brand where crypto readers already decide.</p>
            <p className="cc-ad__sub">
              Sponsored stories, display, newsletter, and homepage placements across a high-intent editorial audience.
            </p>
            <div className="cc-ad__cta-row">
              <a
                className="cc-ad__btn cc-ad__btn--primary"
                href="mailto:advertise@coinsclarity.com?subject=Advertising%20Enquiry"
              >
                <Megaphone size={18} />
                Talk advertising
              </a>
              <a className="cc-ad__btn cc-ad__btn--ghost" href="mailto:hello@coinsclarity.com">
                <Mail size={18} />
                General inquiry
              </a>
            </div>
          </div>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">Audience</span>
          <h2 className="cc-ad__h2">Built for crypto attention</h2>
          <p className="cc-ad__lead">
            Traders, researchers, and builders who come for news, listings, and market tools — not scroll filler.
          </p>
          <div className="cc-ad__stats">
            <div className="cc-ad__stat">
              <strong>50k+</strong>
              <span>Monthly readers target growth</span>
            </div>
            <div className="cc-ad__stat">
              <strong>Daily</strong>
              <span>Editorial desk + market coverage</span>
            </div>
            <div className="cc-ad__stat">
              <strong>Global</strong>
              <span>EN audience + India daily desk</span>
            </div>
            <div className="cc-ad__stat">
              <strong>Intent</strong>
              <span>News, tools, predictions, listings</span>
            </div>
          </div>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">Formats</span>
          <h2 className="cc-ad__h2">Where your campaign can live</h2>
          <p className="cc-ad__lead">
            Pick one placement or a full flight. We’ll match format to your goal — awareness, launches, or conversions.
          </p>
          <div className="cc-ad__formats">
            <article className="cc-ad__format">
              <div className="cc-ad__format-icon">
                <Newspaper size={20} />
              </div>
              <h3>Sponsored editorial</h3>
              <p>Native stories that read like our desk — clear disclosure, sharp packaging, lasting SEO value.</p>
            </article>
            <article className="cc-ad__format">
              <div className="cc-ad__format-icon">
                <Layout size={20} />
              </div>
              <h3>Display & homepage</h3>
              <p>Leaderboard and in-feed units on high-traffic surfaces: home, news, coin pages, tools.</p>
            </article>
            <article className="cc-ad__format">
              <div className="cc-ad__format-icon">
                <Sparkles size={20} />
              </div>
              <h3>Newsletter & social</h3>
              <p>The Edge daily brief plus Telegram / X amplification for launches and time-bound campaigns.</p>
            </article>
          </div>
        </section>

        <section className="cc-ad__section">
          <span className="cc-ad__kicker">Process</span>
          <h2 className="cc-ad__h2">Simple from brief to live</h2>
          <p className="cc-ad__lead">No agency theater. Fast answers, clear rates, clean creative.</p>
          <div className="cc-ad__steps">
            <div className="cc-ad__step">
              <h3>Tell us the goal</h3>
              <p>Launch, brand, listings, or product — include budget range and timeline.</p>
            </div>
            <div className="cc-ad__step">
              <h3>We propose a flight</h3>
              <p>Formats, dates, and creative specs tailored to your audience and KPI.</p>
            </div>
            <div className="cc-ad__step">
              <h3>Ship & report</h3>
              <p>We go live, monitor delivery, and send a clean wrap with what moved.</p>
            </div>
          </div>
        </section>

        <section className="cc-ad__close">
          <h2>Ready when you are</h2>
          <p>
            Send a short brief — product, markets, dates, budget. We’ll reply with options that fit CoinsClarity’s
            audience.
          </p>
          <div className="cc-ad__cta-row">
            <a
              className="cc-ad__btn cc-ad__btn--primary"
              href="mailto:advertise@coinsclarity.com?subject=Let’s%20Work%20Together"
            >
              <Mail size={18} />
              advertise@coinsclarity.com
            </a>
            <a className="cc-ad__btn cc-ad__btn--ghost" href="/contact">
              Contact page
            </a>
          </div>
          <div className="cc-ad__mails">
            <a href="mailto:hello@coinsclarity.com">hello@coinsclarity.com</a>
            <a href="mailto:support@coinsclarity.com">support@coinsclarity.com</a>
            <a href="mailto:advertise@coinsclarity.com">advertise@coinsclarity.com</a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Advertise;
