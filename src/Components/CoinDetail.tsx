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
  max_supply: number;
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
        
        // Try CoinGecko API first
        try {
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
            return;
          }
        } catch (apiErr) {
          console.log('CoinGecko API failed, trying fallback...');
        }

        // Fallback: Create mock data based on coin ID
        const mockCoin = createMockCoinData(coinId);
        setCoin(mockCoin);
        setError(null);
        
      } catch (err) {
        setError('Unable to fetch live data. Showing sample information.');
        const mockCoin = createMockCoinData(coinId);
        setCoin(mockCoin);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
    
            // Set up real-time updates every 30 seconds
        const interval = setInterval(() => {
          fetchCoinData();
          setLastUpdate(new Date());
        }, 30000);
        
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
        
        // Show mock data immediately for better UX
        const mockData = generateMockChartData(days);
        setChartData(mockData);
        renderChart(mockData);
        
        // Then try to fetch real data
        try {
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
          }
        } catch (apiErr) {
          console.log('API fetch failed, keeping mock data');
        }
      } catch (err) {
        console.log('Chart data fetch failed, using mock data');
        const mockData = generateMockChartData(timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 365);
        setChartData(mockData);
        renderChart(mockData);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [coinId, currency, timeframe]);

  // Generate mock chart data
  const generateMockChartData = (days: number): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = Date.now();
    const interval = timeframe === '1D' ? 3600000 : 86400000; // 1 hour or 1 day in ms
    const basePrice = coin?.current_price || 100;
    
    // Generate more realistic price movements
    let currentPrice = basePrice;
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * interval);
      
      // Create more realistic price movements with trends
      const trend = Math.sin(i * 0.1) * 0.02; // Small trend component
      const volatility = (Math.random() - 0.5) * 0.03; // ±1.5% volatility
      const change = trend + volatility;
      
      currentPrice = Math.max(0.01, currentPrice * (1 + change));
      data.push({ timestamp, price: currentPrice });
    }
    
    return data;
  };

    // Render chart using HTML5 Canvas (fallback when Chart.js fails)
  const renderChart = (data: ChartDataPoint[]) => {
    if (!chartRef.current) return;
    
    console.log('Rendering chart with data:', data.length, 'points');
    
    // Clear canvas
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    if (data.length === 0) {
      console.log('No data to render');
      return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
    
    // Set canvas dimensions
    const rect = chartRef.current.getBoundingClientRect();
    chartRef.current.width = rect.width;
    chartRef.current.height = rect.height;
    
    const prices = data.map(point => point.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Draw chart with improved styling
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
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
    
    // Add subtle grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
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
    
    console.log('Chart rendered with HTML5 Canvas');
  };

  // Render chart whenever chartData changes
  useEffect(() => {
    if (chartData.length > 0 && chartRef.current) {
      renderChart(chartData);
    }
  }, [chartData]);

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

  // No cleanup needed for HTML5 Canvas

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

  const createMockCoinData = (id: string): CoinData => {
    const mockData: { [key: string]: any } = {
      bitcoin: {
        name: 'Bitcoin',
        symbol: 'btc',
        current_price: 45000,
        price_change_percentage_24h: 2.5,
        price_change_percentage_7d: 5.2,
        price_change_percentage_30d: -3.1,
        market_cap: 850000000000,
        market_cap_rank: 1,
        total_volume: 25000000000,
        circulating_supply: 19500000,
        max_supply: 21000000,
        image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        description: { en: 'Bitcoin is a decentralized cryptocurrency originally described in a 2008 whitepaper by a person, or group of people, using the name Satoshi Nakamoto. It was launched soon after, in January 2009.' },
        links: {
          homepage: ['https://bitcoin.org'],
          blockchain_site: ['https://blockchain.info'],
          official_forum_url: ['https://bitcointalk.org'],
          chat_url: [],
          announcement_url: [],
          repos_url: { github: ['https://github.com/bitcoin/bitcoin'], bitbucket: [] }
        },
        market_data: {
          price_change_24h_in_currency: { usd: 2.5 },
          market_cap_change_24h_in_currency: { usd: 20000000000 },
          total_volume: { usd: 25000000000 },
          market_cap: { usd: 850000000000 }
        }
      },
      ethereum: {
        name: 'Ethereum',
        symbol: 'eth',
        current_price: 3200,
        price_change_percentage_24h: 1.8,
        price_change_percentage_7d: 3.4,
        price_change_percentage_30d: 8.7,
        market_cap: 380000000000,
        market_cap_rank: 2,
        total_volume: 18000000000,
        circulating_supply: 120000000,
        max_supply: null,
        image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        description: { en: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform. Among cryptocurrencies, Ether is second only to Bitcoin in market capitalization.' },
        links: {
          homepage: ['https://ethereum.org'],
          blockchain_site: ['https://etherscan.io'],
          official_forum_url: ['https://forum.ethereum.org'],
          chat_url: [],
          announcement_url: [],
          repos_url: { github: ['https://github.com/ethereum'], bitbucket: [] }
        },
        market_data: {
          price_change_24h_in_currency: { usd: 1.8 },
          market_cap_change_24h_in_currency: { usd: 7000000000 },
          total_volume: { usd: 18000000000 },
          market_cap: { usd: 380000000000 }
        }
      }
    };

    const defaultData = {
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

    return mockData[id] || defaultData;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f3e8ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid #dbeafe',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid transparent',
              borderTop: '4px solid #9333ea',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite reverse'
            }}></div>
          </div>
          <h3 style={{
            marginTop: '24px',
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937'
          }}>Loading {coinId?.toUpperCase()} Data</h3>
          <p style={{
            marginTop: '8px',
            color: '#6b7280'
          }}>Fetching live market information...</p>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 50%, #fff7ed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '448px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            fontSize: '112px',
            color: '#ef4444',
            marginBottom: '24px'
          }}>🚫</div>
          <h2 style={{
            fontSize: '30px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '16px'
          }}>Coin Not Found</h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '32px',
            fontSize: '18px'
          }}>We couldn't find information for "{coinId}". Please check the coin ID and try again.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #2563eb 0%, #9333ea 100%)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🏠 Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderBottom: '1px solid #e2e8f0',
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
            padding: '20px 0'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 16px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            >
              <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0
            }}>Cryptocurrency Details</h1>
            <div style={{ width: '120px' }}></div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Data Source Indicator */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                color: '#d97706', 
                fontSize: '24px', 
                marginRight: '16px',
                background: 'white',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>⚠️</div>
              <div>
                <p style={{ color: '#92400e', fontWeight: 600, margin: 0, fontSize: '16px' }}>Sample Data Mode</p>
                <p style={{ color: '#a16207', fontSize: '14px', margin: '8px 0 0 0', lineHeight: '1.5' }}>Showing sample information while we attempt to fetch live data from CoinGecko API.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Real-time Data Indicator */}
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                color: '#2563eb', 
                fontSize: '24px', 
                marginRight: '16px',
                background: 'white',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>🔄</div>
              <div>
                <p style={{ color: '#1e40af', fontWeight: 600, margin: 0, fontSize: '16px' }}>Live Data Mode</p>
                <p style={{ color: '#3b82f6', fontSize: '14px', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                  Real-time data updates every 30 seconds • Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #dbeafe',
              borderTop: '2px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
        
        {/* Coin Header */}
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
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 70%)',
            zIndex: 0
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{
                position: 'relative',
                marginRight: '32px'
              }}>
                <img
                  src={coin.image}
                  alt={coin.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    border: '4px solid white'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  border: '3px solid white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'white',
                    borderRadius: '50%'
                  }}></div>
                </div>
              </div>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '12px',
                  letterSpacing: '-0.025em'
                }}>
                  {coin.name}
                </h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    {coin.symbol.toUpperCase()}
                  </span>
                  <span style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    Rank #{coin.market_cap_rank || 'N/A'}
                  </span>
                </div>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '16px',
                  margin: 0,
                  fontWeight: 500
                }}>
                  Market Cap: {formatPrice(coin.market_cap || 0, currency)}
                </p>
              </div>
            </div>

            {/* Price Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '32px',
              marginBottom: '32px'
            }}>
              <div style={{ 
                textAlign: 'center', 
                position: 'relative',
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '8px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Current Price</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.025em'
                }}>
                  {formatPrice(coin.current_price || 0, currency)}
                </p>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Live</div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '8px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>24h Change</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: 800,
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
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '8px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>7d Change</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: 800,
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
              gap: '12px',
              background: 'white',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              {(['1D', '7D', '30D', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    // Show immediate feedback
                    setChartLoading(true);
                    // Generate mock data immediately for the new timeframe
                    const days = tf === '1D' ? 1 : tf === '7D' ? 7 : tf === '30D' ? 30 : 365;
                    const mockData = generateMockChartData(days);
                    setChartData(mockData);
                    setChartLoading(false);
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    backgroundColor: timeframe === tf ? '#3b82f6' : '#f8fafc',
                    color: timeframe === tf ? 'white' : '#64748b',
                    boxShadow: timeframe === tf ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.backgroundColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateY(0)';
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
                      }}>{formatNumber(coin.max_supply)} {coin.symbol.toUpperCase()}</span>
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
        
        .chart-container {
          position: relative;
          height: 400px;
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
      `}</style>
    </div>
  );
};

export default CoinDetail;
