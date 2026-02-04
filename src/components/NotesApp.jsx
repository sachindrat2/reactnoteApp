
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import NotesHeader from './NotesHeader';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import NoteDetail from './NoteDetail';
import AddNoteModal from './AddNoteModal';
import LanguageSwitcher from './LanguageSwitcher';
import LoadingScreen from './LoadingScreen';
import NotesSkeleton from './NotesSkeleton';
import { notesService } from '../services/notesService';
import { useAuth } from '../context/AuthContext';



const NotesApp = () => {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const { id: routeNoteId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Start with false, set to true when actually loading
  const [error, setError] = useState(null);
  // Removed offline mode - only using real API authentication
  // Dirty flag: only reload notes if a change was made
  const isDirtyRef = useRef(false);

  // Logout modal state and handlers
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleLogoutCancel = () => setShowLogoutModal(false);
  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch (error) {
      // Optionally show error
    }
  };

  // Memoize loadNotes function to prevent unnecessary re-renders
  const loadNotes = useCallback(async (force = false) => {
    if (!user) {
      return;
    }
    // Only reload if dirty or forced
    if (!isDirtyRef.current && !force) {
      return;
    }
    isDirtyRef.current = false;
    setIsLoading(true);
    setError(null);
    try {
      const result = await notesService.fetchNotes();
      if (result && result.success) {
        const notesData = Array.isArray(result.data) ? result.data : [];
        setNotes(notesData);
        if (result.isDemo) {
          setError(result.message || 'Showing demo notes - API connection unavailable');
        }
      } else {
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
      setIsLoading(false);
    }
  }, [user]);

  // Load notes from API on component mount
  const hasLoadedRef = React.useRef(false);
  
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadNotes(true); // Force initial load
    } else if (user && isDirtyRef.current) {
      loadNotes();
    } else if (!user) {
      if (hasLoadedRef.current) {
        hasLoadedRef.current = false;
        setNotes([]);
        setSelectedNote(null);
        setIsEditing(false);
        setShowDetail(false);
      }
    }
  }, [user, loadNotes]);

  // Failsafe: Clear loading state after reasonable timeout
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setError('Loading timed out. Please try refreshing.');
      }, 15000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);


  // Pagination state
  const NOTES_PER_PAGE = 12;
  const [page, setPage] = useState(1);
  // Memoize filtered notes to avoid unnecessary recalculations
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
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
    const timestamp = new Date().toISOString();
    const optimisticNote = { 
      ...noteData, 
      id: tempId, 
      createdAt: timestamp, 
      updatedAt: timestamp 
    };
    
    // Optimistic update
    setNotes(prev => [optimisticNote, ...prev]);
    setIsAddModalOpen(false);
    isDirtyRef.current = true;
    
    try {
      const result = await notesService.createNote(noteData);
      if (result && result.success) {
        setNotes(prev => prev.map(note => 
          note.id === tempId ? result.data : note
        ));
        setError(null);
      } else {
        // Revert optimistic update
        setNotes(prev => prev.filter(note => note.id !== tempId));
        setError(result?.error || 'Failed to create note');
      }
    } catch (error) {
      // Revert optimistic update
      setNotes(prev => prev.filter(note => note.id !== tempId));
      
      if (error.message && error.message.includes('500')) {
        if (error.message.includes('no DB row returned')) {
          setError('Database error - unable to save note. Please check backend database configuration.');
        } else {
          setError('Server error (500) - please check backend logs');
        }
      } else {
        setError('Failed to create note. Please try again.');
      }
    }
  }, [user]);

  // Show note detail view (navigates to /notes/:id)
  const handleShowDetail = (note) => {
    setSelectedNote(note);
    setShowDetail(true);
    setIsEditing(false);
    if (note && note.id && typeof note.id === 'string' && !note.id.includes(' ')) {
      navigate(`/notes/${note.id}`);
    }
  };

  // When editing, show editor (keeps URL at /notes/:id)
  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setShowDetail(false);
    if (note && note.id) {
      navigate(`/notes/${note.id}`);
    }
  };

  // Close detail view (navigates back to /notes)
  const handleCloseDetail = () => {
    setShowDetail(false);
    setIsEditing(false);
    setSelectedNote(null);
    navigate('/notes');
  };
  // Deep linking: show detail if routeNoteId is present
  useEffect(() => {
    if (routeNoteId && notes && notes.length > 0) {
      const found = notes.find(n => String(n.id) === String(routeNoteId));
      if (found) {
        setSelectedNote(found);
        setShowDetail(true);
        setIsEditing(false);
      } else {
        // If not found, close detail
        setShowDetail(false);
        setSelectedNote(null);
        setIsEditing(false);
      }
    } else if (!routeNoteId) {
      setShowDetail(false);
      setSelectedNote(null);
      setIsEditing(false);
    }
  }, [routeNoteId, notes]);

  const handleSaveNote = useCallback(async (updatedNote) => {
    const prevNotes = notes;
    const prevSelectedNote = selectedNote;
    
    // Optimistic update
    setNotes(prev => prev.map(note => 
      note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : note
    ));
    setIsEditing(false);
    setSelectedNote(updatedNote);
    isDirtyRef.current = true;
    
    try {
      const result = await notesService.updateNote(updatedNote.id, updatedNote);
      if (result && result.success) {
        setNotes(prev => prev.map(note => 
          note.id === updatedNote.id ? result.data : note
        ));
        setSelectedNote(result.data);
        setError(null);
        navigate(`/notes/${result.data.id}`);
      } else {
        // Revert optimistic updates
        setNotes(prevNotes);
        setSelectedNote(prevSelectedNote);
        setIsEditing(true);
        setError(result?.error || 'Failed to update note');
      }
    } catch (error) {
      // Revert optimistic updates
      setNotes(prevNotes);
      setSelectedNote(prevSelectedNote);
      setIsEditing(true);
      setError('Failed to update note. Please try again.');
    }
  }, [notes, selectedNote, navigate]);

  const handleDeleteNote = useCallback(async (noteId) => {
    // Handle temporary notes
    if (String(noteId).startsWith('temp-')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
        setShowDetail(false);
        navigate('/notes');
      }
      return;
    }
    
    const prevNotes = notes;
    const wasSelected = selectedNote?.id === noteId;
    
    // Optimistic update
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (wasSelected) {
      setSelectedNote(null);
      setIsEditing(false);
      setShowDetail(false);
      navigate('/notes');
    }
    
    isDirtyRef.current = true;
    
    try {
      const result = await notesService.deleteNote(noteId);
      if (result && result.success) {
        setError(null);
      } else {
        // Revert optimistic update
        setNotes(prevNotes);
        if (wasSelected) {
          const noteToRestore = prevNotes.find(note => note.id === noteId);
          if (noteToRestore) {
            setSelectedNote(noteToRestore);
            setShowDetail(true);
            navigate(`/notes/${noteId}`);
          }
        }
        setError(result?.error || 'Failed to delete note');
      }
    } catch (error) {
      // Revert optimistic update
      setNotes(prevNotes);
      if (wasSelected) {
        const noteToRestore = prevNotes.find(note => note.id === noteId);
        if (noteToRestore) {
          setSelectedNote(noteToRestore);
          setShowDetail(true);
          navigate(`/notes/${noteId}`);
        }
      }
      setError('Failed to delete note. Please try again.');
    }
  }, [notes, selectedNote, navigate]);

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
      <NotesHeader
        onAddNote={() => setIsAddModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        notesCount={notes.length}
        onLogoutClick={handleLogoutClick}
      />
            {/* Logout Confirmation Modal rendered at app root for visibility */}
            {showLogoutModal && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-sm max-h-[96vh] overflow-y-auto flex flex-col items-center border-2 border-red-400/30 relative mx-4">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-10 mb-2 text-center">Are you sure you want to logout?</h2>
                  <p className="text-gray-500 text-center mb-6">You will be signed out of your account.</p>
                  <div className="flex gap-4 w-full justify-center">
                    <button
                      onClick={handleLogoutConfirm}
                      className="px-5 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleLogoutCancel}
                      className="px-5 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-300 transition-all duration-200"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
      
      {/* Removed offline mode indicator - only using real API authentication now */}
      
      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 pt-4">
          <div className={`${
            error.includes('demo notes') || error.includes('API connection unavailable') || error.includes('Showing demo notes')
              ? 'bg-blue-900/30 border border-blue-400/30' 
              : 'bg-red-900/50 border border-red-500/50'
          } rounded-lg p-4 mb-4 backdrop-blur-sm`}>
            <div className="flex items-start">
              {error.includes('demo notes') || error.includes('API connection unavailable') || error.includes('Showing demo notes') ? (
                <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <p className={`${
                  error.includes('demo notes') || error.includes('API connection unavailable') || error.includes('Showing demo notes')
                    ? 'text-blue-300' 
                    : 'text-red-300'
                } text-sm break-words`}>{error}</p>
                
                {/* Helpful info for demo notes */}
                {(error.includes('demo notes') || error.includes('API connection unavailable')) && (
                  <p className="text-blue-200/70 text-xs mt-1">
                    Configure your backend server with CORS headers for: https://s-thakur00.github.io
                  </p>
                )}
                
                {/* Action buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setError(null);
                      isDirtyRef.current = true;
                      loadNotes(true);
                    }}
                    className="text-red-200 hover:text-white text-xs underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-300 flex-shrink-0"
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
        className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-32 animate-slide-in-right relative z-10"
      >
        {isLoading ? (
          <div className="py-10 px-2">
            <NotesSkeleton count={6} />
          </div>
        ) : showDetail && selectedNote ? (
          <NoteDetail
            note={selectedNote}
            onEdit={handleEditNote}
            onClose={handleCloseDetail}
          />
        ) : isEditing && selectedNote ? (
          <div className="animate-scale-in">
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
              onClose={handleCloseDetail}
              onDelete={handleDeleteNote}
            />
          </div>
        ) : (
          <NotesList
            notes={paginatedNotes}
            onEditNote={handleEditNote}
            onShowDetail={handleShowDetail}
            onDeleteNote={handleDeleteNote}
            searchTerm={searchTerm}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalNotes={filteredNotes.length}
          />
        )}
      </main>


    </div>

    {/* Floating Add Note Button - Circular FAB, outside main container for true floating */}
    <button
      onClick={() => setIsAddModalOpen(true)}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl hover:scale-110 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-pink-300"
      style={{ boxShadow: '0 8px 32px 0 rgba(80,0,255,0.18)' }}
      aria-label="Add Note"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>

      {isAddModalOpen && (
        <AddNoteModal
          onAdd={handleAddNote}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      </div>
  )
  
};

export default NotesApp;