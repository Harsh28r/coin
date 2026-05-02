import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Twitter, Instagram, Facebook, Youtube, DiscIcon as Discord, ExternalLink, Send } from 'lucide-react';
import { tradeLinks } from '../utils/tradeLinks';
import { postNewsletterSubscribe } from '../utils/newsletterSubscribe';
import 'bootstrap/dist/css/bootstrap.min.css';
import LanguageSelector from './LanguageSelector';
import './footer.css';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setMessage({ type: 'error', text: 'Please enter your email address' }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setMessage({ type: 'error', text: 'Please enter a valid email address' }); return; }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const out = await postNewsletterSubscribe(email, 'footer');
      if (out.ok) {
        setMessage({ type: 'success', text: out.message });
        setEmail('');
        setName('');
      } else {
        setMessage({ type: 'error', text: out.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="cc-footer">
      <Container style={{ maxWidth: 1280, padding: '0 24px' }}>
        <Row className="gy-4 mb-4">
          {/* Brand */}
          <Col lg={3} md={6}>
            <img
              src="/logo3.png"
              alt="CoinsClarity"
              className="cc-footer__brand-logo"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const wm = img.nextElementSibling as HTMLElement | null;
                if (wm) wm.style.display = 'inline-block';
              }}
            />
            <span className="cc-footer__wordmark" style={{ display: 'none' }}>CoinsClarity</span>
            <p className="cc-footer__tagline">
              Real-time crypto news, market data, trading tools, and editorial analysis. The signal in the noise.
            </p>
            <div className="cc-footer__socials">
              <a href="https://x.com/coinsclarity" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="cc-footer__social"><Twitter size={16} /></a>
              <a href="https://www.instagram.com/coinsclarity" target="_blank" rel="noreferrer" aria-label="Instagram" className="cc-footer__social"><Instagram size={16} /></a>
              <a href="https://www.facebook.com/profile.php?id=61587166360306" target="_blank" rel="noreferrer" aria-label="Facebook" className="cc-footer__social"><Facebook size={16} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="cc-footer__social"><Youtube size={16} /></a>
              <a href="https://discord.gg/V2YY8nXjr5" target="_blank" rel="noreferrer" aria-label="Discord" className="cc-footer__social"><Discord size={16} /></a>
              <a href="https://t.me/CoinsClarityBot" target="_blank" rel="noreferrer" aria-label="Telegram bot" className="cc-footer__social"><Send size={16} /></a>
            </div>
          </Col>

          <Col lg={2} md={3} sm={6}>
            <span className="cc-footer__heading">Company</span>
            <a href="/" className="cc-footer__link">Home</a>
            <a href="/about" className="cc-footer__link">About</a>
            <a href="/contact" className="cc-footer__link">Contact</a>
            <a href="/advertise" className="cc-footer__link">Advertise</a>
            <a href="/blog" className="cc-footer__link">Blog</a>
            <a href="https://daily.coinsclarity.com" target="_blank" rel="noreferrer" className="cc-footer__link cc-footer__link--accent">
              Daily — India News
            </a>
          </Col>

          <Col lg={2} md={3} sm={6}>
            <span className="cc-footer__heading">News</span>
            <a href="/exclusive-news" className="cc-footer__link">Exclusive</a>
            <a href="/All-Trending-news" className="cc-footer__link">Trending</a>
            <a href="/press-news" className="cc-footer__link">Press Releases</a>
            <a href="/ai-news" className="cc-footer__link">AI News</a>
            <a href="/listings" className="cc-footer__link">Listings</a>
            <a href="/beyond-the-headlines" className="cc-footer__link">Beyond the Headlines</a>
          </Col>

          <Col lg={2} md={3} sm={6}>
            <span className="cc-footer__heading">Trade</span>
            <a href={tradeLinks.binance.signup} target="_blank" rel="noopener noreferrer" className="cc-footer__link">
              {tradeLinks.binance.label} <ExternalLink size={11} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
            </a>
            <a href={tradeLinks.coinbase.signup} target="_blank" rel="noopener noreferrer" className="cc-footer__link">
              {tradeLinks.coinbase.label} <ExternalLink size={11} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
            </a>
            <a href={tradeLinks.coindcx.signup} target="_blank" rel="noopener noreferrer" className="cc-footer__link">
              {tradeLinks.coindcx.label} <ExternalLink size={11} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
            </a>
            <a href={(tradeLinks as any).okx?.signup || '#'} target="_blank" rel="noopener noreferrer" className="cc-footer__link">
              OKX <ExternalLink size={11} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
            </a>
            <p className="cc-footer__note">We may earn a commission when you use these links.</p>
          </Col>

          <Col lg={3} md={12}>
            <span className="cc-footer__heading">The Edge — Daily Brief</span>
            <p className="cc-footer__tagline" style={{ marginBottom: 14 }}>
              Top crypto stories, market movers, and editorial insight delivered every morning. Free.
            </p>
            {message && (
              <Alert
                variant={message.type === 'success' ? 'success' : 'danger'}
                style={{ fontSize: 12, padding: '8px 12px', marginBottom: 10 }}
              >
                {message.text}
              </Alert>
            )}
            <Form onSubmit={handleSubscribe} className="cc-footer__newsletter">
              <InputGroup size="sm">
                <Form.Control
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '…' : 'Subscribe'}
                </Button>
              </InputGroup>
            </Form>
            <small style={{ color: '#525252', fontSize: 11, marginTop: 10, display: 'block' }}>
              No spam. Unsubscribe anytime. Join 5,000+ subscribers.
            </small>
          </Col>
        </Row>

        <div className="cc-footer__bottom">
          <div className="cc-footer__copy">
            © {new Date().getFullYear()} CoinsClarity · An editorial crypto media platform.
          </div>
          <div className="cc-footer__legal">
            <a href="/privacy-policy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/disclaimer">Disclaimer</a>
            <a href="/faq">FAQ</a>
            <LanguageSelector />
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
