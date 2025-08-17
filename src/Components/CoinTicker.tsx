import React, { useEffect, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface CryptoPrice {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  sparkline_in_7d?: { price: number[] };
}

interface CoinTickerProps {
  fixed?: boolean;
  top?: number | string;
  height?: number | string;
  perPage?: number;
}

const CoinTicker: React.FC<CoinTickerProps> = ({ fixed = true, top = 60, height = 44, perPage = 5 }) => {
  const { currency, formatPrice } = useCurrency();
  const [coins, setCoins] = useState<CryptoPrice[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  // Helpers
  const generateSparkline = (base: number, points: number = 30): number[] => {
    const prices: number[] = [];
    let current = base;
    for (let i = 0; i < points; i++) {
      const noise = current * (Math.random() * 0.006 - 0.003);
      current = Math.max(0, current + noise);
      prices.push(+current.toFixed(8));
    }
    return prices;
  };

  const withAppendedPrice = (prev: CryptoPrice | undefined, priceNow: number): number[] => {
    const prevLine = prev?.sparkline_in_7d?.price;
    const next = prevLine && prevLine.length ? [...prevLine] : generateSparkline(priceNow, 29);
    next.push(priceNow);
    return next.slice(-30);
  };

  const nudgePrices = (prev: CryptoPrice[]): CryptoPrice[] =>
    prev.map((c) => {
      const pct = (Math.random() * 1.0 - 0.5) / 100; // ±0.5%
      const nextPrice = Math.max(0, c.current_price * (1 + pct));
      const lastPrice = c.current_price;
      const changePct = lastPrice === 0 ? 0 : ((nextPrice - lastPrice) / lastPrice) * 100;
      return {
        ...c,
        current_price: +nextPrice.toFixed(8),
        price_change_percentage_24h: +changePct.toFixed(4),
        sparkline_in_7d: { price: withAppendedPrice(c, +nextPrice.toFixed(8)) },
      };
    });

  // Fetch from CoinGecko
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const vs = currency.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${encodeURIComponent(vs)}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch coin prices');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid response');

        setCoins((prev) => {
          const prevById = new Map(prev.map((p) => [p.id, p] as const));
          return data.map((coin: any) => {
            const previous = prevById.get(coin.id);
            const appendedLine = withAppendedPrice(previous, coin.current_price);
            const incomingLine = coin?.sparkline_in_7d?.price;
            return {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              current_price: coin.current_price,
              price_change_percentage_24h: coin.price_change_percentage_24h ?? 0,
              image: coin.image,
              sparkline_in_7d: { price: Array.isArray(incomingLine) && incomingLine.length ? incomingLine.slice(-29).concat([coin.current_price]) : appendedLine },
            } as CryptoPrice;
          });
        });
        setIsFallback(false);
      } catch (e) {
        // Fallback: nudge existing or initialize static 5
        setCoins((prev) => {
          if (prev && prev.length) return nudgePrices(prev);
          const base = [
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', price: 45000, img: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'eth', price: 3200, img: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
            { id: 'binancecoin', name: 'BNB', symbol: 'bnb', price: 320, img: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
            { id: 'cardano', name: 'Cardano', symbol: 'ada', price: 0.48, img: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
            { id: 'solana', name: 'Solana', symbol: 'sol', price: 150, img: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
          ];
          return base.slice(0, perPage).map((b) => ({
            id: b.id,
            name: b.name,
            symbol: b.symbol,
            current_price: b.price,
            price_change_percentage_24h: 0,
            image: b.img,
            sparkline_in_7d: { price: generateSparkline(b.price) },
          }));
        });
        setIsFallback(true);
      }
    };

    fetchCoins();
    const id = setInterval(fetchCoins, 30000);
    return () => clearInterval(id);
  }, [currency, perPage]);

  // While in fallback, nudge every 5s
  useEffect(() => {
    if (!isFallback) return;
    const id = setInterval(() => setCoins((prev) => (prev && prev.length ? nudgePrices(prev) : prev)), 5000);
    return () => clearInterval(id);
  }, [isFallback]);

  const formatCrypto = (value: number) => formatPrice(value, currency);

  if (coins.length === 0) return null;

  return (
    <>
      <div
        className="crypto-ticker-wrapper"
        style={{
          position: fixed ? 'fixed' as const : 'relative' as const,
          top: fixed ? (typeof top === 'number' ? `${top}px` : top) : undefined,
          left: 0,
          right: 0,
          zIndex: 1100,
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          overflow: 'hidden',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <div className="crypto-ticker" style={{ whiteSpace: 'nowrap', position: 'relative' }}>
          <div
            className="ticker-track"
            style={{
              display: 'inline-flex',
              gap: '24px',
              alignItems: 'center',
              padding: '10px 0',
              animation: 'ticker-scroll 30s linear infinite'
            }}
          >
            {[...coins, ...coins].map((coin, idx) => (
              <div
                key={`${coin.id}-${idx}`}
                className="ticker-item"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: 'rgba(246, 247, 251, 0.6)'
                }}
                title={coin.name}
              >
                <img
                  src={coin.image || '/image.png'}
                  alt={coin.name}
                  loading="lazy"
                  style={{ width: 18, height: 18, borderRadius: 4 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/image.png'; }}
                />
                <span style={{ fontWeight: 700, fontSize: 12, color: '#111827' }}>
                  {coin.symbol.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>
                  {formatCrypto(coin.current_price)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: coin.price_change_percentage_24h >= 0 ? '#059669' : '#dc2626'
                  }}
                >
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {fixed && <div style={{ height: typeof height === 'number' ? `${height}px` : height }} />}

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .crypto-ticker:hover .ticker-track { animation-play-state: paused; }
      `}</style>
    </>
  );
};

export default CoinTicker;


