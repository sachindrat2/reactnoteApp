import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthHealthChecker = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);
  const [autoFixAttempts, setAutoFixAttempts] = useState(0);

  const checkTokenHealth = async () => {
    if (!isAuthenticated || !user) {
      setHealthStatus('not-authenticated');
      return;
    }

    const token = user.access_token || user.token;
    if (!token) {
      setHealthStatus('no-token');
      return;
    }

    // Check if token is JWT and validate expiration
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            
            if (now > expDate) {
              console.log('🚨 AuthHealthChecker: Token expired', { expDate, now });
              setHealthStatus('token-expired');
              
              // Auto-fix: logout user
              if (autoFixAttempts < 1) {
                console.log('🔧 Auto-fixing expired token by logging out');
                setAutoFixAttempts(prev => prev + 1);
                await logout();
                return;
              }
            }
          }
        } catch (e) {
          console.log('⚠️ Could not decode JWT payload');
        }
      }
    }

    // Test token with API
    try {
      const baseUrl = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';
      const response = await fetch(`${baseUrl}/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (response.status === 401) {
        console.log('🚨 AuthHealthChecker: API returned 401');
        setHealthStatus('api-rejected');
        
        // Auto-fix: logout user
        if (autoFixAttempts < 1) {
          console.log('🔧 Auto-fixing 401 error by logging out');
          setAutoFixAttempts(prev => prev + 1);
          await logout();
          return;
        }
      } else if (response.ok) {
        setHealthStatus('healthy');
      } else {
        setHealthStatus(`api-error-${response.status}`);
      }
    } catch (error) {
      console.log('🌐 AuthHealthChecker: API test failed', error.message);
      
      if (error.message.includes('CORS')) {
        setHealthStatus('cors-blocked');
      } else {
        setHealthStatus('network-error');
      }
    }

    setLastCheck(new Date());
  };

  // Run health check on mount and when auth state changes
  useEffect(() => {
    checkTokenHealth();
  }, [isAuthenticated, user]);

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = () => {
      console.log('🚨 AuthHealthChecker: Received token expiration event');
      setHealthStatus('token-expired-event');
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  // Auto-check every 5 minutes if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      console.log('🔄 AuthHealthChecker: Running periodic health check');
      checkTokenHealth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Don't render anything in production unless there's an issue
  if (healthStatus === 'healthy' || healthStatus === 'checking') {
    return null;
  }

  const getStatusMessage = () => {
    switch (healthStatus) {
      case 'not-authenticated':
        return null; // Normal state
      case 'no-token':
        return '⚠️ Authentication data is missing token';
      case 'token-expired':
        return '🕐 Your session has expired';
      case 'api-rejected':
        return '🚫 Server rejected your authentication';
      case 'token-expired-event':
        return '🚨 Session expired (detected automatically)';
      case 'cors-blocked':
        return '🔒 Connection blocked by browser security';
      case 'network-error':
        return '🌐 Network connection issues detected';
      default:
        return `⚠️ Authentication issue: ${healthStatus}`;
    }
  };

  const statusMessage = getStatusMessage();
  
  if (!statusMessage) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <span>{statusMessage}</span>
        {(healthStatus === 'token-expired' || healthStatus === 'api-rejected' || healthStatus === 'token-expired-event') && (
          <button
            onClick={() => window.location.reload()}
            className="ml-2 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
          >
            Refresh
          </button>
        )}
      </div>
      {lastCheck && (
        <div className="text-xs text-yellow-600 mt-1">
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default AuthHealthChecker;