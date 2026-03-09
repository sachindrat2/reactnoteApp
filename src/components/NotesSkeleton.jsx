import React from 'react';

const NotesSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="animate-pulse rounded-lg shadow border border-gray-200/40 backdrop-blur-lg bg-gradient-to-br from-purple-100 via-white to-blue-100 overflow-hidden relative w-full h-32 xs:h-40 sm:h-48 p-0 flex flex-col justify-between"
        style={{ boxShadow: '0 1px 8px 0 rgba(80,120,255,0.07)' }}
      >
        {/* Date badge top left (match NoteCard) */}
        <div className="absolute top-2 left-3 z-40 flex items-center gap-1 bg-white/80 rounded-full px-2 py-0.5 shadow border border-blue-100 text-blue-700 text-[10px] font-semibold w-14 h-5" />
        {/* Floating action buttons top right (match NoteCard) */}
        <div className="absolute top-2 right-3 flex gap-2 z-30">
          <div className="p-2 bg-white/80 rounded-full shadow-md border border-blue-100 text-blue-600 w-8 h-8" />
          <div className="p-2 bg-white/90 rounded-full shadow-md border border-red-100 text-red-600 w-8 h-8" />
        </div>
        {/* Card image bar */}
        <div className="w-full h-12 xs:h-14 sm:h-20 bg-gray-200 border-b border-gray-300 rounded-t-lg flex items-center justify-center relative overflow-hidden mb-0" />
        {/* Card content */}
        <div className="p-1 xs:p-1.5 sm:p-3 pb-0.5 sm:pb-1.5 relative z-10 flex items-start gap-1 xs:gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Avatar (match NoteCard vertical alignment) */}
          <div className="flex-shrink-0 w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-blue-300 flex items-center justify-center text-white text-base xs:text-lg sm:text-xl font-bold shadow-md ring-2 ring-white/60 mt-2" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-slate-300 rounded w-1/3 mb-1 mt-2" />
            <div className="h-3 bg-slate-200 rounded w-2/3 mb-1" />
            <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
            {/* Tag chips */}
            <div className="flex flex-wrap gap-1 mb-1 min-h-[1.1rem] items-center">
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-300 border border-slate-200 shadow-sm w-12 h-4" />
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-300 border border-slate-200 shadow-sm w-10 h-4" />
            </div>
          </div>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-400 opacity-10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400 opacity-10 rounded-full blur-2xl" />
        </div>
      </div>
    ))}
  </div>
);

export default NotesSkeleton;
