import React, { useState } from 'react';
import { Navbar, Nav, NavDropdown, Form, FormControl, Button, Container } from 'react-bootstrap';
import { Search } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const CoinsNavbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Search initiated with query:', searchQuery);
    try {
      const response = await fetch(`/api/search?query=${searchQuery}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const results = await response.json();
      console.log('Search results:', results);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const linkStyles = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.04em'
  };

  return (
    <Navbar bg="white" expand="lg" className="border-bottom py-3" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      <Container fluid style={{ maxWidth: '90%', margin: '0 auto' }}>
        <Navbar.Brand href="#home">
          <img src="/logo2.png" style={{ width: '150px', height: '55px' }} alt="CoinsCapture logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto gap-2" style={linkStyles}>
            <NavDropdown title="News" id="news-dropdown">
              <NavDropdown.Item href="#action/3.1">Latest News</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">Trending</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Categories</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link href="#market" className="d-lg-none">Market</Nav.Link>
            <Nav.Link href="#exchanges" className="d-lg-none">Exchanges</Nav.Link>
            <NavDropdown title="Explore" id="explore-dropdown">
              <NavDropdown.Item href="#action/4.1">Cryptocurrencies</NavDropdown.Item>
              <NavDropdown.Item href="#action/4.2">NFTs</NavDropdown.Item>
              <NavDropdown.Item href="#action/4.3">DeFi</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link href="#press-release">Press Release</Nav.Link>
            <Nav.Link href="#exchanges">Exchanges</Nav.Link>
            <Nav.Link href="#blog">Blog</Nav.Link>
          </Nav>
          <Form className="d-flex justify-content-center me-2" onSubmit={handleSearch}>
            <div className="position-relative me-2">
              <FormControl
                type="search"
                placeholder="Search"
                aria-label="Search"
                style={{ width: '200px', height: '36px', fontSize: '16px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="position-absolute top-50 end-0 translate-middle-y me-2" size={20} />
            </div>
          </Form>
          <Nav.Link href="/advertise" className="me-2 mt-1">
            <Button variant="warning" style={{ fontSize: '16px', padding: '8px 20px', color: 'white', backgroundColor: '#f90', borderRadius: '0.7rem' }}>
              Advertise
            </Button>
          </Nav.Link>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default CoinsNavbar;