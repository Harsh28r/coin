import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Spinner, Button, ProgressBar } from 'react-bootstrap';
import { RefreshCw, Calendar, AlertTriangle, TrendingDown } from 'lucide-react';

interface TokenUnlock {
  id: string;
  token: string;
  symbol: string;
  unlockDate: Date;
  amount: number;
  amountUsd: number;
  percentOfSupply: number;
  type: 'team' | 'investor' | 'ecosystem' | 'community';
  impact: 'high' | 'medium' | 'low';
}

// Mock token unlock data (in production, use TokenUnlocks.com API or similar)
const generateTokenUnlocks = (): TokenUnlock[] => {
  const now = new Date();
  
  const unlocks: TokenUnlock[] = [
    {
      id: '1',
      token: 'Arbitrum',
      symbol: 'ARB',
      unlockDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      amount: 92160000,
      amountUsd: 110000000,
      percentOfSupply: 2.65,
      type: 'team' as const,
      impact: 'high' as const,
    },
    {
      id: '2',
      token: 'Aptos',
      symbol: 'APT',
      unlockDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      amount: 11310000,
      amountUsd: 95000000,
      percentOfSupply: 2.49,
      type: 'investor' as const,
      impact: 'high' as const,
    },
    {
      id: '3',
      token: 'Optimism',
      symbol: 'OP',
      unlockDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      amount: 31340000,
      amountUsd: 75000000,
      percentOfSupply: 2.32,
      type: 'ecosystem' as const,
      impact: 'medium' as const,
    },
    {
      id: '4',
      token: 'Sui',
      symbol: 'SUI',
      unlockDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      amount: 64190000,
      amountUsd: 230000000,
      percentOfSupply: 2.13,
      type: 'investor' as const,
      impact: 'high' as const,
    },
    {
      id: '5',
      token: 'Worldcoin',
      symbol: 'WLD',
      unlockDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      amount: 37230000,
      amountUsd: 85000000,
      percentOfSupply: 4.54,
      type: 'team' as const,
      impact: 'high' as const,
    },
    {
      id: '6',
      token: 'dYdX',
      symbol: 'DYDX',
      unlockDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      amount: 15000000,
      amountUsd: 28000000,
      percentOfSupply: 1.5,
      type: 'team' as const,
      impact: 'medium' as const,
    },
    {
      id: '7',
      token: 'Immutable X',
      symbol: 'IMX',
      unlockDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      amount: 32470000,
      amountUsd: 55000000,
      percentOfSupply: 1.62,
      type: 'ecosystem' as const,
      impact: 'medium' as const,
    },
    {
      id: '8',
      token: 'Axie Infinity',
      symbol: 'AXS',
      unlockDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      amount: 9250000,
      amountUsd: 65000000,
      percentOfSupply: 3.42,
      type: 'team' as const,
      impact: 'medium' as const,
    },
  ];
  
  return unlocks.sort((a, b) => a.unlockDate.getTime() - b.unlockDate.getTime());
};

const TokenUnlocks: React.FC = () => {
  const [unlocks, setUnlocks] = useState<TokenUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnlocks = () => {
    setLoading(true);
    setTimeout(() => {
      setUnlocks(generateTokenUnlocks());
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchUnlocks();
  }, []);

  const getDaysUntil = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'team': return '👥';
      case 'investor': return '💰';
      case 'ecosystem': return '🌐';
      case 'community': return '👥';
      default: return '📦';
    }
  };

  const formatAmount = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 className="mb-0 fw-bold">🔓 Token Unlocks</h5>
          <small className="text-muted">Upcoming vesting releases</small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={fetchUnlocks} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </Button>
      </Card.Header>
      <Card.Body className="p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <ListGroup variant="flush">
            {unlocks.map((unlock) => {
              const daysUntil = Math.ceil((unlock.unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntil <= 7;
              
              return (
                <ListGroup.Item 
                  key={unlock.id} 
                  className="border-0 border-bottom py-3 px-3"
                  style={{ backgroundColor: isUrgent ? '#fef2f2' : 'transparent' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">{unlock.symbol}</span>
                      <Badge bg={getImpactColor(unlock.impact)} className="rounded-pill">
                        {unlock.impact} impact
                      </Badge>
                      {isUrgent && (
                        <AlertTriangle size={14} color="#dc2626" />
                      )}
                    </div>
                    <div className="text-end">
                      <Badge bg="dark" className="rounded-pill">
                        <Calendar size={12} className="me-1" />
                        {getDaysUntil(unlock.unlockDate)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <span className="text-muted">{getTypeIcon(unlock.type)} {unlock.type}</span>
                    </div>
                    <div className="text-end">
                      <span className="fw-semibold">{formatAmount(unlock.amount)} {unlock.symbol}</span>
                      <br />
                      <small className="text-muted">${formatAmount(unlock.amountUsd)}</small>
                    </div>
                  </div>
                  
                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">% of circulating supply</small>
                      <small className="fw-semibold text-danger">{unlock.percentOfSupply}%</small>
                    </div>
                    <ProgressBar 
                      now={unlock.percentOfSupply * 10} 
                      variant={unlock.percentOfSupply > 3 ? 'danger' : unlock.percentOfSupply > 2 ? 'warning' : 'info'}
                      style={{ height: '6px' }}
                    />
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>
      <Card.Footer className="bg-transparent border-0 text-center">
        <small className="text-muted">
          ⚠️ Large unlocks (&gt;2% supply) often cause temporary price drops
          <br />
          📅 Data estimated from public vesting schedules. Verify before trading.
        </small>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default TokenUnlocks;

