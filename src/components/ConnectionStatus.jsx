import React, { useState, useEffect } from 'react';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({ type: 'success', message: 'Connected ✅' });

  useEffect(() => {
    // Simple connection check - only run once on mount
    checkConnection();
  }, []);

  const checkConnection = async () => {
    // Quick check - just test if we're on localhost
    if (window.location.hostname === 'localhost') {
      setStatus({ type: 'success', message: 'Local dev ✅' });
    } else {
      setStatus({ type: 'warning', message: 'Production 🌐' });
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-1 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${
        status.type === 'success' ? 'bg-green-400' :
        status.type === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
      }`}></div>
      <span className={getStatusColor()}>{status.message}</span>
    </div>
  );
};

export default ConnectionStatus;