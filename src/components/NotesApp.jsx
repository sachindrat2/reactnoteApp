import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NotesHeader from './NotesHeader';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import AddNoteModal from './AddNoteModal';
import DebugPanel from './DebugPanel';
import AuthHealthChecker from './AuthHealthChecker';
import { notesService } from '../services/notesService';
import { useAuth } from '../context/AuthContext';

const NotesApp = () => {
  const { logout, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed offline mode - only using real API authentication

  // Memoize loadNotes function to prevent unnecessary re-renders
  const loadNotes = useCallback(async () => {
    if (!user) {
      console.log('⏸️ No user available, skipping notes load');
      return;
    }
    
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
          // Show a subtle banner for demo mode
          setError(result.message || 'Showing demo notes - API connection unavailable');
        } else if (result.fromCache) {
          // Commented out cache warning to reduce UI clutter
          // setError('Using cached data. Some changes may not be synced.');
        }
        
        console.log('✅ Notes loaded successfully');
      } else {
        console.log('❌ Notes loading failed:', result?.error);
        // Provide specific error messages based on error type
        let errorMessage = result?.error || 'Failed to load notes';
        
        if (errorMessage.includes('TIMEOUT_ERROR')) {
          errorMessage = 'Server is taking too long to respond. Your cached notes are displayed below.';
        } else if (errorMessage.includes('CORS_ERROR')) {
          errorMessage = 'Connection blocked by browser security. Using cached data.';
        } else if (errorMessage.includes('NETWORK_ERROR')) {
          errorMessage = 'No internet connection. Using cached data.';
        }
        
        // Only show error if this is the initial load (no cached data)
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      setError('Failed to load notes. Please try again.');
    } finally {
      console.log('🏁 Setting isLoading to false');
      setIsLoading(false);
    }
  }, [user]); // Remove isLoading from deps to prevent recreation issues

  // Load notes from API on component mount - use a ref to prevent multiple calls
  const hasLoadedRef = React.useRef(false);
  const loadingRef = React.useRef(false);
  
  useEffect(() => {
    if (user && !hasLoadedRef.current && !loadingRef.current) {
      console.log('🚀 Initial notes load for authenticated user');
      hasLoadedRef.current = true;
      loadingRef.current = true;
      
      loadNotes().finally(() => {
        loadingRef.current = false;
      });
    } else if (!user) {
      hasLoadedRef.current = false;
      loadingRef.current = false;
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

  // Memoize filtered notes to avoid unnecessary recalculations
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    
    console.log('🔍 Search filter running:', { searchTerm, notesCount: notes.length });
    return notesService.searchNotes(searchTerm, notes);
  }, [searchTerm, notes]);

  const handleAddNote = useCallback(async (noteData) => {
    if (!user) {
      setError('Please login to create notes');
      return;
    }
    
    try {
      console.log('📝 Creating note:', noteData);
      const result = await notesService.createNote(noteData);
      if (result && result.success) {
        setNotes(prev => [result.data, ...prev]);
        
        setError(null);
        console.log('✅ Note created successfully');
      } else {
        console.error('❌ Note creation failed:', result?.error);
        setError(result?.error || 'Failed to create note');
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      setError('Failed to create note. Please try again.');
    }
    setIsAddModalOpen(false);
  }, [user]);

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async (updatedNote) => {
    try {
      const result = await notesService.updateNote(updatedNote.id, updatedNote);
      if (result && result.success) {
        setNotes(prev => prev.map(note =>
          note.id === updatedNote.id ? result.data : note
        ));
        
        setError(null);
      } else {
        setError(result?.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      setError('Failed to update note. Please try again.');
    }
    setIsEditing(false);
    setSelectedNote(null);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const result = await notesService.deleteNote(noteId);
      if (result && result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
        setError(null);
      } else {
        setError(result?.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
    setSelectedNote(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 animate-slide-in-right">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-300">Loading your notes... (isLoading: {isLoading.toString()}, notes: {notes.length})</p>
            </div>
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
            notes={filteredNotes}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            searchTerm={searchTerm}
          />
        )}
      </main>

      {isAddModalOpen && (
        <AddNoteModal
          onAdd={handleAddNote}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Debug panel for troubleshooting */}
      <DebugPanel />
      </div>
    </div>
  );
};

export default NotesApp;