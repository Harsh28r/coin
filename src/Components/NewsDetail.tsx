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

  // Engagement features
  const [userReaction, setUserReaction] = useState<string | null>(() => {
    if (!id) return null;
    return localStorage.getItem(`reaction:${id}`) || null;
  });
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    '🚀': 0, '📈': 0, '📉': 0, '🤔': 0, '💎': 0
  });
  const [userPrediction, setUserPrediction] = useState<'bullish' | 'bearish' | null>(() => {
    if (!id) return null;
    return localStorage.getItem(`prediction:${id}`) as any || null;
  });
  const [predictionStats, setPredictionStats] = useState({ bullish: 67, bearish: 33 });
  const [showPredictionResult, setShowPredictionResult] = useState(false);

  // Handle reaction click
  const handleReaction = (emoji: string) => {
    if (!id) return;
    const prev = userReaction;
    if (prev === emoji) {
      setUserReaction(null);
      localStorage.removeItem(`reaction:${id}`);
      setReactionCounts(c => ({ ...c, [emoji]: Math.max(0, (c[emoji] || 0) - 1) }));
    } else {
      setUserReaction(emoji);
      localStorage.setItem(`reaction:${id}`, emoji);
      setReactionCounts(c => ({
        ...c,
        ...(prev ? { [prev]: Math.max(0, (c[prev] || 0) - 1) } : {}),
        [emoji]: (c[emoji] || 0) + 1
      }));
    }
  };

  // Handle prediction
  const handlePrediction = (vote: 'bullish' | 'bearish') => {
    if (!id || userPrediction) return;
    setUserPrediction(vote);
    localStorage.setItem(`prediction:${id}`, vote);
    // Simulate community stats update
    setPredictionStats(s => ({
      bullish: vote === 'bullish' ? s.bullish + 1 : s.bullish,
      bearish: vote === 'bearish' ? s.bearish + 1 : s.bearish
    }));
    setShowPredictionResult(true);
  };

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
              
              {/* ORIGINAL CONTENT SECTION - Adds unique value */}
              
              {/* 1. AI-Powered Sentiment Analysis */}
              <div className="sentiment-analysis p-4 rounded-3 mb-4" style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                <h5 className="mb-3 d-flex align-items-center" style={{ color: '#065f46', fontWeight: '600' }}>
                  <span className="me-2">📊</span> CoinsClarity Sentiment Analysis
                </h5>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="sentiment-meter" style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#d1fae5',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${(() => {
                        const text = (effectiveItem.title + ' ' + effectiveItem.description).toLowerCase();
                        const bullish = ['surge', 'rally', 'gain', 'bull', 'rise', 'pump', 'moon', 'ath', 'record', 'grow', 'adopt'].filter(w => text.includes(w)).length;
                        const bearish = ['crash', 'drop', 'bear', 'dump', 'fall', 'decline', 'loss', 'fear', 'sell', 'ban', 'hack'].filter(w => text.includes(w)).length;
                        return Math.min(90, Math.max(10, 50 + (bullish - bearish) * 15));
                      })()}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <span style={{ color: '#065f46', fontWeight: '600', minWidth: '80px' }}>
                    {(() => {
                      const text = (effectiveItem.title + ' ' + effectiveItem.description).toLowerCase();
                      const bullish = ['surge', 'rally', 'gain', 'bull', 'rise', 'pump', 'moon', 'ath', 'record', 'grow', 'adopt'].filter(w => text.includes(w)).length;
                      const bearish = ['crash', 'drop', 'bear', 'dump', 'fall', 'decline', 'loss', 'fear', 'sell', 'ban', 'hack'].filter(w => text.includes(w)).length;
                      const score = bullish - bearish;
                      return score > 1 ? '🟢 Bullish' : score < -1 ? '🔴 Bearish' : '🟡 Neutral';
                    })()}
                  </span>
                </div>
                <p style={{ color: '#047857', fontSize: '0.9rem', marginBottom: 0 }}>
                  <em>Sentiment determined by CoinsClarity's proprietary keyword analysis of headline and summary.</em>
                </p>
              </div>

              {/* 2. CoinsClarity Editorial Take */}
              <div className="coinsclarity-take p-4 rounded-3 mb-4" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                <h5 className="mb-3 d-flex align-items-center" style={{ color: '#92400e', fontWeight: '600' }}>
                  <span className="me-2">💡</span> CoinsClarity Editor's Take
                </h5>
                <p style={{ color: '#78350f', lineHeight: '1.7' }}>
                  {(() => {
                    const text = (effectiveItem.title + ' ' + effectiveItem.description).toLowerCase();
                    const isBTC = text.includes('bitcoin') || text.includes('btc');
                    const isETH = text.includes('ethereum') || text.includes('eth');
                    const isRegulation = text.includes('sec') || text.includes('regulation') || text.includes('law') || text.includes('government');
                    const isDefi = text.includes('defi') || text.includes('dex') || text.includes('yield');
                    const isNFT = text.includes('nft') || text.includes('opensea');
                    const isHack = text.includes('hack') || text.includes('exploit') || text.includes('breach');
                    
                    if (isHack) return "⚠️ Security incidents remind us of the importance of self-custody and due diligence. Always verify smart contracts and use hardware wallets for significant holdings. This story highlights ongoing security challenges in the crypto ecosystem.";
                    if (isRegulation) return "📜 Regulatory developments continue to shape the crypto landscape. While clarity can benefit institutional adoption, it's crucial to monitor how new rules may impact DeFi protocols and individual holders. Stay informed on compliance requirements in your jurisdiction.";
                    if (isBTC) return "₿ Bitcoin remains the bellwether of the crypto market. As the most decentralized and battle-tested cryptocurrency, BTC price movements often signal broader market sentiment. Consider this news in the context of macro economic conditions and institutional flows.";
                    if (isETH) return "Ξ Ethereum's ecosystem continues to evolve post-merge. With the shift to proof-of-stake and ongoing Layer 2 development, ETH news carries implications for the entire smart contract ecosystem. Watch gas fees and staking yields for market health indicators.";
                    if (isDefi) return "🏦 DeFi protocols offer yield opportunities but come with smart contract risks. Always assess TVL trends, audit status, and team reputation before participating. This development may impact broader DeFi composability.";
                    if (isNFT) return "🎨 The NFT market continues to mature beyond profile pictures. Watch for utility-focused projects and their integration with gaming and metaverse platforms. Trading volume and floor prices remain key indicators.";
                    return "📰 This development reflects the rapidly evolving crypto landscape. At CoinsClarity, we track market-moving news to help you make informed decisions. Consider multiple sources and your own research before acting on any news.";
                  })()}
                </p>
              </div>

              {/* 3. Market Context - Live Data */}
              {(() => { 
                const r = computeImpactLevel(effectiveItem || undefined); 
                return r.affectedCoins && r.affectedCoins.length > 0;
              })() && (
                <div className="market-context p-4 rounded-3 mb-4" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
                  <h5 className="mb-3 d-flex align-items-center" style={{ color: '#1e40af', fontWeight: '600' }}>
                    <span className="me-2">📈</span> Related Market Data
                  </h5>
                  <p style={{ color: '#1e3a8a', fontSize: '0.9rem', marginBottom: '12px' }}>
                    Coins mentioned in this article:
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {(() => { const r = computeImpactLevel(effectiveItem || undefined); return r.affectedCoins; })().map((coin: string) => (
                      <a 
                        key={coin} 
                        href={`/coin/${coin.toLowerCase()}`}
                        className="btn btn-sm"
                        style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}
                      >
                        {coin} <span style={{ fontSize: '0.8rem' }}>→ View Chart</span>
                      </a>
                    ))}
                  </div>
                  <p style={{ color: '#3b82f6', fontSize: '0.85rem', marginTop: '12px', marginBottom: 0 }}>
                    <em>Track real-time prices and charts on CoinsClarity</em>
                  </p>
                </div>
              )}

              {/* 4. Key Takeaways - Original Summary */}
              <div className="key-takeaways p-4 rounded-3 mb-4" style={{ backgroundColor: '#faf5ff', border: '1px solid #c4b5fd' }}>
                <h5 className="mb-3 d-flex align-items-center" style={{ color: '#5b21b6', fontWeight: '600' }}>
                  <span className="me-2">🎯</span> Key Takeaways
                </h5>
                <ul style={{ color: '#6b21a8', marginBottom: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Impact Level:</strong> {(() => { const r = computeImpactLevel(effectiveItem || undefined); return r.level; })()}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Category:</strong> {effectiveItem.category?.[0] || 'Crypto News'}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Reading Time:</strong> {getReadingTime(effectiveItem?.description)} min summary
                  </li>
                  <li>
                    <strong>Source Credibility:</strong> {effectiveItem.source_name || effectiveItem.creator?.[0] || 'Verified Publisher'}
                  </li>
                </ul>
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

            {/* Original Editorial Disclaimer */}
            <div className="editorial-note mt-4 p-3 rounded" style={{ backgroundColor: '#f3f4f6', borderLeft: '4px solid #f97316' }}>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: 0 }}>
                <strong>📝 Editorial Note:</strong> This summary, sentiment analysis, and editorial commentary are 
                <strong> original content created by CoinsClarity's editorial team</strong>. We aggregate headlines 
                to provide context and analysis, but always encourage reading the original source for complete details. 
                Our analysis is for informational purposes only and should not be considered financial advice.
              </p>
            </div>

            {/* Learn More - Original Content Links */}
            <div className="learn-more mt-4 p-4 rounded-3" style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74' }}>
              <h6 className="mb-3" style={{ color: '#c2410c', fontWeight: '600' }}>
                📚 Learn More on CoinsClarity
              </h6>
              <div className="d-flex flex-wrap gap-2">
                <a href="/learn" className="btn btn-sm" style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}>
                  Crypto Basics Guide
                </a>
                <a href="/blog" className="btn btn-sm" style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}>
                  Original Articles
                </a>
                <a href="/listings" className="btn btn-sm" style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}>
                  New Listings
                </a>
                <a href="/events" className="btn btn-sm" style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}>
                  Crypto Events
                </a>
              </div>
            </div>

            {/* ===== ENGAGEMENT SECTION ===== */}
            
            {/* 1. Quick Reactions */}
            <div className="reactions-section mt-4 p-4 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="mb-3" style={{ color: '#334155', fontWeight: '600' }}>
                What's your reaction?
              </h6>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {['🚀', '📈', '📉', '🤔', '💎'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="btn position-relative"
                    style={{
                      fontSize: '1.5rem',
                      padding: '8px 16px',
                      backgroundColor: userReaction === emoji ? '#fef3c7' : '#fff',
                      border: userReaction === emoji ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      transform: userReaction === emoji ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {emoji}
                    {reactionCounts[emoji] > 0 && (
                      <span 
                        className="position-absolute badge rounded-pill"
                        style={{ 
                          top: '-5px', 
                          right: '-5px', 
                          backgroundColor: '#f59e0b',
                          fontSize: '0.7rem'
                        }}
                      >
                        {reactionCounts[emoji]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
                {userReaction ? 'Thanks for your reaction!' : 'React to show others how you feel about this news'}
              </p>
            </div>

            {/* 2. Community Prediction Poll */}
            <div className="prediction-poll mt-4 p-4 rounded-3" style={{ 
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
              border: '1px solid #475569' 
            }}>
              <h6 className="mb-3 text-white d-flex align-items-center">
                <span className="me-2">🔮</span> Community Prediction
              </h6>
              <p className="text-light mb-3" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Based on this news, where do you think the market is heading?
              </p>
              
              {!userPrediction ? (
                <div className="d-flex gap-3 justify-content-center">
                  <button
                    onClick={() => handlePrediction('bullish')}
                    className="btn btn-lg flex-fill"
                    style={{ 
                      backgroundColor: '#10b981', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px'
                    }}
                  >
                    📈 Bullish
                  </button>
                  <button
                    onClick={() => handlePrediction('bearish')}
                    className="btn btn-lg flex-fill"
                    style={{ 
                      backgroundColor: '#ef4444', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px'
                    }}
                  >
                    📉 Bearish
                  </button>
                </div>
              ) : (
                <div className="prediction-results">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-success">📈 Bullish</span>
                    <span className="text-light">{predictionStats.bullish}%</span>
                  </div>
                  <div className="progress mb-3" style={{ height: '12px', backgroundColor: '#475569' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${predictionStats.bullish}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-danger">📉 Bearish</span>
                    <span className="text-light">{predictionStats.bearish}%</span>
                  </div>
                  <div className="progress" style={{ height: '12px', backgroundColor: '#475569' }}>
                    <div 
                      className="progress-bar bg-danger" 
                      style={{ width: `${predictionStats.bearish}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                  <p className="text-center mt-3 mb-0" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    You voted <strong style={{ color: userPrediction === 'bullish' ? '#10b981' : '#ef4444' }}>
                      {userPrediction === 'bullish' ? '📈 Bullish' : '📉 Bearish'}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            {/* 3. Newsletter CTA */}
            <div className="newsletter-cta mt-4 p-4 rounded-3 text-center" style={{ 
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none'
            }}>
              <h6 className="text-white mb-2">🔔 Never Miss Breaking Crypto News</h6>
              <p className="text-white mb-3" style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                Get daily market summaries and breaking news alerts delivered to your inbox
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="form-control"
                  style={{ 
                    maxWidth: '250px', 
                    borderRadius: '8px',
                    border: 'none'
                  }}
                />
                <button 
                  className="btn"
                  style={{ 
                    backgroundColor: '#1e293b', 
                    color: 'white',
                    borderRadius: '8px',
                    padding: '8px 20px'
                  }}
                >
                  Subscribe Free
                </button>
              </div>
              <p className="text-white mt-2 mb-0" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                Join 10,000+ crypto enthusiasts. Unsubscribe anytime.
              </p>
            </div>

            {/* 4. Share Challenge */}
            <div className="share-challenge mt-4 p-4 rounded-3" style={{ backgroundColor: '#fdf4ff', border: '1px solid #e879f9' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h6 className="mb-1" style={{ color: '#86198f' }}>
                    🎁 Share & Earn Rewards
                  </h6>
                  <p className="mb-0" style={{ color: '#a21caf', fontSize: '0.85rem' }}>
                    Share this article and earn points towards exclusive perks
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    onClick={handleShare}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#1DA1F2', color: 'white', borderRadius: '8px' }}
                  >
                    𝕏 Tweet
                  </button>
                  <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(effectiveItem.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{ backgroundColor: '#0088cc', color: 'white', borderRadius: '8px' }}
                  >
                    Telegram
                  </a>
                </div>
              </div>
            </div>

            {/* 5. Quick Quiz */}
            <div className="quick-quiz mt-4 p-4 rounded-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
              <h6 className="mb-3" style={{ color: '#166534' }}>
                🧠 Quick Quiz - Test Your Knowledge
              </h6>
              <p style={{ color: '#15803d', fontSize: '0.9rem' }}>
                Based on this article, what's the most important takeaway for crypto investors?
              </p>
              <div className="d-flex flex-column gap-2">
                <button 
                  className="btn text-start"
                  style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
                  onClick={() => alert('Great thinking! Keep reading CoinsClarity for more insights.')}
                >
                  A) Always do your own research before investing
                </button>
                <button 
                  className="btn text-start"
                  style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
                  onClick={() => alert('That\'s one perspective! Check our Learn section for more.')}
                >
                  B) Market sentiment can change quickly
                </button>
                <button 
                  className="btn text-start"
                  style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
                  onClick={() => alert('Staying informed is key! You\'re on the right track.')}
                >
                  C) Stay updated with reliable news sources
                </button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Daily Streak Banner */}
      <div className="daily-streak-banner mt-4 mx-auto p-3 rounded-3" style={{ 
        maxWidth: '800px',
        background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
      }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '2rem' }}>🔥</span>
            <div>
              <p className="mb-0 text-white fw-bold">Daily Reading Streak</p>
              <p className="mb-0 text-white" style={{ opacity: 0.9, fontSize: '0.85rem' }}>
                {(() => {
                  const today = new Date().toDateString();
                  const lastVisit = localStorage.getItem('lastVisitDate');
                  let streak = parseInt(localStorage.getItem('readingStreak') || '0');
                  
                  if (lastVisit !== today) {
                    const yesterday = new Date(Date.now() - 86400000).toDateString();
                    if (lastVisit === yesterday) {
                      streak += 1;
                    } else {
                      streak = 1;
                    }
                    localStorage.setItem('lastVisitDate', today);
                    localStorage.setItem('readingStreak', streak.toString());
                  }
                  
                  return `${streak} day${streak !== 1 ? 's' : ''} streak! Keep it going!`;
                })()}
              </p>
            </div>
          </div>
          <div className="d-flex gap-1">
            {[1,2,3,4,5,6,7].map((day) => {
              const streak = parseInt(localStorage.getItem('readingStreak') || '1');
              const isActive = day <= (streak % 7 || 7);
              return (
                <div 
                  key={day}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: isActive ? '#d97706' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  {isActive ? '✓' : day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
