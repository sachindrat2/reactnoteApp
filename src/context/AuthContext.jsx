import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, handleAPIError } from '../services/api.js';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Offline authentication helper
const createOfflineSession = (email, name = null) => {
  const offlineUser = {
    access_token: 'offline_token_' + Date.now(),
    token_type: 'Bearer',
    user: {
      id: 'offline_user',
      email: email,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString()
    },
    isOffline: true
  };
  
  localStorage.setItem('notesapp_user', JSON.stringify(offlineUser));
  return offlineUser;
};

// Check if user is logged in from localStorage
const getStoredAuth = () => {
  try {
    const storedUser = localStorage.getItem('notesapp_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData && userData.access_token) {
        return { user: userData, isAuthenticated: true };
      }
    }
  } catch (error) {
    console.error('Error reading stored auth:', error);
    localStorage.removeItem('notesapp_user');
  }
  return { user: null, isAuthenticated: false };
};

export const AuthProvider = ({ children }) => {
  const storedAuth = getStoredAuth();
  
  const [user, setUser] = useState(storedAuth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(storedAuth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login...');
      const userData = await authAPI.login(email, password);
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      
      console.log('✅ Login successful via API');
      return { success: true };
    } catch (error) {
      console.error('❌ API login failed:', error);
      
      // Fall back to offline mode
      console.log('🔄 Creating offline session...');
      const offlineUser = createOfflineSession(email);
      
      setUser(offlineUser);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful in offline mode');
      return { 
        success: true, 
        offline: true,
        message: 'Logged in offline. Your data will be stored locally.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration...');
      const userData = await authAPI.register(name, email, password);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      
      console.log('✅ Registration successful via API');
      return { success: true };
    } catch (error) {
      console.error('❌ API registration failed:', error);
      
      // Fall back to offline mode
      console.log('🔄 Creating offline registration...');
      const offlineUser = createOfflineSession(email, name);
      
      setUser(offlineUser);
      setIsAuthenticated(true);
      
      console.log('✅ Registration successful in offline mode');
      return { 
        success: true, 
        offline: true,
        message: 'Registered offline. Your data will be stored locally.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('notesapp_user');
      localStorage.removeItem('notesapp_notes_cache');
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};