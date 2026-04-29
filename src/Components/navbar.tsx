// src/Components/navbar.tsx — Editorial CoinsClarity navbar
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Form, FormControl, Container, Spinner, Alert } from 'react-bootstrap';
import { Search, CircleDollarSign, Landmark, Sun, Moon } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import '../styles/CoinsNavbar.css';
import { coingeckoV3Url } from '../utils/coingeckoUrl';

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

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
  const mockSuggestions: SearchSuggestion[] = [
    { type: 'coins', name: 'Bitcoin', id: 'bitcoin' },
    { type: 'coins', name: 'BNB', id: 'bnb' },
    { type: 'exchanges', name: 'Binance', id: 'binance' },
  ];

  const debouncedFetchSuggestions = _.debounce(async (query: string) => {
    if (!query.trim()) { setSuggestions([]); setError(null); return; }
    setLoadingSuggestions(true);
    setError(null);

    try {
      const backendUrl = `${API_BASE_URL}/search-suggestions?query=${encodeURIComponent(query)}`;
      try {
        const resp = await fetch(backendUrl, { headers: { 'Content-Type': 'application/json' } });
        if (resp.ok) {
          const data = await resp.json();
          const list = (data?.coins || []).slice(0, 10).map((item: any) => ({
            type: 'coins' as const,
            name: item.name,
            id: item.id,
          }));
          setSuggestions(list.length ? list : mockSuggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())));
          return;
        }
      } catch (_) { /* fall through */ }

      const response = await fetch(coingeckoV3Url(`search?query=${encodeURIComponent(query)}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`CoinGecko search failed: ${response.statusText}`);
      const data = await response.json();
      const coinSuggestions: SearchSuggestion[] = data.coins?.slice(0, 5).map((item: any) => ({ type: 'coins' as const, name: item.name, id: item.id })) || [];
      const exchangeSuggestions: SearchSuggestion[] = data.exchanges?.slice(0, 5).map((item: any) => ({ type: 'exchanges' as const, name: item.name, id: item.id })) || [];
      const list = [...coinSuggestions, ...exchangeSuggestions];
      setSuggestions(list.length ? list : mockSuggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())));
    } catch (e) {
      console.error('Error fetching suggestions:', e);
      setError('Failed to load suggestions.');
      setSuggestions(mockSuggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())));
    } finally {
      setLoadingSuggestions(false);
    }
  }, 300);

  useEffect(() => {
    if (searchQuery.trim()) debouncedFetchSuggestions(searchQuery);
    else { setSuggestions([]); setError(null); }
    return () => debouncedFetchSuggestions.cancel();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
  };
  const handleSuggestionClick = (s: SearchSuggestion) => {
    setSearchQuery(s.name);
    setSuggestions([]);
    navigate(`/search?query=${encodeURIComponent(s.name)}`);
  };
  const handleNavItemClick = () => setExpanded(false);
  const handleThemeToggle = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  return (
    <Navbar
      data-bs-theme={theme}
      expand="lg"
      expanded={expanded}
      onToggle={(next) => setExpanded(Boolean(next))}
      className={`cc-navbar ${isScrolled ? 'is-scrolled' : ''}`}
    >
      <Container fluid style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div className="cc-navbar__row w-100">
          <Navbar.Brand as={Link} to="/" className="cc-navbar__brand">
            <img
              src="/logo3.png"
              alt="CoinsClarity"
              loading="eager"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const wm = img.parentElement?.querySelector('.cc-navbar__wordmark') as HTMLElement | null;
                if (wm) wm.style.display = 'inline';
              }}
            />
            <span className="cc-navbar__wordmark" style={{ display: 'none' }}>CoinsClarity</span>
          </Navbar.Brand>

          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            aria-label={expanded ? 'Close menu' : 'Open menu'}
            className="cc-navbar__toggle d-lg-none"
          >
            <span className="bar" style={{ transform: expanded ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span className="bar" style={{ opacity: expanded ? 0 : 1 }} />
            <span className="bar" style={{ transform: expanded ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </Navbar.Toggle>

          <Navbar.Collapse id="basic-navbar-nav" className="cc-navbar__collapse">
            <Nav className="cc-navbar__menu">
              <NavDropdown title="News" id="news-dropdown">
                <NavDropdown.Item as={NavLink} to="/exclusive-news" onClick={handleNavItemClick}>Exclusive News</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/All-Trending-news" onClick={handleNavItemClick}>Trending</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/press-news" onClick={handleNavItemClick}>Press Releases</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/ai-news" onClick={handleNavItemClick}>AI News</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={NavLink} to="/beyond-the-headlines" onClick={handleNavItemClick}>Beyond the Headlines</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as="a" href="https://daily.coinsclarity.com" target="_blank" rel="noreferrer" onClick={handleNavItemClick} style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  Daily — India News
                </NavDropdown.Item>
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

            <Form className="cc-navbar__search" onSubmit={handleSearch}>
              <FormControl
                type="search"
                placeholder="Search coins, news, exchanges..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
              <Search
                className="cc-navbar__search-icon"
                size={18}
                onClick={handleSearch}
              />
              {suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {loadingSuggestions ? (
                    <div className="suggestion-item" style={{ justifyContent: 'center' }}>
                      <Spinner animation="border" variant="warning" size="sm" />
                    </div>
                  ) : (
                    suggestions.map((s, i) => (
                      <div
                        key={`${s.type}-${s.id}-${i}`}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        {s.type === 'coins'
                          ? <CircleDollarSign size={15} className="me-2" style={{ color: 'var(--text-muted)' }} />
                          : <Landmark size={15} className="me-2" style={{ color: 'var(--text-muted)' }} />}
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                        <small>{s.type}</small>
                      </div>
                    ))
                  )}
                </div>
              )}
              {error && (
                <Alert variant="danger" className="suggestions-error" style={{ fontSize: 12 }}>
                  {error}
                </Alert>
              )}
            </Form>

            <Nav className="cc-navbar__actions">
              <Nav.Link
                as={NavLink}
                to="/advertise"
                onClick={handleNavItemClick}
                className="cc-navbar__cta p-0 d-inline-flex align-items-center"
                style={{ display: 'inline-flex' }}
              >
                Advertise
              </Nav.Link>
              <button
                type="button"
                className="cc-navbar__icon-btn"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
                title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </Nav>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
};

export default CoinsNavbar;
