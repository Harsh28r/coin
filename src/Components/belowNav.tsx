import { useState, useEffect } from 'react';
import { Navbar, Container, Nav, NavDropdown, Card, ListGroup, Badge } from 'react-bootstrap';
// import { useCurrency } from '../context/CurrencyContext';

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

interface CryptoPrice {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export function TopNav() {
  const allowedLanguages = ['en', 'bn', 'de', 'es', 'fr'] as const;
  type Language = typeof allowedLanguages[number];
  const allowedCurrencies = ['USD', 'EUR', 'GBP'] as const;
  type Currency = typeof allowedCurrencies[number];

  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const { formatPrice, setCurrency: setGlobalCurrency, setLocale } = useCurrency();
  const [translations, setTranslations] = useState<Translations>({
    en: { comp: 'COMP', btcDominance: 'BTC Dominance', fearGreed: 'Fear & Greed Index', gas: 'Gas' },
    bn: { comp: 'কম্প', btcDominance: 'বিটিসি আধিপত্য', fearGreed: 'ভয় ও লোভ সূচক', gas: 'গ্যাস' },
    de: { comp: 'COMP', btcDominance: 'BTC Dominanz', fearGreed: 'Angst & Gier Index', gas: 'Gas' },
    es: { comp: 'COMP', btcDominance: 'Dominio BTC', fearGreed: 'Índice Miedo y Codicia', gas: 'Gas' },
    fr: { comp: 'COMP', btcDominance: 'Dominance BTC', fearGreed: 'Indice Peur et Cupidité', gas: 'Gaz' },
  });
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>({ USD: 1, EUR: 0.85, GBP: 0.73 });
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [showFloatingChart, setShowFloatingChart] = useState<boolean>(true);

  // API URLs
  const currencyApiUrl = 'https://open.er-api.com/v6/latest/USD';
  // Use your actual backend API
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Language change handler - translations are now static
  useEffect(() => {
    console.log('Language changed to:', language);
    const langToLocale: Record<string, string> = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', bn: 'en-IN' };
    setLocale(langToLocale[language] || 'en-US');
  }, [language, setLocale]);

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

  // Fetch news from your RSS feeds
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        console.log('Fetching crypto news for:', language);
        const response = await fetch(`${API_BASE_URL}/fetch-all-rss?limit=5`);
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const newsArticles: NewsArticle[] = data.data.map((item: any, index: number) => ({
            id: item.article_id || `news-${index}`,
            title: item.title || 'Crypto News'
          }));
          setNews(newsArticles);
        } else {
          throw new Error('Invalid news data');
        }
        setError(null);
      } catch (err) {
        setError('Error fetching news. Displaying fallback content.');
        console.error('News fetch error:', err);
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
  }, [language]);

  // Fetch crypto prices from our backend proxy
  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        console.log('Fetching crypto prices from backend...');
        const response = await fetch(`${API_BASE_URL}/crypto-prices?limit=8`);
        if (!response.ok) throw new Error('Failed to fetch crypto prices');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setCryptoPrices(data.data);
          console.log('Crypto prices fetched:', data.data.length, 'coins');
          if (data.fallback) {
            console.warn('Using fallback crypto data');
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Crypto price fetch error:', err);
        // Local fallback data
        setCryptoPrices([
          {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'btc',
            current_price: 45000,
            price_change_percentage_24h: 2.5,
            image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
            sparkline_in_7d: { price: [44000, 44500, 45000, 44800, 45200, 45000, 45300] }
          },
          {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'eth',
            current_price: 3200,
            price_change_percentage_24h: 1.8,
            image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            sparkline_in_7d: { price: [3100, 3150, 3200, 3180, 3220, 3200, 3250] }
          },
          {
            id: 'binancecoin',
            name: 'BNB',
            symbol: 'bnb',
            current_price: 320,
            price_change_percentage_24h: 0.8,
            image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
            sparkline_in_7d: { price: [315, 318, 320, 319, 322, 320, 324] }
          },
          {
            id: 'cardano',
            name: 'Cardano',
            symbol: 'ada',
            current_price: 0.48,
            price_change_percentage_24h: -1.2,
            image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
            sparkline_in_7d: { price: [0.49, 0.48, 0.47, 0.48, 0.49, 0.48, 0.47] }
          }
        ]);
      }
    };

    fetchCryptoPrices();
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (eventKey: string | null) => {
    console.log('Language dropdown clicked, eventKey:', eventKey);
    if (eventKey && allowedLanguages.includes(eventKey as Language)) {
      console.log('Setting language to:', eventKey);
      setLanguage(eventKey as Language);
      setError(null); // Clear any previous errors
    } else {
      console.warn('Invalid language selected:', eventKey);
    }
  };

  const handleCurrencyChange = (eventKey: string | null) => {
    if (eventKey && allowedCurrencies.includes(eventKey as Currency)) {
      console.log('Selected currency:', eventKey);
      setCurrency(eventKey as Currency);
      setGlobalCurrency(eventKey as Currency);
    } else {
      console.warn('Invalid currency selected:', eventKey);
    }
  };

  // Format value based on currency
  const formatCurrency = (value: number) => {
    const rate = currencyRates[currency] || 1;
    const convertedValue = value * rate;
    return formatPrice(convertedValue, currency);
  };

  // Get translated text or fallback to English
  const t: Translation = translations[language] || translations.en;

  // Enhanced SVG sparkline component with gradient and glow
  const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
    if (!data || data.length === 0) return null;
    
    const width = 70;
    const height = 24;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
    const isPositive = color === '#10b981';
    
    return (
      <svg 
        width={width} 
        height={height} 
        style={{ 
          display: 'block',
          filter: `drop-shadow(0 2px 4px ${color}40)`
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Area fill */}
        <polygon
          fill={`url(#${gradientId})`}
          points={`0,${height} ${points} ${width},${height}`}
          opacity="0.3"
        />
        
        {/* Main line with glow effect */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          points={points}
          filter="url(#glow)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  };

  // Floating crypto widget with premium design
  const FloatingCryptoWidget = () => {
    if (!showFloatingChart || cryptoPrices.length === 0) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: '120px',
          right: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 15px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          maxWidth: '320px',
          animation: 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'translateZ(0)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Header with gradient */}
        <div 
          className="d-flex justify-content-between align-items-center mb-3 pb-3"
          style={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          <div>
            <h6 className="mb-0 fw-bold" style={{ fontSize: '16px', color: '#1a1a2e' }}>
              💰 Live Crypto Prices
            </h6>
            <small style={{ color: '#666', fontSize: '11px' }}>Real-time market data</small>
          </div>
          <button
            onClick={() => setShowFloatingChart(false)}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
            }}
          >
            ×
          </button>
        </div>
        
        {/* Crypto list with enhanced styling */}
        <div className="crypto-list" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
          {cryptoPrices.slice(0, 6).map((crypto, index) => (
            <div
              key={crypto.id}
              className="crypto-item"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.6) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)';
              }}
            >
              {/* Background decorative element */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '40px',
                  height: '40px',
                  background: crypto.price_change_percentage_24h >= 0 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '50%',
                  opacity: 0.1,
                  transform: 'rotate(45deg)'
                }}
              />
              
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      style={{ 
                        width: '28px', 
                        height: '28px',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <div 
                      className="fw-bold"
                      style={{ 
                        fontSize: '14px', 
                        color: '#1a1a2e',
                        marginBottom: '2px'
                      }}
                    >
                      {crypto.symbol.toUpperCase()}
                    </div>
                    <div 
                      style={{ 
                        fontSize: '13px', 
                        color: '#667eea',
                        fontWeight: '600'
                      }}
                    >
                      {formatCurrency(crypto.current_price)}
                    </div>
                  </div>
                </div>
                
                <div className="d-flex flex-column align-items-end">
                  {/* Enhanced sparkline with background */}
                  {crypto.sparkline_in_7d && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        marginBottom: '8px'
                      }}
                    >
                      <MiniSparkline
                        data={crypto.sparkline_in_7d.price}
                        color={crypto.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444'}
                      />
                    </div>
                  )}
                  
                  {/* Enhanced badge */}
                  <div
                    style={{
                      background: crypto.price_change_percentage_24h >= 0 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: crypto.price_change_percentage_24h >= 0
                        ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                        : '0 4px 12px rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{crypto.price_change_percentage_24h >= 0 ? '📈' : '📉'}</span>
                    {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {crypto.price_change_percentage_24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced footer */}
        <div 
          className="text-center mt-3 pt-3"
          style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
            borderRadius: '12px',
            padding: '12px',
            margin: '0 -8px -8px -8px'
          }}
        >
          <div style={{ color: '#667eea', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
            🔄 Auto-updates every 30s
          </div>
          <div style={{ color: '#9ca3af', fontSize: '10px' }}>
            Powered by CoinGecko API
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navbar bg="white" expand="lg" className="py-2 border-bottom font-inter fw-medium fs-6 lh-sm" style={{ letterSpacing: '0.04em', zIndex: 1000 }}>
        <Container fluid style={{ width: '90%' }} className="px-3">
          <Navbar.Toggle aria-controls="market-nav" />
          {loading && <div className="text-info">Loading...</div>}
          {error && <div className="text-danger">Error: {error}</div>}
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
                title={
                  <span style={{ color: '#000', fontWeight: '500' }}>
                    <i className="fas fa-globe me-1" aria-hidden="true"></i>
                    {language.toUpperCase()}
                  </span>
                }
                id="language-dropdown"
                onSelect={handleLanguageChange}
                className="me-2"
                style={{ cursor: 'pointer' }}
              >
                <NavDropdown.Item 
                  eventKey="en" 
                  onClick={() => {
                    console.log('English clicked directly');
                    handleLanguageChange('en');
                  }}
                >
                  English
                </NavDropdown.Item>
                <NavDropdown.Item 
                  eventKey="bn"
                  onClick={() => {
                    console.log('Bengali clicked directly');
                    handleLanguageChange('bn');
                  }}
                >
                  বাংলা
                </NavDropdown.Item>
                <NavDropdown.Item 
                  eventKey="de"
                  onClick={() => {
                    console.log('German clicked directly');
                    handleLanguageChange('de');
                  }}
                >
                  Deutsch
                </NavDropdown.Item>
                <NavDropdown.Item 
                  eventKey="es"
                  onClick={() => {
                    console.log('Spanish clicked directly');
                    handleLanguageChange('es');
                  }}
                >
                  Español
                </NavDropdown.Item>
                <NavDropdown.Item 
                  eventKey="fr"
                  onClick={() => {
                    console.log('French clicked directly');
                    handleLanguageChange('fr');
                  }}
                >
                  Français
                </NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title={<span style={{ color: '#000', fontWeight: '500' }}>{currency}</span>}
                id="currency-dropdown"
                onSelect={handleCurrencyChange}
                className="me-2"
                style={{ cursor: 'pointer' }}
              >
                <NavDropdown.Item 
                  eventKey="USD"
                  onClick={() => {
                    console.log('USD clicked directly');
                    handleCurrencyChange('USD');
                  }}
                >
                  USD
                </NavDropdown.Item>
                <NavDropdown.Item 
                  eventKey="EUR"
                  onClick={() => {
                    console.log('EUR clicked directly');
                    handleCurrencyChange('EUR');
                  }}
                >
                  EUR
                </NavDropdown.Item>
                <NavDropdown.Item 
                  eventKey="GBP"
                  onClick={() => {
                    console.log('GBP clicked directly');
                    handleCurrencyChange('GBP');
                  }}
                >
                  GBP
                </NavDropdown.Item>
              </NavDropdown>
              <Nav.Link
                onClick={() => setShowFloatingChart(!showFloatingChart)}
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: showFloatingChart ? '#f39c12' : 'black',
                  padding: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                title="Toggle Crypto Charts"
              >
                <i className="fas fa-chart-line" aria-hidden="true"></i>
              </Nav.Link>
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
                <ListGroup.Item 
                  key={article.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.location.href = `/news/${article.id}`}
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
      
      {/* Floating Crypto Widget */}
      <FloatingCryptoWidget />
      
      {/* Enhanced CSS for animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%) rotateY(30deg);
          }
          to {
            opacity: 1;
            transform: translateX(0) rotateY(0deg);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .crypto-item {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .crypto-item:hover {
          animation: pulse 2s infinite;
        }
        
        /* Custom scrollbar for crypto list */
        .crypto-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .crypto-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        .crypto-list::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
        }
        
        .crypto-list::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #764ba2, #667eea);
        }
        
        /* Floating widget entrance animation */
        .floating-crypto-widget {
          animation: slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Gradient text effect */
        .gradient-text {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Shimmer effect for loading */
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}