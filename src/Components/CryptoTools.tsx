import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Tab, Tabs, Badge, Alert } from 'react-bootstrap';
import { Calculator, TrendingUp, Percent, DollarSign, RefreshCw, Target, PieChart, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CoinsNavbar from './navbar';
import Footer from './footer';

const CryptoTools: React.FC = () => {
  // Profit Calculator State
  const [buyPrice, setBuyPrice] = useState<number>(100);
  const [sellPrice, setSellPrice] = useState<number>(150);
  const [investAmount, setInvestAmount] = useState<number>(1000);
  const [profitResult, setProfitResult] = useState({ profit: 0, percent: 0, coins: 0 });

  // DCA Calculator State
  const [dcaAmount, setDcaAmount] = useState<number>(100);
  const [dcaFrequency, setDcaFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [dcaDuration, setDcaDuration] = useState<number>(12);
  const [dcaResult, setDcaResult] = useState({ total: 0, avgCost: 0 });

  // Position Size Calculator
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number>(95);
  const [positionResult, setPositionResult] = useState({ size: 0, coins: 0, riskAmount: 0 });

  // Liquidation Calculator
  const [liqEntryPrice, setLiqEntryPrice] = useState<number>(50000);
  const [leverage, setLeverage] = useState<number>(10);
  const [liqPosition, setLiqPosition] = useState<'long' | 'short'>('long');
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0);

  // Fear & Greed Index
  const [fearGreedIndex, setFearGreedIndex] = useState<{ value: number; label: string } | null>(null);

  // Fetch Fear & Greed Index
  useEffect(() => {
    const fetchFearGreed = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/');
        const data = await res.json();
        if (data.data?.[0]) {
          setFearGreedIndex({
            value: parseInt(data.data[0].value),
            label: data.data[0].value_classification
          });
        }
      } catch (err) {
        console.error('Failed to fetch fear & greed index');
      }
    };
    fetchFearGreed();
  }, []);

  // Calculate Profit
  useEffect(() => {
    const coins = investAmount / buyPrice;
    const finalValue = coins * sellPrice;
    const profit = finalValue - investAmount;
    const percent = ((sellPrice - buyPrice) / buyPrice) * 100;
    setProfitResult({ profit, percent, coins });
  }, [buyPrice, sellPrice, investAmount]);

  // Calculate DCA
  useEffect(() => {
    const periods = dcaFrequency === 'weekly' ? dcaDuration * 4 : dcaDuration;
    const total = dcaAmount * periods;
    setDcaResult({ total, avgCost: dcaAmount });
  }, [dcaAmount, dcaFrequency, dcaDuration]);

  // Calculate Position Size
  useEffect(() => {
    const riskAmount = accountSize * (riskPercent / 100);
    const riskPerCoin = entryPrice - stopLoss;
    const coins = riskPerCoin > 0 ? riskAmount / riskPerCoin : 0;
    const size = coins * entryPrice;
    setPositionResult({ size, coins, riskAmount });
  }, [accountSize, riskPercent, entryPrice, stopLoss]);

  // Calculate Liquidation Price
  useEffect(() => {
    if (liqPosition === 'long') {
      setLiquidationPrice(liqEntryPrice * (1 - 1 / leverage));
    } else {
      setLiquidationPrice(liqEntryPrice * (1 + 1 / leverage));
    }
  }, [liqEntryPrice, leverage, liqPosition]);

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return '#ef4444';
    if (value <= 45) return '#f97316';
    if (value <= 55) return '#eab308';
    if (value <= 75) return '#84cc16';
    return '#22c55e';
  };

  return (
    <>
      <Helmet>
        <title>Free Crypto Tools & Calculators | CoinsClarity</title>
        <meta name="description" content="Free crypto trading calculators: profit calculator, DCA calculator, position size calculator, liquidation price calculator, and more." />
        <link rel="canonical" href={`${window.location.origin}/tools`} />
      </Helmet>
      
      <CoinsNavbar />
      
      <Container fluid className="py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <Container>
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem' }}>
              <Calculator className="me-3" size={40} />
              Free Crypto Tools
            </h1>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Professional trading calculators to help you make better decisions. 
              100% free, no signup required.
            </p>
            
            {/* Fear & Greed Widget */}
            {fearGreedIndex && (
              <div className="d-inline-flex align-items-center gap-3 mt-4 px-4 py-3 rounded-pill" 
                style={{ backgroundColor: '#1e293b' }}>
                <span className="text-white">Market Sentiment:</span>
                <div className="d-flex align-items-center gap-2">
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: getFearGreedColor(fearGreedIndex.value),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: 'white'
                    }}
                  >
                    {fearGreedIndex.value}
                  </div>
                  <span style={{ color: getFearGreedColor(fearGreedIndex.value), fontWeight: '600' }}>
                    {fearGreedIndex.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="d-flex justify-content-center gap-2 flex-wrap mb-5">
            <Link to="/arbitrage" className="btn btn-warning rounded-pill px-4">
              🔄 Arbitrage Checker
            </Link>
            <Link to="/listings" className="btn btn-outline-dark rounded-pill px-4">
              🆕 New Listings
            </Link>
            <Link to="/events" className="btn btn-outline-dark rounded-pill px-4">
              📅 Crypto Events
            </Link>
          </div>

          <Tabs defaultActiveKey="profit" className="mb-4 nav-pills">
            {/* Profit Calculator */}
            <Tab eventKey="profit" title={<><DollarSign size={16} className="me-1" /> Profit Calculator</>}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <Row className="g-4">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Buy Price ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={buyPrice}
                          onChange={(e) => setBuyPrice(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Sell Price ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={sellPrice}
                          onChange={(e) => setSellPrice(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Investment ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={investAmount}
                          onChange={(e) => setInvestAmount(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="result-box mt-4 p-4 rounded-3 text-center" style={{
                    backgroundColor: profitResult.profit >= 0 ? '#ecfdf5' : '#fef2f2',
                    border: `2px solid ${profitResult.profit >= 0 ? '#10b981' : '#ef4444'}`
                  }}>
                    <h2 style={{ color: profitResult.profit >= 0 ? '#059669' : '#dc2626', fontWeight: '700' }}>
                      {profitResult.profit >= 0 ? '+' : ''}{profitResult.profit.toFixed(2)} USD
                    </h2>
                    <p className="mb-0">
                      <Badge bg={profitResult.percent >= 0 ? 'success' : 'danger'} className="me-2">
                        {profitResult.percent >= 0 ? '+' : ''}{profitResult.percent.toFixed(2)}%
                      </Badge>
                      <span className="text-muted">
                        ({profitResult.coins.toFixed(6)} coins)
                      </span>
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            {/* DCA Calculator */}
            <Tab eventKey="dca" title={<><PieChart size={16} className="me-1" /> DCA Calculator</>}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <Row className="g-4">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Investment Amount ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={dcaAmount}
                          onChange={(e) => setDcaAmount(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Frequency</Form.Label>
                        <Form.Select
                          value={dcaFrequency}
                          onChange={(e) => setDcaFrequency(e.target.value as any)}
                          className="rounded-3"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Duration (months)</Form.Label>
                        <Form.Control
                          type="number"
                          value={dcaDuration}
                          onChange={(e) => setDcaDuration(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="result-box mt-4 p-4 rounded-3" style={{ backgroundColor: '#eff6ff', border: '2px solid #3b82f6' }}>
                    <Row className="text-center">
                      <Col>
                        <h4 className="text-primary fw-bold">${dcaResult.total.toLocaleString()}</h4>
                        <p className="text-muted mb-0">Total Investment</p>
                      </Col>
                      <Col>
                        <h4 className="text-primary fw-bold">
                          {dcaFrequency === 'weekly' ? dcaDuration * 4 : dcaDuration}
                        </h4>
                        <p className="text-muted mb-0">Total Purchases</p>
                      </Col>
                    </Row>
                  </div>

                  <Alert variant="info" className="mt-4 rounded-3">
                    💡 <strong>DCA Tip:</strong> Dollar-cost averaging reduces the impact of volatility by spreading purchases over time.
                  </Alert>
                </Card.Body>
              </Card>
            </Tab>

            {/* Position Size Calculator */}
            <Tab eventKey="position" title={<><Target size={16} className="me-1" /> Position Size</>}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <Row className="g-4">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Account Size ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={accountSize}
                          onChange={(e) => setAccountSize(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Risk (%)</Form.Label>
                        <Form.Control
                          type="number"
                          value={riskPercent}
                          onChange={(e) => setRiskPercent(Number(e.target.value))}
                          className="rounded-3"
                          max={100}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Entry Price ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={entryPrice}
                          onChange={(e) => setEntryPrice(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Stop Loss ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="result-box mt-4 p-4 rounded-3" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
                    <Row className="text-center">
                      <Col md={4}>
                        <h4 className="fw-bold" style={{ color: '#b45309' }}>${positionResult.size.toFixed(2)}</h4>
                        <p className="text-muted mb-0">Position Size</p>
                      </Col>
                      <Col md={4}>
                        <h4 className="fw-bold" style={{ color: '#b45309' }}>{positionResult.coins.toFixed(4)}</h4>
                        <p className="text-muted mb-0">Number of Coins</p>
                      </Col>
                      <Col md={4}>
                        <h4 className="fw-bold" style={{ color: '#dc2626' }}>${positionResult.riskAmount.toFixed(2)}</h4>
                        <p className="text-muted mb-0">Risk Amount</p>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            {/* Liquidation Calculator */}
            <Tab eventKey="liquidation" title={<><Zap size={16} className="me-1" /> Liquidation Price</>}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <Row className="g-4">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Entry Price ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={liqEntryPrice}
                          onChange={(e) => setLiqEntryPrice(Number(e.target.value))}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Leverage (x)</Form.Label>
                        <Form.Control
                          type="number"
                          value={leverage}
                          onChange={(e) => setLeverage(Number(e.target.value))}
                          className="rounded-3"
                          min={1}
                          max={125}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Position</Form.Label>
                        <Form.Select
                          value={liqPosition}
                          onChange={(e) => setLiqPosition(e.target.value as any)}
                          className="rounded-3"
                        >
                          <option value="long">Long 📈</option>
                          <option value="short">Short 📉</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="result-box mt-4 p-4 rounded-3" style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}>
                    <div className="text-center">
                      <p className="text-muted mb-2">⚠️ Liquidation Price</p>
                      <h2 className="fw-bold" style={{ color: '#dc2626' }}>
                        ${liquidationPrice.toFixed(2)}
                      </h2>
                      <p className="mb-0 text-muted">
                        {liqPosition === 'long' 
                          ? `Price must stay above this level to avoid liquidation`
                          : `Price must stay below this level to avoid liquidation`
                        }
                      </p>
                    </div>
                  </div>

                  <Alert variant="danger" className="mt-4 rounded-3">
                    ⚠️ <strong>Warning:</strong> High leverage trading is extremely risky. This calculator provides estimates only. 
                    Actual liquidation prices may vary based on exchange, fees, and funding rates.
                  </Alert>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>

          {/* More Tools CTA */}
          <Card className="border-0 shadow-sm rounded-4 mt-5" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
            <Card.Body className="p-5 text-center">
              <h3 className="text-white mb-3">🔥 Want More Tools?</h3>
              <p className="text-light mb-4" style={{ opacity: 0.9 }}>
                Check out our Triangular Arbitrage Checker to find potential profit opportunities across exchanges
              </p>
              <Link to="/arbitrage" className="btn btn-warning btn-lg rounded-pill px-5">
                <TrendingUp size={20} className="me-2" />
                Open Arbitrage Checker
              </Link>
            </Card.Body>
          </Card>
        </Container>
      </Container>
      
      <Footer />
    </>
  );
};

export default CryptoTools;

