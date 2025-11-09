import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Heart, 
  Share2, 
  Bookmark,
  Clock,
} from 'lucide-react';
import { useBlog } from '../context/BlogContext';
import { format } from 'date-fns';

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPostById, posts } = useBlog();
  const [post, setPost] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id && posts.length > 0) {
      const foundPost = getPostById(id);
      if (foundPost) {
        setPost(foundPost);
      }
    }
  }, [id, posts, getPostById]);

  const handleGoBack = () => {
    navigate('/blog');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setActionMessage(isLiked ? 'Post unliked' : 'Post liked!');
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    setActionMessage(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks!');
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setActionMessage('Link copied to clipboard!');
        setTimeout(() => setActionMessage(null), 2000);
      }
    } catch (error) {
      setActionMessage('Failed to share post');
      setTimeout(() => setActionMessage(null), 2000);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'primary',
      'Crypto': 'warning',
      'Finance': 'success',
      'News': 'info',
      'Tutorial': 'secondary',
      'Analysis': 'dark'
    };
    return colors[category] || 'light';
  };

  if (!post) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading post...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  const formattedDate = format(new Date(post.date), 'MMMM dd, yyyy');
  const timeAgo = format(new Date(post.date), 'MMM dd');

  return (
    <>
      {/* Hero Section */}
      <div 
        className="blog-detail-hero position-relative overflow-hidden"
        style={{
          background: '#f8fafc',
          padding: '80px 0',
          marginBottom: '60px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="mb-4 rounded-3 px-3 py-2"
                onClick={handleGoBack}
                style={{ 
                  borderWidth: '1.5px',
                  color: '#64748b',
                  borderColor: '#cbd5e1'
                }}
              >
                <ArrowLeft size={16} className="me-2" />
                Back to Blog
              </Button>
              
              <div className="text-center">
                <Badge 
                  bg={getCategoryColor((post as any).category || 'General')}
                  className="px-3 py-2 mb-4 fw-semibold"
                  style={{ 
                    fontSize: '0.8rem', 
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  {(post as any).category || 'General'}
                </Badge>
                <h1 
                  className="display-5 fw-bold mb-4"
                  style={{
                    color: '#1a202c',
                    lineHeight: '1.2',
                    maxWidth: '800px',
                    margin: '0 auto'
                  }}
                >
                  {post.title}
                </h1>
                <div className="d-flex justify-content-center align-items-center gap-5 text-muted">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: '#f1f5f9',
                        border: '2px solid #e2e8f0',
                        color: '#475569',
                        fontSize: '1rem',
                        fontWeight: '600'
                      }}
                    >
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="fw-semibold text-dark">{post.author}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <Calendar size={18} className="me-2 text-muted" />
                    <span className="text-muted">{formattedDate}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <Clock size={18} className="me-2 text-muted" />
                    <span className="text-muted">{timeAgo}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Action Message */}
            {actionMessage && (
              <Alert 
                variant="info" 
                className="mb-4"
                dismissible
                onClose={() => setActionMessage(null)}
              >
                {actionMessage}
              </Alert>
            )}

            {/* Featured Image */}
            {post.imageUrl && (
              <div className="mb-5">
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="img-fluid rounded-4 shadow-lg"
                  style={{ 
                    width: '100%',
                    maxHeight: '500px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Blog+Post';
                  }}
                />
              </div>
            )}

            {/* Article Content */}
            <div 
              className="blog-content mb-5"
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                color: '#374151'
              }}
            >
              {post.content}
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center gap-4 mb-5">
              <Button 
                variant={isLiked ? 'danger' : 'outline-danger'}
                size="lg"
                className="rounded-3 px-4 py-2"
                onClick={handleLike}
                style={{ 
                  borderWidth: '1.5px',
                  fontWeight: '500'
                }}
              >
                <Heart size={18} className={`me-2 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              
              <Button 
                variant={isBookmarked ? 'warning' : 'outline-warning'}
                size="lg"
                className="rounded-3 px-4 py-2"
                onClick={handleBookmark}
                style={{ 
                  borderWidth: '1.5px',
                  fontWeight: '500'
                }}
              >
                <Bookmark size={18} className={`me-2 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              
              <Button 
                variant="outline-primary"
                size="lg"
                className="rounded-3 px-4 py-2"
                onClick={handleShare}
                style={{ 
                  borderWidth: '1.5px',
                  fontWeight: '500'
                }}
              >
                <Share2 size={18} className="me-2" />
                Share
              </Button>
            </div>

            {/* Back to Blog Button */}
            <div className="text-center">
              <Button 
                variant="outline-secondary"
                size="lg"
                className="rounded-3 px-5 py-2"
                onClick={handleGoBack}
                style={{ 
                  borderWidth: '1.5px',
                  fontWeight: '500'
                }}
              >
                <ArrowLeft size={18} className="me-2" />
                Back to All Posts
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Enhanced Styling */}
      <style>{`
        .blog-detail-hero {
          position: relative;
          overflow: hidden;
        }
        
        .blog-content {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .blog-content p {
          margin-bottom: 1.5rem;
          color: #374151;
          line-height: 1.8;
        }
        
        .blog-content h2, .blog-content h3, .blog-content h4 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #1a202c;
          font-weight: 600;
        }
        
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .blog-content blockquote {
          border-left: 4px solid #3182ce;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #64748b;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 0 8px 8px 0;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .blog-detail-hero h1 {
            font-size: 2rem !important;
          }
          
          .blog-detail-hero .d-flex {
            flex-direction: column;
            gap: 1rem !important;
          }
          
          .blog-content {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default BlogPostDetail;
