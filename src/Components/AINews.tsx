import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { getCryptoFallbackImage, handleImageError } from '../utils/cryptoImages';

interface NewsItem {
  article_id?: string;
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
  content?: string;
  source?: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const AINews: React.FC = () => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use the translation hook
  const { displayItems, isTranslating, currentLanguage } = useNewsTranslation(newsItems);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

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
        // Fetch from both AI news endpoints
        const endpoints = [
          { url: `${API_BASE_URL}/fetch-mit-ai-rss?limit=12`, source: 'MIT AI News' },
          { url: `${API_BASE_URL}/fetch-arxiv-ai-rss?limit=12`, source: 'arXiv AI' }
        ];

        let items: any[] = [];

        // Fetch from all endpoints in parallel
        const results = await Promise.allSettled(
          endpoints.map(async (endpoint) => {
            const res = await fetch(endpoint.url);
            if (!res.ok) throw new Error(`Failed to fetch ${endpoint.source}`);
            const data = await res.json();
            return { data, source: endpoint.source };
          })
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.data?.success && Array.isArray(result.value.data.data)) {
            const sourceItems = result.value.data.data.map((item: any) => ({
              ...item,
              source: result.value.source
            }));
            items = items.concat(sourceItems);
          }
        });

        if (items.length) {
          // Normalize
          const normalizedRaw = items.map((item: any, i: number) => {
            let imageUrl = item.image_url || item.image || '';
            if (!isValidImageUrl(imageUrl)) {
              imageUrl = getFallbackImage(i, item.title);
            }
            return {
              article_id: item.article_id,
              title: item.title || 'Untitled',
              description: item.excerpt || buildExcerpt(item.description || item.content, 160) || 'No description available',
              creator: Array.isArray(item.creator) ? item.creator : [item.source || item.creator || 'Unknown'],
              pubDate: item.pubDate || new Date().toISOString(),
              image_url: imageUrl,
              link: item.link || '#',
              content: item.content || '',
              source: item.source || 'AI News',
            } as NewsItem;
          });

          // De-duplicate
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

          setNewsItems(deduped.slice(0, 8));
        } else {
          throw new Error('No items fetched from AI sources');
        }
      } catch (error: any) {
        console.error('Error fetching AI news:', error);
        setError('Failed to load AI news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // AI-themed fallback images
  const getFallbackImage = (index: number, title?: string): string => {
    return getCryptoFallbackImage(title || `AI News ${index}`, 'news');
  };

  // Format date consistently
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Unknown Date';
      let d = new Date(dateString);
      if (isNaN(d.getTime())) {
        const isoCandidate = dateString.replace(' ', 'T') + 'Z';
        d = new Date(isoCandidate);
      }
      if (isNaN(d.getTime())) return dateString;
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
            AI & Machine Learning
          </h4>
          {isTranslating && (
            <small className="text-muted">
              Translating to {currentLanguage === 'hi' ? 'Hindi' :
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
          onClick={() => navigate('/ai-news')}
          aria-label="View all AI news"
        >
          View All
          <ChevronRight className="ms-2" size={16} />
        </Button>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {isLoading ? (
        <Row xs={1} md={2} lg={4} className="g-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Col key={index}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Skeleton height={200} className="rounded-top-4" />
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
        <p>No AI news available.</p>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-4">
          {displayItems.slice(0, 8).map((item, index) => (
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
                  className="rounded-top-4"
                  src={item.image_url || getFallbackImage(index, item.title)}
                  alt={item.title}
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    handleImageError(e, item.title, 'news');
                  }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title
                    className="fs-6 mb-3 text-start"
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
                      onClick={(e) => {
                        e.preventDefault();
                        const targetId = item.article_id || encodeURIComponent(item.title);
                        navigate(`/news/${targetId}`, { state: { item } });
                      }}
                    >
                      {decodeHtml(item.title)}
                    </a>
                  </Card.Title>
                  <Card.Text
                    className="text-muted small flex-grow-1 text-start fs-7"
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
                        {(item as any).source || item.creator?.[0] || 'Unknown'}
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

export default AINews;
