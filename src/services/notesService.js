import { notesAPI, handleAPIError } from './api.js';

// Helper function to get current user info
const getCurrentUser = () => {
  try {
    const userDataStr = localStorage.getItem('notesapp_user');
    console.log('🔍 getCurrentUser - raw data:', userDataStr);
    
    if (userDataStr) {
      try {
        const parsed = JSON.parse(userDataStr);
        console.log('🔍 getCurrentUser - parsed data:', parsed);

        // If storage contains an opaque/malformed response (from no-cors fallback)
        // create a deterministic offline session so cache keys are user-specific.
        if (parsed && (parsed.opaque === true || (!parsed.access_token && !parsed.user))) {
          console.warn('Detected opaque/malformed auth object in storage, creating offline session for user');
          const email = parsed.user?.email || parsed.email || null;
          const sanitized = (email || 'unknown').toString().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const offlineId = `offline_${sanitized}_${Date.now()}`;
          const offlineUser = {
            access_token: 'offline_token_' + Date.now(),
            token_type: 'Bearer',
            user: {
              id: offlineId,
              email: email || `offline@${sanitized}`,
              name: parsed.user?.name || parsed.name || (email ? email.split('@')[0] : 'offline')
            },
            isOffline: true
          };
          localStorage.setItem('notesapp_user', JSON.stringify(offlineUser));
          return {
            id: offlineUser.user.id,
            email: offlineUser.user.email,
            name: offlineUser.user.name
          };
        }

        // Handle different auth response formats
        const user = parsed;
        const userId = user.user?.id || user.id;
        const userEmail = user.user?.email || user.email;
        
        console.log('🔍 getCurrentUser - extracted:', { userId, userEmail });
        
        // If we still don't have a proper user ID, create one from email
        const finalUserId = userId || (userEmail ? `user_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'unknown_user');
        
        const result = {
          id: finalUserId,
          email: userEmail || 'unknown@example.com',
          name: user.user?.name || user.name || (userEmail ? userEmail.split('@')[0] : 'Unknown User')
        };
        
        console.log('🔍 getCurrentUser - result:', result);
        return result;
      } catch (parseError) {
        console.error('Error parsing notesapp_user from localStorage, clearing key:', parseError);
        localStorage.removeItem('notesapp_user');
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  return {
    id: 'unknown_user',
    email: 'unknown@example.com',
    name: 'Unknown User'
  };
};

// Local cache management - REMOVED - API only now
// All cache functions removed to use API directly

// Notes service functions - Direct API only (no caching)
export const notesService = {
  // Get all notes - Direct from API only
  fetchNotes: async (forceRefresh = false, retryCount = 0) => {
    const maxRetries = 1;
    const currentUser = getCurrentUser();
    console.log('🔄 fetchNotes called for user (API only):', currentUser);
    
    // Always fetch from API - no cache
    try {
      console.log(`📡 Fetching notes from API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const notes = await notesAPI.getAllNotes();
      console.log('📡 API getAllNotes response:', notes);
      
      if (notes && Array.isArray(notes)) {
        console.log('📋 Raw notes from API:', notes.length, 'notes');
        
        // Filter notes for current user
        const userNotes = notes.filter(note => {
          // If note has explicit user association, check it
          if (note.userId || note.user_id || note.owner_id) {
            const isUserNote = note.userId === currentUser.id || 
                             note.user_id === currentUser.id || 
                             note.owner_id === currentUser.id;
            console.log('🔍 Note filter check (with user fields):', {
              noteId: note.id,
              noteUserId: note.userId || note.user_id || note.owner_id,
              currentUserId: currentUser.id,
              isUserNote
            });
            return isUserNote;
          } else {
            // If note has no user association fields, assume it belongs to current user
            // This is common when API returns only the authenticated user's notes
            console.log('🔍 Note filter check (no user fields, assuming belongs to current user):', {
              noteId: note.id,
              currentUserId: currentUser.id,
              assumeUserNote: true
            });
            return true;
          }
        });
        
        console.log('👤 Filtered notes for user:', userNotes.length, 'notes');
        
        return { success: true, data: userNotes };
      } else {
        console.log('⚠️ API returned invalid notes format:', notes);
        return { success: false, error: 'Invalid notes data received from server' };
      }
    } catch (error) {
      console.log('❌ API failed:', error.message);
      
      // Handle specific error types
      const isNetworkError = error.message.includes('Failed to fetch') || 
                           error.message.includes('ERR_FAILED') ||
                           error.message.includes('net::') ||
                           error.message.includes('NETWORK_ERROR') ||
                           error.message.includes('404') ||
                           error.name === 'TypeError';
      
      const isCorsError = error.message.includes('CORS') || 
                         error.message.includes('CORS_ERROR');
      
      const isAuthError = error.message.includes('401') ||
                         error.message.includes('Unauthorized') ||
                         error.message.includes('Invalid authentication') ||
                         error.message.includes('Authentication failed');
      
      if (isAuthError) {
        console.log('🚫 Authentication error detected - user needs to re-login');
        
        // For auth errors, don't show demo notes - let the user re-authenticate
        return { 
          success: false, 
          error: 'Your session has expired. Please login again to access your notes.',
          requiresLogin: true
        };
      }
      
      if (isNetworkError || isCorsError) {
        console.log(`🌐 ${isCorsError ? 'CORS' : 'Network'} error detected, showing demo notes`);
        
        // Show demo notes when API is unavailable
        const demoNotes = [
          {
            id: 'demo-1',
            title: 'Welcome to NotesApp! 📝',
            content: `This is a demo note shown while the API server is unavailable due to CORS restrictions. 

Your app is working correctly, but the backend server needs to enable CORS headers for this domain (${window.location.origin}) to allow API access.

Once CORS is configured on the server, your real notes will appear here.`,
            created_at: new Date().toISOString(),
            tags: ['demo', 'welcome'],
            isDemo: true
          },
          {
            id: 'demo-2', 
            title: 'API Connection Issue 🌐',
            content: `The app is trying to connect to your API server but encountering CORS (Cross-Origin Resource Sharing) restrictions.

Error: "${error.message}"

To fix this, the backend server at 'ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net' needs to add CORS headers allowing requests from '${window.location.origin}'.`,
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            tags: ['demo', 'cors', 'troubleshooting'],
            isDemo: true
          }
        ];
        
        return { 
          success: true, 
          data: demoNotes, 
          isDemo: true,
          message: isCorsError ? 'Showing demo notes - API unavailable due to CORS restrictions' : 'Showing demo notes - API connection failed'
        };
      }
      
      // Retry on timeout errors with shorter delay
      if (error.message.includes('timeout') && retryCount < maxRetries) {
        console.log(`🔄 Retrying due to timeout... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return notesService.fetchNotes(forceRefresh, retryCount + 1);
      }
      
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage, data: [] };
    }
  },

  // Create a new note - API only
  createNote: async (noteData) => {
    const currentUser = getCurrentUser();
    console.log('📝 Creating note for user:', currentUser.email, noteData);
    
    // Prepare note data with defaults and user information
    const noteToCreate = {
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      category: noteData.category || 'General',
      color: noteData.color || '#ffffff',
      tags: Array.isArray(noteData.tags) ? noteData.tags : [],
      isPinned: noteData.isPinned || false,
      // Add user information
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name
    };
    
    try {
      console.log('📝 Creating note via API...');
      const newNote = await notesAPI.createNote(noteToCreate);
      
      console.log('✅ Note created via API');
      return { success: true, data: newNote };
    } catch (error) {
      console.log('❌ API creation failed:', error.message);
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    const currentUser = getCurrentUser();
    
    try {
      console.log('✏️ Updating note via API for user:', currentUser.email, noteId);
      const updateData = {
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        category: noteData.category || 'General',
        color: noteData.color || '#ffffff',
        tags: noteData.tags || [],
        isPinned: noteData.isPinned || false,
        // Preserve user information
        userId: currentUser.id,
        userEmail: currentUser.email
      };
      
      const updatedNote = await notesAPI.updateNote(noteId, updateData);
      
      // Update local cache
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNotes = safeNotes.map(note => 
        note.id === noteId ? updatedNote : note
      );
      notesCache.set(updatedNotes);
      
      return { success: true, data: updatedNote };
    } catch (error) {
      console.log('❌ Update API failed, updating cache only');
      
      // Update cache even if API fails - preserve user info
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNote = { 
        ...noteData, 
        id: noteId, 
        updated_at: new Date().toISOString(), 
        isOffline: true,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name
      };
      const updatedNotes = safeNotes.map(note => 
        note.id === noteId ? updatedNote : note
      );
      notesCache.set(updatedNotes);
      
      return { success: true, data: updatedNote, offline: true };
    }
  },

  // Update an existing note - API only
  updateNote: async (noteId, noteData) => {
    const currentUser = getCurrentUser();
    
    try {
      console.log('✏️ Updating note via API for user:', currentUser.email, noteId);
      const updateData = {
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        category: noteData.category || 'General',
        color: noteData.color || '#ffffff',
        tags: noteData.tags || [],
        isPinned: noteData.isPinned || false,
        // Preserve user information
        userId: currentUser.id,
        userEmail: currentUser.email
      };
      
      const updatedNote = await notesAPI.updateNote(noteId, updateData);
      
      return { success: true, data: updatedNote };
    } catch (error) {
      console.log('❌ Update API failed:', error.message);
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  // Delete a note - API only
  deleteNote: async (noteId) => {
    const currentUser = getCurrentUser();
    
    try {
      console.log('🗑️ Deleting note via API for user:', currentUser.email, noteId);
      await notesAPI.deleteNote(noteId);
      
      return { success: true };
    } catch (error) {
      console.log('❌ Delete API failed:', error.message);
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  // Search notes locally (no API call needed)
  searchNotes: (searchTerm, allNotes) => {
    // Ensure allNotes is always an array
    const safeNotes = Array.isArray(allNotes) ? allNotes : [];
    
    if (!searchTerm || searchTerm.trim() === '') {
      return safeNotes;
    }
    
    console.log('🔍 Searching for:', searchTerm);
    const term = searchTerm.toLowerCase();
    
    const filtered = safeNotes.filter(note => {
      return (
        note.title?.toLowerCase().includes(term) ||
        note.content?.toLowerCase().includes(term) ||
        note.category?.toLowerCase().includes(term) ||
        note.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    });
    
    console.log('🔍 Search results:', filtered.length);
    return filtered;
  }
};