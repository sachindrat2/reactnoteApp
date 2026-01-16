import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NoteEditor from './NoteEditor.jsx';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notesService } from '../services/notesService.js';

const NoteDetail = () => {
  const { t } = useTranslation();
  // Use the same date formatting as NoteCard
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
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  // Local note state for live updates after edit
  const [localNote, setLocalNote] = useState(location.state?.note || null);
  const note = localNote;
  const error = !note ? t('error') : null;

  // Carousel for images (hooks must be above all returns)
  const images = Array.isArray(note?.images) && note.images.length > 0
    ? note.images
    : [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80'
      ];
  const [imgIdx, setImgIdx] = useState(0);
  const handlePrev = () => setImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  const handleNext = () => setImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!note) return null;

  // Edit mode: show NoteEditor
  if (editMode) {
    return (
      <NoteEditor
        note={note}
        onSave={async (updatedNote) => {
          setSaving(true);
          const result = await notesService.updateNote(note.id, updatedNote);
          setSaving(false);
          if (result.success) {
            setLocalNote(result.data);
            setEditMode(false);
          } else {
            alert(result.error || t('saveError'));
          }
        }}
        onClose={() => {
          setEditMode(false);
        }}
      />
    );
  }

  // Main detail view
  return (
    <>
      <div className="w-full px-0 pb-10">
        <div className="w-full border-b border-gray-200 flex flex-col gap-0">
          <div className="w-full h-72 sm:h-96 bg-gradient-to-tr from-purple-200 via-blue-100 to-emerald-100 border-b border-gray-200 relative flex items-center justify-center overflow-hidden shadow-xl rounded-b-3xl">
            {/* Back button: visually distinct, floating, and carousel covers top space */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-5 py-2 rounded-full shadow-xl border-2 border-white/60 text-base font-bold z-30 flex items-center gap-2 hover:scale-105 hover:bg-blue-700 transition-all backdrop-blur-lg"
              style={{ boxShadow: '0 4px 24px 0 rgba(80, 0, 120, 0.12)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="font-bold text-white drop-shadow">{t('back')}</span>
            </button>
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={note.title || `Note image ${i + 1}`}
                className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-700 rounded-2xl shadow-2xl ${i === imgIdx ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95'}`}
                loading="lazy"
                style={{ display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ))}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-purple-700 rounded-full p-2 shadow-lg z-20 border border-purple-200"
                  onClick={e => { e.stopPropagation(); handlePrev(); }}
                  aria-label="Previous image"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-purple-700 rounded-full p-2 shadow-lg z-20 border border-purple-200"
                  onClick={e => { e.stopPropagation(); handleNext(); }}
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
                      onClick={e => { e.stopPropagation(); setImgIdx(idx); }}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            <a
              href={images[imgIdx]}
              download
              className="absolute top-4 right-4 bg-white/80 hover:bg-purple-100 text-purple-700 px-3 py-1 rounded-full shadow border border-purple-200 text-sm font-semibold z-30"
              title="Download image"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
              Download
            </a>
          </div>
        </div>
        <div className="w-full flex flex-col gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-8 w-full">
            <div className="flex flex-col gap-2 w-full">
              <h1 className="text-5xl font-extrabold text-black break-words leading-tight drop-shadow-xl animate-slide-in-right w-full">{note.title}</h1>
              {/* Created Date Pill styled like NoteCard, just below title, width shorter */}
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-base font-semibold shadow border border-purple-200 mt-3 max-w-xs">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {t('createdDate', { date: formatDate(note.createdAt || note.created_at) })}
              </span>
              {/* Tags below created date pill, styled like NoteCard */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {note.tags.map((tag, idx) => (
                    <span key={idx} className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-base font-semibold shadow border border-purple-200">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="mt-6 sm:mt-0 ml-0 sm:ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold shadow-lg hover:scale-105 hover:bg-blue-700 transition-all text-lg"
            >
              {t('edit', 'Edit')}
            </button>
          </div>
          <div className="mb-8 flex items-center gap-4 px-8 w-full">
            {/* Tags removed here to avoid duplicate rendering. Tags are shown below the created date. */}
          </div>
          {/* Content full width */}
          <div className="mb-10 text-gray-800 text-2xl leading-relaxed tracking-wide font-light bg-gradient-to-br from-purple-50 via-white to-emerald-50 rounded-2xl p-10 shadow-xl animate-slide-in-up w-full mx-0">
            {note.content && (
              <div dangerouslySetInnerHTML={{ __html: note.content }} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export default NoteDetail;
