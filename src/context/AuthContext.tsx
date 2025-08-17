import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthState, LoginCredentials } from '../types/auth';

interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '123456'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }): JSX.Element => {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) return JSON.parse(raw) as AuthState;
    } catch {}
    return { isAuthenticated: false, username: null } as AuthState;
  });

  const login = (credentials: LoginCredentials): boolean => {
    if (
      credentials.username === ADMIN_CREDENTIALS.username &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      setAuth({
        isAuthenticated: true,
        username: credentials.username
      });
      try {
        localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, username: credentials.username }));
      } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      username: null
    });
    try { localStorage.removeItem('auth'); } catch {}
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};