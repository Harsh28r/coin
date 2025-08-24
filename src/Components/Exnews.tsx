import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

interface NewsItem {
  article_id?: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
  content: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const AllNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Track expanded item
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';

  // Crypto-related fallback images
  const getFallbackImage = (index: number): string => {
    const images = [
      'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?w=800&h=600&fit=crop', // Bitcoin/blockchain
      'https://images.pexels.com/photos/6770774/pexels-photo-6770774.jpeg?w=800&h=600&fit=crop', // Crypto trading
      'https://images.pexels.com/photos/5980645/pexels-photo-5980645.jpeg?w=800&h=600&fit=crop', // Blockchain tech
      'https://images.pexels.com/photos/6772071/pexels-photo-6772071.jpeg?w=800&h=600&fit=crop', // Crypto concept
      'https://images.pexels.com/photos/8437015/pexels-photo-8437015.jpeg?w=800&h=600&fit=crop', // Digital finance
      'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?w=800&h=600&fit=crop'  // Digital currency
    ];
    return images[index % images.length];
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetch-rss`);
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setNewsItems(data.data);
        } else {
          console.error('Fetched data is not an array:', data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, []);

  const toggleContent = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index); // Toggle expanded state
  };

  return (
    <Container fluid className="mt-5" style={{ width: '50%' }}>
      <h1 className="mb-4 text-center" style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        borderBottom: '3px solid #f59e0b',
        paddingBottom: '1rem'
      }}>
        All Exclusive News
      </h1>

      {/* News count and filtering info */}
      <div className="mb-4 p-3" style={{ 
        backgroundColor: '#e7f3ff', 
        borderRadius: '8px', 
        border: '1px solid #b3d9ff' 
      }}>
        <div className="row text-center">
          <div className="col-md-3">
            <div className="p-2">
              <strong className="d-block text-primary">Total Articles</strong>
              <small className="text-muted">{newsItems.length} crypto news stories</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-2">
              <strong className="d-block text-primary">Latest Updates</strong>
              <small className="text-muted">Real-time crypto market news</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-2">
              <strong className="d-block text-primary">Expert Analysis</strong>
              <small className="text-muted">In-depth crypto insights</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-2">
              <strong className="d-block text-primary">Market Coverage</strong>
              <small className="text-muted">Comprehensive crypto news</small>
            </div>
          </div>
        </div>
      </div>

      <ul className="list-unstyled">
        {Array.isArray(newsItems) && newsItems.map((item, index) => (
          <li key={index} className="mb-4">
            <Card className="border-0 shadow-sm rounded-4">
              <Row className="g-0">
                <Col md={4}>
                  <Card.Img 
                    variant="top" 
                    src={item.image_url || getFallbackImage(index)} 
                    alt={item.title}
                    className="rounded-start-4"
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e: any) => { 
                      e.currentTarget.src = getFallbackImage(index); 
                    }}
                  />
                </Col>
                <Col md={8}>
                  <Card.Body className="d-flex flex-column h-100">
                    <Card.Title className="h5 mb-3 fw-bold" style={{ 
                      color: '#1f2937',
                      lineHeight: '1.4'
                    }}>
                      <a 
                        href={`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`}
                        className="text-decoration-none"
                        style={{ color: 'inherit' }}
                        onClick={(e) => { 
                          e.preventDefault(); 
                          navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item } }); 
                        }}
                      >
                        {item.title}
                      </a>
                    </Card.Title>
                    <Card.Text className="text-muted mb-3 flex-grow-1" style={{ 
                      lineHeight: '1.6',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {decodeHtml(item.description)}
                    </Card.Text>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted">By </small>
                        <small className="text-warning fw-bold">{item.creator[0]}</small>
                        <small className="text-muted ms-2">•</small>
                        <small className="text-muted">{new Date(item.pubDate).toLocaleDateString()}</small>
                      </div>
                      <Button 
                        variant="warning"
                        size="sm"
                        onClick={() => navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item: { ...item, content: (item as any).content || item.description || '' } } })}
                      >
                        {/* Assuming 't' function exists or is replaced with a placeholder */}
                        {/* <t>news.readMore</t> */}
                        Read More
                      </Button>
                    </div>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          </li>
        ))}
      </ul>

      {/* Enhanced introduction section moved to the end for better user experience */}
      <div className="mb-5 p-5" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          transform: 'rotate(45deg)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="h3 mb-4 text-white fw-bold" style={{ 
            fontSize: '2rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            letterSpacing: '0.5px'
          }}>
            Exclusive Crypto News Stories & In-Depth Analysis
          </h2>
          <p className="mb-3 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Dive deep into exclusive crypto news stories that go beyond the headlines. Our curated collection features in-depth 
            analysis, exclusive interviews, and comprehensive coverage of the most important developments in the crypto market.
          </p>
          <p className="mb-3 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            From groundbreaking DeFi protocols and revolutionary NFT projects to regulatory developments and institutional adoption, 
            our exclusive crypto news content provides you with the insights and analysis you need to stay ahead in the rapidly 
            evolving cryptocurrency landscape.
          </p>
          <p className="mb-0 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Access premium crypto news content that combines journalistic excellence with deep technical understanding, helping 
            you make informed decisions in the crypto market and understand the forces shaping the future of digital finance.
          </p>
        </div>
      </div>

      {/* Additional informative content section */}
      <div className="mb-5 p-5" style={{ 
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 20px 40px rgba(240, 147, 251, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 className="h4 mb-4 text-white fw-bold" style={{ 
            fontSize: '1.8rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Why Choose Our Exclusive Crypto News Coverage?
          </h3>
          <p className="mb-4 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Our exclusive crypto news platform delivers premium content that combines deep market analysis with actionable insights, 
            helping you navigate the complex world of cryptocurrencies with confidence and clarity.
          </p>
          <div className="row">
            <div className="col-md-6">
              <div className="p-4" style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: '1.1rem' }}>🔍 Exclusive Coverage Areas:</h6>
                <ul className="list-unstyled mb-0 text-white-75">
                  <li className="mb-2">• Bitcoin & Ethereum developments</li>
                  <li className="mb-2">• DeFi protocol innovations</li>
                  <li className="mb-2">• NFT market trends</li>
                  <li className="mb-0">• Regulatory crypto updates</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4" style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: '1.1rem' }}>💎 Premium Features:</h6>
                <ul className="list-unstyled mb-0 text-white-75">
                  <li className="mb-2">• Expert crypto analysis</li>
                  <li className="mb-2">• Market impact assessment</li>
                  <li className="mb-2">• Investment insights</li>
                  <li className="mb-0">• Community discussions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default AllNews;
