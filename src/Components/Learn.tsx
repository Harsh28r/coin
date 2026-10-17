import React from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { BookOpen, Wallet, Link as LinkIcon, Cpu, Activity, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Learn.css';

const Learn: React.FC = () => {
  const topics = [
    {
      icon: <BookOpen size={18} />,
      title: 'What is Blockchain?',
      tag: 'Basics',
      points: ['Distributed ledger', 'Blocks linked by hashes', 'Tamper-resistant design'],
      href: 'https://ethereum.org/en/developers/docs/intro-to-ethereum/',
    },
    {
      icon: <Wallet size={18} />,
      title: 'Wallets & Seed Phrases',
      tag: 'Security',
      points: ['Custodial vs self-custody', 'Never share your seed', 'Prefer hardware wallets'],
      href: 'https://www.ledger.com/academy/security/what-is-a-seed-phrase',
    },
    {
      icon: <Cpu size={18} />,
      title: 'Smart Contracts',
      tag: 'Dev',
      points: ['Code as agreements', 'Runs on-chain', 'Triggers via transactions'],
      href: 'https://ethereum.org/en/developers/docs/smart-contracts/',
    },
    {
      icon: <Activity size={18} />,
      title: 'Gas & Transactions',
      tag: 'Network',
      points: ['Validator incentives', 'Higher fee = faster', 'L2s cut cost'],
      href: 'https://ethereum.org/en/developers/docs/gas/',
    },
    {
      icon: <LinkIcon size={18} />,
      title: 'DeFi Basics',
      tag: 'Finance',
      points: ['DEXes & AMMs', 'LP fees & IL', 'Lending & yield'],
      href: 'https://www.coindesk.com/learn/what-is-defi/',
    },
    {
      icon: <Lock size={18} />,
      title: 'Staying Safe',
      tag: 'Security',
      points: ['Beware phishing', 'Verify contracts/URLs', 'Use 2FA & managers'],
      href: 'https://www.binance.com/en/academy/t/crypto-security',
    },
  ];

  return (
    <div className="learn-page">
      <div className="learn-hero">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={9}>
              <h1 className="learn-hero__title">Learn a Little</h1>
              <p className="learn-hero__dek">
                Fast, friendly primers to get up to speed on crypto fundamentals.
              </p>
              <div className="learn-hero__path">
                <Badge className="learn-badge">Beginner Path</Badge>
                <div className="learn-hero__progress d-none d-md-flex">
                  <ProgressBar now={30} className="learn-progress w-100" />
                  <small>30%</small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="learn-body pb-5">
        <Row className="mb-3">
          <Col className="text-start">
            <h5 className="learn-section__title">Start here</h5>
            <p className="learn-section__dek">Short reads with takeaways and trusted links.</p>
          </Col>
        </Row>

        <Row xs={1} sm={2} lg={3} className="g-4">
          {topics.map((t, idx) => (
            <Col key={idx}>
              <Card className="learn-card h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-start justify-content-between mb-3 gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="learn-card__icon">{t.icon}</div>
                      <h6 className="learn-card__title mb-0">{t.title}</h6>
                    </div>
                    <Badge className="learn-tag">{t.tag}</Badge>
                  </div>
                  <ul className="learn-card__points">
                    {t.points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  <a
                    className="learn-card__cta"
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more
                  </a>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="justify-content-center mt-5">
          <Col md={10} lg={8}>
            <Card className="learn-cta">
              <Card.Body className="p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h5 className="learn-cta__title mb-1">Keep exploring</h5>
                  <small className="learn-cta__dek">
                    Check out trending news and quick tips on the home page.
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <Link to="/" className="btn learn-btn-primary">
                    Home
                  </Link>
                  <Link to="/blog" className="btn learn-btn-ghost">
                    Blog
                  </Link>
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
