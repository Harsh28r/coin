import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
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
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const { currentLanguage } = useLanguage();
  const { displayItems: translatedItems, isTranslating } = useNewsTranslation(newsItem ? [newsItem] : []);
  const effectiveItem = (translatedItems && translatedItems[0]) || newsItem;

  // Compute a simple estimated reading time based on content length
  const getReadingTime = (html?: string): number => {
    if (!html || typeof html !== 'string') return 1;
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    const words = text ? text.split(/\s+/).length : 0;
    return Math.max(1, Math.round(words / 200));
  };

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // First try the dedicated endpoint
        try {
          const byIdRes = await fetch(`${API_BASE_URL}/news-by-id?id=${encodeURIComponent(id)}`);
          if (byIdRes.ok) {
            const byIdData = await byIdRes.json();
            if (byIdData.success && byIdData.data) {
              setNewsItem(byIdData.data);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // fallback chain continues
        }
        
        // Fallback search if direct fetch didn’t find it
        try {
          const searchResponse = await fetch(`${API_BASE_URL}/search-db-news?query=${encodeURIComponent(id)}`);
          const searchData = await searchResponse.json();
          if (searchData.success && searchData.data && Array.isArray(searchData.data)) {
            const foundItem = searchData.data.find((item: NewsItem) => 
              item.article_id === id || (item.link && item.link.includes(id))
            );
            if (foundItem) {
              setNewsItem(foundItem);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
        
        // Fallback: attempt fetch from Defiant endpoint latest items and match
        try {
          const defiantRes = await fetch(`${API_BASE_URL}/fetch-defiant-rss?limit=20`);
          if (defiantRes.ok) {
            const defiantData = await defiantRes.json();
            if (defiantData.success && Array.isArray(defiantData.data)) {
              const match = defiantData.data.find((it: any) => it.article_id === id || (it.link && it.link.includes(id)));
              if (match) {
                setNewsItem(match);
                setLoading(false);
                return;
              }
            }
          }
        } catch (e) {}

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

  if (error || !effectiveItem) {
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
        <Col lg={10} className="mx-auto">
          {/* Breadcrumb / Back */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <Button onClick={handleBack} variant="outline-secondary" size="sm">
              <ArrowLeft className="me-2" size={16} /> Back
            </Button>
            {effectiveItem && effectiveItem.source_name && (
              <Badge bg="light" text="dark" className="rounded-pill">
                {effectiveItem.source_name}
              </Badge>
            )}
          </div>

          {/* Article Header */}
          <div className="article-header mb-4">
            {/* Title */}
            <h1 className="article-title mb-1" style={{ fontWeight: 700, lineHeight: 1.2 }}>
              {effectiveItem.title}
            </h1>
            {isTranslating && currentLanguage !== 'en' && (
              <small className="text-muted d-block mb-2">Translating to {currentLanguage.toUpperCase()}…</small>
            )}
            {/* Meta */}
            <div className="article-meta mb-3">
              <div className="d-flex align-items-center flex-wrap gap-3 text-muted">
                <div className="d-flex align-items-center small">
                  <User className="me-2" size={16} />
                  {effectiveItem.creator?.[0] || 'Unknown Author'}
                </div>
                <div className="vr" />
                <div className="d-flex align-items-center small">
                  <Calendar className="me-2" size={16} />
                  {(() => {
                    const ds = effectiveItem.pubDate;
                    let d = new Date(ds);
                    if (isNaN(d.getTime())) {
                      const isoCandidate = ds.replace(' ', 'T') + 'Z';
                      d = new Date(isoCandidate);
                    }
                    return isNaN(d.getTime())
                      ? ds
                      : d.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                  })()}
                </div>
                <div className="vr" />
                <div className="d-flex align-items-center small">
                  <Eye className="me-2" size={16} />
                  {getReadingTime(effectiveItem?.content)} min read
                </div>
                {effectiveItem && effectiveItem.category && effectiveItem.category.length > 0 && (
                  <>
                    <div className="vr" />
                    <div className="d-flex align-items-center gap-1">
                      {effectiveItem.category.slice(0, 3).map((cat: string, idx: number) => (
                        <Badge key={idx} bg="light" text="dark" className="rounded-pill">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {effectiveItem.image_url && (
            <div className="featured-image-container mb-4">
              <img
                src={effectiveItem.image_url}
                alt={effectiveItem.title}
                className="img-fluid rounded shadow-sm featured-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/800x400?text=News+Image';
                }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="article-content mb-4">
            {effectiveItem.description && (
              <div className="article-excerpt mb-4">
                <p className="lead text-muted" style={{ fontStyle: 'italic' }}>{effectiveItem.description}</p>
              </div>
            )}
            
            {effectiveItem.content && (
              <div className="article-body">
                <div
                  className="content-html"
                  style={{ fontSize: '1.04rem', lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: effectiveItem.content.replace(/\n/g, '<br>') }}
                />
              </div>
            )}
          </div>

          {/* Article Footer */}
          <div className="article-footer">
            <hr className="my-4" />
            
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex gap-2">
                <Button onClick={handleShare} variant="outline-primary" size="sm">
                  <Share2 className="me-2" size={16} /> Share
                </Button>
                <Button variant="outline-secondary" size="sm">
                  <Bookmark className="me-2" size={16} /> Save
                </Button>
              </div>
              <Button onClick={handleExternalLink} variant="primary" size="sm">
                <ExternalLink className="me-2" size={16} /> Read on {effectiveItem.source_name || 'Original Source'}
              </Button>
            </div>
            
            {effectiveItem && effectiveItem.keywords && effectiveItem.keywords.length > 0 && (
              <div className="keywords-section mt-4">
                <h6 className="text-muted mb-2">Tags:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {effectiveItem.keywords.slice(0, 10).map((keyword: string, index: number) => (
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
