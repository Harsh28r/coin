import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Mail, ArrowRight } from 'lucide-react';
import { postNewsletterSubscribe } from '../utils/newsletterSubscribe';
import './NewsletterCTA.css';

const NewsletterCTA: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const out = await postNewsletterSubscribe(email, 'newsletter_cta');
      if (out.ok) {
        setStatus('success');
        setMessage(out.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(out.message);
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="nl-cta">
      <Container style={{ maxWidth: 720 }}>
        <Row className="justify-content-center">
          <Col xs={12} className="text-center">
            <div className="nl-cta__icon" aria-hidden>
              <Mail size={28} color="#fff" />
            </div>

            <h3 className="nl-cta__title">Stay Ahead of the Market</h3>
            <p className="nl-cta__dek">
              Get the top crypto stories, market movers, and exclusive insights delivered to your
              inbox every morning — free.
            </p>

            {status === 'success' ? (
              <Alert variant="success" className="nl-cta__alert nl-cta__alert--ok mx-auto">
                {message}
              </Alert>
            ) : (
              <Form onSubmit={handleSubmit} className="mx-auto nl-cta__form">
                {status === 'error' && (
                  <Alert variant="danger" className="nl-cta__alert nl-cta__alert--err mb-3">
                    {message}
                  </Alert>
                )}
                <InputGroup>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="nl-cta__input"
                  />
                  <Button type="submit" disabled={status === 'loading'} className="nl-cta__btn">
                    {status === 'loading' ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      <>
                        Subscribe <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </InputGroup>
                <small className="nl-cta__note">
                  No spam, unsubscribe anytime. Join 5,000+ crypto enthusiasts.
                </small>
              </Form>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NewsletterCTA;
