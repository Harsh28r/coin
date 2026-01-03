import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { FacebookIcon as Facebook, Twitter, PinIcon as Pinterest, Instagram, Youtube, DiscIcon as Discord } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/inter';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${ API_BASE_URL || 'http://localhost:5000'}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setEmail('');
        setName('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Subscription failed. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="text-light py-5 mt-5" style={{ backgroundColor: '#1f2937' }}>
      <Container style={{ width: '100%', maxWidth: '1200px', padding: '0 16px' }}>
        <Row className="mb-5 gy-4" style={{ maxWidth: '100%' }}>
          <Col lg={3} md={6} className="mb-4 mb-md-0 text-center text-md-start">
            <img
              src="/logo3.png"
              alt="CoinsClarity Logo"
              className="mb-4 d-block mx-auto mx-md-0"
              style={{ width: '250px', height: 'auto' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/image.png'; }}
            />
            <p className="mx-auto mx-md-0" style={{ lineHeight: '1.6', maxWidth: 520, color: '#e5e7eb', fontSize: '0.875rem' }}>
              {t('footer.companyDescription')}
            </p>
            <p className="mt-3" style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{t('footer.copyright')}</p>
          </Col>
          <Col lg={2} md={6} className="mb-2 mb-md-0 text-center text-md-start">
            <h6 className="text-white mb-3 fw-bold">Our Company</h6>
            <ul className="list-unstyled" style={{ paddingLeft: '0' }}>
              <li className="mb-2"><a href="/" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>{t('nav.home')}</a></li>
              <li className="mb-2"><a href="/about" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>About Us</a></li>
              <li className="mb-2"><a href="/contact" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Contact</a></li>
              <li className="mb-2"><a href="/advertise" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Advertise</a></li>
              <li className="mb-2"><a href="/listings" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Listings</a></li>
            </ul>
          </Col>
          <Col lg={2} md={6} className="mb-2 mb-md-0 text-center text-md-start">
            <h6 className="text-white mb-3 fw-bold">Trading Tools</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="/tools" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>All Tools</a></li>
              <li className="mb-2"><a href="/arbitrage" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Arbitrage Finder</a></li>
              <li className="mb-2"><a href="/tools" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Profit Calculator</a></li>
              <li className="mb-2"><a href="/tools" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>DCA Calculator</a></li>
              <li className="mb-2"><a href="/tools" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Funding Rates</a></li>
              <li className="mb-2"><a href="/tools" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Gas Tracker</a></li>
            </ul>
          </Col>
          <Col lg={2} md={6} className="mb-2 mb-md-0 text-center text-md-start">
            <h6 className="text-white mb-3 fw-bold">Resources</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="/privacy-policy" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Privacy Policy</a></li>
              <li className="mb-2"><a href="/terms" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Terms of Service</a></li>
              <li className="mb-2"><a href="/disclaimer" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Disclaimer</a></li>
              <li className="mb-2"><a href="/faq" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>FAQ</a></li>
              <li className="mb-2"><a href="/learn" className="small text-decoration-none hover-underline d-inline-block" style={{ color: '#e5e7eb' }}>Learn Crypto</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4 mb-md-0 text-center text-md-start">
            <h6 className="text-white mb-3 fw-bold">{t('footer.joinCommunity')}</h6>
            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
              <a href="https://x.com/coinsclarity?t=hSpD5E1d2xIjii-mhw9kEQ&s=09" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="text-light hover-opacity"><Twitter size={28} /></a>
              <a href="https://www.instagram.com/coinsclarity?igsh=MWc2YnRjMXIzeTE3aw==" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-light hover-opacity"><Instagram size={28} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="text-light hover-opacity"><Youtube size={28} /></a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord" className="text-light hover-opacity"><Discord size={28} /></a>
            </div>
            <div className="d-flex justify-content-center justify-content-md-start mt-5 me-md-0">
              <Form onSubmit={handleSubscribe} className="d-flex flex-column" style={{ width: '100%' }}>
                {message && (
                  <Alert 
                    variant={message.type === 'success' ? 'success' : 'danger'} 
                    className="mb-3"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {message.text}
                  </Alert>
                )}
                
                <InputGroup className="mb-1">
                  <Form.Control 
                    type="email" 
                    placeholder={t('footer.enterEmail')} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-dark text-light" 
                    style={{ 
                      color: 'white',
                      fontSize: '0.95rem',
                      height: '40px'
                    }}
                  />
                  <Button
                    variant="warning"
                    type="submit"
                    disabled={isSubmitting}
                    className="footer-button d-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor: '#f97316',
                      fontSize: '1rem',
                      color: 'white',
                      height: '40px',
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        {t('footer.subscribing')}
                      </>
                    ) : (
                      <>
                        <span>{t('footer.subscribe')}</span>
                        <i className="bi bi-envelope-fill ms-2"></i>
                      </>
                    )}
                  </Button>
                </InputGroup>
                <small className="mt-2" style={{ fontSize: '0.8rem', color: '#d1d5db' }}>
                  {t('footer.subscriptionText')}
                </small>
              </Form>
            </div>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">
            <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
              <span className="text-light small">Language:</span>
              <LanguageSelector />
            </div>
          </Col>
        </Row>
      </Container>
      <style>
        {`
          .hover-underline:hover {
            text-decoration: underline !important;
          }
          .hover-opacity:hover {
            opacity: 0.8;
          }
          .bg-dark.text-light::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          .footer-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .footer-button:disabled {
            opacity: 0.7;
            transform: none;
            box-shadow: none;
          }
          @media (max-width: 576px) {
            .footer-button {
              font-size: 0.9rem;
              height: 40px;
              border-radius: 0.5rem;
            }
            .bg-dark.text-light {
              height: 40px;
              font-size: 0.9rem;
            }
          }
        `}
      </style>
    </footer>
  );
};

export default Footer;