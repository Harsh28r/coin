import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Button, ProgressBar } from 'react-bootstrap';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface LiquidationLevel {
  price: number;
  amount: number; // in millions USD
  type: 'long' | 'short';
  leverage: string;
}

interface CoinLiquidations {
  symbol: string;
  currentPrice: number;
  levels: LiquidationLevel[];
  totalLongs: number;
  totalShorts: number;
}

const LiquidationHeatmap: React.FC = () => {
  const [data, setData] = useState<CoinLiquidations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState('BTC');

  const generateMockData = async (): Promise<CoinLiquidations[]> => {
    // Fetch current prices using CORS proxy
    try {
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd')}`
      );
      const prices = await res.json();
      
      return [
        {
          symbol: 'BTC',
          currentPrice: prices.bitcoin?.usd || 67000,
          totalLongs: 2450,
          totalShorts: 1820,
          levels: generateLevels(prices.bitcoin?.usd || 67000, 'BTC'),
        },
        {
          symbol: 'ETH',
          currentPrice: prices.ethereum?.usd || 3500,
          totalLongs: 890,
          totalShorts: 720,
          levels: generateLevels(prices.ethereum?.usd || 3500, 'ETH'),
        },
        {
          symbol: 'SOL',
          currentPrice: prices.solana?.usd || 180,
          totalLongs: 340,
          totalShorts: 290,
          levels: generateLevels(prices.solana?.usd || 180, 'SOL'),
        },
      ];
    } catch {
      return [];
    }
  };

  const generateLevels = (currentPrice: number, symbol: string): LiquidationLevel[] => {
    const levels: LiquidationLevel[] = [];
    const baseAmount = symbol === 'BTC' ? 100 : symbol === 'ETH' ? 50 : 20;
    
    // Long liquidations (below current price)
    for (let i = 1; i <= 8; i++) {
      const priceDrop = currentPrice * (1 - i * 0.02); // 2% intervals
      levels.push({
        price: priceDrop,
        amount: baseAmount * (1 + Math.random() * 3) * (9 - i) / 3,
        type: 'long',
        leverage: i <= 3 ? '50-100x' : i <= 5 ? '25-50x' : '10-25x',
      });
    }
    
    // Short liquidations (above current price)
    for (let i = 1; i <= 8; i++) {
      const priceRise = currentPrice * (1 + i * 0.02); // 2% intervals
      levels.push({
        price: priceRise,
        amount: baseAmount * (1 + Math.random() * 2) * (9 - i) / 3,
        type: 'short',
        leverage: i <= 3 ? '50-100x' : i <= 5 ? '25-50x' : '10-25x',
      });
    }
    
    return levels.sort((a, b) => a.price - b.price);
  };

  const fetchData = async () => {
    setLoading(true);
    const mockData = await generateMockData();
    setData(mockData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedData = data.find(d => d.symbol === selectedCoin);
  
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return `$${price.toFixed(2)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}B`;
    return `$${amount.toFixed(0)}M`;
  };

  const getIntensityColor = (amount: number, type: 'long' | 'short', maxAmount: number) => {
    const intensity = Math.min(amount / maxAmount, 1);
    if (type === 'long') {
      // Red shades for longs (liquidated when price drops)
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`;
    } else {
      // Green shades for shorts (liquidated when price rises)
      return `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`;
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-transparent border-0 py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-bold">
              <AlertTriangle size={20} className="me-2" />
              Liquidation Heatmap
            </h5>
            <small className="text-muted">Where positions get liquidated</small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </Button>
        </div>

        {/* Coin Selector */}
        <div className="d-flex gap-2">
          {data.map((coin) => (
            <Button
              key={coin.symbol}
              size="sm"
              variant={selectedCoin === coin.symbol ? 'dark' : 'outline-secondary'}
              onClick={() => setSelectedCoin(coin.symbol)}
              className="rounded-pill px-3"
            >
              {coin.symbol}
            </Button>
          ))}
        </div>
      </Card.Header>

      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : selectedData ? (
          <>
            {/* Summary */}
            <Row className="g-3 mb-4">
              <Col xs={6}>
                <div className="p-3 rounded-3" style={{ backgroundColor: '#fef2f2' }}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <TrendingDown size={16} color="#ef4444" />
                    <small className="text-muted">Long Liquidations</small>
                  </div>
                  <h4 className="mb-0 text-danger">{formatAmount(selectedData.totalLongs)}</h4>
                  <small className="text-muted">If price drops</small>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-3 rounded-3" style={{ backgroundColor: '#f0fdf4' }}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <TrendingUp size={16} color="#22c55e" />
                    <small className="text-muted">Short Liquidations</small>
                  </div>
                  <h4 className="mb-0 text-success">{formatAmount(selectedData.totalShorts)}</h4>
                  <small className="text-muted">If price rises</small>
                </div>
              </Col>
            </Row>

            {/* Current Price Indicator */}
            <div className="text-center mb-4 p-3 rounded-3" style={{ backgroundColor: '#f8fafc' }}>
              <small className="text-muted">Current Price</small>
              <h3 className="mb-0">{formatPrice(selectedData.currentPrice)}</h3>
            </div>

            {/* Liquidation Levels */}
            <div className="liquidation-levels">
              {(() => {
                const maxAmount = Math.max(...selectedData.levels.map(l => l.amount));
                const longLevels = selectedData.levels.filter(l => l.type === 'long').reverse();
                const shortLevels = selectedData.levels.filter(l => l.type === 'short');
                
                return (
                  <>
                    {/* Short liquidations (above) */}
                    <div className="mb-2">
                      <small className="text-success fw-bold">↑ Short Liquidations (price rises)</small>
                    </div>
                    {shortLevels.slice(0, 5).reverse().map((level, idx) => (
                      <div 
                        key={`short-${idx}`}
                        className="d-flex align-items-center gap-2 mb-2 p-2 rounded"
                        style={{ backgroundColor: getIntensityColor(level.amount, 'short', maxAmount) }}
                      >
                        <span className="fw-semibold" style={{ minWidth: '80px' }}>
                          {formatPrice(level.price)}
                        </span>
                        <ProgressBar 
                          now={(level.amount / maxAmount) * 100}
                          variant="success"
                          style={{ flex: 1, height: '20px' }}
                        />
                        <span className="fw-bold text-success" style={{ minWidth: '70px', textAlign: 'right' }}>
                          {formatAmount(level.amount)}
                        </span>
                        <Badge bg="light" text="dark" className="rounded-pill">{level.leverage}</Badge>
                      </div>
                    ))}
                    
                    {/* Current Price Line */}
                    <div className="my-3 p-2 rounded-3 text-center" style={{ backgroundColor: '#fbbf24', color: 'white' }}>
                      <strong>⟷ Current: {formatPrice(selectedData.currentPrice)}</strong>
                    </div>
                    
                    {/* Long liquidations (below) */}
                    <div className="mb-2">
                      <small className="text-danger fw-bold">↓ Long Liquidations (price drops)</small>
                    </div>
                    {longLevels.slice(0, 5).map((level, idx) => (
                      <div 
                        key={`long-${idx}`}
                        className="d-flex align-items-center gap-2 mb-2 p-2 rounded"
                        style={{ backgroundColor: getIntensityColor(level.amount, 'long', maxAmount) }}
                      >
                        <span className="fw-semibold" style={{ minWidth: '80px' }}>
                          {formatPrice(level.price)}
                        </span>
                        <ProgressBar 
                          now={(level.amount / maxAmount) * 100}
                          variant="danger"
                          style={{ flex: 1, height: '20px' }}
                        />
                        <span className="fw-bold text-danger" style={{ minWidth: '70px', textAlign: 'right' }}>
                          {formatAmount(level.amount)}
                        </span>
                        <Badge bg="light" text="dark" className="rounded-pill">{level.leverage}</Badge>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </>
        ) : null}
      </Card.Body>

      <Card.Footer className="bg-transparent border-0">
        <small className="text-muted">
          💡 Large liquidation clusters often act as magnets - price tends to move toward them. 
          <br/>
          ⚠️ Data is simulated. Use Coinglass or similar for real liquidation data.
        </small>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default LiquidationHeatmap;

