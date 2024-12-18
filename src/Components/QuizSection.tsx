import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

  const QuizSection: React.FC = () => {
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion: QuizQuestion = {
    id: 1,
    question: "Which Of The Following Features Are Important For Blockchain?",
    options: ["Database Security", "Transparency", "Immutability", "all of the above"]
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === "all of the above") {
      setScore(prevScore => prevScore + 1);
    }
    setSelectedAnswer(null);
  };

  return (
    <Container className="my-5 h-md-3 h-sm-2  ">
      <Card className="border-0 h-sm-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Card.Body className="p-3 text-center">
          <div className="text-center ">
            <span className=" text-white px-4 py-3 rounded-pill " style={{ backgroundColor: '#f90' }}>
              Your Score : {score}
            </span>
          
          <h3 className="text-center mb-5 shadow mt-0 rounded-5 h5 h-md-3  py-lg-5" style={{minHeight: '87px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
            {currentQuestion.id}. {currentQuestion.question}
          </h3>
          </div>
          <Row className="g-3 mb-4 justify-content-center">
            {currentQuestion.options.map((option, index) => (
              <Col xs={12} md={6} className="mb-3" key={index}>
                <Button
                  variant={selectedAnswer === option ? "warning" : "light"}
                  className="w-100 py-3 text-start px-4 rounded-3 "
                  onClick={() => setSelectedAnswer(option)}
                  style={{
                    backgroundColor: selectedAnswer === option ? '#f90' : '#f8f9fa',
                    border: '1px solid #dee2e6',
                    color: selectedAnswer === option ? 'white' : 'inherit',
                    fontSize: '1.2rem'
                  }}
                >
                  {option}
                </Button>
              </Col>
            ))}
          </Row>
          <div className="text-center">
            <Button
              variant="warning"
              className="px-3 py-3 text-white rounded-pill"
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              style={{ backgroundColor: '#f90', border: 'none' }}
            >
              Submit Answer
            </Button>
          </div>
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
            .text-center h3 {
              min-height: 180px;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default QuizSection;