import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Card, Button, Carousel, Modal, ButtonGroup } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chart from './Chart';

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

interface CarouselNewsItem {
  image: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  url: string;
}

const MarketPriceAndNews: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [historicalData, setHistoricalData] = useState<{ labels: string[]; prices: number[] } | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselNews, setCarouselNews] = useState<CarouselNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('1d');
  const [isLoading, setIsLoading] = useState(false);

  // Replace with your NewsAPI.org API key
  const NEWS_API_KEY = 'YOUR_NEWS_API_KEY'; // Obtain from https://newsapi.org/register

  // Fetch news data, optionally filtered by coin name
  const fetchNewsData = async (coinName?: string) => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const query = coinName ? coinName.toLowerCase() : 'cryptocurrency';
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.articles || data.articles.length === 0) {
        throw new Error('No articles found');
      }
      const formattedNews: CarouselNewsItem[] = data.articles.slice(0, 5).map((item: any) => ({
        title: item.title || 'Untitled',
        excerpt: item.description
          ? item.description.length > 100
            ? `${item.description.substring(0, 100)}...`
            : item.description
          : 'No description available',
        author: item.source.name || 'Unknown',
        date: new Date(item.publishedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        image: item.urlToImage || '/fallback-news-image.png',
        url: item.url || '#',
      }));
      setCarouselNews(formattedNews);
    } catch (error) {
      console.error('Error fetching news data:', error);
      setNewsError('Failed to load news. Please try again later.');
      setCarouselNews([
        {
          title: "Crypto Market Update",
          excerpt: "Stay tuned for the latest cryptocurrency market updates...",
          author: "NewsAPI",
          date: "August 5, 2025",
          image: "/fallback-news-image.png",
          url: "#",
        },
      ]);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch market data
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
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
        setCryptoData(formattedData);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        setCryptoData([]);
      }
    };

    fetchCryptoData();
    fetchNewsData(); // Initial fetch for general crypto news
  }, []);

  const fetchHistoricalData = async (crypto: CryptoData, days: number, interval: 'hourly' | 'daily') => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.prices || data.prices.length === 0) {
        throw new Error('No price data available');
      }
      const prices = data.prices.map((item: [number, number]) => item[1]);
      const labels = data.prices.map((item: [number, number]) =>
        days === 1
          ? new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : new Date(item[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
      setHistoricalData({ labels, prices });
    } catch (error) {
      console.error(`Error fetching ${days}-day historical data for ${crypto.name}:`, error);
      setHistoricalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCryptoClick = async (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    await Promise.all([
      fetchHistoricalData(crypto, timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30, timeRange === '1d' ? 'hourly' : 'daily'),
      fetchNewsData(crypto.name), // Fetch news for the selected crypto
    ]);
    setShowChartModal(true);
  };

  const handleTimeRangeChange = (range: '1d' | '7d' | '30d') => {
    setTimeRange(range);
    if (selectedCrypto) {
      fetchHistoricalData(selectedCrypto, range === '1d' ? 1 : range === '7d' ? 7 : 30, range === '1d' ? 'hourly' : 'daily');
    }
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? carouselNews.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex === carouselNews.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <Container fluid className="mt-5" style={{ width: '93%' }}>
      <Row>
        <Col lg={7} className="rounded-5">
          <h4 className="m-0 mb-4 text-start" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Market Price
          </h4>
          <Card className="rounded-4" style={{ width: '100%', height: showAll ? 'auto' : '509px', overflow: 'hidden' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.7rem', padding: '0.2rem' }}>
                <div className="ms-auto">
                  <Button
                    variant="link"
                    className="text-warning text-decoration-none"
                    style={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '0.1rem 0.2rem' }}
                    onClick={() => {
                      setShowAll(!showAll);
                    }}
                  >
                    {showAll ? 'View Less' : 'View All'}
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
                  {cryptoData.slice(0, showAll ? cryptoData.length : 10).map((crypto) => (
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
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5} className="position-relative">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
              {selectedCrypto ? `${selectedCrypto.name} News` : 'Crypto News'}
            </h4>
            <div className="ms-auto">
              <Button
                variant="link"
                className="text-warning text-decoration-none"
                style={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '0.1rem 0.2rem' }}
                href="https://newsapi.org"
                target="_blank"
              >
                View All<ChevronRight size={16} className="me-1" />
              </Button>
            </div>
          </div>
          {newsLoading ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '12px', height: '509px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Loading news...
            </div>
          ) : newsError ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '12px', height: '509px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {newsError}
            </div>
          ) : (
            <Carousel
              className="bg-dark text-white rounded-5 mt-4"
              style={{ height: '509px', width: '530px', margin: '20px auto', borderRadius: '12px' }}
              indicators={false}
              controls={false}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              interval={5000} // Auto-rotate every 5 seconds
              pause="hover" // Pause on hover
            >
              {carouselNews.map((news, index) => (
                <Carousel.Item key={index} className="custom-carousel-item rounded-4" style={{ height: '509px' }}>
                  <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Card.Img
                      src={news.image}
                      alt={news.title}
                      className="rounded-4"
                      style={{ height: '100%', objectFit: 'cover', width: '100%', opacity: 0.7, transition: 'transform 0.3s ease' }}
                    />
                    <Card.ImgOverlay
                      className="d-flex flex-column justify-content-between rounded-5"
                      style={{ padding: '1rem', transition: 'opacity 0.2s' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.parentElement!.querySelector('img')!.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.parentElement!.querySelector('img')!.style.transform = 'scale(1)';
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div>
                          <span className="badge bg-primary ms-4" style={{ fontWeight: '500', background: 'linear-gradient(45deg, #007bff, #00d4ff)' }}>
                            {selectedCrypto ? `${selectedCrypto.symbol.toUpperCase()} News` : 'Crypto News'}
                          </span>
                          <span className="ms-4 text-white">By {news.author}</span>
                        </div>
                        <span className="text-white ms-auto me-4">{news.date}</span>
                      </div>
                      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100%' }}>
                        <h5 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                          {news.title}
                        </h5>
                        <p style={{ fontSize: '0.9rem', color: '#ccc', textAlign: 'center', marginTop: '10px' }}>
                          {news.excerpt}
                        </p>
                      </div>
                    </Card.ImgOverlay>
                  </a>
                </Carousel.Item>
              ))}
              <div className="carousel-controls" style={{ position: 'absolute', bottom: '10px', right: '35px' }}>
                <Button
                  variant="outline-light"
                  className="rounded-circle me-4"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', marginLeft: '-10px', borderColor: '#007bff', background: 'rgba(0, 123, 255, 0.1)' }}
                  onClick={handlePrev}
                >
                  <ChevronLeft color="#007bff" />
                </Button>
                <Button
                  variant="outline-light"
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', marginLeft: '-10px', borderColor: '#007bff', background: 'rgba(0, 123, 255, 0.1)' }}
                  onClick={handleNext}
                >
                  <ChevronRight color="#007bff" />
                </Button>
              </div>
            </Carousel>
          )}
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
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
              Loading chart data...
            </div>
          ) : historicalData && selectedCrypto ? (
            <Chart
              data={historicalData}
              title={`${selectedCrypto.name} Price History`}
              style={{ height: '400px' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
              No data available for {selectedCrypto?.name}.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MarketPriceAndNews;