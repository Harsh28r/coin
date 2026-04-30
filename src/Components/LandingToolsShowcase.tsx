import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './LandingToolsShowcase.css';

type Tool = {
  to: string;
  title: string;
  dek: string;
  emoji: string;
  /** lg grid span */
  wide?: boolean;
  cta?: boolean;
};

const TOOLS: Tool[] = [
  {
    to: '/tools/fear-greed',
    title: 'Fear & Greed Index',
    dek: 'Live sentiment gauge plus 30-day history — know when the crowd is wrong.',
    emoji: '📈',
    wide: true,
  },
  {
    to: '/tools/gas',
    title: 'Gas tracker',
    dek: 'ETH, L2s, BNB — live gwei so you never overpay a swap.',
    emoji: '⛽',
    wide: true,
  },
  {
    to: '/tools/scam-check',
    title: 'Scam & honeypot check',
    dek: 'Paste a contract — quick security read before you ape.',
    emoji: '🛡️',
    wide: true,
  },
  {
    to: '/tools/unlocks',
    title: 'Token unlock calendar',
    dek: 'Upcoming cliffs across 200+ projects.',
    emoji: '🗓️',
  },
  {
    to: '/compare',
    title: 'Compare coins',
    dek: 'Side-by-side fundamentals for any two assets.',
    emoji: '⚖️',
  },
  {
    to: '/arbitrage-scanner',
    title: 'Arbitrage scanner',
    dek: 'Cross-exchange spreads — spot inefficiencies fast.',
    emoji: '⚡',
  },
  {
    to: '/tools',
    title: 'Full trading suite',
    dek: 'Calculators, signals, DeFi widgets — all free, no signup.',
    emoji: '🧮',
    cta: true,
  },
];

const LandingToolsShowcase: React.FC = () => (
  <section className="lts" aria-labelledby="lts-heading">
    <div className="lts__bg" aria-hidden />
    <div className="lts__noise" aria-hidden />
    <div className="lts__inner">
      <header className="lts__head">
        <span className="lts__eyebrow">Free tools</span>
        <h2 id="lts-heading" className="lts__title">
          Everything you need besides the headline
        </h2>
        <p className="lts__sub">
          Same data rigor as our news — built for traders and researchers. Tap any card; no account
          required.
        </p>
      </header>

      <div className="lts__grid">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={[
              'lts__card',
              t.wide ? 'lts__card--wide' : 'lts__card--std',
              t.cta ? 'lts__card--cta' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="lts__icon" aria-hidden>
              {t.emoji}
            </span>
            <h3 className="lts__cardTitle">{t.title}</h3>
            <p className="lts__cardDek">{t.dek}</p>
            <span className="lts__arrow">
              Open <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default LandingToolsShowcase;
