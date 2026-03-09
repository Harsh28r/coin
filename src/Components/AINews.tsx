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
import { BRAND_DISPLAY_NAME } from '../utils/branding';

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
    const CAMIFY = 'https://camify.fun.coinsclarity.com';
    const USE_API_FALLBACK = API_BASE_URL && !API_BASE_URL.includes('localhost');
    const bases = [CAMIFY, ...(USE_API_FALLBACK ? [API_BASE_URL.replace(/\/$/, '')] : [])];

    const fetchJson = async (url: string, timeoutMs = 10000) => {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      } finally {
        clearTimeout(id);
      }
    };

    const extractArr = (data: any): any[] => {
      if (!data) return [];
      return Array.isArray(data.data) ? data.data : Array.isArray(data.items) ? data.items : [];
    };

    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const aiPaths = [
          { path: 'fetch-mit-ai-rss', source: 'MIT AI News' },
          { path: 'fetch-venturebeat-ai-rss', source: 'VentureBeat AI' },
          { path: 'fetch-techcrunch-ai-rss', source: 'TechCrunch AI' },
          { path: 'fetch-arxiv-ai-rss', source: 'arXiv AI' },
          { path: 'fetch-chaingpt-rss', source: 'ChainGPT' },
          { path: 'fetch-watcherguru-rss', source: 'Watcher Guru' },
        ];

        let items: any[] = [];

        for (const { path, source } of aiPaths) {
          const suffix = `${path}?limit=12`;
          for (const base of bases) {
            const data = await fetchJson(`${base}/${suffix}`);
            const arr = extractArr(data);
            if (arr.length) {
              items = items.concat(arr.map((item: any) => ({ ...item, source })));
              break;
            }
          }
        }

        if (items.length === 0) {
          const fallbackPaths = [
            { path: 'fetch-coindesk-rss', source: 'CoinDesk' },
            { path: 'fetch-cointelegraph-rss', source: 'Cointelegraph' },
            { path: 'fetch-decrypt-rss', source: 'Decrypt' },
            { path: 'fetch-cryptoslate-rss', source: 'CryptoSlate' },
            { path: 'fetch-blockworks-rss', source: 'Blockworks' },
            { path: 'fetch-beincrypto-rss', source: 'BeInCrypto' },
            { path: 'fetch-cryptobriefing-rss', source: 'Crypto Briefing' },
            { path: 'fetch-coingape-rss', source: 'CoinGape' },
            { path: 'fetch-finbold-rss', source: 'Finbold' },
            { path: 'fetch-protos-rss', source: 'Protos' },
            { path: 'fetch-dailycoin-rss', source: 'DailyCoin' },
            { path: 'fetch-cryptopotato-rss', source: 'CryptoPotato' },
            { path: 'fetch-utoday-rss', source: 'U.Today' },
            { path: 'fetch-coinpedia-rss', source: 'Coinpedia (India)' },
            { path: 'fetch-coincu-rss', source: 'CoinCu' },
            { path: 'fetch-cryptonewsz-rss', source: 'CryptoNewsZ (India)' },
            { path: 'fetch-bitcoinist-rss', source: 'Bitcoinist' },
            { path: 'fetch-thecryptobasic-rss', source: 'The Crypto Basic' },
            { path: 'fetch-unchained-rss', source: 'Unchained' },
            { path: 'fetch-all-rss', source: 'Crypto News' },
          ];
          for (const { path, source } of fallbackPaths) {
            const suffix = `${path}?limit=12`;
            for (const base of bases) {
              const data = await fetchJson(`${base}/${suffix}`);
              const arr = extractArr(data);
              if (arr.length) {
                items = items.concat(arr.map((item: any) => ({ ...item, source })));
                if (items.length >= 8) break;
              }
            }
            if (items.length >= 8) break;
          }
        }

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
              source: BRAND_DISPLAY_NAME,
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
          AI feeds are temporarily unavailable right now. Please check back in a few minutes.
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
                    <span className="author">{BRAND_DISPLAY_NAME}</span>
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
