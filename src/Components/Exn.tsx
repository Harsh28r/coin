import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { getCryptoFallbackImage, handleImageError } from '../utils/cryptoImages';

// Add CSS animations
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .crypto-card {
    animation: slideInUp 0.6s ease-out;
  }
  
  .crypto-card:nth-child(1) { animation-delay: 0.1s; }
  .crypto-card:nth-child(2) { animation-delay: 0.2s; }
  .crypto-card:nth-child(3) { animation-delay: 0.3s; }
  .crypto-card:nth-child(4) { animation-delay: 0.4s; }
  
  .live-indicator {
    animation: pulse 2s infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

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
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

  // No HTML extraction. We prefer provided image_url or a high-quality crypto fallback.

  const isValidImageUrl = (url?: string): boolean => {
    if (!url) return false;
    if (!/^https?:\/\//i.test(url)) return false;
    const extOk = /(jpg|jpeg|png|gif|webp|svg|avif)(\?|#|$)/i.test(url);
    return extOk || url.includes('/media/') || url.includes('/uploads/') || url.includes('cdn');
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

  const buildExcerpt = (htmlOrText?: string, maxLen: number = 160): string => {
    const text = stripHtmlTags(htmlOrText) || '';
    if (text.length <= maxLen) return text;
    const cut = text.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…';
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Try multiple sources in order until we have enough items
        const endpoints = [
          `${API_BASE_URL}/fetch-all-rss?limit=24`,
          `${API_BASE_URL}/fetch-rss?limit=24`,
          `${API_BASE_URL}/fetch-defiant-rss?limit=24`,
          `${API_BASE_URL}/fetch-coindesk-rss?limit=24`,
          `${API_BASE_URL}/fetch-cryptoslate-rss?limit=24`,
          `${API_BASE_URL}/fetch-decrypt-rss?limit=24`
        ];

        let items: any[] = [];
        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            if (data && Array.isArray(data.data) && data.data.length) {
              items = items.concat(data.data);
            }
          } catch (e) {
            // continue
          }
          if (items.length >= 12) break;
        }

        if (items.length) {
          // Normalize
          const normalizedRaw = items.map((item: any, i: number) => {
            let imageUrl = item.image_url || item.image || (typeof item.enclosure === 'string' ? item.enclosure : undefined) || '';
            if (!isValidImageUrl(imageUrl)) {
              imageUrl = getFallbackImage(i, item.title);
            }
            return {
              article_id: item.article_id,
              title: item.title || 'Untitled',
              description: item.excerpt || buildExcerpt(item.description || item.content, 160) || 'No description available',
              creator: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
              pubDate: item.pubDate || new Date().toISOString(),
              image_url: imageUrl,
              link: item.link || '#',
              content: item.content || '',
            } as NewsItem;
          });

          // De-duplicate by article_id -> link -> title
          const seen = new Set<string>();
          const deduped: NewsItem[] = [];
          for (const n of normalizedRaw) {
            const key = n.article_id || n.link || n.title;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(n);
            }
          }

          // Sort by date desc
          deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

          setNewsItems(deduped.slice(0, 12));
        } else {
          console.error('Fetched data is not an array or empty');
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, []);

  // Crypto-related fallback images using our crypto utility
  const getFallbackImage = (index: number, title?: string): string => {
    return getCryptoFallbackImage(title || `News Item ${index}`, 'news');
  };

  // Robust date formatter to handle backend formats like "YYYY-MM-DD HH:mm:ss"
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Unknown Date';
      let d = new Date(dateString);
      if (isNaN(d.getTime())) {
        const isoCandidate = dateString.replace(' ', 'T') + 'Z';
        d = new Date(isoCandidate);
      }
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString || 'Unknown Date';
    }
  };

  return (
    <Container fluid className="mt-5" style={{ width: '92%' }}>
      {/* Hero Section with Gradient Background */}
      <div className="text-center mb-5 p-4 rounded-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <h1 className="mb-3" style={{ 
          fontSize: '3rem', 
          fontWeight: '800',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 1
        }}>
          Exclusive Crypto News
        </h1>
        <p className="mb-0 fs-5" style={{ 
          opacity: 0.9,
          position: 'relative',
          zIndex: 1
        }}>
          Stay ahead with the latest blockchain insights and market analysis
        </p>
      </div>

      {/* Section Header with Crypto Icons */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded-3" style={{
        background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid #00d4aa',
        position: 'relative'
      }}>
        <div className="d-flex align-items-center">
          <div className="me-3" style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(45deg, #00d4aa, #00ff88)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: 'white'
          }}>
            C
          </div>
          <h4 className="m-0 text-white" style={{ 
            fontWeight: 'bold', 
            letterSpacing: '0.05em',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            Latest Market Updates
          </h4>
        </div>
        <div className="d-flex align-items-center">
          <span className="me-2 text-success live-indicator">●</span>
          <small className="text-light">Live Updates</small>
        </div>
      </div>
      <Row xs={1} md={2} lg={4} className="g-4">
        {Array.isArray(displayItems) && displayItems.map((item, index) => (
          <Col key={index}>
            <Card className="h-100 border-0 shadow-lg rounded-4 crypto-card" style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            }}
            onClick={() => navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item } })}>
              
              {/* Crypto Badge */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'linear-gradient(45deg, #00d4aa, #00ff88)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                zIndex: 2,
                boxShadow: '0 2px 8px rgba(0,212,170,0.3)'
              }}>
                CRYPTO
              </div>

              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <Card.Img 
                  variant="top" 
                  src={item.image_url} 
                  alt={item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  style={{
                    height: '200px',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onError={(e) => {
                    handleImageError(e, item.title, 'news');
                  }}
                />
                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  zIndex: 1
                }}></div>
              </div>

              <Card.Body className="d-flex flex-column p-4">
                <Card.Title className="fs-6 mb-3 text-start" style={{ 
                  fontWeight: 'bold', 
                  color: '#1a1a2e',
                  overflow: 'hidden', 
                  display: '-webkit-box', 
                  WebkitBoxOrient: 'vertical', 
                  WebkitLineClamp: 2, 
                  maxHeight: '3em',
                  lineHeight: '1.4'
                }}>
                  {decodeHtml(item.title)}
                </Card.Title>

                <Card.Text className="text-muted small flex-grow-1 text-start fs-7 mb-3" style={{ 
                  overflow: 'hidden', 
                  display: '-webkit-box', 
                  WebkitBoxOrient: 'vertical', 
                  WebkitLineClamp: 3, 
                  maxHeight: '4.5em',
                  lineHeight: '1.5'
                }}>
                  {decodeHtml(item.description)}
                </Card.Text>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(45deg, #ff6b35, #f59e0b)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginRight: '8px'
                      }}>
                        A
                      </div>
                      <small className="text-muted">
                        {Array.isArray(item.creator) && item.creator.length > 0 ? item.creator[0] : 'Unknown'}
                      </small>
                    </div>
                    <div className="text-end">
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatDate(item.pubDate)}
                      </small>
                    </div>
                  </div>

                  <Button 
                    variant="outline-warning"
                    onClick={(e) => { 
                      e.stopPropagation();
                      navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item } }); 
                    }}
                    className="w-100"
                    style={{
                      background: 'linear-gradient(45deg, #f59e0b, #ff6b35)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '10px',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(45deg, #ff6b35, #f59e0b)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(45deg, #f59e0b, #ff6b35)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Read Full Story
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Exn;