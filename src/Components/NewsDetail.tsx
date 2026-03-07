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
  fullContent?: string;
  contentHtml?: string;
  source_name: string;
  keywords?: string[];
  category?: string[];
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullContentLoading, setFullContentLoading] = useState(false);
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

  // ── Client-side article extraction via CORS proxy ──
  const extractArticleClientSide = async (articleUrl: string): Promise<{ content: string; contentHtml: string } | null> => {
    const PROXIES = [
      (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    ];

    for (const makeProxy of PROXIES) {
      try {
        const res = await fetch(makeProxy(articleUrl), { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;

        let html = '';
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const json = await res.json();
          html = json.contents || json.body || '';
        } else {
          html = await res.text();
        }
        if (!html || html.length < 500) continue;

        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Remove junk
        doc.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, .related-articles, .comments, .newsletter, .subscribe, .sidebar, .popup, .modal, [role="navigation"], [role="banner"], [role="complementary"], iframe, button, form, input, select, textarea, svg').forEach(el => el.remove());

        // Try JSON-LD
        const ldScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of ldScripts) {
          try {
            const parsed = JSON.parse(s.textContent || '');
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
              const body = item.articleBody || item.text || '';
              if (body.length > 500) {
                console.log('✓ Client JSON-LD:', body.length, 'chars');
                const asHtml = body.includes('<') ? body : body.split(/\n{2,}/).map((p: string) => `<p>${p}</p>`).join('');
                return { content: body, contentHtml: asHtml };
              }
            }
          } catch {}
        }

        // Try content selectors
        const selectors = [
          '[itemprop="articleBody"]', '.article-content', '.article-body', '.post-content',
          '.entry-content', '.story-body', '.content-body', '#article-body', '.td-post-content',
          '.article-detail', '.storyPage_storyContent', '#storyContent', 'article', 'main'
        ];
        for (const sel of selectors) {
          const el = doc.querySelector(sel);
          if (el) {
            const elHtml = el.innerHTML || '';
            const elText = el.textContent?.trim() || '';
            if (elText.length > 300) {
              const clean = elHtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '').trim();
              console.log(`✓ Client CSS(${sel}):`, elText.length, 'chars');
              return { content: elText, contentHtml: clean };
            }
          }
        }

        // Fallback: gather paragraphs
        const paras = doc.querySelectorAll('article p, main p, .content p, body p');
        if (paras.length >= 3) {
          const texts: string[] = [];
          const htmlParts: string[] = [];
          paras.forEach(p => {
            const t = p.textContent?.trim() || '';
            if (t.length > 20) { texts.push(t); htmlParts.push(`<p>${p.innerHTML}</p>`); }
          });
          if (texts.join(' ').length > 300) {
            console.log('✓ Client paragraphs:', texts.length, 'p,', texts.join(' ').length, 'chars');
            return { content: texts.join('\n\n'), contentHtml: htmlParts.join('') };
          }
        }
      } catch (err: any) {
        console.log('Client proxy failed:', err.message);
      }
    }
    return null;
  };

  // ── Multi-strategy full content fetcher ──
  // Races: backend(Render) + backend(Camify) + client-side extraction
  const fetchFullContent = async (articleUrl: string): Promise<{ content: string; contentHtml: string } | null> => {
    if (!articleUrl || articleUrl === '#') return null;
    const CAMIFY = 'https://camify.fun.coinsclarity.com';

    const tryBackend = async (base: string): Promise<{ content: string; contentHtml: string } | null> => {
      try {
        const r = await fetch(`${base}/fetch-full-article?url=${encodeURIComponent(articleUrl)}`, { signal: AbortSignal.timeout(12000) });
        if (!r.ok) return null;
        const d = await r.json();
        if (d.success && d.data) {
          const txt = d.data.content || '';
          const htm = d.data.contentHtml || txt;
          if (txt.length > 300 || htm.length > 300) {
            console.log(`✓ Backend(${base}):`, txt.length, 'text,', htm.length, 'html');
            return { content: txt, contentHtml: htm };
          }
        }
      } catch {}
      return null;
    };

    // Race all methods — first valid result wins instantly (don't wait for slow ones)
    const rejectIfEmpty = (p: Promise<{ content: string; contentHtml: string } | null>) =>
      p.then(r => {
        if (r && (r.content.length > 300 || r.contentHtml.length > 300)) return r;
        return Promise.reject('empty');
      });

    try {
      return await Promise.any([
        rejectIfEmpty(tryBackend(API_BASE_URL)),
        rejectIfEmpty(tryBackend(CAMIFY)),
        rejectIfEmpty(extractArticleClientSide(articleUrl).then(r => r ? r : Promise.reject('empty'))),
      ]);
    } catch {
      // All strategies failed
      return null;
    }
  };

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!id) return;
      
      const fromState = navState && (navState.item || navState.newsItem);
      if (fromState) {
        const incoming = fromState as NewsItem;
        // Show article INSTANTLY with RSS content
        setNewsItem(incoming);
        setLoading(false);
        setError(null);

        // Fetch full article in background (non-blocking, fire-and-forget)
        if (incoming.link && !(incoming.contentHtml && incoming.contentHtml.trim().length > 300)) {
          setFullContentLoading(true);
          fetchFullContent(incoming.link).then(fullResult => {
            if (fullResult) {
              setNewsItem(prev => {
                if (!prev) return prev;
                const updated = { ...prev };
                if (fullResult.content.length > (updated.content?.length || 0)) {
                  updated.content = fullResult.content;
                }
                updated.fullContent = fullResult.contentHtml;
                updated.contentHtml = fullResult.contentHtml;
                return updated;
              });
              console.log('✓ Full content (bg):', fullResult.content?.length || 0, 'text,', fullResult.contentHtml?.length || 0, 'html');
            }
          }).catch(() => {}).finally(() => setFullContentLoading(false));
        }
        return; // We have the article, no need for RSS scan
      } else {
        setLoading(true);
      }

      // Camify backend (AWS)
      const CAMIFY_BASE = 'https://camify.fun.coinsclarity.com';
      
      // All RSS endpoints on camify
      const RSS_ENDPOINTS = [
        '/fetch-all-rss?limit=100',
        '/fetch-cryptoslate-rss?limit=50',
        '/fetch-cointelegraph-rss?limit=50',
        '/fetch-coindesk-rss?limit=50',
        '/fetch-decrypt-rss?limit=50',
        '/fetch-blockworks-rss?limit=50',
        '/fetch-beincrypto-rss?limit=50',
        '/fetch-finbold-rss?limit=50',
        '/fetch-coingape-rss?limit=50',
        '/fetch-bitcoinist-rss?limit=50',
        '/fetch-cryptobriefing-rss?limit=50',
        '/fetch-protos-rss?limit=50',
        '/fetch-unchained-rss?limit=50',
        '/fetch-thecryptobasic-rss?limit=50',
        '/fetch-blockonomi-rss?limit=50',
        '/fetch-coincu-rss?limit=50',
        '/fetch-cryptonewsz-rss?limit=50',
        '/fetch-ethereumworldnews-rss?limit=50',
        '/fetch-chaingpt-rss?limit=50',
        '/fetch-watcherguru-rss?limit=50',
        '/fetch-coinpedia-rss?limit=50',
        '/fetch-smartliquidity-rss?limit=50',
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
                  description: match.content ? (match.content.length > 200 ? match.content.substring(0, 200) + '...' : match.content) : '',
                  content: match.content || '',
                  fullContent: match.content || '',
                  contentHtml: match.content || null,
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
          // Show article INSTANTLY with whatever content we have
          setNewsItem(resolved);
          setError(null);
          if (!fromState) setLoading(false);

          // Then fetch full content in the background (non-blocking)
          if (resolved.link && !(resolved.contentHtml && resolved.contentHtml.trim().length > 300)) {
            setFullContentLoading(true);
            fetchFullContent(resolved.link).then(fullResult => {
              if (fullResult) {
                setNewsItem(prev => {
                  if (!prev) return prev;
                  const updated = { ...prev };
                  if (fullResult.content.length > (updated.content?.length || 0)) {
                    updated.content = fullResult.content;
                  }
                  updated.fullContent = fullResult.contentHtml;
                  updated.contentHtml = fullResult.contentHtml;
                  return updated;
                });
                console.log('✓ Full content (bg):', fullResult.content?.length || 0, 'text,', fullResult.contentHtml?.length || 0, 'html');
              }
            }).catch(() => {}).finally(() => setFullContentLoading(false));
          }
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

  // Sanitize scraped HTML: remove duplicate titles, author bios, social links, ads, etc.
  const sanitizeScrapedHtml = (html: string, articleTitle?: string): string => {
    if (!html) return '';
    const container = document.createElement('div');
    container.innerHTML = html;

    // Remove junk elements
    const junkSel = [
      'nav', 'header', 'footer', 'aside', 'iframe', 'script', 'style', 'noscript',
      'button', 'input', 'select', 'textarea', 'form', 'svg', '.wp-caption-text',
      '[class*="social"]', '[class*="share"]', '[class*="follow"]',
      '[class*="subscribe"]', '[class*="newsletter"]', '[class*="sidebar"]',
      '[class*="related"]', '[class*="recommended"]', '[class*="popular"]',
      '[class*="breadcrumb"]', '[class*="navigation"]', '[class*="author-bio"]',
      '[class*="byline"]', '[class*="author-card"]', '[class*="writer"]',
      '[class*="audio"]', '[class*="listen"]', '[class*="podcast"]',
      '[class*="ad-"]', '[class*="advert"]', '[class*="banner"]',
      '[class*="promo"]', '[class*="cta"]', '[class*="popup"]',
      '[class*="modal"]', '[class*="cookie"]', '[class*="consent"]',
      '[class*="comment"]', '[class*="disqus"]', '[class*="tags"]',
      '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
    ];
    junkSel.forEach(sel => {
      try { container.querySelectorAll(sel).forEach(el => el.remove()); } catch {}
    });

    // Remove elements matching article title (avoid showing title twice)
    if (articleTitle) {
      const titleLower = articleTitle.toLowerCase().trim();
      const titleWords = titleLower.split(/\s+/).slice(0, 6).join(' ');
      container.querySelectorAll('h1, h2, h3').forEach(el => {
        const t = (el.textContent || '').toLowerCase().trim();
        if (t === titleLower || t.includes(titleWords) || titleLower.includes(t)) el.remove();
      });
    }

    // Remove short junk-text elements (subscribe CTAs, timestamps, etc.)
    const junkPat = [
      /subscribe\s+(on|to|now)/i, /follow\s+(our|us|on)/i, /in your social feed/i,
      /sign\s+up/i, /join\s+(our|the)/i, /download\s+(the|our)\s+app/i,
      /written\s+by\b/i, /reviewed\s+by\b/i, /staff\s+(writer|editor)/i,
      /\d+\s*(hours?|minutes?|days?)\s+ago$/i, /^\s*listen\s*$/i, /^0:00$/,
    ];
    container.querySelectorAll('p, div, span, li, a, figcaption, time').forEach(el => {
      const txt = (el.textContent || '').trim();
      if (txt.length < 150) {
        for (const p of junkPat) { if (p.test(txt)) { el.remove(); break; } }
      }
    });

    // Remove tiny tracking images / logos
    container.querySelectorAll('img').forEach(img => {
      const src = (img.getAttribute('src') || '').toLowerCase();
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      const w = img.getAttribute('width');
      if (src.includes('logo') || src.includes('icon') || src.includes('avatar') ||
          src.includes('1x1') || src.includes('pixel') || src.includes('tracking') ||
          alt.includes('logo') || (w && parseInt(w) < 50)) {
        img.remove();
      }
    });

    // Remove empty elements
    container.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6').forEach(el => {
      if (!(el.textContent || '').trim() && !el.querySelector('img, video')) el.remove();
    });

    return container.innerHTML.trim();
  };

  // Normalize content to formal HTML paragraphs when needed
  const getNormalizedContentHtml = (htmlOrText?: string): string => {
    const raw = (htmlOrText || '').trim();
    if (!raw) return '';
    const looksLikeHtml = /<[^>]+>/.test(raw);
    if (looksLikeHtml) return sanitizeScrapedHtml(raw, effectiveItem?.title);
    const paragraphs = raw
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
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
          description: effectiveItem.description || effectiveItem.title,
          image: [effectiveItem.image_url || `${window.location.origin}/logo3.png`].filter(Boolean),
          author: effectiveItem.creator?.[0] ? {
            '@type': 'Person',
            name: effectiveItem.creator[0]
          } : {
            '@type': 'Organization',
            name: 'CoinsClarity'
          },
          datePublished: effectiveItem.pubDate || new Date().toISOString(),
          dateModified: effectiveItem.pubDate || new Date().toISOString(),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': window.location.href
          },
          publisher: {
            '@type': 'Organization',
            name: 'CoinsClarity',
            logo: {
              '@type': 'ImageObject',
              url: `${window.location.origin}/logo3.png`,
              width: 512,
              height: 512
            },
            url: 'https://coinsclarity.com'
          },
          articleSection: effectiveItem.category?.[0] || 'Cryptocurrency',
          keywords: effectiveItem.keywords?.join(', ') || 'cryptocurrency, bitcoin, ethereum, crypto news',
          articleBody: effectiveItem.content || effectiveItem.description || '',
          wordCount: effectiveItem.content ? effectiveItem.content.split(/\s+/).length : 0
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

           {/* Article Content */}
          <div className="article-content mb-4" ref={contentRef}>
            <div className="article-body" style={{ fontSize: `${(1.0 * fontScale).toFixed(2)}rem` }}>

                {/* Full Article Content */}
                {(effectiveItem.contentHtml || effectiveItem.fullContent || effectiveItem.content || effectiveItem.description || '').length > 0 && (
                  <div className="full-article-content mb-4">
                    <div 
                      className="content-html"
                      dangerouslySetInnerHTML={{ 
                        __html: getNormalizedContentHtml(
                          effectiveItem.contentHtml || effectiveItem.fullContent || effectiveItem.content || effectiveItem.description || ''
                        )
                      }}
                      style={{ lineHeight: '1.9', color: '#374151', fontSize: `${(1.05 * fontScale).toFixed(2)}rem` }}
                    />
                  </div>
                )}

                {/* Loading indicator while fetching full article */}
                {fullContentLoading && (
                  <div className="d-flex align-items-center gap-2 mt-3 p-3 rounded" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                    <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#3b82f6', width: '16px', height: '16px' }}>
                      <span className="visually-hidden">Loading...</span>
              </div>
                    <span style={{ color: '#1e40af', fontSize: '0.85rem' }}>Loading full article...</span>
                </div>
              )}

                {/* Source */}
                {effectiveItem.source_name && (
                  <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.85rem', textAlign: 'right' }}>
                    Source: {effectiveItem.source_name}
                  </p>
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
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '2px solid #f97316',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)'
            }}>
              <h6 className="mb-2" style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem' }}>Stay Ahead of the Market</h6>
              <p className="mb-3" style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Get the top crypto stories, market movers, and exclusive insights delivered to your inbox every morning — free.
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="form-control"
                  style={{ 
                    maxWidth: '250px', 
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#1e293b',
                    padding: '10px 14px'
                  }}
                />
                <button 
                  className="btn"
                  style={{ 
                    backgroundColor: '#f97316', 
                    color: 'white',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  Subscribe Free
                </button>
              </div>
              <p className="mt-2 mb-0" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                No spam, unsubscribe anytime. Join 5,000+ crypto enthusiasts.
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
