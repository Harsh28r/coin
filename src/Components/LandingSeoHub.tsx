import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Newspaper, BookOpen, FileText } from 'lucide-react';
import './LandingSeoHub.css';

const HUBS = [
  { to: '/price/bitcoin', label: 'Bitcoin price', sub: 'USD + INR live', icon: TrendingUp },
  { to: '/etf/bitcoin-flows', label: 'Bitcoin ETF flows', sub: 'Spot ETF demand', icon: TrendingUp },
  { to: '/in', label: 'Crypto in India', sub: 'USDT, tax, P2P', icon: BookOpen },
  { to: '/today/why-is-bitcoin-up', label: 'Why is Bitcoin up?', sub: 'BTC movers today', icon: TrendingUp },
  { to: '/coin/bitcoin/news', label: 'Bitcoin news hub', sub: 'Live BTC headlines', icon: Newspaper },
  { to: '/tools/crypto-tax-calculator', label: 'India tax calculator', sub: 'Flat 30% estimate', icon: FileText },
  { to: '/tools/profit-calculator', label: 'Profit calculator', sub: 'ROI before you exit', icon: FileText },
  { to: '/tools/p2p', label: 'USDT/INR P2P', sub: 'Live spreads', icon: Newspaper },
];

/** Homepage SEO internal-link hub — ranks cluster entry points */
const LandingSeoHub: React.FC = () => (
  <section className="lsh" aria-label="Market movers and news hubs">
    <div className="lsh-inner">
      <header className="lsh-head">
        <h2 className="lsh-title">Prices, India & tools that rank</h2>
        <p className="lsh-sub">
          High-intent entry points — live prices, ETF flows, India guides, and calculators.
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
