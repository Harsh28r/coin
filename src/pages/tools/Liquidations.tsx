import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CoinsNavbar from '../../Components/navbar';
import Footer from '../../Components/footer';
import { LiquidationHeatmap } from '../../Components/TradingTools';
import { SITE_URL } from '../../utils/jsonLd';
import './tools.css';

const LiquidationsPage: React.FC = () => (
  <>
    <CoinsNavbar />
    <Helmet>
      <title>Crypto Liquidation Levels — BTC ETH Cascade Map | CoinsClarity</title>
      <meta
        name="description"
        content="Estimated crypto liquidation clusters for BTC, ETH and SOL. See where long and short liquidations may cascade."
      />
      <link rel="canonical" href={`${SITE_URL}/tools/liquidations`} />
    </Helmet>
    <div className="tool-shell">
      <div className="tool-container">
        <Link to="/tools" className="tool-back">
          <ArrowLeft size={16} /> All tools
        </Link>
        <header className="tool-head">
          <span className="tool-eyebrow">Derivatives</span>
          <h1 className="tool-title">Crypto Liquidation Levels</h1>
          <p className="tool-tagline">
            Estimated long/short liquidation clusters near spot. Illustrative — not exchange order-book data.
          </p>
        </header>
        <LiquidationHeatmap />
        <section className="tool-prose">
          <h2>Why traders watch liquidation levels</h2>
          <p>
            Cascades happen when forced closes push price into the next cluster of leveraged
            positions. This map is a teaching/estimate view for BTC, ETH and SOL — share screenshots
            with context, not as financial advice.
          </p>
        </section>
        <section className="tool-cross">
          <div className="tool-cross-grid">
            <Link to="/tools/funding" className="tool-cross-card">
              <h4>Funding rates</h4>
              <p>Who is paying whom this period</p>
            </Link>
            <Link to="/alerts" className="tool-cross-card">
              <h4>Price alerts</h4>
              <p>Get notified near your level</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
    <Footer />
  </>
);

export default LiquidationsPage;
