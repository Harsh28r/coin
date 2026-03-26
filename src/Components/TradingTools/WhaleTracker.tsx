import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Spinner, Button } from 'react-bootstrap';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface WhaleTransaction {
  id: string;
  coin: string;
  amount: number;
  amountUsd: number;
  from: string;
  to: string;
  type: 'exchange_deposit' | 'exchange_withdrawal' | 'unknown';
  timestamp: Date;
  txHash: string;
}

const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit', 'Bitfinex'];
const COINS = ['BTC', 'ETH', 'USDT', 'XRP', 'SOL'];

// Simulated whale transactions (in production, use whale-alert.io API or similar)
const generateMockWhaleData = (): WhaleTransaction[] => {
  const transactions: WhaleTransaction[] = [];
  
  for (let i = 0; i < 10; i++) {
    const coin = COINS[Math.floor(Math.random() * COINS.length)];
    const isDeposit = Math.random() > 0.5;
    const exchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
    
    let amount: number;
    let price: number;
    
    switch (coin) {
      case 'BTC': amount = 50 + Math.random() * 500; price = 67000; break;
      case 'ETH': amount = 500 + Math.random() * 5000; price = 3500; break;
      case 'USDT': amount = 1000000 + Math.random() * 50000000; price = 1; break;
      case 'XRP': amount = 1000000 + Math.random() * 50000000; price = 0.5; break;
      case 'SOL': amount = 10000 + Math.random() * 100000; price = 180; break;
      default: amount = 1000; price = 100;
    }

    transactions.push({
      id: `tx-${i}-${Date.now()}`,
      coin,
      amount: Math.floor(amount),
      amountUsd: Math.floor(amount * price),
      from: isDeposit ? 'Unknown Wallet' : exchange,
      to: isDeposit ? exchange : 'Unknown Wallet',
      type: isDeposit ? 'exchange_deposit' : 'exchange_withdrawal',
      timestamp: new Date(Date.now() - Math.random() * 3600000), // Last hour
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
    });
  }

  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const WhaleTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');

  const fetchWhaleData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTransactions(generateMockWhaleData());
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchWhaleData();
    const interval = setInterval(fetchWhaleData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredTx = transactions.filter((tx) => {
    if (filter === 'deposits') return tx.type === 'exchange_deposit';
    if (filter === 'withdrawals') return tx.type === 'exchange_withdrawal';
    return true;
  });

  const formatAmount = (amount: number, coin: string) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${coin}`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K ${coin}`;
    return `${amount.toLocaleString()} ${coin}`;
  };

  const formatUsd = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const timeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Header className="bg-transparent border-0 py-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h5 className="mb-0 fw-bold">🐋 Whale Tracker</h5>
            <small className="text-muted">Large transactions ($1M+)</small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchWhaleData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </Button>
        </div>
        <div className="d-flex gap-1">
          {['all', 'deposits', 'withdrawals'].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'dark' : 'outline-secondary'}
              onClick={() => setFilter(f as any)}
              className="rounded-pill px-3"
            >
              {f === 'all' ? 'All' : f === 'deposits' ? '📥 Deposits' : '📤 Withdrawals'}
            </Button>
          ))}
        </div>
      </Card.Header>
      <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading && transactions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <ListGroup variant="flush">
            {filteredTx.map((tx) => (
              <ListGroup.Item 
                key={tx.id} 
                className="border-0 border-bottom py-3"
                style={{ backgroundColor: tx.type === 'exchange_deposit' ? '#fef2f2' : '#f0fdf4' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-center gap-2">
                    {tx.type === 'exchange_deposit' ? (
                      <div className="rounded-circle p-2" style={{ backgroundColor: '#fee2e2' }}>
                        <ArrowDownRight size={16} color="#dc2626" />
                      </div>
                    ) : (
                      <div className="rounded-circle p-2" style={{ backgroundColor: '#dcfce7' }}>
                        <ArrowUpRight size={16} color="#16a34a" />
                      </div>
                    )}
                    <div>
                      <div className="fw-semibold">
                        {formatAmount(tx.amount, tx.coin)}
                      </div>
                      <small className="text-muted">
                        {tx.from} → {tx.to}
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ color: tx.type === 'exchange_deposit' ? '#dc2626' : '#16a34a' }}>
                      {formatUsd(tx.amountUsd)}
                    </div>
                    <small className="text-muted">{timeAgo(tx.timestamp)}</small>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
      <Card.Footer className="bg-transparent border-0 text-center">
        <small className="text-muted">
          📥 Exchange deposits often signal selling pressure<br/>
          📤 Withdrawals may indicate accumulation
        </small>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default WhaleTracker;

