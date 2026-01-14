// Reset password API
export const resetPasswordAPI = async (token, newPassword) => {
  try {
    const baseUrl = 'https://notesapps-b0bqb4degeekb6cn.japanwest-01.azurewebsites.net';
    const url = `${baseUrl}/reset-password`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || data.message || 'Failed to reset password.' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to reset password.' };
  }

  // Fetch a single note by ID
  fetchNoteById: async (noteId) => {
    try {
      const note = await notesAPI.getNoteById(noteId);
      if (note) {
        return { success: true, data: normalizeNoteData(note) };
      } else {
        return { success: false, error: 'Note not found' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch note' };
    }
  }
};
// Forgot password API
export const forgotPasswordAPI = async (email) => {
  try {
    const baseUrl = 'https://notesapps-b0bqb4degeekb6cn.japanwest-01.azurewebsites.net';
    const url = `${baseUrl}/forgot-password`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || data.message || 'Failed to send reset email.' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to send reset email.' };
  }
};
// Verify email API
export const verifyEmailAPI = async (token) => {
  try {
    const baseUrl = 'https://notesapps-b0bqb4degeekb6cn.japanwest-01.azurewebsites.net';
    const url = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.detail || data.message || 'Verification failed.' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Verification failed.' };
  }
};
import { notesAPI, handleAPIError } from './api.js';

// Helper function to normalize note data from API (snake_case to camelCase)
const normalizeNoteData = (note) => {
  if (!note) return note;
  
  return {
    ...note,
    // Ensure camelCase format for dates
    createdAt: note.createdAt || note.created_at,
    updatedAt: note.updatedAt || note.updated_at,
    // Clean up snake_case versions if they exist
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
    console.log('getCurrentUser - parsed data:', userData);

    // Extract user info from the auth response
    const user = userData.user || userData;
    const userId = user.id;
    const userEmail = user.email;
    const userName = user.name;
    
    if (!userId || !userEmail) {
      console.warn('Invalid user data structure');
      return null;
    }
    
    const result = {
      id: userId,
      email: userEmail,
      name: userName || userEmail.split('@')[0]
    };
    
    console.log('getCurrentUser - result:', result);
    return result;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('notesapp_user');
    return null;
  }
};

// Notes service functions - Direct API only
export const notesService = {
  // Get all notes from API
  fetchNotes: async (forceRefresh = false, retryCount = 0) => {
    const startTime = Date.now();
    console.log('🚀 fetchNotes START at', new Date().toISOString());
    
    const currentUser = getCurrentUser();
    console.log('fetchNotes called for user:', currentUser);
    
    if (!currentUser) {
      console.log('❌ fetchNotes FAIL: No user at', new Date().toISOString());
      return { 
        success: false, 
        error: 'User not authenticated. Please login to access your notes.',
        requiresLogin: true
      };
    }
    
    try {
      console.log('🔄 Fetching notes from API...');
      
      // Debug: Check what token is being used
      const authData = localStorage.getItem('notesapp_user');
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log('🔑 Debug: Token being used:', {
          hasToken: !!parsed.access_token,
          tokenStart: parsed.access_token?.substring(0, 30) + '...',
          tokenType: parsed.token_type,
          userEmail: parsed.user?.email
        });
      } else {
        console.log('🚨 NO AUTH DATA found during fetchNotes!');
      }
      
      const notes = await notesAPI.getAllNotes();
      console.log('📦 API getAllNotes response:', notes);
      console.log('⏱️ fetchNotes SUCCESS took', Date.now() - startTime, 'ms');
      
      if (notes && Array.isArray(notes)) {
        console.log('✅ Raw notes from API:', notes.length, 'notes');
        const normalizedNotes = normalizeNotesArray(notes);
        console.log('🔄 Normalized notes:', normalizedNotes.length, 'notes with proper date formats');
        return { success: true, data: normalizedNotes };
      } else {
        console.log('❌ API returned invalid notes format:', notes);
        return { success: false, error: 'Invalid notes data received from server' };
      }
    } catch (error) {
      console.log('❌ fetchNotes FAIL:', error.message, 'took', Date.now() - startTime, 'ms');
      
      const isAuthError = error.message.includes('401') ||
                         error.message.includes('Unauthorized');
      
      if (isAuthError) {
        console.log('🚨 AUTHENTICATION ERROR detected - user needs to re-login');
        console.log('🚨 This will trigger auto-logout!');
        return { 
          success: false, 
          error: 'Your session has expired. Please login again to access your notes.',
          requiresLogin: true
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to load notes. Please try again.'
      };
    }
  },

  // Create a new note
  createNote: async (noteData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated.', requiresLogin: true };
    }

    try {
      console.log('Creating note via API:', noteData);
      const newNote = await notesAPI.createNote(noteData);
      console.log('Note created successfully:', newNote);
      
      const normalizedNote = normalizeNoteData(newNote);
      console.log('🔄 Normalized created note:', normalizedNote);
      return { success: true, data: normalizedNote };
    } catch (error) {
      console.error('Failed to create note:', error);
      
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

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated.', requiresLogin: true };
    }

    try {
      console.log('Updating note via API:', { noteId, noteData });
      const updatedNote = await notesAPI.updateNote(noteId, noteData);
      console.log('Note updated successfully:', updatedNote);
      
      const normalizedNote = normalizeNoteData(updatedNote);
      console.log('🔄 Normalized updated note:', normalizedNote);
      return { success: true, data: normalizedNote };
    } catch (error) {
      console.error('Failed to update note:', error);
      
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

  // Delete a note
  deleteNote: async (noteId) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated.', requiresLogin: true };
    }

    try {
      console.log('Deleting note via API:', noteId);
      await notesAPI.deleteNote(noteId);
      console.log('Note deleted successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete note:', error);
      
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
