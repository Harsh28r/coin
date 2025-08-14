// src/components/organisms/CoinsNavbar.tsx
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Form, FormControl, Container, Spinner, Alert, Button } from 'react-bootstrap';
import { Search, CircleDollarSign, Landmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import '../styles/CoinsNavbar.css';

interface SearchSuggestion {
  type: 'coins' | 'exchanges';
  name: string;
  id: string;
}

const CoinsNavbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
  const mockSuggestions: SearchSuggestion[] = [
    { type: 'coins', name: 'Bitcoin', id: 'bitcoin' },
    { type: 'coins', name: 'BNB', id: 'bnb' },
    { type: 'exchanges', name: 'Binance', id: 'binance' },
  ];

  const debouncedFetchSuggestions = _.debounce(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setError(null);
      return;
    }
    setLoadingSuggestions(true);
    setError(null);

    try {
      // Try backend proxy first (if implemented)
      const backendUrl = `${API_BASE_URL}/search-suggestions?query=${encodeURIComponent(query)}`;
      try {
        const resp = await fetch(backendUrl, { headers: { 'Content-Type': 'application/json' } });
        if (resp.ok) {
          const data = await resp.json();
          const suggestions = (data?.coins || []).slice(0, 10).map((item: any) => ({
            type: 'coins' as const,
            name: item.name,
            id: item.id,
          }));
          setSuggestions(suggestions.length > 0 ? suggestions : mockSuggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())));
          return;
        }
      } catch (_) {
        // Fallback to CoinGecko directly if backend proxy not available
      }

      const response = await fetch(`${COINGECKO_API_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`CoinGecko search failed: ${response.statusText}`);
      }
      const data = await response.json();
      const coinSuggestions = data.coins?.slice(0, 5).map((item: any) => ({
        type: 'coins' as const,
        name: item.name,
        id: item.id,
      })) || [];
      const exchangeSuggestions = data.exchanges?.slice(0, 5).map((item: any) => ({
        type: 'exchanges' as const,
        name: item.name,
        id: item.id,
      })) || [];

      const suggestions = [...coinSuggestions, ...exchangeSuggestions];
      setSuggestions(suggestions.length > 0 ? suggestions : mockSuggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())));
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions. Using mock data.');
      setSuggestions(mockSuggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())));
    } finally {
      setLoadingSuggestions(false);
    }
  }, 300);

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedFetchSuggestions(searchQuery);
    } else {
      setSuggestions([]);
      setError(null);
    }
    return () => debouncedFetchSuggestions.cancel();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name);
    setSuggestions([]);
    navigate(`/search?query=${encodeURIComponent(suggestion.name)}`);
  };

  const linkStyles = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.04em',
  };

  return (
    <Navbar bg="white" expand="lg" className="border-bottom py-3" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      <Container fluid style={{ maxWidth: '90%', margin: '0 auto' }}>
        <Navbar.Brand as={Link} to="/">
          <img src="/logo2.png" style={{ width: '150px', height: '55px' }} alt="CoinsCapture logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto gap-2" style={linkStyles}>
            <NavDropdown title="News" id="news-dropdown">
              <NavDropdown.Item as={Link} to="/exclusive-news">Exclusive News</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/All-Trending-news">Trending</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/press-news">Press News</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link as={Link} to="/search">Search</Nav.Link>
            <Nav.Link as={Link} to="/advertise">Advertise</Nav.Link>
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
          </Nav>
          <Form className="d-flex justify-content-center me-2" onSubmit={handleSearch}>
            <div className="position-relative search-container">
              <FormControl
                type="search"
                placeholder="Search coins, news, exchanges, NFTs..."
                aria-label="Search"
                style={{ width: '250px', height: '36px', fontSize: '16px' }}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
              <Search
                className="position-absolute top-50 end-0 translate-middle-y me-2 cursor-pointer"
                size={20}
                onClick={handleSearch}
              />
              {suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {loadingSuggestions ? (
                    <div className="suggestion-item text-center">
                      <Spinner animation="border" variant="primary" size="sm" />
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.type}-${suggestion.id}-${index}`}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.type === 'coins' ? (
                          <CircleDollarSign size={16} className="me-2" />
                        ) : (
                          <Landmark size={16} className="me-2" />
                        )}
                        {suggestion.name} <small>({suggestion.type})</small>
                      </div>
                    ))
                  )}
                </div>
              )}
              {error && (
                <Alert variant="danger" className="suggestions-error">
                  {error}
                </Alert>
              )}
            </div>
          </Form>
          <Nav.Link as={Link} to="/advertise" className="me-2 mt-1">
            <Button
              variant="warning"
              style={{ fontSize: '16px', padding: '8px 20px', color: 'white', backgroundColor: '#f90', borderRadius: '0.7rem' }}
            >
              Advertise
            </Button>
          </Nav.Link>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CoinsNavbar;