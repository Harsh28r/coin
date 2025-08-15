import React from 'react';
import { Container, Row, Col, Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { BookOpen, Shield, Wallet, Link as LinkIcon, Cpu, Activity, Lock } from 'lucide-react';

const Learn: React.FC = () => {
  const topics = [
    {
      icon: <BookOpen size={20} />, title: 'What is Blockchain?', tag: 'Basics',
      points: ['Distributed ledger', 'Blocks linked by hashes', 'Tamper-resistant design'],
      href: 'https://ethereum.org/en/developers/docs/intro-to-ethereum/'
    },
    {
      icon: <Wallet size={20} />, title: 'Wallets & Seed Phrases', tag: 'Security',
      points: ['Custodial vs self-custody', 'Never share your seed', 'Prefer hardware wallets'],
      href: 'https://www.ledger.com/academy/security/what-is-a-seed-phrase'
    },
    {
      icon: <Cpu size={20} />, title: 'Smart Contracts', tag: 'Dev',
      points: ['Code as agreements', 'Runs on-chain', 'Triggers via transactions'],
      href: 'https://ethereum.org/en/developers/docs/smart-contracts/'
    },
    {
      icon: <Activity size={20} />, title: 'Gas & Transactions', tag: 'Network',
      points: ['Validator incentives', 'Higher fee = faster', 'L2s cut cost'],
      href: 'https://ethereum.org/en/developers/docs/gas/'
    },
    {
      icon: <LinkIcon size={20} />, title: 'DeFi Basics', tag: 'Finance',
      points: ['DEXes & AMMs', 'LP fees & IL', 'Lending & yield'],
      href: 'https://www.coindesk.com/learn/what-is-defi/'
    },
    {
      icon: <Lock size={20} />, title: 'Staying Safe', tag: 'Security',
      points: ['Beware phishing', 'Verify contracts/URLs', 'Use 2FA & managers'],
      href: 'https://www.binance.com/en/academy/t/crypto-security'
    }
  ];

  return (
    <div>
      {/* Hero */}
      <div
        className="py-5 mb-4"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)',
          color: '#1f2937',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px'
        }}
      >
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={9}>
              <h1 className="fw-bold mb-2" style={{ letterSpacing: '0.2px' }}>Learn a Little</h1>
              <p className="mb-3 text-muted" style={{ opacity: 0.9 }}>Fast, friendly primers to get up to speed on crypto fundamentals.</p>
              <div className="d-flex align-items-center justify-content-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="light" text="dark">Beginner Path</Badge>
                </div>
                <div className="d-none d-md-flex align-items-center gap-2" style={{ minWidth: 200 }}>
                  <ProgressBar now={30} variant="warning" className="w-100" />
                  <small>30%</small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Topics Grid */}
      <Container className="pb-5">
        <Row className="mb-3">
          <Col className="text-start">
            <h5 className="fw-semibold mb-2">Start here</h5>
            <p className="text-muted mb-0">Short reads with takeaways and trusted links.</p>
          </Col>
        </Row>

        <Row xs={1} sm={2} lg={3} className="g-4">
          {topics.map((t, idx) => (
            <Col key={idx}>
              <Card className="border-0 shadow-sm h-100 rounded-4" style={{ overflow: 'hidden' }}>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: '#f8fafc' }}>
                        {t.icon}
                      </div>
                      <h6 className="mb-0 fw-bold">{t.title}</h6>
                    </div>
                    <Badge bg="light" text="dark">{t.tag}</Badge>
                  </div>
                  <ul className="text-muted mb-3" style={{ paddingLeft: '1.2rem' }}>
                    {t.points.map((p, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{p}</li>
                    ))}
                  </ul>
                  <div className="d-flex">
                    <Button size="sm" variant="outline-primary" href={t.href} target="_blank" rel="noreferrer">
                      Read more
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* CTA */}
        <Row className="justify-content-center mt-5">
          <Col md={10} lg={8}>
            <Card className="border-0 shadow-sm rounded-4" style={{ background: 'linear-gradient(135deg,#fff7ed 0%, #eff6ff 100%)' }}>
              <Card.Body className="p-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h5 className="fw-semibold mb-1">Keep exploring</h5>
                  <small className="text-muted">Check out trending news and quick tips on the home page.</small>
                </div>
                <div className="d-flex gap-2">
                  <Button as="a" href="/" variant="warning">Home</Button>
                  <Button as="a" href="/blog" variant="outline-secondary">Blog</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Learn;


