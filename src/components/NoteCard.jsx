import React from 'react';

const NoteCard = ({ note, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Handle both camelCase and snake_case from API
  const getCreatedDate = () => note.createdAt || note.created_at;
  const getUpdatedDate = () => note.updatedAt || note.updated_at;

  const getPreview = (content, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const getCardStyle = () => {
    // Palette of solid background colors with excellent readability
    const palette = [
      { bg: 'bg-blue-50 border-blue-200', text: 'text-slate-800', headerBg: 'bg-blue-100/50' },
      { bg: 'bg-purple-50 border-purple-200', text: 'text-slate-800', headerBg: 'bg-purple-100/50' },
      { bg: 'bg-emerald-50 border-emerald-200', text: 'text-slate-800', headerBg: 'bg-emerald-100/50' },
      { bg: 'bg-amber-50 border-amber-200', text: 'text-slate-800', headerBg: 'bg-amber-100/50' },
      { bg: 'bg-rose-50 border-rose-200', text: 'text-slate-800', headerBg: 'bg-rose-100/50' },
      { bg: 'bg-indigo-50 border-indigo-200', text: 'text-slate-800', headerBg: 'bg-indigo-100/50' },
      { bg: 'bg-teal-50 border-teal-200', text: 'text-slate-800', headerBg: 'bg-teal-100/50' },
      { bg: 'bg-orange-50 border-orange-200', text: 'text-slate-800', headerBg: 'bg-orange-100/50' }
    ];

    // Deterministic selection using numeric id or string hash
    const index = (() => {
      if (typeof note.id === 'number') return Math.abs(note.id);
      // simple hash for string ids
      const s = String(note.id || note.title || '0');
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
      return Math.abs(h);
    })();

    return palette[index % palette.length];
  };

  const cardStyle = getCardStyle();

  return (
    <div className={`group rounded-2xl shadow-sm hover:shadow-xl border 
                    overflow-hidden transition-all duration-300 sm:hover:scale-[1.02] sm:hover:-translate-y-1
                    ${cardStyle.bg} animate-fade-in`}>
      
      {/* Card Header */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-semibold ${cardStyle.text} text-base sm:text-lg line-clamp-2 flex-1 mr-2`}>
            {note.title}
          </h3>
          
          {/* Action Buttons - Always visible on mobile, hover on desktop */}
          <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Edit note"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Delete note"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <p className={`leading-relaxed mb-3 sm:mb-4 line-clamp-3 text-slate-600 text-xs sm:text-sm`}>
          {getPreview(note.content, window.innerWidth < 640 ? 80 : 120)}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {note.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium 
                         bg-white/80 text-slate-700 border border-slate-300 shadow-sm"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium 
                             bg-slate-200 text-slate-600 border border-slate-300">
                +{note.tags.length - (window.innerWidth < 640 ? 2 : 3)} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className={`px-4 sm:px-6 py-3 sm:py-4 ${cardStyle.headerBg} border-t border-slate-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-slate-500">
            {/* Show created date if available */}
            {getCreatedDate() && (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span className="hidden sm:inline">Created {formatDate(getCreatedDate())}</span>
                <span className="sm:hidden">{formatDate(getCreatedDate())}</span>
              </div>
            )}
            {/* Show updated date if different from created date */}
            {getUpdatedDate() && (!getCreatedDate() || getUpdatedDate() !== getCreatedDate()) && (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Updated {formatDate(getUpdatedDate())}</span>
                <span className="sm:hidden">Updated {formatDate(getUpdatedDate())}</span>
              </div>
            )}
            {/* Fallback if no timestamps are available */}
            {!getCreatedDate() && !getUpdatedDate() && (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-400">No date</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => onEdit(note)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <span className="hidden sm:inline">Open →</span>
            <span className="sm:hidden">Open</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;