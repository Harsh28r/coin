import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/inter';
import { Link } from 'react-router-dom';

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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const postsPerPage = 6;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Handle sliding left
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - postsPerPage, 0));
  };

  // Handle sliding right
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + postsPerPage, blogPosts.length - postsPerPage)
    );
  };

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
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
      }
    };

    fetchBlogPosts();
  }, [API_BASE_URL]);

  return (
    <Container fluid className="mt-5 mb-5" style={{ width: '92%', fontFamily: 'Inter, sans-serif' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 text-center" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
          Blogs
        </h4>
        {/* Fix: Use Link directly instead of Button with as={Link} */}
        <Link to="/blogs" className="text-warning text-decoration-none d-flex align-items-center">
          View All <ChevronRight size={20} className="ms-1" />
        </Link>
      </div>
      <Row xs={1} md={2} lg={3} className="g-4">
        {blogPosts.slice(currentIndex, currentIndex + postsPerPage).map((post) => (
          <Col key={post.id}>
            <Link to={`/blog/${post.id}`} className="text-decoration-none">
              <Card className="h-100 border-0 shadow hover-effect rounded-5">
                <Card.Img
                  variant="top"
                  src={post.imageUrl}
                  alt={post.title}
                  className="object-fit-cover rounded-4"
                  style={{ height: '253px' }}
                />
                <Card.Body className="d-flex flex-column text-center">
                  <Card.Title className="h5 mb-3 text-start" style={{ fontWeight: 'bold' }}>
                    {post.title}
                  </Card.Title>
                  <Card.Text
                    className="text-muted small flex-grow-1 text-start overflow-hidden"
                    style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      textOverflow: 'ellipsis',
                      fontSize: '0.8rem',
                    }}
                  >
                    {post.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <div>
                      <small className="text-muted">By </small>
                      <small className="text-warning">{post.author}</small>
                    </div>
                    <small className="text-muted">{post.date}</small>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
      <div className="d-flex justify-content-center mt-4 gap-2" style={{ marginLeft: '-10px' }}>
        <Button
          variant="outline-secondary"
          size="lg"
          className="rounded-circle"
          style={{ width: '50px', height: '50px' }}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} />
        </Button>
        <Button
          variant="outline-secondary"
          size="lg"
          className="rounded-circle"
          style={{ width: '50px', height: '50px' }}
          onClick={handleNext}
          disabled={currentIndex + postsPerPage >= blogPosts.length}
        >
          <ChevronRight size={24} />
        </Button>
      </div>

      {/* Fix: Move styles to a separate CSS file or inline styles */}
      <style>{`
        .hover-effect {
          transition: transform 0.2s ease-in-out;
        }
        .hover-effect:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </Container>
  );
};

export default BlogSection;