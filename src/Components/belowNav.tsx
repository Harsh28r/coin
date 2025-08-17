import React, { useEffect, useState } from 'react';
import { Navbar, Container, Nav, NavDropdown, Card, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import CoinTicker from './CoinTicker';

interface Translation {
  comp: string;
  btcDominance: string;
  fearGreed: string;
  gas: string;
}

interface Translations {
  [key: string]: Translation;
}

interface CurrencyRates {
  [key: string]: number;
}

interface NewsArticle {
  id: string;
  title: string;
}

export function TopNav() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const allowedLanguages = ['en', 'bn', 'de', 'es', 'fr'] as const;
  type Language = typeof allowedLanguages[number];
  const allowedCurrencies = ['USD', 'EUR', 'GBP'] as const;
  type Currency = typeof allowedCurrencies[number];

  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const { formatPrice, setCurrency: setGlobalCurrency, setLocale } = useCurrency();
  const [translations] = useState<Translations>({
    en: { comp: 'COMP', btcDominance: 'BTC Dominance', fearGreed: 'Fear & Greed Index', gas: 'Gas' },
    bn: { comp: 'কম্প', btcDominance: 'বিটিসি আধিপত্য', fearGreed: 'ভয় ও লোভ সূচক', gas: 'গ্যাস' },
    de: { comp: 'COMP', btcDominance: 'BTC Dominanz', fearGreed: 'Angst & Gier Index', gas: 'Gas' },
    es: { comp: 'COMP', btcDominance: 'Dominio BTC', fearGreed: 'Índice Miedo y Codicia', gas: 'Gas' },
    fr: { comp: 'COMP', btcDominance: 'Dominance BTC', fearGreed: 'Indice Peur et Cupidité', gas: 'Gaz' },
  });
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>({ USD: 1, EUR: 0.85, GBP: 0.73 });
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [rawNews, setRawNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const currencyApiUrl = 'https://open.er-api.com/v6/latest/USD';
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

  useEffect(() => {
    const langToLocale: Record<string, string> = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', bn: 'en-IN' };
    setLocale(langToLocale[language] || 'en-US');
  }, [language, setLocale]);

  useEffect(() => {
    const fetchCurrencyRates = async () => {
      setLoading(true);
      try {
        const response = await fetch(currencyApiUrl);
        if (!response.ok) throw new Error('Failed to fetch currency rates');
        const data = await response.json();
        setCurrencyRates(data.rates);
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchCurrencyRates();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/fetch-all-rss?limit=5`);
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setRawNews(data.data);
          const items: NewsArticle[] = data.data.map((item: any, index: number) => ({
            id: item.article_id || `news-${index}`,
            title: item.title || 'Crypto News'
          }));
          setNews(items);
        } else {
          throw new Error('Invalid news data');
        }
      } catch {
        setNews([
          { id: '1', title: 'Bitcoin Continues Its Rally Amid Market Optimism' },
          { id: '2', title: 'Ethereum Upgrade Shows Promise for DeFi Future' },
          { id: '3', title: 'Crypto Regulation Updates Expected This Quarter' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [language, API_BASE_URL]);

  const handleLanguageChange = (eventKey: string | null) => {
    if (eventKey && allowedLanguages.includes(eventKey as Language)) {
      setLanguage(eventKey as Language);
    }
  };

  const handleCurrencyChange = (eventKey: string | null) => {
    if (eventKey && allowedCurrencies.includes(eventKey as Currency)) {
      setCurrency(eventKey as Currency);
      setGlobalCurrency(eventKey as Currency);
      if (eventKey === 'EUR') setLocale('de-DE');
      else if (eventKey === 'GBP') setLocale('en-GB');
      else setLocale('en-US');
    }
  };

  const formatCurrency = (value: number) => {
    const rate = currencyRates[currency] || 1;
    return formatPrice(value * rate, currency);
  };

  const t: Translation = translations[language] || translations.en;

  return (
    <div>
      <Navbar bg="white" expand="lg" className="py-2 border-bottom font-inter fw-medium fs-6 lh-sm" style={{ letterSpacing: '0.04em', zIndex: 1000 }}>
        <Container fluid style={{ width: '90%' }} className="px-3">
          <Navbar.Toggle aria-controls="market-nav" />
          {loading && <div className="text-info">Loading...</div>}
          <div className="text-muted small me-3">Current Language: {language.toUpperCase()}</div>
          <Navbar.Collapse id="market-nav" className="d-flex flex-wrap overflow-auto">
            <Nav className="me-auto d-flex flex-nowrap">
              <div className="d-flex flex-row">
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.comp}</span>
                  <span className="ms-2 text-success">{formatCurrency(56.54)}</span>
                  <span className="ms-2 text-success">1.15%</span>
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.comp}</span>
                  <span className="ms-2 text-success">{formatCurrency(56.54)}</span>
                  <span className="ms-2 text-success">1.15%</span>
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.comp}</span>
                  <span className="ms-2 text-success">{formatCurrency(76.54)}</span>
                  <span className="ms-2 text-success">1.15%</span>
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.btcDominance}</span>
                  <span className="ms-2 text-success">58.98%</span>
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.fearGreed}</span>
                  <span className="ms-2 text-success">45</span>
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.btcDominance}</span>
                  <span className="ms-2 text-success">58.98%</span>
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center px-3 py-2">
                  <span>{t.gas}</span>
                  <span className="ms-2 text-success">25 Gwei</span>
                </Nav.Item>
              </div>
            </Nav>
            <Nav className="flex-row flex-nowrap" style={{ position: 'relative' }}>
              <NavDropdown
                title={<span style={{ color: '#000', fontWeight: '500' }}><i className="fas fa-globe me-1" aria-hidden="true"></i>{language.toUpperCase()}</span>}
                id="language-dropdown"
                onSelect={handleLanguageChange}
                className="me-2"
                style={{ cursor: 'pointer' }}
              >
                <NavDropdown.Item eventKey="en">English</NavDropdown.Item>
                <NavDropdown.Item eventKey="bn">বাংলা</NavDropdown.Item>
                <NavDropdown.Item eventKey="de">Deutsch</NavDropdown.Item>
                <NavDropdown.Item eventKey="es">Español</NavDropdown.Item>
                <NavDropdown.Item eventKey="fr">Français</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title={<span style={{ color: '#000', fontWeight: '500' }}>{currency}</span>}
                id="currency-dropdown"
                onSelect={handleCurrencyChange}
                className="me-2"
                style={{ cursor: 'pointer' }}
              >
                <NavDropdown.Item eventKey="USD">USD</NavDropdown.Item>
                <NavDropdown.Item eventKey="EUR">EUR</NavDropdown.Item>
                <NavDropdown.Item eventKey="GBP">GBP</NavDropdown.Item>
              </NavDropdown>
              {auth.isAuthenticated ? (
                <NavDropdown
                  title={<span style={{ color: '#000', fontWeight: '500' }}><i className="fa fa-user" aria-hidden="true"></i></span>}
                  id="profile-dropdown"
                  align="end"
                  style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                >
                  {auth.username && <NavDropdown.Header>{auth.username}</NavDropdown.Header>}
                  <NavDropdown.Item onClick={() => navigate('/admin')}>Dashboard</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link onClick={() => navigate('/login')} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: 'black', padding: '5px', cursor: 'pointer' }}>
                  Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Removed fixed CoinTicker to prevent visual overlap with the navbar */}

      <Container fluid style={{ width: '90%', marginTop: '20px' }}>
        <Card>
          <Card.Header>News in {language.toUpperCase()}</Card.Header>
          <ListGroup variant="flush">
            {news.length > 0 ? (
              news.map(article => (
                <ListGroup.Item
                  key={article.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const id = article.id;
                    const match = rawNews.find((it: any) => {
                      const articleId = (it.article_id || '').toString();
                      const link = (it.link || '').toString();
                      const title = (it.title || '').toString();
                      return articleId === id || link.includes(id) || id.includes(articleId) || id.includes(title) || title.includes(id);
                    });
                    if (match) {
                      const targetId = match.article_id || encodeURIComponent(match.link || match.title || id);
                      navigate(`/news/${targetId}`, { state: { item: {
                        article_id: match.article_id || targetId,
                        title: match.title || 'Untitled',
                        description: match.description || '',
                        creator: Array.isArray(match.creator) ? match.creator : [match.creator || 'Unknown'],
                        pubDate: match.pubDate || new Date().toISOString(),
                        image_url: match.image_url || match.image || '',
                        link: match.link || '#',
                        source_name: match.source_name || 'Crypto',
                        content: match.content || ''
                      } } });
                    } else {
                      navigate(`/news/${id}`);
                    }
                  }}
                >
                  {article.title}
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No news available</ListGroup.Item>
            )}
          </ListGroup>
        </Card>
      </Container>
    </div>
  );
}
