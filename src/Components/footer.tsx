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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subscribe`, {
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
    <footer className="text-light py-5 mt-5" style={{ backgroundColor: '#333333' }}>
      <Container style={{ width: '100%', maxWidth: '1440px' }}>
        <Row className="mb-5" style={{ maxWidth: '100%' }}>
          <Col md={5} className="mb-4 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }}>
            <img 
              src="/logo3.png" 
              alt="CoinsCapture Logo" 
              className="mb-4" 
              style={{ width: '250px', height: 'auto' }} 
            />
            <p className="text-light small fs-6" style={{ textAlign: 'left', lineHeight: '1.2' }}>
              {t('footer.companyDescription')}
            </p>
            <p className="text-light mt-4 small fs-6" style={{ textAlign: 'left' }}>{t('footer.copyright')}</p>
          </Col>
          <Col md={2} className="mb-2 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }} >
            <h6 className="text-white mb-3 fs-5" style={{ fontSize: '1.4rem' }}>Our Company</h6>
            <ul className="list-unstyled" style={{ paddingLeft: '0' }}>
              <li style={{ marginBottom: '5px' }}><a href="/" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('nav.home')}</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/exclusive-news" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('news.exclusive')}</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/All-Trending-news" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('news.trending')}</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/press-news" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('news.press')}</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/search" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('common.search')}</a></li>
            </ul>
          </Col>
          <Col md={2} className="mb-2 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }}>
            <h6 className="text-white mb-3 fs-5" style={{ fontSize: '1.4rem' }}>Interesting</h6>
            <ul className="list-unstyled" >
              <li style={{ marginBottom: '5px' }}><a href="/explore/cryptocurrencies" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('explore.didYouKnow')}</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/explore/defi" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('explore.learnALittle')}</a></li>
              <li style={{ marginBottom: '5px' }}><a href="/explore/nfts" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>{t('explore.testKnowledge')}</a></li>
            </ul>
          </Col>
          <Col md={2} className="mb-4 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }}>
            <h6 className="text-white mb-4 fs-5" style={{ fontSize: '1.4rem' }}>{t('footer.joinCommunity')}</h6>
            <div className="d-flex flex-wrap gap-4 justify-content-center justify-content-md-start">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="text-light hover-opacity"><Twitter size={30} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-light hover-opacity"><Instagram size={30} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-light hover-opacity"><Youtube size={30} /></a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="text-light hover-opacity"><Discord size={30} /></a>
            </div>
            <div className="d-flex justify-content-start mt-5 me-md-0">
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
                    className="bg-dark text-light border-secondary border-2" 
                    style={{ 
                      color: 'white', 
                      fontSize: '1rem', 
                      height: '40px',
                      borderColor: '#6c757d !important'
                    }}
                  />
                  <Button 
                    variant="warning" 
                    type="submit" 
                    disabled={isSubmitting}
                    className="footer-button d-flex align-items-center justify-content-center" 
                    style={{ 
                      backgroundColor: 'orange', 
                      fontSize: '1.1rem', 
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
                <small className="text-light mt-2" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
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