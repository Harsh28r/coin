import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/inter';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNewsTranslation } from '../hooks/useNewsTranslation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
  imageUrl: string;
  content: string;
}

const BlogSection: React.FC = () => {
  const { t } = useLanguage();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const postsPerPage = 6;
  const [loading, setLoading] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  
  // Use the translation hook
  const { displayItems: displayPosts, isTranslating, currentLanguage } = useNewsTranslation(blogPosts);
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Handle sliding left
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - postsPerPage, 0));
  };

  // Handle sliding right
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + postsPerPage, displayPosts.length - postsPerPage)
    );
  };

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/posts`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Raw API response:', result);

        let posts: any[] = [];
        if (result.success && Array.isArray(result.data)) {
          posts = result.data;
        } else if (Array.isArray(result)) {
          posts = result;
        } else {
          console.error('Unexpected API response format:', result);
          return;
        }

        const formattedPosts = posts.map((post: any) => ({
          id: post._id || post.id || `post-${Math.random()}`,
          title: post.title || 'Untitled',
          description: post.description || post.content || 'No description available',
          author: post.author || 'Unknown',
          date: post.date
            ? new Date(post.date).toLocaleDateString()
            : 'Unknown date',
          image: post.image || post.imageUrl || 'https://placehold.co/300x200?text=Blog',
          imageUrl: post.imageUrl || post.image || 'https://placehold.co/300x200?text=Blog',
          content: post.content || 'No content available',
        }));
        setBlogPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [API_BASE_URL]);

  return (
    <Container fluid className="mt-5 mb-5" style={{ width: '92%', fontFamily: 'Inter, sans-serif' }}>
      {/* Enhanced Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 
            className="m-0 mb-2" 
            style={{ 
              fontWeight: '800', 
              letterSpacing: '0.02em',
              fontSize: '2.2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Latest Blog Posts
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '1.1rem', fontWeight: '400' }}>
            Discover insights, tutorials, and updates from our crypto experts
          </p>
          {isTranslating && (
            <small className="text-muted d-block mt-1">
              🔄 Translating blog posts to {currentLanguage === 'hi' ? 'Hindi' : 
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
        <button 
          type="button"
          className="text-decoration-none d-flex align-items-center px-4 py-3 rounded-4"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
          }}
          onClick={() => {
            setShowAll((prev) => !prev);
            setCurrentIndex(0);
          }}
        >
          {showAll ? 'View Less' : 'View All Posts'} <ChevronRight size={20} className="ms-2" />
        </button>
      </div>

      {/* Enhanced Blog Cards Grid */}
      {loading ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {Array.from({ length: postsPerPage }).map((_, i) => (
            <Col key={`sk-${i}`}>
              <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                <Skeleton height={220} />
                <Card.Body className="p-4">
                  <Skeleton width="80%" height={24} className="mb-3" />
                  <Skeleton count={3} height={14} className="mb-2" />
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <Skeleton circle width={24} height={24} className="me-2" />
                        <div>
                          <Skeleton width={60} height={12} />
                          <Skeleton width={80} height={12} />
                        </div>
                      </div>
                      <div className="text-end">
                        <Skeleton width={70} height={12} />
                        <Skeleton width={60} height={12} />
                      </div>
                    </div>
                    <Skeleton height={36} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
        {(showAll ? displayPosts : displayPosts.slice(currentIndex, currentIndex + postsPerPage)).map((post) => (
          <Col key={post.id}>
            <Link to={`/blog/${post.id}`} className="text-decoration-none">
              <Card 
                className="h-100 border-0 shadow-sm hover-effect rounded-4 overflow-hidden"
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Enhanced Image Section */}
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={post.imageUrl}
                    alt={post.title}
                    className="object-fit-cover"
                    style={{ 
                      height: '220px',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x220?text=Blog+Post';
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div 
                    className="position-absolute w-100 h-100"
                    style={{
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%)',
                      top: 0,
                      left: 0
                    }}
                  />
                  {/* Category Badge */}
                  <div 
                    className="position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280'
                    }}
                  >
                    Blog
                  </div>
                </div>

                {/* Enhanced Card Body */}
                <Card.Body className="d-flex flex-column p-4">
                  <Card.Title 
                    className="h5 mb-3 text-start" 
                    style={{ 
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      lineHeight: '1.4',
                      color: '#1f2937',
                      minHeight: '3rem'
                    }}
                  >
                    {post.title}
                  </Card.Title>
                  
                  <Card.Text
                    className="text-muted flex-grow-1 text-start mb-4"
                    style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      color: '#6b7280',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      minHeight: '4.5rem'
                    }}
                  >
                    {post.description}
                  </Card.Text>

                  {/* Enhanced Footer */}
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-2"
                          style={{
                            width: '24px',
                            height: '24px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: '600' }}>
                            {post.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            By
                          </small>
                          <small 
                            className="fw-semibold" 
                            style={{ 
                              fontSize: '0.85rem',
                              color: '#f59e0b'
                            }}
                          >
                            {post.author}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                          Published
                        </small>
                        <small 
                          className="fw-semibold" 
                          style={{ 
                            fontSize: '0.85rem',
                            color: '#6b7280'
                          }}
                        >
                          {post.date}
                        </small>
                      </div>
                    </div>
                    
                    {/* Read More Button */}
                    <div 
                      className="w-100 py-2 px-3 rounded-3 text-center"
                      style={{
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        color: '#374151',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Read Full Article →
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
      )}

      {/* Enhanced Navigation */}
      {!loading && !showAll && displayPosts.length > postsPerPage && (
        <div className="d-flex justify-content-center align-items-center mt-5 gap-3">
          <Button
            variant="outline-warning"
            size="lg"
            className="rounded-circle border-2"
            style={{ 
              width: '56px', 
              height: '56px',
              borderWidth: '2px',
              transition: 'all 0.2s ease'
            }}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} />
          </Button>
          
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted fw-semibold" style={{ fontSize: '1rem' }}>
              Page
            </span>
            <span 
              className="px-3 py-2 rounded-3 fw-bold"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontSize: '1.1rem'
              }}
            >
              {Math.floor(currentIndex / postsPerPage) + 1}
            </span>
            <span className="text-muted fw-semibold" style={{ fontSize: '1rem' }}>
              of {Math.ceil(displayPosts.length / postsPerPage)}
            </span>
          </div>
          
          <Button
            variant="outline-warning"
            size="lg"
            className="rounded-circle border-2"
            style={{ 
              width: '56px', 
              height: '56px',
              borderWidth: '2px',
              transition: 'all 0.2s ease'
            }}
            onClick={handleNext}
                          disabled={currentIndex + postsPerPage >= displayPosts.length}
          >
            <ChevronRight size={24} />
          </Button>
        </div>
      )}

      {/* Enhanced Hover Effects */}
      <style>{`
        .hover-effect:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
        }
        
        .hover-effect:hover img {
          transform: scale(1.05);
        }
        
        .hover-effect .position-relative {
          overflow: hidden;
        }
      `}</style>
    </Container>
  );
};

export default BlogSection;