import React, { useState, useEffect } from 'react';
import NotesHeader from './NotesHeader';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import AddNoteModal from './AddNoteModal';
import { notesService } from '../services/notesService';
import { useAuth } from '../context/AuthContext';

const NotesApp = () => {
  const { logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load notes from API on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await notesService.fetchNotes();
      if (result.success) {
        setNotes(result.data);
        setFilteredNotes(result.data);
        
        if (result.fromCache) {
          setError('Using cached data. Some changes may not be synced.');
        }
      } else {
        // Don't logout on API errors - just show error message
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notes based on search term - now using local search
  useEffect(() => {
    console.log('🔍 Search filter running:', { searchTerm, notesCount: notes.length });
    
    // Use the local search function from notesService
    const filtered = notesService.searchNotes(searchTerm, notes);
    setFilteredNotes(filtered);
    
  }, [searchTerm, notes]);

  const handleAddNote = async (noteData) => {
    try {
      const result = await notesService.createNote(noteData);
      if (result.success) {
        setNotes(prev => [result.data, ...prev]);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      setError('Failed to create note. Please try again.');
    }
    setIsAddModalOpen(false);
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async (updatedNote) => {
    try {
      const result = await notesService.updateNote(updatedNote.id, updatedNote);
      if (result.success) {
        setNotes(prev => prev.map(note =>
          note.id === updatedNote.id ? result.data : note
        ));
        setError(null);
      } else {
        setError(result.error);
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
      if (result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
        setError(null);
      } else {
        setError(result.error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NotesHeader
        onAddNote={() => setIsAddModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        notesCount={notes.length}
      />
      
      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
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
              <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading your notes...</p>
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
    </div>
  );
};

export default NotesApp;