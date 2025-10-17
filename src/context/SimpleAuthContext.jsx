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
  // Simple initialization - read localStorage once
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('notesapp_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.access_token) {
          console.log('✅ Initial auth: User found with token');
          return userData;
        }
      }
      console.log('❌ Initial auth: No valid user found');
      return null;
    } catch (error) {
      console.error('❌ Initial auth: Error reading localStorage:', error);
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // Simple effect to sync isAuthenticated with user state
  useEffect(() => {
    setIsAuthenticated(!!user);
    console.log('🔄 Auth state synced:', { hasUser: !!user, isAuthenticated: !!user });
  }, [user]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login...');
      
      const userData = await authAPI.login(email, password);
      console.log('✅ Login successful:', userData);
      
      setUser(userData);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
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
    } finally {
      console.log('🚪 Logging out user');
      setUser(null);
      localStorage.removeItem('notesapp_user');
      localStorage.removeItem('notesapp_notes_cache');
    }
  };

  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
      const userData = await authAPI.register(name, email, password);
      setUser(userData);
      localStorage.setItem('notesapp_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
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