import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { computeImpactLevel } from '../utils/impact';
import { ArrowLeft, Share2, Bookmark, Eye, Calendar, User, Volume2, Square } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Helmet } from 'react-helmet-async';
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
  // Prefer env, fallback to the backend used elsewhere in the app
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const effectiveItem = newsItem;

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

  const location = useLocation();
  const navState: any = location.state;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
  const ttsUtterancesRef = useRef<SpeechSynthesisUtterance[] | null>(null);
  const [priceSnapshot, setPriceSnapshot] = useState<Record<string, { price?: number; change24h?: number }>>({});
  const [following, setFollowing] = useState<string[]>(() => {
    try { const raw = localStorage.getItem('followingCoins'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!id) return;
      
      const fromState = navState && (navState.item || navState.newsItem);
      if (fromState) {
        const incoming = fromState as NewsItem;
        setNewsItem(incoming);
        setLoading(false);
        setError(null);
        // If we already have full content, skip background enrichment entirely
        if (incoming.content && incoming.content.trim().length > 80) {
          return;
        }
      } else {
        setLoading(true);
      }

      // Camify backend (AWS)
      const CAMIFY_BASE = 'https://camify.fun.coinsclarity.com';
      
      // All RSS endpoints on camify
      const RSS_ENDPOINTS = [
        '/fetch-cryptoslate-rss?limit=50',
        '/fetch-cointelegraph-rss?limit=50',
        '/fetch-coindesk-rss?limit=50',
        '/fetch-decrypt-rss?limit=50',
        '/fetch-bitcoinist-rss?limit=50',
        '/fetch-rss?limit=50',
        '/fetch-all-rss?limit=100',
      ];

      try {
        if (!fromState) setLoading(true);
        let resolved: NewsItem | null = null;

        // 1) Try /posts endpoint for blog posts
        try {
          const postsRes = await fetch(`${CAMIFY_BASE}/posts`);
          if (postsRes.ok) {
            const postsData = await postsRes.json();
            if (postsData.success && Array.isArray(postsData.data)) {
              const match = postsData.data.find((item: any) => {
                return item._id === id || item.article_id === id;
              });
              if (match) {
                resolved = {
                  article_id: match._id || match.article_id,
                  title: match.title,
                  description: match.content?.substring(0, 200) || '',
                  content: match.content,
                  creator: match.author ? [match.author] : [],
                  pubDate: match.date,
                  image_url: match.imageUrl,
                  link: '',
                  source_name: 'CoinsClarity',
                } as NewsItem;
              }
            }
          }
        } catch {}

        // 2) Try search endpoint
        if (!resolved) {
          try {
            const searchRes = await fetch(`${CAMIFY_BASE}/search-db-news?query=${encodeURIComponent(id)}`);
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.success && Array.isArray(searchData.data)) {
                const match = searchData.data.find((item: any) => {
                  return item.article_id === id || item._id === id;
                });
                if (match) resolved = match;
              }
            }
          } catch {}
        }

        // 3) Try all RSS endpoints
        if (!resolved) {
          for (const endpoint of RSS_ENDPOINTS) {
            if (resolved) break;
            try {
              const rssRes = await fetch(`${CAMIFY_BASE}${endpoint}`);
              if (rssRes.ok) {
                const rssData = await rssRes.json();
                if (rssData.success && Array.isArray(rssData.data)) {
                  const match = rssData.data.find((it: any) => {
                    return it.article_id === id || it._id === id;
                  });
                  if (match) {
                    resolved = match;
                    break;
                  }
                }
              }
            } catch {}
          }
        }

        if (resolved) {
          setNewsItem(resolved);
          setError(null);
        } else if (!fromState) {
          setError('News article not found');
        }
        if (!fromState) setLoading(false);
      } catch (err) {
        console.error('Error fetching news detail:', err);
        setError('Failed to load news article');
        if (!fromState) setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id, API_BASE_URL, navState]);

  // Sync bookmark state with localStorage
  useEffect(() => {
    if (effectiveItem?.article_id) {
      const stored = localStorage.getItem(`bookmark:${effectiveItem.article_id}`);
      setIsBookmarked(stored === '1');
    }
  }, [effectiveItem?.article_id]);

  // Reading progress tracking
  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const articleTop = el.getBoundingClientRect().top + window.scrollY;
      const totalScrollable = el.scrollHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(window.scrollY - articleTop, 0), totalScrollable);
      const pct = totalScrollable > 0 ? (scrolled / totalScrollable) * 100 : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [effectiveItem?.article_id]);

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
      setCopyFeedback('Link copied to clipboard');
      setTimeout(() => setCopyFeedback(null), 1500);
    }
  };



  const stopTts = () => {
    try {
      const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
      if (synth) synth.cancel();
    } catch {}
    ttsUtterancesRef.current = null;
    setIsTtsPlaying(false);
  };

  const startTts = () => {
    try {
      const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
      if (!synth) return;
      const rawHtml = (newsItem?.content || newsItem?.description || '');
      if (!rawHtml) return;
      const text = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) return;
      const chunks: string[] = [];
      const maxLen = 400;
      let i = 0;
      while (i < text.length) {
        const slice = text.slice(i, i + maxLen);
        let end = slice.lastIndexOf('. ');
        if (end < maxLen * 0.4) end = slice.length;
        chunks.push(slice.slice(0, end).trim());
        i += end;
      }
      if (chunks.length === 0) return;
      // Use English voice for TTS
      const voices = (window as any).speechSynthesis?.getVoices() || [];
      const voice = voices.find((v: SpeechSynthesisVoice) => (v.lang || '').toLowerCase().startsWith('en'));
      const utterances = chunks.map((c) => {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = 'en-US';
        if (voice) u.voice = voice;
        return u;
      });
      utterances.forEach((u, idx) => {
        if (idx === utterances.length - 1) u.onend = () => setIsTtsPlaying(false);
        synth.speak(u);
      });
      ttsUtterancesRef.current = utterances;
      setIsTtsPlaying(true);
    } catch {}
  };

  const handleBookmarkToggle = () => {
    if (!effectiveItem?.article_id) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      if (next) {
        localStorage.setItem(`bookmark:${effectiveItem.article_id}`, '1');
      } else {
        localStorage.removeItem(`bookmark:${effectiveItem.article_id}`);
      }
    } catch {}
  };

  // REMOVED: Article extraction to comply with AdSense policies
  // We no longer scrape full article content from external sources
  // Instead, we show summaries and link to original sources

  // Normalize content to formal HTML paragraphs when needed
  const getNormalizedContentHtml = (htmlOrText?: string): string => {
    const raw = (htmlOrText || '').trim();
    if (!raw) return '';
    const looksLikeHtml = /<[^>]+>/.test(raw);
    if (looksLikeHtml) return raw;
    const paragraphs = raw
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`) // preserve single newlines within a paragraph
      .join('');
    return paragraphs || `<p>${raw}</p>`;
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center" style={{ backgroundColor: '#111827', minHeight: '60vh', paddingTop: '80px' }}>
          <div className="spinner-border" role="status" style={{ color: '#f97316' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#fff' }}>Loading news article...</p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
            This may take a moment if the server is waking up
          </p>
        </div>
      </Container>
    );
  }

  if (!effectiveItem) {
    return (
      <Container className="mt-5">
        <div className="text-center" style={{ backgroundColor: '#111827', minHeight: '60vh', paddingTop: '80px' }}>
          <h3 style={{ color: '#fff' }}>Article Not Found</h3>
          <p style={{ color: '#9ca3af' }}>{error || 'The requested news article could not be found.'}</p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
            This may happen if the server is waking up. Try refreshing the page.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button onClick={() => window.location.reload()} variant="warning" style={{ backgroundColor: '#f97316', border: 'none' }}>
              Retry
            </Button>
            <Button onClick={handleBack} variant="outline-secondary">
              <ArrowLeft className="me-2" size={16} />
              Go Back
            </Button>
          </div>
        </div>
      </Container>
    );
  }
  //hi

  return (
    <Container className="mt-4 news-detail-container" fluid>
      <Helmet>
        <title>{effectiveItem.title} | CoinsClarity</title>
        <meta name="description" content={effectiveItem.description?.slice(0, 160) || effectiveItem.title} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={effectiveItem.title} />
        <meta property="og:description" content={effectiveItem.description || effectiveItem.title} />
        <meta property="og:image" content={effectiveItem.image_url} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={effectiveItem.title} />
        <meta name="twitter:description" content={effectiveItem.description || effectiveItem.title} />
        <meta name="twitter:image" content={effectiveItem.image_url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: effectiveItem.title,
          description: effectiveItem.description,
          image: [effectiveItem.image_url].filter(Boolean),
          author: effectiveItem.creator?.[0] ? [{ '@type': 'Person', name: effectiveItem.creator[0] }] : undefined,
          datePublished: effectiveItem.pubDate,
          dateModified: effectiveItem.pubDate,
          mainEntityOfPage: window.location.href,
          publisher: { '@type': 'Organization', name: 'CoinsClarity', logo: { '@type': 'ImageObject', url: '/logo3.png' } }
        })}</script>
      </Helmet>
      <div className="reading-progress"><div className="reading-progress__bar" style={{ width: `${progress}%` }} /></div>
      <Row>
        <Col lg={10} md={11} sm={12} className="mx-auto">
          {/* Breadcrumb / Back - Mobile Optimized */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <Button onClick={handleBack} variant="outline-secondary" size="sm" className="d-flex align-items-center">
              <ArrowLeft className="me-2" size={16} /> 
              <span className="d-none d-sm-inline">Back</span>
            </Button>

          </div>

          {/* Article Header - Mobile Optimized */}
          <div className="article-header mb-4">
            {/* Title */}
            <h1 className="article-title mb-1">
              {effectiveItem.title}
            </h1>
            {/* Meta - Mobile Optimized */}
            <div className="article-meta mb-3">
              <div className="d-flex align-items-center flex-wrap gap-3 text-muted">
                <div className="d-flex align-items-center small">
                  <User className="me-2" size={16} />
                  <span style={{ color: '#fb923c' }}>{effectiveItem.creator?.[0] || 'Unknown Author'}</span>
                </div>
                <div className="vr d-none d-md-block" />
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
                <div className="vr d-none d-md-block" />
                <div className="d-flex align-items-center small">
                  <Eye className="me-2" size={16} />
                  {getReadingTime(effectiveItem?.content)} min read
                </div>
                <div className="vr d-none d-md-block" />
                <span className="badge bg-light text-dark">
                  {(() => { const r = computeImpactLevel(effectiveItem); return `Impact: ${r.level}${r.affectedCoins.length ? ' • ' + r.affectedCoins.join(', ') : ''}`; })()}
                </span>
                {effectiveItem && effectiveItem.category && effectiveItem.category.length > 0 && (
                  <>
                    <div className="vr d-none d-md-block" />
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
            {/* Action Bar - Mobile Optimized */}
            <div className="action-bar d-flex align-items-center gap-2 flex-wrap">
              <Button onClick={handleShare} variant="outline-primary" size="sm" className="d-flex align-items-center">
                <Share2 className="me-2" size={16} /> 
                <span className="d-none d-sm-inline">Share</span>
              </Button>
              <Button onClick={handleBookmarkToggle} variant={isBookmarked ? 'primary' : 'outline-secondary'} size="sm" className="d-flex align-items-center">
                <Bookmark className="me-2" size={16} /> 
                <span className="d-none d-sm-inline">{isBookmarked ? 'Saved' : 'Save'}</span>
              </Button>
              <div className="vr d-none d-md-block" />
              <div className="d-flex align-items-center gap-1">
                <Button variant="outline-secondary" size="sm" onClick={() => setFontScale((v) => Math.max(0.9, Number((v - 0.1).toFixed(2))))}>A-</Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setFontScale((v) => Math.min(1.4, Number((v + 0.1).toFixed(2))))}>A+</Button>
              </div>
              <div className="vr d-none d-md-block" />
              {!isTtsPlaying ? (
                <Button variant="outline-secondary" size="sm" onClick={startTts} title="Listen to article" className="d-flex align-items-center">
                  <Volume2 className="me-2" size={16} /> 
                  <span className="d-none d-sm-inline">Brief</span>
                </Button>
              ) : (
                <Button variant="outline-danger" size="sm" onClick={stopTts} title="Stop audio" className="d-flex align-items-center">
                  <Square className="me-2" size={16} /> 
                  <span className="d-none d-sm-inline">Stop</span>
                </Button>
              )}
            </div>
          </div>

          {/* Featured Image - Mobile Optimized */}
          {effectiveItem.image_url && (
            <div className="featured-image-container mb-4">
              <img
                src={effectiveItem.image_url}
                alt={effectiveItem.title}
                className="img-fluid rounded shadow-sm featured-image"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/800x400?text=News+Image';
                }}
              />
            </div>
          )}

          {/* Article Summary - AdSense Compliant */}
          <div className="article-content mb-4" ref={contentRef}>
            {/* Summary/Description */}
            <div className="article-body" style={{ fontSize: `${(1.0 * fontScale).toFixed(2)}rem` }}>
              <div className="article-summary p-4 rounded-3 mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="mb-3" style={{ color: '#1f2937', fontWeight: '600' }}>Summary</h5>
                <p style={{ color: '#4b5563', lineHeight: '1.8', fontSize: '1.1rem' }}>
                  {effectiveItem.description || 'No summary available.'}
                </p>
              </div>
              
              {/* CoinsClarity Commentary - Adds Original Value */}
              <div className="coinsclarity-take p-4 rounded-3 mb-4" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                <h5 className="mb-3 d-flex align-items-center" style={{ color: '#92400e', fontWeight: '600' }}>
                  <span className="me-2">💡</span> CoinsClarity Take
                </h5>
                <p style={{ color: '#78350f', lineHeight: '1.7' }}>
                  This article covers developments in the cryptocurrency space. For the complete analysis and details, 
                  we recommend reading the full article from the original source below. CoinsClarity aggregates news 
                  to help you stay informed about the latest in crypto.
                </p>
              </div>

              {/* Prominent Link to Original Source */}
              {effectiveItem.link && (
                <div className="read-original text-center p-4 rounded-3" style={{ backgroundColor: '#1f2937' }}>
                  <p className="text-white mb-3" style={{ fontSize: '1.1rem' }}>
                    📰 Read the full article from the original source
                  </p>
                  <a 
                    href={effectiveItem.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-lg"
                    style={{ 
                      backgroundColor: '#f97316', 
                      color: 'white', 
                      fontWeight: '600',
                      padding: '12px 32px',
                      borderRadius: '8px'
                    }}
                  >
                    Read Original Article →
                  </a>
                  <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
                    Source: {effectiveItem.source_name || effectiveItem.creator?.[0] || 'External Source'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Article Footer - Mobile Optimized */}
          <div className="article-footer">
            <hr className="my-4" />
            
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex gap-2 flex-wrap">
                <Button onClick={handleShare} variant="outline-primary" size="sm" className="d-flex align-items-center">
                  <Share2 className="me-2" size={16} /> 
                  <span className="d-none d-sm-inline">Share</span>
                </Button>
                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center">
                  <Bookmark className="me-2" size={16} /> 
                  <span className="d-none d-sm-inline">Save</span>
                </Button>
              </div>

            </div>
            {(() => { try { const r = computeImpactLevel(effectiveItem || undefined); return r.affectedCoins && r.affectedCoins.length > 0; } catch { return false; } })() && (
              <div className="mt-3">
                <small className="text-muted d-block mb-1">Coins likely affected:</small>
                <div className="d-flex flex-wrap gap-2">
                  {(() => { const r = computeImpactLevel(effectiveItem || undefined); return r.affectedCoins; })().map((c: string) => (
                    <Badge key={c} bg="light" text="dark" style={{ cursor: 'pointer' }}>
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
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
      <div className={`copy-toast ${copyFeedback ? 'show' : ''}`}>{copyFeedback}</div>
      {/* Mobile Sticky Bar - Enhanced */}
      <div className="mobile-sticky-bar d-md-none">
        <div className="d-flex gap-2 w-100">
          <Button onClick={handleShare} variant="primary" className="flex-fill d-flex align-items-center justify-content-center">
            <Share2 className="me-2" size={16} />
            <span>Share</span>
          </Button>
          <Button onClick={handleBookmarkToggle} variant={isBookmarked ? 'primary' : 'outline-secondary'} className="flex-fill d-flex align-items-center justify-content-center">
            <Bookmark className="me-2" size={16} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </Button>

        </div>
      </div>
    </Container>
  );
};

export default NewsDetail;
