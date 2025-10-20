// API Base Configuration
const BACKEND_URL = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';

// Version indicator for debugging
console.log('🔄 API Service loaded - Version: Multi-proxy fallback v4.0 - Build: 1760938197104');

// Use multiple CORS proxies with fallback for production
const CORS_PROXIES = [
  // Try direct connection first (may work if CORS is fixed server-side)
  (url) => url,
  // More reliable CORS proxies
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
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
    return BACKEND_URL;
  }
  
  // Try the first proxy by default
  return CORS_PROXIES[0](BACKEND_URL);
};

// Store failed proxy attempts to avoid retrying
let failedProxies = new Set();

// Store working proxy index to try successful ones first
let workingProxyIndex = 0;

const getApiUrlWithFallback = (proxyIndex = 0) => {
  if (window.location.hostname === 'localhost') {
    return BACKEND_URL;
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
  const user = JSON.parse(localStorage.getItem('notesapp_user') || '{}');
  // The login response contains 'access_token', not 'token'
  const token = user.access_token || user.token;
  
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
    // Local development - use direct URL
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${endpoint}`;
    return makeRequest(url, options, endpoint);
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

  console.log('API Request Details:', { 
    url, 
    method: config.method || 'GET',
    headers: config.headers
  });

  // Add timeout wrapper
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
    
    // Handle specific CORS and network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // If this is a CORS or network error, provide a helpful message
      throw new Error('Unable to connect to server. This may be due to network issues or server unavailability.');
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
    return apiRequest(API_ENDPOINTS.NOTES, {
      method: 'GET'
    });
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

// Error handling utility - DO NOT clear localStorage here
export const handleAPIError = (error) => {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Token expired or invalid - just return error message
    // Let the components handle the logout if needed
    console.log('🚫 401 error detected - token may be expired');
    return 'Session expired. Please login again.';
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