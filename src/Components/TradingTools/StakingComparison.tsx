import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Button, Form } from 'react-bootstrap';
import { RefreshCw, Percent, Lock, Shield, AlertTriangle } from 'lucide-react';

interface StakingOption {
  id: string;
  asset: string;
  symbol: string;
  protocol: string;
  apy: number;
  apyType: 'fixed' | 'variable';
  minStake: number;
  lockPeriod: string;
  risk: 'low' | 'medium' | 'high';
  type: 'liquid' | 'native' | 'cefi';
  features: string[];
}

const stakingData: StakingOption[] = [
  // Ethereum
  { id: 'eth-lido', asset: 'Ethereum', symbol: 'ETH', protocol: 'Lido', apy: 3.8, apyType: 'variable', minStake: 0, lockPeriod: 'None (liquid)', risk: 'low', type: 'liquid', features: ['stETH token', 'DeFi compatible'] },
  { id: 'eth-rocket', asset: 'Ethereum', symbol: 'ETH', protocol: 'Rocket Pool', apy: 4.1, apyType: 'variable', minStake: 0.01, lockPeriod: 'None (liquid)', risk: 'low', type: 'liquid', features: ['rETH token', 'Decentralized'] },
  { id: 'eth-coinbase', asset: 'Ethereum', symbol: 'ETH', protocol: 'Coinbase', apy: 3.2, apyType: 'variable', minStake: 0, lockPeriod: 'None', risk: 'low', type: 'cefi', features: ['cbETH token', 'Easy to use'] },
  { id: 'eth-kraken', asset: 'Ethereum', symbol: 'ETH', protocol: 'Kraken', apy: 3.5, apyType: 'variable', minStake: 0, lockPeriod: 'None', risk: 'low', type: 'cefi', features: ['Instant rewards'] },
  { id: 'eth-native', asset: 'Ethereum', symbol: 'ETH', protocol: 'Native (32 ETH)', apy: 4.3, apyType: 'variable', minStake: 32, lockPeriod: 'Until exit', risk: 'low', type: 'native', features: ['Full rewards', 'Self custody'] },
  
  // Solana
  { id: 'sol-marinade', asset: 'Solana', symbol: 'SOL', protocol: 'Marinade', apy: 7.2, apyType: 'variable', minStake: 0, lockPeriod: 'None (liquid)', risk: 'low', type: 'liquid', features: ['mSOL token', 'DeFi ready'] },
  { id: 'sol-jito', asset: 'Solana', symbol: 'SOL', protocol: 'Jito', apy: 7.8, apyType: 'variable', minStake: 0, lockPeriod: 'None (liquid)', risk: 'low', type: 'liquid', features: ['JitoSOL', 'MEV rewards'] },
  { id: 'sol-native', asset: 'Solana', symbol: 'SOL', protocol: 'Native Staking', apy: 7.0, apyType: 'variable', minStake: 0.01, lockPeriod: '~2-3 days cooldown', risk: 'low', type: 'native', features: ['Choose validator'] },
  
  // Cosmos
  { id: 'atom-native', asset: 'Cosmos', symbol: 'ATOM', protocol: 'Native Staking', apy: 14.5, apyType: 'variable', minStake: 0, lockPeriod: '21 days unbond', risk: 'low', type: 'native', features: ['Airdrops eligible', 'Governance'] },
  { id: 'atom-stride', asset: 'Cosmos', symbol: 'ATOM', protocol: 'Stride', apy: 13.8, apyType: 'variable', minStake: 0, lockPeriod: 'None (liquid)', risk: 'medium', type: 'liquid', features: ['stATOM token', 'Keep liquidity'] },
  
  // Polkadot
  { id: 'dot-native', asset: 'Polkadot', symbol: 'DOT', protocol: 'Native Staking', apy: 11.5, apyType: 'variable', minStake: 250, lockPeriod: '28 days unbond', risk: 'low', type: 'native', features: ['Nomination pools'] },
  
  // Avalanche
  { id: 'avax-native', asset: 'Avalanche', symbol: 'AVAX', protocol: 'Native Staking', apy: 8.2, apyType: 'variable', minStake: 25, lockPeriod: '2 weeks - 1 year', risk: 'low', type: 'native', features: ['Choose duration'] },
  { id: 'avax-benqi', asset: 'Avalanche', symbol: 'AVAX', protocol: 'BENQI', apy: 7.5, apyType: 'variable', minStake: 0, lockPeriod: '15 days cooldown', risk: 'medium', type: 'liquid', features: ['sAVAX token'] },
  
  // Cardano
  { id: 'ada-native', asset: 'Cardano', symbol: 'ADA', protocol: 'Native Staking', apy: 3.5, apyType: 'variable', minStake: 0, lockPeriod: 'None', risk: 'low', type: 'native', features: ['No lock', 'Choose pool'] },
  
  // BNB
  { id: 'bnb-binance', asset: 'BNB', symbol: 'BNB', protocol: 'Binance Locked', apy: 6.5, apyType: 'fixed', minStake: 0.01, lockPeriod: '90-120 days', risk: 'low', type: 'cefi', features: ['High APY', 'Locked'] },
];

