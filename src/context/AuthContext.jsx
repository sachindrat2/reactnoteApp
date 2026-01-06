import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, handleAPIError, refreshTokenAPI } from '../services/api.js';

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
      tokenType: userData.token_type,
      keys: Object.keys(userData)
    });
    
    // Check if we have a corrupt opaque response stored
    if (userData && userData.opaque === true) {
      console.log('⚠️ Found corrupt opaque response in storage, clearing...');
      localStorage.removeItem('notesapp_user');
      return { user: null, isAuthenticated: false };
    }
    
    // Validate required fields - be more flexible with user structure
    if (userData && userData.access_token) {
      console.log('✅ Valid auth found in storage');
      return { user: userData, isAuthenticated: true };
    } else {
      console.log('⚠️ Invalid auth data structure, removing...');
      console.log('📋 Debug - userData structure:', userData);
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

  // Initialize auth state from localStorage on mount and auto-logout if token expired
  useEffect(() => {
    console.log('🔄 Initializing auth state from storage...');

    const checkTokenExpiry = async (userObj) => {
      if (!userObj || !userObj.access_token) return false;
      try {
        const payload = JSON.parse(atob(userObj.access_token.split('.')[1]));
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          if (now > expDate) {
            console.log('⏰ Token expired at', expDate.toISOString(), '- attempting refresh');
            // Try to refresh token
            try {
              const refreshed = await refreshTokenAPI();
              if (refreshed && refreshed.access_token) {
                // Merge new tokens into user object
                const newUser = { ...userObj, ...refreshed };
                setUser(newUser);
                setIsAuthenticated(true);
                setIsLoading(false);
                localStorage.setItem('notesapp_user', JSON.stringify(newUser));
                console.log('🔄 Token refreshed and stored');
                return false; // Not expired anymore
              } else {
                throw new Error('No access_token in refresh response');
              }
            } catch (refreshErr) {
              console.error('❌ Token refresh failed:', refreshErr);
              setUser(null);
              setIsAuthenticated(false);
              setIsLoading(false);
              localStorage.removeItem('notesapp_user');
              window.dispatchEvent(new CustomEvent('auth:token-expired', { detail: { reason: 'Token expired and refresh failed' } }));
              return true;
            }
          }
        }
      } catch (e) {
        console.error('Error decoding JWT for expiry check:', e);
      }
      return false;
    };

    const initializeAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        const storedAuth = getStoredAuth();
        console.log('🔑 Retrieved auth state:', storedAuth);
        // Auto-logout or refresh if token expired
        if (storedAuth.user && (await checkTokenExpiry(storedAuth.user))) {
          return;
        }
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
      if (isAuthenticated) {
        console.log('🚪 Auto-logout due to token expiration');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        localStorage.removeItem('notesapp_user');
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

      // Detect unregistered user error from backend (common patterns)
      if (userData && (userData.detail || userData.message)) {
        const msg = (userData.detail || userData.message).toLowerCase();
        if (
          msg.includes('not found') ||
          msg.includes('not registered') ||
          msg.includes('does not exist') ||
          msg.includes('no user')
        ) {
          throw new Error('USER_NOT_FOUND');
        }
      }

      // Validate that we got a proper access token
      if (!userData || !userData.access_token) {
        console.error('❌ Missing access_token in response:', userData);
        throw new Error('Login response missing access_token');
      }

      // Debug: Show access token preview
      console.log('🔑 Received access_token:', userData.access_token.substring(0, 30) + '...');

      // Extract user info from JWT token
      try {
        const tokenPayload = JSON.parse(atob(userData.access_token.split('.')[1]));
        console.log('🔍 JWT payload:', tokenPayload);
        // Create enhanced user data with decoded info
        const enhancedUserData = {
          ...userData,
          user: {
            email: tokenPayload.sub, // JWT subject is usually the email
            id: tokenPayload.sub,
            exp: tokenPayload.exp
          }
        };
        console.log('📝 Enhanced user data:', enhancedUserData);
        // Store the enhanced user data
        setUser(enhancedUserData);
        setIsAuthenticated(true);
        localStorage.setItem('notesapp_user', JSON.stringify(enhancedUserData));
        console.log('💾 Stored in localStorage with user info');
      } catch (jwtError) {
        console.error('❌ Failed to decode JWT:', jwtError);
        // Fallback: store as-is without user object
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('notesapp_user', JSON.stringify(userData));
      }

      // Debug: Confirm token is in localStorage
      const stored = localStorage.getItem('notesapp_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('🔎 Token in localStorage after login:', parsed.access_token ? parsed.access_token.substring(0, 30) + '...' : 'MISSING');
        } catch (e) {
          console.error('❌ Error parsing stored token after login:', e);
        }
      } else {
        console.error('❌ Token NOT found in localStorage after login!');
      }

      console.log('✅ Login successful - access token received:', userData.access_token.substring(0, 20) + '...');
      setIsLoading(false); // Explicitly clear loading state on success
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      // Clear any auth state on failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('notesapp_user');
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      if (error.message === 'USER_NOT_FOUND') {
        errorMessage = 'userNotFound'; // i18n key
      } else if (error.message.includes('CORS')) {
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
      
      // Extract user info from JWT token for registration too
      try {
        const tokenPayload = JSON.parse(atob(userData.access_token.split('.')[1]));
        console.log('🔍 Registration JWT payload:', tokenPayload);
        
        // Create enhanced user data with decoded info
        const enhancedUserData = {
          ...userData,
          user: {
            email: tokenPayload.sub,
            id: tokenPayload.sub,
            exp: tokenPayload.exp
          }
        };
        
        setUser(enhancedUserData);
        setIsAuthenticated(true);
        localStorage.setItem('notesapp_user', JSON.stringify(enhancedUserData));
      } catch (jwtError) {
        console.error('❌ Failed to decode JWT during registration:', jwtError);
        // Fallback: store as-is
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('notesapp_user', JSON.stringify(userData));
      }
      
      console.log('✅ Registration successful - access token received');
      setIsLoading(false); // Explicitly clear loading state on success
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