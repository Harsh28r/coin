// src/components/FeaturedCarousel.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { extractListingNews } from '../utils/listings';
import { BRAND_DISPLAY_NAME, stripAppearedFirstOn } from '../utils/branding';

interface TrendingNewsItem {
  article_id?: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
  source: string;
  link?: string;
  content?: string;
}

const SIDE_CAROUSEL_PLACEHOLDER = 'https://placehold.co/160x103/1a1a2e/64748b?text=News';

function decodeHtmlEntities(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
const SIDE_CAROUSEL_PLACEHOLDER_DATAURI = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="103" viewBox="0 0 160 103"><rect fill="%231a1a2e" width="160" height="103"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-size="14" font-family="sans-serif">News</text></svg>');

function extractImgSrcFromHtml(html: string): string {
  if (typeof html !== 'string' || !html.trim()) return '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

function getNewsImageUrl(it: any): string {
  const enclosureUrl = it?.enclosure && (typeof it.enclosure === 'string' ? it.enclosure : it.enclosure?.url);
  const enclosureFirst = Array.isArray(it?.enclosures) && it.enclosures[0] ? (it.enclosures[0]?.url || it.enclosures[0]) : '';
  const mediaUrl = it?.media?.content?.[0]?.$?.url || it?.media?.thumbnail?.[0]?.$?.url || (it?.media?.thumbnail && typeof it.media.thumbnail === 'string' ? it.media.thumbnail : (it?.media?.thumbnail?.url));
  const imageObjUrl = (it?.image && typeof it.image === 'object' && it.image?.url) ? it.image.url : (it?.thumbnail && typeof it.thumbnail === 'object' && it.thumbnail?.url) ? it.thumbnail.url : '';
  const fromHtml = extractImgSrcFromHtml(it?.content || it?.description || '');
  const featured = (typeof it?.featured_image === 'string' && it.featured_image.trim() !== '') ? it.featured_image : (typeof it?.featuredImage === 'string' ? it.featuredImage : typeof it?.og_image === 'string' ? it.og_image : typeof it?.cover_image === 'string' ? it.cover_image : '');
  const raw =
    (typeof it?.image_url === 'string' && it.image_url.trim() !== '') ? it.image_url
    : (typeof it?.image === 'string' && it.image.trim() !== '') ? it.image
    : (typeof it?.thumbnail === 'string' && it.thumbnail.trim() !== '') ? it.thumbnail
    : (typeof enclosureUrl === 'string' && enclosureUrl.trim() !== '') ? enclosureUrl
    : (typeof enclosureFirst === 'string' && enclosureFirst.trim() !== '') ? enclosureFirst
    : (typeof mediaUrl === 'string' && mediaUrl.trim() !== '') ? mediaUrl
    : (typeof imageObjUrl === 'string' && imageObjUrl.trim() !== '') ? imageObjUrl
    : (typeof featured === 'string' && featured.trim() !== '') ? featured
    : (fromHtml && fromHtml.trim() !== '') ? fromHtml
    : '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return SIDE_CAROUSEL_PLACEHOLDER;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;
  if (s.startsWith('/')) return SIDE_CAROUSEL_PLACEHOLDER;
  return SIDE_CAROUSEL_PLACEHOLDER;
}

const FeaturedCarousel: React.FC = () => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const rotationTimerRef = useRef<number | null>(null);
  const [trendingNews, setTrendingNews] = useState<TrendingNewsItem[]>([]);
  const [featureSlides, setFeatureSlides] = useState<any[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState<boolean>(true);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null);
  const [showTranslationIndicator, setShowTranslationIndicator] = useState(false);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const navigate = useNavigate();
  
  // Fallback trending items for right side when API returns nothing
  const fallbackTrendingNews: TrendingNewsItem[] = [
    { title: 'Top Market Stories', excerpt: 'Catch up on the most important crypto headlines.', author: 'CoinsClarity', date: new Date().toLocaleDateString(), image: SIDE_CAROUSEL_PLACEHOLDER, source: 'Trending', link: '#' },
    { title: 'New Listings and Pairs', excerpt: 'Latest token listings across major exchanges.', author: 'CoinsClarity', date: new Date().toLocaleDateString(), image: 'https://placehold.co/160x103/1a1a2e/64748b?text=Listings', source: 'Trending', link: '#' },
    { title: 'DeFi & NFT Highlights', excerpt: 'What\'s moving in DeFi and NFTs.', author: 'CoinsClarity', date: new Date().toLocaleDateString(), image: 'https://placehold.co/160x103/1a1a2e/64748b?text=DeFi', source: 'Trending', link: '#' },
  ];

  // Quick fallback slides to avoid empty UI
  const fallbackFeatureSlides = [
    {
      article_id: 'fallback-1',
      title: 'Top Market Stories Today',
      description: 'Catch up on the most important crypto headlines right now.',
      creator: ['CoinsClarity'],
      pubDate: new Date().toISOString(),
      image_url: '/image.png?height=450&width=800&text=Crypto+News',
      link: '#',
      source: 'Top News',
      content: 'Top market stories summary.'
    },
    {
      article_id: 'fallback-2',
      title: 'New Listings and Trading Pairs',
      description: 'The latest token listings across major exchanges.',
      creator: ['CoinsClarity'],
      pubDate: new Date().toISOString(),
      image_url: '/image.png?height=450&width=800&text=New+Listings',
      link: '#',
      source: 'Listings',
      content: 'New listings overview.'
    },
    {
      article_id: 'fallback-3',
      title: 'DeFi & NFT Highlights',
      description: 'What’s moving in DeFi and NFTs right now.',
      creator: ['CoinsClarity'],
      pubDate: new Date().toISOString(),
      image_url: '/image.png?height=450&width=800&text=DeFi+%26+NFT',
      link: '#',
      source: 'Beyond the Headlines',
      content: 'DeFi and NFT highlights.'
    }
  ];

  // Use the translation hook - convert TrendingNewsItem to NewsItem format
  const newsItemsForTranslation = React.useMemo(() => trendingNews.map(item => ({
    article_id: item.article_id,
    title: item.title,
    description: item.excerpt,
    creator: [item.author],
    pubDate: item.date,
    image_url: item.image,
    link: item.link || '#',
    source: item.source
  })), [trendingNews]);
  
  // Only trigger translation when language changes or news items change
  const { displayItems: displayTrendingNews, isTranslating, currentLanguage } = useNewsTranslation(newsItemsForTranslation);

  // Translate feature slides (left carousel)
  const featureItemsForTranslation = React.useMemo(() => featureSlides.map((news: any) => ({
    article_id: news.article_id,
    title: news.title,
    description: news.description,
    creator: Array.isArray(news.creator) ? news.creator : [news.author || 'Unknown'],
    pubDate: news.pubDate || news.date,
    image_url: news.image_url || news.image,
    link: news.link || '#',
    source: news.source || 'Top News'
  })), [featureSlides]);
  const { displayItems: displayFeatureSlides } = useNewsTranslation(featureItemsForTranslation);
  
  // Control translation indicator display to prevent flickering
  useEffect(() => {
    if (isTranslating && currentLanguage !== 'en') {
      setShowTranslationIndicator(true);
    } else {
      setShowTranslationIndicator(false);
    }
  }, [isTranslating, currentLanguage]);
  
  const CAMIFY_BASE = 'https://camify.fun.coinsclarity.com';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const USE_API_FALLBACK = API_BASE_URL && !API_BASE_URL.includes('localhost');
  const MOCK_API_BASE_URL = process.env.REACT_APP_USE_LOCAL_DB === 'true' ? 'http://localhost:5000' : '';
  const formatMDY = (input: string | Date) => {
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return String(input);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(/,/g, '');
    } catch {
      return String(input);
    }
  };


  const handlePrev = () => {
    const len = (displayTrendingNews.length > 0 ? displayTrendingNews.length : trendingNews.length) || 1;
    setActiveIndex((current) => (current === 0 ? len - 1 : current - 1));
  };

  const handleNext = () => {
    const len = (displayTrendingNews.length > 0 ? displayTrendingNews.length : trendingNews.length) || 1;
    setActiveIndex((current) => (current === len - 1 ? 0 : current + 1));
  };

  useEffect(() => {
    const CAMIFY = CAMIFY_BASE;
    const bases = [CAMIFY, ...(USE_API_FALLBACK ? [API_BASE_URL.replace(/\/$/, '')] : [])];

    const fetchJson = async (url: string, timeoutMs = 6000) => {
      const controller = new AbortController();
      const id = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Bad response');
        return await res.json();
      } catch {
        return null as any;
      } finally {
        clearTimeout(id);
      }
    };

    const extractArr = (j: any): any[] => {
      if (!j) return [];
      return Array.isArray(j.data) ? j.data : Array.isArray(j.items) ? j.items : [];
    };

    const fetchFeatureSlides = async () => {
      setLoadingFeatures(true);
      setFeatureSlides(fallbackFeatureSlides);
      setLoadingFeatures(false);
      try {
        const slides: any[] = [];
        const pushSlide = (it: any, source: string) => {
          slides.push({
            article_id: it.article_id,
            title: it.title,
            description: it.description || '',
            creator: it.creator || ['Unknown'],
            pubDate: it.pubDate || new Date().toISOString(),
            image_url: it.image_url || '/image.png?height=450&width=800&text=News',
            link: it.link || '#',
            source,
            content: it.content || it.description || ''
          });
        };

        const heroPathGroups: { paths: string[]; label: string }[] = [
          { paths: ['fetch-cointelegraph-rss', 'fetch-coindesk-rss', 'fetch-decrypt-rss', 'fetch-cryptoslate-rss', 'fetch-blockworks-rss', 'fetch-beincrypto-rss'], label: 'Exclusive' },
          { paths: ['fetch-blockworks-rss', 'fetch-coindesk-rss', 'fetch-cointelegraph-rss', 'fetch-decrypt-rss', 'fetch-finbold-rss', 'fetch-coingape-rss'], label: 'Trending' },
          { paths: ['fetch-beincrypto-rss', 'fetch-cryptopotato-rss', 'fetch-cryptobriefing-rss', 'fetch-coingape-rss', 'fetch-protos-rss', 'fetch-thecryptobasic-rss'], label: 'Beyond the Headlines' },
          { paths: ['fetch-cryptopotato-rss', 'fetch-dailycoin-rss', 'fetch-utoday-rss', 'fetch-coincu-rss', 'fetch-cryptonewsz-rss', 'fetch-bitcoinist-rss'], label: 'Did You Know' },
        ];
        await Promise.all(
          heroPathGroups.map(async (g) => {
            for (const path of g.paths) {
              const suffix = path.includes('?') ? path : `${path}?limit=7`;
              for (const base of bases) {
                const url = `${base}/${suffix}`;
                const j = await fetchJson(url, 3500);
                const arr = extractArr(j);
                if (arr.length > 0) {
                  arr.slice(0, 7).forEach((it: any) => pushSlide(it, g.label));
                  return;
                }
              }
            }
          })
        );

        const pressPaths = ['fetch-cryptobriefing-rss', 'fetch-dailyhodl-rss', 'fetch-finbold-rss', 'fetch-beincrypto-rss', 'fetch-protos-rss', 'fetch-unchained-rss', 'fetch-blockonomi-rss', 'fetch-thecryptobasic-rss'];
        for (const path of pressPaths) {
          const suffix = `${path}?limit=10`;
          let pressItems: any[] = [];
          for (const base of bases) {
            const j = await fetchJson(`${base}/${suffix}`, 3500);
            pressItems = extractArr(j);
            if (pressItems.length) break;
          }
          if (pressItems.length) {
            pressItems.slice(0, 4).forEach((it: any) => pushSlide(it, 'Press Releases'));
            break;
          }
        }

        const listingPaths = ['fetch-dailycoin-rss', 'fetch-cryptobriefing-rss', 'fetch-beincrypto-rss', 'fetch-cryptopotato-rss', 'fetch-utoday-rss', 'fetch-coindesk-rss', 'fetch-coingape-rss', 'fetch-blockworks-rss', 'fetch-cointelegraph-rss', 'fetch-decrypt-rss', 'fetch-bitcoinist-rss', 'fetch-finbold-rss'];
        let listingMerged: any[] = [];
        for (const path of listingPaths) {
          const suffix = `${path}?limit=20`;
          for (const base of bases) {
            const j = await fetchJson(`${base}/${suffix}`, 3500);
            const arr = extractArr(j);
            if (arr.length) listingMerged.push(...arr);
          }
        }
        const listings = extractListingNews(listingMerged);
        listings.slice(0, 4).forEach((li: any) => {
          slides.push({
            article_id: li.article_id,
            title: li.title,
            description: li.description || li.content || '',
            creator: [''],
            pubDate: li.pubDate || new Date().toISOString(),
            image_url: li.image_url || '/image.png?height=450&width=800&text=Listing',
            link: li.link || '#',
            source: 'Listings',
            content: li.content || li.description || ''
          });
        });
        const seen = new Set<string>();
        const deduped = slides.filter((s) => {
          const key = s.article_id || s.link || s.title;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        let limited = deduped.slice(0, 20);
        if (!limited.length) limited = fallbackFeatureSlides;
        setFeatureSlides(limited);
      } catch {}
      finally { setLoadingFeatures(false); }
    };
    fetchFeatureSlides();

    const fetchTrendingNews = async () => {
      // Cached-first paint
      const seedFromCache = (): TrendingNewsItem[] => {
        try {
          const raw = localStorage.getItem('trendingCache');
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed as TrendingNewsItem[] : [];
        } catch {
          return [];
        }
      };
      const saveCache = (items: TrendingNewsItem[]) => {
        try { localStorage.setItem('trendingCache', JSON.stringify(items.slice(0, 24))); } catch {}
      };

      const cached = seedFromCache();
      let hasItems = false;
      if (cached.length) {
        setTrendingNews(cached);
        setLoading(false);
        hasItems = true;
      } else {
        setLoading(true);
      }

      const quickPaths = ['fetch-coindesk-rss', 'fetch-cointelegraph-rss', 'fetch-decrypt-rss', 'fetch-cryptoslate-rss', 'fetch-blockworks-rss', 'fetch-beincrypto-rss', 'fetch-cryptobriefing-rss', 'fetch-coingape-rss', 'fetch-finbold-rss', 'fetch-protos-rss', 'fetch-thecryptobasic-rss', 'fetch-coincu-rss', 'fetch-bitcoinist-rss', 'fetch-dailycoin-rss', 'fetch-cryptopotato-rss', 'fetch-utoday-rss'];
      try {
        let quickItems: any[] = [];
        const quickPromises = quickPaths.map(async (path) => {
          const suffix = `${path}?limit=12`;
          for (const base of bases) {
            const j = await fetchJson(`${base}/${suffix}`, 4500);
            const arr = extractArr(j);
            if (arr.length) return arr;
          }
          return [];
        });
        const quickResults = await Promise.allSettled(quickPromises);
        quickResults.forEach((r: any) => {
          if (r?.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) quickItems.push(...r.value);
        });
        if (quickItems.length) {
          const formattedQuick: TrendingNewsItem[] = quickItems.map((it: any) => ({
            article_id: it.article_id,
            title: it.title || 'Untitled',
            excerpt: it.description || 'No description available',
            author: Array.isArray(it.creator) ? (it.creator[0] || 'Unknown') : (it.creator || 'Unknown'),
            date: new Date(it.pubDate || new Date().toISOString()).toLocaleDateString(),
            image: getNewsImageUrl(it),
            source: 'Trending',
            link: it.link || '#',
            content: it.content || it.description || ''
          }));
          const seen = new Set<string>();
          const dedupQuick = formattedQuick.filter(n => {
            const key = n.article_id || n.link || n.title;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setTrendingNews(dedupQuick);
          saveCache(dedupQuick);
          setLoading(false);
          hasItems = true;
        }
      } catch (error: any) {
        console.error('Error fetching quick trending:', error?.message || error);
      }

      const morePaths = ['fetch-cryptobriefing-rss', 'fetch-beincrypto-rss', 'fetch-decrypt-rss', 'fetch-blockworks-rss', 'fetch-finbold-rss', 'fetch-coingape-rss', 'fetch-protos-rss', 'fetch-thecryptobasic-rss', 'fetch-coincu-rss', 'fetch-cryptoslate-rss', 'fetch-unchained-rss', 'fetch-blockonomi-rss', 'fetch-bitcoinist-rss', 'fetch-dailycoin-rss', 'fetch-cryptopotato-rss', 'fetch-utoday-rss', 'fetch-cointelegraph-rss', 'fetch-coindesk-rss'];
      try {
        let items: any[] = [];
        const morePromises = morePaths.map(async (path) => {
          const suffix = `${path}?limit=12`;
          for (const base of bases) {
            const j = await fetchJson(`${base}/${suffix}`, 6000);
            const arr = extractArr(j);
            if (arr.length) return arr;
          }
          return [];
        });
        const results = await Promise.allSettled(morePromises);
        results.forEach((res: any) => {
          if (res?.status === 'fulfilled' && Array.isArray(res.value) && res.value.length) items.push(...res.value);
        });
        if (items.length) {
          const formatted: TrendingNewsItem[] = items.map((it: any) => ({
            article_id: it.article_id,
            title: it.title || 'Untitled',
            excerpt: it.description || 'No description available',
            author: Array.isArray(it.creator) ? (it.creator[0] || 'Unknown') : (it.creator || 'Unknown'),
            date: new Date(it.pubDate || new Date().toISOString()).toLocaleDateString(),
            image: getNewsImageUrl(it),
            source: 'Trending',
            link: it.link || '#',
            content: it.content || it.description || ''
          }));
          const dedupByKey = (arr: TrendingNewsItem[]) => {
            const seen = new Set<string>();
            return arr.filter(n => {
              const key = n.article_id || n.link || n.title;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          };
          const merged = dedupByKey([ ...formatted, ...trendingNews ]).slice(0, 30);
          setTrendingNews(merged);
          saveCache(merged);
          hasItems = true;
        }
      } catch {}
      if (!hasItems) {
        setTrendingNews(fallbackTrendingNews);
        setLoading(false);
      }
    };

    fetchTrendingNews();
  }, []);

  // Keep activeIndex within bounds when slides change
  useEffect(() => {
    if (activeIndex >= featureSlides.length) {
      setActiveIndex(0);
    }
  }, [featureSlides.length]);

  // Drive rotation with our own timer to ensure rotation even when controlled
  useEffect(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
    if (featureSlides.length > 1) {
      rotationTimerRef.current = window.setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % featureSlides.length);
      }, 5000);
    }
    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };
  }, [featureSlides.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollable = scrollableRef.current;
    if (scrollable) {
      const startY = e.clientY;
      const scrollTop = scrollable.scrollTop;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newY = moveEvent.clientY;
        const scroll = scrollTop + (startY - newY);
        scrollable.scrollTop = scroll;
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        dragCleanupRef.current = null;
      };

      // Store cleanup function for potential unmount during drag
      dragCleanupRef.current = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
    };
  }, []);

  // NFT Market section removed per request

  return (
    <>
      
      <Row className="mt-3 mx-auto" style={{ width: '95%' }}>
        <Col lg={7} className="mb-3 mb-lg-0">
        {error ? (
          <div
            className="text-center my-custom-loading"
            style={{
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h5 className="text-danger">Error: {error}</h5>
          </div>
        ) : (!loadingFeatures && featureSlides.length > 0) ? (
          <>
            <Carousel
              className="text-white rounded-5 my-custom-carousel"
              style={{ height: '450px', width: '95%', margin: '0 auto' }}
              indicators={false}
              controls={false}
              interval={null}
              pause={false}
              wrap
              touch={false}
              keyboard={false}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            >
              {featureSlides.map((news: any, index: number) => (
                <Carousel.Item
                  key={index}
                  className="custom-carousel-item rounded-4"
                  style={{ height: '450px', cursor: 'pointer' }}
                  onClick={() => {
                    const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                    const translated = Array.isArray(displayFeatureSlides) ? displayFeatureSlides[index] : null;
                    const stateItem = {
                      article_id: news.article_id || id,
                      title: translated?.title || news.title,
                      description: translated?.description || news.description || news.excerpt || '',
                      creator: Array.isArray(news.creator) ? news.creator : [news.author || 'Unknown'],
                      pubDate: news.pubDate || news.date || new Date().toISOString(),
                      image_url: news.image_url || news.image,
                      link: news.link || '#',
                      source_name: BRAND_DISPLAY_NAME,
                      content: news.content || news.description || news.excerpt || ''
                    };
                    navigate(`/news/${id}`, { state: { item: stateItem } });
                  }}
                >
                  <Card.Img
                    src={news.image_url || news.image || '/image.png?height=450&width=800&text=News'}
                    alt={news.title}
                    className="rounded-4"
                    style={{ height: '100%', objectFit: 'cover', width: '100%', cursor: 'pointer', backgroundColor: '#0b0f1a' }}
                    onClick={() => {
                      const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                      const translated = Array.isArray(displayFeatureSlides) ? displayFeatureSlides[index] : null;
                      const stateItem = {
                        article_id: news.article_id || id,
                        title: translated?.title || news.title,
                        description: translated?.description || news.description || news.excerpt || '',
                        creator: Array.isArray(news.creator) ? news.creator : [news.author || 'Unknown'],
                        pubDate: news.pubDate || news.date || new Date().toISOString(),
                        image_url: news.image_url || news.image,
                        link: news.link || '#',
                        source_name: BRAND_DISPLAY_NAME,
                        content: news.content || news.description || news.excerpt || ''
                      };
                      navigate(`/news/${id}`, { state: { item: stateItem } });
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                  <Card.ImgOverlay
                    className="d-flex flex-column justify-content-end rounded-5"
                    style={{ padding: '1rem', cursor: 'pointer', background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.25) 65%, transparent 100%)' }}
                    onClick={() => {
                      const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                      const translated = Array.isArray(displayFeatureSlides) ? displayFeatureSlides[index] : null;
                      const stateItem = {
                        article_id: news.article_id || id,
                        title: translated?.title || news.title,
                        description: translated?.description || news.description || news.excerpt || '',
                        creator: Array.isArray(news.creator) ? news.creator : [news.author || 'Unknown'],
                        pubDate: news.pubDate || news.date || new Date().toISOString(),
                        image_url: news.image_url || news.image,
                        link: news.link || '#',
                        source_name: BRAND_DISPLAY_NAME,
                        content: news.content || news.description || news.excerpt || ''
                      };
                      navigate(`/news/${id}`, { state: { item: stateItem } });
                    }}
                  >
                    {/* Top-left badges */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="badge bg-light text-dark">{BRAND_DISPLAY_NAME}</span>
                      <span className="badge" style={{ backgroundColor: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}>
                        {BRAND_DISPLAY_NAME}
                      </span>
                    </div>

                    {/* Top-right brand only */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      <img src="/logo3.png" alt="CoinsClarity" style={{ height: '40px', width: 'auto' }} />
                    </div>
                    {/* content stack */}
                    <div
                      className="d-flex align-items-start flex-column"
                      style={{ paddingLeft: '0', width: '100%' }}
                    >
                      <div
                        className="fw-bold mb-2 card-title"
                        style={{
                          textAlign: 'left',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)',
                          lineHeight: 1.25,
                          letterSpacing: '0.01em',
                          maxWidth: '100%',
                          overflowWrap: 'break-word',
                          textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as any,
                          overflow: 'hidden',
                        }}
                      >
                        {(Array.isArray(displayFeatureSlides) && displayFeatureSlides[index]?.title) ? displayFeatureSlides[index].title : news.title}
                      </div>
                      <small
                        className="hero-carousel-description"
                        style={{
                          fontSize: 'clamp(0.85rem, 1.3vw, 1.05rem)',
                          fontWeight: 400,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          lineHeight: 1.5,
                          maxHeight: '3.2em',
                          marginBottom: '0.5rem',
                          color: '#ffffff',
                          textShadow: '0 0 1px #000, 0 0 2px #000, 0 1px 4px #000, 0 2px 6px rgba(0,0,0,0.9)',
                        }}
                      >
                        {stripAppearedFirstOn(decodeHtmlEntities((Array.isArray(displayFeatureSlides) && displayFeatureSlides[index]?.description) ? displayFeatureSlides[index].description : (news.description || '')))}
                      </small>
                      <span className="hero-read-article-cta" style={{
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 800,
                        textTransform: 'uppercase' as any,
                        letterSpacing: '0.1em',
                        textShadow: '0 0 1px #000, 0 0 2px #000, 0 1px 4px #000, 0 2px 8px rgba(0,0,0,0.9)',
                      }}>
                        Read Full Article →
                      </span>
                    </div>
                  </Card.ImgOverlay>
                  {/* Prev button - left side */}
                  <Button
                    variant="dark"
                    className="rounded-circle"
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      padding: '0',
                      background: 'rgba(0,0,0,0.55)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}
                  >
                    <ChevronLeft size={20} color="#fff" />
                  </Button>
                  {/* Next button - right side */}
                  <Button
                    variant="dark"
                    className="rounded-circle"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      padding: '0',
                      background: 'rgba(0,0,0,0.55)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}
                  >
                    <ChevronRight size={20} color="#fff" />
                  </Button>
                  {/* Dot indicators */}
                  <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 5,
                  }}>
                    {featureSlides.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                        style={{
                          width: idx === activeIndex ? '24px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: idx === activeIndex ? '#f7931a' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: 0,
                        }}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </>
        ) : (
          <div className="my-custom-loading rounded-5" style={{ height: '450px', width: '95%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            <Skeleton height={450} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" />
            <div
              className="d-flex flex-column justify-content-between"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '1rem' }}
            >
              <div className="d-flex justify-content-between align-items-center mt-4">
                <Skeleton width={100} height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                <Skeleton width={80} height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
              </div>
              <div>
                <Skeleton width="80%" height={30} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                <Skeleton count={3} width="90%" height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
              </div>
            </div>
          </div>
        )}
      </Col>
      <Col lg={5} className="d-flex justify-content-center mt-3 mt-lg-0">
        <Card
          className="border-top-0 border-bottom-0"
          style={{
            width: '200%',
            borderColor: 'transparent',
            borderLeft: '2px solid lightgrey',
            marginTop: '5px',
          }}
        >
          <Card.Body className="trending-news-body" style={{ width: '100%' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h6
                className="m-0 trending-news-title"
                style={{ textAlign: 'left', fontSize: '24px' }}
              >
                Trending Market
              </h6>
              <Button
                variant="link"
                className="text-decoration-none p-0"
                style={{
                  color: 'orange',
                  fontSize: '0.9rem',
                  padding: '0.2rem 0.5rem',
                }}
                onClick={() => navigate('/All-Trending-news')}
              >
                View All <ChevronRight />
              </Button>
            </div>
            {showTranslationIndicator && (
              <small className="text-muted mb-2 d-block">Translating to {currentLanguage.toUpperCase()}…</small>
            )}
            <div
              ref={scrollableRef}
              onMouseDown={handleMouseDown}
              style={{
                maxHeight: '450px',
                overflow: 'hidden',
                width: '100%',
                margin: '0 auto',
                cursor: 'grab',
              }}
            >
              <div
                className="scrollable-container"
                style={{ height: '360px', width: '100%', cursor: 'pointer' }}
              >
                <div className="trending-news-container">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <Row key={index} className="mb-4">
                        <Col xs={8}>
                          <Skeleton width="80%" height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                          <Skeleton count={3} width="90%" height={16} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                          <div className="d-flex justify-content-between">
                            <Skeleton width={100} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                            <Skeleton width={80} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                          </div>
                        </Col>
                        <Col xs={4}>
                          <Skeleton height={103} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                        </Col>
                      </Row>
                    ))
                  ) : (displayTrendingNews.length > 0 ? displayTrendingNews : trendingNews).length > 0 ? (
                    (displayTrendingNews.length > 0 ? displayTrendingNews : trendingNews).map((news: any, index: number) => (
                      <Row key={index} className="mb-4">
                        <Col xs={8}>
                          <h6
                            className="mb-2"
                            style={{
                              fontSize: '18px',
                              fontWeight: 'bold',
                              lineHeight: '1.4',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                              const stateItem = {
                                article_id: news.article_id || id,
                                title: news.title,
                                description: news.description || news.excerpt || '',
                                creator: Array.isArray(news.creator) ? news.creator : [news.author || 'Unknown'],
                                pubDate: news.pubDate || news.date || new Date().toISOString(),
                                image_url: news.image_url || news.image,
                                link: news.link || '#',
                                source_name: BRAND_DISPLAY_NAME,
                                content: news.content || news.description || news.excerpt || ''
                              };
                              navigate(`/news/${id}`, { state: { item: stateItem } });
                            }}
                          >
                            {news.title}
                          </h6>
                          <p
                            className="small text-muted mb-2"
                            style={{
                              fontSize: '12px',
                              lineHeight: '1.5',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              textAlign: 'left',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {stripAppearedFirstOn(news.description || news.excerpt || '')}
                          </p>
                          <small
                            className="text-muted d-flex justify-content-between"
                            style={{
                              fontSize: '16px',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              display: 'block',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small
                                  className="text-muted"
                                  style={{ fontSize: '12px' }}
                                >
                                  By{' '}
                                </small>
                                <small
                                  className="text-warning"
                                  style={{ marginLeft: '1px', fontSize: '12px' }}
                                >
                                  <strong>{BRAND_DISPLAY_NAME}</strong>
                                </small>
                              </div>
                            </div>
                            <div className="ms-auto text-end">
                              <small className="text-muted" style={{ fontSize: '12px' }}>
                                {formatMDY(news.date || news.pubDate)}
                              </small>
                            </div>
                          </small>
                        </Col>
                        <Col xs={4}>
                          <img
                            src={news.image || (news as any).image_url || SIDE_CAROUSEL_PLACEHOLDER}
                            alt={news.title}
                            className="img-fluid rounded"
                            style={{ height: '103px', objectFit: 'cover', backgroundColor: '#1a1a1a', minWidth: '120px' }}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const el = e.currentTarget;
                              if (!el.src || el.src === SIDE_CAROUSEL_PLACEHOLDER_DATAURI) return;
                              el.src = SIDE_CAROUSEL_PLACEHOLDER_DATAURI;
                            }}
                          />
                        </Col>
                      </Row>
                    ))
                  ) : (
                    Array.from({ length: 4 }).map((_, index) => (
                      <Row key={`sk-${index}`} className="mb-4">
                        <Col xs={8}>
                          <Skeleton width="80%" height={20} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                          <Skeleton count={3} width="90%" height={16} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                          <div className="d-flex justify-content-between">
                            <Skeleton width={100} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                            <Skeleton width={80} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                          </div>
                        </Col>
                        <Col xs={4}>
                          <Skeleton height={103} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                        </Col>
                      </Row>
                    ))
                  )}
                </div>
              </div>
            </div>

          </Card.Body>
        </Card>
      </Col>
      <style>
        {`
          .hero-carousel-description {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            text-shadow: 0 0 1px #000, 0 0 2px #000, 0 1px 4px #000, 0 2px 6px rgba(0,0,0,0.9) !important;
          }
          .hero-read-article-cta {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            text-shadow: 0 0 1px #000, 0 0 2px #000, 0 1px 4px #000, 0 2px 8px rgba(0,0,0,0.95) !important;
          }
          @media (max-width: 768px) {
            .custom-carousel-item {
              width: 100% !important;
            }
            .carousel {
              width: 100% !important;
            }
            .mb-3 {
              margin-bottom: 0 !important;
            }
            .fs-2 {
              font-size: 1.5rem !important;
            }
            .fs-4 {
              font-size: 1rem !important;
            }
          }
          .trending-news-title {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 32px;
            line-height: 38px;
            letter-spacing: 0.04em;
          }
          .container-fluid {
            border-bottom: none !important;
          }
          .news-badge {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 12px;
            line-height: 14.52px;
            letter-spacing: 0.04em;
          }
          .my-custom-carousel {
            background-color: #f8f9fa !important;
          }
          .my-custom-loading {
            background-color: #f8f9fa !important;
          }
          .skeleton-container {
            position: relative;
          }
        `}
              </style>
      </Row>
    </>
  );
};

export default FeaturedCarousel;