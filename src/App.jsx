import React from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import NotesApp from './components/NotesApp'
import LoginScreen from './components/LoginScreen'
import LoadingScreen from './components/LoadingScreen'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('🎯 AppContent render - Auth state:', { isAuthenticated, isLoading });

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('🎯 AppContent: Showing loading screen');
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
        path="/notes" 
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
      <Router basename="/reactnoteApp">
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;