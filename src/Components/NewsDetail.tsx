import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { translateNewsContent } from '../utils/translationUtils';
import { computeImpactLevel } from '../utils/impact';
import { ArrowLeft, Share2, Bookmark, Eye, Calendar, User, ExternalLink, Volume2, Square } from 'lucide-react';
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
  const { currentLanguage } = useLanguage();
  const { displayItems: translatedItems, isTranslating } = useNewsTranslation(newsItem ? [newsItem] : []);
  const effectiveItem = (translatedItems && translatedItems[0]) || newsItem;
  const [translatedContent, setTranslatedContent] = useState<string>('');

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

      const isLocalBase = /localhost|127\.0\.0\.1|:\\d{2,5}$/.test(API_BASE_URL);
      const bases = isLocalBase
        ? Array.from(new Set([
            'https://c-back-1.onrender.com',
            'https://c-back-2.onrender.com',
            API_BASE_URL,
          ]))
        : Array.from(new Set([
            API_BASE_URL,
            'https://c-back-1.onrender.com',
            'https://c-back-2.onrender.com',
          ]));

      try {
        if (!fromState) setLoading(true);
        let resolved: NewsItem | null = null;

        for (const base of bases) {
          if (resolved) break;
          // 1) Search DB first (most reliable across deployments)
          try {
            const searchResponse = await fetch(`${base}/search-db-news?query=${encodeURIComponent(id)}`);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.success && Array.isArray(searchData.data)) {
                const idLower = id.toLowerCase();
                const foundItem = searchData.data.find((item: any) => {
                  const linkHit = item.link && typeof item.link === 'string' && item.link.includes(id);
                  const idHit = item.article_id && String(item.article_id) === id;
                  const titleHit = item.title && typeof item.title === 'string' && (item.title.toLowerCase().includes(idLower) || idLower.includes(item.title.toLowerCase()));
                  return idHit || linkHit || titleHit;
                });
                if (foundItem) {
                  resolved = foundItem;
                  break;
                }
              }
            }
          } catch {}

          // 2) Fallback: unified RSS and match (broad coverage)
          try {
            if (/localhost|127\.0\.0\.1/.test(base)) throw new Error('skip all-rss on local');
            const allRssRes = await fetch(`${base}/fetch-all-rss?limit=50`);
            if (allRssRes.ok) {
              const allRssData = await allRssRes.json();
              if (allRssData.success && Array.isArray(allRssData.data)) {
                const idLower = id.toLowerCase();
                const match = allRssData.data.find((it: any) => {
                  const linkHit = it.link && typeof it.link === 'string' && it.link.includes(id);
                  const idHit = it.article_id && String(it.article_id) === id;
                  const titleHit = it.title && typeof it.title === 'string' && (it.title.toLowerCase().includes(idLower) || idLower.includes(it.title.toLowerCase()));
                  return idHit || linkHit || titleHit;
                });
                if (match) {
                  resolved = match;
                  break;
                }
              }
            }
          } catch {}

          // 3) Fallback: generic RSS endpoint and match
          try {
            const rssRes = await fetch(`${base}/fetch-rss?limit=50`);
            if (rssRes.ok) {
              const rssData = await rssRes.json();
              if (rssData.success && Array.isArray(rssData.data)) {
                const idLower = id.toLowerCase();
                const match = rssData.data.find((it: any) => {
                  const linkHit = it.link && typeof it.link === 'string' && it.link.includes(id);
                  const idHit = it.article_id && String(it.article_id) === id;
                  const titleHit = it.title && typeof it.title === 'string' && (it.title.toLowerCase().includes(idLower) || idLower.includes(it.title.toLowerCase()));
                  return idHit || linkHit || titleHit;
                });
                if (match) {
                  resolved = match;
                  break;
                }
              }
            }
          } catch {}

          // 4) Fallback: dedicated by-id endpoint (may not exist on some deployments)
          try {
            const byIdRes = await fetch(`${base}/news-by-id?id=${encodeURIComponent(id)}`);
            if (byIdRes.ok) {
              const byIdData = await byIdRes.json();
              if (byIdData.success && byIdData.data) {
                resolved = byIdData.data;
                break;
              }
            }
          } catch {}

          // 5) Fallback: The Defiant feed (might be missing on some deployments)
          try {
            if (/localhost|127\.0\.0\.1/.test(base)) throw new Error('skip defiant on local');
            const defiantRes = await fetch(`${base}/fetch-defiant-rss?limit=20`);
          if (defiantRes.ok) {
            const defiantData = await defiantRes.json();
            if (defiantData.success && Array.isArray(defiantData.data)) {
                const idLower = id.toLowerCase();
                const match = defiantData.data.find((it: any) => {
                  const linkHit = it.link && typeof it.link === 'string' && it.link.includes(id);
                  const idHit = it.article_id && String(it.article_id) === id;
                  const titleHit = it.title && typeof it.title === 'string' && (it.title.toLowerCase().includes(idLower) || idLower.includes(it.title.toLowerCase()));
                  return idHit || linkHit || titleHit;
                });
              if (match) {
                  resolved = match;
                  break;
                }
              }
            }
          } catch {}
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

  const handleExternalLink = () => {
    if (newsItem?.link) {
      window.open(newsItem.link, '_blank', 'noopener,noreferrer');
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
      const rawHtml = (translatedContent && translatedContent.trim().length > 0)
        ? translatedContent
        : (effectiveItem?.content || effectiveItem?.description || '');
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
      // language-aware voice selection
      const resolveLang = (lang: string): string => {
        switch (lang) {
          case 'hi': return 'hi-IN';
          case 'es': return 'es-ES';
          case 'fr': return 'fr-FR';
          case 'de': return 'de-DE';
          case 'zh': return 'zh-CN';
          case 'ja': return 'ja-JP';
          case 'ko': return 'ko-KR';
          case 'ar': return 'ar-SA';
          default: return 'en-US';
        }
      };
      const langTag = resolveLang(currentLanguage);
      const voices = (window as any).speechSynthesis?.getVoices() || [];
      const voice = voices.find((v: SpeechSynthesisVoice) => (v.lang || '').toLowerCase().startsWith(langTag.split('-')[0].toLowerCase()));
      const utterances = chunks.map((c) => {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = langTag;
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

  // Background: if we have a link and content is short/empty, try to extract full article HTML from backend
  useEffect(() => {
    const maybeExtract = async () => {
      if (!effectiveItem) return;
      const contentLen = (effectiveItem.content || '').trim().length;
      if (contentLen > 80) return;
      if (!effectiveItem.link) return;

      try {
        const basesToTry = Array.from(new Set([
          API_BASE_URL,
          'https://c-back-1.onrender.com',
          'https://c-back-2.onrender.com',
        ]));

        for (const base of basesToTry) {
          try {
            const resp = await fetch(`${base}/extract-article?url=${encodeURIComponent(effectiveItem.link)}`);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (data.success && (data.html || data.text)) {
              const merged = { ...effectiveItem, content: data.html || (data.text || '').replace(/\n/g, '<br>') } as NewsItem;
              setNewsItem(merged);
              break;
            }
          } catch {
            // continue to next base
          }
        }
      } catch {
        // ignore extraction errors silently
      }
    };
    maybeExtract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveItem?.link, effectiveItem?.content, API_BASE_URL]);

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

  // Translate full content when language is not English
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setTranslatedContent('');
        if (!effectiveItem?.content) return;
        if (currentLanguage === 'en') return;
        const raw = effectiveItem.content || '';
        const looksLikeHtml = /<[^>]+>/.test(raw);
        const textOnly = looksLikeHtml ? raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : raw;
        if (!textOnly) return;
        const translated = await translateNewsContent(textOnly, currentLanguage as any);
        if (!cancelled && translated) {
          setTranslatedContent(translated);
        }
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, [effectiveItem?.content, currentLanguage]);

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

  if (!effectiveItem) {
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
      <Helmet>
        <title>{effectiveItem.title} | CoinsCapture</title>
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
          publisher: { '@type': 'Organization', name: 'CoinsCapture', logo: { '@type': 'ImageObject', url: '/logo3.png' } }
        })}</script>
      </Helmet>
      <div className="reading-progress"><div className="reading-progress__bar" style={{ width: `${progress}%` }} /></div>
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
            <h1 className="article-title mb-1">
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
                  <span style={{ color: '#fb923c' }}>{effectiveItem.creator?.[0] || 'Unknown Author'}</span>
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
                <div className="vr" />
                <span className="badge bg-light text-dark">
                  {(() => { const r = computeImpactLevel(effectiveItem); return `Impact: ${r.level}${r.affectedCoins.length ? ' • ' + r.affectedCoins.join(', ') : ''}`; })()}
                </span>
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
            <div className="action-bar d-flex align-items-center gap-2 flex-wrap">
              <Button onClick={handleShare} variant="outline-primary" size="sm">
                <Share2 className="me-2" size={16} /> Share
              </Button>
              <Button onClick={handleBookmarkToggle} variant={isBookmarked ? 'primary' : 'outline-secondary'} size="sm">
                <Bookmark className="me-2" size={16} /> {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              <div className="vr d-none d-md-block" />
              <div className="d-flex align-items-center gap-1">
                <Button variant="outline-secondary" size="sm" onClick={() => setFontScale((v) => Math.max(0.9, Number((v - 0.1).toFixed(2))))}>A-</Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setFontScale((v) => Math.min(1.4, Number((v + 0.1).toFixed(2))))}>A+</Button>
              </div>
              <div className="vr d-none d-md-block" />
              {!isTtsPlaying ? (
                <Button variant="outline-secondary" size="sm" onClick={startTts} title="Listen to article">
                  <Volume2 className="me-2" size={16} /> Brief
                </Button>
              ) : (
                <Button variant="outline-danger" size="sm" onClick={stopTts} title="Stop audio">
                  <Square className="me-2" size={16} /> Stop
                </Button>
              )}
            </div>
          </div>

          {/* Featured Image */}
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

          {/* Article Content */}
          <div className="article-content mb-4" ref={contentRef}>
            {effectiveItem.description && (
              <div className="article-excerpt mb-4">
                <p className="lead text-muted" style={{ fontStyle: 'italic' }}>{effectiveItem.description}</p>
              </div>
            )}
            
            {(effectiveItem.content || translatedContent) && (
              <div className="article-body" style={{ fontSize: `${(1.0 * fontScale).toFixed(2)}rem` }}>
                <div
                  className="content-html"
                  dangerouslySetInnerHTML={{ __html: getNormalizedContentHtml(translatedContent || effectiveItem.content) }}
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
      <div className="mobile-sticky-bar d-md-none">
        <div className="d-flex gap-2 w-100">
          <Button onClick={handleShare} variant="primary" className="flex-fill">Share</Button>
          <Button onClick={handleExternalLink} variant="dark" className="flex-fill">Original</Button>
        </div>
      </div>
    </Container>
  );
};

export default NewsDetail;
