import React from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { FacebookIcon as Facebook, Twitter, PinIcon as Pinterest, Instagram, Youtube, DiscIcon as Discord } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/inter';

const Footer: React.FC = () => {
  return (
    <footer className="text-light py-5 mt-5" style={{ backgroundColor: '#333333' }}>
      <Container   style={{ width: '100%', maxWidth: '1440px' }}>
        <Row className="mb-5  " style={{ maxWidth: '100%' }}>
          <Col md={5} className="mb-4 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }}>
            <img 
              src="/logo.png" 
              alt="CoinsCapture Logo" 
              className="mb-4" 
              style={{ width: '250px', height: 'auto' }} 
            />
            <p className="text-light small fs-6" style={{ textAlign: 'left', lineHeight: '1.2' }}>
              CoinsCapture is a versatile platform that shares the best, real-time, highest quality cryptocurrency market data.
              With an easy-to-use API, charts, and cryptocurrency glossary.
            </p>
            <p className="text-light mt-4 small fs-6" style={{ textAlign: 'left' }}>© Copyright 2024</p>
          </Col>
          <Col md={2} className="mb-2 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }} >
            <h6 className="text-white mb-3 fs-5" style={{ fontSize: '1.4rem' }}>Our Company</h6>
            <ul className="list-unstyled" style={{ paddingLeft: '0' }}>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>About Us</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Contact Us</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>FAQ</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Privacy Policy</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Disclaimer</a></li>
            </ul>
          </Col>
          <Col md={2} className="mb-2 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }}>
            <h6 className="text-white mb-3 fs-5" style={{ fontSize: '1.4rem' }}>Interesting</h6>
            <ul className="list-unstyled" >
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Did You Know</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Learn More</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>New Feature</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Trending</a></li>
              <li style={{ marginBottom: '5px' }}><a href="#" className="text-light small text-decoration-none hover-underline" style={{ fontSize: '1.1rem' }}>Events</a></li>
            </ul>
          </Col>
          <Col md={2} className="mb-4 mb-md-0 text-center text-md-start" style={{ textAlign: 'left' }}>
            <h6 className="text-white mb-4 fs-5" style={{ fontSize: '1.4rem' }}>Join Our Community</h6>
            <div className="d-flex flex-wrap gap-4 justify-content-center justify-content-md-start">
              <a href="#" className="text-light hover-opacity"><Facebook size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Twitter size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Pinterest size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Instagram size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Youtube size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Discord size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Twitter size={30} /></a>
              <a href="#" className="text-light hover-opacity"><Youtube size={30} /></a>
            </div>
            <div className="d-flex justify-content-start mt-5 me-md-0">
              <Form className="d-flex">
                <Form.Group className="mb-0 me-0" controlId="formBasicEmail">
                  <Form.Control 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-dark text-light border-secondary border-5 shadow border-dark" 
                    style={{ color: 'white', fontSize: '1rem', borderRadius: '1rem 0.25rem 0.25rem 1rem', height: '50px', width: '240px' }}
                  />
                </Form.Group>
                <Button variant="warning" type="submit" className="footer-button d-flex align-items-center justify-content-center" 
                  style={{ 
                    borderRadius: '0 0.7rem 0.7rem 0', 
                    backgroundColor: 'orange', 
                    fontSize: '1.1rem', 
                    color: 'white', 
                    height: '50px', 
                    border: '5px solid transparent', 
                    width: '100%' 
                  }}>
                  <span>Subscribe</span>
                  <i className="bi bi-envelope-fill"></i>
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
        <Row>
          
        </Row>
      </Container>
      <style>
        {`
          .hover-underline:hover {
            text-decoration: underline !important;
          }
          .hover-opacity:hover {
            opacity: 0.8;
          }
          .bg-dark.text-light::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          @media (max-width: 576px) {
            .footer-button {
              font-size: 0.9rem;
              height: 40px;
              border-radius: 0.5rem;
            }
            .bg-dark.text-light {
              height: 40px;
              font-size: 0.9rem;
            }
          }
        `}
      </style>
    </footer>
  );
};

export default Footer;