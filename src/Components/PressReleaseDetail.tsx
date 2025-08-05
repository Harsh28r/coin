import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface PressReleaseItem {
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
}

const PressReleaseDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const release = location.state?.release as PressReleaseItem | undefined;

  if (!release) {
    return (
      <Container className="mt-5">
        <h4>No press release selected</h4>
        <Button
          variant="link"
          className="text-warning text-decoration-none"
          onClick={() => navigate('/press-news')}
        >
          <ArrowLeft size={20} /> Back to Press Releases
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-5 mb-5" style={{ width: '92%' }}>
      <Button
        variant="link"
        className="text-warning text-decoration-none mb-4"
        onClick={() => navigate('/press-news')}
      >
        <ArrowLeft size={20} /> Back to Press Releases
      </Button>
      <Card className="border-0 rounded-4">
        <Card.Img
          variant="top"
          src={release.image}
          alt={release.title}
          className="rounded-5"
          style={{ maxHeight: '500px', objectFit: 'cover' }}
        />
        <Card.Body>
          <Card.Title className="fs-2 mb-3 text-start" style={{ fontWeight: 'bold' }}>
            {release.title}
          </Card.Title>
          <div className="d-flex justify-content-between mb-3">
            <div>
              <small className="text-muted">By </small>
              <small className="text-warning">{release.author}</small>
            </div>
            <small className="text-muted">{release.date}</small>
          </div>
          <Card.Text className="text-start">{release.description}</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PressReleaseDetail;