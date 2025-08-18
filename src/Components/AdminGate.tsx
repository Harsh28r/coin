import React, { useEffect, useState } from 'react';

interface AdminGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'coinsclarity_admin_auth_v1';
const ADMIN_PASS = '123456';

const AdminGate: React.FC<AdminGateProps> = ({ children }) => {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setAuthorized(saved === 'true');
    } catch {
      setAuthorized(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
      setAuthorized(true);
      setError(null);
    } else {
      setError('Invalid password');
    }
  };

  if (authorized) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh' }} className="d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow" style={{ width: 360 }}>
        <div className="card-body">
          <h5 className="card-title mb-3">Admin Login</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminGate;


