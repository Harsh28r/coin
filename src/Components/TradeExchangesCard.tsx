import React from 'react';
import { Card } from 'react-bootstrap';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { tradeLinks, exchangeLogos } from '../utils/tradeLinks';

const EXCHANGE_KEYS = ['airdropalert', 'okx', 'hyperliquid', 'binance', 'coindcx', 'coinbase'] as const;

const TradeExchangesCard: React.FC = () => {
  return (
    <Card className="trade-exchanges-card border-0 shadow-sm overflow-hidden" style={{ background: 'var(--card-bg)', color: 'var(--text)' }}>
      <Card.Body className="p-4 p-md-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <TrendingUp size={20} style={{ color: 'var(--cc-orange)' }} />
          <h3 className="h5 mb-0 fw-bold" style={{ color: 'var(--text)' }}>Trade your crypto</h3>
        </div>
        <p className="small mb-3" style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
          Support us by using our referral link on these exchanges. Claim their sign-up bonus and trade your airdropped coins and other cryptocurrencies.
        </p>
        <a
          href="/#trade"
          className="small text-decoration-none d-inline-flex align-items-center gap-1 mb-3"
          style={{ color: 'var(--cc-orange)', fontWeight: 600 }}
        >
          Learn about exchanges <ExternalLink size={12} />
        </a>

        <div className="trade-exchanges-logos d-flex flex-wrap gap-2 g-2">
          {EXCHANGE_KEYS.map((key) => {
            const link = tradeLinks[key];
            const logoUrl = exchangeLogos[key];
            if (!link) return null;
            return (
              <a
                key={key}
                href={link.signup}
                target="_blank"
                rel="noopener noreferrer"
                className="trade-exchange-logo-card text-decoration-none d-flex align-items-center gap-2 rounded-2 p-2 px-3"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border, #e2e8f0)',
                  color: 'var(--text)',
                }}
              >
                <span className="trade-exchange-logo-wrap rounded-1 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: 'var(--card-bg)', overflow: 'hidden' }}>
                  {logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt=""
                        width={24}
                        height={24}
                        style={{ objectFit: 'contain' }}
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.style.display = 'none';
                          const fallback = t.parentElement?.querySelector('.trade-exchange-initial') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <span className="trade-exchange-initial small fw-bold" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>{link.label.charAt(0)}</span>
                    </>
                  ) : (
                    <span className="trade-exchange-initial small fw-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>{link.label.charAt(0)}</span>
                  )}
                </span>
                <span className="small fw-semibold">{link.label}</span>
              </a>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default TradeExchangesCard;
