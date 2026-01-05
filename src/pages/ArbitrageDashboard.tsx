import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Nav, Tab } from 'react-bootstrap';
import {
  getOpportunities,
  getStats,
  getTriangularOpportunities,
  getTriangularStats,
  ArbitrageOpportunity,
  ArbitrageStats,
  TriangularOpportunity,
  TriangularStats
} from '../services/arbitrageApi';
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink, Repeat, Activity, DollarSign, Target, Zap } from 'lucide-react';

const ArbitrageDashboard: React.FC = () => {
  // Cross-exchange state
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);

  // Triangular arbitrage state
  const [triangularOpp, setTriangularOpp] = useState<TriangularOpportunity[]>([]);
  const [triangularStats, setTriangularStats] = useState<TriangularStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('cross-exchange');

  const fetchData = async () => {
    try {
      setError(null);
      const [opps, statistics, triangularOpps, triangularStat] = await Promise.all([
        getOpportunities(20),
        getStats(7),
        getTriangularOpportunities(20),
        getTriangularStats(7)
      ]);
      setOpportunities(opps);
      setStats(statistics);
      setTriangularOpp(triangularOpps);
      setTriangularStats(triangularStat);
    } catch (err) {
      setError('Failed to fetch arbitrage data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getLiquidityBadge = (liquidity: string) => {
    const styles = {
      low: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: 'LOW' },
      medium: { bg: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', text: 'MEDIUM' },
      high: { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: 'HIGH' }
    };
    const style = styles[liquidity as keyof typeof styles];
    return (
      <span style={{
        background: style.bg,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}>
        {style.text}
      </span>
    );
  };

  const getExchangeLink = (exchange: string, symbol: string) => {
    const baseSymbol = symbol.replace('/USDT', '').toLowerCase();
    const links: { [key: string]: string } = {
      binance: `https://www.binance.com/en/trade/${baseSymbol}_USDT`,
      kraken: `https://www.kraken.com/prices/${baseSymbol}`,
      coinbase: `https://www.coinbase.com/price/${baseSymbol}`,
    };
    return links[exchange.toLowerCase()] || '#';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Spinner animation="border" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
          <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: 500 }}>Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paddingBottom: '50px'
    }}>
      <Container style={{ paddingTop: '30px', maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}>
          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div>
                  <h1 style={{
                    color: 'white',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    <Zap size={40} style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                    Arbitrage Scanner
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', margin: 0 }}>
                    Real-time cryptocurrency arbitrage opportunities across multiple exchanges
                  </p>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  style={{
                    background: refreshing ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '12px 25px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px 0 rgba(245, 87, 108, 0.3)',
                    transition: 'all 0.3s ease',
                    marginTop: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <RefreshCw className={refreshing ? 'spinning' : ''} size={18} style={{ marginRight: '8px' }} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError(null)}
            style={{
              borderRadius: '15px',
              border: 'none',
              boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'cross-exchange')}>
          <Nav variant="pills" style={{ marginBottom: '30px', gap: '15px', flexWrap: 'wrap' }}>
            <Nav.Item>
              <Nav.Link
                eventKey="cross-exchange"
                style={{
                  background: activeTab === 'cross-exchange'
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '15px 30px',
                  color: 'white',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'cross-exchange'
                    ? '0 4px 15px rgba(245, 87, 108, 0.4)'
                    : 'none'
                }}
              >
                <ExternalLink size={18} style={{ marginRight: '10px' }} />
                Cross-Exchange
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="triangular"
                style={{
                  background: activeTab === 'triangular'
                    ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
                    : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '15px 30px',
                  color: 'white',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'triangular'
                    ? '0 4px 15px rgba(168, 237, 234, 0.4)'
                    : 'none'
                }}
              >
                <Repeat size={18} style={{ marginRight: '10px' }} />
                Triangular
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Cross-Exchange Tab */}
            <Tab.Pane eventKey="cross-exchange">
              {/* Statistics */}
              {stats && (
                <Row style={{ marginBottom: '30px', gap: '20px 0' }}>
                  {[
                    { label: 'Active', value: stats.activeOpportunities, icon: Activity, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                    { label: 'Total (7d)', value: stats.totalOpportunities, icon: Target, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                    { label: 'Avg Profit', value: `${stats.averageProfitPercent}%`, icon: TrendingUp, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
                    { label: 'Max Profit', value: `${stats.maxProfitPercent}%`, icon: DollarSign, gradient: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)' },
                  ].map((stat, idx) => (
                    <Col md={6} lg={3} key={idx}>
                      <div style={{
                        background: stat.gradient,
                        borderRadius: '20px',
                        padding: '25px',
                        color: 'white',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        transition: 'transform 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, marginBottom: '8px' }}>{stat.label}</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stat.value}</h2>
                          </div>
                          <stat.icon size={40} style={{ opacity: 0.3 }} />
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}

              {/* Opportunities */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h4 style={{ color: 'white', marginBottom: '25px', fontWeight: 'bold' }}>
                  Available Opportunities ({opportunities.length})
                </h4>
                {opportunities.length === 0 ? (
                  <Alert variant="info" style={{ borderRadius: '15px', border: 'none' }}>
                    No arbitrage opportunities found. The scanner runs every 30 seconds.
                  </Alert>
                ) : (
                  <Row>
                    {opportunities.map((opp) => (
                      <Col md={6} lg={4} key={opp._id} style={{ marginBottom: '20px' }}>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '20px',
                          padding: '25px',
                          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                          transition: 'all 0.3s ease',
                          height: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(31, 38, 135, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.2)';
                        }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h5 style={{ margin: 0, fontWeight: 'bold', color: '#333', fontSize: '1.3rem' }}>{opp.symbol}</h5>
                            {getLiquidityBadge(opp.liquidity)}
                          </div>

                          <div style={{ marginBottom: '20px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px',
                              padding: '12px',
                              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                              borderRadius: '12px'
                            }}>
                              <span style={{ color: '#666', fontSize: '14px' }}>Buy</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge bg="primary" style={{ borderRadius: '10px', padding: '6px 12px' }}>{opp.buyExchange}</Badge>
                                <strong style={{ color: '#333' }}>${opp.buyPrice.toFixed(2)}</strong>
                                <a
                                  href={getExchangeLink(opp.buyExchange, opp.symbol)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#667eea', transition: 'color 0.3s' }}
                                >
                                  <ExternalLink size={16} />
                                </a>
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px',
                              background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)',
                              borderRadius: '12px'
                            }}>
                              <span style={{ color: '#666', fontSize: '14px' }}>Sell</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge bg="success" style={{ borderRadius: '10px', padding: '6px 12px' }}>{opp.sellExchange}</Badge>
                                <strong style={{ color: '#333' }}>${opp.sellPrice.toFixed(2)}</strong>
                                <a
                                  href={getExchangeLink(opp.sellExchange, opp.symbol)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#f5576c', transition: 'color 0.3s' }}
                                >
                                  <ExternalLink size={16} />
                                </a>
                              </div>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '20px',
                            borderTop: '2px solid #f0f0f0'
                          }}>
                            <div>
                              <small style={{ color: '#999', display: 'block', marginBottom: '5px' }}>Net Profit</small>
                              <div style={{
                                color: opp.netProfitPercent > 0 ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                {opp.netProfitPercent > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                {opp.netProfitPercent.toFixed(2)}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <small style={{ color: '#999', display: 'block', marginBottom: '5px' }}>On $1000</small>
                              <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.3rem' }}>
                                ${opp.profitAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            </Tab.Pane>

            {/* Triangular Tab */}
            <Tab.Pane eventKey="triangular">
              {/* Statistics */}
              {triangularStats && (
                <Row style={{ marginBottom: '30px', gap: '20px 0' }}>
                  {[
                    { label: 'Active', value: triangularStats.activeOpportunities, icon: Activity, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
                    { label: 'Total (7d)', value: triangularStats.totalOpportunities, icon: Target, gradient: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)' },
                    { label: 'Avg Profit', value: `${triangularStats.averageProfitPercent}%`, icon: TrendingUp, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                    { label: 'Max Profit', value: `${triangularStats.maxProfitPercent}%`, icon: DollarSign, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                  ].map((stat, idx) => (
                    <Col md={6} lg={3} key={idx}>
                      <div style={{
                        background: stat.gradient,
                        borderRadius: '20px',
                        padding: '25px',
                        color: 'white',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        transition: 'transform 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, marginBottom: '8px' }}>{stat.label}</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stat.value}</h2>
                          </div>
                          <stat.icon size={40} style={{ opacity: 0.3 }} />
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}

              {/* Triangular Opportunities */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h4 style={{ color: 'white', marginBottom: '25px', fontWeight: 'bold' }}>
                  Triangular Opportunities ({triangularOpp.length})
                </h4>
                {triangularOpp.length === 0 ? (
                  <Alert variant="info" style={{ borderRadius: '15px', border: 'none' }}>
                    No triangular arbitrage opportunities found. The scanner runs every 30 seconds on Binance.
                  </Alert>
                ) : (
                  <Row>
                    {triangularOpp.map((opp) => (
                      <Col md={6} lg={4} key={opp._id} style={{ marginBottom: '20px' }}>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '20px',
                          padding: '25px',
                          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                          transition: 'all 0.3s ease',
                          height: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(31, 38, 135, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.2)';
                        }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <Badge bg="primary" style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}>
                              {opp.exchange.toUpperCase()}
                            </Badge>
                            <Badge bg="info" style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}>
                              {opp.baseCurrency}
                            </Badge>
                          </div>

                          <div style={{
                            background: 'linear-gradient(135deg, #a8edea15 0%, #fed6e315 100%)',
                            padding: '15px',
                            borderRadius: '15px',
                            marginBottom: '20px',
                            textAlign: 'center'
                          }}>
                            <small style={{ color: '#999', display: 'block', marginBottom: '8px' }}>Trading Path</small>
                            <strong style={{ color: '#333', fontSize: '14px' }}>{opp.path}</strong>
                          </div>

                          <div style={{ marginBottom: '20px' }}>
                            {[
                              { label: 'Step 1', pair: opp.step1.pair, price: opp.step1.price },
                              { label: 'Step 2', pair: opp.step2.pair, price: opp.step2.price },
                              { label: 'Step 3', pair: opp.step3.pair, price: opp.step3.price },
                            ].map((step, idx) => (
                              <div key={idx} style={{
                                padding: '10px',
                                background: idx % 2 === 0 ? '#f9f9f9' : '#fff',
                                borderRadius: '10px',
                                marginBottom: '8px'
                              }}>
                                <small style={{ color: '#999' }}>{step.label}:</small>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#333' }}>{step.pair}</strong>
                                  <span style={{ color: '#666' }}>@{step.price.toFixed(6)}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '20px',
                            borderTop: '2px solid #f0f0f0'
                          }}>
                            <div>
                              <small style={{ color: '#999', display: 'block', marginBottom: '5px' }}>Net Profit</small>
                              <div style={{
                                color: opp.netProfitPercent > 0 ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                {opp.netProfitPercent > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                {opp.netProfitPercent.toFixed(4)}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <small style={{ color: '#999', display: 'block', marginBottom: '5px' }}>On $1000</small>
                              <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                ${opp.profitAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            background: '#f9f9f9',
                            borderRadius: '10px',
                            textAlign: 'center'
                          }}>
                            <small style={{ color: '#666', fontSize: '12px' }}>
                              {opp.startAmount} {opp.baseCurrency} → {opp.endAmount.toFixed(6)} {opp.baseCurrency}
                            </small>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .badge {
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        a {
          text-decoration: none;
        }

        a:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default ArbitrageDashboard;
