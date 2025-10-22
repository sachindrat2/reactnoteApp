import { notesAPI, handleAPIError } from './api.js';

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
    const currentUser = getCurrentUser();
    console.log('fetchNotes called for user:', currentUser);
    
    if (!currentUser) {
      return { 
        success: false, 
        error: 'User not authenticated. Please login to access your notes.',
        requiresLogin: true
      };
    }
    
    try {
      console.log('Fetching notes from API...');
      const notes = await notesAPI.getAllNotes();
      console.log('API getAllNotes response:', notes);
      
      if (notes && Array.isArray(notes)) {
        console.log('Raw notes from API:', notes.length, 'notes');
        return { success: true, data: notes };
      } else {
        console.log('API returned invalid notes format:', notes);
        return { success: false, error: 'Invalid notes data received from server' };
      }
    } catch (error) {
      console.log('API failed:', error.message);
      
      const isAuthError = error.message.includes('401') ||
                         error.message.includes('Unauthorized');
      
      if (isAuthError) {
        console.log('Authentication error detected - user needs to re-login');
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
      
      return { success: true, data: newNote };
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
      
      return { success: true, data: updatedNote };
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
