import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/Landing';
import BlogPage from './pages/BlogPage';
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import AllNews from './Components/Exnews';
import PresNews from './Components/PressNews';
import Exn from './Components/Exn';
import Advertise from './Components/advertise';
import Trend from './Components/Trend';
import MainDashboard from './pages/MainAdminDash';

import { AuthProvider } from './context/AuthContext';
import { BlogProvider } from './context/BlogContext';
import PressReleaseDetail from './Components/preRealse'
import SearchPage from './Components/SearchPage';
import NewsDetail from './Components/NewsDetail';

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
              <Route path="/All-exclusive-news" element={<AllNews />} /> 
              <Route path="/press-news" element={<PresNews />} /> 
              <Route path="/exclusive-news" element={< Exn/ >} /> 
              <Route path="/advertise" element={<  Advertise />} /> 
              <Route path="/All-Trending-news" element={<  Trend />} /> 
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/main-dashboard" element={<   MainDashboard/>} /> 
              {/* <Route path="/press-release-detail" element={<PressReleaseDetail />} /> */}
              <Route path="/search" element={<SearchPage />} />




             
            </Routes>
          </div>
        </Router>
      </BlogProvider>
    </AuthProvider>
  );
}

export default App;

