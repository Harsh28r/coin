import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface NewsItem {
  title: string;
  description: string;
  creator: string[];
  pubDate: string;
  image_url: string;
  link: string;
}

// Utility function to decode HTML entities
const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const ExclusiveNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:3000/fetch-rss');
        const data = await response.json();
        console.log(data);
        if (Array.isArray(data.data)) {
          setNewsItems(data.data);
        } else {
          console.error('Fetched data is not an array:', data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, []);

  return (
    <Container fluid className="mt-5" style={{ width: '92%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{fontWeight: 'bold',letterSpacing: '0.05em'}}>Exclusive News </h4>
        <Button 
          variant="link" 
          className="text-warning text-decoration-none" 
          onClick={() => setShowAll(!showAll)}
          style={{ fontWeight: 'bold' }}
        >
          {showAll ? 'View Less' : 'View All'} 
          <ChevronRight className="ms-2" />
        </Button>
      </div>
      <Row xs={1} md={2} lg={4} className="g-4">
        {Array.isArray(newsItems) && newsItems.slice(0, showAll ? newsItems.length : 4).map((item, index) => (
          <Col key={index}>
            <Card className="h-100 border-0 shadow-sm rounded-5">
              <Card.Img variant="top rounded-4" src={item.image_url} alt={item.title} />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fs-6 mb-3 text-start custom-text" style={{ fontWeight: 'bold', color: 'black', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, maxHeight: '3em' }}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-black text-decoration-none">
                    {item.title}
                  </a>
                </Card.Title>
                <Card.Text className="text-muted small flex-grow-1 text-start custom-text fs-7" style={{ overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, maxHeight: '3em' }}>
                  {decodeHtml(item.description)}
                </Card.Text>
                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">By </small>
                    <small className="text-warning "> {item.creator[0]}</small>
                  </div>
                  <div className="ms-auto text-end">
                    <small className="text-muted">{new Date(item.pubDate).toLocaleDateString()}</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ExclusiveNews;