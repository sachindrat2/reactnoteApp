// API Base Configuration - ALWAYS use absolute URL
const BACKEND_URL = 'https://notesapps-b0bqb4degeekb6cn.japanwest-01.azurewebsites.net';

// Force absolute URL to prevent relative resolution issues
const getAbsoluteBackendUrl = () => {
  // Ensure we always return an absolute URL
  const url = BACKEND_URL.startsWith('http') ? BACKEND_URL : `https://${BACKEND_URL}`;
  console.log('🔗 Backend URL:', url);
  return url;
};

// Version indicator for debugging
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.0.0';
const IS_PRODUCTION = import.meta.env.PROD;

console.log(`🔄 API Service loaded - Version: ${APP_VERSION} - Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);

// Global flag to track if we should skip API attempts (for better UX)
let apiConnectionFailed = false;
let corsFailureDetected = false;

// Request queue to prevent simultaneous API calls
let activeRequests = new Map();
let requestCounter = 0;

// Always use direct connection to Azure backend
const CORS_PROXIES = [
  (url) => {
    const absoluteUrl = url.startsWith('http') ? url : `https://${url}`;
    return absoluteUrl;
  }
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


// Always use Azure backend URL
const getApiUrl = () => getAbsoluteBackendUrl();

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



const getApiUrlWithFallback = () => {
  return getAbsoluteBackendUrl();
};

// API endpoint paths
const API_ENDPOINTS = {
  LOGIN: '/token',
  REGISTER: '/register',
  LOGOUT: '/logout',
  NOTES: '/notes',
  REFRESH: '/refresh'
};

// Token refresh API function
export const refreshTokenAPI = async () => {
  const url = `${getApiUrl()}${API_ENDPOINTS.REFRESH}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include', // <-- send cookies!
  });
  if (!response.ok) throw new Error('Failed to refresh token');
  return await response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const userDataStr = localStorage.getItem('notesapp_user');
  if (!userDataStr) {
    console.log('🔑 No authentication data founds');
    return {
      'Content-Type': 'application/json'
    };
  }

  let user;
  try {
    user = JSON.parse(userDataStr);
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('notesapp_user');
    return {
      'Content-Type': 'application/json'
    };
  }

  // Get the access token
  const token = user.access_token;
  if (!token) {
    console.warn('� No access token found in user data');
    return {
      'Content-Type': 'application/json'
    };
  }

  // Debug: Show Authorization header preview
  const authHeader = `Bearer ${token.substring(0, 30)}...`;
  console.log('🔑 Using access token for authentication');
  console.log('   - Authorization header:', authHeader);

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};// Generic API request function with better error handling and fallback
const apiRequest = async (endpoint, options = {}) => {
  const requestId = ++requestCounter;
  const requestKey = `${options.method || 'GET'}_${endpoint}`;

  // Check if the same request is already in progress
  if (activeRequests.has(requestKey)) {
    console.log(`⏸️ Request ${requestId}: Duplicate ${requestKey} detected, waiting for existing request...`);
    return await activeRequests.get(requestKey);
  }

  console.log(`🚀 Request ${requestId}: Starting ${requestKey} at ${new Date().toISOString()}`);

  const requestPromise = (async () => {
    try {
      const baseUrl = getApiUrl();
      const url = `${baseUrl}${endpoint}`;
      const result = await makeRequest(url, options, endpoint);
      console.log(`✅ Request ${requestId}: ${requestKey} completed successfully`);
      return result;
    } finally {
      // Clean up the active request
      activeRequests.delete(requestKey);
    }
  })();

  // Store the promise so duplicate requests can await it
  activeRequests.set(requestKey, requestPromise);
  return await requestPromise;
};

// Extracted request logic with timeout
const makeRequest = async (url, options = {}, endpoint) => {
  const config = {
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
      // Set Content-Type for requests with body (unless overridden)
      ...(options.body && !options.headers?.['Content-Type'] ? { 'Content-Type': 'application/json' } : {}),
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
        
        // Clear any stored auth immediately on 401
        console.log('🧹 Clearing invalid token from localStorage after 401');
        localStorage.removeItem('notesapp_user');
        
        // Dispatch event for components to handle
        console.log('� Dispatching token expiration event due to 401 error');
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
      throw new Error('CORS_ERROR: Unable to connect to server due to CORS policy restrictions. Please check your network connection and try again.');
    }
    
    // Handle specific network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      apiConnectionFailed = true;
      console.error('🌐 Network Error - unable to connect to server');
      throw new Error('NETWORK_ERROR: Unable to connect to server. Please check your internet connection and try again.');
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
      body: formData.toString(),
      credentials: 'include', // <-- send cookies!
    });
  },

  register: async (username, password) => {
    console.log('Register attempt with:', { username, password: password ? '[HIDDEN]' : 'EMPTY' });
    
    // Server expects username and password format
    const payload = { 
      username: username,
      password: password 
    };
    console.log('Registration payload:', { username: payload.username, password: '[HIDDEN]' });
    
    return apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
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
          console.log('� Dispatching token expiration event due to 401 in handleAPIError');
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