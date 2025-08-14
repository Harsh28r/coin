// src/components/FeaturedCarousel.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

interface TrendingNewsItem {
  article_id?: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
  source: string;
  link?: string;
}

const FeaturedCarousel: React.FC = () => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [trendingNews, setTrendingNews] = useState<TrendingNewsItem[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null);
  const [showTranslationIndicator, setShowTranslationIndicator] = useState(false);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
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
  
  // Control translation indicator display to prevent flickering
  useEffect(() => {
    if (isTranslating && currentLanguage !== 'en') {
      setShowTranslationIndicator(true);
    } else {
      setShowTranslationIndicator(false);
    }
  }, [isTranslating, currentLanguage]);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';
  const MOCK_API_BASE_URL = 'http://localhost:5000'; // For db.json
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
    const fetchTrendingNews = async () => {
      setLoading(true);
      try {
        // Try fetching from db.json first
        try {
          const response = await fetch(`${MOCK_API_BASE_URL}/news`);
          if (!response.ok) {
            throw new Error(`db.json fetch failed: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const news = data
            .map((item: any) => ({
              article_id: item.article_id,
              title: item.title || 'Untitled',
              excerpt: item.description || 'No description available',
              author: item.author || 'Unknown',
              date: new Date(item.pubDate || new Date()).toLocaleDateString(),
              image: item.image || '/default.png?height=200&width=400&text=News',
              source: item.source || 'Local News',
              link: item.link || '#',
            }))
            .slice(0, 4);

          setTrendingNews(news);
          console.log('Fetched trending news from db.json:', news);
          setLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to fetch from db.json, falling back to API:', error);
        }

        // Fetch from /fetch-rss
        const response1 = await fetch(`${API_BASE_URL}/fetch-rss`);
        if (!response1.ok) {
          throw new Error(`fetch-rss failed: ${response1.status} ${response1.statusText}`);
        }
        const contentType1 = response1.headers.get('content-type');
        if (!contentType1 || !contentType1.includes('application/json')) {
          throw new Error('fetch-rss returned non-JSON response');
        }
        const data1 = await response1.json();
        const news1 = data1.success
          ? data1.data
              .map((item: any) => ({
                article_id: item.article_id,
                title: item.title || 'Untitled',
                description: item.description || 'No description available',
                creator: item.creator || ['Unknown'],
                pubDate: item.pubDate || new Date().toISOString(),
                image_url: item.image_url || '/default.png?height=200&width=400&text=News',
                source: 'Exclusive News',
                link: item.link || '#',
              }))
              .slice(0, 2)
          : [];

        // Fetch from /fetch-another-rss
        const response2 = await fetch(`${API_BASE_URL}/fetch-another-rss`);
        if (!response2.ok) {
          throw new Error(`fetch-another-rss failed: ${response2.status} ${response2.statusText}`);
        }
        const contentType2 = response2.headers.get('content-type');
        if (!contentType2 || !contentType2.includes('application/json')) {
          throw new Error('fetch-another-rss returned non-JSON response');
        }
        const data2 = await response2.json();
        const news2 = data2.success
          ? data2.data
              .map((item: any) => ({
                article_id: item.article_id,
                title: item.title || 'Untitled',
                description: item.description || 'No description available',
                creator: item.creator || ['Unknown'],
                pubDate: item.pubDate || new Date().toISOString(),
                image_url: item.image_url || '/default.png?height=200&width=400&text=News',
                source: 'Press Release',
                link: item.link || '#',
              }))
              .slice(0, 2)
          : [];

        const formattedNews: TrendingNewsItem[] = [...news1, ...news2]
          .map((item: any): TrendingNewsItem => ({
            article_id: item.article_id,
            title: item.title,
            excerpt: item.description,
            author: item.creator[0] || 'Unknown',
            date: new Date(item.pubDate).toLocaleDateString(),
            image: item.image_url,
            source: item.source,
            link: item.link,
          }))
          .filter(
            (item: TrendingNewsItem) => item.image && item.image.trim() !== ''
          );

        const uniqueNews: TrendingNewsItem[] = Array.from(
          new Set(formattedNews.map((n) => n.title))
        )
          .map((title) => formattedNews.find((n) => n.title === title))
          .filter((n): n is TrendingNewsItem => !!n);

        setTrendingNews(uniqueNews);
        console.log('Fetched trending news:', uniqueNews);
      } catch (error: any) {
        console.error('Error fetching trending news:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingNews();
  }, []);

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
          <div className="my-custom-loading rounded-5" style={{ height: '450px', width: '95%', margin: '0 auto' }}>
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
        ) : displayTrendingNews.length > 0 ? (
          <>
            <Carousel
              className="text-white rounded-5 my-custom-carousel"
              style={{ height: '450px', width: '95%', margin: '0 auto' }}
              indicators={false}
              controls={false}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            >
              {displayTrendingNews.map((news: any, index: number) => (
                <Carousel.Item
                  key={index}
                  className="custom-carousel-item rounded-4"
                  style={{ height: '450px', cursor: 'pointer' }}
                  onClick={() => {
                    const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                    navigate(`/news/${id}`);
                  }}
                >
                  <Card.Img
                    src={news.image_url || news.image || '/image.png?height=450&width=800&text=News'}
                    alt={news.title}
                    className="rounded-4"
                    style={{ height: '100%', objectFit: 'cover', width: '100%', cursor: 'pointer' }}
                    onClick={() => {
                      const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                      navigate(`/news/${id}`);
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/image.png?height=450&width=800&text=News';
                    }}
                  />
                  <Card.ImgOverlay
                    className="d-flex flex-column justify-content-end rounded-5"
                    style={{ padding: '1rem', cursor: 'pointer' }}
                    onClick={() => {
                      const id = news.article_id || encodeURIComponent(((news.link as string | undefined) || news.title));
                      navigate(`/news/${id}`);
                    }}
                  >
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
                        {news.title}
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
                        {news.description}
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
          <div
            className="text-center my-custom-loading"
            style={{
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
            }}
          >
            <h5 className="text-dark">No trending news available.</h5>
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
                Trending News
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
                              navigate(`/news/${id}`);
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
                    <p>No trending news available.</p>
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