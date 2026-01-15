import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import NotesHeader from './NotesHeader';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import AddNoteModal from './AddNoteModal';
import AuthHealthChecker from './AuthHealthChecker';
import LanguageSwitcher from './LanguageSwitcher';
import LoadingScreen from './LoadingScreen';
import NotesSkeleton from './NotesSkeleton';
import { notesService } from '../services/notesService';
import { useAuth } from '../context/AuthContext';

const NotesApp = () => {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Start with false, set to true when actually loading
  const [error, setError] = useState(null);
  // Removed offline mode - only using real API authentication
  // Dirty flag: only reload notes if a change was made
  const isDirtyRef = useRef(false);

  // Memoize loadNotes function to prevent unnecessary re-renders
  const loadNotes = useCallback(async (force = false) => {
    if (!user) {
      console.log('⏸️ No user available, skipping notes load');
      return;
    }
    // Only reload if dirty or forced
    if (!isDirtyRef.current && !force) {
      console.log('🟢 Notes not dirty, skipping reload');
      return;
    }
    isDirtyRef.current = false;
    console.log('🚀 Starting loadNotes - isLoading:', isLoading);
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading notes for user:', user?.user?.email || user?.email);
      const result = await notesService.fetchNotes();
      console.log('📦 fetchNotes result:', result);
      if (result && result.success) {
        const notesData = Array.isArray(result.data) ? result.data : [];
        console.log('📋 Setting notes data:', notesData.length, 'notes');
        setNotes(notesData);
        if (result.isDemo) {
          setError(result.message || 'Showing demo notes - API connection unavailable');
        } else if (result.fromCache) {
          // setError('Using cached data. Some changes may not be synced.');
        }
        console.log('✅ Notes loaded successfully');
      } else {
        console.log('❌ Notes loading failed:', result?.error);
        let errorMessage = result?.error || 'Failed to load notes';
        if (errorMessage.includes('TIMEOUT_ERROR')) {
          errorMessage = 'Server is taking too long to respond. Your cached notes are displayed below.';
        } else if (errorMessage.includes('CORS_ERROR')) {
          errorMessage = 'Connection blocked by browser security. Using cached data.';
        } else if (errorMessage.includes('NETWORK_ERROR')) {
          errorMessage = 'No internet connection. Using cached data.';
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      setError('Failed to load notes. Please try again.');
    } finally {
      console.log('🏁 Setting isLoading to false');
      setIsLoading(false);
    }
  }, [user]);

  // Load notes from API on component mount - simplified approach
  const hasLoadedRef = React.useRef(false);
  
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      console.log('🚀 Initial notes load for authenticated user');
      hasLoadedRef.current = true;
      loadNotes(true); // Force initial load
    } else if (!user) {
      hasLoadedRef.current = false;
      console.log('🔄 User logged out, resetting loading state');
      setIsLoading(true);
    }
  }, [user, loadNotes]);

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed:', { 
      isLoading, 
      notesCount: notes.length, 
      hasUser: !!user,
      userEmail: user?.user?.email || user?.email 
    });
  }, [isLoading, notes.length, user]);

  // Ensure loading is cleared when notes are loaded
  useEffect(() => {
    if (notes.length > 0 && isLoading) {
      console.log('📋 Notes loaded, clearing loading state');
      setIsLoading(false);
    }
  }, [notes.length, isLoading]);

  // Failsafe: Clear loading state after 10 seconds
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.log('⏰ Loading timeout - force clearing loading state');
        setIsLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);


  // Pagination state
  const NOTES_PER_PAGE = 12;
  const [page, setPage] = useState(1);
  // Memoize filtered notes to avoid unnecessary recalculations
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    console.log('🔍 Search filter running:', { searchTerm, notesCount: notes.length });
    return notesService.searchNotes(searchTerm, notes);
  }, [searchTerm, notes]);

  // Paginated notes
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / NOTES_PER_PAGE));
  const paginatedNotes = useMemo(() => {
    const start = (page - 1) * NOTES_PER_PAGE;
    return filteredNotes.slice(start, start + NOTES_PER_PAGE);
  }, [filteredNotes, page]);

  const handleAddNote = useCallback(async (noteData) => {
    if (!user) {
      setError('Please login to create notes');
      return;
    }
    const tempId = 'temp-' + Date.now();
    const optimisticNote = { ...noteData, id: tempId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setNotes(prev => [optimisticNote, ...prev]);
    setIsAddModalOpen(false);
    isDirtyRef.current = true;
    try {
      const result = await notesService.createNote(noteData);
      if (result && result.success) {
        setNotes(prev => prev.map(note => note.id === tempId ? result.data : note));
        setError(null);
      } else {
        setNotes(prev => prev.filter(note => note.id !== tempId));
        setError(result?.error || 'Failed to create note');
      }
    } catch (error) {
      setNotes(prev => prev.filter(note => note.id !== tempId));
      setError('Failed to create note. Please try again.');
    }
  }, [user]);

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async (updatedNote) => {
    const prevNotes = notes;
    setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
    setIsEditing(false);
    setSelectedNote(null);
    isDirtyRef.current = true;
    try {
      const result = await notesService.updateNote(updatedNote.id, updatedNote);
      if (result && result.success) {
        setNotes(prev => prev.map(note => note.id === updatedNote.id ? result.data : note));
        setError(null);
      } else {
        setNotes(prevNotes);
        setError(result?.error || 'Failed to update note');
      }
    } catch (error) {
      setNotes(prevNotes);
      setError('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (String(noteId).startsWith('temp-')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      return;
    }
    const prevNotes = notes;
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
    isDirtyRef.current = true;
    try {
      const result = await notesService.deleteNote(noteId);
      if (result && result.success) {
        setError(null);
      } else {
        setNotes(prevNotes);
        setError(result?.error || 'Failed to delete note');
      }
    } catch (error) {
      setNotes(prevNotes);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
    setSelectedNote(null);
  };

  // Reset to page 1 if search/filter changes
  useEffect(() => { setPage(1); }, [searchTerm, filteredNotes.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full animate-pulse blur-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-blue-500/15 rounded-full animate-bounce blur-2xl"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-pink-500/10 rounded-full animate-ping blur-xl"></div>
        <div className="absolute bottom-20 right-1/3 w-56 h-56 bg-indigo-500/10 rounded-full animate-pulse blur-3xl"></div>
        
        {/* Moving gradient lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-slide-x"></div>
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-blue-500/50 to-transparent animate-slide-x-reverse"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-pink-500/30 to-transparent animate-slide-y"></div>
          <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent animate-slide-y-reverse"></div>
        </div>
      </div>
      
      {/* Content with backdrop blur */}
      <div className="relative z-10 backdrop-blur-sm">
      {/* Authentication Health Checker */}
      <AuthHealthChecker />
      
      <NotesHeader
        onAddNote={() => setIsAddModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        notesCount={notes.length}
      />
      
      {/* Removed offline mode indicator - only using real API authentication now */}
      
      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 pt-4">
          <div className={`${
            error.includes('demo notes') || error.includes('API connection unavailable') 
              ? 'bg-blue-900/30 border border-blue-400/30' 
              : 'bg-red-900/50 border border-red-500/50'
          } rounded-lg p-4 mb-4 backdrop-blur-sm`}>
            <div className="flex items-center">
              {error.includes('demo notes') || error.includes('API connection unavailable') ? (
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`${
                  error.includes('demo notes') || error.includes('API connection unavailable') 
                    ? 'text-blue-300' 
                    : 'text-red-300'
                } text-sm`}>{error}</p>
                {error.includes('demo notes') && (
                  <p className="text-blue-200/70 text-xs mt-1">
                    Configure your backend server with CORS headers for: https://s-thakur00.github.io
                  </p>
                )}
                {error.includes('taking too long') && (
                  <button
                    onClick={() => {
                      setError(null);
                      loadNotes();
                    }}
                    className="text-red-200 hover:text-white text-xs underline mt-1"
                  >
                    Try again
                  </button>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main
        className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 animate-slide-in-right relative z-10"
      >
        {isLoading ? (
          <div className="py-10 px-2">
            <NotesSkeleton count={6} />
          </div>
        ) : isEditing && selectedNote ? (
          <div className="animate-scale-in">
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
              onClose={handleCloseEditor}
              onDelete={handleDeleteNote}
            />
          </div>
        ) : (
          <NotesList
            notes={paginatedNotes}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            searchTerm={searchTerm}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalNotes={filteredNotes.length}
          />
        )}
      </main>

      {isAddModalOpen && (
        <AddNoteModal
          onAdd={handleAddNote}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Floating Add Note Button - only visible on mobile */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] p-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-xl hover:scale-110 transition-transform duration-200 flex items-center justify-center md:hidden"
        title={t('addNote')}
        aria-label={t('addNote')}
        style={{ pointerEvents: 'auto' }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      </div>
    </div>
  );
};

export default NotesApp;