import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Globe } from 'lucide-react';

interface MarketStats {
  total_market_cap: number;
  total_volume: number;
  btc_dominance: number;
  eth_dominance: number;
  market_cap_change_24h: number;
  active_cryptocurrencies: number;
}

const MarketStats: React.FC = () => {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        if (response.ok) {
          const data = await response.json();
          const global = data.data;
          setStats({
            total_market_cap: global.total_market_cap?.usd || 0,
            total_volume: global.total_volume?.usd || 0,
            btc_dominance: global.market_cap_percentage?.btc || 0,
            eth_dominance: global.market_cap_percentage?.eth || 0,
            market_cap_change_24h: global.market_cap_change_percentage_24h_usd || 0,
            active_cryptocurrencies: global.active_cryptocurrencies || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching market stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  if (loading && !stats) {
    return null;
  }

  if (!stats) return null;

  const statsCards = [
    {
      icon: DollarSign,
      label: 'Total Market Cap',
      value: formatNumber(stats.total_market_cap),
      change: stats.market_cap_change_24h,
      color: '#3b82f6',
    },
    {
      icon: Activity,
      label: '24h Volume',
      value: formatNumber(stats.total_volume),
      change: null,
      color: '#10b981',
    },
    {
      icon: TrendingUp,
      label: 'BTC Dominance',
      value: `${stats.btc_dominance.toFixed(2)}%`,
      change: null,
      color: '#f59e0b',
    },
    {
      icon: TrendingUp,
      label: 'ETH Dominance',
      value: `${stats.eth_dominance.toFixed(2)}%`,
      change: null,
      color: '#8b5cf6',
    },
    {
      icon: Users,
      label: 'Active Cryptos',
      value: stats.active_cryptocurrencies.toLocaleString(),
      change: null,
      color: '#ef4444',
    },
  ];

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.75rem', marginBottom: 8 }}>
          Market Overview
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Real-time cryptocurrency market statistics
        </p>
      </div>

      <Row className="g-3">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change !== null && stat.change >= 0;
          
          return (
            <Col key={index} xs={12} sm={6} md={4} lg={2.4}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                <Card.Body style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={20} color={stat.color} />
                    </div>
                    {stat.change !== null && (
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isPositive ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPositive ? '+' : ''}{stat.change.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                    {stat.value}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
};

export default MarketStats;

