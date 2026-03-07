import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
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
        // Fetch from AI news endpoints on BOTH backends (Render + Camify) for reliability
        const CAMIFY = 'https://camify.fun.coinsclarity.com';
        const endpoints = [
          { url: `${CAMIFY}/fetch-mit-ai-rss?limit=12`, source: 'MIT AI News' },
          { url: `${CAMIFY}/fetch-venturebeat-ai-rss?limit=12`, source: 'VentureBeat AI' },
          { url: `${CAMIFY}/fetch-techcrunch-ai-rss?limit=12`, source: 'TechCrunch AI' },
          { url: `${API_BASE_URL}/fetch-mit-ai-rss?limit=12`, source: 'MIT AI News' },
          { url: `${API_BASE_URL}/fetch-arxiv-ai-rss?limit=12`, source: 'arXiv AI' },
        ];

        let items: any[] = [];

        // Fetch from all endpoints in parallel
        const results = await Promise.allSettled(
          endpoints.map(async (endpoint) => {
            const res = await fetch(endpoint.url, { signal: AbortSignal.timeout(12000) });
            if (!res.ok) throw new Error(`Failed to fetch ${endpoint.source}`);
            const data = await res.json();
            return { data, source: endpoint.source };
          })
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.data?.success) {
            // Handle both { data: [...] } and { items: [...] } response shapes
            const arr = Array.isArray(result.value.data.data)
              ? result.value.data.data
              : Array.isArray(result.value.data.items)
                ? result.value.data.items
                : [];
            const sourceItems = arr.map((item: any) => ({
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
          setError(null);
        } else {
          // Upstream AI feeds can intermittently return empty/blocked.
          // Keep UI stable with an empty state instead of throwing runtime errors.
          setNewsItems([]);
          setError(null);
        }
      } catch (error: any) {
        console.error('Error fetching AI news:', error);
        setNewsItems([]);
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
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 20px' }}>
      {/* Section header */}
      <div className="cc-section-header">
        <h2>AI & Machine Learning</h2>
        <a href="/ai-news" className="cc-view-all" onClick={(e) => { e.preventDefault(); navigate('/ai-news'); }}>
          View All <ChevronRight size={14} />
        </a>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}

      {isLoading ? (
        <Row xs={1} md={2} lg={4} className="g-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Col key={i}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fff' }}>
                <Skeleton height={180} width="100%" baseColor="#f3f4f6" highlightColor="#fafafa" />
                <div style={{ padding: 16 }}>
                  <Skeleton width="90%" height={16} baseColor="#f3f4f6" highlightColor="#fafafa" />
                  <Skeleton width="70%" height={16} baseColor="#f3f4f6" highlightColor="#fafafa" style={{ marginTop: 8 }} />
                  <Skeleton width="50%" height={12} baseColor="#f3f4f6" highlightColor="#fafafa" style={{ marginTop: 16 }} />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      ) : displayItems.length === 0 && !error ? (
        <Alert variant="warning" className="mb-0" style={{ borderRadius: 10, fontSize: 14 }}>
          AI feeds are temporarily unavailable. Please check back soon.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-3">
          {displayItems.slice(0, 8).map((item, index) => (
            <Col key={item.article_id || item.link || `${item.title}-${index}`}>
              <div
                className="cc-news-card h-100"
                onClick={() => {
                  const targetId = item.article_id || encodeURIComponent(item.title);
                  navigate(`/news/${targetId}`, { state: { item } });
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <img
                    src={item.image_url || getFallbackImage(index, item.title)}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => handleImageError(e, item.title, 'news')}
                  />
                </div>
                <div className="card-body">
                  <div className="card-title">{decodeHtml(item.title)}</div>
                  <div className="card-text">{decodeHtml(item.description)}</div>
                  <div className="card-meta">
                    <span className="author">{(item as any).source || item.creator?.[0] || 'Unknown'}</span>
                    <span>{formatDate(item.pubDate)}</span>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
};

export default AINews;
