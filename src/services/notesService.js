import { notesAPI, handleAPIError } from './api.js';

// Helper function to get current user info
const getCurrentUser = () => {
  try {
    const userDataStr = localStorage.getItem('notesapp_user');
    if (userDataStr) {
      try {
        const parsed = JSON.parse(userDataStr);

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
        
        // If we still don't have a proper user ID, create one from email
        const finalUserId = userId || (userEmail ? `user_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'unknown_user');
        
        return {
          id: finalUserId,
          email: userEmail || 'unknown@example.com',
          name: user.user?.name || user.name || (userEmail ? userEmail.split('@')[0] : 'Unknown User')
        };
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

// Local cache key - make it user-specific
const getUserCacheKey = () => {
  const user = getCurrentUser();
  return `notesapp_notes_cache_${user.id}`;
};

// Local cache management - user-specific
const notesCache = {
  get: () => {
    try {
      const cacheKey = getUserCacheKey();
      const cached = localStorage.getItem(cacheKey);
      const notes = cached ? JSON.parse(cached) : [];
      const user = getCurrentUser();
      
      // Filter notes to only include current user's notes
      const userNotes = notes.filter(note => 
        note.userId === user.id || 
        note.user_id === user.id || 
        note.owner_id === user.id ||
        // For backward compatibility, include notes without user info if cache is user-specific
        (!note.userId && !note.user_id && !note.owner_id)
      );
      
      console.log('📦 Loading cached notes for user:', user.email, '- Count:', userNotes.length);
      return userNotes;
    } catch (error) {
      console.error('Error reading notes cache:', error);
      return [];
    }
  },
  
  set: (notes) => {
    try {
      const cacheKey = getUserCacheKey();
      const user = getCurrentUser();
      
      // Ensure all notes have user information
      const notesWithUser = notes.map(note => ({
        ...note,
        userId: note.userId || note.user_id || note.owner_id || user.id,
        userEmail: note.userEmail || note.user_email || user.email
      }));
      
      localStorage.setItem(cacheKey, JSON.stringify(notesWithUser));
      console.log('📦 Notes cached locally for user:', user.email, '- Count:', notesWithUser.length);
    } catch (error) {
      console.error('Error saving notes cache:', error);
    }
  },
  
  clear: () => {
    const cacheKey = getUserCacheKey();
    localStorage.removeItem(cacheKey);
  }
};

// Notes service functions with local caching
export const notesService = {
  // Get all notes - with reduced retry for better performance
  fetchNotes: async (forceRefresh = false, retryCount = 0) => {
    const maxRetries = 1; // Reduced from 2 to 1 for faster response
    const currentUser = getCurrentUser();
    console.log('🔄 fetchNotes called for user:', currentUser);
    
    // Always try cache first for better user experience
    const cachedNotes = notesCache.get();
    console.log('📦 Cache check result:', cachedNotes.length, 'notes');
    
    if (!forceRefresh && cachedNotes.length > 0) {
      console.log('📦 Using cached notes for immediate display:', cachedNotes.length);
      
      // Return cached data immediately, then try to update in background (reduced frequency)
      setTimeout(async () => {
        try {
          console.log('📡 Background API sync...');
          const notes = await notesAPI.getAllNotes();
          console.log('📡 API returned notes:', notes?.length || 'undefined', 'notes');
          if (notes && Array.isArray(notes)) {
            notesCache.set(notes);
            console.log('📦 Cache updated in background');
          } else {
            console.log('⚠️ API returned invalid notes data:', notes);
          }
        } catch (error) {
          console.log('❌ Background sync failed, keeping cache:', error.message);
        }
      }, 2000); // Increased delay to reduce immediate load
      
      return { success: true, data: cachedNotes, fromCache: true };
    }
    
    // No cache or forcing refresh - try API with retry logic
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
        
        // Cache the filtered notes
        notesCache.set(userNotes);
        
        return { success: true, data: userNotes };
      } else {
        console.log('⚠️ API returned invalid notes format:', notes);
        return { success: false, error: 'Invalid notes data received from server' };
      }
    } catch (error) {
      console.log('❌ API failed:', error.message);
      
      // Handle specific network errors more gracefully
      const isNetworkError = error.message.includes('Failed to fetch') || 
                           error.message.includes('ERR_FAILED') ||
                           error.message.includes('net::') ||
                           error.message.includes('NETWORK_ERROR') ||
                           error.message.includes('404') ||
                           error.name === 'TypeError';
      
      const isCorsError = error.message.includes('CORS') || 
                         error.message.includes('CORS_ERROR');
      
      if (isNetworkError || isCorsError) {
        console.log('🌐 Network/CORS error detected, using offline mode');
        
        // If we have cached data, use it
        if (cachedNotes.length > 0) {
          console.log('📦 Using cached notes (network unavailable):', cachedNotes.length);
          return { success: true, data: cachedNotes, fromCache: true, offline: true };
        } else {
          console.log('📦 No cached notes available, starting with empty list');
          return { success: true, data: [], fromCache: false, offline: true };
        }
      }
      
      // Retry on timeout errors with shorter delay
      if (error.message.includes('timeout') && retryCount < maxRetries) {
        console.log(`🔄 Retrying due to timeout... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
        return notesService.fetchNotes(forceRefresh, retryCount + 1);
      }
      
      // If we have cached data, fall back to it
      if (cachedNotes.length > 0) {
        console.log('📦 Using cached notes as fallback:', cachedNotes.length);
        return { success: true, data: cachedNotes, fromCache: true };
      }
      
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  // Create a new note - update both API and cache
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
      console.log('📝 Attempting API creation...');
      const newNote = await notesAPI.createNote(noteToCreate);
      
      // Update local cache with the new note
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNotes = [newNote, ...safeNotes];
      notesCache.set(updatedNotes);
      
      console.log('✅ Note created via API');
      return { success: true, data: newNote };
    } catch (error) {
      console.log('❌ API creation failed, saving locally:', error.message);
      
      // Create note locally with temporary ID and user info
      const tempNote = {
        ...noteToCreate,
        id: 'temp_' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOffline: true,
        // Ensure user info is preserved
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name
      };
      
      // Update local cache
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNotes = [tempNote, ...safeNotes];
      notesCache.set(updatedNotes);
      
      console.log('💾 Note saved locally with temp ID:', tempNote.id);
      return { success: true, data: tempNote, offline: true };
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

  // Delete a note
  deleteNote: async (noteId) => {
    const currentUser = getCurrentUser();
    
    try {
      console.log('🗑️ Deleting note via API for user:', currentUser.email, noteId);
      await notesAPI.deleteNote(noteId);
      
      // Remove from local cache (only current user's notes)
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNotes = safeNotes.filter(note => note.id !== noteId);
      notesCache.set(updatedNotes);
      
      return { success: true };
    } catch (error) {
      console.log('❌ Delete API failed, removing from cache only');
      
      // Remove from cache even if API fails (only current user's notes)
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNotes = safeNotes.filter(note => note.id !== noteId);
      notesCache.set(updatedNotes);
      
      return { success: true, offline: true };
    }
  },

  // Search notes locally (no API call needed)
  searchNotes: (searchTerm, allNotes) => {
    // Ensure allNotes is always an array
    const safeNotes = Array.isArray(allNotes) ? allNotes : [];
    
    if (!searchTerm || searchTerm.trim() === '') {
      return safeNotes;
    }
    
    console.log('🔍 Searching locally for:', searchTerm);
    const term = searchTerm.toLowerCase();
    
    const filtered = safeNotes.filter(note => {
      if (note.isDeleted) return false; // Don't show deleted notes
      
      return (
        note.title?.toLowerCase().includes(term) ||
        note.content?.toLowerCase().includes(term) ||
        note.category?.toLowerCase().includes(term) ||
        note.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    });
    
    console.log('🔍 Local search results:', filtered.length);
    return filtered;
  },

  // Clear local cache (for logout)
  clearCache: () => {
    notesCache.clear();
    console.log('🧹 Notes cache cleared');
  }
};

export default notesService;