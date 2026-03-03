// API Base Configuration - Use environment variable or fallback
// Set your backend URL via VITE_API_URL or fallback to the correct base URL
const BACKEND_URL = 'https://backend-noteapp-new.salmonground-95e8af22.japaneast.azurecontainerapps.io';

// Prevent duplicate 401 events
let tokenExpiredEventSent = false;
let tokenExpiredEventReset = null;

// Force absolute URL to prevent relative resolution issues
const getAbsoluteBackendUrl = () => {
  // Ensure we always return an absolute URL
  const url = BACKEND_URL.startsWith('http') ? BACKEND_URL : `https://${BACKEND_URL}`;
  console.log('Backend URL:', url);
  return url;
};

// Version indicator for debugging
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.0.0';
const IS_PRODUCTION = import.meta.env.PROD;

console.log(`API Service loaded - Version: ${APP_VERSION} - Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);

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
  console.log('Trying no-cors mode as final fallback...');
  
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
  REFRESH: '/refresh',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  PROFILE_AVATAR: '/profile/avatar',
  PROFILE_USERNAME: '/profile/username',
  PROFILE_EMAIL: '/profile/email'
};

// Token refresh API function
export const refreshTokenAPI = async () => {
  const url = `${getApiUrl()}${API_ENDPOINTS.REFRESH}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include', // <-- send cookies!
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Refresh token is invalid/expired
        console.log('Refresh token expired or invalid (401)');
        throw new Error('Refresh token expired - please login again');
      }
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error.message);
    throw error;
  }
};

