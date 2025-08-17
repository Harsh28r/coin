import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import PressReleaseDetail from './Components/preRealse'
import SearchPage from './Components/SearchPage';
import NewsDetail from './Components/NewsDetail';
import BlogHome from './Components/BlogHome';
import Learn from './Components/Learn';
import InDepthNewsPage from './pages/InDepthNewsPage';
import EventRadar from './Components/EventRadar';
import Listing from './Components/Listings';
import DefaultSEO from './Components/DefaultSEO';


const ScrollToTop: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BlogProvider>
          <CurrencyProvider>
            <Router>
              <ScrollToTop />
              <div className="App">
                <DefaultSEO />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/blog/:id" element={<BlogPage />} />
                  <Route path="/blog" element={<BlogHome />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/All-exclusive-news" element={<AllNews />} /> 
                  <Route path="/press-news" element={<PresNews />} /> 
                  <Route path="/exclusive-news" element={< Exn/ >} /> 
                  <Route path="/advertise" element={<  Advertise />} /> 
                  <Route path="/All-Trending-news" element={<  Trend />} /> 
                  <Route path="/beyond-the-headlines" element={<InDepthNewsPage />} />
                  <Route path="/listings" element={<Listing />} />
                  <Route path="/events" element={<EventRadar />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
                  <Route path="/main-dashboard" element={<   MainDashboard/>} /> 
                  {/* <Route path="/press-release-detail" element={<PressReleaseDetail />} /> */}
                  <Route path="/search" element={<SearchPage />} />




                 
                </Routes>
              </div>
            </Router>
          </CurrencyProvider>
        </BlogProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

