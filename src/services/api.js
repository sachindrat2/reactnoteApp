// API Base Configuration
const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';

// Version indicator for debugging
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.0.0';
const IS_PRODUCTION = import.meta.env.PROD;

console.log(`🔄 API Service loaded - Version: ${APP_VERSION} - Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);

// Global flag to track if we should skip API attempts (for better UX)
let apiConnectionFailed = false;
let corsFailureDetected = false;

// Use multiple CORS proxies with fallback for production
const CORS_PROXIES = [
  // Try direct connection first (may work if CORS is fixed server-side)
  (url) => url,
  // Reliable CORS proxies for production
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // Backup proxies
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
];

// Final fallback: try direct connection with no-cors mode
const tryNoCorsRequest = async (url, options = {}) => {
  console.log('🔄 Trying no-cors mode as final fallback...');
  
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'no-cors',
      credentials: 'omit'
    });
    
    // no-cors responses are opaque, so we can't read the body
    // but we can check if the request succeeded
    if (response.type === 'opaque') {
      console.log('✅ no-cors request succeeded (opaque response)');
      return { success: true, opaque: true };
    }
    
    return response;
  } catch (error) {
    console.log('❌ no-cors request also failed:', error.message);
    throw error;
  }
};

const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    // Use local CORS proxy when on localhost
    return 'http://localhost:3001/api';
  }
  
  // Try the first proxy by default
  return CORS_PROXIES[0](BACKEND_URL);
};

// Enhanced CORS detection and error handling
const detectCorsError = (error) => {
  const corsIndicators = [
    'CORS',
    'Cross-Origin',
    'Access-Control',
    'No \'Access-Control-Allow-Origin\'',
    'has been blocked by CORS policy',
    'preflight'
  ];
  
  const errorString = error.toString().toLowerCase();
  return corsIndicators.some(indicator => 
    errorString.includes(indicator.toLowerCase())
  );
};

// Store failed proxy attempts to avoid retrying
let failedProxies = new Set();

// Store working proxy index to try successful ones first
let workingProxyIndex = 0;

const getApiUrlWithFallback = (proxyIndex = 0) => {
  if (window.location.hostname === 'localhost') {
    // Use local CORS proxy when on localhost
    return 'http://localhost:3001/api';
  }
  
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('All CORS proxies failed');
  }
  
  return CORS_PROXIES[proxyIndex](BACKEND_URL);
};

// API endpoint paths
const API_ENDPOINTS = {
  LOGIN: '/token',
  REGISTER: '/register',
  LOGOUT: '/logout',
  NOTES: '/notes'
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const userDataStr = localStorage.getItem('notesapp_user') || '{}';
  let user;
  
  try {
    user = JSON.parse(userDataStr);
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('notesapp_user');
    user = {};
  }
  
  // Handle different possible user data formats
  let token = null;
  
  // Check for direct token fields
  if (user.access_token) {
    token = user.access_token;
  } else if (user.token) {
    token = user.token;
  } else if (user.opaque === true || user.success === true || !user.access_token) {
    // This is an opaque/invalid response, clear it and don't use authentication
    console.warn('🔑 Found opaque/invalid auth response, clearing authentication...');
    localStorage.removeItem('notesapp_user');
    token = null; // Don't send any token for invalid auth
  }
  
  console.log('🔑 Getting auth headers:');
  console.log('   - User data keys:', Object.keys(user));
  console.log('   - Token found:', token ? 'YES' : 'NO');
  console.log('   - Token preview:', token ? token.substring(0, 20) + '...' : 'None');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  console.log('   - Headers:', Object.keys(headers));
  
  return headers;
};

// Generic API request function with better error handling and fallback
const apiRequest = async (endpoint, options = {}) => {
  let lastError;
  
  // Try multiple proxies in production
  if (window.location.hostname !== 'localhost') {
    // Start with the last working proxy if we have one
    const tryOrder = [...Array(CORS_PROXIES.length).keys()];
    if (workingProxyIndex > 0) {
      tryOrder.splice(workingProxyIndex, 1);
      tryOrder.unshift(workingProxyIndex);
    }
    
    for (let i = 0; i < tryOrder.length; i++) {
      const proxyIndex = tryOrder[i];
      try {
        const baseUrl = getApiUrlWithFallback(proxyIndex);
        const url = `${baseUrl}${endpoint}`;
        
        console.log(`Trying proxy ${proxyIndex + 1}/${CORS_PROXIES.length} (${proxyIndex === 0 ? 'direct' : 'proxy'}):`, url);
        
        const result = await makeRequest(url, options, endpoint);
        console.log(`Proxy ${proxyIndex + 1} succeeded - caching for future use`);
        workingProxyIndex = proxyIndex; // Cache successful proxy
        return result;
      } catch (error) {
        console.log(`Proxy ${proxyIndex + 1} failed:`, error.message);
        lastError = error;
        
        // For production, be aggressive about trying next proxy for any network-related error
        if (error.message.includes('CORS') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('timeout') ||
            error.message.includes('ERR_FAILED') ||
            error.message.includes('net::') ||
            error.name === 'TypeError') {
          continue;
        }
        
        // For authentication or API errors, don't try more proxies
        break;
      }
    }
    
    // If all proxies failed, try no-cors mode as final fallback for specific endpoints
    if (endpoint === '/token' || endpoint === '/register') {
      console.log('🔄 All proxies failed, trying no-cors mode for authentication...');
      try {
        const directUrl = `${BACKEND_URL}${endpoint}`;
        const noCorsResult = await tryNoCorsRequest(directUrl, options);
        if (noCorsResult.success && noCorsResult.opaque) {
          // For opaque responses, we can't read the data, but we know the request went through
          // Return a success response that the calling code can handle
          return { 
            success: true, 
            opaque: true,
            message: 'Request sent successfully (response not readable due to CORS)'
          };
        }
      } catch (noCorsError) {
        console.log('❌ no-cors fallback also failed:', noCorsError.message);
      }
    }
    
    // If all proxies failed, show a helpful error message
    console.error('🚨 All proxy attempts failed. This is likely due to CORS restrictions.');
    console.log('💡 To fix this permanently, the backend server needs to add CORS headers for:', window.location.origin);
    
    throw new Error(`Connection failed: Unable to reach the server through any available proxy. The backend server may need to enable CORS for this domain.`);
  } else {
    // Local development - try CORS proxy first, then fallback to production proxies
    try {
      const baseUrl = getApiUrl();
      const url = `${baseUrl}${endpoint}`;
      console.log('🏠 Localhost request:', { baseUrl, endpoint, url });
      return await makeRequest(url, options, endpoint);
    } catch (localError) {
      console.log('❌ Local CORS proxy failed, trying production proxies:', localError.message);
      
      // Fallback to production proxy logic if local proxy fails
      for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
          const baseUrl = getApiUrlWithFallback(i);
          const url = `${baseUrl}${endpoint}`;
          console.log(`🔄 Trying fallback proxy ${i + 1}:`, url);
          
          const result = await makeRequest(url, options, endpoint);
          console.log(`✅ Fallback proxy ${i + 1} succeeded`);
          return result;
        } catch (proxyError) {
          console.log(`❌ Fallback proxy ${i + 1} failed:`, proxyError.message);
          lastError = proxyError;
        }
      }
      
      throw lastError || localError;
    }
  }
};

// Extracted request logic with timeout
const makeRequest = async (url, options = {}, endpoint) => {
  const config = {
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
      ...options.headers,  // Allow options to override headers
    },
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-cache',
    ...options
  };

  // Optimized logging for production
  if (!IS_PRODUCTION) {
    console.log('API Request:', { 
      url: url.split('?')[0], // Hide query params for cleaner logs
      method: config.method || 'GET',
      isLocalhost: window.location.hostname === 'localhost'
    });
  }

  // Add timeout wrapper - reduced for better responsiveness
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
  });

  try {
    const response = await Promise.race([
      fetch(url, config),
      timeoutPromise
    ]);
    
    console.log('Response Status:', response.status);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        if (textData && textData.trim() !== '') {
          try {
            data = JSON.parse(textData);
          } catch {
            data = textData;
          }
        } else {
          data = null;
        }
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      data = null;
    }

    console.log('Processed Response Data:', data);

    // Handle response based on status
    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        data: data
      });
      
      // Handle 401 errors specifically
      if (response.status === 401) {
        console.log('🚫 401 Unauthorized - clearing auth and triggering event');
        
        // Clear any stored auth immediately
        localStorage.removeItem('notesapp_user');
        
        // Dispatch event for components to handle
        window.dispatchEvent(new CustomEvent('auth:token-expired', {
          detail: { 
            reason: 'API returned 401 Unauthorized',
            endpoint: endpoint,
            url: url
          }
        }));
        
        throw new Error('401: Unauthorized - Session expired');
      }
      
      // Check if this is a token response with valid data despite error status
      if (endpoint === '/token' && data && (data.access_token || (typeof data === 'object' && data !== null && Object.keys(data).length > 0))) {
        console.log('Token endpoint returned error status but has valid data, treating as success');
        return data;
      }
      
      const errorMessage = data?.detail || data?.message || data || `HTTP error! status: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Detect CORS-specific errors
    if (detectCorsError(error)) {
      corsFailureDetected = true;
      console.error('🚨 CORS Error Detected:', error.message);
      throw new Error('CORS_ERROR: Unable to connect to server due to CORS policy restrictions. The app will work in offline mode.');
    }
    
    // Handle specific network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      apiConnectionFailed = true;
      console.error('🌐 Network Error - switching to offline mode');
      throw new Error('NETWORK_ERROR: Unable to connect to server. The app will work in offline mode.');
    }
    
    // Handle timeout errors
    if (error.message.includes('timeout')) {
      console.error('⏰ Request Timeout - server too slow');
      throw new Error('TIMEOUT_ERROR: Server is taking too long to respond (>30 seconds). Please check your connection or try again later.');
    }
    
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  login: async (email, password) => {
    // Create form data for OAuth2 token endpoint
    const formData = new URLSearchParams();
    formData.append('username', email);  // OAuth2 uses 'username' field
    formData.append('password', password);
    
    console.log('Login attempt with:', { email, password: password ? '[HIDDEN]' : 'EMPTY' });
    console.log('Form data:', formData.toString());
    
    return apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
  },

  register: async (name, email, password) => {
    return apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  logout: async () => {
    return apiRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST'
    });
  }
};

