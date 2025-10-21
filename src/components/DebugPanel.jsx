import React, { useState, useEffect } from 'react';
import { notesAPI } from '../services/api.js';
import { notesService } from '../services/notesService.js';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [apiNotes, setApiNotes] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const gatherDebugInfo = () => {
    const userStr = localStorage.getItem('notesapp_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const cacheKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('notesapp_notes_cache')) {
        cacheKeys.push(key);
      }
    }

    setDebugInfo({
      userRaw: userStr,
      user: user,
      userId: user?.user?.id || user?.id,
      userEmail: user?.user?.email || user?.email,
      hasToken: !!(user?.access_token || user?.token),
      tokenPreview: user?.access_token?.substring(0, 20) || user?.token?.substring(0, 20) || 'None',
      cacheKeys: cacheKeys,
      cacheKeysCounts: cacheKeys.map(key => ({
        key,
        count: JSON.parse(localStorage.getItem(key) || '[]').length
      }))
    });
  };

  const testAPICall = async () => {
    try {
      console.log('🧪 Debug: Testing direct API call...');
      const result = await notesAPI.getAllNotes();
      setApiNotes(result);
      console.log('🧪 Debug: API result:', result);
    } catch (error) {
      console.log('🧪 Debug: API error:', error);
      setApiNotes({ error: error.message });
    }
  };

  const testServiceCall = async () => {
    try {
      console.log('🧪 Debug: Testing service call...');
      const result = await notesService.fetchNotes(true); // Force refresh
      console.log('🧪 Debug: Service result:', result);
    } catch (error) {
      console.log('🧪 Debug: Service error:', error);
    }
  };

  useEffect(() => {
    gatherDebugInfo();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-xs z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug Panel</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">User Info</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={testAPICall}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
            >
              Test API Call
            </button>
            <button
              onClick={testServiceCall}
              className="bg-green-500 text-white px-4 py-2 rounded text-sm"
            >
              Test Service Call
            </button>
            <button
              onClick={gatherDebugInfo}
              className="bg-purple-500 text-white px-4 py-2 rounded text-sm"
            >
              Refresh Info
            </button>
          </div>

          {apiNotes && (
            <div>
              <h3 className="font-semibold mb-2">API Response</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                {JSON.stringify(apiNotes, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;