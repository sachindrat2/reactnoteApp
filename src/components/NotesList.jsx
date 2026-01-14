import React from 'react';
import NoteCard from './NoteCard';

// Skeleton NoteCard loader
const NoteCardSkeleton = () => (
  <div
    className="group rounded-2xl shadow-lg border border-gray-200/40 backdrop-blur-lg bg-gradient-to-br from-blue-100 via-white to-purple-100 overflow-hidden animate-pulse relative w-full h-56 p-0 flex flex-col justify-between border-transparent cursor-pointer"
    style={{ boxShadow: '0 4px 32px 0 rgba(80,120,255,0.07)' }}
  >
    {/* Created Date - absolute top left with extra spacing */}
    <div className="absolute top-1 left-4 z-40 flex items-center gap-1 bg-white/80 rounded-full px-2 py-0.5 shadow border border-blue-100 text-blue-700 text-[10px] font-semibold min-w-[60px]">
      <div className="w-3 h-3 bg-blue-200 rounded-full animate-pulse" />
      <span className="bg-blue-100 rounded w-12 h-2 inline-block animate-pulse" />
    </div>
    {/* Card Image Carousel */}
    <div className="w-full h-24 bg-gray-200 border-b border-gray-300 rounded-t-2xl flex items-center justify-center relative overflow-hidden">
      <div className="w-full h-full bg-gray-300 animate-pulse" />
    </div>
    {/* Glow effect */}
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-24 h-24 bg-blue-400 opacity-10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400 opacity-10 rounded-full blur-2xl" />
    </div>
    {/* Card Header and Content */}
    <div className="p-4 pb-2 relative z-10 flex items-start gap-4 flex-shrink-0">
      {/* Avatar skeleton */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-400 animate-pulse shadow-md ring-2 ring-white/60" />
      <div className="flex-1 min-w-0">
        <div className="h-6 bg-slate-200 rounded w-2/3 mb-1 animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-5/6 mb-2 animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-2 animate-pulse" />
        <div className="flex flex-wrap gap-2 mb-1 min-h-[2.2rem] items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-sm animate-pulse w-12 h-4" />
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-sm animate-pulse w-12 h-4" />
        </div>
      </div>
    </div>
  </div>
);
const NotesList = ({ notes, onEditNote, onDeleteNote, searchTerm, page = 1, totalPages = 1, onPageChange, totalNotes }) => {
  // Ensure notes is always an array
  const safeNotes = Array.isArray(notes) ? notes : [];
  // Skeleton loading state (simulate with notes === null)
  if (notes === null) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-y-6 gap-x-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-y-6 gap-x-8">
        {safeNotes.map((note, index) => (
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
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 disabled:opacity-50"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 font-semibold">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 disabled:opacity-50"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {/* Show count */}
      {typeof totalNotes === 'number' && (
        <div className="flex justify-center mt-4">
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">
            Showing {notes.length} of {totalNotes} notes
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesList;