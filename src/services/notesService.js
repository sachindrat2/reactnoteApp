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
  // Get all notes - prioritize cache on initial load, API on refresh
  fetchNotes: async (forceRefresh = false) => {
    // If not forcing refresh, try cache first
    if (!forceRefresh) {
      const cachedNotes = notesCache.get();
      if (cachedNotes.length > 0) {
        console.log('📦 Using cached notes for initial load:', cachedNotes.length);
        
        // Try API in background to update cache (but don't throw errors)
        setTimeout(async () => {
          try {
            console.log('📡 Background API sync...');
            const notes = await notesAPI.getAllNotes();
            notesCache.set(notes);
            console.log('📦 Cache updated in background');
          } catch (error) {
            console.log('❌ Background sync failed, keeping cache');
          }
        }, 1000);
        
        return { success: true, data: cachedNotes, fromCache: true };
      }
    }
    
    // No cache or forcing refresh - try API
    try {
      console.log('📡 Fetching notes from API...');
      const notes = await notesAPI.getAllNotes();
      
      // Cache the notes locally
      notesCache.set(notes);
      
      return { success: true, data: notes };
    } catch (error) {
      console.log('❌ API failed...');
      
      // If we have cached data, fall back to it
      const cachedNotes = notesCache.get();
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
    try {
      console.log('📝 Creating note via API...');
      const newNote = await notesAPI.createNote({
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        category: noteData.category || 'General',
        color: noteData.color || '#ffffff',
        tags: noteData.tags || [],
        isPinned: noteData.isPinned || false
      });
      
      // Update local cache with the new note
      const cachedNotes = notesCache.get();
      const updatedNotes = [newNote, ...cachedNotes];
      notesCache.set(updatedNotes);
      
      return { success: true, data: newNote };
    } catch (error) {
      // If API fails, add to cache with temporary ID
      console.log('❌ API failed, saving to cache only');
      const tempNote = {
        id: 'temp_' + Date.now(),
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        category: noteData.category || 'General',
        color: noteData.color || '#ffffff',
        tags: noteData.tags || [],
        isPinned: noteData.isPinned || false,
        created_at: new Date().toISOString(),
        isOffline: true
      };
      
      const cachedNotes = notesCache.get();
      const updatedNotes = [tempNote, ...cachedNotes];
      notesCache.set(updatedNotes);
      
      return { success: true, data: tempNote, offline: true };
    }
  },

  // Search notes locally (no API call needed)
  searchNotes: (searchTerm, allNotes) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return allNotes;
    }
    
    console.log('🔍 Searching locally for:', searchTerm);
    const term = searchTerm.toLowerCase();
    
    const filtered = allNotes.filter(note => {
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