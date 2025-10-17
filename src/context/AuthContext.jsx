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

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider rendering...');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored user data on app startup
    console.log('🔍 Checking for stored user data...');
    const storedUser = localStorage.getItem('notesapp_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('🔍 Found stored user data:', userData);
        console.log('🔍 Stored data keys:', Object.keys(userData));
        console.log('🔍 Has access_token:', userData.access_token ? 'YES' : 'NO');
        
        // Only authenticate if we have a valid access_token
        if (userData.access_token) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('✅ User authenticated from stored data');
        } else {
          console.log('❌ No valid access_token found, clearing storage');
          localStorage.removeItem('notesapp_user');
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('notesapp_user');
      }
    } else {
      console.log('🔍 No stored user data found');
    }
    setIsLoading(false);
  }, []);

  // Listen for storage changes (e.g., when API error handler clears auth)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('notesapp_user');
      if (!storedUser && isAuthenticated) {
        console.log('🚫 localStorage cleared, logging out user');
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', { email });
      const userData = await authAPI.login(email, password);
      console.log('📥 Login response received:', userData);
      console.log('📥 Login response keys:', Object.keys(userData || {}));
      console.log('📥 Access token in response:', userData?.access_token ? 'YES' : 'NO');
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      
      // Verify what was actually saved
      const savedData = JSON.parse(localStorage.getItem('notesapp_user') || '{}');
      console.log('💾 Data saved to localStorage:', savedData);
      console.log('💾 Saved data keys:', Object.keys(savedData));
      
      console.log('Login successful, user authenticated');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
      const userData = await authAPI.register(name, email, password);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('notesapp_user');
      // Clear any other user data
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