import React, { useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  category?: string;
}

const QuizSection: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);

  const questions: QuizQuestion[] = useMemo(
    () => [
      {
        id: 1,
        question: 'Which of the following are key features of a blockchain?',
        options: ['High TPS only', 'Transparency', 'Central authority', 'Single server storage'],
        correctIndex: 1,
        explanation: 'Blockchains are transparent and append-only; anyone can verify the data history.',
        category: 'Basics',
      },
      {
        id: 2,
        question: 'What does a seed phrase do?',
        options: ['Speeds up transactions', 'Recovers your wallet', 'Reduces gas fees', 'Changes consensus'],
        correctIndex: 1,
        explanation: 'Your seed phrase is the master key to your wallet—keep it secret and offline.',
        category: 'Security',
      },
      {
        id: 3,
        question: 'Coins vs. Tokens — which is true?',
        options: ['Tokens have their own L1', 'Coins always run on Ethereum', 'Tokens use an existing chain', 'Coins are always stable'],
        correctIndex: 2,
        explanation: 'Tokens are issued on existing chains (e.g., ERC‑20 on Ethereum); coins run on their own chain.',
        category: 'Concepts',
      },
      {
        id: 4,
        question: 'What are gas fees primarily for?',
        options: ['Paying validators for securing the network', 'Paying exchanges for listings', 'Paying miners to freeze funds', 'Buying NFTs'],
        correctIndex: 0,
        explanation: 'Gas compensates validators/miners for computing and securing the network.',
        category: 'Transactions',
      },
      {
        id: 5,
        question: 'DeFi DEXs often use AMMs. What do LPs earn?',
        options: ['Block rewards only', 'Trading fees', 'KYC points', 'CeFi interest'],
        correctIndex: 1,
        explanation: 'Liquidity providers earn a share of trading fees in AMM-based DEXs.',
        category: 'DeFi',
      },
      {
        id: 6,
        question: 'Which practice improves crypto security the most?',
        options: ['Reusing passwords', 'Sharing seed with support', 'Hardware wallet for long-term storage', 'Clicking unknown airdrop links'],
        correctIndex: 2,
        explanation: 'Use hardware wallets, unique passwords, and never share your seed phrase.',
        category: 'Security',
      },
      {
        id: 7,
        question: 'What does “immutable ledger” imply?',
        options: ['Data can be edited by admins', 'Past blocks are tamper-resistant', 'Faster than all databases', 'Zero fees forever'],
        correctIndex: 1,
        explanation: 'Once finalized, historical blocks are practically unchangeable.',
        category: 'Basics',
      },
      {
        id: 8,
        question: 'Layer 2 (L2) networks help by…',
        options: ['Replacing L1 consensus', 'Reducing costs and increasing throughput', 'Custodying all L1 funds', 'Eliminating validators'],
        correctIndex: 1,
        explanation: 'L2s scale transactions while inheriting security from the L1.',
        category: 'Scaling',
      },
    ],
    []
  );

  const total = questions.length;
  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (answered || selectedIndex === null) return;
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    setAnswered(true);
    // brief delay before enabling next
    setTimeout(() => {}, 300);
  };

  const handleNext = () => {
    if (!answered) return;
    if (currentIndex + 1 < total) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswered(false);
    setFinished(false);
  };

  return (
    <Container className="my-4">
      <Card className="border-0" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Card.Header className="bg-white border-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="warning" text="dark">Quiz</Badge>
              <span className="text-muted small">{currentIndex + 1} / {total}</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted small">Score</span>
              <span className="text-white px-3 py-1 rounded-pill" style={{ backgroundColor: '#f90' }}>{score}</span>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar now={((currentIndex) / total) * 100} style={{ height: 6 }} />
          </div>
        </Card.Header>
        <Card.Body className="p-3">
          {!finished ? (
            <>
              <div className="mb-3 d-flex align-items-center gap-2">
                {currentQuestion.category && (
                  <Badge bg="light" text="dark" className="border">{currentQuestion.category}</Badge>
                )}
                <h5 className="m-0">{currentQuestion.question}</h5>
              </div>
              <Row className="g-3 mb-2 justify-content-center">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const isCorrect = answered && index === currentQuestion.correctIndex;
                  const isIncorrect = answered && isSelected && index !== currentQuestion.correctIndex;
                  const variant = isCorrect ? 'success' : isIncorrect ? 'danger' : isSelected ? 'warning' : 'light';
                  return (
                    <Col xs={12} md={6} key={index}>
                      <Button
                        variant={variant}
                        className="w-100 py-3 text-start px-4 rounded-3"
                        onClick={() => !answered && setSelectedIndex(index)}
                        style={{
                          backgroundColor: isCorrect ? '#16a34a' : isIncorrect ? '#ef4444' : isSelected ? '#f90' : '#f8f9fa',
                          border: '1px solid #dee2e6',
                          color: isCorrect || isIncorrect || isSelected ? 'white' : 'inherit',
                          fontSize: '1.05rem'
                        }}
                      >
                        {option}
                      </Button>
                    </Col>
                  );
                })}
              </Row>
              {answered && currentQuestion.explanation && (
                <div className="alert alert-info py-2 small" role="alert">
                  {currentQuestion.explanation}
                </div>
              )}
              <div className="d-flex justify-content-center gap-2">
                {!answered ? (
                  <Button
                    variant="warning"
                    className="px-3 py-2 text-white rounded-pill"
                    onClick={handleSubmit}
                    disabled={selectedIndex === null}
                    style={{ backgroundColor: '#f90', border: 'none' }}
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    variant="dark"
                    className="px-3 py-2 rounded-pill"
                    onClick={handleNext}
                  >
                    {currentIndex + 1 < total ? 'Next Question' : 'See Results'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="display-6 mb-2">{score}/{total}</div>
              <div className="mb-3">{score === total ? 'Perfect! 🎉' : score >= Math.ceil(total * 0.7) ? 'Great job! 🚀' : 'Keep learning! 💡'}</div>
              <Button variant="warning" className="text-white" style={{ backgroundColor: '#f90', border: 'none' }} onClick={handleRestart}>
                Try Again
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      <style>
        {`
          .btn-light:hover {
            background-color: #e2e6ea;
          }
          .btn-warning:hover {
            background-color: #e68a00 !important;
          }
          .alert-info {
            background: #eff6ff;
            border-color: #dbeafe;
            color: #1d4ed8;
          }
          @media (max-width: 576px) {
            .text-center h3 {
              font-size: 0.8rem;
              padding: 0;
              margin: 0;
              min-height: 60px;
            }
            .btn-light, .btn-warning {
              font-size: 0.7rem;
              padding: 4px;
              width: 100%;
            }
            .text-center {
              margin-bottom: 5px;
            }
            .card-body {
              padding: 5px;
            }
            .bg-warning {
              font-size: 0.7rem;
              padding: 4px;
            }
            .row {
              flex-direction: column;
            }
            .col {
              margin-bottom: 8px;
            }
            input, textarea {
              font-size: 0.7rem;
              padding: 4px;
              width: 100%;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default QuizSection;