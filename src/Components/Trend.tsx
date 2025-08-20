import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { computeImpactLevel } from '../utils/impact';

interface NewsItem {
  article_id?: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
  content?: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const Exn: React.FC = () => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  
  // Use the translation hook
  const { displayItems } = useNewsTranslation(newsItems);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetch-another-rss?limit=8`);
        const data = await response.json();
        console.log(data);
        if (data.success && Array.isArray(data.data)) {
          setNewsItems(data.data.map((item: any) => ({
            article_id: item.article_id,
            title: item.title,
            description: item.description,
            creator: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
            pubDate: item.pubDate,
            image_url: item.image_url,
            link: item.link,
            content: item.content || item.description || ''
          })));
        } else {
          console.error('Fetched data is not valid:', data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, []);

  return (
    <Container fluid className="mt-5" style={{ width: '92%' }}>
      <Helmet>
        <title>Trending News | CoinsClarity</title>
        <meta name="description" content="Trending crypto news aggregated with full content on-platform." />
        <link rel="canonical" href={`${window.location.origin}/All-Trending-news`} />
      </Helmet>
      <h1 className="mb-4 text-center" style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        borderBottom: '3px solid #f59e0b',
        paddingBottom: '1rem'
      }}>
        Trending Crypto News
      </h1>
      
     
      {/* Trending metrics and insights */}
      <div className="mb-4 p-3" style={{ 
        backgroundColor: '#fff3cd', 
        borderRadius: '8px', 
        border: '1px solid #ffeaa7' 
      }}>
        <div className="row text-center">
          <div className="col-md-4">
            <div className="p-2">
              <strong className="d-block text-warning">Crypto Social Buzz</strong>
              <small className="text-muted">Viral crypto news & discussions</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-2">
              <strong className="d-block text-warning">Crypto Market Impact</strong>
              <small className="text-muted">Price movements & volume</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-2">
              <strong className="d-block text-warning">Crypto Community Interest</strong>
              <small className="text-muted">User engagement & shares</small>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em', borderBottom: '2px solid orange', marginBottom: '1rem' }}>
          {t('news.trendingTitle') || 'Trending News'}
        </h4>
      </div>
      <Row xs={1} md={2} lg={4} className="g-4">
        {Array.isArray(displayItems) && displayItems.map((item, index) => (
          <Col key={index}>
            <Card className="h-100 border-0 shadow-sm rounded-5">
              <Card.Img variant="top rounded-4" src={item.image_url} alt={item.title} />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fs-6 mb-3 text-start custom-text" style={{ fontWeight: 'bold', color: 'black', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, maxHeight: '3em' }}>
                  <a 
                    href={`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`}
                    className="text-black text-decoration-none"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { e.preventDefault(); navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item } }); }}
                  >
                    {item.title}
                  </a>
                </Card.Title>
                <Card.Text className="text-muted small flex-grow-1 text-start custom-text fs-7" style={{ overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, maxHeight: '3em' }}>
                  {decodeHtml(item.description)}
                </Card.Text>
                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-dark">
                      {(() => { const r = computeImpactLevel(item); return `Impact: ${r.level}`; })()}
                    </span>
                    <small className="text-muted">By </small>
                    <small className="text-warning "> {item.creator[0]}</small>
                  </div>
                  <div className="ms-auto text-end">
                    <small className="text-muted">{new Date(item.pubDate).toLocaleDateString()}</small>
                  </div>
                </div>
                <Button 
                  variant="warning"
                  onClick={() => navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item: { ...item, content: (item as any).content || item.description || '' } } })}
                  className="mt-3"
                >
                  {t('news.readMore') || 'Read More'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>


      {/* Additional informative content section also moved to the end */}
      <div className="mb-5 p-5" style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%,rgb(234, 159, 11) 100%)',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 20px 40px rgba(79, 172, 254, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '140%',
          height: '140%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          transform: 'rotate(15deg)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 className="h4 mb-4 text-white fw-bold" style={{ 
            fontSize: '1.8rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Understanding Trending Crypto News & Market Dynamics
          </h3>
          <p className="mb-4 text-white-75" style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            textShadow: '0 1px 5px rgba(0,0,0,0.2)'
          }}>
            Trending crypto news provides valuable insights into market sentiment, investor behavior, and emerging opportunities 
            in the cryptocurrency space. Our analysis helps you distinguish between temporary hype and genuine crypto market developments.
          </p>
          <div className="row">
            <div className="col-md-6">
              <div className="p-4" style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: '1.1rem' }}>🚀 Crypto Market Trends We Track:</h6>
                <ul className="list-unstyled mb-0 text-white-75">
                  <li className="mb-2">• Bitcoin & Ethereum price movements</li>
                  <li className="mb-2">• DeFi protocol developments</li>
                  <li className="mb-2">• NFT collection launches</li>
                  <li className="mb-0">• Regulatory crypto news updates</li>
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
                <h6 className="fw-bold text-white mb-3" style={{ fontSize: '1.1rem' }}>📰 Crypto News Sources:</h6>
                <ul className="list-unstyled mb-0 text-white-75">
                  <li className="mb-2">• Major crypto news outlets</li>
                  <li className="mb-2">• Social media platforms</li>
                  <li className="mb-2">• Trading community forums</li>
                  <li className="mb-0">• Expert crypto analysts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

    </Container>
  );
};

export default Exn;