import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Mail, Megaphone, MessageSquare } from 'lucide-react';

const Advertise: React.FC = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-4">
        <Col md={10} lg={8} className="text-center">
          <h1 className="fw-bold mb-2" style={{ letterSpacing: '0.2px' }}>Get in touch</h1>
          <p className="text-muted mb-0">We’d love to hear from you. Whether you have a question, feedback, or want to advertise, reach out any time.</p>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <Row className="g-4">
                <Col md={12}>
                  <div className="d-flex align-items-start gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: '#f1f5f9' }}>
                      <MessageSquare size={20} color="#0d6efd" />
                    </div>
                    <div>
                      <h5 className="mb-1">General inquiries</h5>
                      <p className="text-muted mb-2" style={{ maxWidth: 680 }}>Questions, product feedback, or support — we’ll get back to you as soon as possible.</p>
                      <a href="mailto:harshgupta0028@gmail.com" className="text-decoration-none">
                        <Mail size={16} className="me-2" />
                        <strong>harshgupta0028@gmail.com</strong>
                      </a>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <hr className="my-2" />
                </Col>

                <Col md={12}>
                  <div className="d-flex align-items-start gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: '#f1f5f9' }}>
                      <Megaphone size={20} color="#0d6efd" />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h5 className="mb-1">Advertising</h5>
                        <Badge bg="light" text="dark">Sponsorships</Badge>
                        <Badge bg="light" text="dark">Display</Badge>
                      </div>
                      <p className="text-muted mb-2" style={{ maxWidth: 680 }}>Partner with us to reach a high-intent crypto audience across news, pages, and widgets.</p>
                      <a href="mailto:harshgupta0028@gmail.com?subject=Advertising%20Enquiry" className="text-decoration-none">
                        <Mail size={16} className="me-2" />
                        <strong>harshgupta0028@gmail.com</strong>
                      </a>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #4f46e5 100%)' }}>
            <Card.Body className="text-center text-white p-4">
              <h4 className="fw-semibold mb-2">Ready to collaborate?</h4>
              <p className="mb-3" style={{ opacity: 0.9 }}>Tell us about your goals — we’ll tailor options for your campaign.</p>
              <Button
                variant="light"
                href="mailto:harshgupta0028@gmail.com?subject=Let’s%20Work%20Together"
                className="px-4"
              >
                Email us
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Advertise;