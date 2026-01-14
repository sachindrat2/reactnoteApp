import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NoteCard = ({ note, onEdit, onDelete }) => {
    // Timer state for top left
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }, []);
  const navigate = useNavigate();
  const handleCardClick = (e) => {
    // Prevent click if edit/delete button was clicked
    if (e.target.closest('button')) return;
    navigate(`/notes/${note.id}`, { state: { note } });
  };
  const { t } = useTranslation();
  const formatDate = (dateString) => {
    if (!dateString) return t('noDate');
    let date;
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + 'Z');
    }
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return t('minutesAgo', { count: diffInMinutes });
    if (diffInHours < 24) return t('hoursAgo', { count: diffInHours });
    if (diffInDays === 1) return t('yesterday');
    if (diffInDays < 7) return t('daysAgo', { count: diffInDays });
    return date.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  const getCreatedDate = () => note.createdAt || note.created_at;
  const getUpdatedDate = () => note.updatedAt || note.updated_at;
  // No longer needed: getPreview, use line-clamp for max lines
  // Modern glassmorphism palette
  const palette = [
    'from-blue-100 via-white to-purple-100',
    'from-emerald-100 via-white to-teal-100',
    'from-pink-100 via-white to-rose-100',
    'from-indigo-100 via-white to-blue-100',
    'from-orange-100 via-white to-amber-100',
    'from-purple-100 via-white to-blue-100',
    'from-teal-100 via-white to-emerald-100',
    'from-amber-100 via-white to-orange-100',
  ];
  const index = (() => {
    if (typeof note.id === 'number') return Math.abs(note.id);
    const s = String(note.id || note.title || '0');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
    return Math.abs(h);
  })();
  const gradient = palette[index % palette.length];

  const avatarColor = [
    'bg-blue-400', 'bg-purple-400', 'bg-emerald-400', 'bg-amber-400',
    'bg-rose-400', 'bg-indigo-400', 'bg-teal-400', 'bg-orange-400',
  ][index % 8];
  const firstLetter = note.title ? note.title[0].toUpperCase() : '?';

  // Carousel state for images
  const images = Array.isArray(note.images) && note.images.length > 0
    ? note.images
    : [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80'
      ];
  const [imgIdx, setImgIdx] = useState(0);
  const handlePrev = (e) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  // Auto-move carousel every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      className={`group rounded-2xl shadow-lg border border-gray-200/40 backdrop-blur-lg bg-gradient-to-br ${gradient}
      overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:-translate-y-2 animate-fade-in relative
      hover:shadow-2xl hover:border-blue-400/60 hover:ring-2 hover:ring-blue-200/40
      w-full h-56 p-0 flex flex-col justify-between border-transparent hover:border-blue-200 cursor-pointer`}
      style={{ boxShadow: '0 4px 32px 0 rgba(80,120,255,0.07)' }}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={note.title || 'Open note details'}
    >
      {/* Created Date - absolute top left with extra spacing */}
      <div className="absolute top-1 left-4 z-40 flex items-center gap-1 bg-white/80 rounded-full px-2 py-0.5 shadow border border-blue-100 text-blue-700 text-[10px] font-semibold" style={{minWidth:'60px'}}>
        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="15" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>{formatDate(getCreatedDate())}</span>
      </div>
      {/* Card Image Carousel */}
      <div className="w-full h-24 bg-gray-200 border-b border-gray-300 rounded-t-2xl flex items-center justify-center relative overflow-hidden">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={note.title || 'Note image'}
            className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-700 ${i === imgIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            loading="lazy"
            style={{ display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ))}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-slate-700 rounded-full p-1 shadow z-10"
              onClick={handlePrev}
              tabIndex={-1}
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-slate-700 rounded-full p-1 shadow z-10"
              onClick={handleNext}
              tabIndex={-1}
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-200 focus:outline-none ${i === imgIdx ? 'bg-gradient-to-r from-purple-500 to-blue-600 border-purple-700 scale-110 shadow' : 'bg-white border-slate-300 hover:bg-blue-200'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-400 opacity-10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400 opacity-10 rounded-full blur-2xl" />
      </div>
      {/* Floating Edit Button */}
      {/* Card Header with created time at top right */}
      <div className="p-4 pb-2 relative z-10 flex items-start gap-4 flex-shrink-0">
        {/* Edit & Delete Buttons - absolute top right, aligned */}
        <div className="absolute top-4 right-4 flex gap-2 z-30">
          <button
            onClick={() => onEdit(note)}
            className="p-2 bg-white/80 rounded-full shadow-md border border-blue-100 text-blue-600 transition-all duration-300 hover:bg-blue-50 hover:text-blue-800"
            title="Edit note"
            style={{ boxShadow: '0 2px 8px 0 rgba(80,120,255,0.10)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-2 bg-white/90 rounded-full shadow-md border border-red-100 text-red-600 hover:bg-red-50 hover:text-red-800 transition-all duration-200"
            title="Delete note"
            style={{ boxShadow: '0 2px 8px 0 rgba(255,80,80,0.10)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white text-xl font-bold shadow-md ring-2 ring-white/60`}>
          {firstLetter}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg sm:text-xl text-slate-800 line-clamp-2 mb-1">
            {note.title}
          </h3>
          <p className="leading-relaxed mb-2 text-slate-700 text-sm line-clamp-1">
            {(() => {
              if (!note.content) return null;
              // Regex to match URLs
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const parts = note.content.split(urlRegex);
              return parts.map((part, idx) => {
                if (urlRegex.test(part)) {
                  return (
                    <a
                      key={idx}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                      onClick={e => e.stopPropagation()}
                    >
                      {part}
                    </a>
                  );
                }
                return <span key={idx}>{part}</span>;
              });
            })()}
          </p>
          <div className="flex flex-wrap gap-2 mb-1 min-h-[2.2rem] items-center">
            {Array.isArray(note.tags) && note.tags.length > 0 ? (
              <>
                {note.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    #{tag}
                  </span>
                ))}
                {note.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 border border-slate-300">
                    +{note.tags.length - (window.innerWidth < 640 ? 2 : 3)} more
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200">No tags</span>
            )}
          </div>
        </div>
      {/* Delete Button - bottom left overlay, always visible */}
      </div>
      {/* Card Footer removed - created time is now at top right */}
    </div>
  );
};

export default NoteCard;