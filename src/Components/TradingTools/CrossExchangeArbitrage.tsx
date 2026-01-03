import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Button, Alert } from 'react-bootstrap';
import { RefreshCw, ArrowRight, DollarSign } from 'lucide-react';

interface ExchangePrice {
  exchange: string;
  price: number;
  volume24h?: number;
}

interface ArbitrageOpportunity {
  symbol: string;
  prices: ExchangePrice[];
  spread: number;
  buyExchange: string;
  sellExchange: string;
  profitPercent: number;
}

const COINS = ['bitcoin', 'ethereum', 'solana', 'ripple', 'cardano', 'dogecoin'];

const CrossExchangeArbitrage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // Use CORS proxy to fetch from CoinGecko
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=usd&include_24hr_vol=true`)}`
      );
      const data = await res.json();

      // Simulate exchange price variations (in reality, you'd fetch from each exchange API)
      const results: ArbitrageOpportunity[] = COINS.map((coin) => {
        const basePrice = data[coin]?.usd || 0;
        
        // Simulate slight price differences across exchanges
        const exchanges: ExchangePrice[] = [
          { exchange: 'Binance', price: basePrice * (1 + (Math.random() - 0.5) * 0.004) },
          { exchange: 'Coinbase', price: basePrice * (1 + (Math.random() - 0.5) * 0.006) },
          { exchange: 'Kraken', price: basePrice * (1 + (Math.random() - 0.5) * 0.005) },
          { exchange: 'KuCoin', price: basePrice * (1 + (Math.random() - 0.5) * 0.008) },
        ];

        const sorted = [...exchanges].sort((a, b) => a.price - b.price);
        const lowest = sorted[0];
        const highest = sorted[sorted.length - 1];
        const spread = highest.price - lowest.price;
        const profitPercent = (spread / lowest.price) * 100;

        return {
          symbol: coin.toUpperCase(),
          prices: exchanges,
          spread,
          buyExchange: lowest.exchange,
          sellExchange: highest.exchange,
          profitPercent,
        };
      });

      setOpportunities(results.sort((a, b) => b.profitPercent - a.profitPercent));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 className="mb-0 fw-bold">🔄 Cross-Exchange Arbitrage</h5>
          <small className="text-muted">Price differences across exchanges</small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={fetchPrices} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </Button>
      </Card.Header>
      <Card.Body className="p-0">
        {loading && opportunities.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <Table hover className="mb-0">
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th className="border-0 ps-3">Pair</th>
                <th className="border-0">Route</th>
                <th className="border-0 text-end">Spread</th>
                <th className="border-0 text-end pe-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.symbol}>
                  <td className="ps-3">
                    <span className="fw-semibold">{opp.symbol}</span>
                    <span className="text-muted">/USD</span>
                  </td>
                  <td>
                    <Badge bg="success" className="me-1">{opp.buyExchange}</Badge>
                    <ArrowRight size={12} className="mx-1 text-muted" />
                    <Badge bg="danger">{opp.sellExchange}</Badge>
                  </td>
                  <td className="text-end">
                    <span className="text-muted">${opp.spread.toFixed(2)}</span>
                  </td>
                  <td className="text-end pe-3">
                    <span 
                      className="fw-bold"
                      style={{ color: opp.profitPercent > 0.3 ? '#22c55e' : opp.profitPercent > 0.1 ? '#f59e0b' : '#6b7280' }}
                    >
                      +{opp.profitPercent.toFixed(3)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
      <Card.Footer className="bg-transparent border-0">
        <Alert variant="info" className="mb-0 py-2 small">
          💡 Real arbitrage requires accounting for fees (~0.1-0.2% per trade) and withdrawal times
        </Alert>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default CrossExchangeArbitrage;

