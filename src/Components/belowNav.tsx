import { useState, useEffect } from 'react';
import { Navbar, Container, Nav, NavDropdown, Card, ListGroup } from 'react-bootstrap';

// Define types for translations, currency rates, and news
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
  const allowedLanguages = ['en', 'bn', 'de', 'es', 'fr'] as const;
  type Language = typeof allowedLanguages[number];
  const allowedCurrencies = ['USD', 'EUR', 'GBP'] as const;
  type Currency = typeof allowedCurrencies[number];

  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [translations, setTranslations] = useState<Translations>({
    en: { comp: 'COMP', btcDominance: 'BTC Dominance', fearGreed: 'Fear & Greed Index', gas: 'Gas' },
  });
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>({ USD: 1, EUR: 0.85, GBP: 0.73 });
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // MyMemory API for translations (free tier)
  const translationApiUrl = 'https://api.mymemory.translated.net/get';
  // ExchangeRate-API for currency rates (free tier, no key required)
  const currencyApiUrl = 'https://open.er-api.com/v6/latest/USD';
  // Hypothetical news API (replace with real API)
  const newsApiUrl = 'https://api.example.com/news';

  // Fetch translations for the selected language
  useEffect(() => {
    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const terms = ['COMP', 'BTC Dominance', 'Fear & Greed Index', 'Gas'];
        const langPair = `en|${language}`;
        console.log('Fetching translations for:', language);
        const promises = terms.map(term =>
          fetch(`${translationApiUrl}?q=${encodeURIComponent(term)}&langpair=${langPair}`)
            .then(res => {
              if (!res.ok) throw new Error(`Translation API failed for ${term}`);
              return res.json();
            })
            .then(data => ({
              key: term,
              translation: data.responseData?.translatedText || term,
            }))
            .catch(err => {
              console.error(`Error fetching translation for ${term}:`, err);
              return { key: term, translation: term };
            })
        );
        const results = await Promise.all(promises);
        const newTranslations: Translations = {
          [language]: {
            comp: results.find(r => r.key === 'COMP')?.translation || 'COMP',
            btcDominance: results.find(r => r.key === 'BTC Dominance')?.translation || 'BTC Dominance',
            fearGreed: results.find(r => r.key === 'Fear & Greed Index')?.translation || 'Fear & Greed Index',
            gas: results.find(r => r.key === 'Gas')?.translation || 'Gas',
          },
        };
        console.log('New translations:', newTranslations);
        setTranslations(prev => ({ ...prev, ...newTranslations }));
        setError(null);
      } catch (err) {
        setError('Error fetching translations. Using default values.');
        console.error('Translation fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (language !== 'en') fetchTranslations();
  }, [language]);

  // Fetch currency rates
  useEffect(() => {
    const fetchCurrencyRates = async () => {
      setLoading(true);
      try {
        console.log('Fetching currency rates');
        const response = await fetch(currencyApiUrl);
        if (!response.ok) throw new Error('Failed to fetch currency rates');
        const data = await response.json();
        console.log('Currency rates:', data.rates);
        setCurrencyRates(data.rates);
        setError(null);
      } catch (err) {
        setError('Error fetching currency rates. Using default values.');
        console.error('Currency fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrencyRates();
  }, []);

  // Fetch news based on selected language
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        console.log('Fetching news for:', language);
        // Mock news API response (replace with real API call)
        const response = await fetch(`${newsApiUrl}?lang=${language}`);
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        // Mock data structure (replace with actual API response)
        const mockNews: NewsArticle[] = [
          { id: '1', title: `News in ${language} - Article 1` },
          { id: '2', title: `News in ${language} - Article 2` },
          { id: '3', title: `News in ${language} - Article 3` },
        ];
        setNews(data.articles || mockNews);
        setError(null);
      } catch (err) {
        setError('Error fetching news. Displaying default content.');
        console.error('News fetch error:', err);
        setNews([
          { id: '1', title: `Fallback News in ${language} - Article 1` },
          { id: '2', title: `Fallback News in ${language} - Article 2` },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [language]);

  const handleLanguageChange = (eventKey: string | null) => {
    if (eventKey && allowedLanguages.includes(eventKey as Language)) {
      console.log('Selected language:', eventKey);
      setLanguage(eventKey as Language);
    } else {
      console.warn('Invalid language selected:', eventKey);
    }
  };

  const handleCurrencyChange = (eventKey: string | null) => {
    if (eventKey && allowedCurrencies.includes(eventKey as Currency)) {
      console.log('Selected currency:', eventKey);
      setCurrency(eventKey as Currency);
    } else {
      console.warn('Invalid currency selected:', eventKey);
    }
  };

  // Format value based on currency
  const formatCurrency = (value: number) => {
    const rate = currencyRates[currency] || 1;
    const convertedValue = (value * rate).toFixed(2);
    return `${convertedValue} ${currency}`;
  };

  // Get translated text or fallback to English
  const t: Translation = translations[language] || translations.en;

  return (
    <div>
      <Navbar bg="white" expand="lg" className="py-2 border-bottom font-inter fw-medium fs-6 lh-sm" style={{ letterSpacing: '0.04em', zIndex: 1000 }}>
        <Container fluid style={{ width: '90%' }} className="px-3">
          <Navbar.Toggle aria-controls="market-nav" />
          {loading && <div className="text-info">Loading...</div>}
          {error && <div className="text-danger">Error: {error}</div>}
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
                title={
                  <span>
                    <i className="fas fa-globe me-1" aria-hidden="true"></i>
                    {language.toUpperCase()}
                  </span>
                }
                id="language-dropdown"
                align="end"
                onSelect={handleLanguageChange}
                className="me-2"
                style={{
                  minWidth: '120px',
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                <NavDropdown.Item eventKey="en">English</NavDropdown.Item>
                <NavDropdown.Item eventKey="bn">বাংলা</NavDropdown.Item>
                <NavDropdown.Item eventKey="de">Deutsch</NavDropdown.Item>
                <NavDropdown.Item eventKey="es">Español</NavDropdown.Item>
                <NavDropdown.Item eventKey="fr">Français</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title={currency}
                id="currency-dropdown"
                align="end"
                onSelect={handleCurrencyChange}
                className="me-2"
                style={{
                  minWidth: '100px',
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                <NavDropdown.Item eventKey="USD">USD</NavDropdown.Item>
                <NavDropdown.Item eventKey="EUR">EUR</NavDropdown.Item>
                <NavDropdown.Item eventKey="GBP">GBP</NavDropdown.Item>
              </NavDropdown>
              <Nav.Link
                href="#profile"
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'black',
                  padding: '5px',
                }}
              >
                <i className="fa fa-user" aria-hidden="true"></i>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid style={{ width: '90%', marginTop: '20px' }}>
        <Card>
          <Card.Header>News in {language.toUpperCase()}</Card.Header>
          <ListGroup variant="flush">
            {news.length > 0 ? (
              news.map(article => (
                <ListGroup.Item key={article.id}>{article.title}</ListGroup.Item>
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