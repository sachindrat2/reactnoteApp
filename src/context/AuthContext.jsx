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

// Removed offline authentication helper - only using real tokens now

// Check if user is logged in from localStorage
const getStoredAuth = () => {
  try {
    console.log('🔍 Getting stored auth from localStorage...');
    const storedUser = localStorage.getItem('notesapp_user');
    console.log('� Raw stored data:', storedUser ? 'Found' : 'Not found');
    
    if (!storedUser) {
      console.log('❌ No stored auth data found');
      return { user: null, isAuthenticated: false };
    }
    
    const userData = JSON.parse(storedUser);
    console.log('📋 Parsed user data:', { 
      hasToken: !!userData.access_token, 
      email: userData.user?.email,
      tokenType: userData.token_type
    });
    
    // Check if we have a corrupt opaque response stored
    if (userData && userData.opaque === true) {
      console.log('⚠️ Found corrupt opaque response in storage, clearing...');
      localStorage.removeItem('notesapp_user');
      return { user: null, isAuthenticated: false };
    }
    
    // Validate required fields
    if (userData && userData.access_token && userData.user) {
      console.log('✅ Valid auth found in storage');
      return { user: userData, isAuthenticated: true };
    } else {
      console.log('⚠️ Invalid auth data structure, removing...');
      localStorage.removeItem('notesapp_user');
      return { user: null, isAuthenticated: false };
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
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    console.log('🔄 Initializing auth state from storage...');
    
    // Add a small delay to ensure DOM is ready and localStorage is accessible
    const initializeAuth = async () => {
      try {
        // Wait a tick to ensure localStorage is fully accessible
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const storedAuth = getStoredAuth();
        console.log('🔑 Retrieved auth state:', storedAuth);
        
        setUser(storedAuth.user);
        setIsAuthenticated(storedAuth.isAuthenticated);
        setIsLoading(false);
        
        console.log('✅ Auth state initialized:', storedAuth);
      } catch (error) {
        console.error('🚨 Error initializing auth:', error);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for token expiration events from API layer
    const handleTokenExpired = (event) => {
      console.log('🚨 Token expiration event received:', event.detail);
      
      // Only auto-logout if we're currently authenticated
      if (isAuthenticated) {
        console.log('🚪 Auto-logout due to token expiration');
        setUser(null);
        setIsAuthenticated(false);
        
        // Show a notification to the user
        console.log('💬 Session expired notification should be shown');
      }
    };
    
    window.addEventListener('auth:token-expired', handleTokenExpired);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, [isAuthenticated]);

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

      console.log('📊 Login API response:', userData);

      // Validate that we got a proper access token
      if (!userData || !userData.access_token) {
        throw new Error('Login response missing access_token');
      }

      // Store the complete user data with access token
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));

      console.log('✅ Login successful - access token received:', userData.access_token.substring(0, 20) + '...');
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Clear any auth state on failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('notesapp_user');
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.message.includes('CORS')) {
        errorMessage = 'Connection blocked by browser security. Please try again or contact support.';
      } else if (error.message.includes('NETWORK') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('TIMEOUT')) {
        errorMessage = 'Server is taking too long to respond. Please try again later.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration...');
      // Use email as username for registration
      const userData = await authAPI.register(email, password);
      
      // Validate that we got a proper access token
      if (!userData || !userData.access_token) {
        throw new Error('Registration response missing access_token');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      
      console.log('✅ Registration successful - access token received');
      return { success: true };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      // Clear any auth state on failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('notesapp_user');
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('CORS')) {
        errorMessage = 'Connection blocked by browser security. Please try again or contact support.';
      } else if (error.message.includes('NETWORK') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('409') || error.message.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please login instead.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out...');
    
    // Get current user before clearing auth
    const currentUser = user;
    
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      console.log('🧹 Clearing auth state and localStorage');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('notesapp_user');
      
      // Clear user-specific notes cache
      if (currentUser?.user?.id || currentUser?.id) {
        const userId = currentUser.user?.id || currentUser.id;
        localStorage.removeItem(`notesapp_notes_cache_${userId}`);
        console.log('🧹 Cleared notes cache for user:', userId);
      }
      
      // Also clear legacy cache key
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