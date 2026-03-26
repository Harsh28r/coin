import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Alert, Badge } from 'react-bootstrap';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const ImpermanentLossCalc: React.FC = () => {
  const [initialPrice, setInitialPrice] = useState<number>(3000);
  const [currentPrice, setCurrentPrice] = useState<number>(4000);
  const [investmentAmount, setInvestmentAmount] = useState<number>(10000);
  const [result, setResult] = useState({
    priceRatio: 0,
    impermanentLoss: 0,
    lpValue: 0,
    hodlValue: 0,
    lossUsd: 0,
  });

  useEffect(() => {
    // Calculate impermanent loss
    const priceRatio = currentPrice / initialPrice;
    
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
    const ilPercent = il * 100;
    
    // Calculate values
    // Initial: 50% ETH, 50% USD
    const initialEthAmount = (investmentAmount / 2) / initialPrice;
    const initialUsdAmount = investmentAmount / 2;
    
    // HODL value
    const hodlValue = (initialEthAmount * currentPrice) + initialUsdAmount;
    
    // LP value (affected by IL)
    const lpValue = hodlValue * (1 + il);
    
    // Loss in USD
    const lossUsd = hodlValue - lpValue;

    setResult({
      priceRatio,
      impermanentLoss: ilPercent,
      lpValue,
      hodlValue,
      lossUsd,
    });
  }, [initialPrice, currentPrice, investmentAmount]);

  const getILSeverity = (il: number) => {
    const absIL = Math.abs(il);
    if (absIL < 1) return { color: '#22c55e', label: 'Minimal', bg: '#f0fdf4' };
    if (absIL < 3) return { color: '#f59e0b', label: 'Moderate', bg: '#fffbeb' };
    if (absIL < 5) return { color: '#f97316', label: 'Significant', bg: '#fff7ed' };
    return { color: '#ef4444', label: 'Severe', bg: '#fef2f2' };
  };

  const severity = getILSeverity(result.impermanentLoss);

  // Common price scenarios
  const scenarios = [
    { label: '2x Price', ratio: 2 },
    { label: '1.5x Price', ratio: 1.5 },
    { label: '1.25x Price', ratio: 1.25 },
    { label: '0.75x Price', ratio: 0.75 },
    { label: '0.5x Price', ratio: 0.5 },
    { label: '0.25x Price', ratio: 0.25 },
  ];

  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Header className="bg-transparent border-0 py-3">
        <h5 className="mb-0 fw-bold">
          <Calculator size={20} className="me-2" />
          Impermanent Loss Calculator
        </h5>
        <small className="text-muted">For liquidity providers (50/50 pools)</small>
      </Card.Header>
      <Card.Body>
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold small">Initial Price ($)</Form.Label>
              <Form.Control
                type="number"
                value={initialPrice}
                onChange={(e) => setInitialPrice(Number(e.target.value))}
                className="rounded-3"
              />
              <Form.Text className="text-muted">Price when you entered LP</Form.Text>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold small">Current Price ($)</Form.Label>
              <Form.Control
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Number(e.target.value))}
                className="rounded-3"
              />
              <Form.Text className="text-muted">Current market price</Form.Text>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-semibold small">Investment ($)</Form.Label>
              <Form.Control
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="rounded-3"
              />
              <Form.Text className="text-muted">Total LP deposit</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {/* Quick Scenarios */}
        <div className="mb-4">
          <small className="text-muted d-block mb-2">Quick scenarios:</small>
          <div className="d-flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <button
                key={s.label}
                className="btn btn-sm btn-outline-secondary rounded-pill"
                onClick={() => setCurrentPrice(initialPrice * s.ratio)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div 
          className="result-box p-4 rounded-3 text-center"
          style={{ backgroundColor: severity.bg, border: `2px solid ${severity.color}` }}
        >
          <div className="mb-3">
            <Badge bg="dark" className="rounded-pill px-3 py-2 mb-2">
              Price changed {result.priceRatio > 1 ? '+' : ''}{((result.priceRatio - 1) * 100).toFixed(1)}%
            </Badge>
          </div>
          
          <h2 style={{ color: severity.color, fontWeight: '700' }}>
            {result.impermanentLoss.toFixed(2)}%
          </h2>
          <p className="mb-3" style={{ color: severity.color }}>
            Impermanent Loss ({severity.label})
          </p>

          <Row className="text-start">
            <Col xs={6}>
              <div className="p-3 rounded-3 bg-white">
                <small className="text-muted d-block">If you HODL'd</small>
                <span className="fw-bold fs-5">${result.hodlValue.toFixed(2)}</span>
              </div>
            </Col>
            <Col xs={6}>
              <div className="p-3 rounded-3 bg-white">
                <small className="text-muted d-block">LP Value</small>
                <span className="fw-bold fs-5">${result.lpValue.toFixed(2)}</span>
              </div>
            </Col>
          </Row>

          <div className="mt-3 p-3 rounded-3 bg-white">
            <span className="text-muted">Loss vs HODL: </span>
            <span className="fw-bold text-danger">
              -${result.lossUsd.toFixed(2)}
            </span>
          </div>
        </div>

        {/* IL Reference Table */}
        <div className="mt-4">
          <h6 className="mb-3">📊 Impermanent Loss Reference</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0">
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th>Price Change</th>
                  <th>IL %</th>
                  <th>Price Change</th>
                  <th>IL %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>+25%</td>
                  <td className="text-warning">0.6%</td>
                  <td>-25%</td>
                  <td className="text-warning">0.6%</td>
                </tr>
                <tr>
                  <td>+50%</td>
                  <td className="text-warning">2.0%</td>
                  <td>-50%</td>
                  <td className="text-danger">5.7%</td>
                </tr>
                <tr>
                  <td>+100% (2x)</td>
                  <td className="text-danger">5.7%</td>
                  <td>-75%</td>
                  <td className="text-danger">20.0%</td>
                </tr>
                <tr>
                  <td>+200% (3x)</td>
                  <td className="text-danger">13.4%</td>
                  <td>-90%</td>
                  <td className="text-danger">42.5%</td>
                </tr>
                <tr>
                  <td>+400% (5x)</td>
                  <td className="text-danger">25.5%</td>
                  <td>-95%</td>
                  <td className="text-danger">56.9%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Alert variant="info" className="mt-4 mb-0 rounded-3">
          💡 <strong>Tip:</strong> IL is "impermanent" because it only realizes if you withdraw. 
          Trading fees earned can offset IL. High-volume pools may still be profitable despite IL.
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default ImpermanentLossCalc;

