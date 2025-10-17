// API Base Configuration
// Use different URLs for development vs production to handle CORS
const BACKEND_URL = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';

const BASE_URL = window.location.hostname === 'localhost' 
  ? BACKEND_URL
  : `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(BACKEND_URL)}`;

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

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
      ...options.headers,  // Allow options to override headers
    },
    mode: 'cors',
    credentials: 'omit',
    ...options
  };

  console.log('API Request Details:', { 
    url, 
    method: config.method,
    headers: config.headers,
    body: config.body 
  });
  
  // Log the exact form data being sent
  if (config.body && typeof config.body === 'string' && config.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    console.log('Form data being sent:', config.body);
  }

  try {
    const response = await fetch(url, config);
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        console.log('Raw text response:', `"${textData}"`);
        
        if (textData && textData.trim() !== '') {
          // Try to parse as JSON even if content-type is wrong
          try {
            data = JSON.parse(textData);
          } catch {
            data = textData;
          }
        } else {
          console.log('Empty response body detected');
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
        contentType: contentType,
        data: data
      });
      
      // Log detailed error information
      console.error('Full error details:', JSON.stringify(data, null, 2));
      
      // For 401 errors, check if it's a credential issue
      if (response.status === 401) {
        console.error('Authentication failed - check credentials');
        if (data && data.detail) {
          console.error('Server error message:', data.detail);
        }
      }
      
      // For 500 errors with empty responses, this indicates a server configuration issue
      if (response.status === 500 && (!data || data === '')) {
        const errorMsg = `Server Error (500): The server returned an empty response for ${endpoint}. This suggests a server configuration issue or the endpoint may not exist.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
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

// Error handling utility
export const handleAPIError = (error) => {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Token expired or invalid, clear auth data but don't reload
    // Let the app's routing handle the redirect to login
    localStorage.removeItem('notesapp_user');
    localStorage.removeItem('notesapp_notes_cache');
    return 'Session expired. Please login again.';
  }
  
  if (error.message.includes('Network')) {
    return 'Network error. Please check your connection.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

export default apiRequest;