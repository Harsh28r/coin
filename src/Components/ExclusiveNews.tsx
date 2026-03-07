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
        // Fetch from Camify (fast) + Render fallback in parallel
        const CAMIFY = 'https://camify.fun.coinsclarity.com';
        const endpoints = [
          `${CAMIFY}/fetch-cointelegraph-rss?limit=24`,
          `${CAMIFY}/fetch-coindesk-rss?limit=24`,
          `${CAMIFY}/fetch-decrypt-rss?limit=24`,
          `${CAMIFY}/fetch-cryptoslate-rss?limit=24`,
          `${CAMIFY}/fetch-cryptobriefing-rss?limit=24`,
          `${CAMIFY}/fetch-beincrypto-rss?limit=24`,
          `${CAMIFY}/fetch-blockworks-rss?limit=24`,
          `${CAMIFY}/fetch-finbold-rss?limit=24`,
          `${CAMIFY}/fetch-protos-rss?limit=24`,
          `${CAMIFY}/fetch-unchained-rss?limit=24`,
          `${CAMIFY}/fetch-thecryptobasic-rss?limit=24`,
          `${CAMIFY}/fetch-blockonomi-rss?limit=24`,
          `${API_BASE_URL}/fetch-all-rss?limit=50`,
        ];

        const results = await Promise.allSettled(
          endpoints.map(url => fetch(url, { signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null))
        );
        let items: any[] = [];
        for (const r of results) {
          if ((r as any)?.status === 'fulfilled' && (r as any).value?.success) {
            const arr = Array.isArray((r as any).value.data) ? (r as any).value.data : Array.isArray((r as any).value.items) ? (r as any).value.items : [];
            items = items.concat(arr);
          }
        }

        if (items.length) {
          const normalizedRaw = items.map((item: any, i: number) => {
            let imageUrl = item.image_url || item.image || '';
            if (!isValidImageUrl(imageUrl)) {
              imageUrl = getFallbackImage(i, item.title);
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

  // Crypto-related fallback images using our crypto utility
  const getFallbackImage = (index: number, title?: string): string => {
    return getCryptoFallbackImage(title || `News Item ${index}`, 'news');
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
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 20px' }}>
      <Helmet>
        <title>Exclusive News | CoinsClarity</title>
        <meta name="description" content="Exclusive crypto stories curated with full content on-platform." />
        <link rel="canonical" href={`${window.location.origin}/exclusive-news`} />
      </Helmet>

      {/* Section header */}
      <div className="cc-section-header">
        <h2>Exclusive News</h2>
        <a href="/exclusive-news" className="cc-view-all" onClick={(e) => { e.preventDefault(); navigate('/exclusive-news'); }}>
          View All <ChevronRight size={14} />
        </a>
      </div>

      {isTranslating && (
        <small style={{ color: '#9ca3af', display: 'block', marginBottom: 12, fontSize: 12 }}>
          🔄 Translating...
        </small>
      )}

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
        <p style={{ color: '#9ca3af' }}>No news available.</p>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-3">
          {displayItems.slice(0, 4).map((item, index) => (
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
                    <span className="author">{item.creator?.[0] || 'Unknown'}</span>
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

export default ExclusiveNews;