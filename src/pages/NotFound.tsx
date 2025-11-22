import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { Home, ArrowLeft, Search } from 'lucide-react';
import CoinsNavbar from '../Components/navbar';
import Footer from '../Components/footer';

const NotFound: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <CoinsNavbar />

      <Container className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="text-center" style={{ maxWidth: '600px' }}>
          {/* Animated 404 */}
          <div
            className="mb-4"
            style={{
              fontSize: '8rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff7a00, #f97316, #fb923c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            404
          </div>

          {/* Message */}
          <h1 className="h2 mb-3" style={{ color: '#1f2937', fontWeight: '700' }}>
            Page Not Found
          </h1>

          <p className="text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            Oops! The page you're looking for doesn't exist or has been moved.
            Don't worry, let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/">
              <Button
                className="btn-interactive btn-ripple d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#f97316',
                  borderColor: '#f97316',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}
              >
                <Home size={20} />
                Go Home
              </Button>
            </Link>

            <Button
              variant="outline-secondary"
              className="d-flex align-items-center gap-2"
              onClick={() => window.history.back()}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '12px'
              }}
            >
              <ArrowLeft size={20} />
              Go Back
            </Button>

            <Link to="/search">
              <Button
                variant="outline-secondary"
                className="d-flex align-items-center gap-2"
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}
              >
                <Search size={20} />
                Search
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
            <p className="text-muted small mb-3">Popular Pages</p>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <Link to="/exclusive-news" className="badge bg-light text-dark text-decoration-none p-2">
                Exclusive News
              </Link>
              <Link to="/listings" className="badge bg-light text-dark text-decoration-none p-2">
                Listings
              </Link>
              <Link to="/blog" className="badge bg-light text-dark text-decoration-none p-2">
                Blog
              </Link>
              <Link to="/watchlist" className="badge bg-light text-dark text-decoration-none p-2">
                Watchlist
              </Link>
              <Link to="/learn" className="badge bg-light text-dark text-decoration-none p-2">
                Learn
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
