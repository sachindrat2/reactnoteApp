import { notesAPI, handleAPIError } from './api.js';

// Helper function to get current user info
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('notesapp_user');
    if (userData) {
      const user = JSON.parse(userData);
      return {
        id: user.user?.id || user.id || 'unknown_user',
        email: user.user?.email || user.email || 'unknown@example.com',
        name: user.user?.name || user.name || 'Unknown User'
      };
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
  // Get all notes - always start with cache for better UX, then try API
  fetchNotes: async (forceRefresh = false) => {
    // Always try cache first for better user experience
    const cachedNotes = notesCache.get();
    
    if (!forceRefresh && cachedNotes.length > 0) {
      console.log('📦 Using cached notes for immediate display:', cachedNotes.length);
      
      // Return cached data immediately, then try to update in background
      setTimeout(async () => {
        try {
          console.log('📡 Background API sync...');
          const notes = await notesAPI.getAllNotes();
          notesCache.set(notes);
          console.log('📦 Cache updated in background');
        } catch (error) {
          console.log('❌ Background sync failed, keeping cache:', error.message);
        }
      }, 500);
      
      return { success: true, data: cachedNotes, fromCache: true };
    }
    
    // No cache or forcing refresh - try API
    try {
      console.log('📡 Fetching notes from API...');
      const notes = await notesAPI.getAllNotes();
      
      // Cache the notes locally
      notesCache.set(notes);
      
      return { success: true, data: notes };
    } catch (error) {
      console.log('❌ API failed:', error.message);
      
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