import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Button, Form } from 'react-bootstrap';
import { RefreshCw, Percent } from 'lucide-react';

interface StakingOption {
  id: string;
  asset: string;
  symbol: string;
  protocol: string;
  apy: number;
  apyType: 'fixed' | 'variable';
  tvl: number;
  chain: string;
  type: 'liquid' | 'native' | 'lending';
}

// Fallback data if API fails
const fallbackData: StakingOption[] = [
  { id: 'lido-eth', asset: 'Ethereum', symbol: 'ETH', protocol: 'Lido', apy: 3.8, apyType: 'variable', tvl: 25000000000, chain: 'Ethereum', type: 'liquid' },
  { id: 'rocket-eth', asset: 'Ethereum', symbol: 'ETH', protocol: 'Rocket Pool', apy: 4.1, apyType: 'variable', tvl: 3000000000, chain: 'Ethereum', type: 'liquid' },
  { id: 'marinade-sol', asset: 'Solana', symbol: 'SOL', protocol: 'Marinade', apy: 7.2, apyType: 'variable', tvl: 1500000000, chain: 'Solana', type: 'liquid' },
];

const StakingComparison: React.FC = () => {
  const [options, setOptions] = useState<StakingOption[]>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'apy' | 'tvl'>('apy');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch real yields from DefiLlama API
  const fetchYields = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent('https://yields.llama.fi/pools')}`
      );
      const data = await res.json();
      
      if (data?.data && Array.isArray(data.data)) {
        // Filter for staking/liquid staking pools with good TVL
        const stakingPools = data.data
          .filter((pool: any) => 
            pool.tvlUsd > 10000000 && // Min $10M TVL
            pool.apy > 0 &&
            pool.apy < 100 && // Filter unrealistic APYs
            (pool.project?.toLowerCase().includes('lido') ||
             pool.project?.toLowerCase().includes('rocket') ||
             pool.project?.toLowerCase().includes('marinade') ||
             pool.project?.toLowerCase().includes('jito') ||
             pool.project?.toLowerCase().includes('benqi') ||
             pool.project?.toLowerCase().includes('ankr') ||
             pool.project?.toLowerCase().includes('stader') ||
             pool.project?.toLowerCase().includes('stakewise') ||
             pool.project?.toLowerCase().includes('frax') ||
             pool.project?.toLowerCase().includes('coinbase') ||
             pool.project?.toLowerCase().includes('binance') ||
             pool.category === 'Liquid Staking' ||
             pool.category === 'Staking')
          )
          .slice(0, 30)
          .map((pool: any, idx: number) => ({
            id: pool.pool || `pool-${idx}`,
            asset: pool.symbol?.split('-')[0] || 'Unknown',
            symbol: pool.symbol?.split('-')[0] || '?',
            protocol: pool.project || 'Unknown',
            apy: parseFloat(pool.apy?.toFixed(2)) || 0,
            apyType: 'variable' as const,
            tvl: pool.tvlUsd || 0,
            chain: pool.chain || 'Unknown',
            type: pool.category === 'Liquid Staking' ? 'liquid' as const : 
                  pool.category === 'Lending' ? 'lending' as const : 'native' as const,
          }));
        
        if (stakingPools.length > 0) {
          setOptions(stakingPools);
        }
      }
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch yields:', err);
      setOptions(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYields();
  }, []);

  const assets = Array.from(new Set(options.map(s => s.asset)));
  const types = ['liquid', 'native', 'lending'];

  const filteredOptions = options
    .filter(o => filterAsset === 'all' || o.asset === filterAsset)
    .filter(o => filterType === 'all' || o.type === filterType)
    .sort((a, b) => sortBy === 'apy' ? b.apy - a.apy : b.tvl - a.tvl);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'liquid': return '💧';
      case 'native': return '🔐';
      case 'lending': return '🏦';
      default: return '📦';
    }
  };

  const formatTvl = (tvl: number) => {
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(0)}M`;
    return `$${(tvl / 1e3).toFixed(0)}K`;
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
            <small className="text-muted">Live yields from DefiLlama</small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={fetchYields} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </Button>
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
            <option value="native">🔐 Native</option>
            <option value="lending">🏦 Lending</option>
          </Form.Select>
          
          <Form.Select 
            size="sm" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ width: 'auto' }}
            className="rounded-pill"
          >
            <option value="apy">Sort by APY</option>
            <option value="tvl">Sort by TVL</option>
          </Form.Select>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
            <p className="mt-2 text-muted small">Loading yields...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th className="border-0 ps-3">Asset</th>
                  <th className="border-0">Protocol</th>
                  <th className="border-0">Chain</th>
                  <th className="border-0 text-end">APY</th>
                  <th className="border-0 text-end pe-3">TVL</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptions.map((option) => (
                  <tr key={option.id}>
                    <td className="ps-3">
                      <span className="fw-semibold">{option.symbol}</span>
                    </td>
                    <td>
                      <span>{getTypeIcon(option.type)} {option.protocol}</span>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="rounded-pill">
                        {option.chain}
                      </Badge>
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
                    </td>
                    <td className="text-end pe-3">
                      <small className="text-muted">{formatTvl(option.tvl)}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
      
      <Card.Footer className="bg-transparent border-0">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <small className="text-muted">
            💧 Liquid | 🔐 Native | 🏦 Lending — Data from DefiLlama
          </small>
          {lastUpdate && (
            <small className="text-muted">
              Updated: {lastUpdate.toLocaleTimeString()}
            </small>
          )}
        </div>
      </Card.Footer>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default StakingComparison;

