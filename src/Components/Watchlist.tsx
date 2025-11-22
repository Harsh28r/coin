import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Star, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useNavigate } from 'react-router-dom';

interface CoinPrice {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  name: string;
  symbol: string;
  market_cap: number;
  total_volume: number;
}

const Watchlist: React.FC = () => {
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();
  const [prices, setPrices] = useState<Record<string, CoinPrice>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const navigate = useNavigate();

  const fetchPrices = async () => {
    if (watchlist.length === 0) return;

    setLoading(true);
    try {
      const ids = watchlist.map(c => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      const data = await response.json();

      const priceMap: Record<string, CoinPrice> = {};
      data.forEach((coin: CoinPrice) => {
        priceMap[coin.id] = coin;
      });

      setPrices(priceMap);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching watchlist prices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch prices on mount and when watchlist changes
  useEffect(() => {
    fetchPrices();
  }, [watchlist.length]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [watchlist]);

  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  if (watchlist.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <Star size={64} className="text-muted mb-4" />
          <h3 className="mb-3">Your Watchlist is Empty</h3>
          <p className="text-muted mb-4">
            Start tracking your favorite cryptocurrencies by adding them to your watchlist.
          </p>
          <Button
            variant="warning"
            onClick={() => navigate('/')}
            style={{ backgroundColor: '#f97316', border: 'none' }}
          >
            Browse Coins
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#1f2937', fontWeight: 700 }}>
            <Star size={28} className="me-2" style={{ color: '#f97316' }} />
            My Watchlist
          </h2>
          {lastUpdated && (
            <small className="text-muted">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchPrices}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </Button>
          {watchlist.length > 0 && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => {
                if (window.confirm('Clear all coins from watchlist?')) {
                  clearWatchlist();
                }
              }}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Row className="g-3">
        {watchlist.map(coin => {
          const priceData = prices[coin.id];
          const change = priceData?.price_change_percentage_24h || 0;
          const isPositive = change >= 0;

          return (
            <Col key={coin.id} xs={12} sm={6} lg={4}>
              <Card
                className="h-100 border-0 shadow-sm"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => navigate(`/coin/${coin.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      {(priceData?.image || coin.image) && (
                        <img
                          src={priceData?.image || coin.image}
                          alt={coin.name}
                          style={{ width: 40, height: 40, marginRight: 12 }}
                        />
                      )}
                      <div>
                        <h6 className="mb-0 fw-bold">{coin.name}</h6>
                        <small className="text-muted text-uppercase">{coin.symbol}</small>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(coin.id);
                      }}
                      title="Remove from watchlist"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>

                  {priceData ? (
                    <>
                      <div className="mb-2">
                        <span className="h5 fw-bold" style={{ color: '#1f2937' }}>
                          {formatPrice(priceData.current_price)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge
                          bg={isPositive ? 'success' : 'danger'}
                          className="d-flex align-items-center gap-1"
                        >
                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(change).toFixed(2)}%
                        </Badge>
                        <small className="text-muted">
                          MCap: {formatMarketCap(priceData.market_cap)}
                        </small>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-muted" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Container>
  );
};

export default Watchlist;
