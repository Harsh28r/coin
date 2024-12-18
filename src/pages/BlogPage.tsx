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
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="py-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BlogProvider>
    </AuthProvider>
  );
};

export default BlogPage;

