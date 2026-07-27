import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Newspaper, Calendar, BookOpen } from 'lucide-react';
import './LandingSeoHub.css';

const HUBS = [
  { to: '/today/why-is-bitcoin-up', label: 'Why is Bitcoin up?', sub: 'BTC movers today', icon: TrendingUp },
  { to: '/today/why-is-ethereum-up', label: 'Why is Ethereum up?', sub: 'ETH catalysts', icon: TrendingUp },
  { to: '/coin/bitcoin/news', label: 'Bitcoin news hub', sub: 'Live BTC headlines', icon: Newspaper },
  { to: '/coin/ethereum/news', label: 'Ethereum news hub', sub: 'Live ETH headlines', icon: Newspaper },
  { to: '/coin/solana/news', label: 'Solana news hub', sub: 'SOL coverage', icon: Newspaper },
  { to: '/events/etf', label: 'ETF events', sub: 'SEC & spot ETF', icon: Calendar },
  { to: '/daily-digest', label: 'Daily digest', sub: 'Noon IST brief', icon: BookOpen },
  { to: '/trending-desk', label: 'Trending desk', sub: 'What moved markets', icon: BookOpen },
];

/** Homepage SEO internal-link hub — ranks cluster entry points */
const LandingSeoHub: React.FC = () => (
  <section className="lsh" aria-label="Market movers and news hubs">
    <div className="lsh-inner">
      <header className="lsh-head">
        <h2 className="lsh-title">Market movers & news hubs</h2>
        <p className="lsh-sub">
          Jump into the pages Google ranks for — why coins move, live news hubs, and desk briefs.
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
