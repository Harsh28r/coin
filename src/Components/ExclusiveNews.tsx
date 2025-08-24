// src/components/ExclusiveNews.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS
import { useLanguage } from '../context/LanguageContext';
import { Helmet } from 'react-helmet-async';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

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
const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const ExclusiveNews: React.FC = () => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initialize as true
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use the translation hook
  const { displayItems, isTranslating, currentLanguage } = useNewsTranslation(newsItems);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const MOCK_API_BASE_URL = process.env.REACT_APP_USE_LOCAL_DB === 'true' ? 'http://localhost:5000' : '';

  // Helpers to improve excerpts

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
      setIsLoading(true);
      setError(null);
      try {
        // Try multiple sources in order until we have enough items
        const endpoints = [
          `${API_BASE_URL}/fetch-all-rss?limit=24`,
          `${API_BASE_URL}/fetch-defiant-rss?limit=24`,
          `${API_BASE_URL}/fetch-coindesk-rss?limit=24`,
          `${API_BASE_URL}/fetch-cryptoslate-rss?limit=24`,
          `${API_BASE_URL}/fetch-decrypt-rss?limit=24`,
          `${API_BASE_URL}/fetch-newsbtc-rss?limit=24`,
          `${API_BASE_URL}/fetch-bitcoinmagazine-rss?limit=24`,
          `${API_BASE_URL}/fetch-ambcrypto-rss?limit=24`,
          `${API_BASE_URL}/fetch-dailycoin-rss?limit=24`,
          `${API_BASE_URL}/fetch-beincrypto-rss?limit=24`,
          `${API_BASE_URL}/fetch-cryptopotato-rss?limit=24`,
          `${API_BASE_URL}/fetch-utoday-rss?limit=24`
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
          } catch (e) {}
          if (items.length >= 12) break;
        }

        if (items.length) {
          const normalizedRaw = items.map((item: any, i: number) => {
            let imageUrl = item.image_url || item.image || '';
            if (!isValidImageUrl(imageUrl)) {
              imageUrl = getFallbackImage(i);
            }
            return {
              article_id: item.article_id,
              title: item.title || 'Untitled',
              description: item.excerpt || buildExcerpt(item.description || item.content, 160) || 'No description available',
              creator: Array.isArray(item.creator) ? item.creator : [item.creator || item.author || 'Unknown'],
              pubDate: item.pubDate || new Date().toISOString(),
              image_url: imageUrl,
              link: item.link || '#',
              content: item.content || '',
            } as NewsItem;
          });

          // De-duplicate and take top 6
          const seen = new Set<string>();
          const deduped: NewsItem[] = [];
          for (const n of normalizedRaw) {
            const key = n.article_id || n.link || n.title;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(n);
            }
          }
          deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          setNewsItems(deduped.slice(0, 6));
        } else {
          throw new Error('No items fetched from available sources');
        }
      } catch (error: any) {
        console.error('Error fetching news:', error);
        setError('Failed to load news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

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

  // Format date consistently with fallback for backend format "YYYY-MM-DD HH:mm:ss"
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Unknown Date';
      let d = new Date(dateString);
      if (isNaN(d.getTime())) {
        const isoCandidate = dateString.replace(' ', 'T') + 'Z';
        d = new Date(isoCandidate);
      }
      if (isNaN(d.getTime())) return dateString; // show raw if still unparseable
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString || 'Unknown Date';
    }
  };

  return (
    <Container fluid className="mt-5 skeleton-container" style={{ width: '92%' }}>
      <Helmet>
        <title>Exclusive News | CoinsClarity</title>
        <meta name="description" content="Exclusive crypto stories curated with full content on-platform." />
        <link rel="canonical" href={`${window.location.origin}/exclusive-news`} />
      </Helmet>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
            {/* {t('news.exclusiveTitle')} */}ExclusiveNews
          </h4>
          {isTranslating && (
            <small className="text-muted">
              🔄 Translating news content to {currentLanguage === 'hi' ? 'Hindi' : 
                currentLanguage === 'es' ? 'Spanish' :
                currentLanguage === 'fr' ? 'French' :
                currentLanguage === 'de' ? 'German' :
                currentLanguage === 'zh' ? 'Chinese' :
                currentLanguage === 'ja' ? 'Japanese' :
                currentLanguage === 'ko' ? 'Korean' :
                currentLanguage === 'ar' ? 'Arabic' : currentLanguage}...
            </small>
          )}
        </div>
        <Button
          variant="link"
          className="text-warning text-decoration-none"
          onClick={() => navigate('/exclusive-news')}
          aria-label="View all news"
        >
          {/* {t('news.viewAll')} */}viewAll
          <ChevronRight className="ms-2" size={16} />
        </Button>
      </div>

      {error && <p className="text-danger">{error}</p>}
             {isLoading ? (
                  <Row xs={1} md={2} lg={3} className="g-4">
           {Array.from({ length: 6 }).map((_, index) => (
                         <Col key={index}>
               <Card className="h-100 border-0 shadow-sm rounded-4">
                 <img 
                   src={getFallbackImage(index)} 
                   alt={`Loading card ${index + 1}`}
                   className="img-fluid rounded-4"
                   style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                 />
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
      ) : displayItems.length === 0 && !error ? (
        <p>No news available.</p>
      ) : (
                 <Row xs={1} md={2} lg={4} className="g-4">
           {displayItems.slice(0, 4).map((item, index) => (
            <Col key={item.article_id || item.link || `${item.title}-${index}`}>
              <Card
                className="h-100 border-0 shadow-sm rounded-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const targetId = item.article_id || encodeURIComponent(item.title);
                  navigate(`/news/${targetId}`, { state: { item } });
                }}
              >
                                 <Card.Img
                   variant="top"
                   className="rounded-4"
                   src={item.image_url || getFallbackImage(index)}
                   alt={item.title}
                   onError={(e) => {
                     e.currentTarget.src = getFallbackImage(index);
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
                       href={`/news/${item.article_id || encodeURIComponent(item.title)}`}
                       className="text-black text-decoration-none"
                       aria-label={item.title}
                       style={{ cursor: 'pointer' }}
                       onClick={(e) => { e.preventDefault();
                         const targetId = item.article_id || encodeURIComponent(item.title);
                         navigate(`/news/${targetId}`, { state: { item } });
                       }}
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