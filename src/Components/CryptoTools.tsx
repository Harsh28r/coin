import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Tab, Tabs, Badge, Alert, Nav } from 'react-bootstrap';
import { Calculator, TrendingUp, Percent, DollarSign, Activity, Zap, Target, PieChart, Fuel, Lock, Waves, BarChart3 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import CoinsNavbar from './navbar';
import Footer from './footer';

// Import trading tools
import { 
  FundingRates, 
  CrossExchangeArbitrage, 
  WhaleTracker, 
  GasTracker, 
  TokenUnlocks,
  ImpermanentLossCalc,
  StakingComparison,
  RSIScanner,
  LiquidationHeatmap
} from './TradingTools';

const CryptoTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trading');
  
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
        // Try direct API first (usually works), fallback to CORS proxy
        let res;
        try {
          res = await fetch('https://api.alternative.me/fng/');
        } catch {
          res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.alternative.me/fng/')}`);
        }
        const data = await res.json();
        if (data.data?.[0]) {
          setFearGreedIndex({
            value: parseInt(data.data[0].value),
            label: data.data[0].value_classification
          });
        }
      } catch (err) {
        console.error('Failed to fetch fear & greed index');
        // Use default fallback
        setFearGreedIndex({ value: 50, label: 'Neutral' });
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
        <title>Free Crypto Trading Tools & Calculators | CoinsClarity</title>
        <meta name="description" content="Professional crypto trading tools: arbitrage scanner, funding rates, whale tracker, RSI scanner, liquidation heatmap, staking APY comparison, profit calculator, DCA calculator. 100% free, no signup." />
        <link rel="canonical" href={`${window.location.origin}/tools`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free Crypto Trading Tools & Calculators | CoinsClarity" />
        <meta property="og:description" content="10+ professional crypto trading tools: RSI scanner, funding rates, arbitrage checker, liquidation heatmap, staking APY comparison. 100% free." />
        <meta property="og:url" content={`${window.location.origin}/tools`} />
        <meta property="og:image" content={`${window.location.origin}/logo3.png`} />
        <meta property="og:site_name" content="CoinsClarity" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Crypto Trading Tools | CoinsClarity" />
        <meta name="twitter:description" content="Professional crypto calculators & trading tools. RSI scanner, funding rates, arbitrage, staking APY. Free forever." />
        <meta name="twitter:image" content={`${window.location.origin}/logo3.png`} />
        
        {/* Additional SEO */}
        <meta name="keywords" content="crypto calculator, bitcoin profit calculator, DCA calculator, crypto arbitrage, funding rates, RSI scanner, liquidation calculator, staking APY, gas tracker, crypto tools free" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="CoinsClarity" />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "CoinsClarity Crypto Tools",
          "description": "Free professional crypto trading tools including profit calculator, DCA calculator, RSI scanner, funding rates monitor, and more.",
          "url": `${window.location.origin}/tools`,
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Profit Calculator",
            "DCA Calculator", 
            "Position Size Calculator",
            "Liquidation Price Calculator",
            "RSI Scanner",
            "Funding Rates Monitor",
            "Cross-Exchange Arbitrage",
            "Whale Tracker",
            "Gas Tracker",
            "Staking APY Comparison",
            "Token Unlock Calendar"
          ],
          "publisher": {
            "@type": "Organization",
            "name": "CoinsClarity",
            "url": "https://coinsclarity.com"
          }
        })}</script>
        
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://coinsclarity.com" },
            { "@type": "ListItem", "position": 2, "name": "Crypto Tools", "item": "https://coinsclarity.com/tools" }
          ]
        })}</script>
        
        {/* FAQ Schema for Rich Snippets */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is a crypto profit calculator?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A crypto profit calculator helps you determine potential gains or losses from trading. Enter your buy price, sell price, and investment amount to instantly see your profit percentage and total returns."
              }
            },
            {
              "@type": "Question",
              "name": "What is DCA (Dollar Cost Averaging) in crypto?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "DCA is an investment strategy where you invest a fixed amount at regular intervals regardless of price. This reduces the impact of volatility and lowers your average cost over time. Our DCA calculator helps plan your investment schedule."
              }
            },
            {
              "@type": "Question",
              "name": "What are funding rates in crypto trading?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Funding rates are periodic payments between long and short traders in perpetual futures markets. Positive rates mean longs pay shorts (bullish sentiment), negative rates mean shorts pay longs. Our tool shows live funding rates from major exchanges."
              }
            },
            {
              "@type": "Question",
              "name": "What is RSI in crypto trading?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "RSI (Relative Strength Index) measures price momentum on a scale of 0-100. Below 30 indicates oversold conditions (potential buy signal), above 70 indicates overbought (potential sell signal). Our RSI scanner monitors multiple coins in real-time."
              }
            },
            {
              "@type": "Question",
              "name": "What is triangular arbitrage?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Triangular arbitrage exploits price differences between three trading pairs. For example: BTC→ETH→USDT→BTC. If the final amount exceeds the starting amount after fees, there's a profit opportunity. Our calculator checks these opportunities in real-time."
              }
            }
          ]
        })}</script>
      </Helmet>
      
      <CoinsNavbar />
      
      <Container fluid className="py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <Container>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="fw-bold mb-2" style={{ fontSize: '2rem' }}>
              🛠️ Crypto Trading Tools
            </h1>
            <p className="text-muted mb-3">
              Professional trading tools. 100% free, no signup required.
            </p>
            
            {/* Fear & Greed Widget */}
            {fearGreedIndex && (
              <div className="d-inline-flex align-items-center gap-3 px-4 py-2 rounded-pill mb-3" 
                style={{ backgroundColor: '#1e293b' }}>
                <span className="text-white small">Market Sentiment:</span>
                <div className="d-flex align-items-center gap-2">
                  <div 
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: getFearGreedColor(fearGreedIndex.value),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: 'white',
                      fontSize: '0.9rem'
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

          {/* Navigation Tabs */}
          <Nav variant="pills" className="justify-content-center mb-4 flex-wrap gap-2">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'trading'} 
                onClick={() => setActiveTab('trading')}
                className="rounded-pill px-4"
              >
                📊 Trading Signals
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'market'} 
                onClick={() => setActiveTab('market')}
                className="rounded-pill px-4"
              >
                🌊 Market Data
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'defi'} 
                onClick={() => setActiveTab('defi')}
                className="rounded-pill px-4"
              >
                🏦 DeFi Tools
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'calculators'} 
                onClick={() => setActiveTab('calculators')}
                className="rounded-pill px-4"
              >
                🧮 Calculators
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Trading Signals Tab */}
          {activeTab === 'trading' && (
            <Row className="g-4">
              <Col lg={6}>
                <RSIScanner />
              </Col>
              <Col lg={6}>
                <FundingRates />
              </Col>
              <Col xs={12}>
                <LiquidationHeatmap />
              </Col>
            </Row>
          )}

          {/* Market Data Tab */}
          {activeTab === 'market' && (
            <Row className="g-4">
              <Col lg={6}>
                <CrossExchangeArbitrage />
              </Col>
              <Col lg={6}>
                <WhaleTracker />
              </Col>
              <Col lg={6}>
                <TokenUnlocks />
              </Col>
              <Col lg={6}>
                <GasTracker />
              </Col>
            </Row>
          )}

          {/* DeFi Tools Tab */}
          {activeTab === 'defi' && (
            <Row className="g-4">
              <Col lg={6}>
                <ImpermanentLossCalc />
              </Col>
              <Col lg={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Body className="d-flex flex-column justify-content-center align-items-center py-5">
                    <h4 className="mb-3">🔄 Triangular Arbitrage</h4>
                    <p className="text-muted text-center mb-4">
                      Find profit opportunities across token pairs with our advanced arbitrage calculator
                    </p>
                    <Link to="/arbitrage" className="btn btn-warning btn-lg rounded-pill px-5">
                      Open Arbitrage Checker →
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12}>
                <StakingComparison />
              </Col>
            </Row>
          )}

          {/* Calculators Tab */}
          {activeTab === 'calculators' && (
            <Row className="g-4">
              {/* Profit Calculator */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold">
                      <DollarSign size={20} className="me-2" />
                      Profit Calculator
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3 mb-4">
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Buy ($)</Form.Label>
                          <Form.Control
                            type="number"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(Number(e.target.value))}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Sell ($)</Form.Label>
                          <Form.Control
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(Number(e.target.value))}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Invest ($)</Form.Label>
                          <Form.Control
                            type="number"
                            value={investAmount}
                            onChange={(e) => setInvestAmount(Number(e.target.value))}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="result-box p-3 rounded-3 text-center" style={{
                      backgroundColor: profitResult.profit >= 0 ? '#ecfdf5' : '#fef2f2',
                      border: `2px solid ${profitResult.profit >= 0 ? '#10b981' : '#ef4444'}`
                    }}>
                      <h3 style={{ color: profitResult.profit >= 0 ? '#059669' : '#dc2626', fontWeight: '700' }}>
                        {profitResult.profit >= 0 ? '+' : ''}{profitResult.profit.toFixed(2)} USD
                      </h3>
                      <Badge bg={profitResult.percent >= 0 ? 'success' : 'danger'}>
                        {profitResult.percent >= 0 ? '+' : ''}{profitResult.percent.toFixed(2)}%
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* DCA Calculator */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold">
                      <PieChart size={20} className="me-2" />
                      DCA Calculator
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3 mb-4">
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Amount ($)</Form.Label>
                          <Form.Control
                            type="number"
                            value={dcaAmount}
                            onChange={(e) => setDcaAmount(Number(e.target.value))}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Frequency</Form.Label>
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
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Months</Form.Label>
                          <Form.Control
                            type="number"
                            value={dcaDuration}
                            onChange={(e) => setDcaDuration(Number(e.target.value))}
                            className="rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="result-box p-3 rounded-3" style={{ backgroundColor: '#eff6ff', border: '2px solid #3b82f6' }}>
                      <Row className="text-center">
                        <Col>
                          <h4 className="text-primary fw-bold mb-0">${dcaResult.total.toLocaleString()}</h4>
                          <small className="text-muted">Total Investment</small>
                        </Col>
                        <Col>
                          <h4 className="text-primary fw-bold mb-0">
                            {dcaFrequency === 'weekly' ? dcaDuration * 4 : dcaDuration}
                          </h4>
                          <small className="text-muted">Purchases</small>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Position Size Calculator */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold">
                      <Target size={20} className="me-2" />
                      Position Size
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2 mb-3">
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Account ($)</Form.Label>
                          <Form.Control size="sm" type="number" value={accountSize} onChange={(e) => setAccountSize(Number(e.target.value))} className="rounded-3" />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Risk (%)</Form.Label>
                          <Form.Control size="sm" type="number" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} className="rounded-3" />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Entry ($)</Form.Label>
                          <Form.Control size="sm" type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} className="rounded-3" />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Stop Loss ($)</Form.Label>
                          <Form.Control size="sm" type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className="rounded-3" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="result-box p-3 rounded-3" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
                      <Row className="text-center">
                        <Col xs={4}>
                          <h5 className="fw-bold mb-0" style={{ color: '#b45309' }}>${positionResult.size.toFixed(0)}</h5>
                          <small className="text-muted">Position</small>
                        </Col>
                        <Col xs={4}>
                          <h5 className="fw-bold mb-0" style={{ color: '#b45309' }}>{positionResult.coins.toFixed(2)}</h5>
                          <small className="text-muted">Coins</small>
                        </Col>
                        <Col xs={4}>
                          <h5 className="fw-bold mb-0" style={{ color: '#dc2626' }}>${positionResult.riskAmount.toFixed(0)}</h5>
                          <small className="text-muted">At Risk</small>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Liquidation Calculator */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-transparent border-0 py-3">
                    <h5 className="mb-0 fw-bold">
                      <Zap size={20} className="me-2" />
                      Liquidation Price
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2 mb-3">
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Entry ($)</Form.Label>
                          <Form.Control size="sm" type="number" value={liqEntryPrice} onChange={(e) => setLiqEntryPrice(Number(e.target.value))} className="rounded-3" />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Leverage</Form.Label>
                          <Form.Control size="sm" type="number" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="rounded-3" min={1} max={125} />
                        </Form.Group>
                      </Col>
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold small">Position</Form.Label>
                          <Form.Select size="sm" value={liqPosition} onChange={(e) => setLiqPosition(e.target.value as any)} className="rounded-3">
                            <option value="long">Long 📈</option>
                            <option value="short">Short 📉</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="result-box p-3 rounded-3" style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}>
                      <div className="text-center">
                        <small className="text-muted">⚠️ Liquidation Price</small>
                        <h3 className="fw-bold mb-0" style={{ color: '#dc2626' }}>
                          ${liquidationPrice.toFixed(2)}
                        </h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* CTA */}
          <Card className="border-0 shadow-sm rounded-4 mt-5" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
            <Card.Body className="p-4 text-center">
              <h4 className="text-white mb-2">🔥 More Tools Coming Soon</h4>
              <p className="text-light mb-3" style={{ opacity: 0.9 }}>
                Bookmark this page and check back for new trading tools
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Link to="/arbitrage" className="btn btn-warning rounded-pill px-4">
                  Triangular Arbitrage →
                </Link>
                <Link to="/listings" className="btn btn-outline-light rounded-pill px-4">
                  New Listings
                </Link>
                <Link to="/events" className="btn btn-outline-light rounded-pill px-4">
                  Crypto Events
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </Container>
      
      <Footer />
    </>
  );
};

export default CryptoTools;
