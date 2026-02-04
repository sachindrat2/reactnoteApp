import React from 'react';


import { useState } from 'react';

const NoteDetail = ({ note, onEdit, onClose }) => {
  if (!note) return null;

  // Images carousel logic
  const validImages = Array.isArray(note.images) 
    ? note.images.filter(img => 
        img && 
        typeof img === 'string' && 
        (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/'))
      )
    : [];
  
  const images = validImages.length > 0
    ? validImages
    : [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80'
      ];
  const [imgIdx, setImgIdx] = useState(0);
  const handlePrev = (e) => {
    e && e.stopPropagation();
    setImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNext = (e) => {
    e && e.stopPropagation();
    setImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900 break-words leading-tight">{note.title}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 rounded-full p-1"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Images carousel */}
      <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-xl mb-6 relative flex items-center justify-center overflow-hidden">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={note.title || `Note image ${i + 1}`}
            className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-700 rounded-xl shadow-2xl ${i === imgIdx ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95'}`}
            loading="lazy"
            style={{ display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ))}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-purple-700 rounded-full p-2 shadow-lg z-20 border border-purple-200"
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-purple-700 rounded-full p-2 shadow-lg z-20 border border-purple-200"
              onClick={handleNext}
              aria-label="Next image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-200 focus:outline-none ${idx === imgIdx ? 'bg-gradient-to-r from-purple-500 to-blue-600 border-purple-700 scale-110 shadow' : 'bg-white border-slate-300 hover:bg-purple-200'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setImgIdx(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content rendered as HTML */}
      <div className="mb-4 text-gray-700 whitespace-pre-line text-lg" dangerouslySetInnerHTML={{ __html: note.content }} />

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.map((tag, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => onEdit(note)}
          className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold shadow hover:scale-105 transition-all duration-200"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default NoteDetail;
         