import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, Nav, Button, Carousel } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuizSection from './QuizSection'; // Adjust the path as necessary

interface TrendingNewsItem {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
}

interface ExploreCard {
  id: number;
  image: string;
  text: string;
}

const ExploreSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('did-you-know');
  const scrollableRef = useRef<HTMLDivElement>(null);

  const exploreCards: ExploreCard[] = [
    { id: 1, image: '/image.png?height=300&width=200&text=Switzerland', text: 'In January of 2016, Chiasso, Switzerland started accepting taxes in Bitcoin' },
    { id: 2, image: '/tr3.png?height=300&width=200&text=Bitcoin', text: '90% of all bitcoin addresses have less than 0.1 BTC' },
    { id: 3, image: '/trd1.png?height=300&width=200&text=Cryptocurrencies', text: 'There are 1828 cryptocurrencies in the market so far this 2018' },
    { id: 4, image: '/web3.png?height=300&width=200&text=Bitcoin Pizza', text: 'Bitcoin Pizza Day: On May 22, 2010 two pizzas cost 10,000 BTC' },
    { id: 5, image: '/web3_1.png?height=300&width=200&text=Bitcoin Pizza', text: 'Bitcoin Pizza Day: On May 22, 2010 two pizzas cost 10,000 BTC' },
    { id: 6, image: '/web3_2.png?height=300&width=200&text=Bitcoin Circulation', text: 'About 1000 people own 40% of total BTC in circulation' },
    { id: 7, image: '/trd2.png?height=300&width=200&text=Blockchain', text: 'The blockchain technology could redefine cyber-security' },
    { id: 8, image: '/web3_3.png?height=300&width=200&text=Banks', text: '69% banks are currently experimenting with blockchain technology' },
  ];

  const trendingNews: TrendingNewsItem[] = [
    {
      title: "New Developments in AI Technology",
      excerpt: "AI technology is evolving rapidly, with new breakthroughs every day...",
      author: "John Doe",
      date: "April 28, 2024",
      image: "/image.png"
    },
    {
      title: "Global Markets React to Economic Changes",
      excerpt: "The global markets are experiencing fluctuations due to recent economic changes...",
      author: "Jane Smith",
      date: "April 28, 2024",
      image: "/web3_1.png"
    },
    {
      title: "Exploring the Future of Renewable Energy",
      excerpt: "Renewable energy sources are becoming more viable and essential for sustainability...",
      author: "Alice Johnson",
      date: "April 28, 2024",
      image: "/web3_2.png"
    },
    {
        title: "Exploring the Future of Renewable Energy",
        excerpt: "Renewable energy sources are becoming more viable and essential for sustainability...",
        author: "Alice Johnson",
        date: "April 28, 2024",
        image: "/web3.png"
      },
      {
        title: "Global Markets React to Economic Changes",
        excerpt: "The global markets are experiencing fluctuations due to recent economic changes...",
        author: "Jane Smith",
        date: "April 28, 2024",
        image: "/image.png"
      },
      {
        title: "Exploring the Future of Renewable Energy",
        excerpt: "Renewable energy sources are becoming more viable and essential for sustainability...",
        author: "Alice Johnson",
        date: "April 28, 2024",
        image: "/image.png"
      },
      
  ];

 

  // Function to handle mouse down event
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
  const renderTrendingNews = () => {
    return (
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {trendingNews.map((newsItem, index) => (
          <Col key={index}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              
              <Card.Img variant="top" src={newsItem.image} alt={newsItem.title} className="rounded-5" />
              <Card.Body>
                <Card.Title>{newsItem.title}</Card.Title>
                <Card.Text>{newsItem.excerpt}</Card.Text>
                <Card.Text className="text-muted">{newsItem.author} - {newsItem.date}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'did-you-know':
        return (
          <div className="position-relative">
            <div className="d-flex justify-content-end mb-2">
              <Button variant="link" className="text-warning text-decoration-none">View More
                <ChevronRight />
              </Button>
            </div>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
              {exploreCards.map((card) => (
                <Col key={card.id}>
                  <Card className="h-10 border-0 shadow-sm rounded-4" style={{ height: '250px' }}>
                    
                    <Card.Img variant="top" src={card.image} alt={`Explore card ${card.id}`} className="rounded-4" style={{ height: '300px' }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      case 'learn-a-little':
        return (
          <Row className="mt-3 mx-auto" style={{ width: '97%' }}>
            <Col lg={7}>
              <Carousel className="bg-dark text-white rounded-5" style={{ height: '600px', marginBottom: '20px' }} indicators={false} controls={false}>
                {exploreCards.map((card) => (
                  <Carousel.Item key={card.id} className="custom-carousel-item" style={{ height: '600px' }}>
                    <Card.Img src={card.image} alt={`Explore card ${card.id}`} className="rounded-4" style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
                    <Card.ImgOverlay className="d-flex flex-column justify-content-end" style={{ padding: '1rem' }}>
                      {/* <h5 className="text-white">{card.text}</h5> */}
                    </Card.ImgOverlay>
                  </Carousel.Item>
                ))}
              </Carousel>
            </Col>
            <Col lg={5} className="d-flex justify-content-center">
        <Card className="border-top-0 border-bottom-0" style={{ width: '200%', borderColor: 'transparent', borderLeft: '2px solid lightgrey', marginTop: '20px' }}>
          <Card.Body className="trending-news-body" style={{ width: '100%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 trending-news-title" style={{ textAlign: 'left' }}>Trending News</h5>
              <Button variant="link" className="text-decoration-none p-0" style={{ color: 'orange' }}>
                View All <ChevronRight />
              </Button>
            </div>
            <div
              ref={scrollableRef}
              onMouseDown={handleMouseDown}
              style={{ 
                maxHeight: '500px', 
                overflow: 'hidden', 
                width: '100%', 
                margin: '0 auto', 
                cursor: 'grab' 
              }}
            >
              <div className="scrollable-container" style={{ 
                height: '700px', 
                width: '100%', 
                cursor: 'pointer' 
              }}>
                <div className="trending-news-container">
                  {trendingNews.map((news, index) => (
                    <Row key={index} className="mb-4">
                      <Col xs={8}>
                        <h6 className="mb-2" style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold',
                          lineHeight: '1.4',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          textAlign: 'left'
                        }}>{news.title}</h6>
                        <p className="small text-muted mb-2" style={{ 
                          fontSize: '18px',
                          lineHeight: '1.5',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          textAlign: 'left'
                        }}>{news.excerpt}</p>
                        <small className="text-muted d-flex justify-content-between" style={{ 
                          fontSize: '16px',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          display: 'block'
                        }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="text-muted" style={{ fontSize: '18px' }}>
                                By 
                              </small>
                              <small className="text-warning" style={{ fontSize: '18px', marginLeft: '4px' }}>
                                {news.author}
                              </small>
                            </div>
                            
                          </div>
                          <div className="ms-auto text-end">
                              <small className="text-muted">{news.date}</small>
                            </div>
                        </small>
                      </Col>
                      <Col xs={4}>
                        <img 
                          src={news.image} 
                          alt={news.title} 
                          className="img-fluid rounded" 
                          style={{ height: '120px', objectFit: 'cover' }} 
                        />
                      </Col>
                    </Row>
                  ))}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
          </Row>
        );
      case 'test-your-knowledge':
        return (
          <Card className="rounded-5" style={{ width: '100%', height: '620px', border: 0 }}>
            <QuizSection />
          </Card>
        );
      case 'trending-news':
        return renderTrendingNews();
      default:
        return null;
    }
  };

  return (
    <Container fluid className="mt-5 rounded-5" style={{ width: '92%' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 font-inter" style={{fontWeight: 'bold',letterSpacing: '0.05em'}}>Explore</h4>
      </div>
      <Card className="shadow rounded-5 font-inter">
        
        <Card.Body>
          
          <Nav variant="tabs" className="mb-3 justify-content-center" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} style={{ borderBottom: 'none' }}>
            <Nav.Item>
              <Nav.Link 
                eventKey="did-you-know" 
                className={activeTab === 'did-you-know' ? 'active' : ''} 
                style={{ 
                  border: 'none', // Remove any border
                  backgroundColor: 'transparent', // Remove background color
                  borderBottom: activeTab === 'did-you-know' ? '3px solid orange' : 'none', // Line below active tab
                  color: activeTab === 'did-you-know' ? 'orange' : 'black', // Text color
                  fontWeight: 'bold', // Bold text
                  fontSize: '1.1rem', // Increase font size
                }}
              >
                Did You Know?
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="learn-a-little" 
                className={activeTab === 'learn-a-little' ? 'active' : ''} 
                style={{ 
                  border: 'none', // Remove any border
                  backgroundColor: 'transparent', // Remove background color
                  borderBottom: activeTab === 'learn-a-little' ? '3px solid orange' : 'none', // Line below active tab
                  color: activeTab === 'learn-a-little' ? 'orange' : 'black', // Text color
                  fontWeight: 'bold', // Bold text
                  fontSize: '1.1rem', // Increase font size
                }}
              >
                Learn a little
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="test-your-knowledge" 
                className={activeTab === 'test-your-knowledge' ? 'active' : ''} 
                style={{ 
                  border: 'none', // Remove any border
                  backgroundColor: 'transparent', // Remove background color
                  borderBottom: activeTab === 'test-your-knowledge' ? '3px solid orange' : 'none', // Line below active tab
                  color: activeTab === 'test-your-knowledge' ? 'orange' : 'black', // Text color
                  fontWeight: 'bold', // Bold text
                  fontSize: '1.1rem', // Increase font size
                }}
              >
                Test your knowledge
              </Nav.Link>
            </Nav.Item>
            {/* <Nav.Item>
              <Nav.Link 
                eventKey="trending-news" 
                className={`text-warning ${activeTab === 'trending-news' ? 'active' : ''}`} 
                style={{ fontSize: '1.2rem' }}
              >
                Trending News
              </Nav.Link>
            </Nav.Item> */}
          </Nav>
          {renderContent()}
          {activeTab !== 'learn-a-little' && activeTab !== 'test-your-knowledge' && (
            <div className="d-flex justify-content-center mt-4 gap-2">
              <Button variant="outline-secondary" size="lg" className="rounded-circle" style={{ width: '50px', height: '50px', marginLeft: '10px' }}>
                <ChevronLeft size={24} />
              </Button>
              <Button variant="outline-secondary" size="lg" className="rounded-circle" style={{ width: '50px', height: '50px', marginLeft: '10px' }}>
                <ChevronRight size={24} />
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ExploreSection;