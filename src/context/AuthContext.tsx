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
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    username: null
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
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      username: null
    });
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