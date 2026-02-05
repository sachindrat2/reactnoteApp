import { notesAPI, authAPI, handleAPIError } from './api.js';

// Demo notes for when API is unavailable or authentication fails
const DEMO_NOTES = [
  {
    id: 'demo-1',
    title: 'Welcome to NotesApp! 🎉',
    content: 'This is a demo note showing while your backend is being configured. Your real notes will appear here once the API connection is established.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'demo-2',
    title: 'Getting Started 🚀',
    content: 'Click the + button to create your first note! You can write, edit, and organize your thoughts here.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'demo-3',
    title: 'Features ✨',
    content: 'NotesApp supports rich text editing, search functionality, and real-time sync with your backend server.',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString()
  }
];

// Helper function to normalize note data from API (snake_case to camelCase)
const normalizeNoteData = (note) => {
  if (!note) return note;
  
  return {
    ...note,
    createdAt: note.createdAt || note.created_at,
    updatedAt: note.updatedAt || note.updated_at,
    tags: Array.isArray(note.tags) ? note.tags : [],
    images: Array.isArray(note.images) ? note.images : [],
    created_at: undefined,
    updated_at: undefined
  };
};

// Helper function to normalize an array of notes
const normalizeNotesArray = (notes) => {
  if (!Array.isArray(notes)) return notes;
  return notes.map(normalizeNoteData);
};

