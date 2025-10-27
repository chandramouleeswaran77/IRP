import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Components
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Experts from './pages/Experts';
import ExpertForm from './pages/ExpertForm';
import Events from './pages/Events';
import EventForm from './pages/EventForm';
import Feedback from './pages/Feedback';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import Users from './pages/Users';
import AuthCallback from './pages/AuthCallback';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { GoogleOAuthProvider } from '@react-oauth/google';


// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Content Component
const AppContent = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="experts" element={<Experts />} />
          <Route path="experts/new" element={<ExpertForm />} />
          <Route path="experts/:id/edit" element={<ExpertForm />} />
          <Route path="events" element={<Events />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/:id/edit" element={<EventForm />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Admin Only Routes */}
          <Route
            path="users"
            element={
              <ProtectedRoute adminOnly>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="activity"
            element={
              <ProtectedRoute adminOnly>
                <ActivityLogs />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;


