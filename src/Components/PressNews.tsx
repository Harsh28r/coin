import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PressNews.css';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

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

// Utility functions to clean and format text
const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const stripHtmlTags = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PresNews: React.FC = () => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the translation hook
  const { displayItems, isTranslating, currentLanguage } = useNewsTranslation(newsItems);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/fetch-another-rss`);
        const data = await response.json();
        
        if (Array.isArray(data.data)) {
          setNewsItems(data.data);
        } else {
          setError('Invalid data format received');
          console.error('Fetched data is not an array:', data);
        }
      } catch (error) {
        setError('Failed to fetch news. Please try again later.');
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [API_BASE_URL]);

  const toggleContent = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading latest news...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="text-danger mb-3">
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="text-danger">{error}</h5>
          <button 
            className="btn btn-outline-primary mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  if (newsItems.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="text-muted mb-3">
            <i className="fas fa-newspaper" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="text-muted">No news available at the moment</h5>
          <p className="text-muted">Check back later for updates</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="press-news-container py-5">
      <Row className="mb-4">
        <Col>
          <div className="text-center mb-4">
            <h2 className="section-title">{t('news.latestPressNews') || 'Latest Press & News'}</h2>
            <p className="section-subtitle text-muted">{t('news.stayUpdated') || 'Stay updated with the latest developments and announcements'}</p>
            
            {/* Translation indicator */}
            {isTranslating && (
              <div className="alert alert-info alert-dismissible fade show" role="alert" style={{ margin: '10px' }}>
                🔄 Translating press news to {currentLanguage === 'hi' ? 'Hindi' : 
                  currentLanguage === 'es' ? 'Spanish' :
                  currentLanguage === 'fr' ? 'French' :
                  currentLanguage === 'de' ? 'German' :
                  currentLanguage === 'zh' ? 'Chinese' :
                  currentLanguage === 'ja' ? 'Japanese' :
                  currentLanguage === 'ko' ? 'Korean' :
                  currentLanguage === 'ar' ? 'Arabic' : currentLanguage}...
              </div>
            )}
          </div>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <div className="news-grid">
            {displayItems.map((item, index) => (
              <Card key={index} className="news-card mb-4 shadow-sm">
                <div className="news-image-container">
              <a
                    href={`/news/${item.article_id || encodeURIComponent(item.title)}`}
                    aria-label={item.title}
                    className="text-decoration-none"
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Img 
                      variant="top" 
                      src={item.image_url} 
                      alt={item.title}
                      className="news-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x250?text=News+Image';
                      }}
                    />
                  </a>
                  <div className="news-overlay">
                    <Badge bg="primary" className="news-badge">
                      {item.creator[0] || 'Unknown Author'}
                    </Badge>
                  </div>
                </div>
                
                <Card.Body className="p-4">
                  <div className="news-meta mb-3">
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {formatDate(item.pubDate)}
                    </small>
                    {item.creator[0] && (
                      <small className="text-muted ms-3">
                        <i className="fas fa-user me-1"></i>
                        {item.creator[0]}
                      </small>
                    )}
                  </div>
                  
                  <Card.Title className="news-title mb-3">
                    <a 
                      href={`/news/${item.article_id || encodeURIComponent(item.title)}`}
                      className="news-link"
                      style={{ cursor: 'pointer' }}
                    >
                      {item.title}
                    </a>
                  </Card.Title>
                  
                  <Card.Text className="news-content">
                    {(() => {
                      const plain = stripHtmlTags(item.content || item.description || '');
                      return expandedIndex === index ? plain : truncateText(plain, 120);
                    })()}
                  </Card.Text>
                  
                  <div className="news-actions">
                    <button 
                      onClick={() => toggleContent(index)} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      {expandedIndex === index ? (
                        <>
                          <i className="fas fa-compress-alt me-1"></i>
                          {t('news.showLess') || 'Show Less'}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-expand-alt me-1"></i>
                          {t('news.readMore') || 'Read More'}
                        </>
                      )}
                    </button>
                    
                    <a 
                      href={`/news/${item.article_id || encodeURIComponent(item.title)}`}
                      className="btn btn-primary btn-sm ms-2"
                    >
                      <i className="fas fa-newspaper me-1"></i>
                      {t('news.readFullArticle') || 'Read Full Article'}
                    </a>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PresNews;
