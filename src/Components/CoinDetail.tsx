import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import WatchlistButton from './WatchlistButton';







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

        // Try direct API first, then fallback to proxy
        let response;
        const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}&interval=${timeframe === '1D' ? 'hourly' : 'daily'}`;

        try {
          // Try direct CoinGecko API first
          response = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Direct API failed');
          }
        } catch (directError) {
          // Try CORS proxy as fallback
          console.log('Direct API failed, trying proxy...');
          const proxyUrl = 'https://corsproxy.io/?';
          response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        }

        if (response && response.ok) {
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

        // If we get here, data fetch failed - use fallback
        throw new Error('Failed to fetch chart data');

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
    
    const chartHeight = window.innerWidth < 768 ? 300 : 400;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#64748b',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      grid: {
        vertLines: { color: '#f1f5f9', style: 1 },
        horzLines: { color: '#f1f5f9', style: 1 },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#f97316',
          width: 1,
          style: 2,
          labelBackgroundColor: '#f97316',
        },
        horzLine: {
          color: '#f97316',
          width: 1,
          style: 2,
          labelBackgroundColor: '#f97316',
        },
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Try different methods to add area series for better visual
    let areaSeries;
    try {
      // Method 1: Try addAreaSeries if it exists (lightweight-charts v4+)
      if (typeof (chart as any).addAreaSeries === 'function') {
        areaSeries = (chart as any).addAreaSeries({
          lineColor: '#f97316',
          topColor: 'rgba(249, 115, 22, 0.4)',
          bottomColor: 'rgba(249, 115, 22, 0.05)',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          crosshairMarkerBorderColor: '#f97316',
          crosshairMarkerBackgroundColor: '#ffffff',
        });
      } else if (typeof (chart as any).addLineSeries === 'function') {
        // Fallback to line series
        areaSeries = (chart as any).addLineSeries({
          color: '#f97316',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
        });
      } else {
        // Method 2: Try addSeries with Area type
        areaSeries = (chart as any).addSeries('Area', {
          lineColor: '#f97316',
          topColor: 'rgba(249, 115, 22, 0.4)',
          bottomColor: 'rgba(249, 115, 22, 0.05)',
          lineWidth: 2,
        });
      }
    } catch (error) {
      console.error('Error adding area series:', error);
      // Final fallback
      areaSeries = (chart as any).addLineSeries({
        color: '#f97316',
        lineWidth: 2,
      });
    }

    chartInstanceRef.current = chart;
    seriesRef.current = areaSeries;

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartInstanceRef.current) {
        const newHeight = window.innerWidth < 768 ? 300 : 400;
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
    const height = window.innerWidth < 768 ? 300 : 400;
    
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
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      try {
        cleanup = initializeChart();
      } catch (error) {
        console.error('Error initializing TradingView chart:', error);
        // If TradingView fails, we'll use the fallback SVG chart when data is available
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cleanup) {
        cleanup();
      }
    };
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

  // Get coin image URL from various sources
  const getCoinImageUrl = (coinId: string): string => {
    // Map of popular coin IDs to their CoinGecko image URLs
    const coinImageMap: { [key: string]: string } = {
      'bitcoin': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      'ethereum': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      'tether': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
      'binancecoin': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
      'ripple': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
      'usd-coin': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
      'solana': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      'cardano': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      'dogecoin': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
      'tron': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
      'polkadot': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
      'polygon': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
      'litecoin': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
      'shiba-inu': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
      'avalanche-2': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
      'chainlink': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
      'uniswap': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
      'stellar': 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
      'monero': 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
      'cosmos': 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
      'ethereum-classic': 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
      'filecoin': 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
      'hedera-hashgraph': 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
      'internet-computer': 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
      'aptos': 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
      'arbitrum': 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
      'optimism': 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
      'near': 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
      'vechain': 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png',
      'aave': 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
    };

    // Return from map if available
    if (coinImageMap[coinId]) {
      return coinImageMap[coinId];
    }

    // Try CoinGecko's thumb endpoint as fallback (smaller but reliable)
    return `https://assets.coingecko.com/coins/images/1/small/${coinId}.png`;
  };

  // Create basic mock data as fallback
  const createBasicMockCoinData = (id: string): CoinData => {
    return {
      id: id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
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
      image: getCoinImageUrl(id),
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
      background: '#f8fafc',
      position: 'relative'
    }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb',
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
            padding: '16px 0'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                padding: '8px 0',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f97316';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <span style={{
              fontSize: '12px',
              color: '#9ca3af',
              fontWeight: 500
            }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <div className="coin-detail-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Error Indicator */}
        {error && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <p style={{ color: '#92400e', fontWeight: 500, margin: 0, fontSize: '14px' }}>
              Showing sample data. Live data unavailable.
            </p>
          </div>
        )}
        
        {/* Coin Header */}
        <div className="coin-header" style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          padding: '32px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div className="coin-header-content" style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <img
                src={coin.image}
                alt={coin.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  marginRight: '20px',
                  backgroundColor: '#f3f4f6',
                  objectFit: 'contain'
                }}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Try CoinGecko CDN if current image fails
                  if (!target.src.includes('coingecko')) {
                    target.src = `https://assets.coingecko.com/coins/images/1/large/${coin.id}.png`;
                  } else {
                    // Final fallback - show coin initial
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.coin-fallback-icon')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'coin-fallback-icon';
                      fallback.style.cssText = 'width: 64px; height: 64px; border-radius: 12px; margin-right: 20px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 24px;';
                      fallback.textContent = coin.symbol?.charAt(0) || coin.name?.charAt(0) || '?';
                      parent.insertBefore(fallback, target);
                    }
                  }
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1f2937',
                    margin: 0
                  }}>{coin.name}</h1>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    background: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>{coin.symbol}</span>
                  {coin.market_cap_rank && (
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#f97316',
                      background: '#fff7ed',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>Rank #{coin.market_cap_rank}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#1f2937'
                  }}>{formatPrice(coin.current_price)}</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: coin.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {coin.price_change_percentage_24h >= 0 ? '↑' : '↓'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <WatchlistButton
                  coin={{
                    id: coin.id,
                    symbol: coin.symbol,
                    name: coin.name,
                    image: coin.image,
                    priceAtAdd: coin.current_price
                  }}
                  variant="button"
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              padding: '20px 0',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 500 }}>Market Cap</p>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0, fontWeight: 600 }}>{formatPrice(coin.market_cap)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 500 }}>24h Volume</p>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0, fontWeight: 600 }}>{formatPrice(coin.total_volume)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 500 }}>Circulating Supply</p>
                <p style={{ fontSize: '16px', color: '#1f2937', margin: 0, fontWeight: 600 }}>{coin.circulating_supply?.toLocaleString() || 'N/A'}</p>
              </div>
              {coin.max_supply && (
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 500 }}>Max Supply</p>
                  <p style={{ fontSize: '16px', color: '#1f2937', margin: 0, fontWeight: 600 }}>{coin.max_supply.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 4px 0' }}>Price Chart</h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                {coin?.name} price over time
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '6px',
              background: '#f3f4f6',
              padding: '4px',
              borderRadius: '10px'
            }}>
              {(['1D', '7D', '30D', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: timeframe === tf ? '#ffffff' : 'transparent',
                    color: timeframe === tf ? '#f97316' : '#6b7280',
                    boxShadow: timeframe === tf ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.color = '#f97316';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (timeframe !== tf) {
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div style={{
            position: 'relative',
            height: window.innerWidth < 768 ? '300px' : '400px',
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div ref={chartRef} style={{ height: '100%', width: '100%' }}></div>
            {chartLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f3f4f6',
                    borderTop: '3px solid #f97316',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 12px'
                  }}></div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: 500
                  }}>Loading chart...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {coin.description?.en && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>About {coin.name}</h2>
            <p style={{
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '1.7',
              margin: 0
            }} dangerouslySetInnerHTML={{
              __html: coin.description.en.split('. ').slice(0, 3).join('. ') + '.'
            }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Helper function to get coin image URL
function getDefaultCoinImageUrl(coinId: string): string {
  const coinImageMap: { [key: string]: string } = {
    'bitcoin': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    'ethereum': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'tether': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    'binancecoin': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    'ripple': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    'usd-coin': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    'solana': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    'cardano': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    'dogecoin': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    'tron': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
    'polkadot': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    'polygon': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    'litecoin': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
    'shiba-inu': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
    'avalanche-2': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    'chainlink': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    'uniswap': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  };

  if (coinImageMap[coinId]) {
    return coinImageMap[coinId];
  }

  // Use CoinGecko CDN pattern as fallback
  return `https://assets.coingecko.com/coins/images/1/large/${coinId}.png`;
}

// Helper function to create mock coin data
function createBasicMockCoinData(coinId: string | undefined): CoinData {
  const id = coinId || 'unknown';
  return {
    id: id,
    name: coinId ? coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' ') : 'Unknown Coin',
    symbol: coinId?.substring(0, 4).toUpperCase() || 'UNK',
    current_price: Math.random() * 1000,
    price_change_percentage_24h: (Math.random() - 0.5) * 20,
    price_change_percentage_7d: (Math.random() - 0.5) * 30,
    price_change_percentage_30d: (Math.random() - 0.5) * 50,
    market_cap: Math.floor(Math.random() * 10000000000),
    market_cap_rank: Math.floor(Math.random() * 100) + 1,
    total_volume: Math.floor(Math.random() * 1000000000),
    circulating_supply: Math.floor(Math.random() * 100000000),
    total_supply: Math.floor(Math.random() * 200000000),
    max_supply: Math.random() > 0.5 ? Math.floor(Math.random() * 500000000) : null,
    image: getDefaultCoinImageUrl(id),
    description: { en: 'Sample cryptocurrency data. Live data is currently unavailable.' },
    links: {
      homepage: [],
      blockchain_site: [],
      official_forum_url: [],
      chat_url: [],
      announcement_url: [],
      repos_url: { github: [], bitbucket: [] }
    },
    market_data: {
      price_change_24h_in_currency: {},
      market_cap_change_24h_in_currency: {},
      total_volume: {},
      market_cap: {}
    }
  };
}

export default CoinDetail;