// Helper function to get current user info
const getCurrentUser = () => {
  try {
    const userDataStr = localStorage.getItem('notesapp_user');
    
    if (!userDataStr) {
      console.log('No user data found in localStorage');
      return null;
    }
    
    const userData = JSON.parse(userDataStr);
    const user = userData.user || userData;
    const userId = user.id;
    const userEmail = user.email;
    const userName = user.name;
    
    if (!userId || !userEmail) {
      console.warn('Invalid user data structure');
      return null;
    }
    
    return {
      id: userId,
      email: userEmail,
      name: userName || userEmail.split('@')[0]
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('notesapp_user');
    return null;
  }
};

// Helper function to force clear authentication when getting persistent 401s
const clearAuthenticationState = () => {
  console.log('🧹 Clearing authentication state due to persistent 401 errors');
  localStorage.removeItem('notesapp_user');
  
  // Dispatch event to force logout
  window.dispatchEvent(new CustomEvent('auth:force-logout', {
    detail: { reason: 'Persistent authentication failures - clearing corrupted session' }
  }));
};

// Notes service functions - Always use api.js layer
export const notesService = {
  // Get all notes from API
  fetchNotes: async (forceRefresh = false) => {
    const startTime = Date.now();
    
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      console.log('❌ No user found - showing demo notes');
      return { 
        success: true, 
        data: DEMO_NOTES,
        isDemo: true,
        message: 'Please login to access your personal notes'
      };
    }
    
    try {
      console.log('🔄 Fetching notes from API for user:', currentUser.email);
      
      const notes = await notesAPI.getAllNotes();
      console.log('📦 API response:', notes);
      
      if (notes && Array.isArray(notes)) {
        const normalizedNotes = normalizeNotesArray(notes);
        
        return { success: true, data: normalizedNotes };
      } else {
        console.log('❌ API returned invalid notes format:', notes);
        return { 
          success: false, 
          error: `Invalid response from server: ${JSON.stringify(notes)}`
        };
      }
    } catch (error) {
      console.error('❌ fetchNotes error:', error.message);
      
      const isAuthError = error.message.includes('401') ||
                         error.message.includes('Unauthorized') ||
                         error.message.includes('Not authenticated');
      
      const isServerError = error.message.includes('500') ||
                           error.message.includes('Internal Server Error');
      
      const isNetworkError = error.message.includes('TUNNEL_CONNECTION_FAILED') || 
                            error.message.includes('NETWORK_ERROR') ||
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('ERR_TUNNEL_CONNECTION_FAILED');
      
      if (isAuthError) {
        console.log('🚨 AUTHENTICATION ERROR - clearing corrupted auth state');
        clearAuthenticationState();
        return { 
          success: false, 
          error: `Authentication failed: ${error.message}. Your session has been cleared. Please login again.`,
          requiresLogin: true
        };
      }
      
      if (isServerError) {
        console.log('🚨 SERVER ERROR (500)');
        return { 
          success: false, 
          error: `Server Error (500): ${error.message}. The backend server is experiencing issues.`
        };
      }
      
      if (isNetworkError) {
        console.log('🌐 NETWORK ERROR');
        return { 
          success: false, 
          error: `Network Error: ${error.message}. Unable to connect to the server. Please check your internet connection.`
        };
      }
      
      // For any other error, show the exact error message
      return { 
        success: false, 
        error: `Failed to load notes: ${error.message}`
      };
    }
  },

  // Create a new note
  createNote: async (noteData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Please login to create notes', requiresLogin: true };
    }

    try {
      console.log('Creating note via API:', noteData);
      const newNote = await notesAPI.createNote(noteData);
      console.log('Note created successfully:', newNote);
      
      const normalizedNote = normalizeNoteData(newNote);
      return { success: true, data: normalizedNote };
    } catch (error) {
      console.error('Failed to create note:', error);
      
      const isAuthError = error.message.includes('401') || 
                         error.message.includes('Unauthorized') ||
                         error.message.includes('Not authenticated');
      
      if (isAuthError) {
        return { 
          success: false, 
          error: 'Authentication failed. Please refresh the page and try again.',
          requiresLogin: true
        };
      }
      
      return { 
        success: false, 
        error: handleAPIError(error) || 'Failed to create note. Please try again.'
      };
    }
  },

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Please login to update notes', requiresLogin: true };
    }

    try {
      console.log('Updating note via API:', { noteId, noteData });
      const updatedNote = await notesAPI.updateNote(noteId, noteData);
      console.log('Note updated successfully:', updatedNote);
      
      const normalizedNote = normalizeNoteData(updatedNote);
      return { success: true, data: normalizedNote };
    } catch (error) {
      console.error('Failed to update note:', error);
      
      const isAuthError = error.message.includes('401') || 
                         error.message.includes('Unauthorized') ||
                         error.message.includes('Not authenticated');
      
      const isDatabaseError = error.message.includes('no DB row returned') ||
                             error.message.includes('Failed to create note') ||
                             error.message.includes('500');
      
      if (isAuthError) {
        clearAuthenticationState();
        return { 
          success: false, 
          error: 'Authentication failed. Your session has been cleared. Please login again.',
          requiresLogin: true
        };
      }
      
      if (isDatabaseError) {
        return { 
          success: false, 
          error: 'Database error: Unable to save note. The server database may be experiencing issues. Please try again or contact support.'
        };
      }
      
      return { 
        success: false, 
        error: handleAPIError(error) || 'Failed to update note. Please try again.'
      };
    }
  },

  // Delete a note
  deleteNote: async (noteId) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Please login to delete notes', requiresLogin: true };
    }

    try {
      console.log('Deleting note via API:', noteId);
      await notesAPI.deleteNote(noteId);
      console.log('Note deleted successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete note:', error);
      
      const isAuthError = error.message.includes('401') || 
                         error.message.includes('Unauthorized') ||
                         error.message.includes('Not authenticated');
      
      if (isAuthError) {
        clearAuthenticationState();
        return { 
          success: false, 
          error: 'Authentication failed. Your session has been cleared. Please login again.',
          requiresLogin: true
        };
      }
      
      return { 
        success: false, 
        error: handleAPIError(error) || 'Failed to delete note. Please try again.'
      };
    }
  },

  // Get single note by ID
  fetchNoteById: async (noteId) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated.', requiresLogin: true };
    }

    try {
      console.log('Fetching note by ID via API:', noteId);
      const note = await notesAPI.getNoteById(noteId);
      console.log('Note fetched successfully:', note);
      
      const normalizedNote = normalizeNoteData(note);
      return { success: true, data: normalizedNote };
    } catch (error) {
      console.error('Failed to fetch note:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return { 
          success: false, 
          error: 'Your session has expired. Please login again.',
          requiresLogin: true
        };
      }
      
      return { 
        success: false, 
        error: handleAPIError(error)
      };
    }
  },

  // Search notes (client-side filtering)
  searchNotes: (searchTerm, notes) => {
    if (!searchTerm || !notes) return notes || [];
    
    const term = searchTerm.toLowerCase();
    return notes.filter(note => 
      note.title?.toLowerCase().includes(term) || 
      note.content?.toLowerCase().includes(term)
    );
  }
};

// Email verification API wrapper
export const verifyEmailAPI = async (token) => {
  try {
    const result = await authAPI.verifyEmail(token);
    return {
      success: true,
      data: result,
      message: result.message || 'Email verified successfully'
    };
  } catch (error) {
    console.error('Email verification failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify email'
    };
  }
};

// Forgot password API wrapper
export const forgotPasswordAPI = async (email) => {
  try {
    const result = await authAPI.forgotPassword(email);
    return {
      success: true,
      data: result,
      message: result.message || 'Password reset email sent successfully'
    };
  } catch (error) {
    console.error('Forgot password failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email'
    };
  }
};

// Reset password API wrapper
export const resetPasswordAPI = async (token, password) => {
  try {
    const result = await authAPI.resetPassword(token, password);
    return {
      success: true,
      data: result,
      message: result.message || 'Password reset successfully'
    };
  } catch (error) {
    console.error('Reset password failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset password'
    };
  }
};