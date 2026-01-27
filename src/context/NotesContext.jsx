import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotesContext = createContext();

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within a NotesProvider');
  return ctx;
};

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState(() => {
    const cached = localStorage.getItem('notesapp_notes_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hydrate notes from cache if empty and not loading
  useEffect(() => {
    if (!isLoading && notes.length === 0) {
      const cached = localStorage.getItem('notesapp_notes_cache');
      if (cached) {
        setNotes(JSON.parse(cached));
      }
    }
  }, [isLoading, notes.length]);

  // Persist notes to cache on change
  useEffect(() => {
    localStorage.setItem('notesapp_notes_cache', JSON.stringify(notes));
  }, [notes]);

  // API fetch logic can be added here or passed in from components
  const updateNotes = useCallback((newNotes) => {
    setNotes(newNotes);
  }, []);

  return (
    <NotesContext.Provider value={{ notes, setNotes, isLoading, setIsLoading, error, setError, updateNotes }}>
      {children}
    </NotesContext.Provider>
  );
};
