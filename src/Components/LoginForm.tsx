import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const success = await login(credentials);
    setLoading(false);
    if (success) {
      navigate('/Main-dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg" style={{ width: '400px' }}>
        <div className="card-body align-items-center">
          <h2 className="mb-4 text-center">Admin Login</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="form-label" style={{ textAlign: 'left' }}>Username</Form.Label>
              <Form.Control
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                placeholder="Enter your username"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Password</Form.Label>
              <Form.Control
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                placeholder="Enter your password"
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
