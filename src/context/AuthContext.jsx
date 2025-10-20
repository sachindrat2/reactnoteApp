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
    console.log('🔍 Checking stored auth:', storedUser ? 'Found' : 'Not found');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('📋 Parsed user data:', { 
        hasToken: !!userData.access_token, 
        email: userData.user?.email,
        isOffline: userData.isOffline 
      });
      
      if (userData && userData.access_token) {
        console.log('✅ Valid auth found in storage');
        return { user: userData, isAuthenticated: true };
      }
    }
    
    console.log('❌ No valid auth in storage');
  } catch (error) {
    console.error('Error reading stored auth:', error);
    localStorage.removeItem('notesapp_user');
  }
  return { user: null, isAuthenticated: false };
};

export const AuthProvider = ({ children }) => {
  console.log('🚀 AuthProvider initializing...');
  const storedAuth = getStoredAuth();
  
  console.log('🔑 Initial auth state:', storedAuth);
  
  const [user, setUser] = useState(storedAuth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(storedAuth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);

  // Monitor auth state changes for debugging
  useEffect(() => {
    console.log('🔄 Auth state changed:', { 
      isAuthenticated, 
      userEmail: user?.user?.email || user?.email,
      hasToken: !!user?.access_token 
    });
  }, [isAuthenticated, user]);

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
      
      console.log('💾 Offline user created:', offlineUser);
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
    console.log('🚪 Logging out...');
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      console.log('🧹 Clearing auth state and localStorage');
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