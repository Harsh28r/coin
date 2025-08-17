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

interface NFTData {
  id: string;
  name: string;
  symbol: string;
  floor_price_usd: number | null;
  volume_usd_24h: number | null;
  floor_price_24h_percentage_change: number | null;
  image: string | null;
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
  const [showAllCrypto, setShowAllCrypto] = useState(false);
  const [showAllNFTs, setShowAllNFTs] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [nftData, setNFTData] = useState<NFTData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [historicalData, setHistoricalData] = useState<{ labels: string[]; prices: number[] } | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [nftLoading, setNFTLoading] = useState(true);
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

  // Fetch with retry mechanism for handling rate limits
  const fetchWithRetry = async (url: string, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(API_KEY ? `${url}&x_cg_api_key=${API_KEY}` : url);
        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`Rate limit exceeded. Retrying after ${delay}ms...`);
            throw new Error('Rate limit exceeded');
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
      } catch (error: any) {
        if (i < retries - 1) {
          console.warn(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
          continue;
        }
        throw error;
      }
    }
  };

  useEffect(() => {
    // Mock NFT data as fallback
    const mockNFTData: NFTData[] = [
      {
        id: 'test-nft-1',
        name: 'Test NFT 1',
        symbol: 'TNFT1',
        floor_price_usd: 1000,
        volume_usd_24h: 50000,
        floor_price_24h_percentage_change: 2.5,
        image: 'https://via.placeholder.com/20',
      },
      {
        id: 'test-nft-2',
        name: 'Test NFT 2',
        symbol: 'TNFT2',
        floor_price_usd: 2000,
        volume_usd_24h: 75000,
        floor_price_24h_percentage_change: -1.5,
        image: 'https://via.placeholder.com/20',
      },
    ];

    // Fetch crypto market data
    const fetchCryptoData = async () => {
      setCryptoLoading(true);
      try {
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
      } catch (error: any) {
        console.error('Error fetching crypto data:', error);
        setCryptoData([]);
        setError(`Failed to load cryptocurrency data: ${error.message}`);
      } finally {
        setCryptoLoading(false);
      }
    };

    // Fetch NFT market data
    const fetchNFTData = async () => {
      setNFTLoading(true);
      try {
        const cachedNFTData = getCachedData('nftData');
        if (cachedNFTData) {
          console.log('Using cached NFT data:', cachedNFTData);
          setNFTData(cachedNFTData);
          setNFTLoading(false);
          return;
        }

        // Use /nfts/list to get NFT IDs (available in free tier)
        const nftList = await fetchWithRetry(
          'https://api.coingecko.com/api/v3/nfts/list?per_page=3&page=1'
        );
        console.log('NFT List API Response:', nftList);
        if (!nftList || nftList.length === 0) {
          console.warn('No NFT list data returned, using mock data');
          setNFTData(mockNFTData);
          setError('No NFT data available from API. Displaying mock data.');
          return;
        }

        // Fetch detailed data for a limited number of NFTs to avoid rate limits
        const formattedData: NFTData[] = [];
        for (const nft of nftList.slice(0, 6)) { // Limit to 3 NFTs to stay within rate limits
          try {
            const nftDetail = await fetchWithRetry(
              `https://api.coingecko.com/api/v3/nfts/${nft.id}`
            );
            console.log(`NFT Detail for ${nft.id}:`, nftDetail);
            if (nftDetail && nftDetail.id) {
              formattedData.push({
                id: nft.id,
                name: nftDetail.name || 'Unknown NFT',
                symbol: nftDetail.symbol || 'N/A',
                floor_price_usd: nftDetail.floor_price?.usd || null,
                volume_usd_24h: nftDetail.volume_24h?.usd || null,
                floor_price_24h_percentage_change: nftDetail.floor_price_24h_percentage_change?.usd || null,
                image: nftDetail.image?.small || nftDetail.image?.thumbnail || '/fallback-nft-image.png',
              });
            } else {
              console.warn(`Invalid data for NFT ${nft.id}, skipping`);
            }
            // Add a 500ms delay between requests to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error: any) {
            console.error(`Error fetching details for NFT ${nft.id}:`, error.message);
            continue;
          }
        }

        console.log('Formatted NFT Data:', formattedData);
        if (formattedData.length === 0) {
          console.warn('No valid NFT details returned, using mock data');
          setNFTData(mockNFTData);
          setError('No valid NFT data available from API. Displaying mock data.');
          return;
        }

        setNFTData(formattedData);
        cacheData('nftData', formattedData, 1000 * 60 * 5); // Cache for 5 minutes
      } catch (error: any) {
        console.error('Error fetching NFT data:', error);
        setNFTData(mockNFTData);
        setError(`Failed to load NFT data: ${error.message}. Displaying mock data.`);
      } finally {
        setNFTLoading(false);
      }
    };

    fetchCryptoData();
    fetchNFTData();
  }, []);

  const fetchHistoricalData = async (crypto: CryptoData, days: number) => {
    setIsLoading(true);
    try {
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
          <Card className="rounded-4" style={{ width: '100%', height: showAllCrypto ? 'auto' : '509px', overflow: 'hidden' }}>
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
                  <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.7rem', padding: '0.2rem' }}>
                    <div className="ms-auto">
                      <Button
                        variant="link"
                        className="text-warning text-decoration-none"
                        style={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '0.1rem 0.2rem' }}
                        onClick={() => {
                          setShowAllCrypto(!showAllCrypto);
                        }}
                      >
                        {showAllCrypto ? 'View Less' : 'View All'}
                      </Button>
                    </div>
                  </div>
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
                      {cryptoData.slice(0, showAllCrypto ? cryptoData.length : 10).map((crypto) => (
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
            NFT Marketplace
          </h4>
          <Card className="rounded-4" style={{ width: '100%', height: showAllNFTs ? 'auto' : '509px', overflow: 'hidden' }}>
            <Card.Body>
              {nftLoading ? (
                <div>
                  <div className="skeleton skeleton-button mb-2 ms-auto" style={{ width: '80px', height: '20px' }}></div>
                  <Table responsive className="table-responsive">
                    <thead>
                      <tr>
                        {['Name', 'Floor Price', 'Volume (24H)', 'Change (24H)'].map((header) => (
                          <th key={header}>
                            <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(10)].map((_, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="skeleton skeleton-image" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
                              <div className="skeleton skeleton-text ms-2" style={{ width: '100px', height: '16px' }}></div>
                            </div>
                          </td>
                          <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '100px', height: '16px' }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : nftData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No NFT data available. Please try again later.
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.7rem', padding: '0.2rem' }}>
                    <div className="ms-auto">
                      <Button
                        variant="link"
                        className="text-warning text-decoration-none"
                        style={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '0.1rem 0.2rem' }}
                        onClick={() => {
                          setShowAllNFTs(!showAllNFTs);
                        }}
                      >
                        {showAllNFTs ? 'View Less' : 'View All'}
                      </Button>
                    </div>
                  </div>
                  <Table responsive hover className="table-responsive" style={{ fontSize: '0.7rem' }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Floor Price</th>
                        <th>Volume (24H)</th>
                        <th>Change (24H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nftData.slice(0, showAllNFTs ? nftData.length : 10).map((nft) => (
                        <tr key={nft.id}>
                          <td style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <img
                              src={nft.image || '/fallback-nft-image.png'}
                              alt={nft.symbol}
                              className="header-nft__icon"
                              width="20"
                              height="20"
                              style={{ marginRight: '4px', maxWidth: '100%', height: 'auto' }}
                              onError={(e) => {
                                e.currentTarget.src = '/fallback-nft-image.png';
                              }}
                            />
                            {nft.name} ({nft.symbol.toUpperCase()})
                          </td>
                          <td style={{ textAlign: 'left' }}>
                            {nft.floor_price_usd ? `$${nft.floor_price_usd.toLocaleString()}` : 'N/A'}
                          </td>
                          <td style={{ textAlign: 'left' }}>
                            {nft.volume_usd_24h ? `$${nft.volume_usd_24h.toLocaleString()}` : 'N/A'}
                          </td>
                          <td className={nft.floor_price_24h_percentage_change && nft.floor_price_24h_percentage_change >= 0 ? 'text-success' : 'text-danger'}>
                            {nft.floor_price_24h_percentage_change ? `${nft.floor_price_24h_percentage_change.toFixed(2)}%` : 'N/A'}
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