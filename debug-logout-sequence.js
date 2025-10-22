// Debug script to track logout sequence
console.log('=== LOGOUT DEBUG SEQUENCE TRACKER ===');

// Override localStorage methods to track all changes
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
  if (key === 'notesapp_user') {
    console.log('🔥 LOCALSTORAGE SET:', key, 'at', new Date().toISOString());
    console.trace('SET STACK TRACE');
  }
  return originalSetItem.call(this, key, value);
};

localStorage.removeItem = function(key) {
  if (key === 'notesapp_user') {
    console.log('🗑️ LOCALSTORAGE REMOVE:', key, 'at', new Date().toISOString());
    console.trace('REMOVE STACK TRACE');
  }
  return originalRemoveItem.call(this, key);
};

// Track auth events
window.addEventListener('auth:token-expired', (event) => {
  console.log('🚨 AUTH TOKEN EXPIRED EVENT:', event.detail, 'at', new Date().toISOString());
  console.trace('TOKEN EXPIRED STACK TRACE');
});

// Track all API calls that might trigger logout
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('notes')) {
    console.log('📡 NOTES API CALL:', url, 'at', new Date().toISOString());
    
    return originalFetch.apply(this, args).then(response => {
      console.log('📡 NOTES API RESPONSE:', response.status, response.statusText, 'at', new Date().toISOString());
      if (response.status === 401) {
        console.log('🚨 401 DETECTED IN NOTES API!');
      }
      return response;
    }).catch(error => {
      console.log('📡 NOTES API ERROR:', error.message, 'at', new Date().toISOString());
      return Promise.reject(error);
    });
  }
  return originalFetch.apply(this, args);
};

// Monitor for immediate consecutive API calls that might cause issues
let lastApiCall = 0;
let apiCallCount = 0;

const trackApiTiming = () => {
  const now = Date.now();
  if (now - lastApiCall < 100) { // Less than 100ms apart
    apiCallCount++;
    console.log('⚡ RAPID API CALLS DETECTED:', apiCallCount, 'calls within 100ms');
  } else {
    apiCallCount = 0;
  }
  lastApiCall = now;
};

// Add this to track when APIs are called
const originalApiRequest = window.apiRequest;
if (originalApiRequest) {
  window.apiRequest = function(...args) {
    trackApiTiming();
    return originalApiRequest.apply(this, args);
  };
}

console.log('🕵️ Debug tracking initialized - reload the app to see logout sequence');