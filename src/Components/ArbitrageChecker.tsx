import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { RefreshCw, TrendingUp, ArrowRight, AlertTriangle, DollarSign } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CoinsNavbar from './navbar';
import Footer from './footer';

interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
}

interface ArbitrageResult {
  path: string[];
  profitPercent: number;
  profitable: boolean;
  steps: {
    from: string;
    to: string;
    rate: number;
    amount: number;
  }[];
}

const POPULAR_TOKENS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
];

const ArbitrageCheckerPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Triangular Arbitrage Calculator | Free Crypto Tool | CoinsClarity</title>
        <meta name="description" content="Free triangular arbitrage calculator. Find potential profit opportunities by checking price differences across BTC, ETH, USDT, SOL and 15+ crypto pairs. Real-time prices." />
        <link rel="canonical" href={`${window.location.origin}/arbitrage`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Triangular Arbitrage Calculator | CoinsClarity" />
        <meta property="og:description" content="Free crypto arbitrage calculator. Check triangular arbitrage opportunities across BTC, ETH, USDT and more. Live prices, instant results." />
        <meta property="og:url" content={`${window.location.origin}/arbitrage`} />
        <meta property="og:image" content={`${window.location.origin}/logo3.png`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Triangular Arbitrage Calculator | CoinsClarity" />
        <meta name="twitter:description" content="Free crypto arbitrage tool. Find profit opportunities across token pairs with live prices." />
        
        {/* Additional SEO */}
        <meta name="keywords" content="triangular arbitrage, crypto arbitrage calculator, bitcoin arbitrage, ethereum arbitrage, crypto trading tool, arbitrage opportunity finder, defi arbitrage" />
        <meta name="robots" content="index, follow" />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Triangular Arbitrage Calculator",
          "description": "Free triangular arbitrage calculator for cryptocurrency trading. Find profit opportunities across BTC, ETH, USDT and more token pairs.",
          "url": `${window.location.origin}/arbitrage`,
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "publisher": {
            "@type": "Organization",
            "name": "CoinsClarity"
          }
        })}</script>
      </Helmet>
      <CoinsNavbar />
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
        <Container style={{ maxWidth: '1000px', padding: '0 20px' }}>
          <div className="mb-4">
            <Link to="/tools" className="btn btn-outline-light btn-sm rounded-pill mb-3">
              ← Back to All Tools
            </Link>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
              }}>
                <TrendingUp size={32} color="white" />
              </div>
              <div>
                <h1 style={{ color: '#f97316', fontSize: '2.5rem', margin: 0, fontWeight: '700' }}>
                  Triangular Arbitrage Scanner
                </h1>
                <p style={{ color: '#d1d5db', margin: 0, fontSize: '1.1rem' }}>
                  Find profit opportunities across token pairs with real-time prices
                </p>
              </div>
            </div>
          </div>
          <ArbitrageChecker />
        </Container>
      </div>
      <Footer />
    </>
  );
};

