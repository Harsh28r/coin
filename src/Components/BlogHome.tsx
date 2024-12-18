import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import BlogPost from '../Components/BlogPost';
import { useBlog } from '../context/BlogContext';

const HomePage: React.FC = () => {
  const { posts } = useBlog();

  return (
    <>
      <div className="blog-header">
        <Container>
          <h1 className="display-4 fw-bold mb-3">Welcome to Our Blog</h1>
          <p className="lead mb-0">Discover interesting stories and insights from our writers.</p>
        </Container>
      </div>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {posts.map(post => (
              <div key={post.id} className="mb-4">
                <BlogPost post={post} />
              </div>
            ))}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HomePage;