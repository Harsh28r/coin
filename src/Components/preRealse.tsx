import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

interface PressReleaseItem {
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
}

const PressRelease: React.FC = () => {
  const navigate = useNavigate();
  const [otherReleases, setOtherReleases] = useState<PressReleaseItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [mainArticle, setMainArticle] = useState<PressReleaseItem | null>(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchReleases = async () => {
      try {
      const response = await fetch(`${API_BASE_URL}/fetch-another-rss`)
        const data = await response.json();
        if (data.success) {
          const formattedReleases = data.data.map((item: any) => ({
            title: item.title,
            description: item.description,
            author: item.creator.join(', '),
            date: new Date(item.pubDate).toLocaleDateString(),
            image: item.image_url
          }));
          setOtherReleases(formattedReleases);
          setMainArticle(formattedReleases[formattedReleases.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching releases:', error);
      }
    };

    fetchReleases();
  }, []);

  return (
    <Container fluid className="mt-5 mb-5" style={{ width: '92%', marginBottom: '100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{fontWeight: 'bold',letterSpacing: '0.05em'}}>Press Release</h4>
        <Button variant="link" className="text-warning text-decoration-none" onClick={() => {
          navigate('/press-news');
        }}>
          {showAll ? 'View Less' : 'View All'} <ChevronRight size={20} />
        </Button>
      </div>
      <Row>
        <Col lg={7}>
          <Card className="border-0 rounded-4" style={{ height: 'auto', minHeight: '430px' }}>
            <Card.Img 
              variant="top" 
              src={mainArticle?.image} 
              alt={mainArticle?.title} 
              className="rounded-5" 
              style={{ height: '428px', objectFit: 'cover' }}
            />
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <Card.Title className="fs-3 mb-3 text-start" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{mainArticle?.title}</Card.Title>
                {/* <small className="text-muted">{mainArticle?.date}</small> */}
              </div>
              <Card.Text className="text-start" style={{ fontSize: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                {mainArticle?.description}
              </Card.Text>
              <div className="text-start">
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>{mainArticle?.date}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          {showAll ? otherReleases.map((release, index) => (
            <Card key={index} className="mb-3 border-0 rounded-5" style={{ height: 'auto', minHeight: '150px' }}>
              <Row className="g-2">
                <Col xs={8}>
                  <Card.Body className="d-flex flex-column justify-content-between">
                    <Card.Title className="h2 text-start" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{release.title}</Card.Title>
                    <Card.Text className="small text-start description" style={{ fontSize: '0.9rem', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                      {release.description}
                    </Card.Text>
                    <div className="d-flex justify-content-between">
                      <div>
                        <small className="text-muted" style={{ fontSize: '0.4rem' }}>By </small>
                        <small className="text-warning" style={{ fontSize: '0.4rem' }}>{release.author}</small>
                      </div>
                      <small className="text-muted">{release.date}</small>
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
                  />
                </Col>
              </Row>
            </Card>
          )) : otherReleases.slice(0, 3).map((release, index) => (
            <Card key={index} className="mb-3 border-0 rounded-5" style={{ height: 'auto', minHeight: '150px' }}>
              <Row className="g-2">
                <Col xs={8}>
                  <Card.Body className="d-flex flex-column justify-content-between">
                    <Card.Title className="h2 text-start" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{release.title}</Card.Title>
                    <Card.Text className="small text-start description" style={{ fontSize: '0.9rem', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                      {release.description}
                    </Card.Text>
                    <div className="d-flex justify-content-between">
                      <div>
                        <small className="text-muted" style={{ fontSize: '0.9rem' }}>By </small>
                        <small className="text-warning" style={{ fontSize: '0.9rem' }}>{release.author}</small>
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>{release.date}</small>
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
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default PressRelease;