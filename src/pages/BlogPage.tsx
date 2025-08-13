import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { BlogProvider } from '../context/BlogContext';
import Header from '../Components/BlogHeader';
import HomePage from '../Components/BlogHome';
import AdminDashboard from '../pages/AdminDashboard';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../Components/ProtectedRoutes';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';

const BlogPage: React.FC = () => {
  return (
    <AuthProvider>
      <BlogProvider>
        <div 
          className="min-h-screen"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {/* Enhanced Header with subtle shadow */}
          <div style={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <Header />
          </div>
          
          {/* Enhanced Main Content */}
          <main 
            className="py-5"
            style={{
              minHeight: 'calc(100vh - 80px)',
              position: 'relative'
            }}
          >
            {/* Decorative Background Elements */}
            <div 
              className="position-absolute w-100 h-100"
              style={{
                top: 0,
                left: 0,
                zIndex: -1,
                opacity: 0.03,
                background: `
                  radial-gradient(circle at 20% 80%, #667eea 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, #764ba2 0%, transparent 50%),
                  radial-gradient(circle at 40% 40%, #f59e0b 0%, transparent 50%)
                `
              }}
            />
            
            {/* Content Container with enhanced styling */}
            <div 
              className="position-relative"
              style={{
                zIndex: 1
              }}
            >
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <div 
                      style={{
                        animation: 'fadeInUp 0.6s ease-out'
                      }}
                    >
                      <HomePage />
                    </div>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <div 
                      style={{
                        animation: 'fadeInUp 0.6s ease-out 0.1s both'
                      }}
                    >
                      <LoginPage />
                    </div>
                  } 
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <div 
                        style={{
                          animation: 'fadeInUp 0.6s ease-out 0.2s both'
                        }}
                      >
                        <AdminDashboard />
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </main>
          
          {/* Enhanced Styling */}
          <style>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            /* Smooth scrolling for the entire page */
            html {
              scroll-behavior: smooth;
            }
            
            /* Enhanced focus states for accessibility */
            *:focus {
              outline: 2px solid #f59e0b;
              outline-offset: 2px;
            }
            
            /* Custom scrollbar */
            ::-webkit-scrollbar {
              width: 8px;
            }
            
            ::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.05);
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            }
            
            /* Enhanced selection styling */
            ::selection {
              background: rgba(245, 158, 11, 0.3);
              color: #1f2937;
            }
            
            /* Smooth transitions for all elements */
            * {
              transition: all 0.2s ease;
            }
            
            /* Enhanced loading states */
            .loading {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }
            
            @keyframes loading {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
          `}</style>
        </div>
      </BlogProvider>
    </AuthProvider>
  );
};

export default BlogPage;

