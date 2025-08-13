import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { ArrowLeft, Share2, Bookmark, Eye, Calendar, User, ExternalLink } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './NewsDetail.css';

interface NewsItem {
  article_id: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
  content: string;
  source_name: string;
  keywords?: string[];
  category?: string[];
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Try to fetch from different RSS collections
        const collections = ['rssfeeds', 'cryptoslate_feeds', 'decrypt_feeds', 'coindesk_feeds'];
        
        for (const collection of collections) {
          try {
            const response = await fetch(`${API_BASE_URL}/fetch-rss?collection=${collection}&limit=50`);
            const data = await response.json();
            
            if (data.success && data.data) {
              const foundItem = data.data.find((item: NewsItem) => 
                item.article_id === id || item.link.includes(id)
              );
              
              if (foundItem) {
                setNewsItem(foundItem);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.log(`Failed to fetch from ${collection}:`, err);
            continue;
          }
        }
        
        // If not found in RSS feeds, try searching in all collections
        const searchResponse = await fetch(`${API_BASE_URL}/search-news?q=${encodeURIComponent(id)}&limit=100`);
        const searchData = await searchResponse.json();
        
        if (searchData.success && searchData.data) {
          const foundItem = searchData.data.find((item: NewsItem) => 
            item.article_id === id || item.link.includes(id)
          );
          
          if (foundItem) {
            setNewsItem(foundItem);
            setLoading(false);
            return;
          }
        }
        
        setError('News article not found');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news detail:', err);
        setError('Failed to load news article');
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id, API_BASE_URL]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleShare = async () => {
    if (navigator.share && newsItem) {
      try {
        await navigator.share({
          title: newsItem.title,
          text: newsItem.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleExternalLink = () => {
    if (newsItem?.link) {
      window.open(newsItem.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading news article...</p>
        </div>
      </Container>
    );
  }

  if (error || !newsItem) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <h3>Article Not Found</h3>
          <p className="text-muted">{error || 'The requested news article could not be found.'}</p>
          <Button onClick={handleBack} variant="primary">
            <ArrowLeft className="me-2" size={16} />
            Go Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4 news-detail-container">
      <Row>
        <Col lg={8} className="mx-auto">
          {/* Back Button */}
          <Button 
            onClick={handleBack} 
            variant="outline-secondary" 
            className="mb-4"
            size="sm"
          >
            <ArrowLeft className="me-2" size={16} />
            Back to News
          </Button>

          {/* Article Header */}
          <div className="article-header mb-4">
            <div className="source-badge mb-3">
              <Badge bg="primary" className="me-2">
                {newsItem.source_name || 'Crypto News'}
              </Badge>
              {newsItem.category && newsItem.category.map((cat, index) => (
                <Badge key={index} bg="secondary" className="me-1">
                  {cat}
                </Badge>
              ))}
            </div>
            
            <h1 className="article-title mb-3">{newsItem.title}</h1>
            
            <div className="article-meta mb-4">
              <div className="d-flex align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <User className="me-2" size={16} />
                  <span className="text-muted">
                    {newsItem.creator?.[0] || 'Unknown Author'}
                  </span>
                </div>
                
                <div className="d-flex align-items-center">
                  <Calendar className="me-2" size={16} />
                  <span className="text-muted">
                    {new Date(newsItem.pubDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="d-flex align-items-center">
                  <Eye className="me-2" size={16} />
                  <span className="text-muted">Crypto News</span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {newsItem.image_url && (
            <div className="featured-image-container mb-4">
              <img
                src={newsItem.image_url}
                alt={newsItem.title}
                className="img-fluid rounded featured-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/800x400?text=News+Image';
                }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="article-content mb-4">
            {newsItem.description && (
              <div className="article-excerpt mb-4">
                <p className="lead text-muted">{newsItem.description}</p>
              </div>
            )}
            
            {newsItem.content && (
              <div className="article-body">
                <div 
                  className="content-html"
                  dangerouslySetInnerHTML={{ 
                    __html: newsItem.content.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            )}
          </div>

          {/* Article Footer */}
          <div className="article-footer">
            <hr className="my-4" />
            
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex gap-2">
                <Button onClick={handleShare} variant="outline-primary" size="sm">
                  <Share2 className="me-2" size={16} />
                  Share
                </Button>
                
                <Button variant="outline-secondary" size="sm">
                  <Bookmark className="me-2" size={16} />
                  Bookmark
                </Button>
              </div>
              
              <Button onClick={handleExternalLink} variant="primary" size="sm">
                <ExternalLink className="me-2" size={16} />
                Read on {newsItem.source_name || 'Original Source'}
              </Button>
            </div>
            
            {newsItem.keywords && newsItem.keywords.length > 0 && (
              <div className="keywords-section mt-4">
                <h6 className="text-muted mb-2">Tags:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {newsItem.keywords.slice(0, 10).map((keyword, index) => (
                    <Badge key={index} bg="light" text="dark" className="px-2 py-1">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NewsDetail;
