import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
          `${API_BASE_URL}/fetch-decrypt-rss?limit=24`,
          `${API_BASE_URL}/fetch-newsbtc-rss?limit=24`
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
              imageUrl = getFallbackImage(i);
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
      <h1 className="mb-4 text-center" style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        borderBottom: '3px solid #f59e0b',
        paddingBottom: '1rem'
      }}>
        Exclusive Crypto News
      </h1>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em', borderBottom: '2px solid orange', marginBottom: '1rem' }}>
          {/* {t('news.exclusiveTitle') || 'Exclusive News'} */}Exclusive News
        </h4>
      </div>
      <Row xs={1} md={2} lg={4} className="g-4">
        {Array.isArray(displayItems) && displayItems.map((item, index) => (
          <Col key={index}>
            <Card className="h-100 border-0 shadow-sm rounded-5">
              <Card.Img 
                variant="top rounded-4" 
                src={item.image_url} 
                alt={item.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = getFallbackImage(index);
                }}
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fs-6 mb-3 text-start custom-text" style={{ fontWeight: 'bold', color: 'black', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, maxHeight: '3em' }}>
                  <a 
                    href={`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item } }); }}
                    className="text-black text-decoration-none"
                    style={{ cursor: 'pointer' }}
                  >
                    {decodeHtml(item.title)}
                  </a>
                </Card.Title>
                <Card.Text className="text-muted small flex-grow-1 text-start custom-text fs-7" style={{ overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, maxHeight: '3em' }}>
                  {decodeHtml(item.description)}
                </Card.Text>
                 <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">By </small>
                     <small className="text-warning "> {Array.isArray(item.creator) && item.creator.length > 0 ? item.creator[0] : 'Unknown'}</small>
                  </div>
                  <div className="ms-auto text-end">
                    <small className="text-muted">{formatDate(item.pubDate)}</small>
                  </div>
                </div>
                <Button 
                  variant="warning"
                  onClick={() => navigate(`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`, { state: { item } })}
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