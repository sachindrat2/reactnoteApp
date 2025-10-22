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
  // generate a deterministic offline id per email so caches are user-specific
  const sanitized = (email || 'offline').toString().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const offlineId = `offline_${sanitized}`;
  const offlineUser = {
    access_token: 'offline_token_' + Date.now(),
    token_type: 'Bearer',
    user: {
      id: offlineId,
      email: email,
      name: name || (email ? email.split('@')[0] : 'offline'),
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
      isOffline: userData.isOffline,
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

      // Handle opaque/no-cors or incomplete responses from the auth endpoint
      if (userData && (userData.opaque === true || !userData.access_token || !userData.user)) {
        console.warn('⚠️ Received opaque/incomplete auth response, creating offline session instead', userData);
        const offlineUser = createOfflineSession(email);
        setUser(offlineUser.user);  // Set the user object, not the full auth response
        setIsAuthenticated(true);
        // already persisted inside createOfflineSession
        console.log('💾 Offline session stored for user:', offlineUser.user.id);
        return { success: true, offline: true, message: 'Logged in offline (opaque/incomplete auth response)' };
      }

      setUser(userData.user || userData);  // Handle both formats
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));

      console.log('✅ Login successful via API');
      return { success: true };
    } catch (error) {
      console.error('❌ API login failed:', error);
      
      // Provide specific feedback based on error type
      let offlineReason = 'Connection failed';
      if (error.message.includes('CORS')) {
        offlineReason = 'Server CORS policy blocking connection';
      } else if (error.message.includes('NETWORK')) {
        offlineReason = 'Network connection unavailable';
      } else if (error.message.includes('TIMEOUT')) {
        offlineReason = 'Server response timeout';
      }
      
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
        message: `Logged in offline (${offlineReason}). Your data will be stored locally and sync when connection is available.`
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