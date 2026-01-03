import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Button, Badge } from 'react-bootstrap';
import { RefreshCw, Zap, Clock } from 'lucide-react';

interface GasPrice {
  chain: string;
  chainId: number;
  symbol: string;
  color: string;
  slow: number;
  standard: number;
  fast: number;
  instant: number;
  unit: string;
  swapCost: number; // USD cost for a typical swap
}

const GasTracker: React.FC = () => {
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGasPrices = async () => {
    setLoading(true);
    try {
      // Fetch Ethereum gas - use CORS proxy
      let ethGas = { slow: 25, standard: 30, fast: 40 };
      try {
        const ethRes = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.etherscan.io/api?module=gastracker&action=gasoracle')}`
        );
        const ethData = await ethRes.json();
        if (ethData.status === '1') {
          ethGas = {
            slow: parseInt(ethData.result.SafeGasPrice),
            standard: parseInt(ethData.result.ProposeGasPrice),
            fast: parseInt(ethData.result.FastGasPrice),
          };
        }
      } catch {
        // Use default values if API fails
      }

      // Set gas prices for multiple chains
      setGasPrices([
        {
          chain: 'Ethereum',
          chainId: 1,
          symbol: 'ETH',
          color: '#627eea',
          slow: ethGas.slow,
          standard: ethGas.standard,
          fast: ethGas.fast,
          instant: ethGas.fast + 10,
          unit: 'gwei',
          swapCost: (ethGas.standard * 150000 * 3500) / 1e9, // ~$X for a swap
        },
        {
          chain: 'BSC',
          chainId: 56,
          symbol: 'BNB',
          color: '#f3ba2f',
          slow: 1,
          standard: 3,
          fast: 5,
          instant: 7,
          unit: 'gwei',
          swapCost: 0.15,
        },
        {
          chain: 'Polygon',
          chainId: 137,
          symbol: 'MATIC',
          color: '#8247e5',
          slow: 30,
          standard: 50,
          fast: 80,
          instant: 120,
          unit: 'gwei',
          swapCost: 0.02,
        },
        {
          chain: 'Arbitrum',
          chainId: 42161,
          symbol: 'ETH',
          color: '#28a0f0',
          slow: 0.01,
          standard: 0.1,
          fast: 0.25,
          instant: 0.5,
          unit: 'gwei',
          swapCost: 0.20,
        },
        {
          chain: 'Optimism',
          chainId: 10,
          symbol: 'ETH',
          color: '#ff0420',
          slow: 0.001,
          standard: 0.01,
          fast: 0.05,
          instant: 0.1,
          unit: 'gwei',
          swapCost: 0.15,
        },
        {
          chain: 'Avalanche',
          chainId: 43114,
          symbol: 'AVAX',
          color: '#e84142',
          slow: 25,
          standard: 27,
          fast: 30,
          instant: 35,
          unit: 'nAVAX',
          swapCost: 0.10,
        },
        {
          chain: 'Solana',
          chainId: 0,
          symbol: 'SOL',
          color: '#14f195',
          slow: 0.000005,
          standard: 0.000005,
          fast: 0.00001,
          instant: 0.00005,
          unit: 'SOL',
          swapCost: 0.001,
        },
        {
          chain: 'Base',
          chainId: 8453,
          symbol: 'ETH',
          color: '#0052ff',
          slow: 0.001,
          standard: 0.005,
          fast: 0.01,
          instant: 0.05,
          unit: 'gwei',
          swapCost: 0.05,
        },
      ]);
    } catch (err) {
      console.error('Failed to fetch gas prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSpeedColor = (type: string) => {
    switch (type) {
      case 'slow': return '#6b7280';
      case 'standard': return '#3b82f6';
      case 'fast': return '#f59e0b';
      case 'instant': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 className="mb-0 fw-bold">⛽ Gas Tracker</h5>
          <small className="text-muted">Multi-chain gas prices</small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={fetchGasPrices} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </Button>
      </Card.Header>
      <Card.Body>
        {loading && gasPrices.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <Row className="g-3">
            {gasPrices.map((gas) => (
              <Col key={gas.chain} xs={6} md={4} lg={3}>
                <div 
                  className="p-3 rounded-3 h-100"
                  style={{ backgroundColor: `${gas.color}15`, border: `1px solid ${gas.color}30` }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div 
                      className="rounded-circle"
                      style={{ width: '10px', height: '10px', backgroundColor: gas.color }}
                    />
                    <span className="fw-semibold">{gas.chain}</span>
                  </div>
                  
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex justify-content-between">
                      <small style={{ color: getSpeedColor('slow') }}>🐢 Slow</small>
                      <small className="fw-semibold">{gas.slow} {gas.unit}</small>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small style={{ color: getSpeedColor('standard') }}>🚗 Std</small>
                      <small className="fw-semibold">{gas.standard} {gas.unit}</small>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small style={{ color: getSpeedColor('fast') }}>🚀 Fast</small>
                      <small className="fw-semibold">{gas.fast} {gas.unit}</small>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-top">
                    <small className="text-muted">Swap cost: </small>
                    <Badge bg={gas.swapCost < 0.5 ? 'success' : gas.swapCost < 2 ? 'warning' : 'danger'}>
                      ${gas.swapCost.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
      <Card.Footer className="bg-transparent border-0 text-center">
        <small className="text-muted">
          💡 Use L2s like Arbitrum, Base, or Polygon for cheap transactions
        </small>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default GasTracker;

