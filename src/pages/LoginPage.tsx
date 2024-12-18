import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import LoginForm from '../Components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <LoginForm />
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;