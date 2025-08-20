import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Table, Card, Button, Modal, ButtonGroup, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CryptoData {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  supply: number;
  max_supply: number | null;
  market_cap_usd: number;
  volume_usd_24h: number;
  price_usd: number;
  change_percent_24h: number;
  image: string;
}

interface IChart {
  data: { labels: string[]; prices: number[] };
  title: string;
  style?: React.CSSProperties;
}

// Chart component using react-chartjs-2 with 3D-like aesthetic
const Chart: React.FC<IChart> = ({ data, title, style }) => {
  const shadowPlugin = useMemo(() => ({
    id: 'lineShadow',
    beforeDatasetDraw(chart: any, args: any) {
      const { ctx } = chart;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;
    },
    afterDatasetDraw(chart: any) {
      chart.ctx.restore();
    },
  }), []);

  const glossyBackground = useMemo(() => ({
    id: 'glossyBackground',
    beforeDraw(chart: any) {
      const { ctx, chartArea } = chart;
      const { top, bottom, left, right } = chartArea || {};
      if (!top) return;
      const grd = ctx.createLinearGradient(0, top, 0, bottom);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(1, 'rgba(245,247,250,0.95)');
      ctx.save();
      ctx.fillStyle = grd;
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.restore();
    },
  }), []);

  const chartData: any = useMemo(() => ({
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.prices,
        borderColor: (context: any) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return '#fb923c';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#fb923c');
          gradient.addColorStop(1, '#f59e0b');
          return gradient;
        },
        backgroundColor: (context: any) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(251, 146, 60, 0.25)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
          gradient.addColorStop(1, 'rgba(251, 146, 60, 0.02)');
          return gradient;
        },
        fill: true,
        borderWidth: 3,
        tension: 0.45,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        borderJoinStyle: 'round',
        borderCapStyle: 'round',
      },
    ],
  }), [data.labels, data.prices, title]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, font: { size: 16 } },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        displayColors: false,
        padding: 10,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Time' },
        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
        ticks: { color: '#6b7280' },
      },
      y: {
        title: { display: true, text: 'Price (USD)' },
        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
        ticks: { color: '#6b7280' },
      },
    },
    animation: {
      duration: 900,
      easing: 'easeOutCubic',
    },
    elements: {
      line: { tension: 0.45 },
      point: { radius: 0, hoverRadius: 4, hitRadius: 10 },
    },
  } as const;

  return (
    <div style={style} className="bg-white rounded position-relative" >
      <Line data={chartData} options={options} plugins={[glossyBackground, shadowPlugin]} />
    </div>
  );
};

