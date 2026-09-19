import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Newspaper, BookOpen, FileText } from 'lucide-react';
import './LandingSeoHub.css';

const HUBS = [
  { to: '/in', label: 'Crypto in India', sub: 'USDT, tax, scams', icon: BookOpen },
  { to: '/tools/p2p', label: 'USDT/INR P2P', sub: 'Live spreads', icon: Newspaper },
  { to: '/price/bitcoin', label: 'Bitcoin price', sub: 'USD + INR', icon: TrendingUp },
  { to: '/etf/bitcoin-flows', label: 'BTC ETF flows', sub: 'Spot demand', icon: TrendingUp },
  { to: '/tools/scam-check', label: 'Scam checker', sub: 'Before you ape', icon: FileText },
  { to: '/in/buy-usdt', label: 'How to buy USDT', sub: 'UPI & P2P guide', icon: BookOpen },
  { to: '/tools/crypto-tax-calculator', label: 'India tax calc', sub: 'Flat 30% estimate', icon: FileText },
  { to: '/today/why-is-bitcoin-up', label: 'Why is BTC up?', sub: 'Catalysts today', icon: TrendingUp },
];

/** Homepage SEO internal-link hub — ranks cluster entry points */
const LandingSeoHub: React.FC = () => (
  <section className="lsh" aria-label="Market movers and news hubs">
    <div className="lsh-inner">
      <header className="lsh-head">
        <h2 className="lsh-title">Start here</h2>
        <p className="lsh-sub">
          India desk, live rates, and the pages that match how people search.
        </p>
      </header>
      <ul className="lsh-grid">
        {HUBS.map((h) => {
          const Icon = h.icon;
          return (
            <li key={h.to}>
              <Link to={h.to} className="lsh-card">
                <Icon size={16} className="lsh-icon" aria-hidden />
                <span className="lsh-label">{h.label}</span>
                <span className="lsh-meta">{h.sub}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);

export default LandingSeoHub;