const ArbitrageChecker: React.FC = () => {
  const [token1, setToken1] = useState('bitcoin');
  const [token2, setToken2] = useState('ethereum');
  const [token3, setToken3] = useState('tether');
  const [amount, setAmount] = useState(1000);
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArbitrageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

  // Fetch prices - use backend proxy to avoid CORS
  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const ids = [token1, token2, token3].join(',');
      // Try backend proxy first, fallback to direct API
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/prices?ids=${ids}`);
      } catch {
        // Fallback: use allorigins proxy
        response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`)}`
        );
      }
      
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data: TokenPrice[] = await response.json();
      const priceMap: Record<string, TokenPrice> = {};
      data.forEach(token => {
        priceMap[token.id] = token;
      });
      
      setPrices(priceMap);
      setLastUpdate(new Date());
      calculateArbitrage(priceMap);
    } catch (err) {
      setError('Failed to fetch prices. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate triangular arbitrage
  const calculateArbitrage = (priceData: Record<string, TokenPrice>) => {
    const p1 = priceData[token1]?.current_price;
    const p2 = priceData[token2]?.current_price;
    const p3 = priceData[token3]?.current_price;

    if (!p1 || !p2 || !p3) {
      setResult(null);
      return;
    }

    const t1Symbol = POPULAR_TOKENS.find(t => t.id === token1)?.symbol || token1;
    const t2Symbol = POPULAR_TOKENS.find(t => t.id === token2)?.symbol || token2;
    const t3Symbol = POPULAR_TOKENS.find(t => t.id === token3)?.symbol || token3;

    // Simulate trading path: Token1 → Token2 → Token3 → Token1
    // Including ~0.3% fee per swap (typical DEX fee)
    const feeMultiplier = 0.997; // 0.3% fee per swap

    // Step 1: Token1 → Token2
    const step1Amount = (amount / p1) * p2 * feeMultiplier;
    const rate1 = p1 / p2;

    // Step 2: Token2 → Token3
    const step2Amount = (step1Amount / p2) * p3 * feeMultiplier;
    const rate2 = p2 / p3;

    // Step 3: Token3 → Token1
    const finalAmount = (step2Amount / p3) * p1 * feeMultiplier;
    const rate3 = p3 / p1;

    const profitPercent = ((finalAmount - amount) / amount) * 100;

    setResult({
      path: [t1Symbol, t2Symbol, t3Symbol, t1Symbol],
      profitPercent,
      profitable: profitPercent > 0,
      steps: [
        { from: t1Symbol, to: t2Symbol, rate: rate1, amount: step1Amount },
        { from: t2Symbol, to: t3Symbol, rate: rate2, amount: step2Amount },
        { from: t3Symbol, to: t1Symbol, rate: rate3, amount: finalAmount },
      ],
    });
  };

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, token1, token2, token3]);

  // Fetch on token change
  useEffect(() => {
    if (token1 && token2 && token3 && token1 !== token2 && token2 !== token3 && token1 !== token3) {
      fetchPrices();
    }
  }, [token1, token2, token3]);

  return (
    <div>
      {/* Main Calculator Card */}
      <Card className="border-0 shadow-xl rounded-3 overflow-hidden mb-4" style={{ backgroundColor: '#1f2937' }}>
        <Card.Body className="p-5">
          {/* Token Selection */}
          <div className="mb-4">
            <h5 className="text-white mb-3" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
              Select Trading Pairs
            </h5>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="text-light fw-semibold mb-2">Token 1 (Start)</Form.Label>
                  <Form.Select 
                    value={token1} 
                    onChange={(e) => setToken1(e.target.value)}
                    className="rounded-3"
                    style={{ 
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      color: '#fff',
                      fontSize: '1rem',
                      padding: '12px'
                    }}
                  >
                    {POPULAR_TOKENS.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === token2 || t.id === token3}>
                        {t.symbol} - {t.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="text-light fw-semibold mb-2">Token 2 (Middle)</Form.Label>
                  <Form.Select 
                    value={token2} 
                    onChange={(e) => setToken2(e.target.value)}
                    className="rounded-3"
                    style={{ 
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      color: '#fff',
                      fontSize: '1rem',
                      padding: '12px'
                    }}
                  >
                    {POPULAR_TOKENS.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === token1 || t.id === token3}>
                        {t.symbol} - {t.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="text-light fw-semibold mb-2">Token 3 (Bridge)</Form.Label>
                  <Form.Select 
                    value={token3} 
                    onChange={(e) => setToken3(e.target.value)}
                    className="rounded-3"
                    style={{ 
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      color: '#fff',
                      fontSize: '1rem',
                      padding: '12px'
                    }}
                  >
                    {POPULAR_TOKENS.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === token1 || t.id === token2}>
                        {t.symbol} - {t.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <h5 className="text-white mb-3" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
              Investment Amount
            </h5>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="text-light fw-semibold mb-2 d-flex align-items-center gap-2">
                    <DollarSign size={18} color="#f97316" />
                    Starting Amount (USD)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={1}
                    className="rounded-3"
                    style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: '600',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      color: '#fff',
                      padding: '14px'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end gap-2">
                <Button 
                  onClick={fetchPrices}
                  disabled={loading}
                  className="flex-fill rounded-3"
                  style={{ 
                    backgroundColor: '#f97316',
                    border: 'none',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <RefreshCw size={18} className="me-2" />
                      Check Arbitrage
                    </>
                  )}
                </Button>
              </Col>
            </Row>
            <div className="d-flex align-items-center gap-3 mt-2">
              <Form.Check
                type="switch"
                id="auto-refresh"
                label={<span className="text-light">Auto-refresh (30s)</span>}
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              {lastUpdate && (
                <small className="text-muted">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </small>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div 
              className="p-3 rounded-3 mb-4"
              style={{ 
                backgroundColor: '#7f1d1d',
                border: '1px solid #dc2626'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} color="#fca5a5" />
                <span className="text-light">{error}</span>
              </div>
            </div>
          )}

          {/* Trading Path Visualization */}
          {result && (
            <div 
              className="mb-4 p-4 rounded-3"
              style={{ 
                backgroundColor: '#374151',
                border: '1px solid #4b5563'
              }}
            >
              <h6 className="mb-3 text-light fw-semibold">Trading Path</h6>
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-3">
                {result.path.map((token, idx) => (
                  <React.Fragment key={idx}>
                    <div 
                      className="px-4 py-3 rounded-3 fw-bold"
                      style={{ 
                        backgroundColor: idx === 0 ? '#f97316' : '#4b5563',
                        color: '#fff',
                        fontSize: '1.1rem',
                        boxShadow: idx === 0 ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
                      }}
                    >
                      {token}
                    </div>
                    {idx < result.path.length - 1 && (
                      <ArrowRight size={24} color="#9ca3af" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div 
              className="p-5 rounded-3 text-center mb-4"
              style={{ 
                background: result.profitable 
                  ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                border: `2px solid ${result.profitable ? '#10b981' : '#ef4444'}`,
                boxShadow: `0 8px 24px ${result.profitable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              <div className="mb-3">
                <Badge 
                  bg={result.profitable ? 'success' : 'danger'}
                  className="px-3 py-2 rounded-pill"
                  style={{ fontSize: '0.9rem' }}
                >
                  {result.profitable ? '✅ Profitable Opportunity' : '❌ Not Profitable'}
                </Badge>
              </div>
              
              <h2 
                className="mb-3"
                style={{ 
                  color: '#fff',
                  fontSize: '3.5rem',
                  fontWeight: '700',
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                {result.profitPercent > 0 ? '+' : ''}{result.profitPercent.toFixed(4)}%
              </h2>
              
              <p className="mb-4" style={{ color: '#d1fae5', fontSize: '1.2rem', fontWeight: '500' }}>
                {result.profitable 
                  ? `🎉 Potential profit of $${((amount * result.profitPercent) / 100).toFixed(2)} on $${amount.toLocaleString()}`
                  : `📉 Loss of $${Math.abs((amount * result.profitPercent) / 100).toFixed(2)} on $${amount.toLocaleString()}`
                }
              </p>

              {/* Step breakdown */}
              <div className="text-start mt-4">
                <h6 className="text-light mb-3 fw-semibold">Trade Breakdown (including 0.3% fees per swap):</h6>
                {result.steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="d-flex justify-content-between align-items-center p-3 rounded-3 mb-2"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Badge 
                        bg="light" 
                        text="dark"
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
                      >
                        {idx + 1}
                      </Badge>
                      <span className="text-light fw-semibold" style={{ fontSize: '1.1rem' }}>
                        {step.from} → {step.to}
                      </span>
                    </div>
                    <span className="text-light fw-bold" style={{ fontSize: '1.2rem' }}>
                      ${step.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div 
            className="p-4 rounded-3"
            style={{ 
              backgroundColor: '#1f2937',
              borderLeft: '4px solid #f97316'
            }}
          >
            <div className="d-flex align-items-start gap-3">
              <AlertTriangle size={24} color="#f97316" style={{ marginTop: '2px' }} />
              <div>
                <h6 className="text-light mb-2 fw-semibold">⚠️ Important Disclaimer</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  This is a simplified calculator for educational purposes. Real arbitrage involves additional 
                  factors like slippage, gas fees, liquidity depth, and execution speed. Prices shown are from 
                  CoinGecko and may differ from exchange rates. <strong className="text-light">Not financial advice.</strong>
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Popular Arbitrage Paths */}
      <Card className="border-0 shadow-xl rounded-3 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <Card.Body className="p-5">
          <h5 className="text-white mb-4" style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            🔥 Popular Arbitrage Paths
          </h5>
          <div className="d-flex flex-wrap gap-3">
            {[
              { t1: 'bitcoin', t2: 'ethereum', t3: 'tether', label: 'BTC → ETH → USDT' },
              { t1: 'ethereum', t2: 'binancecoin', t3: 'tether', label: 'ETH → BNB → USDT' },
              { t1: 'solana', t2: 'ethereum', t3: 'tether', label: 'SOL → ETH → USDT' },
              { t1: 'bitcoin', t2: 'solana', t3: 'tether', label: 'BTC → SOL → USDT' },
              { t1: 'ripple', t2: 'ethereum', t3: 'tether', label: 'XRP → ETH → USDT' },
              { t1: 'cardano', t2: 'ethereum', t3: 'tether', label: 'ADA → ETH → USDT' },
            ].map((path, idx) => (
              <Button
                key={idx}
                variant="outline-light"
                size="lg"
                className="rounded-pill px-4"
                style={{
                  border: '1px solid #4b5563',
                  color: '#fff',
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f97316';
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => {
                  setToken1(path.t1);
                  setToken2(path.t2);
                  setToken3(path.t3);
                }}
              >
                {path.label}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ArbitrageCheckerPage;

