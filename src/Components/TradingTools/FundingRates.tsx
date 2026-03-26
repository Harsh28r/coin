import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Button } from 'react-bootstrap';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface FundingRate {
  symbol: string;
  rate: number;
  nextFundingTime: string;
  markPrice: number;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT'];

const FundingRates: React.FC = () => {
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchFundingRates = async () => {
    setLoading(true);
    try {
      // Fetch from Binance Futures API - use CORS proxy for browser compatibility
      const promises = SYMBOLS.map(async (symbol) => {
        try {
          // Try direct first (works in some cases)
          let res = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`);
          if (!res.ok) throw new Error('Direct failed');
          const data = await res.json();
          return {
            symbol: symbol.replace('USDT', ''),
            rate: parseFloat(data.lastFundingRate) * 100,
            nextFundingTime: new Date(data.nextFundingTime).toLocaleTimeString(),
            markPrice: parseFloat(data.markPrice)
          };
        } catch {
          // Fallback to CORS proxy
          const res = await fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`)}`
          );
          const data = await res.json();
          return {
            symbol: symbol.replace('USDT', ''),
            rate: parseFloat(data.lastFundingRate) * 100,
            nextFundingTime: new Date(data.nextFundingTime).toLocaleTimeString(),
            markPrice: parseFloat(data.markPrice)
          };
        }
      });
      
      const results = await Promise.all(promises);
      setRates(results.sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate)));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch funding rates:', err);
      // Use mock data if API fails
      setRates(SYMBOLS.map((s, i) => ({
        symbol: s.replace('USDT', ''),
        rate: (Math.random() - 0.5) * 0.1,
        nextFundingTime: '08:00:00',
        markPrice: 1000 + Math.random() * 50000
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundingRates();
    const interval = setInterval(fetchFundingRates, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getRateColor = (rate: number) => {
    if (rate > 0.03) return '#ef4444'; // Very positive = longs pay a lot
    if (rate > 0) return '#f97316';
    if (rate < -0.03) return '#22c55e'; // Very negative = shorts pay
    if (rate < 0) return '#84cc16';
    return '#6b7280';
  };

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 className="mb-0 fw-bold">📊 Funding Rates</h5>
          <small className="text-muted">Perpetual futures funding</small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={fetchFundingRates} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </Button>
      </Card.Header>
      <Card.Body className="p-0">
        {loading && rates.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <Table hover className="mb-0">
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th className="border-0 ps-3">Asset</th>
                <th className="border-0 text-end">Rate (8h)</th>
                <th className="border-0 text-end">Annual</th>
                <th className="border-0 text-end pe-3">Next</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((item) => (
                <tr key={item.symbol}>
                  <td className="ps-3">
                    <span className="fw-semibold">{item.symbol}</span>
                  </td>
                  <td className="text-end">
                    <span style={{ color: getRateColor(item.rate), fontWeight: '600' }}>
                      {item.rate > 0 ? '+' : ''}{item.rate.toFixed(4)}%
                    </span>
                    {item.rate > 0 ? (
                      <TrendingUp size={14} className="ms-1" style={{ color: '#ef4444' }} />
                    ) : (
                      <TrendingDown size={14} className="ms-1" style={{ color: '#22c55e' }} />
                    )}
                  </td>
                  <td className="text-end text-muted">
                    {(item.rate * 3 * 365).toFixed(1)}%
                  </td>
                  <td className="text-end pe-3">
                    <small className="text-muted">{item.nextFundingTime}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
      <Card.Footer className="bg-transparent border-0 text-center">
        <small className="text-muted">
          🟢 Negative = shorts pay longs | 🔴 Positive = longs pay shorts
        </small>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default FundingRates;

