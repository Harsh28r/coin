import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <PenSquare className="d-inline-block align-top me-2" />
          Blog Site
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {auth.isAuthenticated && (
              <Nav.Link as={Link} to="/admin">Admin Dashboard</Nav.Link>
            )}
          </Nav>
          {auth.isAuthenticated ? (
            <div className="d-flex align-items-center">
              <span className="text-light me-3">Welcome, {auth.username}</span>
              <Button variant="outline-light" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Nav.Link as={Link} to="/login">
              <Button variant="outline-light">
                Admin Login
              </Button>
            </Nav.Link>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;