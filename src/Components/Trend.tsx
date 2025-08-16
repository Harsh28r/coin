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
        <title>Trending News | CoinsCapture</title>
        <meta name="description" content="Trending crypto news aggregated with full content on-platform." />
        <link rel="canonical" href={`${window.location.origin}/All-Trending-news`} />
      </Helmet>
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
    </Container>
  );
};

export default Exn;