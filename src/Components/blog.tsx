import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/inter';
import { Link } from 'react-router-dom';

interface BlogPost {
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
  imageUrl: string;
  content: string;
  id: string;
}

const BlogSection: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/posts');
        const result = await response.json();
        console.log(result);
        if (Array.isArray(result)) {
          const formattedPosts = result.map(post => ({
            ...post,
            date: new Date(post.date).toLocaleDateString()
          }));
          setBlogPosts(formattedPosts);
        } else {
          console.error('Fetched data is not in the expected format:', result);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      }
    };

    fetchBlogPosts();
  }, []);

  return (
    <Container fluid className="mt-5 mb-5" style={{ width: '92%', fontFamily: 'Inter, sans-serif' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 text-center" style={{fontWeight: 'bold',letterSpacing: '0.05em'}}>Blogs</h4>
        <Button variant="link" className="text-warning text-decoration-none">
           View All<ChevronRight size={20} className="me-1" />
        </Button>
      </div>
      <Row xs={1} md={2} lg={3} className="g-4">
        {blogPosts.map((post, index) => {
          console.log(post.id);
          return (
            <Col key={index}>
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
                    <Card.Text className="text-muted small flex-grow- text-start overflow-hidden" style={{ 
                      overflow: 'hidden', 
                      display: '-webkit-box', 
                      WebkitBoxOrient: 'vertical', 
                      WebkitLineClamp: 2, 
                      textOverflow: 'ellipsis', 
                      fontSize: '0.8rem' 
                    }}>
                      {post.content}
                    </Card.Text>
                    <div className="d-flex justify-content-between">
                          <div>
                            <small className="text-muted">By </small>
                            <small className="text-warning"> {post.author}</small>
                          </div>
                          <small className="text-muted">{post.date}</small>
                        </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          );
        })}
      </Row>
      <div className="d-flex justify-content-center mt-4 gap-2" style={{ marginLeft: '-10px' }}>
        <Button variant="outline-secondary" size="lg" className="rounded-circle" style={{ width: '50px', height: '50px' }}>
          <ChevronLeft size={24} />
        </Button>
        <Button variant="outline-secondary" size="lg" className="rounded-circle" style={{ width: '50px', height: '50px' }}>
          <ChevronRight size={24} />
        </Button>
      </div>

      <style>
        {`
          .hover-effect {
            transition: transform 0.2s ease-in-out;
          }
          .hover-effect:hover {
            transform: translateY(-5px);
          }
        `}
      </style>
    </Container>
  );
};

export default BlogSection;