const StakingComparison: React.FC = () => {
  const [options, setOptions] = useState<StakingOption[]>(stakingData);
  const [loading, setLoading] = useState(false);
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'apy' | 'risk'>('apy');

  const assets = [...new Set(stakingData.map(s => s.asset))];
  const types = ['liquid', 'native', 'cefi'];

  const filteredOptions = options
    .filter(o => filterAsset === 'all' || o.asset === filterAsset)
    .filter(o => filterType === 'all' || o.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy;
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return riskOrder[a.risk] - riskOrder[b.risk];
    });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'liquid': return '💧';
      case 'native': return '🔐';
      case 'cefi': return '🏦';
      default: return '📦';
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-transparent border-0 py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-bold">
              <Percent size={20} className="me-2" />
              Staking APY Comparison
            </h5>
            <small className="text-muted">Compare yields across protocols</small>
          </div>
        </div>
        
        {/* Filters */}
        <div className="d-flex gap-2 flex-wrap">
          <Form.Select 
            size="sm" 
            value={filterAsset} 
            onChange={(e) => setFilterAsset(e.target.value)}
            style={{ width: 'auto' }}
            className="rounded-pill"
          >
            <option value="all">All Assets</option>
            {assets.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Form.Select>
          
          <Form.Select 
            size="sm" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto' }}
            className="rounded-pill"
          >
            <option value="all">All Types</option>
            <option value="liquid">💧 Liquid Staking</option>
            <option value="native">🔐 Native Staking</option>
            <option value="cefi">🏦 CeFi</option>
          </Form.Select>
          
          <Form.Select 
            size="sm" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ width: 'auto' }}
            className="rounded-pill"
          >
            <option value="apy">Sort by APY</option>
            <option value="risk">Sort by Risk</option>
          </Form.Select>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th className="border-0 ps-3">Asset</th>
                <th className="border-0">Protocol</th>
                <th className="border-0 text-end">APY</th>
                <th className="border-0">Lock Period</th>
                <th className="border-0 text-center">Risk</th>
                <th className="border-0 pe-3">Features</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map((option) => (
                <tr key={option.id}>
                  <td className="ps-3">
                    <span className="fw-semibold">{option.symbol}</span>
                    <br />
                    <small className="text-muted">{option.asset}</small>
                  </td>
                  <td>
                    <span>{getTypeIcon(option.type)} {option.protocol}</span>
                  </td>
                  <td className="text-end">
                    <span 
                      className="fw-bold"
                      style={{ 
                        color: option.apy > 10 ? '#22c55e' : option.apy > 5 ? '#3b82f6' : '#6b7280',
                        fontSize: '1.1rem'
                      }}
                    >
                      {option.apy}%
                    </span>
                    <br />
                    <small className="text-muted">{option.apyType}</small>
                  </td>
                  <td>
                    <small>{option.lockPeriod}</small>
                  </td>
                  <td className="text-center">
                    <Badge bg={getRiskColor(option.risk)} className="rounded-pill">
                      {option.risk}
                    </Badge>
                  </td>
                  <td className="pe-3">
                    <div className="d-flex flex-wrap gap-1">
                      {option.features.map((f, i) => (
                        <Badge key={i} bg="light" text="dark" className="rounded-pill" style={{ fontSize: '0.7rem' }}>
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      
      <Card.Footer className="bg-transparent border-0">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <small className="text-muted">
            💧 Liquid = tradeable tokens | 🔐 Native = on-chain | 🏦 CeFi = exchange-based
          </small>
          <small className="text-muted">
            APYs are estimates and may vary
          </small>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default StakingComparison;

