import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './BrandHero.css';

/** First-viewport brand composition — not a news dashboard */
const BrandHero: React.FC = () => (
  <section className="bh" aria-label="CoinsClarity">
    <div className="bh-bg" aria-hidden />
    <div className="bh-inner">
      <p className="bh-brand">CoinsClarity</p>
      <h1 className="bh-headline">
        INR rates. Scam checks.
        <br />
        Clear markets.
      </h1>
      <p className="bh-support">
        Live USDT/INR P2P, contract security, and gas — built for Indian traders who want signal, not noise.
      </p>
      <div className="bh-ctas">
        <Link to="/tools/p2p" className="bh-cta bh-cta--primary">
          USDT / INR board <ArrowRight size={16} />
        </Link>
        <Link to="/in" className="bh-cta bh-cta--ghost">
          India desk
        </Link>
      </div>
    </div>
  </section>
);

export default BrandHero;