const MarketPriceAndNews: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [historicalData, setHistoricalData] = useState<{ labels: string[]; prices: number[] } | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('1d');
  const [error, setError] = useState<string | null>(null);

  // Optional: Add your CoinGecko API key here (if using paid tier)
  const API_KEY = ''; // Replace with your API key or leave empty for free tier

  // Cache data to localStorage with TTL
  const cacheData = (key: string, data: any, ttl: number) => {
    const cacheItem = { data, expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  };

  const getCachedData = (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, expiry } = JSON.parse(cached);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  };

  useEffect(() => {
    // Mock crypto data as fallback to avoid CORS issues
    const mockCryptoData: CryptoData[] = [
      {
        id: 'bitcoin',
        rank: 1,
        symbol: 'btc',
        name: 'Bitcoin',
        supply: 19400000,
        max_supply: 21000000,
        market_cap_usd: 800000000000,
        volume_usd_24h: 25000000000,
        price_usd: 41250.50,
        change_percent_24h: 2.5,
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1696501400'
      },
      {
        id: 'ethereum',
        rank: 2,
        symbol: 'eth',
        name: 'Ethereum',
        supply: 120000000,
        max_supply: null,
        market_cap_usd: 280000000000,
        volume_usd_24h: 15000000000,
        price_usd: 2333.33,
        change_percent_24h: -1.2,
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628'
      },
      {
        id: 'binancecoin',
        rank: 3,
        symbol: 'bnb',
        name: 'BNB',
        supply: 155000000,
        max_supply: 200000000,
        market_cap_usd: 45000000000,
        volume_usd_24h: 800000000,
        price_usd: 290.32,
        change_percent_24h: 0.8,
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501690'
      },
      {
        id: 'solana',
        rank: 4,
        symbol: 'sol',
        name: 'Solana',
        supply: 400000000,
        max_supply: null,
        market_cap_usd: 18000000000,
        volume_usd_24h: 1200000000,
        price_usd: 45.00,
        change_percent_24h: 5.2,
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png?1696501756'
      },
      {
        id: 'cardano',
        rank: 5,
        symbol: 'ada',
        name: 'Cardano',
        supply: 35000000000,
        max_supply: 45000000000,
        market_cap_usd: 15000000000,
        volume_usd_24h: 600000000,
        price_usd: 0.43,
        change_percent_24h: -0.5,
        image: 'https://assets.coingecko.com/coins/images/975/large/Cardano_Logo.png?1696501792'
      },
      {
        id: 'avalanche',
        rank: 6,
        symbol: 'avax',
        name: 'Avalanche',
        supply: 350000000,
        max_supply: 720000000,
        market_cap_usd: 12000000000,
        volume_usd_24h: 500000000,
        price_usd: 34.29,
        change_percent_24h: 3.1,
        image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369'
      },
      {
        id: 'polkadot',
        rank: 7,
        symbol: 'dot',
        name: 'Polkadot',
        supply: 1200000000,
        max_supply: null,
        market_cap_usd: 10000000000,
        volume_usd_24h: 400000000,
        price_usd: 8.33,
        change_percent_24h: -2.1,
        image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot_new_logo.png?1696512458'
      },
      {
        id: 'chainlink',
        rank: 8,
        symbol: 'link',
        name: 'Chainlink',
        supply: 1000000000,
        max_supply: 1000000000,
        market_cap_usd: 9000000000,
        volume_usd_24h: 350000000,
        price_usd: 9.00,
        change_percent_24h: 1.8,
        image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1696501799'
      },
      {
        id: 'polygon',
        rank: 9,
        symbol: 'matic',
        name: 'Polygon',
        supply: 10000000000,
        max_supply: 10000000000,
        market_cap_usd: 8000000000,
        volume_usd_24h: 300000000,
        price_usd: 0.80,
        change_percent_24h: 4.2,
        image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1696501781'
      },
      {
        id: 'uniswap',
        rank: 10,
        symbol: 'uni',
        name: 'Uniswap',
        supply: 1000000000,
        max_supply: 1000000000,
        market_cap_usd: 7000000000,
        volume_usd_24h: 250000000,
        price_usd: 7.00,
        change_percent_24h: -0.7,
        image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png?1696512359'
      },
      {
        id: 'litecoin',
        rank: 11,
        symbol: 'ltc',
        name: 'Litecoin',
        supply: 74000000,
        max_supply: 84000000,
        market_cap_usd: 6500000000,
        volume_usd_24h: 200000000,
        price_usd: 87.84,
        change_percent_24h: 1.5,
        image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png?1696501400'
      },
      {
        id: 'stellar',
        rank: 12,
        symbol: 'xlm',
        name: 'Stellar',
        supply: 25000000000,
        max_supply: null,
        market_cap_usd: 6000000000,
        volume_usd_24h: 180000000,
        price_usd: 0.24,
        change_percent_24h: -1.8,
        image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png?1696501753'
      },
      {
        id: 'cosmos',
        rank: 13,
        symbol: 'atom',
        name: 'Cosmos',
        supply: 300000000,
        max_supply: null,
        market_cap_usd: 5500000000,
        volume_usd_24h: 160000000,
        price_usd: 18.33,
        change_percent_24h: 2.9,
        image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png?1696502526'
      },
      {
        id: 'monero',
        rank: 14,
        symbol: 'xmr',
        name: 'Monero',
        supply: 18000000,
        max_supply: null,
        market_cap_usd: 5000000000,
        volume_usd_24h: 140000000,
        price_usd: 277.78,
        change_percent_24h: -0.3,
        image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png?1696501469'
      },
      {
        id: 'algorand',
        rank: 15,
        symbol: 'algo',
        name: 'Algorand',
        supply: 8000000000,
        max_supply: 10000000000,
        market_cap_usd: 4500000000,
        volume_usd_24h: 120000000,
        price_usd: 0.56,
        change_percent_24h: 3.7,
        image: 'https://assets.coingecko.com/coins/images/4380/large/download.png?1696501738'
      },
      {
        id: 'vechain',
        rank: 16,
        symbol: 'vet',
        name: 'VeChain',
        supply: 85000000000,
        max_supply: 86712634466,
        market_cap_usd: 4000000000,
        volume_usd_24h: 100000000,
        price_usd: 0.047,
        change_percent_24h: 1.2,
        image: 'https://assets.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png?1696501800'
      },
      {
        id: 'filecoin',
        rank: 17,
        symbol: 'fil',
        name: 'Filecoin',
        supply: 2000000000,
        max_supply: null,
        market_cap_usd: 3500000000,
        volume_usd_24h: 90000000,
        price_usd: 1.75,
        change_percent_24h: -2.4,
        image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png?1696512379'
      },
      {
        id: 'internet-computer',
        rank: 18,
        symbol: 'icp',
        name: 'Internet Computer',
        supply: 500000000,
        max_supply: null,
        market_cap_usd: 3000000000,
        volume_usd_24h: 80000000,
        price_usd: 6.00,
        change_percent_24h: 4.8,
        image: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png?1696512389'
      },
      {
        id: 'hedera',
        rank: 19,
        symbol: 'hbar',
        name: 'Hedera',
        supply: 50000000000,
        max_supply: 50000000000,
        market_cap_usd: 2500000000,
        volume_usd_24h: 70000000,
        price_usd: 0.05,
        change_percent_24h: 0.9,
        image: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png?1696501744'
      },
      {
        id: 'tezos',
        rank: 20,
        symbol: 'xtz',
        name: 'Tezos',
        supply: 1000000000,
        max_supply: null,
        market_cap_usd: 2000000000,
        volume_usd_24h: 60000000,
        price_usd: 2.00,
        change_percent_24h: -1.1,
        image: 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png?1696501792'
      }
    ];

    // Fetch crypto market data
    const fetchCryptoData = async () => {
      setCryptoLoading(true);
      try {
        // For now, use mock data to avoid CORS issues
        // In production, you would use the actual API
        console.log('Using mock crypto data to avoid CORS issues');
        setCryptoData(mockCryptoData);
        
        // Uncomment the following code when you have a backend proxy or CORS is resolved
        /*
        const cachedCryptoData = getCachedData('cryptoData');
        if (cachedCryptoData) {
          console.log('Using cached crypto data:', cachedCryptoData);
          setCryptoData(cachedCryptoData);
          setCryptoLoading(false);
          return;
        }
        const data = await fetchWithRetry(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
        );
        console.log('Crypto API Response:', data);
        const formattedData: CryptoData[] = data.map((coin: any) => ({
          id: coin.id,
          rank: coin.market_cap_rank,
          symbol: coin.symbol,
          name: coin.name,
          supply: coin.circulating_supply,
          max_supply: coin.max_supply,
          market_cap_usd: coin.market_cap,
          volume_usd_24h: coin.total_volume,
          price_usd: coin.current_price,
          change_percent_24h: coin.price_change_percentage_24h,
          image: coin.image,
        }));
        console.log('Formatted Crypto Data:', formattedData);
        setCryptoData(formattedData);
        cacheData('cryptoData', formattedData, 1000 * 60 * 5); // Cache for 5 minutes
        */
      } catch (error: any) {
        console.error('Error fetching crypto data:', error);
        // Fallback to mock data if API fails
        setCryptoData(mockCryptoData);
        setError(`Using mock data due to API issues: ${error.message}`);
      } finally {
        setCryptoLoading(false);
      }
    };

    fetchCryptoData();
  }, []);

  const fetchHistoricalData = async (crypto: CryptoData, days: number) => {
    setIsLoading(true);
    try {
      // For now, use mock historical data to avoid CORS issues
      // In production, you would use the actual API
      console.log(`Using mock historical data for ${crypto.name} (${days} days)`);
      
      // Generate mock historical data
      const mockLabels = [];
      const mockPrices = [];
      const basePrice = crypto.price_usd;
      
      if (days === 1) {
        // 24 hours with hourly data
        for (let i = 23; i >= 0; i--) {
          const time = new Date();
          time.setHours(time.getHours() - i);
          mockLabels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
          mockPrices.push(basePrice * (1 + (Math.random() - 0.5) * 0.1)); // ±5% variation
        }
      } else if (days === 7) {
        // 7 days with daily data
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          mockPrices.push(basePrice * (1 + (Math.random() - 0.5) * 0.2)); // ±10% variation
        }
      } else {
        // 30 days with daily data
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          mockPrices.push(basePrice * (1 + (Math.random() - 0.5) * 0.3)); // ±15% variation
        }
      }
      
      const mockHistoricalData = { labels: mockLabels, prices: mockPrices };
      setHistoricalData(mockHistoricalData);
      
      // Uncomment the following code when you have a backend proxy or CORS is resolved
      /*
      // Check cache first
      const cacheKey = `historical_${crypto.id}_${days}`;
      const cachedHistoricalData = getCachedData(cacheKey);
      if (cachedHistoricalData) {
        console.log(`Using cached historical data for ${crypto.name} (${days} days)`);
        setHistoricalData(cachedHistoricalData);
        setIsLoading(false);
        return;
      }

      // Fetch historical data without interval parameter to let CoinGecko handle granularity
      const url = `https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=${days}`;
      console.log(`Fetching historical data for ${crypto.name} with URL: ${url}`);
      const data = await fetchWithRetry(url);
      console.log(`Historical Data Response for ${crypto.name} (${days} days):`, data);

      if (!data.prices || data.prices.length === 0) {
        throw new Error('No price data available from API');
      }

      const prices = data.prices.map((item: [number, number]) => item[1]);
      const labels = data.prices.map((item: [number, number]) =>
        days === 1
          ? new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : new Date(item[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );

      if (prices.length < 2) {
        throw new Error('Insufficient data points to render chart');
      }

      const historicalData = { labels, prices };
      setHistoricalData(historicalData);
      cacheData(cacheKey, historicalData, 1000 * 60 * 5); // Cache for 5 minutes
      */
    } catch (error: any) {
      console.error(`Error fetching ${days}-day historical data for ${crypto.name}:`, error);
      setHistoricalData(null);
      setError(`Failed to load historical data for ${crypto.name}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCryptoClick = async (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
    await fetchHistoricalData(crypto, days);
    setShowChartModal(true);
  };

  const handleTimeRangeChange = (range: '1d' | '7d' | '30d') => {
    setTimeRange(range);
    if (selectedCrypto) {
      const days = range === '1d' ? 1 : range === '7d' ? 7 : 30;
      fetchHistoricalData(selectedCrypto, days);
    } else {
      console.warn('No selected crypto to fetch historical data');
      setError('No cryptocurrency selected. Please select a cryptocurrency.');
    }
  };

  return (
    <Container fluid className="mt-5" style={{ width: '93%' }}>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      <Row>
        <Col lg={7} className="rounded-5">
          <h4 className="m-0 mb-4 text-start" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Market Price
          </h4>
          <Card className="rounded-4" style={{ width: '100%', height: '509px', overflow: 'hidden' }}>
            <Card.Body>
              {cryptoLoading ? (
                <div>
                  <div className="skeleton skeleton-button mb-2 ms-auto" style={{ width: '80px', height: '20px' }}></div>
                  <Table responsive className="table-responsive">
                    <thead>
                      <tr>
                        {['Rank', 'Name', 'Price', 'Market Cap', 'Volume (24H)', 'Change (24H)'].map((header) => (
                          <th key={header}>
                            <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(10)].map((_, index) => (
                        <tr key={index}>
                          <td><div className="skeleton skeleton-text" style={{ width: '30px', height: '16px' }}></div></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="skeleton skeleton-image" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
                              <div className="skeleton skeleton-text ms-2" style={{ width: '100px', height: '16px' }}></div>
                            </div>
                          </td>
                          <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '100px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '100px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : cryptoData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No cryptocurrency data available. Please try again later.
                </div>
              ) : (
                <>
                  <Table responsive hover className="table-responsive" style={{ fontSize: '0.7rem' }}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Market Cap</th>
                        <th>Volume (24H)</th>
                        <th>Change (24H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoData.slice(0, 10).map((crypto) => (
                        <tr key={crypto.id} onClick={() => handleCryptoClick(crypto)} style={{ cursor: 'pointer' }}>
                          <td>{crypto.rank}</td>
                          <td style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <img
                              src={crypto.image}
                              alt={crypto.symbol}
                              className="header-currency__icon"
                              width="20"
                              height="20"
                              style={{ marginRight: '4px', maxWidth: '100%', height: 'auto' }}
                              onError={(e) => {
                                e.currentTarget.src = '/fallback-crypto-image.png';
                              }}
                            />
                            {crypto.name} ({crypto.symbol.toUpperCase()})
                          </td>
                          <td style={{ textAlign: 'left' }}>${crypto.price_usd.toLocaleString()}</td>
                          <td style={{ textAlign: 'left' }}>${crypto.market_cap_usd.toLocaleString()}</td>
                          <td style={{ textAlign: 'left' }}>${crypto.volume_usd_24h.toLocaleString()}</td>
                          <td className={crypto.change_percent_24h >= 0 ? 'text-success' : 'text-danger'}>
                            {crypto.change_percent_24h.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5} className="rounded-5">
          <h4 className="m-0 mb-4 text-start" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Market Price
          </h4>
          <Card className="rounded-4" style={{ width: '100%', height: '509px', overflow: 'hidden' }}>
            <Card.Body>
              {cryptoLoading ? (
                <div>
                  <div className="skeleton skeleton-button mb-2 ms-auto" style={{ width: '80px', height: '20px' }}></div>
                  <Table responsive className="table-responsive">
                    <thead>
                      <tr>
                        {['Rank', 'Name', 'Price', 'Market Cap', 'Volume (24H)', 'Change (24H)'].map((header) => (
                          <th key={header}>
                            <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(10)].map((_, index) => (
                        <tr key={index}>
                          <td><div className="skeleton skeleton-text" style={{ width: '30px', height: '16px' }}></div></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="skeleton skeleton-image" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
                              <div className="skeleton skeleton-text ms-2" style={{ width: '100px', height: '16px' }}></div>
                            </div>
                          </td>
                          <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '100px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '100px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : cryptoData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No cryptocurrency data available. Please try again later.
                </div>
              ) : (
                <>
                  <Table responsive hover className="table-responsive" style={{ fontSize: '0.7rem' }}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Market Cap</th>
                        <th>Volume (24H)</th>
                        <th>Change (24H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoData.slice(10, 20).map((crypto) => (
                        <tr key={crypto.id} onClick={() => handleCryptoClick(crypto)} style={{ cursor: 'pointer' }}>
                          <td>{crypto.rank}</td>
                          <td style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <img
                              src={crypto.image}
                              alt={crypto.symbol}
                              className="header-currency__icon"
                              width="20"
                              height="20"
                              style={{ marginRight: '4px', maxWidth: '100%', height: 'auto' }}
                              onError={(e) => {
                                e.currentTarget.src = '/fallback-crypto-image.png';
                              }}
                            />
                            {crypto.name} ({crypto.symbol.toUpperCase()})
                          </td>
                          <td style={{ textAlign: 'left' }}>${crypto.price_usd.toLocaleString()}</td>
                          <td style={{ textAlign: 'left' }}>${crypto.market_cap_usd.toLocaleString()}</td>
                          <td style={{ textAlign: 'left' }}>${crypto.volume_usd_24h.toLocaleString()}</td>
                          <td className={crypto.change_percent_24h >= 0 ? 'text-success' : 'text-danger'}>
                            {crypto.change_percent_24h.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showChartModal}
        onHide={() => setShowChartModal(false)}
        dialogClassName="modal-lg"
        centered
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '20px' }}
        >
          <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
            {selectedCrypto?.name} Price Chart
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          {isLoading ? (
            <div className="skeleton skeleton-chart" style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
              <div className="skeleton skeleton-text mb-4" style={{ width: '100px', height: '30px', margin: '0 auto' }}></div>
              <div className="skeleton skeleton-chart-area" style={{ height: '300px', width: '100%' }}></div>
            </div>
          ) : historicalData && selectedCrypto ? (
            <>
              <ButtonGroup className="mb-4" style={{ gap: '10px' }}>
                {(['1d', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'primary' : 'outline-light'}
                    style={{
                      backgroundColor: timeRange === range ? '#007bff' : 'transparent',
                      borderColor: '#007bff',
                      color: timeRange === range ? '#fff' : '#007bff',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      if (timeRange !== range) {
                        e.currentTarget.style.backgroundColor = '#007bff20';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (timeRange !== range) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onClick={() => handleTimeRangeChange(range)}
                  >
                    {range.toUpperCase()}
                  </Button>
                ))}
              </ButtonGroup>
              <Chart
                data={historicalData}
                title={`${selectedCrypto.name} Price History (${timeRange.toUpperCase()})`}
                style={{ height: '400px' }}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
              No data available for {selectedCrypto?.name}. Please try a different time range or cryptocurrency.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MarketPriceAndNews;