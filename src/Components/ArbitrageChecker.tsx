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
        <title>Triangular Arbitrage Checker | Free Crypto Tool | CoinsClarity</title>
        <meta name="description" content="Free triangular arbitrage calculator. Find potential profit opportunities by checking price differences across BTC, ETH, USDT and more crypto pairs." />
        <link rel="canonical" href={`${window.location.origin}/arbitrage`} />
      </Helmet>
      <CoinsNavbar />
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingTop: '20px', paddingBottom: '40px' }}>
        <Container className="mb-4">
          <Link to="/tools" className="btn btn-outline-secondary btn-sm rounded-pill">
            ← Back to All Tools
          </Link>
        </Container>
        <ArbitrageChecker />
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
    <Container fluid className="py-4" style={{ maxWidth: '900px' }}>
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          padding: '24px'
        }}>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h4 className="text-white mb-1 d-flex align-items-center">
                <TrendingUp className="me-2" size={24} />
                Triangular Arbitrage Checker
              </h4>
              <p className="text-light mb-0" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                Find potential profit opportunities across token pairs
              </p>
            </div>
            <Badge bg="warning" text="dark" className="px-3 py-2">
              Live Prices
            </Badge>
          </div>
        </div>

        <Card.Body className="p-4">
          {/* Token Selection */}
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">Token 1 (Start)</Form.Label>
                <Form.Select 
                  value={token1} 
                  onChange={(e) => setToken1(e.target.value)}
                  className="rounded-3"
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
                <Form.Label className="fw-semibold text-muted small">Token 2 (Middle)</Form.Label>
                <Form.Select 
                  value={token2} 
                  onChange={(e) => setToken2(e.target.value)}
                  className="rounded-3"
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
                <Form.Label className="fw-semibold text-muted small">Token 3 (Bridge)</Form.Label>
                <Form.Select 
                  value={token3} 
                  onChange={(e) => setToken3(e.target.value)}
                  className="rounded-3"
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

          {/* Amount Input */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">
                  <DollarSign size={14} className="me-1" />
                  Starting Amount (USD)
                </Form.Label>
                <Form.Control
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1}
                  className="rounded-3"
                  style={{ fontSize: '1.1rem', fontWeight: '600' }}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end gap-2">
              <Button 
                onClick={fetchPrices}
                disabled={loading}
                className="flex-fill rounded-3"
                style={{ backgroundColor: '#f59e0b', border: 'none' }}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <RefreshCw size={16} className="me-2" />
                    Check Arbitrage
                  </>
                )}
              </Button>
              <Form.Check
                type="switch"
                id="auto-refresh"
                label="Auto"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mb-2"
              />
            </Col>
          </Row>

          {/* Error */}
          {error && (
            <Alert variant="danger" className="rounded-3">
              <AlertTriangle size={16} className="me-2" />
              {error}
            </Alert>
          )}

          {/* Trading Path Visualization */}
          {result && (
            <div className="trading-path mb-4 p-4 rounded-3" style={{ backgroundColor: '#f8fafc' }}>
              <h6 className="mb-3 text-muted">Trading Path</h6>
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                {result.path.map((token, idx) => (
                  <React.Fragment key={idx}>
                    <div 
                      className="token-badge px-3 py-2 rounded-pill fw-bold"
                      style={{ 
                        backgroundColor: idx === 0 ? '#fef3c7' : '#e0e7ff',
                        color: idx === 0 ? '#92400e' : '#3730a3'
                      }}
                    >
                      {token}
                    </div>
                    {idx < result.path.length - 1 && (
                      <ArrowRight size={20} className="text-muted" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div 
              className="result-card p-4 rounded-3 text-center"
              style={{ 
                backgroundColor: result.profitable ? '#ecfdf5' : '#fef2f2',
                border: `2px solid ${result.profitable ? '#10b981' : '#ef4444'}`
              }}
            >
              <h3 
                className="mb-2"
                style={{ 
                  color: result.profitable ? '#059669' : '#dc2626',
                  fontSize: '2.5rem',
                  fontWeight: '700'
                }}
              >
                {result.profitPercent > 0 ? '+' : ''}{result.profitPercent.toFixed(4)}%
              </h3>
              <p className="mb-3" style={{ color: result.profitable ? '#047857' : '#b91c1c' }}>
                {result.profitable 
                  ? `🎉 Potential profit of $${((amount * result.profitPercent) / 100).toFixed(2)} on $${amount}`
                  : `📉 Loss of $${Math.abs((amount * result.profitPercent) / 100).toFixed(2)} on $${amount}`
                }
              </p>

              {/* Step breakdown */}
              <div className="steps-breakdown text-start mt-4">
                <h6 className="text-muted mb-3">Trade Breakdown (including 0.3% fees per swap):</h6>
                {result.steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="step-item d-flex justify-content-between align-items-center p-2 rounded mb-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                  >
                    <span>
                      <Badge bg="secondary" className="me-2">{idx + 1}</Badge>
                      {step.from} → {step.to}
                    </span>
                    <span className="fw-semibold">
                      ${step.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Update */}
          {lastUpdate && (
            <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.8rem' }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
              {autoRefresh && ' (Auto-refreshing every 30s)'}
            </p>
          )}

          {/* Disclaimer */}
          <Alert variant="warning" className="mt-4 rounded-3">
            <small>
              <strong>⚠️ Disclaimer:</strong> This is a simplified calculator for educational purposes. 
              Real arbitrage involves additional factors like slippage, gas fees, liquidity depth, 
              and execution speed. Prices shown are from CoinGecko and may differ from exchange rates. 
              Not financial advice.
            </small>
          </Alert>
        </Card.Body>
      </Card>

      {/* Popular Arbitrage Paths */}
      <Card className="border-0 shadow-sm rounded-4 mt-4">
        <Card.Body className="p-4">
          <h5 className="mb-3">🔥 Popular Arbitrage Paths to Check</h5>
          <div className="d-flex flex-wrap gap-2">
            {[
              { t1: 'bitcoin', t2: 'ethereum', t3: 'tether', label: 'BTC → ETH → USDT' },
              { t1: 'ethereum', t2: 'binancecoin', t3: 'tether', label: 'ETH → BNB → USDT' },
              { t1: 'solana', t2: 'ethereum', t3: 'tether', label: 'SOL → ETH → USDT' },
              { t1: 'bitcoin', t2: 'solana', t3: 'tether', label: 'BTC → SOL → USDT' },
              { t1: 'ripple', t2: 'ethereum', t3: 'tether', label: 'XRP → ETH → USDT' },
            ].map((path, idx) => (
              <Button
                key={idx}
                variant="outline-secondary"
                size="sm"
                className="rounded-pill"
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
    </Container>
  );
};

export default ArbitrageCheckerPage;

