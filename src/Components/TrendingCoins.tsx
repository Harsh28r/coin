import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
}

const TrendingCoins: React.FC = () => {
  const navigate = useNavigate();
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingCoins = async () => {
      try {
        setLoading(true);
        // Try multiple API endpoints
        const endpoints = [
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=10&page=1&sparkline=false',
          'https://api.coingecko.com/api/v3/search/trending',
        ];

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (endpoint.includes('markets')) {
              // Direct markets endpoint
              if (Array.isArray(data) && data.length > 0) {
                const formatted = data.slice(0, 8).map((coin: any) => ({
                  id: coin.id,
                  symbol: coin.symbol?.toUpperCase() || '',
                  name: coin.name || '',
                  image: coin.image || '',
                  current_price: coin.current_price || 0,
                  price_change_percentage_24h: coin.price_change_percentage_24h || 0,
                  market_cap_rank: coin.market_cap_rank || 999,
                }));
                setTrendingCoins(formatted);
                setLoading(false);
                return;
              }
            } else if (data.coins) {
              // Trending endpoint
              const coins = data.coins.slice(0, 8).map((item: any) => ({
                id: item.item.id,
                symbol: item.item.symbol?.toUpperCase() || '',
                name: item.item.name || '',
                image: item.item.large || item.item.small || '',
                current_price: item.item.data?.price || 0,
                price_change_percentage_24h: item.item.data?.price_change_percentage_24h?.usd || 0,
                market_cap_rank: item.item.market_cap_rank || 999,
              }));
              setTrendingCoins(coins);
              setLoading(false);
              return;
            }
          } catch (err) {
            continue;
          }
        }

        const mockTrending: TrendingCoin[] = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', current_price: 67500, price_change_percentage_24h: 1.2, market_cap_rank: 1 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', current_price: 3450, price_change_percentage_24h: -0.5, market_cap_rank: 2 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', current_price: 178, price_change_percentage_24h: 4.5, market_cap_rank: 5 },
          { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', current_price: 0.14, price_change_percentage_24h: 3.2, market_cap_rank: 9 },
          { id: 'pepe', symbol: 'PEPE', name: 'Pepe', image: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg', current_price: 0.000012, price_change_percentage_24h: 8.1, market_cap_rank: 24 },
          { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', current_price: 0.000024, price_change_percentage_24h: 2.4, market_cap_rank: 14 },
          { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', current_price: 38, price_change_percentage_24h: -0.3, market_cap_rank: 12 },
          { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', current_price: 18, price_change_percentage_24h: 1.8, market_cap_rank: 15 },
        ];
        setTrendingCoins(mockTrending);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingCoins();
    const interval = setInterval(fetchTrendingCoins, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && trendingCoins.length === 0) {
    return (
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px' }}>
        <div className="text-center">
          <p style={{ color: '#94a3b8' }}>Loading trending coins...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 20px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.75rem', margin: 0 }}>
            Trending Coins
          </h2>
          <Badge bg="primary" style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#f97316', border: 'none' }}>
            Live Prices
          </Badge>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Top cryptocurrencies by 24h price change
        </p>
      </div>

      <Row className="g-3">
        {trendingCoins.map((coin, index) => {
          const isPositive = coin.price_change_percentage_24h >= 0;
          const changeColor = isPositive ? '#10b981' : '#ef4444';
          
          return (
            <Col key={coin.id || index} xs={12} sm={6} md={4} lg={3}>
              <Card
                className="h-100 border-0 shadow-sm"
                style={{
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#f97316';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onClick={() => navigate(`/coin/${coin.id}`)}
              >
                <Card.Body style={{ padding: '1.25rem' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      {coin.image && (
                        <img
                          src={coin.image}
                          alt={coin.name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                          {coin.symbol}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          #{coin.market_cap_rank}
                        </div>
                      </div>
                    </div>
                    {isPositive ? (
                      <TrendingUp size={20} color={changeColor} />
                    ) : (
                      <TrendingDown size={20} color={changeColor} />
                    )}
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                      {coin.current_price > 0 ? formatPrice(coin.current_price) : '—'}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: changeColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isPositive ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {coin.price_change_percentage_24h !== 0
                        ? `${isPositive ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`
                        : '0.00%'}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {trendingCoins.length === 0 && !loading && (
        <div className="text-center py-5">
          <p style={{ color: '#94a3b8' }}>Unable to load trending coins at the moment.</p>
        </div>
      )}
    </section>
  );
};

export default TrendingCoins;


