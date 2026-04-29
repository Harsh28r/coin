// AffiliateButtons.tsx — drop-in CTA bar for coin / compare / blog pages.
// Each link is tracked via the exchange's referral param. Update the IDs in
// AFFILIATE_IDS below with your own once you sign up at each program.
//
//   Binance:  https://www.binance.com/activity/referral
//   Bybit:    https://www.bybit.com/invite
//   OKX:      https://www.okx.com/affiliate
//   KuCoin:   https://www.kucoin.com/r
//   Bitget:   https://www.bitget.com/expressly
//   Coinbase: https://coinbase.com/r/{username}
//
// Until you fill these in, the buttons still render with default landing pages
// — useful for development. Replace ASAP for real revenue.

import React from 'react';
import './AffiliateButtons.css';

const AFFILIATE_IDS: Record<string, string> = {
  binance: 'COINSCLARITY',   // ← replace with your Binance ref ID
  bybit:   'COINSCLARITY',   // ← replace with your Bybit ref ID
  okx:     'COINSCLARITY',   // ← replace with your OKX ref ID
  kucoin:  'COINSCLARITY',   // ← replace with your KuCoin ref ID
  bitget:  'COINSCLARITY',   // ← replace with your Bitget ref ID
  coinbase:'coinsclarity',   // ← replace with your Coinbase username
};

interface ExchangeCfg {
  name: string;
  color: string;
  logo: string; // emoji as quick fallback; swap to <img> when assets are ready
  signupUrl: () => string;
  buyUrl: (symbol: string) => string;
  payout: string;
}

const EX: ExchangeCfg[] = [
  {
    name: 'Binance',
    color: '#f0b90b',
    logo: '🟡',
    signupUrl: () => `https://accounts.binance.com/register?ref=${AFFILIATE_IDS.binance}`,
    buyUrl: (s) => `https://www.binance.com/en/trade/${s.toUpperCase()}_USDT?ref=${AFFILIATE_IDS.binance}`,
    payout: 'Up to 40% commission',
  },
  {
    name: 'Bybit',
    color: '#f7a600',
    logo: '🟠',
    signupUrl: () => `https://www.bybit.com/invite?ref=${AFFILIATE_IDS.bybit}`,
    buyUrl: (s) => `https://www.bybit.com/trade/spot/${s.toUpperCase()}/USDT?affiliate_id=${AFFILIATE_IDS.bybit}`,
    payout: '$30 bonus + commission',
  },
  {
    name: 'OKX',
    color: '#000',
    logo: '⚫',
    signupUrl: () => `https://www.okx.com/join/${AFFILIATE_IDS.okx}`,
    buyUrl: (s) => `https://www.okx.com/trade-spot/${s.toLowerCase()}-usdt?channelId=${AFFILIATE_IDS.okx}`,
    payout: 'Up to $10,000 welcome bonus',
  },
  {
    name: 'KuCoin',
    color: '#24ae8f',
    logo: '🟢',
    signupUrl: () => `https://www.kucoin.com/r/af/${AFFILIATE_IDS.kucoin}`,
    buyUrl: (s) => `https://www.kucoin.com/trade/${s.toUpperCase()}-USDT?rcode=${AFFILIATE_IDS.kucoin}`,
    payout: 'Up to 60% trading fee rebate',
  },
];

interface Props {
  symbol?: string;     // e.g. "BTC", "ETH" — drives "Trade" links
  coinName?: string;   // for accessibility
  variant?: 'compact' | 'full';
}

const AffiliateButtons: React.FC<Props> = ({ symbol, coinName, variant = 'full' }) => {
  const sym = (symbol || 'BTC').toUpperCase();
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <div className="aff-bar aff-bar--compact" role="region" aria-label="Where to buy">
        <span className="aff-bar__label">Trade {coinName || sym}:</span>
        {EX.map(ex => (
          <a
            key={ex.name}
            href={ex.buyUrl(sym)}
            target="_blank"
            rel="noopener sponsored"
            className="aff-pill"
            style={{ borderColor: ex.color }}
            data-aff-exchange={ex.name.toLowerCase()}
          >
            {ex.name}
          </a>
        ))}
        <span className="aff-bar__disclaimer">Affiliate</span>
      </div>
    );
  }

  return (
    <section className="aff-section" aria-label={`Where to buy ${coinName || sym}`}>
      <div className="aff-section__head">
        <h3 className="aff-section__title">
          Where to buy {coinName || sym}
        </h3>
        <span className="aff-section__sub">
          Curated, regulated exchanges. We may earn a commission — pricing is unchanged for you.
        </span>
      </div>

      <div className="aff-grid">
        {EX.map(ex => (
          <a
            key={ex.name}
            href={ex.buyUrl(sym)}
            target="_blank"
            rel="noopener sponsored"
            className="aff-card"
            data-aff-exchange={ex.name.toLowerCase()}
          >
            <div className="aff-card__logo" style={{ background: `${ex.color}1a`, color: ex.color }}>
              {ex.logo}
            </div>
            <div className="aff-card__body">
              <div className="aff-card__name">{ex.name}</div>
              <div className="aff-card__perk">{ex.payout}</div>
            </div>
            <span className="aff-card__cta" style={{ background: ex.color }}>
              Buy {sym}
            </span>
          </a>
        ))}
      </div>

      <p className="aff-disclaimer">
        Disclosure: links above are affiliate links. CoinsClarity may receive a commission when you sign up,
        at no extra cost to you. We only list regulated exchanges and never accept payment for editorial coverage.
      </p>
    </section>
  );
};

export default AffiliateButtons;
