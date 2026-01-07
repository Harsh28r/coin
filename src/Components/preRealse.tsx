// src/components/PressRelease.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import { getCryptoFallbackImage, handleImageError } from '../utils/cryptoImages';
import { Helmet } from 'react-helmet-async';

interface PressReleaseItem {
  article_id?: string;
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
  link: string;
}

const PressRelease: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [otherReleases, setOtherReleases] = useState<PressReleaseItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [mainArticle, setMainArticle] = useState<PressReleaseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null);
  
  // Use the translation hook
  const { displayItems: displayReleases, isTranslating, currentLanguage } = useNewsTranslation(otherReleases);
  // Use translated releases everywhere if available
  const effectiveReleases: PressReleaseItem[] = (displayReleases.length > 0 ? (displayReleases as any) : otherReleases) as PressReleaseItem[];
  const effectiveMainArticle: PressReleaseItem | null = React.useMemo(() => {
    if (!effectiveReleases || effectiveReleases.length === 0) return null;
    if (!mainArticle) return effectiveReleases[effectiveReleases.length - 1] || null;
    const byId = mainArticle.article_id ? effectiveReleases.find(r => r.article_id === mainArticle.article_id) : undefined;
    if (byId) return byId;
    const byTitle = effectiveReleases.find(r => (r.title || '').toLowerCase().trim() === (mainArticle.title || '').toLowerCase().trim());
    return byTitle || effectiveReleases[effectiveReleases.length - 1] || null;
  }, [effectiveReleases, mainArticle]);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
  const MOCK_API_BASE_URL = process.env.REACT_APP_USE_LOCAL_DB === 'true' ? 'http://localhost:5000' : '';

  const formatMDY = (input: string | Date) => {
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return String(input);
      return d
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        .replace(/,/g, '');
    } catch {
      return String(input);
    }
  };

  useEffect(() => {
    const fetchReleases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try fetching from db.json first
        try {
          if (!MOCK_API_BASE_URL) throw new Error('Local db disabled');
          const response = await fetch(`${MOCK_API_BASE_URL}/news`);
          if (!response.ok) {
            throw new Error(`db.json fetch failed: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const formattedReleases = data.map((item: any) => ({
            article_id: item.article_id,
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            author: item.author || 'Unknown',
            date: formatMDY(item.pubDate || new Date()),
            image: item.image || getCryptoFallbackImage(item.title, 'news'),
            link: item.link || '#',
          }));
          setOtherReleases(formattedReleases);
          setMainArticle(formattedReleases[formattedReleases.length - 1] || null);
          console.log('Fetched press releases from db.json:', formattedReleases);
          setIsLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to fetch from db.json, falling back to API:', error);
        }

        // Fetch from /fetch-another-rss
        const response = await fetch(`${API_BASE_URL}/fetch-another-rss`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const formattedReleases = data.data.map((item: any) => ({
            article_id: item.article_id,
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            author: item.creator?.join(', ') || 'Unknown',
            date: formatMDY(item.pubDate || new Date()),
            image: item.image_url || getCryptoFallbackImage(item.title, 'news'),
            link: item.link || item.url || '#',
          }));
          setOtherReleases(formattedReleases);
          setMainArticle(formattedReleases[formattedReleases.length - 1] || null);
          console.log('Fetched press releases from API:', formattedReleases);
        } else {
          throw new Error('Fetched data is not an array');
        }
      } catch (error: any) {
        console.error('Error fetching releases:', error);
        setError('Failed to load press releases. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, []);



  return (
    <Container
      fluid
      className="mt-5 mb-5 skeleton-container"
      style={{
        width: '92%',
        marginBottom: '100px',
      }}
    >
      <Helmet>
        <title>Press Releases | CoinsClarity</title>
        <meta name="description" content="Latest announcements and press releases across crypto." />
        <link rel="canonical" href={`${window.location.origin}/press-news`} />
      </Helmet>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4
            className="m-0"
            style={{
              fontWeight: 900,
              letterSpacing: '0.03em',
              fontSize: '1.4rem',
              color: 'var(--text)'
            }}
          >
            Press Releases
          </h4>
          <small style={{ color: 'var(--text)' }}>Latest announcements and updates across crypto</small>
          {isTranslating && (
            <small className="text-muted d-block mt-1">
              🔄 Translating press releases to {currentLanguage === 'hi' ? 'Hindi' : 
                currentLanguage === 'es' ? 'Spanish' :
                currentLanguage === 'fr' ? 'French' :
                currentLanguage === 'de' ? 'German' :
                currentLanguage === 'zh' ? 'Chinese' :
                currentLanguage === 'ja' ? 'Japanese' :
                currentLanguage === 'ko' ? 'Korean' :
                currentLanguage === 'ar' ? 'Arabic' : currentLanguage}...
            </small>
          )}
        </div>
        <Button
          variant="link"
          className="text-warning text-decoration-none"
          onClick={() => {
            setShowAll(!showAll);
            navigate('/press-news');
          }}
          style={{ fontWeight: 600 }}
        >
          {showAll ? 'View Less' : 'View All'} <ChevronRight size={20} />
        </Button>
      </div>

      {error ? (
        <p className="text-danger">{error}</p>
      ) : isLoading ? (
        <Row>
          <Col lg={7}>
            <Card className="border-0 rounded-4" style={{ height: 'auto', minHeight: '430px' }}>
              <Skeleton height={428} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" borderRadius={16} />
              <Card.Body>
                <Skeleton width="80%" height={24} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                <Skeleton count={2} width="90%" height={16} baseColor="#e0e0e0" highlightColor="#f5f5f5" className="mt-2" />
                <Skeleton width={100} height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" className="mt-2" />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={5}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="mb-3 border-0 rounded-5" style={{ height: 'auto', minHeight: '150px' }}>
                <Row className="g-2">
                  <Col xs={8}>
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <Skeleton width="80%" height={18} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                      <Skeleton count={2} width="90%" height={14} baseColor="#e0e0e0" highlightColor="#f5f5f5" className="mt-2" />
                      <div className="d-flex justify-content-between">
                        <Skeleton width={100} height={12} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                        <Skeleton width={80} height={12} baseColor="#e0e0e0" highlightColor="#f5f5f5" />
                      </div>
                    </Card.Body>
                  </Col>
                  <Col xs={4}>
                    <Skeleton height={120} width="100%" baseColor="#e0e0e0" highlightColor="#f5f5f5" borderRadius={8} />
                  </Col>
                </Row>
              </Card>
            ))}
          </Col>
        </Row>
      ) : !effectiveMainArticle && effectiveReleases.length === 0 ? (
        <p>No press releases available.</p>
      ) : (
        <Row>
          <Col lg={7}>
            {effectiveMainArticle && (
              <Card
                className="border-0 rounded-4"
                style={{ height: 'auto', minHeight: '430px', cursor: 'pointer', overflow: 'hidden', color: 'var(--text)' }}
                onClick={() => {
                  const targetId = effectiveMainArticle.article_id || encodeURIComponent(effectiveMainArticle.title || '');
                  navigate(`/news/${targetId}`, { state: { item: {
                    article_id: effectiveMainArticle.article_id || targetId,
                    title: effectiveMainArticle.title,
                    description: effectiveMainArticle.description,
                    creator: [effectiveMainArticle.author || 'Unknown'],
                    pubDate: effectiveMainArticle.date,
                    image_url: effectiveMainArticle.image,
                    link: effectiveMainArticle.link,
                    source_name: 'Crypto News',
                    content: effectiveMainArticle.description || ''
                  } } });
                }}
              >
                <div style={{ position: 'relative', height: '628px', borderRadius: '20px', overflow: 'hidden' }}>
                  <img
                    src={effectiveMainArticle.image}
                    alt={effectiveMainArticle.title}
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      handleImageError(e, effectiveMainArticle.title, 'news');
                    }}
                  />
                  {/* Overlay gradient */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%)',
                    }}
                  />
                  {/* Content overlay */}
                  <div style={{ position: 'absolute', bottom: 0, padding: '18px 20px', color: '#fff', width: '100%' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>

                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.35rem', lineHeight: 1.25, marginBottom: 6, color: '#fff' }}>{effectiveMainArticle.title}</div>
                    <div
                      style={{
                        color: '#e5e7eb',
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        marginBottom: 10,
                      }}
                    >
                      {effectiveMainArticle.description}
                    </div>
                    <div className="d-flex justify-content-between align-items-center" style={{ color: '#d1d5db', fontSize: 12 }}>
                      <div>
                        <span>By </span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{effectiveMainArticle.author || 'Unknown'}</span>
                      </div>
                      <div>{effectiveMainArticle.date}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </Col>
          <Col lg={5}>
            {(showAll ? effectiveReleases : effectiveReleases.slice(0, 3)).map((release, index) => (
              <Card
                key={index}
                className="mb-3 border-0 rounded-5"
                style={{
                  height: 'auto',
                  minHeight: '150px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease',
                  color: 'var(--text)'
                }}
                onClick={() => {
                  const targetId = release.article_id || encodeURIComponent(release.title || '');
                  navigate(`/news/${targetId}`, { state: { item: {
                    article_id: release.article_id || targetId,
                    title: release.title,
                    description: release.description,
                    creator: [release.author || 'Unknown'],
                    pubDate: release.date,
                    image_url: release.image,
                    link: release.link,
                    source_name: 'Crypto News',
                    content: release.description || ''
                  } } });
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.10)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                }}
              >
                <Row className="g-2 align-items-center" style={{ color: 'var(--text)' }}>
                  <Col xs={8}>
                    <Card.Body className="d-flex flex-column justify-content-between" style={{ color: 'var(--text)' }}>
                      <div className="d-flex align-items-center mb-1" style={{ gap: 6 }}>

                      </div>
                      <Card.Title className="h2 text-start" style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)' }}>
                        {release.title}
                      </Card.Title>
                      <Card.Text
                        className="small text-start description"
                        style={{
                          fontSize: '0.92rem',
                          color: 'var(--text)',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                        }}
                      >
                        {release.description}
                      </Card.Text>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                            By{' '}
                          </small>
                          <small className="text-warning" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {release.author}
                          </small>
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                          {release.date}
                        </small>
                      </div>
                    </Card.Body>
                  </Col>
                  <Col xs={4}>
                    <Image
                      src={release.image}
                      alt={release.title}
                      fluid
                      className="h-100 object-fit-cover rounded-3"
                      style={{ height: 'auto', maxHeight: '120px' }}
                      onError={(e) => {
                        handleImageError(e, release.title, 'news');
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default PressRelease;