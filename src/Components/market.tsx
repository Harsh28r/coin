import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Card, Button, Carousel, Modal } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Chart} from './Chart';

interface CryptoData {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
  explorer: string;
  logo: string;
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
}

const MarketPriceAndNews: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [historicalData, setHistoricalData] = useState<{ labels: string[], prices: number[] } | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCarousel, setShowCarousel] = useState(true);
  const carouselNews: CarouselNewsItem[] = [
    {
      title: "How To Avoid Going Bust In Crypto In 2024",
      excerpt: "In the midst of a booming market, safeguarding investments becomes paramount...",
      author: "Tracy D'souza",
      date: "April 27, 2024",
      image: "/image.png?height=80&width=120" // Check this path
    },
    {
      title: "Pro-XRP Lawyer Takes A Dig At Bitcoin, Calls It Overhyped",
      excerpt: "Pro-XRP lawyer Bill Morgan's recent critique of Bitcoin as overhyped has sparked...",
      author: "Tracy D'souza",
      date: "April 27, 2024",
      image: "/market.png?height=80&width=120" // Check this path
    },
    {
      title: "Pro-XRP Lawyer Takes A Dig At Bitcoin, Calls It Overhyped",
      excerpt: "Pro-XRP lawyer Bill Morgan's recent critique of Bitcoin as overhyped has sparked...",
      author: "Tracy D'souza",
      date: "April 27, 2024",
      image: "/market.png?height=80&width=120" // Check this path
    },
  ];

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch('https://api.coincap.io/v2/assets/');
        const data = await response.json(); // Parse the response as JSON
        setCryptoData(data.data || []); // Ensure data is an array from the correct property
        console.log(data); // Log the fetched data to check its structure
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      }
    };

    fetchCryptoData();
  }, []);

  const handleCryptoClick = async (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    // Fetch 24-hour data for the selected cryptocurrency
    try {
      const response = await fetch(`https://api.coincap.io/v2/assets/${crypto.id}/history?interval=h1`); // Change interval to h1 for hourly data
      const data = await response.json();
      const prices = data.data.map((item: any) => item.priceUsd); // Extract prices
      const labels = data.data.map((item: any) => new Date(item.time).toLocaleTimeString()); // Extract time labels
      setHistoricalData({ labels, prices }); // Update historical data state
      setShowChartModal(true); // Open modal after fetching data
    } catch (error) {
      console.error('Error fetching 24-hour data:', error);
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
        <Col lg={7} className="rounded-5" style={{ /* border: '1px solid lightgrey' */ }}>
          <h4 className="m-0 mb-4 text-start" style={{fontWeight: 'bold',letterSpacing: '0.05em'}}>Market Price</h4>
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
                      setShowCarousel(true);
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
                    {/* <th>Explorer</th> */}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(cryptoData) && cryptoData
                    .slice(0, showAll ? cryptoData.length : 10)
                    .map(crypto => (
                      <tr key={crypto.id} onClick={() => handleCryptoClick(crypto)} style={{ fontSize: '0.7rem' }}>
                        <td>{crypto.rank}</td>
                        <td style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <img
                            src={`https://assets.coincap.io/assets/icons/${crypto.symbol.toLowerCase()}@2x.png`}
                            alt={crypto.symbol}
                            className="header-currency__icon"
                            width="20"
                            height="20"
                            style={{ marginRight: '4px', maxWidth: '100%', height: 'auto' }}
                          />
                          {crypto.name} 
                          ( {crypto.symbol.toUpperCase()})
                        </td>
                        <td style={{ textAlign: 'left' }}>${parseFloat(crypto.priceUsd).toLocaleString()}</td>
                        <td style={{ textAlign: 'left' }}>${parseFloat(crypto.marketCapUsd).toLocaleString()}</td>
                        <td style={{ textAlign: 'left' }}>${parseFloat(crypto.volumeUsd24Hr).toLocaleString()}</td>
                        <td className={parseFloat(crypto.changePercent24Hr) >= 0 ? 'text-success' : 'text-danger'}>
                          {parseFloat(crypto.changePercent24Hr).toFixed(2)}%
                        </td>
                        <td>
                          {/* <a href={crypto.explorer} target="_blank" rel="noopener noreferrer">View</a> */}
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
            <h4 className="m-0" style={{ fontWeight: 'bold' ,letterSpacing: '0.05em'}}>Market</h4>
            <div className="ms-auto">
              <Button 
                variant="link" 
                className="text-warning text-decoration-none" 
                style={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '0.1rem 0.2rem' }}
              >
                View All<ChevronRight size={16} className="me-1" />
              </Button>
            </div>
          </div>
          <Carousel 
            className="bg-dark text-white rounded-5 mt-4"
            style={{ height: '509px', width: '530px', margin: '20px auto' }}
            indicators={false}
            controls={false}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          >
            {carouselNews.map((news, index) => (
              <Carousel.Item key={index} className="custom-carousel-item rounded-4" style={{ height: '509px' }}>
                <Card.Img src={news.image} alt={news.title} className="rounded-4" style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
                <Card.ImgOverlay className="d-flex flex-column justify-content-between rounded-5" style={{ paddingTop: '1rem' }}>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                      <span className="badge news-badge ms-4">Exclusive News</span>
                      <span className="ms-4 text-white">By {news.author}</span>
                    </div>
                    <span className="text-white ms-auto me-4">{news.date}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-center" style={{ height: '100%', fontSize: '2.2rem' }}>
                    {news.title}
                  </div>
                </Card.ImgOverlay>
              </Carousel.Item>
            ))}
            <div className="carousel-controls" style={{ position: 'absolute', bottom: '10px', right: '35px' }}>
                <Button 
                  variant="outline-light" 
                  className="rounded-circle me-4"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', marginLeft: '-10px' }}
                  onClick={handlePrev}
                > 
                  <ChevronLeft /> 
                </Button> 
                <Button 
                  variant="outline-light" 
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', marginLeft: '-10px' }}
                  onClick={handleNext}
                > 
                  <ChevronRight /> 
                </Button>
              </div>
          </Carousel>
        </Col>
      </Row>

      <Modal show={showChartModal} onHide={() => setShowChartModal(false)} dialogClassName="modal-fullscreen">
        <Modal.Header closeButton>
          <Modal.Title style={{ textAlign: 'left' }}>{selectedCrypto?.name} Price Chart</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {historicalData && selectedCrypto && (
            <Chart 
              data={historicalData} 
              title={`${selectedCrypto.name} Price History`}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MarketPriceAndNews;







