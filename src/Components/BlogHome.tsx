import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import BlogPost from '../Components/BlogPost';
import { useBlog } from '../context/BlogContext';

const HomePage: React.FC = () => {
  const { posts } = useBlog();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Subscribed successfully!' });
        setEmail('');
        setName('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Subscription failed. Please try again.' });
      }
    } catch (_) {
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Enhanced Hero Section */}
      <div 
        className="blog-hero-section position-relative overflow-hidden"
        style={{
          background: '#f8fafc',
          padding: '100px 0',
          marginBottom: '80px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Container className="position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={10} xl={8}>
              <h1 
                className="display-4 fw-bold mb-4"
                style={{
                  color: '#1a202c',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}
              >
                Welcome to Our Blog
              </h1>
              <p 
                className="lead mb-5"
                style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.7',
                  color: '#4a5568',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}
              >
                Discover fascinating stories, expert insights, and cutting-edge knowledge from our world-class writers and industry experts.
              </p>
              
              {/* Enhanced Stats */}
              <div className="d-flex justify-content-center gap-5 mt-5">
                <div className="text-center">
                  <div 
                    className="fw-bold"
                    style={{ 
                      fontSize: '2.5rem', 
                      color: '#3182ce',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {posts.length}+
                  </div>
                  <div className="text-muted small fw-medium">Articles Published</div>
                </div>
                <div className="text-center">
                  <div 
                    className="fw-bold"
                    style={{ 
                      fontSize: '2.5rem', 
                      color: '#3182ce',
                      marginBottom: '0.5rem'
                    }}
                  >
                    50K+
                  </div>
                  <div className="text-muted small fw-medium">Monthly Readers</div>
                </div>
                <div className="text-center">
                  <div 
                    className="fw-bold"
                    style={{ 
                      fontSize: '2.5rem', 
                      color: '#3182ce',
                      marginBottom: '0.5rem'
                    }}
                  >
                    24/7
                  </div>
                  <div className="text-muted small fw-medium">Fresh Content</div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Enhanced Content Section */}
      <Container className="position-relative">
        {/* Section Header */}
        <div className="text-center mb-5">
          <h2 
            className="fw-bold mb-3"
            style={{
              fontSize: '2.2rem',
              color: '#1a202c',
              lineHeight: '1.3'
            }}
          >
            Latest Articles
          </h2>
          <p 
            className="text-muted lead"
            style={{ 
              fontSize: '1.1rem', 
              maxWidth: '600px', 
              margin: '0 auto',
              color: '#64748b',
              lineHeight: '1.6'
            }}
          >
            Stay updated with our most recent insights and discoveries
          </p>
        </div>

        {/* Enhanced Blog Posts Grid */}
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            {posts.length > 0 ? (
              posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="mb-5"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <BlogPost post={post} variant="default" />
                </div>
              ))
            ) : (
              /* Enhanced Empty State */
              <div 
                className="text-center py-5"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '20px',
                  border: '2px dashed #cbd5e1'
                }}
              >
                <div 
                  className="mx-auto mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ color: 'white', fontSize: '2rem' }}>📝</span>
                </div>
                <h3 className="fw-bold text-muted mb-2">No Posts Yet</h3>
                <p className="text-muted mb-0">We're working on some amazing content. Check back soon!</p>
              </div>
            )}
          </Col>
        </Row>

        {/* Enhanced Newsletter Section */}
        {posts.length > 0 && (
          <Row className="justify-content-center mt-5">
            <Col lg={8}>
              <div 
                className="text-center p-5 rounded-4 border"
                style={{
                  background: '#ffffff',
                  borderColor: '#e2e8f0 !important',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}
              >
                <h3 className="fw-bold mb-3" style={{ color: '#1a202c' }}>Stay Updated</h3>
                <p className="mb-4" style={{ color: '#64748b', fontSize: '1.1rem' }}>
                  Get notified when we publish new articles and insights
                </p>
                <div className="d-flex flex-column align-items-center gap-3" style={{ maxWidth: '520px', margin: '0 auto' }}>
                  {message && (
                    <Alert 
                      variant={message.type === 'success' ? 'success' : 'danger'} 
                      className="w-100 text-start mb-2"
                    >
                      {message.text}
                    </Alert>
                  )}
                  <Form onSubmit={handleSubscribe} className="w-100">
                    <InputGroup className="mb-3">
                      <Form.Control 
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ 
                          borderRadius: '8px', 
                          padding: '12px 20px',
                          border: '1.5px solid #e2e8f0'
                        }}
                      />
                    </InputGroup>
                    <InputGroup>
                      <Form.Control 
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ 
                          borderRadius: '8px 0 0 8px', 
                          padding: '12px 20px',
                          border: '1.5px solid #e2e8f0'
                        }}
                      />
                      <Button 
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        className="px-4 py-2 fw-semibold"
                        style={{ 
                          borderRadius: '0 8px 8px 0',
                          background: '#3182ce',
                          border: 'none'
                        }}
                      >
                        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                      </Button>
                    </InputGroup>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Container>

      {/* Enhanced Styling */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .blog-hero-section {
          position: relative;
          overflow: hidden;
        }
        
        /* Enhanced hover effects for stats */
        .blog-hero-section .d-flex > div {
          transition: all 0.3s ease;
          padding: '1rem';
          border-radius: '8px';
        }
        
        .blog-hero-section .d-flex > div:hover {
          transform: translateY(-3px);
          background: '#ffffff';
          box-shadow: '0 8px 25px rgba(0, 0, 0, 0.1)';
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .blog-hero-section {
            padding: 60px 0;
            margin-bottom: 40px;
          }
          
          .blog-hero-section h1 {
            font-size: 2.5rem !important;
          }
          
          .blog-hero-section .d-flex {
            flex-direction: column;
            gap: 2rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default HomePage;