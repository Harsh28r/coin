// src/components/organisms/CoinsNavbar.tsx
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Form, FormControl, Container, Spinner, Alert, Button } from 'react-bootstrap';
import { Search, CircleDollarSign, Landmark, Sun, Moon } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const navigate = useNavigate();

  // Add scroll listener for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = (localStorage.getItem('cc-theme') as 'light' | 'dark' | null) || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    document.documentElement.setAttribute('data-bs-theme', saved);
    document.body.setAttribute('data-theme', saved);
    document.body.setAttribute('data-bs-theme', saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-bs-theme', theme);
    localStorage.setItem('cc-theme', theme);
    window.dispatchEvent(new CustomEvent('cc-theme-change', { detail: theme }));
  }, [theme]);

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

  const handleToggle = () => setExpanded((prev) => !prev);
  const handleNavItemClick = () => setExpanded(false);
  const handleThemeToggle = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const barCommon: React.CSSProperties = {
    display: 'block',
    width: 24,
    height: 2,
    background: '#111',
    transition: 'transform 250ms ease, opacity 250ms ease',
    borderRadius: 2
  };

  return (
    <Navbar
      data-bs-theme={theme}
      expand="lg"
      expanded={expanded}
      onToggle={(next) => setExpanded(Boolean(next))}
      className={`py-2 ${isScrolled ? 'navbar-glass' : ''}`}
      style={{
        background: 'var(--card)',
        color: 'var(--text)',
        boxShadow: isScrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 1030,
        transition: 'all 0.3s ease'
      }}
    >
      <Container fluid style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="/logo3.png"
            alt="CoinsClarity"
            loading="eager"
            style={{ height: 56, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/image.png'; }}
          />
        </Navbar.Brand>
        {/* Custom hamburger using Navbar.Toggle for proper accessibility/control */}
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          aria-label={expanded ? 'Close menu' : 'Open menu'}
          className="border-0 bg-transparent d-lg-none"
          style={{ cursor: 'pointer', zIndex: 3, border: 'none', outline: 'none', boxShadow: 'none' }}
        >
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ ...barCommon, transform: expanded ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ ...barCommon, opacity: expanded ? 0 : 1 }} />
            <span style={{ ...barCommon, transform: expanded ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </div>
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto gap-1" style={linkStyles}>
            <NavDropdown title="News" id="news-dropdown">
              <NavDropdown.Item as={NavLink} to="/exclusive-news" onClick={handleNavItemClick}>Exclusive News</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/All-Trending-news" onClick={handleNavItemClick}>Trending</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/press-news" onClick={handleNavItemClick}>Press Releases</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/ai-news" onClick={handleNavItemClick}>AI News</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={NavLink} to="/beyond-the-headlines" onClick={handleNavItemClick}>Beyond the Headlines</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as="a" href="https://daily.coinsclarity.com" target="_blank" rel="noreferrer" onClick={handleNavItemClick} style={{ fontWeight: 600, color: '#f97316' }}>Daily — India news & current affairs</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link as={NavLink} to="/listings" onClick={handleNavItemClick}>Listings</Nav.Link>
            <Nav.Link as={NavLink} to="/learn" onClick={handleNavItemClick}>Learn</Nav.Link>
            <NavDropdown title="Tools" id="tools-dropdown">
              <NavDropdown.Item as={NavLink} to="/tools" onClick={handleNavItemClick}>All Tools</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/arbitrage-scanner" onClick={handleNavItemClick}>Arbitrage Scanner</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/watchlist" onClick={handleNavItemClick}>Watchlist</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link as={NavLink} to="/blog" onClick={handleNavItemClick}>Blog</Nav.Link>
          </Nav>
          <Form className="d-flex justify-content-center me-2" onSubmit={handleSearch}>
            <div className="position-relative search-container">
              <FormControl
                type="search"
                placeholder="Search coins, news, exchanges..."
                aria-label="Search"
                className="form-control-animated"
                style={{
                  width: '280px',
                  height: '40px',
                  fontSize: '15px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  paddingRight: '40px'
                }}
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
          <Nav className="align-items-center gap-2">
            <Nav.Link as={NavLink} to="/advertise" onClick={handleNavItemClick} className="p-0 me-1">
              <Button
                variant="warning"
                size="sm"
                style={{ fontSize: '13px', padding: '6px 16px', color: '#fff', background: '#f97316', border: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Advertise
              </Button>
            </Nav.Link>
            <Button
              variant="link"
              className="d-flex align-items-center justify-content-center p-0"
              style={{ width: 36, height: 36, color: 'var(--text)', opacity: 0.6 }}
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CoinsNavbar;