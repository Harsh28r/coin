import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Mail, ArrowRight } from 'lucide-react';

const NewsletterCTA: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

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
      const res = await fetch(`${API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: '' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage('You\'re in! Check your inbox for a welcome email.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again later.');
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '4rem 0',
        marginTop: '3rem',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Container style={{ maxWidth: 720 }}>
        <Row className="justify-content-center">
          <Col xs={12} className="text-center">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
              }}
            >
              <Mail size={28} color="#fff" />
            </div>

            <h3
              style={{
                color: '#1e293b',
                fontWeight: 800,
                fontSize: '1.75rem',
                marginBottom: 12,
              }}
            >
              Stay Ahead of the Market
            </h3>
            <p
              style={{
                color: '#475569',
                fontSize: '1.05rem',
                maxWidth: 520,
                margin: '0 auto 28px',
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              Get the top crypto stories, market movers, and exclusive insights delivered to your inbox every morning — free.
            </p>

            {status === 'success' ? (
              <Alert
                variant="success"
                className="mx-auto"
                style={{
                  maxWidth: 460,
                  background: 'rgba(34,197,94,0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 12,
                }}
              >
                {message}
              </Alert>
            ) : (
              <Form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: 460 }}>
                {status === 'error' && (
                  <Alert
                    variant="danger"
                    className="mb-3"
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 12,
                      fontSize: '0.9rem',
                    }}
                  >
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
                    style={{
                      background: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px 0 0 12px',
                      color: '#1e293b',
                      padding: '14px 18px',
                      fontSize: '1rem',
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                      background: 'linear-gradient(135deg, #f97316, #fb923c)',
                      border: 'none',
                      borderRadius: '0 12px 12px 0',
                      padding: '14px 24px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {status === 'loading' ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      <>
                        Subscribe <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </InputGroup>
                <small style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginTop: 12 }}>
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

