import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Fuel, Shield, IndianRupee } from 'lucide-react';
import './LandingBrandTools.css';

const TOOLS = [
  {
    to: '/tools/p2p',
    title: 'USDT / INR P2P',
    dek: 'Live buy & sell board with UPI filter — know the real rupee rate.',
    Icon: IndianRupee,
  },
  {
    to: '/tools/scam-check',
    title: 'Scam check',
    dek: 'Paste any token contract before you approve — honeypot & tax flags.',
    Icon: Shield,
  },
  {
    to: '/tools/gas',
    title: 'Gas tracker',
    dek: 'ETH + L2 gwei so small transfers don’t eat your edge.',
    Icon: Fuel,
  },
];

/** Three brand tools only — no bento junk */
const LandingBrandTools: React.FC = () => (
  <section className="lbt" aria-labelledby="lbt-heading">
    <div className="lbt-inner">
      <header className="lbt-head">
        <h2 id="lbt-heading" className="lbt-title">
          Tools traders reopen
        </h2>
        <p className="lbt-sub">Three utilities. No signup. Updated live.</p>
      </header>
      <ul className="lbt-list">
        {TOOLS.map(({ to, title, dek, Icon }) => (
          <li key={to}>
            <Link to={to} className="lbt-row">
              <span className="lbt-icon" aria-hidden>
                <Icon size={20} />
              </span>
              <span className="lbt-copy">
                <span className="lbt-name">{title}</span>
                <span className="lbt-dek">{dek}</span>
              </span>
              <ArrowRight size={16} className="lbt-arrow" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="lbt-more">
        <Link to="/tools">All tools</Link>
        {' · '}
        <Link to="/in">India guides</Link>
        {' · '}
        <Link to="/trending-desk">Search trends</Link>
      </p>
    </div>
  </section>
);

export default LandingBrandTools;
