// src/components/ExclusiveNews.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS

interface NewsItem {
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const ExclusiveNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initialize as true
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';
  const MOCK_API_BASE_URL = 'http://localhost:5000'; // For db.json

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try fetching from db.json first
        try {
          const response = await fetch(`${MOCK_API_BASE_URL}/news`);
          if (!response.ok) {
            throw new Error(`db.json fetch failed: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const formattedNews = data.map((item: any) => ({
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            creator: [item.author || 'Unknown'],
            pubDate: item.pubDate || new Date().toISOString(),
            image_url: item.image || 'https://via.placeholder.com/300x200?text=No+Image',
            link: item.link || '#',
          }));
          setNewsItems(formattedNews.slice(0, 4));
          console.log('Fetched news from db.json:', formattedNews);
          setIsLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to fetch from db.json, falling back to API:', error);
        }

        // Fetch from /fetch-rss
        const response = await fetch(`${API_BASE_URL}/fetch-rss`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setNewsItems(data.data.slice(0, 4));
          console.log('Fetched news from API:', data.data);
        } else {
          throw new Error('Fetched data is not an array');
        }
      } catch (error: any) {
        console.error('Error fetching news:', error);
        setError('Failed to load news. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Fallback image URL
  const fallbackImage = 'https://via.placeholder.com/300x200?text=No+Image';

  // Format date consistently
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown Date';
    }
  };

  return (
    <Container fluid className="mt-5 skeleton-container" style={{ width: '92%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
          Exclusive News
        </h4>
        <Button
          variant="link"
          className="text-warning text-decoration-none"
          onClick={() => navigate('/exclusive-news')}
          aria-label="View all news"
        >
          View All
          <ChevronRight className="ms-2" size={16} />
        </Button>
      </div>

      {error && <p className="text-danger">{error}</p>}
      {isLoading ? (
        <Row xs={1} md={2} lg={4} className="g-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Col key={index}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Skeleton height={200} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                <Card.Body className="d-flex flex-column">
                  <Skeleton width="80%" height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                  <Skeleton count={2} width="90%" height={16} baseColor="#e0e0e0" highlightColor="#f5f5f5" className="mt-2" />
                  <div className="mt-auto d-flex justify-content-between">
                    <Skeleton width={100} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                    <Skeleton width={80} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : newsItems.length === 0 && !error ? (
        <p>No news available.</p>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-4">
          {newsItems.slice(0, 4).map((item) => (
            <Col key={item.link}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Img
                  variant="top"
                  className="rounded-4"
                  src={item.image_url || fallbackImage}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title
                    className="fs-6 mb-3 text-start custom-text"
                    style={{
                      fontWeight: 'bold',
                      color: 'black',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      maxHeight: '3em',
                    }}
                  >
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black text-decoration-none"
                      aria-label={item.title}
                    >
                      {decodeHtml(item.title)}
                    </a>
                  </Card.Title>
                  <Card.Text
                    className="text-muted small flex-grow-1 text-start custom-text fs-7"
                    style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      maxHeight: '3em',
                    }}
                  >
                    {decodeHtml(item.description)}
                  </Card.Text>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">By </small>
                      <small className="text-warning">
                        {item.creator?.[0] || 'Unknown Author'}
                      </small>
                    </div>
                    <div className="ms-auto text-end">
                      <small className="text-muted">{formatDate(item.pubDate)}</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ExclusiveNews;