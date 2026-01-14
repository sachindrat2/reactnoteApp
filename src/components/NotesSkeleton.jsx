import React from 'react';

const NotesSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="animate-pulse bg-slate-200/60 rounded-2xl shadow-lg p-6 h-40 flex flex-col justify-between"
      >
        <div className="h-6 bg-slate-300 rounded w-2/3 mb-3" />
        <div className="h-4 bg-slate-300 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-300 rounded w-full mb-1" />
        <div className="h-3 bg-slate-300 rounded w-5/6" />
        <div className="flex justify-end mt-4">
          <div className="h-8 w-8 bg-slate-300 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export default NotesSkeleton;
