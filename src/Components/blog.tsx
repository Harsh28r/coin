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
  const [currentIndex, setCurrentIndex] = useState(0);
  const postsPerPage = 6; // Number of posts to display at a time
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';


  // Function to handle sliding left
  const handlePrev = () => {
    setCurrentIndex(prevIndex => Math.max(prevIndex - postsPerPage, 0));
  };

  // Function to handle sliding right
  const handleNext = () => {
    setCurrentIndex(prevIndex => Math.min(prevIndex + postsPerPage, blogPosts.length - postsPerPage));
  };
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts`);
        const result = await response.json();
        console.log(result); // ✅ Logs the full object
  
        if (result.success && Array.isArray(result.data)) {
          const formattedPosts = result.data.map((post: any) => ({
            id: post._id,
            title: post.title,
            description: post.description || '', // fallback if undefined
            author: post.author,
            date: new Date(post.date).toLocaleDateString(),
            image: post.image || '', // fallback if undefined
            imageUrl: post.imageUrl || '',
            content: post.content
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
    console.log('fetchBlogPosts');
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
        {blogPosts.slice(currentIndex, currentIndex + postsPerPage).map((post, index) => {
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
        <Button variant="outline-secondary" size="lg" className="rounded-circle" style={{ width: '50px', height: '50px' }} onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft size={24} />
        </Button>
        <Button variant="outline-secondary" size="lg" className="rounded-circle" style={{ width: '50px', height: '50px' }} onClick={handleNext} disabled={currentIndex + postsPerPage >= blogPosts.length}>
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