// Helper function to get auth headers
const getAuthHeaders = (excludeContentType = false) => {
  const userDataStr = localStorage.getItem('notesapp_user');
  if (!userDataStr) {
    console.log('No authentication data founds');
    return excludeContentType ? {} : {
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
    return excludeContentType ? {} : {
      'Content-Type': 'application/json'
    };
  }

  // Get the access token
  const token = user.access_token;
  if (!token) {
    console.warn('No access token found in user data');
    return excludeContentType ? {} : {
      'Content-Type': 'application/json'
    };
  }

  // Debug: Show Authorization header preview
  const authHeader = `Bearer ${token.substring(0, 30)}...`;
  console.log('🔑 Using access token for authentication');
  console.log('   - Authorization header:', authHeader);

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  if (!excludeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Generic API request function with better error handling and fallback
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
  const isFormData = options.body instanceof FormData;
  
  const config = {
    headers: {
      // For FormData, exclude Content-Type to let browser set multipart boundary
      ...getAuthHeaders(isFormData),
      'Accept': 'application/json',
      // Set Content-Type for JSON requests only (not for FormData)
      ...(options.body && !isFormData && !options.headers?.['Content-Type'] ? { 'Content-Type': 'application/json' } : {}),
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
      isLocalhost: window.location.hostname === 'localhost',
      headers: config.headers,
      bodyType: config.body?.constructor?.name
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
      
      // Also log the raw data for debugging
      console.error('Raw error data:', data);
      console.error('Data type:', typeof data);
      console.error('Data stringified:', JSON.stringify(data, null, 2));
      
      // Handle 401 errors specifically
      if (response.status === 401) {
        console.log('🚫 401 Unauthorized - clearing auth and triggering event');
        
        // Prevent duplicate events
        if (!tokenExpiredEventSent) {
          tokenExpiredEventSent = true;
          
          // Clear any stored auth immediately on 401
          console.log('🧹 Clearing invalid token from localStorage after 401');
          localStorage.removeItem('notesapp_user');
          
          // Dispatch event for components to handle
          console.log('Dispatching token expiration event due to 401 error');
          window.dispatchEvent(new CustomEvent('auth:token-expired', {
            detail: { 
              reason: 'API returned 401 Unauthorized',
              endpoint: endpoint,
              url: url
            }
          }));
          
          // Reset the flag after 5 seconds to allow future 401 events
          if (tokenExpiredEventReset) clearTimeout(tokenExpiredEventReset);
          tokenExpiredEventReset = setTimeout(() => {
            tokenExpiredEventSent = false;
            tokenExpiredEventReset = null;
          }, 5000);
        }
        
        throw new Error('401: Unauthorized - Session expired');
      }
      
      // Check if this is a token response with valid data despite error status
      if (endpoint === '/token' && data && (data.access_token || (typeof data === 'object' && data !== null && Object.keys(data).length > 0))) {
        console.log('Token endpoint returned error status but has valid data, treating as success');
        return data;
      }
      
      let errorMessage = 'Unknown error occurred';
      
      console.log('Extracting error message from data:', data);
      console.log('data?.detail:', data?.detail);
      console.log('data?.message:', data?.message);
      console.log('typeof data:', typeof data);
      
      if (data?.detail) {
        errorMessage = data.detail;
        console.log('Using data.detail:', errorMessage);
      } else if (data?.message) {
        errorMessage = data.message;
        console.log('Using data.message:', errorMessage);
      } else if (typeof data === 'string') {
        errorMessage = data;
        console.log('Using data as string:', errorMessage);
      } else if (data && typeof data === 'object') {
        console.log('Processing object data...');
        // Try to extract meaningful error information from object
        if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          console.log('Using data.error:', errorMessage);
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(e => typeof e === 'string' ? e : e.message || JSON.stringify(e)).join(', ');
          console.log('Using data.errors array:', errorMessage);
        } else {
          console.log('No standard error fields found, stringifying data...');
          // Last resort: stringify but handle potential issues
          try {
            errorMessage = JSON.stringify(data);
            console.log('Stringified data:', errorMessage);
            // If it's just {}, provide more context
            if (errorMessage === '{}') {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
              console.log('Empty object, using status:', errorMessage);
            }
          } catch (stringifyError) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            console.log('Stringify failed, using status:', errorMessage);
          }
        }
      } else {
        errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
        console.log('No data, using status:', errorMessage);
      }
      
      console.log('Final error message:', errorMessage);
      
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    if (detectCorsError(error)) {
      corsFailureDetected = true;
      console.error('CORS Error Detected:', error.message);
      throw new Error('CORS_ERROR: Unable to connect to server due to CORS policy restrictions.');
    }
    
    // Handle specific network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      apiConnectionFailed = true;
      console.error('Network Error - unable to connect to server');
      throw new Error('NETWORK_ERROR: Unable to connect to server. Please check your internet connection and try again.');
    }
    
    // Handle tunnel connection failures specifically
    if (error.message.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
      apiConnectionFailed = true;
      console.error('🚇 Tunnel Connection Failed - server unreachable');
      throw new Error('TUNNEL_CONNECTION_FAILED: Unable to establish connection to server. Server may be down or unreachable.');
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

  register: async (username, email, password) => {
    // Always require (username, email, password)
    let payload;
    if (typeof username === 'object' && username !== null) {
      payload = username;
    } else {
      payload = {
        username: username,
        email: email,
        password: password
      };
    }
    console.log('Registration payload:', { ...payload, password: '[HIDDEN]' });
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
  },

  verifyEmail: async (token) => {
    return apiRequest(`${API_ENDPOINTS.VERIFY_EMAIL}?token=${token}`, {
      method: 'GET'
    });
  },

  forgotPassword: async (email) => {
    return apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
  },

  resetPassword: async (token, password) => {
    return apiRequest(API_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, new_password: password })
    });
  },

  // Profile management endpoints
  getProfile: async () => {
    return apiRequest(API_ENDPOINTS.PROFILE, {
      method: 'GET'
    });
  },

  updateProfile: async (profileData) => {
    // Handle both FormData and JSON payloads
    const isFormData = profileData instanceof FormData;
    
    return apiRequest(API_ENDPOINTS.PROFILE, {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? profileData : JSON.stringify(profileData)
    });
  },

  updateUsername: async (newUsername) => {
    return apiRequest(API_ENDPOINTS.PROFILE_USERNAME, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_username: newUsername })
    });
  },

  updateEmail: async (newEmail) => {
    return apiRequest(API_ENDPOINTS.PROFILE_EMAIL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_email: newEmail })
    });
  },

  uploadAvatar: async (avatarFile) => {
    console.log('📤 Preparing avatar upload:', {
      file: avatarFile,
      name: avatarFile?.name,
      size: avatarFile?.size,
      type: avatarFile?.type,
      constructor: avatarFile?.constructor?.name
    });
    
    const formData = new FormData();
    formData.append('avatar', avatarFile);  // Backend expects 'avatar' field name
    
    console.log('📄 FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    return apiRequest(API_ENDPOINTS.PROFILE_AVATAR, {
      method: 'POST',
      body: formData
    });
  },

  removeAvatar: async () => {
    return apiRequest(API_ENDPOINTS.PROFILE_AVATAR, {
      method: 'DELETE'
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
    console.log('📝 Tags being sent:', noteData.tags);
    console.log('📝 Images being sent:', noteData.images);
    const result = await apiRequest(API_ENDPOINTS.NOTES, {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
    console.log('📝 Create note API response:', result);
    return result;
  },

  updateNote: async (noteId, noteData) => {
    console.log('📝 Updating note with data:', noteData);
    console.log('📝 Tags being updated:', noteData.tags);
    console.log('📝 Images being updated:', noteData.images);
    const result = await apiRequest(`${API_ENDPOINTS.NOTES}/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(noteData)
    });
    console.log('📝 Update note API response:', result);
    return result;
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