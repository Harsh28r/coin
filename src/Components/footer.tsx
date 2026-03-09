import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Twitter, Instagram, Youtube, DiscIcon as Discord } from 'lucide-react';
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
    if (!email.trim()) { setMessage({ type: 'error', text: 'Please enter your email address' }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setMessage({ type: 'error', text: 'Please enter a valid email address' }); return; }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL || 'http://localhost:5000'}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await response.json();
      if (data.success) { setMessage({ type: 'success', text: data.message }); setEmail(''); setName(''); }
      else { setMessage({ type: 'error', text: data.message || 'Subscription failed.' }); }
    } catch { setMessage({ type: 'error', text: 'Network error. Please try again.' }); }
    finally { setIsSubmitting(false); }
  };

  const linkStyle: React.CSSProperties = { color: '#94a3b8', fontSize: 13, textDecoration: 'none', display: 'block', padding: '3px 0', transition: 'color 0.2s ease' };
  const headingStyle: React.CSSProperties = { color: '#fff', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 };

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', paddingTop: 48, paddingBottom: 24, marginTop: 40 }}>
      <Container style={{ maxWidth: 1280, padding: '0 20px' }}>
        <Row className="gy-4 mb-4">
          {/* Brand */}
          <Col lg={3} md={6}>
            <img
              src="/logo3.png"
              alt="CoinsClarity Logo"
              style={{ width: 170, height: 'auto', marginBottom: 16, filter: 'brightness(1.1)' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/image.png'; }}
            />
            <p style={{ color: '#ffffff', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
              Real-time crypto news, market data, trading tools, and insights. Your all-in-one platform for navigating the digital asset space.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://x.com/coinsclarity" target="_blank" rel="noreferrer" aria-label="X (Twitter)" style={{ color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f97316'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}><Twitter size={18} /></a>
              <a href="https://www.instagram.com/coinsclarity" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f97316'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}><Instagram size={18} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" style={{ color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f97316'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}><Youtube size={18} /></a>
              <a href="https://discord.gg/V2YY8nXjr5" target="_blank" rel="noreferrer" aria-label="Discord" style={{ color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f97316'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}><Discord size={18} /></a>
            </div>
          </Col>

          {/* Company */}
          <Col lg={2} md={3} sm={6}>
            <div style={headingStyle}>Company</div>
            <a href="/" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Home</a>
            <a href="/about" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>About Us</a>
            <a href="/contact" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Contact</a>
            <a href="/advertise" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Advertise</a>
            <a href="/blog" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Blog</a>
            <a href="https://daily.coinsclarity.com" target="_blank" rel="noreferrer" style={{ ...linkStyle, color: '#f97316', fontWeight: 600 }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.color = '#f97316'; }}>Daily — India news & current affairs</a>
          </Col>

          {/* News & Content */}
          <Col lg={2} md={3} sm={6}>
            <div style={headingStyle}>News</div>
            <a href="/exclusive-news" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Exclusive News</a>
            <a href="/All-Trending-news" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Trending</a>
            <a href="/press-news" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Press Releases</a>
            <a href="/ai-news" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>AI News</a>
            <a href="/listings" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Listings</a>
          </Col>

          {/* Tools */}
          <Col lg={2} md={3} sm={6}>
            <div style={headingStyle}>Tools</div>
            <a href="/tools" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>All Tools</a>
            <a href="/arbitrage-scanner" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Arbitrage Scanner</a>
            <a href="/watchlist" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Watchlist</a>
            <a href="/learn" style={linkStyle} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>Learn Crypto</a>
          </Col>

          {/* Newsletter */}
          <Col lg={3} md={6}>
            <div style={headingStyle}>Newsletter</div>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
              Get the top crypto stories, market movers, and exclusive insights delivered to your inbox every morning — free.
            </p>
            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'danger'} style={{ fontSize: 12, padding: '8px 12px', marginBottom: 8 }}>
                {message.text}
              </Alert>
            )}
            <Form onSubmit={handleSubscribe}>
              <InputGroup size="sm">
                <Form.Control
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: 13, borderRadius: '6px 0 0 6px' }}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ background: '#f97316', border: 'none', fontSize: 13, fontWeight: 600, padding: '0 16px', borderRadius: '0 6px 6px 0' }}
                >
                  {isSubmitting ? '...' : 'Subscribe'}
                </Button>
              </InputGroup>
            </Form>
            <small style={{ color: '#64748b', fontSize: 11, marginTop: 8, display: 'block' }}>
              No spam, unsubscribe anytime. Join 5,000+ crypto enthusiasts.
            </small>
          </Col>
        </Row>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, marginTop: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            © {new Date().getFullYear()} CoinsClarity. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/privacy-policy" style={{ color: '#64748b', fontSize: 12, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>Privacy</a>
            <a href="/terms" style={{ color: '#64748b', fontSize: 12, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>Terms</a>
            <a href="/disclaimer" style={{ color: '#64748b', fontSize: 12, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>Disclaimer</a>
            <a href="/faq" style={{ color: '#64748b', fontSize: 12, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>FAQ</a>
            <LanguageSelector />
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
