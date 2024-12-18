import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/Landing';
import BlogPage from './pages/BlogPage';
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'

import { AuthProvider } from './context/AuthContext';
import { BlogProvider } from './context/BlogContext';

function App() {
  return (
    <AuthProvider>
      <BlogProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/blog/:id" element={<BlogPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminDashboard />} />

             
            </Routes>
          </div>
        </Router>
      </BlogProvider>
    </AuthProvider>
  );
}

export default App;

