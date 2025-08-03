import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Advertise: React.FC = () => {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Body className="text-center">
              <Card.Title as="h2">Contact Us</Card.Title>
              <Card.Text>
                If you have any questions or feedback, let us know and we’ll get back to you as soon as possible. We take your privacy very seriously and will never spam or give out your email address.
              </Card.Text>
              <Card.Text>
                Let us know how we can help. Contact us at{' '}
                <a href="mailto:harshgupta0028@gmail.com">harshgupta0028@gmail.com</a>.
              </Card.Text>
              <hr />
              <Card.Subtitle as="h3" className="mb-2">For advertising enquiries:</Card.Subtitle>
              <Card.Text>
                Email us at: <a href="mailto:ads@coinscapture.com">harshgupta0028@gmail.com</a>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Advertise;