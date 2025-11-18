import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const AddNoteModal = ({ onAdd, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const titleInputRef = useRef(null);

  useEffect(() => {
    // Focus on title input when modal opens
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }

    // Handle escape key to close modal
    const handleEscape = (e) => { 
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim() && !content.trim()) {
      return; // Don't create empty notes
    }

    const noteData = {
      title: title.trim() || t('untitledNote'),
      content: content.trim(),
      tags: tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    onAdd(noteData);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto animate-scale-in my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t('createNewNote')}</h2>
            <p className="text-slate-500 text-sm mt-1 hidden sm:block">{t('addNewNoteDesc')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="note-title" className="block text-sm font-medium text-slate-700 mb-2">
              {t('title')}
            </label>
            <input
              ref={titleInputRef}
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          {/* Tags Input */}
          <div>
            <label htmlFor="note-tags" className="block text-sm font-medium text-slate-700 mb-2">
              {t('tags')}
            </label>
            <input
              id="note-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('tagsPlaceholder')}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all duration-200 text-sm sm:text-base"
            />
            <p className="text-xs text-slate-500 mt-1">{t('tagsDescription')}</p>
          </div>
          {/* Content Textarea */}
          <div>
            <label htmlFor="note-content" className="block text-sm font-medium text-slate-700 mb-2">
              {t('content')}
            </label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('contentPlaceholder')}
              rows={window.innerWidth < 640 ? 5 : 6}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all duration-200 resize-y text-sm sm:text-base"
            />
          </div>
          {/* Modal Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-200 space-y-3 sm:space-y-0">
            <div className="text-xs sm:text-sm text-slate-500 order-2 sm:order-1">
              {t('charactersCount', { count: content.length, words: content.split(/\s+/).filter(word => word.length > 0).length })}
            </div>
            <div className="flex items-center space-x-3 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 
                         rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={!title.trim() && !content.trim()}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  title.trim() || content.trim()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {t('createNote')}
              </button>
            </div>
          </div>
        </form>
        {/* Quick Tips - Hidden on small screens to save space */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 hidden sm:block">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">{t('quickTips')}</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>{t('tipEscape')}</li>
                  <li>{t('tipTags')}</li>
                  <li>{t('tipEdit')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;