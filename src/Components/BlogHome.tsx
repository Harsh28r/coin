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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px 0',
          marginBottom: '60px',
          borderRadius: '0 0 40px 40px'
        }}
      >
        {/* Decorative Background Elements */}
        <div 
          className="position-absolute w-100 h-100"
          style={{
            top: 0,
            left: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Floating Shapes */}
        <div 
          className="position-absolute"
          style={{
            top: '20%',
            right: '10%',
            width: '60px',
            height: '60px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div 
          className="position-absolute"
          style={{
            bottom: '30%',
            left: '15%',
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        
        <Container className="position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={10} xl={8}>
              <h1 
                className="display-3 fw-bold mb-4 text-white"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  letterSpacing: '-0.02em'
                }}
              >
                Welcome to Our Blog
              </h1>
              <p 
                className="lead mb-4 text-white-50"
                style={{
                  fontSize: '1.3rem',
                  lineHeight: '1.6',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                Discover fascinating stories, expert insights, and cutting-edge knowledge from our world-class writers and industry experts.
              </p>
              
              {/* Enhanced Stats */}
              <div className="d-flex justify-content-center gap-5 mt-5">
                <div className="text-center">
                  <div 
                    className="fw-bold text-white"
                    style={{ fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                  >
                    {posts.length}+
                  </div>
                  <div className="text-white-50 small">Articles Published</div>
                </div>
                <div className="text-center">
                  <div 
                    className="fw-bold text-white"
                    style={{ fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                  >
                    50K+
                  </div>
                  <div className="text-white-50 small">Monthly Readers</div>
                </div>
                <div className="text-center">
                  <div 
                    className="fw-bold text-white"
                    style={{ fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                  >
                    24/7
                  </div>
                  <div className="text-white-50 small">Fresh Content</div>
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
              background: 'linear-gradient(135deg, #1f2937 0%, #6b7280 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Latest Articles
          </h2>
          <p 
            className="text-muted lead"
            style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}
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
                  <BlogPost post={post} variant="full" />
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
                className="text-center p-5 rounded-4"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.3)'
                }}
              >
                <h3 className="fw-bold mb-3">Stay Updated</h3>
                <p className="mb-4 opacity-90">
                  Get notified when we publish new articles and insights
                </p>
                <div className="d-flex flex-column align-items-center gap-2" style={{ maxWidth: '520px', margin: '0 auto' }}>
                  {message && (
                    <Alert 
                      variant={message.type === 'success' ? 'success' : 'danger'} 
                      className="w-100 text-start mb-2"
                    >
                      {message.text}
                    </Alert>
                  )}
                  <Form onSubmit={handleSubscribe} className="w-100">
                    <InputGroup className="mb-2">
                      <Form.Control 
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ borderRadius: '25px', padding: '12px 20px' }}
                      />
                    </InputGroup>
                    <InputGroup>
                      <Form.Control 
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ borderRadius: '25px 0 0 25px', padding: '12px 20px' }}
                      />
                      <Button 
                        type="submit"
                        variant="light"
                        disabled={isSubmitting}
                        className="px-4 py-2 fw-semibold"
                        style={{ borderRadius: '0 25px 25px 0' }}
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .blog-hero-section {
          position: relative;
          overflow: hidden;
        }
        
        .blog-hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102,126,234,0.9) 0%, rgba(118,75,162,0.9) 100%);
          z-index: 1;
        }
        
        .blog-hero-section > * {
          position: relative;
          z-index: 2;
        }
        
        /* Enhanced hover effects for stats */
        .blog-hero-section .d-flex > div {
          transition: transform 0.3s ease;
        }
        
        .blog-hero-section .d-flex > div:hover {
          transform: translateY(-5px);
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