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
  const navigate = useNavigate();
  
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
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
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
    // Helper with timeout to prevent long stalls
    const fetchJson = async (url: string, timeoutMs = 6000) => {
      const controller = new AbortController();
      const id = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Bad response');
        return await res.json();
      } catch (err) {
        // swallow to keep UI responsive; caller handles nulls
        return null as any;
      } finally {
        clearTimeout(id);
      }
    };

    // Fetch top-N from each section for LEFT carousel
    const fetchFeatureSlides = async () => {
      setLoadingFeatures(true);
      // Paint immediately with fallback while real data loads
      setFeatureSlides(fallbackFeatureSlides);
      setLoadingFeatures(false);
      try {
        const endpoints = [
          { url: `${API_BASE_URL}/fetch-cointelegraph-rss?limit=3`, label: 'Exclusive' },
          { url: `${API_BASE_URL}/fetch-another-rss?limit=3`, label: 'Trending' },
          { url: `${API_BASE_URL}/fetch-beincrypto-rss?limit=3`, label: 'Beyond the Headlines' },
          { url: `${API_BASE_URL}/fetch-cryptopotato-rss?limit=3`, label: 'Did You Know' },
        ];
        const results = await Promise.allSettled(
          endpoints.map(async (e) => {
            const j = await fetchJson(e.url, 3500);
            if (!j) return null;
            return { j, label: e.label };
          })
        );
        const slides: any[] = [];
        results.forEach((res: any) => {
          if (res.status === 'fulfilled' && res.value?.j?.success && Array.isArray(res.value.j.data) && res.value.j.data.length > 0) {
            res.value.j.data.slice(0, 3).forEach((it: any) => {
              slides.push({
                article_id: it.article_id,
                title: it.title,
                description: it.description || '',
                creator: it.creator || ['Unknown'],
                pubDate: it.pubDate || new Date().toISOString(),
                image_url: it.image_url || '/image.png?height=450&width=800&text=News',
                link: it.link || '#',
                source: res.value.label,
                content: it.content || it.description || ''
              });
            });
          }
        });

        // Press Releases: merge multiple sources and take top 2
        try {
          const pressSources = [
            `${API_BASE_URL}/fetch-cryptobriefing-rss?limit=6`,
            `${API_BASE_URL}/fetch-dailyhodl-rss?limit=6`,
            `${API_BASE_URL}/fetch-another-rss?limit=6`
          ];
          const pressResults = await Promise.allSettled(
            pressSources.map(async (u) => await fetchJson(u, 3500))
          );
          let pressItems: any[] = [];
          pressResults.forEach((r: any) => {
            if (r?.status === 'fulfilled' && r.value?.success && Array.isArray(r.value.data)) {
              pressItems.push(...r.value.data);
            }
          });
          pressItems.slice(0, 2).forEach((it: any) => {
            slides.push({
              article_id: it.article_id,
              title: it.title,
              description: it.description || '',
              creator: it.creator || ['Unknown'],
              pubDate: it.pubDate || new Date().toISOString(),
              image_url: it.image_url || '/image.png?height=450&width=800&text=News',
              link: it.link || '#',
              source: 'Press Releases',
              content: it.content || it.description || ''
            });
          });
        } catch {}

        // Listings: extract from aggregated sources and take top 2
        try {
          const listingSources = [
            'fetch-dailycoin-rss?limit=30',
            'fetch-cryptobriefing-rss?limit=30',
            'fetch-dailyhodl-rss?limit=30',
            'fetch-ambcrypto-rss?limit=30',
            'fetch-beincrypto-rss?limit=30',
            'fetch-cryptopotato-rss?limit=30',
            'fetch-utoday-rss?limit=30',
            'fetch-bitcoinmagazine-rss?limit=30',
            'fetch-coindesk-rss?limit=30'
          ];
          const listingResponses = await Promise.allSettled(
            listingSources.map(async (s) => await fetchJson(`${API_BASE_URL}/${s}`, 3500))
          );
          let merged: any[] = [];
          listingResponses.forEach((r: any) => {
            if (r?.status === 'fulfilled' && r.value?.success && Array.isArray(r.value.data)) {
              merged.push(...r.value.data);
            }
          });
          const listings = extractListingNews(merged);
          listings.slice(0, 2).forEach((li: any) => {
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
        } catch {}
        // De-dup by article_id/link/title
        const seen = new Set<string>();
        const deduped = slides.filter((s) => {
          const key = s.article_id || s.link || s.title;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Limit to a reasonable number to keep carousel smooth
        let limited = deduped.slice(0, 12);
        if (!limited.length) {
          limited = fallbackFeatureSlides;
        }
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
      if (cached.length) {
        setTrendingNews(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      // Phase 1: quick sources with short timeout
      try {
        const quickSources = [
          `${API_BASE_URL}/fetch-coindesk-rss?limit=12`,
          `${API_BASE_URL}/fetch-dailycoin-rss?limit=12`,
        ];
        const quickResults = await Promise.allSettled(
          quickSources.map(u => fetchJson(u, 4500).catch(() => null))
        );
        let quickItems: any[] = [];
        quickResults.forEach((r: any) => {
          if (r?.status === 'fulfilled' && r.value?.success && Array.isArray(r.value.data)) quickItems.push(...r.value.data);
        });
        if (quickItems.length) {
          const formattedQuick: TrendingNewsItem[] = quickItems.map((it: any) => ({
            article_id: it.article_id,
            title: it.title || 'Untitled',
            excerpt: it.description || 'No description available',
            author: Array.isArray(it.creator) ? (it.creator[0] || 'Unknown') : (it.creator || 'Unknown'),
            date: new Date(it.pubDate || new Date().toISOString()).toLocaleDateString(),
            image: (typeof it.image_url === 'string' && /^https?:\/\//i.test(it.image_url)) ? it.image_url : '/image.png',
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
        }
      } catch (error: any) {
        console.error('Error fetching quick trending:', error?.message || error);
      }

      // Phase 2: background enrichment
      try {
        const moreSources = [
          `${API_BASE_URL}/fetch-cryptobriefing-rss?limit=12`,
          `${API_BASE_URL}/fetch-dailyhodl-rss?limit=12`,
          `${API_BASE_URL}/fetch-ambcrypto-rss?limit=12`,
          `${API_BASE_URL}/fetch-beincrypto-rss?limit=12`,
          `${API_BASE_URL}/fetch-bitcoinmagazine-rss?limit=12`,
          `${API_BASE_URL}/fetch-decrypt-rss?limit=12`,
        ];
        const results = await Promise.allSettled(
          moreSources.map(u => fetchJson(u, 6000).catch(() => null))
        );
        let items: any[] = [];
        results.forEach((res: any) => {
          if (res?.status === 'fulfilled' && res.value?.success && Array.isArray(res.value.data)) {
            items.push(...res.value.data);
          }
        });
        if (items.length) {
          const formatted: TrendingNewsItem[] = items.map((it: any) => ({
            article_id: it.article_id,
            title: it.title || 'Untitled',
            excerpt: it.description || 'No description available',
            author: Array.isArray(it.creator) ? (it.creator[0] || 'Unknown') : (it.creator || 'Unknown'),
            date: new Date(it.pubDate || new Date().toISOString()).toLocaleDateString(),
            image: (typeof it.image_url === 'string' && /^https?:\/\//i.test(it.image_url)) ? it.image_url : '/image.png',
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
        }
      } catch {}
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
      }, 3000);
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
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

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
        ) : loading ? (
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
                      source_name: news.source || 'Top News',
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
                        source_name: news.source || 'Top News',
                        content: news.content || news.description || news.excerpt || ''
                      };
                      navigate(`/news/${id}`, { state: { item: stateItem } });
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/image.png?height=450&width=800&text=News';
                    }}
                  />
                  <Card.ImgOverlay
                    className="d-flex flex-column justify-content-end rounded-5"
                    style={{ padding: '1rem', cursor: 'pointer', background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.0) 100%)' }}
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
                        source_name: news.source || 'Trending',
                        content: news.content || news.description || news.excerpt || ''
                      };
                      navigate(`/news/${id}`, { state: { item: stateItem } });
                    }}
                  >
                    {/* Top-left badges */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="badge bg-light text-dark">{news.source || 'Top News'}</span>
                      <span className="badge" style={{ backgroundColor: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}>
                        {Array.isArray(news.creator) ? (news.creator[0] || 'Unknown') : (news.author || 'Unknown')}
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
                          fontSize: 'clamp(1.25rem, 3vw, 2.5rem)',
                          lineHeight: 1.2,
                          letterSpacing: '0.02em',
                          maxWidth: '100%',
                          overflowWrap: 'break-word',
                          textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                          color: '#ffffff'
                        }}
                      >
                        {(Array.isArray(displayFeatureSlides) && displayFeatureSlides[index]?.title) ? displayFeatureSlides[index].title : news.title}
                      </div>
                      <small
                        className="text"
                        style={{
                          fontSize: 'clamp(0.95rem, 1.5vw, 1.25rem)',
                          fontWeight: 500,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 4,
                          lineHeight: 1.6,
                          maxHeight: '8.8em',
                          marginBottom: '1rem',
                          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
                          color: '#ffffff'
                        }}
                      >
                        {(Array.isArray(displayFeatureSlides) && displayFeatureSlides[index]?.description) ? displayFeatureSlides[index].description : news.description}
                      </small>
                    </div>
                  </Card.ImgOverlay>
                  <div
                    className="carousel-controls"
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      variant="outline-light"
                      className="rounded-circle me-4"
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        padding: '0',
                      }}
                    >
                      <ChevronLeft style={{ marginLeft: '5px' }} />
                    </Button>
                    <Button
                      variant="outline-light"
                      className="rounded-circle"
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        padding: '0',
                      }}
                    >
                      <ChevronRight style={{ marginLeft: '5px' }} />
                    </Button>
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
                                source_name: news.source || 'Trending',
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
                            {news.description || news.excerpt}
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
                                  <strong>{news.author || (Array.isArray(news.creator) ? news.creator[0] : 'Unknown')}</strong>
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
                            src={news.image || news.image_url || '/image.png?height=103&width=160&text=News'}
                            alt={news.title}
                            className="img-fluid rounded"
                            style={{ height: '103px', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/image.png?height=103&width=160&text=News';
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