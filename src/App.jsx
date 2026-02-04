import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import NotesApp from './components/NotesApp.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import RegisterScreen from './components/RegisterScreen.jsx';
import VerifyCodeScreen from './components/VerifyCodeScreen.jsx';
import VerifyEmailScreen from './components/VerifyEmailScreen.jsx';
import ForgotPasswordScreen from './components/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from './components/ResetPasswordScreen.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';

// ...existing code...
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { isAuthenticated, isLoading, timestamp: new Date().toISOString() });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const path = window.location.pathname;
  
  if (isLoading && path !== '/login' && path !== '/register') {
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
        path="/verify-code" 
        element={isAuthenticated ? <Navigate to="/notes" replace /> : <VerifyCodeScreen />} 
      />
      <Route 
        path="/verify-email" 
        element={isAuthenticated ? <Navigate to="/notes" replace /> : <VerifyEmailScreen />} 
      />
      <Route 
        path="/forgot-password" 
        element={isAuthenticated ? <Navigate to="/notes" replace /> : <ForgotPasswordScreen />} 
      />
      <Route 
        path="/reset-password" 
        element={isAuthenticated ? <Navigate to="/notes" replace /> : <ResetPasswordScreen />} 
      />
      <Route 
        path="/notes/*" 
        element={
          <ProtectedRoute>
            <NotesApp />
          </ProtectedRoute>
        } 
      />
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
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;