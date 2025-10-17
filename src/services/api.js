// API Base Configuration
const BACKEND_URL = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';

// Version indicator for debugging
console.log('🔄 API Service loaded - Version: Multi-proxy fallback v2.0');

// Use multiple CORS proxies with fallback for production
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
];

const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return BACKEND_URL;
  }
  
  // Try the first proxy by default
  return CORS_PROXIES[0](BACKEND_URL);
};

// Store failed proxy attempts to avoid retrying
let failedProxies = new Set();

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
    for (let proxyIndex = 0; proxyIndex < CORS_PROXIES.length; proxyIndex++) {
      try {
        const baseUrl = getApiUrlWithFallback(proxyIndex);
        const url = `${baseUrl}${endpoint}`;
        
        console.log(`Trying proxy ${proxyIndex + 1}/${CORS_PROXIES.length}:`, url);
        
        const result = await makeRequest(url, options, endpoint);
        console.log(`Proxy ${proxyIndex + 1} succeeded`);
        return result;
      } catch (error) {
        console.log(`Proxy ${proxyIndex + 1} failed:`, error.message);
        lastError = error;
        
        // If this is a CORS error, try the next proxy
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          continue;
        }
        
        // For other errors, don't try more proxies
        break;
      }
    }
    
    // If all proxies failed, throw the last error
    throw new Error(`All CORS proxies failed. Last error: ${lastError?.message || 'Unknown error'}`);
  } else {
    // Local development - use direct URL
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${endpoint}`;
    return makeRequest(url, options, endpoint);
  }
};

// Extracted request logic
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

  try {
    const response = await fetch(url, config);
    
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