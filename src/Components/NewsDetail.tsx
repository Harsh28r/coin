import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { computeImpactLevel } from '../utils/impact';
import { BRAND_DISPLAY_NAME, stripAppearedFirstOn } from '../utils/branding';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Calendar,
  Clock,
  Volume2,
  Square,
  TrendingUp,
  TrendingDown,
  Twitter,
  Send,
  Copy,
  AArrowDown,
  AArrowUp,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { resolveImageSrc, isFakeImageUrl, handleImageError } from '../utils/cryptoImages';
import { summarize } from '../utils/summarize';
import { defaultPublicBackend } from '../utils/rssBackendBases';
import { postNewsletterSubscribe } from '../utils/newsletterSubscribe';
import NewsArticleComments from './NewsArticleComments';
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

// ─── memory + localStorage cache (24h) — survives tab close & deep-link revisit
const MEM_CACHE = new Map<string, { item: NewsItem; ts: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_KEY = (id: string) => `news:${id}`;
const READ_STALE = (id: string): NewsItem | null => {
  // Read even if stale — used as instant placeholder while we re-fetch.
  const m = MEM_CACHE.get(id);
  if (m) return m.item;
  try {
    const raw = localStorage.getItem(CACHE_KEY(id)) || sessionStorage.getItem(CACHE_KEY(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.item) return parsed.item as NewsItem;
  } catch {}
  return null;
};

const readCache = (id: string): NewsItem | null => {
  const m = MEM_CACHE.get(id);
  if (m && Date.now() - m.ts < CACHE_TTL_MS) return m.item;
  try {
    const raw = localStorage.getItem(CACHE_KEY(id)) || sessionStorage.getItem(CACHE_KEY(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.ts && Date.now() - parsed.ts < CACHE_TTL_MS) {
      MEM_CACHE.set(id, parsed);
      return parsed.item;
    }
  } catch {}
  return null;
};

const writeCache = (id: string, item: NewsItem) => {
  const entry = { item, ts: Date.now() };
  MEM_CACHE.set(id, entry);
  try {
    const json = JSON.stringify(entry);
    localStorage.setItem(CACHE_KEY(id), json);
    sessionStorage.setItem(CACHE_KEY(id), json);
  } catch {
    // localStorage full — best-effort prune oldest news:* keys
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('news:'));
      if (keys.length > 30) keys.slice(0, keys.length - 30).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(CACHE_KEY(id), JSON.stringify(entry));
    } catch {}
  }
};

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState: any = location.state;

  const [newsItem, setNewsItem] = useState<NewsItem | null>(() => {
    const fromState = navState && (navState.item || navState.newsItem);
    if (fromState) return fromState as NewsItem;
    if (id) return readCache(id) || READ_STALE(id);
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!newsItem);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Fetching article…');
  const [bgEnriching, setBgEnriching] = useState<boolean>(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const CAMIFY = defaultPublicBackend();

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [digestEmail, setDigestEmail] = useState('');
  const [digestBusy, setDigestBusy] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const ttsUtterancesRef = useRef<SpeechSynthesisUtterance[] | null>(null);

  // ── Engagement (slim) ─────────────────────────────────────────────────────
  const [userReaction, setUserReaction] = useState<string | null>(() => {
    if (!id) return null;
    return localStorage.getItem(`reaction:${id}`) || null;
  });
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    '🚀': 0, '📈': 0, '📉': 0, '🤔': 0, '💎': 0,
  });
  const [userPrediction, setUserPrediction] = useState<'bullish' | 'bearish' | null>(() => {
    if (!id) return null;
    return (localStorage.getItem(`prediction:${id}`) as any) || null;
  });
  const [predictionStats, setPredictionStats] = useState({ bullish: 67, bearish: 33 });

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
        [emoji]: (c[emoji] || 0) + 1,
      }));
    }
  };

  const handlePrediction = (vote: 'bullish' | 'bearish') => {
    if (!id || userPrediction) return;
    setUserPrediction(vote);
    localStorage.setItem(`prediction:${id}`, vote);
    setPredictionStats(s => ({
      bullish: vote === 'bullish' ? s.bullish + 1 : s.bullish,
      bearish: vote === 'bearish' ? s.bearish + 1 : s.bearish,
    }));
  };

  // ── Reading-time estimate ─────────────────────────────────────────────────
  const getReadingTime = (html?: string): number => {
    if (!html || typeof html !== 'string') return 1;
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = text ? text.split(/\s+/).length : 0;
    return Math.max(1, Math.round(words / 200));
  };

  // ── Client-side article extraction (CORS proxy) ─────────────────────────────
  const extractArticleClientSide = async (
    articleUrl: string,
  ): Promise<{ content: string; contentHtml: string } | null> => {
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
          const j = await res.json();
          html = j.contents || j.body || '';
        } else {
          html = await res.text();
        }
        if (!html || html.length < 500) continue;

        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll(
          'script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, .related-articles, .comments, .newsletter, .subscribe, .sidebar, .popup, .modal, [role="navigation"], [role="banner"], [role="complementary"], iframe, button, form, input, select, textarea, svg',
        ).forEach(el => el.remove());

        const ldScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of ldScripts) {
          try {
            const parsed = JSON.parse(s.textContent || '');
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const it of items) {
              const body = it.articleBody || it.text || '';
              if (body.length > 500) {
                const asHtml = body.includes('<') ? body : body.split(/\n{2,}/).map((p: string) => `<p>${p}</p>`).join('');
                return { content: body, contentHtml: asHtml };
              }
            }
          } catch {}
        }

        const selectors = [
          '[itemprop="articleBody"]', '.article-content', '.article-body', '.post-content',
          '.entry-content', '.story-body', '.content-body', '#article-body', '.td-post-content',
          '.article-detail', '.storyPage_storyContent', '#storyContent', 'article', 'main',
        ];
        for (const sel of selectors) {
          const el = doc.querySelector(sel);
          if (el) {
            const elHtml = el.innerHTML || '';
            const elText = el.textContent?.trim() || '';
            if (elText.length > 300) {
              const clean = elHtml
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .trim();
              return { content: elText, contentHtml: clean };
            }
          }
        }

        const paras = doc.querySelectorAll('article p, main p, .content p, body p');
        if (paras.length >= 3) {
          const texts: string[] = [];
          const htmlParts: string[] = [];
          paras.forEach(p => {
            const t = p.textContent?.trim() || '';
            if (t.length > 20) {
              texts.push(t);
              htmlParts.push(`<p>${p.innerHTML}</p>`);
            }
          });
          if (texts.join(' ').length > 300) {
            return { content: texts.join('\n\n'), contentHtml: htmlParts.join('') };
          }
        }
      } catch {}
    }
    return null;
  };

  // ── Multi-strategy full-content fetch (for the source article body) ──────
  const fetchFullContent = async (
    articleUrl: string,
  ): Promise<{ content: string; contentHtml: string } | null> => {
    if (!articleUrl || articleUrl === '#') return null;
    const tryBackend = async (base: string) => {
      try {
        const r = await fetch(`${base}/fetch-full-article?url=${encodeURIComponent(articleUrl)}`, {
          signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) return null;
        const d = await r.json();
        if (d.success && d.data) {
          const txt = d.data.content || '';
          const htm = d.data.contentHtml || txt;
          if (txt.length > 300 || htm.length > 300) return { content: txt, contentHtml: htm };
        }
      } catch {}
      return null;
    };
    const rejectIfEmpty = (p: Promise<{ content: string; contentHtml: string } | null>) =>
      p.then(r => (r && (r.content.length > 300 || r.contentHtml.length > 300) ? r : Promise.reject('empty')));
    try {
      return await Promise.any([
        rejectIfEmpty(tryBackend(API_BASE_URL)),
        rejectIfEmpty(tryBackend(CAMIFY)),
        rejectIfEmpty(extractArticleClientSide(articleUrl).then(r => (r ? r : Promise.reject('empty')))),
      ]);
    } catch {
      return null;
    }
  };

  // ── Parallel fetch of the article record itself ───────────────────────────
  // Races every known endpoint via Promise.any → first hit wins.
  const fetchArticleParallel = async (articleId: string): Promise<NewsItem | null> => {
    const tryFetch = async (url: string, timeout = 10000): Promise<any | null> => {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    };

    const findMatch = (data: any): any | null => {
      if (!data) return null;
      // /article/:id and /news/:articleId return { success, data: <article> }
      if (data.success && data.data && !Array.isArray(data.data)) return data.data;
      const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : null;
      if (!arr) return null;
      return arr.find((it: any) => it.article_id === articleId || it._id === articleId) || null;
    };

    const normalise = (raw: any): NewsItem | null => {
      if (!raw) return null;
      // posts collection (blog posts) shape
      if (raw.title && raw.content && (raw._id || raw.article_id) && !raw.link) {
        return {
          article_id: raw._id || raw.article_id,
          title: raw.title,
          description: raw.content ? (raw.content.length > 200 ? raw.content.substring(0, 200) + '...' : raw.content) : '',
          content: raw.content || '',
          fullContent: raw.content || '',
          contentHtml: raw.content || '',
          creator: raw.author ? [raw.author] : [],
          pubDate: raw.date || raw.pubDate || new Date().toISOString(),
          image_url: raw.imageUrl || raw.image_url || '',
          link: '',
          source_name: BRAND_DISPLAY_NAME,
        };
      }
      return raw as NewsItem;
    };

    const wrapMatch = (p: Promise<any>): Promise<NewsItem> =>
      p.then(json => {
        const m = findMatch(json);
        const norm = normalise(m);
        if (!norm) throw new Error('miss');
        return norm;
      });

    // Order matters even with Promise.any — kicks off in declaration order.
    // Fastest endpoints first; the 60s-cold-start Render endpoint goes LAST
    // with a tight 6s cap so it can never hold us up.
    const PER_SOURCE_RSS = [
      'coindesk', 'cryptoslate', 'cointelegraph', 'decrypt', 'blockworks',
      'beincrypto', 'finbold', 'coingape', 'bitcoinist', 'cryptobriefing',
      'protos', 'unchained', 'thecryptobasic', 'blockonomi', 'coincu',
      'cryptonewsz', 'ethereumworldnews', 'chaingpt', 'watcherguru', 'coinpedia',
      'smartliquidity',
    ];

    const racers: Promise<NewsItem>[] = [
      // Per-source RSS — typically 200–500 ms each, all fired in parallel.
      ...PER_SOURCE_RSS.map(src =>
        wrapMatch(tryFetch(`${CAMIFY}/fetch-${src}-rss?limit=50`, 6000)),
      ),
      // Aggregate (~4.5 s) — covers the rest.
      wrapMatch(tryFetch(`${CAMIFY}/fetch-all-rss?limit=100`, 8000)),
      // Multi-collection scan.
      wrapMatch(tryFetch(`${CAMIFY}/posts`, 4000)),
      // Direct id lookup (often 404s but 200s instantly when it's a hit).
      wrapMatch(tryFetch(`${CAMIFY}/article/${encodeURIComponent(articleId)}`, 4000)),
      // Render-hosted fallback — cold-starts up to 60 s, hard-cap at 6 s.
      wrapMatch(tryFetch(`${API_BASE_URL}/news/${encodeURIComponent(articleId)}`, 6000)),
    ];

    try {
      return await Promise.any(racers);
    } catch {
      return null;
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Count the actual readable text inside HTML, not just the markup length.
  const textLength = (html?: string): number => {
    if (!html) return 0;
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .length;
  };

  // Only do the slow scrape if RSS content is genuinely thin.
  // Most RSS feeds give 600–1500 chars which is readable; we skip the round-trip then.
  const needsFullFetch = (item: NewsItem | null): boolean => {
    if (!item || !item.link || item.link === '#') return false;
    const haveText = Math.max(
      textLength(item.contentHtml),
      textLength(item.fullContent),
      textLength(item.content),
    );
    return haveText < 900;
  };

  const mergeFullContent = (
    cacheKey: string,
    full: { content: string; contentHtml: string },
  ) => {
    setNewsItem(prev => {
      if (!prev) return prev;
      // Don't downgrade — only swap if the fetched body is meaningfully bigger.
      const existingText = Math.max(
        textLength(prev.contentHtml),
        textLength(prev.fullContent),
        textLength(prev.content),
      );
      const newText = Math.max(textLength(full.contentHtml), full.content.length);
      if (newText < existingText * 1.4) return prev;
      const updated = { ...prev };
      if (full.content.length > (updated.content?.length || 0)) {
        updated.content = full.content;
      }
      updated.fullContent = full.contentHtml;
      updated.contentHtml = full.contentHtml;
      writeCache(cacheKey, updated);
      return updated;
    });
  };

  // ── Main fetch flow ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const backgroundEnrich = (item: NewsItem) => {
      if (!needsFullFetch(item)) return;
      if (!cancelled) setBgEnriching(true);
      fetchFullContent(item.link)
        .then(full => {
          if (!full || cancelled || !id) return;
          mergeFullContent(id, full);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setBgEnriching(false); });
    };

    const run = async () => {
      if (!id) return;

      // Came from listing with state → instant render, optional bg enrich
      const fromState = navState && (navState.item || navState.newsItem);
      if (fromState) {
        const incoming = fromState as NewsItem;
        if (!cancelled) {
          setNewsItem(incoming);
          setLoading(false);
          setError(null);
          writeCache(id, incoming);
        }
        backgroundEnrich(incoming);
        return;
      }

      // Fresh cache hit — instant render, no skeleton.
      const cached = readCache(id);
      if (cached) {
        if (!cancelled) {
          setNewsItem(cached);
          setLoading(false);
          setError(null);
        }
        backgroundEnrich(cached);
        return;
      }

      // Stale cache hit — show it instantly under a "refreshing" hint, then refetch.
      const stale = READ_STALE(id);
      if (stale) {
        if (!cancelled) {
          setNewsItem(stale);
          setLoading(false);
          setError(null);
        }
      } else {
        if (!cancelled) {
          setLoading(true);
          setStatusMsg('Fetching article…');
        }
      }

      // Progressive status hints so the skeleton never feels frozen.
      const hint1 = setTimeout(() => !cancelled && setStatusMsg('Reaching news sources…'), 1200);
      const hint2 = setTimeout(() => !cancelled && setStatusMsg('Server warming up, hang tight…'), 4000);
      const hint3 = setTimeout(() => !cancelled && setStatusMsg('Almost there…'), 8000);

      const resolved = await fetchArticleParallel(id);
      clearTimeout(hint1); clearTimeout(hint2); clearTimeout(hint3);
      if (cancelled) return;

      if (resolved) {
        setNewsItem(resolved);
        writeCache(id, resolved);
        setError(null);
        setLoading(false);
        backgroundEnrich(resolved);
      } else if (!stale) {
        setError('News article not found');
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id, navState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync bookmark state
  useEffect(() => {
    if (newsItem?.article_id) {
      const stored = localStorage.getItem(`bookmark:${newsItem.article_id}`);
      setIsBookmarked(stored === '1');
    }
  }, [newsItem?.article_id]);

  // Reading progress
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
  }, [newsItem?.article_id]);

  const handleBack = () => navigate(-1);

  const handleShare = async () => {
    if (navigator.share && newsItem) {
      try {
        await navigator.share({
          title: newsItem.title,
          text: newsItem.description,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback('Link copied');
      setTimeout(() => setCopyFeedback(null), 1500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback('Link copied');
    setTimeout(() => setCopyFeedback(null), 1500);
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
      const rawHtml = newsItem?.content || newsItem?.description || '';
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
      const voices = (window as any).speechSynthesis?.getVoices() || [];
      const voice = voices.find((v: SpeechSynthesisVoice) => (v.lang || '').toLowerCase().startsWith('en'));
      const utterances = chunks.map(c => {
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
    if (!newsItem?.article_id) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      if (next) localStorage.setItem(`bookmark:${newsItem.article_id}`, '1');
      else localStorage.removeItem(`bookmark:${newsItem.article_id}`);
    } catch {}
  };

  // ── Sanitize scraped HTML ─────────────────────────────────────────────────
  const sanitizeScrapedHtml = (html: string, articleTitle?: string, heroImageUrl?: string): string => {
    if (!html) return '';
    const container = document.createElement('div');
    container.innerHTML = html;
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

    // ── Title de-dupe ─────────────────────────────────────────────
    const normalize = (s: string) =>
      s.toLowerCase()
        .replace(/[\u2018\u2019\u201C\u201D'"`]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const titleNorm = articleTitle ? normalize(articleTitle) : '';
    const titleHead = titleNorm ? titleNorm.split(' ').slice(0, 5).join(' ') : '';
    const titleMatches = (txt: string) => {
      if (!titleNorm) return false;
      const t = normalize(txt);
      if (!t) return false;
      if (t === titleNorm) return true;
      if (titleHead && t.length < titleNorm.length * 1.5 && t.startsWith(titleHead)) return true;
      if (t.length > 16 && titleNorm.includes(t)) return true;
      if (titleNorm.length > 16 && t.includes(titleNorm)) return true;
      return false;
    };

    // Always strip every <h1> — hero already shows the title.
    container.querySelectorAll('h1').forEach(el => el.remove());

    // Strip h2/h3/strong/b that match the title.
    container.querySelectorAll('h2, h3, h4, strong, b').forEach(el => {
      if (titleMatches(el.textContent || '')) el.remove();
    });

    // ── Image de-dupe ─────────────────────────────────────────────
    const basename = (u?: string) => {
      if (!u) return '';
      try {
        const url = new URL(u, window.location.origin);
        const last = url.pathname.split('/').filter(Boolean).pop() || '';
        return last
          .split('?')[0]
          .split('#')[0]
          .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]{2,4}$)/i, '')
          .replace(/-(scaled|large|medium|small|thumb|thumbnail)(?=\.[a-z]{2,4}$)/i, '')
          .toLowerCase();
      } catch {
        return (u.split('/').pop() || '').split('?')[0].toLowerCase();
      }
    };
    const heroBase = basename(heroImageUrl);
    const imgUrls = (img: HTMLImageElement) => [
      img.getAttribute('src') || '',
      img.getAttribute('data-src') || '',
      img.getAttribute('data-lazy-src') || '',
      img.getAttribute('data-original') || '',
      ...(img.getAttribute('srcset') || '').split(',').map(s => s.trim().split(/\s+/)[0] || ''),
    ];
    const matchesHero = (img: HTMLImageElement) => {
      if (!heroBase) return false;
      return imgUrls(img).some(c => c && basename(c) === heroBase);
    };

    // Strip any image anywhere whose basename matches the hero (handles CDN sizing).
    if (heroBase) {
      container.querySelectorAll('img').forEach(img => {
        if (matchesHero(img as HTMLImageElement)) {
          const wrap = img.closest('figure, picture, a, p, div');
          if (wrap && (wrap.textContent || '').trim().length < 80) {
            wrap.remove();
          } else {
            img.remove();
          }
        }
      });
    }

    // Belt + suspenders: when a hero image is shown, kill the FIRST image in the
    // body even if the URL doesn't match (some sources rehost/proxy the lead).
    if (heroBase) {
      const firstImg = container.querySelector('img');
      if (firstImg) {
        // Walk up to the closest top-level child of the container.
        let node: Element | null = firstImg;
        while (node && node.parentElement && node.parentElement !== container) {
          node = node.parentElement;
        }
        const block = node || firstImg;
        const idx = Array.from(container.children).indexOf(block as Element);
        // Only treat as the lead image if it sits in the first 3 blocks.
        if (idx >= 0 && idx < 3) {
          const blockText = (block.textContent || '').trim();
          if (blockText.length < 120) {
            block.remove();
          } else {
            firstImg.remove();
          }
        }
      }
    }

    // Strip leading title/empty/visual blocks. Visual blocks only stripped when a hero
    // image is rendered separately — otherwise the lead image IS the article's hero.
    const isLeadingDeadBlock = (el: Element): boolean => {
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return text.length === 0 || titleMatches(text);
      if (text.length === 0) return true; // empty wrapper
      if (heroBase) {
        // Only strip media when hero is shown elsewhere
        if (tag === 'img' || tag === 'figure' || tag === 'picture') return true;
        if (['p', 'div', 'a', 'span', 'section'].includes(tag)) {
          const innerImg = el.querySelector('img');
          if (innerImg && text.length < 80) return true;
        }
      }
      return false;
    };
    const children = Array.from(container.children);
    for (let i = 0; i < Math.min(children.length, 8); i++) {
      const ch = children[i];
      if (isLeadingDeadBlock(ch)) {
        ch.remove();
      } else {
        break;
      }
    }

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

    container.querySelectorAll('img').forEach(img => {
      const src = (img.getAttribute('src') || '').toLowerCase();
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      const w = img.getAttribute('width');
      if (
        src.includes('logo') || src.includes('icon') || src.includes('avatar') ||
        src.includes('1x1') || src.includes('pixel') || src.includes('tracking') ||
        alt.includes('logo') || (w && parseInt(w) < 50)
      ) {
        img.remove();
      }
    });

    container.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6').forEach(el => {
      if (!(el.textContent || '').trim() && !el.querySelector('img, video')) el.remove();
    });

    return container.innerHTML.trim();
  };

  // Pull the first real image out of the body so we can promote it to hero
  // when the stored image_url is a fake/placeholder. Skips logos, icons,
  // tracking pixels, etc.
  const extractFirstImage = (html?: string): string | null => {
    if (!html || typeof window === 'undefined') return null;
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const imgs = Array.from(tmp.querySelectorAll('img'));
      for (const img of imgs) {
        const src =
          img.getAttribute('src') ||
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-original') ||
          (img.getAttribute('srcset') || '').split(',')[0]?.trim().split(/\s+/)[0] ||
          '';
        if (!src || !/^https?:/i.test(src)) continue;
        const lower = src.toLowerCase();
        if (
          lower.includes('logo') ||
          lower.includes('icon') ||
          lower.includes('avatar') ||
          lower.includes('1x1') ||
          lower.includes('pixel') ||
          lower.includes('tracking')
        ) continue;
        const w = parseInt(img.getAttribute('width') || '0', 10);
        if (w && w < 200) continue;
        return src;
      }
    } catch {}
    return null;
  };

  const heroImage = useMemo(() => {
    const stored = newsItem?.image_url;
    if (stored && !isFakeImageUrl(stored)) return stored;
    const fromBody = extractFirstImage(
      newsItem?.contentHtml || newsItem?.fullContent || newsItem?.content || '',
    );
    return fromBody || stored || '';
  }, [newsItem?.image_url, newsItem?.contentHtml, newsItem?.fullContent, newsItem?.content]);

  const getNormalizedContentHtml = (htmlOrText?: string): string => {
    const raw = stripAppearedFirstOn((htmlOrText || '').trim());
    if (!raw) return '';
    const looksLikeHtml = /<[^>]+>/.test(raw);
    // Always pass the *resolved* hero (including the one we promoted from body)
    // so the sanitizer can dedupe it from the article body.
    if (looksLikeHtml) return sanitizeScrapedHtml(raw, newsItem?.title, heroImage);
    const paragraphs = raw
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    return paragraphs || `<p>${raw}</p>`;
  };

  const formattedDate = useMemo(() => {
    if (!newsItem?.pubDate) return '';
    const ds = newsItem.pubDate;
    let d = new Date(ds);
    if (isNaN(d.getTime())) {
      d = new Date(ds.replace(' ', 'T') + 'Z');
    }
    return isNaN(d.getTime())
      ? ds
      : d.toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
  }, [newsItem?.pubDate]);

  // ── Skeleton (replaces fullscreen modal) ──────────────────────────────────
  if (loading && !newsItem) {
    return (
      <div className="ns-shell">
        <div className="ns-progress"><div className="ns-progress__bar ns-progress__bar--indet" /></div>
        <div className="ns-container">
          <button className="ns-back" onClick={handleBack}><ArrowLeft size={16} /> Back</button>

          <div className="ns-status" role="status" aria-live="polite">
            <span className="ns-status__dot" />
            <span className="ns-status__msg">{statusMsg}</span>
          </div>

          <div className="ns-skeleton ns-skeleton--eyebrow shimmer" />
          <div className="ns-skeleton ns-skeleton--title shimmer" />
          <div className="ns-skeleton ns-skeleton--title-2 shimmer" />
          <div className="ns-skeleton ns-skeleton--meta shimmer" />
          <div className="ns-skeleton ns-skeleton--hero shimmer" />
          <div className="ns-skeleton ns-skeleton--p shimmer" />
          <div className="ns-skeleton ns-skeleton--p shimmer" />
          <div className="ns-skeleton ns-skeleton--p ns-skeleton--p-short shimmer" />
          <div className="ns-skeleton ns-skeleton--p shimmer" />
          <div className="ns-skeleton ns-skeleton--p ns-skeleton--p-short shimmer" />
          <div className="ns-skeleton ns-skeleton--p shimmer" />
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="ns-shell">
        <div className="ns-container ns-error">
          <h2>Article not found</h2>
          <p>{error || 'The requested article could not be located.'}</p>
          <p className="ns-error__hint">The server might be cold-starting. Give it a moment and retry.</p>
          <div className="ns-error__actions">
            <button className="ns-btn ns-btn--primary" onClick={() => window.location.reload()}>Retry</button>
            <button className="ns-btn" onClick={handleBack}><ArrowLeft size={16} /> Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const impact = (() => { try { return computeImpactLevel(newsItem); } catch { return { level: 'Low' as const, affectedCoins: [] as string[] }; } })();
  const categoryList: string[] = Array.isArray(newsItem.category)
    ? (newsItem.category as string[])
    : typeof newsItem.category === 'string'
      ? [newsItem.category as string]
      : [];
  const validCategory = categoryList.find(c => typeof c === 'string' && c.trim().length >= 3);
  const eyebrow = validCategory || impact.affectedCoins[0] || 'Crypto News';
  const readTime = getReadingTime(newsItem.content || newsItem.contentHtml);
  const cleanDesc = stripAppearedFirstOn(newsItem.description || '');

  return (
    <div className="ns-shell">
      <Helmet>
        <title>{newsItem.title} | CoinsClarity</title>
        <meta name="description" content={cleanDesc.slice(0, 160) || newsItem.title} />
        {/* Aggregator/syndicated content: do NOT index, point canonical at the
            original publisher to comply with Google's duplicate-content +
            AdSense "Replicated content" policies. */}
        <meta name="robots" content="noindex, follow" />
        <meta name="googlebot" content="noindex, follow" />
        <link rel="canonical" href={newsItem.link || window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={newsItem.title} />
        <meta property="og:description" content={cleanDesc || newsItem.title} />
        <meta property="og:image" content={newsItem.image_url} />
        <meta property="og:url" content={newsItem.link || window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={newsItem.title} />
        <meta name="twitter:description" content={cleanDesc || newsItem.title} />
        <meta name="twitter:image" content={newsItem.image_url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: newsItem.title,
          description: newsItem.description || newsItem.title,
          image: [newsItem.image_url || `${window.location.origin}/logo3.png`].filter(Boolean),
          author: { '@type': 'Organization', name: BRAND_DISPLAY_NAME },
          datePublished: newsItem.pubDate || new Date().toISOString(),
          dateModified: newsItem.pubDate || new Date().toISOString(),
          mainEntityOfPage: { '@type': 'WebPage', '@id': window.location.href },
          publisher: {
            '@type': 'Organization', name: 'CoinsClarity',
            logo: { '@type': 'ImageObject', url: `${window.location.origin}/logo3.png`, width: 512, height: 512 },
            url: 'https://coinsclarity.com',
          },
          articleSection: (Array.isArray(newsItem.category) ? newsItem.category[0] : newsItem.category) || 'Cryptocurrency',
          keywords: (Array.isArray(newsItem.keywords) ? newsItem.keywords.join(', ') : newsItem.keywords) || 'cryptocurrency, bitcoin, ethereum, crypto news',
          articleBody: newsItem.content || newsItem.description || '',
          wordCount: newsItem.content ? newsItem.content.split(/\s+/).length : 0,
        })}</script>
      </Helmet>

      <div className="ns-progress"><div className="ns-progress__bar" style={{ width: `${progress}%` }} /></div>

      <div className="ns-container">
        <button className="ns-back" onClick={handleBack}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* ── Hero ───────────────────────────────────────────── */}
        <header className="ns-hero">
          <div className="ns-eyebrow">
            <span className="ns-eyebrow__dot" />
            {eyebrow}
            {impact.level !== 'Low' && (
              <span className={`ns-impact ns-impact--${impact.level.toLowerCase()}`}>
                {impact.level} impact
              </span>
            )}
          </div>

          <h1 className="ns-title">{newsItem.title}</h1>

          {cleanDesc && (
            <p className="ns-deck">{cleanDesc.slice(0, 240)}{cleanDesc.length > 240 ? '…' : ''}</p>
          )}

          <div className="ns-meta">
            <span className="ns-meta__by">
              By <strong>{BRAND_DISPLAY_NAME}</strong>
            </span>
            <span className="ns-dot">·</span>
            <span className="ns-meta__item"><Calendar size={14} /> {formattedDate}</span>
            <span className="ns-dot">·</span>
            <span className="ns-meta__item"><Clock size={14} /> {readTime} min read</span>
            {impact.affectedCoins.length > 0 && (
              <>
                <span className="ns-dot">·</span>
                <span className="ns-meta__item ns-meta__coins">
                  {impact.affectedCoins.map(c => (
                    <span key={c} className="ns-tag">{c}</span>
                  ))}
                </span>
              </>
            )}
          </div>
        </header>

        {/* ── Two-column body ─────────────────────────────────── */}
        <div className="ns-grid">
          {/* Sticky share rail (desktop) */}
          <aside className="ns-rail">
            <button
              className={`ns-rail__btn ${isBookmarked ? 'is-on' : ''}`}
              onClick={handleBookmarkToggle}
              title={isBookmarked ? 'Saved' : 'Save'}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button className="ns-rail__btn" onClick={handleShare} title="Share">
              <Share2 size={18} />
            </button>
            <button className="ns-rail__btn" onClick={handleCopyLink} title="Copy link">
              <Copy size={18} />
            </button>
            <a
              className="ns-rail__btn"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(newsItem.title)}`}
              target="_blank" rel="noopener noreferrer"
              title="Tweet"
            >
              <Twitter size={18} />
            </a>
            <a
              className="ns-rail__btn"
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(newsItem.title)}`}
              target="_blank" rel="noopener noreferrer"
              title="Telegram"
            >
              <Send size={18} />
            </a>
            <div className="ns-rail__sep" />
            {!isTtsPlaying ? (
              <button className="ns-rail__btn" onClick={startTts} title="Listen">
                <Volume2 size={18} />
              </button>
            ) : (
              <button className="ns-rail__btn is-on" onClick={stopTts} title="Stop">
                <Square size={18} />
              </button>
            )}
            <button
              className="ns-rail__btn"
              onClick={() => setFontScale(v => Math.max(0.9, +(v - 0.1).toFixed(2)))}
              title="Smaller text"
            >
              <AArrowDown size={18} />
            </button>
            <button
              className="ns-rail__btn"
              onClick={() => setFontScale(v => Math.min(1.4, +(v + 0.1).toFixed(2)))}
              title="Larger text"
            >
              <AArrowUp size={18} />
            </button>
          </aside>

          <article className="ns-article" ref={contentRef}>
            <figure className="ns-figure">
              <img
                src={resolveImageSrc(heroImage, newsItem.title, 'news')}
                alt={newsItem.title}
                loading="eager"
                decoding="async"
                onError={(e) => handleImageError(e, newsItem.title, 'news')}
              />
            </figure>

            {(() => {
              const bodyForSummary =
                newsItem.contentHtml || newsItem.fullContent || newsItem.content || newsItem.description || '';
              if (textLength(bodyForSummary) < 300) return null;
              const { bullets } = summarize(bodyForSummary, {
                maxBullets: 3,
                cacheId: newsItem.article_id,
              });
              if (bullets.length < 2) return null;
              return (
                <div className="ns-tldr">
                  <div className="ns-tldr__head">
                    <span className="ns-tldr__badge">TL;DR</span>
                    <span className="ns-tldr__sub">3-bullet summary · auto-generated</span>
                  </div>
                  <ul className="ns-tldr__list">
                    {bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              );
            })()}

            {(() => {
              const bodyHtml =
                newsItem.contentHtml || newsItem.fullContent || newsItem.content || newsItem.description || '';
              const haveText = textLength(bodyHtml);
              const showBodyShimmer = bgEnriching && haveText < 600;
              return (
                <>
                  {haveText > 0 && (
                    <div
                      className="ns-body"
                      style={{ fontSize: `${(1.05 * fontScale).toFixed(2)}rem` }}
                      dangerouslySetInnerHTML={{ __html: getNormalizedContentHtml(bodyHtml) }}
                    />
                  )}
                  {showBodyShimmer && (
                    <div className="ns-body-skeleton" role="status" aria-live="polite">
                      <div className="ns-status ns-status--inline">
                        <span className="ns-status__dot" />
                        <span className="ns-status__msg">Loading full article…</span>
                      </div>
                      <div className="ns-skeleton ns-skeleton--p shimmer" />
                      <div className="ns-skeleton ns-skeleton--p shimmer" />
                      <div className="ns-skeleton ns-skeleton--p ns-skeleton--p-short shimmer" />
                      <div className="ns-skeleton ns-skeleton--p shimmer" />
                      <div className="ns-skeleton ns-skeleton--p shimmer" />
                      <div className="ns-skeleton ns-skeleton--p ns-skeleton--p-short shimmer" />
                    </div>
                  )}
                </>
              );
            })()}

            <p className="ns-attribution">— {BRAND_DISPLAY_NAME}</p>

            {/* Tags */}
            {Array.isArray(newsItem.keywords) && newsItem.keywords.length > 0 && (
              <div className="ns-tags">
                {newsItem.keywords.slice(0, 12).map((k, i) => (
                  <span key={i} className="ns-tag ns-tag--soft">{k}</span>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="ns-note">
              <strong>Editorial note.</strong> {BRAND_DISPLAY_NAME} aggregates and analyses crypto headlines.
              Our commentary is for informational purposes only and is not financial advice.
            </div>

            {/* Slim reactions */}
            <div className="ns-reactions">
              <span className="ns-reactions__label">Reaction</span>
              <div className="ns-reactions__row">
                {['🚀', '📈', '📉', '🤔', '💎'].map(emoji => (
                  <button
                    key={emoji}
                    className={`ns-reaction ${userReaction === emoji ? 'is-on' : ''}`}
                    onClick={() => handleReaction(emoji)}
                  >
                    <span className="ns-reaction__emoji">{emoji}</span>
                    {reactionCounts[emoji] > 0 && (
                      <span className="ns-reaction__count">{reactionCounts[emoji]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtle prediction poll */}
            <div className="ns-poll">
              <div className="ns-poll__head">
                <span className="ns-poll__title">Reader sentiment</span>
                <span className="ns-poll__hint">Where do you see the market heading?</span>
              </div>
              {!userPrediction ? (
                <div className="ns-poll__actions">
                  <button className="ns-poll__btn ns-poll__btn--up" onClick={() => handlePrediction('bullish')}>
                    <TrendingUp size={16} /> Bullish
                  </button>
                  <button className="ns-poll__btn ns-poll__btn--down" onClick={() => handlePrediction('bearish')}>
                    <TrendingDown size={16} /> Bearish
                  </button>
                </div>
              ) : (
                <div className="ns-poll__results">
                  <div className="ns-poll__row">
                    <span><TrendingUp size={14} /> Bullish</span>
                    <span>{predictionStats.bullish}%</span>
                  </div>
                  <div className="ns-poll__bar"><div className="ns-poll__bar-fill ns-poll__bar-fill--up" style={{ width: `${predictionStats.bullish}%` }} /></div>
                  <div className="ns-poll__row">
                    <span><TrendingDown size={14} /> Bearish</span>
                    <span>{predictionStats.bearish}%</span>
                  </div>
                  <div className="ns-poll__bar"><div className="ns-poll__bar-fill ns-poll__bar-fill--down" style={{ width: `${predictionStats.bearish}%` }} /></div>
                  <p className="ns-poll__voted">
                    You voted <strong>{userPrediction === 'bullish' ? 'Bullish' : 'Bearish'}</strong>
                  </p>
                </div>
              )}
            </div>

            <NewsArticleComments targetKind="news" targetKey={newsItem.article_id} />

            {/* Newsletter */}
            <div className="ns-newsletter">
              <div>
                <h4>The CoinsClarity Daily</h4>
                <p>Top crypto stories, market movers, and exclusive insights — every morning, free.</p>
              </div>
              <form
                className="ns-newsletter__form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const v = digestEmail.trim();
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                    setCopyFeedback('Enter a valid email');
                    setTimeout(() => setCopyFeedback(null), 2000);
                    return;
                  }
                  setDigestBusy(true);
                  const out = await postNewsletterSubscribe(v, `news_article:${id || 'unknown'}`);
                  setDigestBusy(false);
                  setCopyFeedback(out.ok ? out.message : out.message);
                  if (out.ok) setDigestEmail('');
                  setTimeout(() => setCopyFeedback(null), 3200);
                }}
              >
                <input
                  type="email"
                  placeholder="you@email.com"
                  required
                  value={digestEmail}
                  onChange={(e) => setDigestEmail(e.target.value)}
                  disabled={digestBusy}
                />
                <button type="submit" disabled={digestBusy}>
                  {digestBusy ? '…' : 'Subscribe'}
                </button>
              </form>
            </div>
          </article>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="ns-mobilebar">
        <button onClick={handleShare}><Share2 size={16} /> Share</button>
        <button onClick={handleBookmarkToggle} className={isBookmarked ? 'is-on' : ''}>
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} /> {isBookmarked ? 'Saved' : 'Save'}
        </button>
        {!isTtsPlaying ? (
          <button onClick={startTts}><Volume2 size={16} /> Listen</button>
        ) : (
          <button onClick={stopTts} className="is-on"><Square size={16} /> Stop</button>
        )}
      </div>

      <div className={`ns-toast ${copyFeedback ? 'show' : ''}`}>{copyFeedback}</div>
    </div>
  );
};

export default NewsDetail;