// Notes API functions
export const notesAPI = {
  getAllNotes: async () => {
    console.log('📋 Fetching all notes...');
    const user = JSON.parse(localStorage.getItem('notesapp_user') || '{}');
    console.log('👤 Current user for notes fetch:', {
      email: user.user?.email || user.email,
      id: user.user?.id || user.id,
      hasToken: !!(user.access_token || user.token)
    });
    
    const result = await apiRequest(API_ENDPOINTS.NOTES, {
      method: 'GET'
    });
    
    console.log('📋 getAllNotes API result:', result);
    return result;
  },

  createNote: async (noteData) => {
    console.log('📝 Creating note with data:', noteData);
    return apiRequest(API_ENDPOINTS.NOTES, {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  },

  updateNote: async (noteId, noteData) => {
    return apiRequest(`${API_ENDPOINTS.NOTES}/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(noteData)
    });
  },

  deleteNote: async (noteId) => {
    return apiRequest(`${API_ENDPOINTS.NOTES}/${noteId}`, {
      method: 'DELETE'
    });
  },

  getNoteById: async (noteId) => {
    return apiRequest(`${API_ENDPOINTS.NOTES}/${noteId}`, {
      method: 'GET'
    });
  }
};

// Enhanced error handling utility with automatic token cleanup
export const handleAPIError = (error) => {
  console.log('🔍 Handling API error:', error.message);
  
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    console.log('🚫 401 error detected - token expired or invalid');
    
    // Check if we have stored auth data
    const storedUser = localStorage.getItem('notesapp_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const token = userData.access_token || userData.token;
        
        if (token) {
          console.log('🧹 Clearing expired/invalid token from localStorage');
          localStorage.removeItem('notesapp_user');
          
          // Trigger a custom event that components can listen to
          window.dispatchEvent(new CustomEvent('auth:token-expired', {
            detail: { reason: 'Token expired or invalid (401 error)' }
          }));
        }
      } catch (e) {
        console.error('Error parsing stored user data during 401 handling:', e);
        localStorage.removeItem('notesapp_user');
      }
    }
    
    return 'Your session has expired. Please login again.';
  }
  
  if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }
  
  if (error.message.includes('CORS')) {
    return 'Connection blocked by browser security. Please try refreshing the page.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

export default apiRequest;