import React, { useRef, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TrendingNewsItem {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
}

const FeaturedCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [trendingNews, setTrendingNews] = useState<TrendingNewsItem[]>([]);

  const handlePrev = () => {
    setActiveIndex((current) => 
      current === 0 ? carouselNews.length - 1 : current - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((current) => 
      current === carouselNews.length - 1 ? 0 : current + 1
    );
  };

  const carouselNews: TrendingNewsItem[] = [
    {
      title: "How To Avoid Going Bust In Crypto In 2024",
      excerpt: "In the midst of a booming market, safeguarding...",
      author: "Tracy D'souza",
      date: "April 27, 2024",
      image: "/image.png?height=80&width=120" // Check this path
    },
    {
      title: "Pro-XRP Lawyer Takes A Dig At Bitcoin, Calls It Overhyped",
      excerpt: "Pro-XRP lawyer Bill Morgan's recent critique ...",
      author: "Tracy D'souza",
      date: "April 27, 2024",
      image: "/market.png?height=80&width=120" // Check this path
    },
    {
      title: "Pro-XRP Lawyer Takes A Dig At Bitcoin, Calls It Overhyped",
      excerpt: "Pro-XRP lawyer Bill Morgan's recent critique...",
      author: "Tracy D'souza",
      date: "April 27, 2024",
      image: "/market.png?height=80&width=120" // Check this path
    },
  ];

  useEffect(() => {
    const fetchTrendingNews = async () => {
      try {
        const response = await fetch('http://localhost:3000/all-news');
        const data = await response.json();
        if (data.success) {
          const formattedNews = data.data
            .map((item: any) => ({
              title: item.title,
              excerpt: item.description,
              author: item.source_name,
              date: new Date(item.pubDate).toLocaleDateString(),
              image: item.image_url,
            }))
            .filter((item: TrendingNewsItem) => item.image && item.image.trim() !== "");

          // Ensure unique news items based on title
          const uniqueNews = Array.from(new Set(formattedNews.map((news: TrendingNewsItem) => news.title)))
            .map(title => formattedNews.find((news: TrendingNewsItem) => news.title === title))
            .filter((news: TrendingNewsItem | undefined): news is TrendingNewsItem => news !== undefined); // Filter out undefined values

          setTrendingNews(uniqueNews);
        }
      } catch (error) {
        console.error('Error fetching trending news:', error);
      }
    };

    fetchTrendingNews();
  }, []);

  // Create a ref for the scrollable container
  const scrollableRef = useRef<HTMLDivElement>(null);

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

  return (
    <Row className="mt-3 mx-auto" style={{ width: '95%' }}>
      <Col lg={7} className="mb-3 mb-lg-0">
        <Carousel 
          className="bg-dark text-white rounded-5" 
          style={{ height: '450px', width: '95%', margin: '0 auto' }}
          indicators={false}
          controls={false}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        >
          {carouselNews.map((news, index) => (
            <Carousel.Item key={index} className="custom-carousel-item rounded-4" style={{ height: '450px' }}>
              <Card.Img src={news.image} alt={news.title} className="rounded-4" style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
              {/* Check if the image is loading correctly */}
              <Card.ImgOverlay className="d-flex flex-column justify-content-between rounded-5" style={{ padding: '1rem' }}>
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div>
                    <span className="badge news-badge ms-4">Exclusive News</span>
                    <span className="ms-4 text-white">By {news.author}</span>
                  </div>
                  <span className="text-white ms-auto me-4">{news.date}</span>
                </div>
                <div 
                  className="d-flex align-items-start flex-column" 
                  style={{ paddingLeft: '0', width: '100%' }}
                >
                  <div 
                    className="fs-2 fw-bold mb-2 card-title h5 text-truncate" 
                    style={{ 
                      textAlign: 'left',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '1.5rem',
                      lineHeight: '1.2',
                      letterSpacing: '0.04em',
                      maxWidth: '100%',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {news.title}
                  </div>
                  <small className="text fs-4" style={{ fontSize: '1rem', fontWeight: 500 }}>
                    {news.excerpt}
                  </small>
                </div>
              </Card.ImgOverlay>
              <div className="carousel-controls" style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', alignItems: 'center' }}>
                <Button 
                  variant="outline-light" 
                  className="rounded-circle me-4"
                  onClick={handlePrev}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', padding: '0' }}
                > 
                  <ChevronLeft style={{ marginLeft: '5px' }} />
                </Button> 
                <Button 
                  variant="outline-light" 
                  className="rounded-circle"
                  onClick={handleNext}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', padding: '0' }}
                >
                  <ChevronRight style={{ marginLeft: '5px' }} />
                </Button>
              </div>
            </Carousel.Item>
          ))}
          <style>
            {`
              @media (max-width: 768px) {
                .custom-carousel-item {
                  width: 100% !important; // Set carousel item width to 100% for mobile
                }
                .carousel {
                  width: 100% !important; // Ensure carousel takes full width on mobile
                }
                .mb-3 {
                  margin-bottom: 0 !important; // Set margin-bottom to 0 for mobile
                }
                .fs-2 { // Adjust font size for mobile
                  font-size: 1.5rem !important; // Change to a smaller size
                }
                .fs-4 { // Adjust font size for mobile
                  font-size: 1rem !important; // Change to a smaller size
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
            `}
          </style>
        </Carousel>
      </Col>
      <Col lg={5} className="d-flex justify-content-center mt-3 mt-lg-0">
        <Card className="border-top-0 border-bottom-0" style={{ width: '200%', borderColor: 'transparent', borderLeft: '2px solid lightgrey', marginTop: '5px' }}>
          <Card.Body className="trending-news-body" style={{ width: '100%' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h6 className="m-0 trending-news-title" style={{ textAlign: 'left', fontSize: '24px' }}>Trending News</h6>
              <Button 
                variant="link" 
                className="text-decoration-none p-0" 
                style={{ color: 'orange', fontSize: '0.9rem', padding: '0.2rem 0.5rem' }}
              >
                View All <ChevronRight />
              </Button>
            </div>
            <div
              ref={scrollableRef}
              onMouseDown={handleMouseDown}
              style={{ 
                maxHeight: '450px', 
                overflow: 'hidden', 
                width: '100%', 
                margin: '0 auto', 
                cursor: 'grab' 
              }}
            >
              <div className="scrollable-container" style={{ 
                height: '360px', 
                width: '100%', 
                cursor: 'pointer' 
              }}>
                <div className="trending-news-container">
                  {trendingNews.length > 0 ? (
                    trendingNews.map((news, index) => (
                      <Row key={index} className="mb-4">
                        <Col xs={8}>
                          <h6 className="mb-2" style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.4', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left' }}>{news.title}</h6>
                          <p className="small text-muted mb-2" style={{ fontSize: '12px', lineHeight: '1.5', whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                            {news.excerpt}
                          </p>
                          <small className="text-muted d-flex justify-content-between" style={{ fontSize: '16px', whiteSpace: 'normal', wordWrap: 'break-word', display: 'block' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted" style={{ fontSize: '12px'}}>By </small>
                                <small className="text-warning" style={{ marginLeft: '1px' ,fontSize: '12px'}}>
                                  <strong>{news.author}</strong>
                                </small>
                              </div>
                            </div>
                            <div className="ms-auto text-end">
                              <small className="text-muted" style={{ fontSize: '12px'}}>{news.date}</small>
                            </div>
                          </small>
                        </Col>
                        <Col xs={4}>
                          <img src={news.image} alt={news.title} className="img-fluid rounded" style={{ height: '103px', objectFit: 'cover' }} />
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
    </Row>
  );
};

export default FeaturedCarousel;















