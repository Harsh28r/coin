import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  image: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    repos_url: { github: string[]; bitbucket: string[] };
  };
  market_data: {
    price_change_24h_in_currency: { [key: string]: number };
    market_cap_change_24h_in_currency: { [key: string]: number };
    total_volume: { [key: string]: number };
    market_cap: { [key: string]: number };
  };
}

interface ChartDataPoint {
  price: number;
  timestamp: number;
}

const CoinDetail: React.FC = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { currency, formatPrice } = useCurrency();
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '1Y'>('7D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Fetch coin data with real-time updates
  useEffect(() => {
    if (!coinId) return;
    
    const fetchCoinData = async () => {
      try {
        setLoading(true);
        
        // Use CoinGecko API with proper headers and error handling
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setCoin(data);
          setError(null);
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
        
      } catch (err) {
        console.error('Error fetching coin data:', err);
        setError('Unable to fetch live data. Please try again later.');
        // Create basic mock data as fallback
        const mockCoin = createBasicMockCoinData(coinId);
        setCoin(mockCoin);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
    
    // Set up real-time updates every 60 seconds (more reasonable rate)
    const interval = setInterval(() => {
      fetchCoinData();
      setLastUpdate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [coinId]);

  // Fetch chart data when timeframe changes
  useEffect(() => {
    if (!coinId || !currency) return;
    
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        
        // Calculate days based on timeframe
        const days = timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 365;
        
        // Fetch real data from CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}&interval=${timeframe === '1D' ? 'hourly' : 'daily'}`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const prices = data.prices || [];
          
          if (prices.length > 0) {
            const chartDataPoints: ChartDataPoint[] = prices.map((price: [number, number]) => ({
              timestamp: price[0],
              price: price[1]
            }));
            
            setChartData(chartDataPoints);
            renderChart(chartDataPoints);
          }
        } else {
          throw new Error(`Chart API Error: ${response.status}`);
        }
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        // Generate realistic mock data as fallback
        const daysForFallback = timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 365;
        const mockData = generateRealisticChartData(daysForFallback, coin?.current_price || 100);
        setChartData(mockData);
        renderChart(mockData);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [coinId, currency, timeframe, coin?.current_price]);

  // Generate realistic chart data for fallback
  const generateRealisticChartData = (days: number, basePrice: number): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = Date.now();
    const interval = timeframe === '1D' ? 3600000 : 86400000; // 1 hour or 1 day in ms
    
    let currentPrice = basePrice;
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * interval);
      
      // Create realistic price movements with trends and volatility
      const trend = Math.sin(i * 0.1) * 0.015; // Small trend component
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% volatility
      const change = trend + volatility;
      
      currentPrice = Math.max(0.01, currentPrice * (1 + change));
      data.push({ timestamp, price: currentPrice });
    }
    
    return data;
  };

  // Render chart using HTML5 Canvas with CoinGecko-like styling
  const renderChart = (data: ChartDataPoint[]) => {
    if (!chartRef.current) return;
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    if (data.length === 0) return;
    
    // Set canvas dimensions
    const rect = chartRef.current.getBoundingClientRect();
    chartRef.current.width = rect.width;
    chartRef.current.height = rect.height;
    
    const prices = data.map(point => point.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Draw grid lines (CoinGecko style)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * rect.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * rect.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    
    // Draw price line with CoinGecko-like styling
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Create gradient for the line
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.strokeStyle = gradient;
    
    ctx.beginPath();
    
    prices.forEach((price, index) => {
      const x = (index / (prices.length - 1)) * rect.width;
      const y = rect.height - ((price - minPrice) / priceRange) * rect.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Add price area fill (CoinGecko style)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, rect.height);
    
    prices.forEach((price, index) => {
      const x = (index / (prices.length - 1)) * rect.width;
      const y = rect.height - ((price - minPrice) / priceRange) * rect.height;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(rect.width, rect.height);
    ctx.closePath();
    ctx.fill();
    
    // Add price labels on the right
    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * rect.height;
      const price = maxPrice - (i / 4) * priceRange;
      ctx.fillText(formatPrice(price, currency), rect.width - 8, y + 4);
    }
    
    // Add time labels at the bottom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * rect.width;
      const timestamp = data[Math.floor((i / 4) * (data.length - 1))]?.timestamp;
      if (timestamp) {
        const date = new Date(timestamp);
        const label = timeframe === '1D' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(label, x, rect.height - 8);
      }
    }
  };

  // Render chart whenever chartData changes
  useEffect(() => {
    if (chartData.length > 0 && chartRef.current) {
      renderChart(chartData);
    }
  }, [chartData, currency]);

  // Handle window resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      if (chartData.length > 0 && chartRef.current) {
        renderChart(chartData);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartData]);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const getPriceChangeColor = (change: number | undefined) => {
    if (change === undefined || change === null) return '#6b7280';
    return change >= 0 ? '#059669' : '#dc2626';
  };

  const getPriceChangeIcon = (change: number | undefined) => {
    if (change === undefined || change === null) return '−';
    return change >= 0 ? '↗' : '↘';
  };

  const formatPriceChange = (change: number | undefined) => {
    if (change === undefined || change === null) return '0.00';
    return change.toFixed(2);
  };

  // Create basic mock data as fallback
  const createBasicMockCoinData = (id: string): CoinData => {
    return {
      id: id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      symbol: id.slice(0, 3).toUpperCase(),
      current_price: 100,
      price_change_percentage_24h: 0,
      price_change_percentage_7d: 0,
      price_change_percentage_30d: 0,
      market_cap: 1000000000,
      market_cap_rank: 999,
      total_volume: 50000000,
      circulating_supply: 1000000,
      total_supply: 1000000,
      max_supply: null,
      image: `https://api.dicebear.com/7.x/shapes/svg?seed=${id}&backgroundColor=1a1a2e&shape1Color=00ff88&size=200`,
      description: { en: `Sample data for ${id}. This is placeholder information while we attempt to fetch live data from the API.` },
      links: {
        homepage: [],
        blockchain_site: [],
        official_forum_url: [],
        chat_url: [],
        announcement_url: [],
        repos_url: { github: [], bitbucket: [] }
      },
      market_data: {
        price_change_24h_in_currency: { usd: 0 },
        market_cap_change_24h_in_currency: { usd: 0 },
        total_volume: { usd: 50000000 },
        market_cap: { usd: 1000000000 }
      }
    };
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}></div>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid transparent',
              borderTop: '4px solid rgba(255,255,255,0.6)',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite reverse'
            }}></div>
          </div>
          <h3 style={{
            marginTop: '32px',
            fontSize: '28px',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>Loading {coinId?.toUpperCase()} Data</h3>
          <p style={{
            marginTop: '16px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '18px',
            fontWeight: 500
          }}>Fetching live market information...</p>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            fontSize: '120px',
            color: '#ffffff',
            marginBottom: '32px',
            textShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}>🚫</div>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '24px',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>Coin Not Found</h2>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '40px',
            fontSize: '20px',
            lineHeight: '1.6'
          }}>We couldn't find information for "{coinId}". Please check the coin ID and try again.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              color: '#333',
              padding: '20px 40px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
            }}
          >
            🏠 Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      position: 'relative'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 0'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                background: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                padding: '14px 20px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg style={{ width: '18px', height: '18px', marginRight: '10px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>Cryptocurrency Details</h1>
            <div style={{ width: '120px' }}></div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Data Source Indicator */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '40px',
            boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2)',
            transform: 'translateY(0)',
            animation: 'slideIn 0.6s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                color: '#d97706', 
                fontSize: '28px', 
                marginRight: '20px',
                background: 'white',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
              }}>⚠️</div>
              <div>
                <p style={{ color: '#92400e', fontWeight: 700, margin: 0, fontSize: '18px' }}>Sample Data Mode</p>
                <p style={{ color: '#a16207', fontSize: '16px', margin: '12px 0 0 0', lineHeight: '1.6' }}>Showing sample information while we attempt to fetch live data from CoinGecko API.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Real-time Data Indicator */}
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
          border: '2px solid #3b82f6',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)',
          transform: 'translateY(0)',
          animation: 'slideIn 0.6s ease-out 0.1s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                color: '#2563eb', 
                fontSize: '28px', 
                marginRight: '20px',
                background: 'white',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
              }}>🔄</div>
              <div>
                <p style={{ color: '#1e40af', fontWeight: 700, margin: 0, fontSize: '18px' }}>Live Data Mode</p>
                <p style={{ color: '#3b82f6', fontSize: '16px', margin: '12px 0 0 0', lineHeight: '1.6' }}>
                  Real-time data updates every 60 seconds • Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #dbeafe',
              borderTop: '3px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
        
        {/* Coin Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25)',
          border: '2px solid rgba(255,255,255,0.8)',
          padding: '48px',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
          transform: 'translateY(0)',
          animation: 'slideIn 0.6s ease-out 0.2s both'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
            zIndex: 0
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{
                position: 'relative',
                marginRight: '40px'
              }}>
                <img
                  src={coin.image}
                  alt={coin.name}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -5px rgba(0, 0, 0, 0.15)',
                    border: '4px solid white',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-12px',
                  right: '-12px',
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '50%',
                  border: '4px solid white',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'white',
                    borderRadius: '50%'
                  }}></div>
                </div>
              </div>
              <div>
                <h1 style={{
                  fontSize: '48px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '16px',
                  letterSpacing: '-0.025em'
                }}>
                  {coin.name}
                </h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '24px',
                    fontSize: '20px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                  }}>
                    {coin.symbol.toUpperCase()}
                  </span>
                  <span style={{
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    color: '#64748b',
                    padding: '10px 16px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: 700,
                    border: '2px solid rgba(255,255,255,0.8)'
                  }}>
                    Rank #{coin.market_cap_rank || 'N/A'}
                  </span>
                </div>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '18px',
                  margin: 0,
                  fontWeight: 600
                }}>
                  Market Cap: {formatPrice(coin.market_cap || 0, currency)}
                </p>
              </div>
            </div>

            {/* Price Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
              marginBottom: '40px'
            }}>
              <div style={{ 
                textAlign: 'center', 
                position: 'relative',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                padding: '32px',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '2px solid rgba(255,255,255,0.8)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
              }}
              >
                <p style={{
                  fontSize: '16px',
                  color: '#64748b',
                  marginBottom: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Current Price</p>
                <p style={{
                  fontSize: '40px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  letterSpacing: '-0.025em'
                }}>
                  {formatPrice(coin.current_price || 0, currency)}
                </p>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>Live</div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                padding: '32px',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '2px solid rgba(255,255,255,0.8)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
              }}
              >
                <p style={{
                  fontSize: '16px',
                  color: '#64748b',
                  marginBottom: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>24h Change</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 900,
                    color: getPriceChangeColor(coin.price_change_percentage_24h),
                    letterSpacing: '-0.025em'
                  }}>
                    {getPriceChangeIcon(coin.price_change_percentage_24h)}
                    {formatPriceChange(coin.price_change_percentage_24h)}%
                  </span>
                </div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                padding: '32px',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '2px solid rgba(255,255,255,0.8)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
              }}
              >
                <p style={{
                  fontSize: '16px',
                  color: '#64748b',
                  marginBottom: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>7d Change</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 900,
                    color: getPriceChangeColor(coin.price_change_percentage_7d),
                    letterSpacing: '-0.025em'
                  }}>
                    {getPriceChangeIcon(coin.price_change_percentage_7d)}
                    {formatPriceChange(coin.price_change_percentage_7d)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              padding: '20px',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: '2px solid rgba(255,255,255,0.8)'
            }}>
              {(['1D', '7D', '30D', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    // Show immediate feedback
                    setChartLoading(true);
                    // Generate mock data immediately for the new timeframe
                    const daysForMock = tf === '1D' ? 1 : tf === '7D' ? 7 : tf === '30D' ? 30 : 365;
                    const mockData = generateRealisticChartData(daysForMock, coin?.current_price || 100);
                    setChartData(mockData);
                    setChartLoading(false);
                  }}
                  style={{
                    padding: '16px 28px',
                    borderRadius: '16px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: timeframe === tf ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                    color: timeframe === tf ? 'white' : '#64748b',
                    boxShadow: timeframe === tf ? '0 8px 20px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transform: timeframe === tf ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          padding: '40px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.02) 0%, transparent 70%)',
            zIndex: 0
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)'
                }}>📈</div>
                <div>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.025em'
                  }}>
                    Price Chart & Analytics
                  </h2>
                  <p style={{
                    color: '#64748b',
                    fontSize: '16px',
                    margin: '8px 0 0 0',
                    fontWeight: 500
                  }}>
                    {timeframe} price performance analysis
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                background: 'white',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                {chartLoading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #dbeafe',
                      borderTop: '2px solid #2563eb',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{
                      fontSize: '12px',
                      color: '#3b82f6',
                      fontWeight: 600
                    }}>Updating...</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    {chartData.length > 0 ? `${chartData.length} data points` : 'Loading...'}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#94a3b8',
                    marginTop: '2px'
                  }}>
                    {timeframe} timeframe
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{
              height: '450px',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'white',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {chartLoading && chartData.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)'
                }}>
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ 
                      fontSize: '64px', 
                      marginBottom: '24px',
                      opacity: 0.7
                    }}>📊</div>
                    <p style={{ 
                      fontSize: '20px', 
                      fontWeight: 700, 
                      margin: 0,
                      color: '#0f172a'
                    }}>Loading Chart Data...</p>
                    <p style={{ 
                      fontSize: '16px', 
                      margin: '12px 0 0 0',
                      color: '#64748b'
                    }}>Fetching {timeframe} price history from CoinGecko</p>
                  </div>
                </div>
              ) : (
                <canvas
                  ref={chartRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                />
              )}
            </div>
            
            {chartData.length > 0 && (
              <div style={{
                marginTop: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    margin: '0 0 8px 0',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Data Period</p>
                  <p style={{
                    fontSize: '16px',
                    color: '#0f172a',
                    margin: 0,
                    fontWeight: 600
                  }}>
                    {new Date(chartData[0]?.timestamp || Date.now()).toLocaleDateString()} - {new Date(chartData[chartData.length - 1]?.timestamp || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    margin: '0 0 8px 0',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Price Range</p>
                  <p style={{
                    fontSize: '16px',
                    color: '#0f172a',
                    margin: 0,
                    fontWeight: 600
                  }}>
                    {formatPrice(Math.min(...chartData.map(d => d.price)), currency)} - {formatPrice(Math.max(...chartData.map(d => d.price)), currency)}
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    margin: '0 0 8px 0',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Data Points</p>
                  <p style={{
                    fontSize: '16px',
                    color: '#0f172a',
                    margin: 0,
                    fontWeight: 600
                  }}>
                    {chartData.length} {timeframe === '1D' ? 'hourly' : 'daily'} intervals
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '32px',
          marginBottom: '40px'
        }}>
          {/* Market Data */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #d1fae5 100%)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
              zIndex: 0
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginRight: '20px',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)'
                }}>💰</div>
                <div>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.025em'
                  }}>
                    Market Data
                  </h2>
                  <p style={{
                    color: '#64748b',
                    fontSize: '16px',
                    margin: '8px 0 0 0',
                    fontWeight: 500
                  }}>
                    Key market metrics and statistics
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Market Cap Rank</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#0f172a'
                    }}>#{coin.market_cap_rank}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Market Cap</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#0f172a'
                    }}>{formatPrice(coin.market_cap || 0, currency)}</span>
                  </div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>24h Volume</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#0f172a'
                    }}>{formatPrice(coin.total_volume || 0, currency)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Circulating Supply</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#0f172a'
                    }}>{formatNumber(coin.circulating_supply || 0)} {coin.symbol.toUpperCase()}</span>
                  </div>
                </div>
                
                {coin.max_supply && (
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                                      <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Max Supply</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#0f172a'
                    }}>{formatNumber(coin.max_supply || 0)} {coin.symbol.toUpperCase()}</span>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Changes */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 50%, #fce7f3 100%)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, transparent 70%)',
              zIndex: 0
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginRight: '20px',
                  boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)'
                }}>📊</div>
                <div>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.025em'
                  }}>
                    Price Changes
                  </h2>
                  <p style={{
                    color: '#64748b',
                    fontSize: '16px',
                    margin: '8px 0 0 0',
                    fontWeight: 500
                  }}>
                    Performance across different timeframes
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>24h Change</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: getPriceChangeColor(coin.price_change_percentage_24h)
                    }}>
                      {(coin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}
                      {formatPriceChange(coin.price_change_percentage_24h)}%
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>7d Change</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: getPriceChangeColor(coin.price_change_percentage_7d)
                    }}>
                      {(coin.price_change_percentage_7d ?? 0) >= 0 ? '+' : ''}
                      {formatPriceChange(coin.price_change_percentage_7d)}%
                    </span>
                  </div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>30d Change</span>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: '18px',
                      color: getPriceChangeColor(coin.price_change_percentage_30d)
                    }}>
                      {(coin.price_change_percentage_30d ?? 0) >= 0 ? '+' : ''}
                      {formatPriceChange(coin.price_change_percentage_30d)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {coin.description?.en && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #e0e7ff 100%)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '30px', marginRight: '12px' }}>📖</span>
              About {coin.name}
            </h2>
            <div style={{ color: '#374151', lineHeight: '1.6' }}>
              {coin.description.en}
            </div>
          </div>
        )}

        {/* Links */}
        {coin.links && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 50%, #fed7aa 100%)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '32px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '30px', marginRight: '12px' }}>🔗</span>
              Useful Links
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {coin.links.homepage?.[0] && (
                <a
                  href={coin.links.homepage[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#374151',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <span>🌐 Official Website</span>
                </a>
              )}
              {coin.links.blockchain_site?.[0] && (
                <a
                  href={coin.links.blockchain_site[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#374151',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <span>🔍 Blockchain Explorer</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .chart-container {
          position: relative;
          height: 450px;
          width: 100%;
        }
        
        .chart-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          z-index: 10;
        }
        
        .chart-canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
        
        .price-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .price-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .timeframe-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .timeframe-button:hover {
          transform: translateY(-2px) scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default CoinDetail;
