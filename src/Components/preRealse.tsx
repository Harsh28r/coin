// src/components/PressRelease.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import skeleton CSS

interface PressReleaseItem {
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
  link: string;
}

const PressRelease: React.FC = () => {
  const navigate = useNavigate();
  const [otherReleases, setOtherReleases] = useState<PressReleaseItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [mainArticle, setMainArticle] = useState<PressReleaseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-1.onrender.com';
  const MOCK_API_BASE_URL = 'http://localhost:5000'; // For db.json

  useEffect(() => {
    const fetchReleases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try fetching from db.json first
        try {
          const response = await fetch(`${MOCK_API_BASE_URL}/news`);
          if (!response.ok) {
            throw new Error(`db.json fetch failed: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          const formattedReleases = data.map((item: any) => ({
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            author: item.author || 'Unknown',
            date: new Date(item.pubDate || new Date()).toLocaleDateString(),
            image: item.image || 'https://via.placeholder.com/300x200?text=No+Image',
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
            title: item.title || 'Untitled',
            description: item.description || 'No description available',
            author: item.creator?.join(', ') || 'Unknown',
            date: new Date(item.pubDate || new Date()).toLocaleDateString(),
            image: item.image_url || 'https://via.placeholder.com/300x200?text=No+Image',
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
    <Container fluid className="mt-5 mb-5 skeleton-container" style={{ width: '92%', marginBottom: '100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
          Press Release
        </h4>
        <Button
          variant="link"
          className="text-warning text-decoration-none"
          onClick={() => {
            setShowAll(!showAll);
            navigate('/press-news');
          }}
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
      ) : !mainArticle && otherReleases.length === 0 ? (
        <p>No press releases available.</p>
      ) : (
        <Row>
          <Col lg={7}>
            {mainArticle && (
              <Card
                className="border-0 rounded-4"
                style={{ height: 'auto', minHeight: '430px', cursor: 'pointer' }}
                onClick={() => window.open(mainArticle.link, '_blank')}
              >
                <Card.Img
                  variant="top"
                  src={mainArticle.image}
                  alt={mainArticle.title}
                  className="rounded-5"
                  style={{ height: '428px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <Card.Title
                      className="fs-3 mb-3 text-start"
                      style={{ fontWeight: 'bold', fontSize: '1.5rem' }}
                    >
                      {mainArticle.title}
                    </Card.Title>
                  </div>
                  <Card.Text
                    className="text-start"
                    style={{
                      fontSize: '1rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                    }}
                  >
                    {mainArticle.description}
                  </Card.Text>
                  <div className="text-start">
                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {mainArticle.date}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
          <Col lg={5}>
            {(showAll ? otherReleases : otherReleases.slice(0, 3)).map((release, index) => (
              <Card
                key={index}
                className="mb-3 border-0 rounded-5"
                style={{ height: 'auto', minHeight: '150px', cursor: 'pointer' }}
                onClick={() => window.open(release.link, '_blank')}
              >
                <Row className="g-2">
                  <Col xs={8}>
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <Card.Title
                        className="h2 text-start"
                        style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                      >
                        {release.title}
                      </Card.Title>
                      <Card.Text
                        className="small text-start description"
                        style={{
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                        }}
                      >
                        {release.description}
                      </Card.Text>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small className="text-muted" style={{ fontSize: '0.9rem' }}>
                            By{' '}
                          </small>
                          <small className="text-warning" style={{ fontSize: '0.9rem' }}>
                            {release.author}
                          </small>
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
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
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
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