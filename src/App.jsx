import React, { useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import NotesApp from './components/NotesApp'
import { NotesProvider } from './context/NotesContext';
import NoteDetail from './components/NoteDetail.jsx'
import LoginScreen from './components/LoginScreen'
import RegisterScreen from './components/RegisterScreen'
import LoadingScreen from './components/LoadingScreen'
import VerifyEmailScreen from './components/VerifyEmailScreen'
import VerifyCodeScreen from './components/VerifyCodeScreen'
import ForgotPasswordScreen from './components/ForgotPasswordScreen'
import ResetPasswordScreen from './components/ResetPasswordScreen'

// Version for cache busting - Updated for deployment test
const APP_VERSION = '2.0.1-production';
const BUILD_TIMESTAMP = Date.now();

// Cache busting utility
const checkForUpdates = () => {
  const storedVersion = localStorage.getItem('app_version');
  const storedTimestamp = localStorage.getItem('build_timestamp');
  
  if (storedVersion !== APP_VERSION || !storedTimestamp) {
    // Clear all cache
    localStorage.setItem('app_version', APP_VERSION);
    localStorage.setItem('build_timestamp', BUILD_TIMESTAMP.toString());
    
    // Force reload if this is a significant version change
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('🔄 New version detected, clearing cache...');
      // Clear service worker cache if exists
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Force hard reload
      window.location.reload(true);
    }
  }
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { isAuthenticated, isLoading, timestamp: new Date().toISOString() });

  // Only show loading during active operations
  if (isLoading) {
    console.log('🛡️ ProtectedRoute showing LoadingScreen due to auth isLoading');
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Check for app updates and clear cache if needed
  useEffect(() => {
    checkForUpdates();
  }, []);

  console.log('🎯 AppContent render - Auth state:', { isAuthenticated, isLoading });

  // Only show loading screen for protected routes, not for /login or /register
  // Determine current route
  const path = window.location.pathname;
  if (isLoading && path !== '/login' && path !== '/register') {
    console.log('🎯 AppContent: Showing loading screen for protected route');
    return <LoadingScreen />;
  }
  console.log('🎯 AppContent: Rendering routes with authenticated =', isAuthenticated);
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/notes" replace /> : <LoginScreen />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/notes" replace /> : <RegisterScreen />} 
      />
      <Route 
        path="/notes/*" 
        element={
          <ProtectedRoute>
            <NotesApp />
          </ProtectedRoute>
        } 
      />
      <Route path="/verify-email" element={<VerifyEmailScreen />} />
      <Route path="/verify-code" element={<VerifyCodeScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/notes" : "/login"} replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/notes" : "/login"} replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <Router>
          <AppContent />
        </Router>
      </NotesProvider>
    </AuthProvider>
  );
}

export default App;