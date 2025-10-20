import { notesAPI, handleAPIError } from './api.js';

// Local cache key
const NOTES_CACHE_KEY = 'notesapp_notes_cache';

// Local cache management
const notesCache = {
  get: () => {
    try {
      const cached = localStorage.getItem(NOTES_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error reading notes cache:', error);
      return [];
    }
  },
  
  set: (notes) => {
    try {
      localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notes));
      console.log('📦 Notes cached locally:', notes.length, 'notes');
    } catch (error) {
      console.error('Error saving notes cache:', error);
    }
  },
  
  clear: () => {
    localStorage.removeItem(NOTES_CACHE_KEY);
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
    console.log('📝 Creating note...', noteData);
    
    // Prepare note data with defaults
    const noteToCreate = {
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      category: noteData.category || 'General',
      color: noteData.color || '#ffffff',
      tags: Array.isArray(noteData.tags) ? noteData.tags : [],
      isPinned: noteData.isPinned || false
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
      
      // Create note locally with temporary ID
      const tempNote = {
        ...noteToCreate,
        id: 'temp_' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOffline: true
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
    try {
      console.log('✏️ Updating note via API...', noteId);
      const updatedNote = await notesAPI.updateNote(noteId, {
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        category: noteData.category || 'General',
        color: noteData.color || '#ffffff',
        tags: noteData.tags || [],
        isPinned: noteData.isPinned || false
      });
      
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
      
      // Update cache even if API fails
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNote = { ...noteData, id: noteId, updated_at: new Date().toISOString(), isOffline: true };
      const updatedNotes = safeNotes.map(note => 
        note.id === noteId ? updatedNote : note
      );
      notesCache.set(updatedNotes);
      
      return { success: true, data: updatedNote, offline: true };
    }
  },

  // Delete a note
  deleteNote: async (noteId) => {
    try {
      console.log('🗑️ Deleting note via API...', noteId);
      await notesAPI.deleteNote(noteId);
      
      // Remove from local cache
      const cachedNotes = notesCache.get();
      const safeNotes = Array.isArray(cachedNotes) ? cachedNotes : [];
      const updatedNotes = safeNotes.filter(note => note.id !== noteId);
      notesCache.set(updatedNotes);
      
      return { success: true };
    } catch (error) {
      console.log('❌ Delete API failed, removing from cache only');
      
      // Remove from cache even if API fails
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