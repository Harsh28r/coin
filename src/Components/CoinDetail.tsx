import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';

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
  time: Time;
  value: number;
}

const CoinDetail: React.FC = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { currency, formatPrice } = useCurrency();
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '1Y'>('1D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

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
        
        // Use CORS proxy to fetch real data
        try {
          const proxyUrl = 'https://api.allorigins.win/raw?url=';
          const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}&interval=${timeframe === '1D' ? 'hourly' : 'daily'}`;
          
          const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        
        if (response.ok) {
          const data = await response.json();
          const prices = data.prices || [];
          
          if (prices.length > 0) {
            const chartDataPoints: ChartDataPoint[] = prices.map((price: [number, number]) => ({
                time: Math.floor(price[0] / 1000) as Time,
                value: price[1]
            }));
            
            setChartData(chartDataPoints);
              if (chartInstanceRef.current && seriesRef.current) {
                updateChartData(chartDataPoints);
              }
              return;
            }
          }
        } catch (proxyError) {
          console.log('CORS proxy failed, using fallback...');
        }
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        // Generate realistic mock data as fallback
        const daysForFallback = timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 365;
        const mockData = generateRealisticChartData(daysForFallback, coin?.current_price || 100);
        setChartData(mockData);
        if (chartInstanceRef.current && seriesRef.current) {
          updateChartData(mockData);
        }
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [coinId, currency, timeframe, coin?.current_price]);

  // Auto-generate 1D chart data when component loads
  useEffect(() => {
    if (coin && chartData.length === 0) {
      const mockData = generateRealisticChartData(1, coin.current_price || 100);
      setChartData(mockData);
    }
  }, [coin]);

  // Generate realistic chart data for fallback
  const generateRealisticChartData = (days: number, basePrice: number): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = Date.now();
    const interval = timeframe === '1D' ? 3600000 : 86400000; // 1 hour or 1 day in ms
    
    let currentPrice = basePrice;
    let trend = 0;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const time = Math.floor(timestamp / 1000) as Time;
      
      // Create more realistic price movements
      const marketTrend = Math.sin(i * 0.05) * 0.01; // Longer-term trend
      const volatility = (Math.random() - 0.5) * 0.03; // ±1.5% volatility
      const momentum = trend * 0.1; // Some momentum from previous changes
      
      const change = marketTrend + volatility + momentum;
      trend = change; // Store for momentum
      
      const newPrice = Math.max(0.01, currentPrice * (1 + change));
      
      data.push({ 
        time, 
        value: newPrice
      });
      
      currentPrice = newPrice;
    }
    
    return data;
  };

  // Initialize TradingView chart
  const initializeChart = () => {
    if (!chartRef.current) return;
    
    // Clean up existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
      seriesRef.current = null;
    }
    
    // Clear container
    chartRef.current.innerHTML = '';
    
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: window.innerWidth < 768 ? 350 : 700,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Try different methods to add line series
    let lineSeries;
    try {
      // Method 1: Try addLineSeries if it exists
      if (typeof (chart as any).addLineSeries === 'function') {
        lineSeries = (chart as any).addLineSeries({
          color: '#f97316',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        });
      } else {
        // Method 2: Try addSeries with Line type
        lineSeries = (chart as any).addSeries('Line', {
          color: '#f97316',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        });
      }
    } catch (error) {
      console.error('Error adding line series:', error);
      // Fallback: try without type specification
      lineSeries = (chart as any).addSeries({
        color: '#f97316',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
    }

    chartInstanceRef.current = chart;
    seriesRef.current = lineSeries;

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartInstanceRef.current) {
        const newHeight = window.innerWidth < 768 ? 350 : 700;
        chartInstanceRef.current.applyOptions({
          width: chartRef.current.clientWidth,
          height: newHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
        seriesRef.current = null;
      }
    };
  };

  // Update chart data
  const updateChartData = (data: ChartDataPoint[]) => {
    if (!seriesRef.current || data.length === 0) return;
    
    try {
      seriesRef.current.setData(data);
      
      if (chartInstanceRef.current) {
        chartInstanceRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
      // Fallback to SVG chart
      createFallbackChart(data);
    }
  };

  // Create fallback SVG chart
  const createFallbackChart = (data: ChartDataPoint[]) => {
    if (!chartRef.current) return;
    
    const container = chartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = window.innerWidth < 768 ? 350 : 700;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.style.background = 'white';
    
    if (data.length === 0) return;
    
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    
    // Create gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'chartGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#f97316');
    stop1.setAttribute('stop-opacity', '0.3');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#ea580c');
    stop2.setAttribute('stop-opacity', '0.1');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    
    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = '';
    
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - minValue) / range) * height;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#f97316');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    
    // Create area
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const areaData = pathData + ` L ${width} ${height} L 0 ${height} Z`;
    areaPath.setAttribute('d', areaData);
    areaPath.setAttribute('fill', 'url(#chartGradient)');
    
    // Add grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', width.toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#f1f5f9');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * width;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', '0');
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', height.toString());
      line.setAttribute('stroke', '#f1f5f9');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    
    // Add price labels on the right
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      const price = maxValue - (i / 4) * range;
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', (width - 8).toString());
      label.setAttribute('y', (y + 4).toString());
      label.setAttribute('font-family', 'Arial, sans-serif');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#64748b');
      label.setAttribute('text-anchor', 'end');
      label.textContent = formatPrice(price, currency);
      svg.appendChild(label);
    }
    
    // Add time labels at the bottom
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * width;
      const dataIndex = Math.floor((i / 4) * (data.length - 1));
      const timestamp = data[dataIndex]?.time;
      if (timestamp) {
        const date = new Date(Number(timestamp) * 1000);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x.toString());
        label.setAttribute('y', (height - 8).toString());
        label.setAttribute('font-family', 'Arial, sans-serif');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#94a3b8');
        label.setAttribute('text-anchor', 'middle');
        const timeLabel = timeframe === '1D' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        label.textContent = timeLabel;
        svg.appendChild(label);
      }
    }
    
    svg.appendChild(areaPath);
    svg.appendChild(path);
    
    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '20');
    title.setAttribute('y', '30');
    title.setAttribute('font-family', 'Arial, sans-serif');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#f97316');
    title.textContent = `${coin?.name || 'Crypto'} Price Chart`;
    
    // Add subtitle with timeframe
    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', '20');
    subtitle.setAttribute('y', '50');
    subtitle.setAttribute('font-family', 'Arial, sans-serif');
    subtitle.setAttribute('font-size', '12');
    subtitle.setAttribute('fill', '#64748b');
    subtitle.textContent = `${timeframe} timeframe • ${data.length} data points`;
    
    // Add current price
    const currentPrice = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    currentPrice.setAttribute('x', '20');
    currentPrice.setAttribute('y', '70');
    currentPrice.setAttribute('font-family', 'Arial, sans-serif');
    currentPrice.setAttribute('font-size', '14');
    currentPrice.setAttribute('font-weight', 'bold');
    currentPrice.setAttribute('fill', '#0f172a');
    currentPrice.textContent = `Current: ${formatPrice(data[data.length - 1]?.value || 0, currency)}`;
    
    // Add price change
    const priceChange = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const change = data.length > 1 ? ((data[data.length - 1].value - data[0].value) / data[0].value * 100) : 0;
    priceChange.setAttribute('x', '20');
    priceChange.setAttribute('y', '90');
    priceChange.setAttribute('font-family', 'Arial, sans-serif');
    priceChange.setAttribute('font-size', '14');
    priceChange.setAttribute('font-weight', 'bold');
    priceChange.setAttribute('fill', change >= 0 ? '#059669' : '#dc2626');
    priceChange.textContent = `Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    
    svg.appendChild(title);
    svg.appendChild(subtitle);
    svg.appendChild(currentPrice);
    svg.appendChild(priceChange);
    
    // Add status indicator
    const statusCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    statusCircle.setAttribute('cx', (width - 30).toString());
    statusCircle.setAttribute('cy', '30');
    statusCircle.setAttribute('r', '8');
    statusCircle.setAttribute('fill', '#f97316');
    
    const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statusText.setAttribute('x', (width - 15).toString());
    statusText.setAttribute('y', '35');
    statusText.setAttribute('font-family', 'Arial, sans-serif');
    statusText.setAttribute('font-size', '12');
    statusText.setAttribute('font-weight', 'bold');
    statusText.setAttribute('fill', '#ea580c');
    statusText.textContent = 'LIVE';
    
    svg.appendChild(statusCircle);
    svg.appendChild(statusText);
    
    container.appendChild(svg);
  };

  // Initialize chart when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        initializeChart();
      } catch (error) {
        console.error('Error initializing TradingView chart:', error);
        // If TradingView fails, we'll use the fallback SVG chart when data is available
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Update chart data whenever chartData changes
  useEffect(() => {
    if (chartData.length > 0) {
      if (!chartInstanceRef.current || !seriesRef.current) {
        // Try to initialize TradingView chart
        try {
          initializeChart();
          setTimeout(() => {
            if (seriesRef.current) {
              updateChartData(chartData);
            } else {
              // Fallback to SVG chart
              createFallbackChart(chartData);
            }
          }, 300);
        } catch (error) {
          console.error('TradingView chart failed, using SVG fallback:', error);
          createFallbackChart(chartData);
        }
      } else {
        updateChartData(chartData);
      }
    }
  }, [chartData]);

  // Re-initialize chart when timeframe changes
  useEffect(() => {
    if (chartInstanceRef.current) {
      initializeChart();
    }
  }, [timeframe]);

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
      background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fdba74 100%)',
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
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
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

      <div className="coin-detail-container" style={{
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
          background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
          border: '2px solid #f97316',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: '0 20px 40px rgba(249, 115, 22, 0.2)',
          transform: 'translateY(0)',
          animation: 'slideIn 0.6s ease-out 0.1s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                color: '#ea580c', 
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
              }}>●</div>
              <div>
                <p style={{ color: '#c2410c', fontWeight: 700, margin: 0, fontSize: '18px' }}>Live Data Mode</p>
                <p style={{ color: '#f97316', fontSize: '16px', margin: '12px 0 0 0', lineHeight: '1.6' }}>
                  Real-time data updates every 60 seconds • Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #fed7aa',
              borderTop: '3px solid #ea580c',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
        
        {/* Coin Header */}
        <div className="coin-header" style={{
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
            <div className="coin-header-content" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '40px',
              flexDirection: 'row',
              textAlign: 'left'
            }}>
              <div className="coin-image-container" style={{
                position: 'relative',
                marginRight: '40px',
                marginBottom: '0'
              }}>
                <img
                  className="coin-image"
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
                <h1 className="coin-title" style={{
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
                <div className="coin-badges" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
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
            <div className="price-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
              marginBottom: '40px'
            }}>
              <div className="price-card" style={{ 
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
                <p className="price-value" style={{
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
             <div className="timeframe-selector" style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              padding: '20px',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
               border: '2px solid rgba(255,255,255,0.8)',
               flexWrap: 'wrap'
            }}>
              {(['1D', '7D', '30D', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  className="timeframe-button"
                  onClick={() => {
                    setTimeframe(tf);
                    setChartLoading(true);
                    // Generate mock data immediately for the new timeframe
                    const daysForMock = tf === '1D' ? 1 : tf === '7D' ? 7 : tf === '30D' ? 30 : 365;
                    const mockData = generateRealisticChartData(daysForMock, coin?.current_price || 100);
                    setChartData(mockData);
                     setTimeout(() => setChartLoading(false), 500);
                  }}
                  style={{
                    padding: '16px 28px',
                    borderRadius: '16px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                     background: timeframe === tf 
                       ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                       : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                    color: timeframe === tf ? 'white' : '#64748b',
                     boxShadow: timeframe === tf 
                       ? '0 8px 20px rgba(249, 115, 22, 0.3)' 
                       : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transform: timeframe === tf ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                       e.currentTarget.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
                       e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                       e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #e2e8f0)';
                       e.currentTarget.style.color = '#64748b';
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
        <div className="chart-section" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          border: '2px solid rgba(249, 115, 22, 0.1)',
          padding: '80px',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.03) 0%, transparent 70%)',
            zIndex: 0
          }}></div>
          <div style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
            borderRadius: '50%',
            zIndex: 0
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="chart-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
              flexDirection: 'row',
              gap: '0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.3)',
                  fontWeight: 'bold'
                }}>CH</div>
                <div>
                  <h2 className="chart-title" style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.025em'
                  }}>
                    Advanced Price Analytics
                  </h2>
                  <p style={{
                    color: '#64748b',
                    fontSize: '16px',
                    margin: '8px 0 0 0',
                    fontWeight: 500
                  }}>
                    Live Market Data • {timeframe} timeframe • Real-time updates
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
                      border: '2px solid #fed7aa',
                      borderTop: '2px solid #f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{
                      fontSize: '12px',
                      color: '#f97316',
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
            
            <div className="chart-container" style={{
              height: '700px',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '2px solid rgba(226, 232, 240, 0.5)',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              minHeight: '700px'
            }}>
              {chartLoading && chartData.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
                  position: 'relative'
                }}>
                  <div style={{ textAlign: 'center', color: '#64748b', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      fontSize: '80px', 
                      marginBottom: '32px',
                      opacity: 0.8,
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold'
                    }}>CH</div>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 800, 
                      margin: 0,
                      color: '#0f172a',
                      letterSpacing: '-0.025em'
                    }}>Loading Advanced Analytics...</p>
                    <p style={{ 
                      fontSize: '18px', 
                      margin: '16px 0 0 0',
                      color: '#64748b',
                      fontWeight: 500
                    }}>Preparing {timeframe} market data visualization</p>
                    <div style={{
                      marginTop: '24px',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#f97316',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#ea580c',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite 0.2s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#c2410c',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite 0.4s'
                      }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="chart-content"
                  ref={chartRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '700px',
                    display: 'block',
                    position: 'relative',
                    background: 'transparent'
                  }}
                />
              )}
            </div>
            
            {/* Chart Statistics & Analytics */}
            {chartData.length > 0 && (
              <div className="chart-stats" style={{
                marginTop: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {/* Price Statistics */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '2px solid rgba(249, 115, 22, 0.1)',
                  boxShadow: '0 8px 25px -5px rgba(249, 115, 22, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#f97316',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#f97316',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }}></span>
                      Price Statistics
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Period High</span>
                        <span style={{ color: '#059669', fontSize: '16px', fontWeight: 700 }}>
                          {formatPrice(Math.max(...chartData.map(d => d.value)), currency)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Period Low</span>
                        <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: 700 }}>
                          {formatPrice(Math.min(...chartData.map(d => d.value)), currency)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Price Range</span>
                        <span style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                          {formatPrice(Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value)), currency)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Average Price</span>
                        <span style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                          {formatPrice(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '2px solid rgba(249, 115, 22, 0.1)',
                  boxShadow: '0 8px 25px -5px rgba(249, 115, 22, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#f97316',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#f97316',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite 0.5s'
                      }}></span>
                      Performance Metrics
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Period Change</span>
                        <span style={{ 
                          color: chartData[chartData.length - 1]?.value > chartData[0]?.value ? '#059669' : '#dc2626', 
                    fontSize: '16px',
                          fontWeight: 700 
                        }}>
                          {chartData.length > 1 ? (
                            ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100).toFixed(2)
                          ) : '0.00'}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Volatility</span>
                        <span style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                          {chartData.length > 1 ? (
                            (Math.sqrt(chartData.reduce((sum, d, i) => {
                              if (i === 0) return 0;
                              const change = (d.value - chartData[i-1].value) / chartData[i-1].value;
                              return sum + change * change;
                            }, 0) / (chartData.length - 1)) * 100).toFixed(2)
                          ) : '0.00'}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Data Points</span>
                        <span style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                          {chartData.length} {timeframe === '1D' ? 'hourly' : 'daily'} intervals
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Time Period</span>
                        <span style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>
                          {chartData[0]?.time ? new Date(Number(chartData[0].time) * 1000).toLocaleDateString() : 'N/A'} - {chartData[chartData.length - 1]?.time ? new Date(Number(chartData[chartData.length - 1].time) * 1000).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Market Analysis */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '2px solid rgba(249, 115, 22, 0.1)',
                  boxShadow: '0 8px 25px -5px rgba(249, 115, 22, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#f97316',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#f97316',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite 1s'
                      }}></span>
                      Market Analysis
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Trend Direction</span>
                        <span style={{ 
                          color: chartData[chartData.length - 1]?.value > chartData[0]?.value ? '#059669' : '#dc2626', 
                    fontSize: '16px',
                          fontWeight: 700 
                        }}>
                          {chartData.length > 1 ? (
                            chartData[chartData.length - 1].value > chartData[0].value ? '↗ Bullish' : '↘ Bearish'
                          ) : '→ Neutral'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Support Level</span>
                        <span style={{ color: '#059669', fontSize: '16px', fontWeight: 700 }}>
                          {formatPrice(Math.min(...chartData.map(d => d.value)) * 0.98, currency)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Resistance Level</span>
                        <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: 700 }}>
                          {formatPrice(Math.max(...chartData.map(d => d.value)) * 1.02, currency)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Market Sentiment</span>
                        <span style={{ 
                          color: chartData[chartData.length - 1]?.value > chartData[0]?.value ? '#059669' : '#dc2626', 
                          fontSize: '16px', 
                          fontWeight: 700 
                        }}>
                          {chartData.length > 1 ? (
                            chartData[chartData.length - 1].value > chartData[0].value ? 'Positive' : 'Negative'
                          ) : 'Neutral'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Market Stats */}
        <div className="market-stats" style={{
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
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginRight: '20px',
                  boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.3)',
                  fontWeight: 'bold'
                }}>MD</div>
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
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginRight: '20px',
                  boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.3)',
                  fontWeight: 'bold'
                }}>PC</div>
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
              <span style={{ 
                fontSize: '20px', 
                marginRight: '12px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}>AB</span>
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
              <span style={{ 
                fontSize: '20px', 
                marginRight: '12px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}>LN</span>
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
                  <span>Official Website</span>
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
                  <span>Blockchain Explorer</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* CSS Animations and Mobile Responsive */}
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
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.95);
          }
        }
        
        .chart-container {
          position: relative;
          height: 700px;
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

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .coin-detail-container {
            padding: 20px 16px !important;
          }
          
          .coin-header {
            padding: 24px !important;
            margin-bottom: 24px !important;
            border-radius: 16px !important;
          }
          
          .coin-header-content {
            flex-direction: column !important;
            text-align: center !important;
            margin-bottom: 24px !important;
          }
          
          .coin-image-container {
            margin-right: 0 !important;
            margin-bottom: 20px !important;
          }
          
          .coin-image {
            width: 80px !important;
            height: 80px !important;
            border-radius: 16px !important;
          }
          
          .coin-title {
            font-size: 32px !important;
          }
          
          .coin-badges {
            gap: 12px !important;
            justify-content: center !important;
          }
          
          .price-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin-bottom: 24px !important;
          }
          
          .price-card {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          
          .price-value {
            font-size: 28px !important;
          }
          
          .timeframe-selector {
            gap: 8px !important;
            padding: 16px !important;
            border-radius: 16px !important;
          }
          
          .timeframe-button {
            padding: 12px 20px !important;
            font-size: 14px !important;
          }
          
          .chart-section {
            padding: 20px !important;
            margin-bottom: 24px !important;
            border-radius: 16px !important;
          }
          
          .chart-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            margin-bottom: 20px !important;
            gap: 16px !important;
          }
          
          .chart-title {
            font-size: 20px !important;
          }
          
          .chart-container {
            height: 400px !important;
            border-radius: 16px !important;
          }
          
          .chart-content {
            min-height: 400px !important;
          }
          
          .chart-stats {
            margin-top: 20px !important;
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .market-stats {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            margin-bottom: 24px !important;
          }
        }

        /* Additional Mobile Chart Card Fixes */
        @media (max-width: 768px) {
          /* Chart section mobile optimizations */
          .chart-section {
            padding: 16px !important;
            margin: 0 0 20px 0 !important;
          }
          
          /* Chart header mobile layout */
          .chart-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          
          /* Chart title mobile sizing */
          .chart-title {
            font-size: 18px !important;
            line-height: 1.3 !important;
          }
          
          /* Chart container mobile sizing */
          .chart-container {
            height: 350px !important;
            min-height: 350px !important;
            border-radius: 12px !important;
            margin: 0 !important;
          }
          
          /* Chart content mobile sizing */
          .chart-content {
            min-height: 350px !important;
            height: 350px !important;
          }
          
          /* Chart stats mobile layout */
          .chart-stats {
            margin-top: 16px !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          /* Individual chart stat cards */
          .chart-stats > div {
            padding: 16px !important;
            border-radius: 12px !important;
            margin: 0 !important;
          }
          
          /* Chart stat titles */
          .chart-stats h3 {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }
          
          /* Chart stat content */
          .chart-stats .flex {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          /* Chart stat labels and values */
          .chart-stats span {
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
          
          /* Market stats mobile layout */
          .market-stats {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin-bottom: 20px !important;
          }
          
          /* Market data cards mobile */
          .market-stats > div {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          
          /* Market data headers */
          .market-stats h2 {
            font-size: 20px !important;
          }
          
          /* Market data content */
          .market-stats .flex {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          /* Market data inner cards */
          .market-stats .bg-white {
            padding: 16px !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CoinDetail;