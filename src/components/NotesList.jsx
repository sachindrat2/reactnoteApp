import React from 'react';
import NoteCard from './NoteCard';

const NotesList = ({ notes, onEditNote, onDeleteNote, searchTerm }) => {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          {searchTerm ? 'No notes found' : 'No notes yet'}
        </h3>
        
        <p className="text-slate-500 text-center max-w-md">
          {searchTerm 
            ? `No notes match "${searchTerm}". Try adjusting your search terms.`
            : 'Start by creating your first note. Click the "New Note" button to get started.'
          }
        </p>
        
        {searchTerm && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Results Header */}
      {searchTerm && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">
                Search Results
              </h2>
              <p className="text-blue-700 text-sm">
                Found {notes.length} note{notes.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </p>
            </div>
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Notes Grid - Improved responsive breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
        {notes.map((note, index) => (
          <div 
            key={note.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <NoteCard
              note={note}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
            />
          </div>
        ))}
      </div>

      {/* Load More Button (for future pagination) */}
      {notes.length > 0 && (
        <div className="flex justify-center mt-12">
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">
            Showing {notes.length} notes
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesList;