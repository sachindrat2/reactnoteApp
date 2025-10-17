import React, { useState, useEffect } from 'react';

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setDebugInfo(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog('=== AUTH DEBUG COMPONENT MOUNTED ===');
    
    // Check localStorage immediately
    const storedUser = localStorage.getItem('notesapp_user');
    addLog(`localStorage 'notesapp_user': ${storedUser ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        addLog(`Parsed user data keys: ${Object.keys(userData).join(', ')}`);
        addLog(`Has access_token: ${userData.access_token ? 'YES' : 'NO'}`);
        if (userData.access_token) {
          addLog(`Token preview: ${userData.access_token.substring(0, 30)}...`);
        }
      } catch (error) {
        addLog(`Error parsing user data: ${error.message}`);
      }
    }
    
    // Test if token is valid
    const testToken = async () => {
      const userData = JSON.parse(localStorage.getItem('notesapp_user') || '{}');
      if (!userData.access_token) {
        addLog('No token to test');
        return;
      }
      
      try {
        addLog('Testing token validity...');
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net'
          : `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent('https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net')}`;
        
        const response = await fetch(`${baseUrl}/notes`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        addLog(`Token test response: ${response.status}`);
        
        if (response.status === 401) {
          addLog('❌ TOKEN IS INVALID - This is why auth fails on refresh!');
        } else if (response.ok) {
          addLog('✅ Token is valid - auth should work');
        } else {
          addLog(`⚠️ Unexpected response: ${response.status}`);
        }
        
      } catch (error) {
        addLog(`Token test error: ${error.message}`);
      }
    };
    
    if (storedUser) {
      testToken();
    }
    
    // Monitor localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'notesapp_user') {
        addLog(`localStorage changed: ${e.newValue ? 'SET' : 'REMOVED'}`);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'black', 
      color: 'lime', 
      padding: '10px', 
      maxWidth: '400px', 
      maxHeight: '300px', 
      overflow: 'auto', 
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: '1px solid lime'
    }}>
      <div><strong>AUTH DEBUG</strong></div>
      {debugInfo.map((info, index) => (
        <div key={index}>{info}</div>
      ))}
    </div>
  );
};

export default AuthDebug;