  // Sync state with note prop when it changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(', ') || '');
  }, [note]);
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const NoteEditor = ({ note = null, onSave, onClose, onDelete }) => {
  if (!note) return null;
  const { t } = useTranslation();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const hasAnyChanges = 
      title !== note.title || 
      content !== note.content || 
      tags !== (note.tags?.join(', ') || '');
    setHasChanges(hasAnyChanges);
  }, [title, content, tags, note]);

  useEffect(() => {
    // Auto-focus on content area when editor opens
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    const updatedNote = {
      ...note,
      title: title.trim() || t('untitledNote'),
      content: content.trim(),
      tags: tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    // Simulate save delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSave(updatedNote);
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (window.confirm(t('deleteConfirm'))) {
      onDelete(note.id);
    }
  };

  const handleKeyDown = (e) => {
    // Save on Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Close on Escape
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('noDate');
    
    // Handle different date formats from API
    let date;
    if (dateString.includes('T') || dateString.includes('Z')) {
      // ISO format: "2025-10-23T04:23:00Z"
      date = new Date(dateString);
    } else {
      // MySQL format: "2025-10-22 08:03:01" - treat as UTC
      date = new Date(dateString + 'Z'); // Add Z to treat as UTC
    }
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };
  return (
    <div className="min-h-screen bg-white" onKeyDown={handleKeyDown}>
      {/* Editor Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
            >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToNotes')}
            </button>
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Note Info */}
              <div className="text-sm text-slate-500 mr-4">
                <div>{t('created')}: {formatDate(note.createdAt || note.created_at)}</div>
                <div>{t('updated')}: {formatDate(note.updatedAt || note.updated_at)}</div>
              </div>
              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title={t('deleteNote')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  hasChanges && !isSaving
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {hasChanges ? t('saveChanges') : t('saved')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Editor Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          className="w-full text-3xl font-bold text-slate-800 placeholder-slate-400 border-none outline-none 
                   bg-transparent mb-4 focus:ring-0 resize-none"
        />
        {/* Tags Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('tagsLabel')}
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t('tagsPlaceholder')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
          />
        </div>
        {/* Content Textarea */}
        <div className="mb-8">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('contentPlaceholder')}
            className="w-full h-96 p-4 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200 resize-y leading-relaxed"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Editor Footer */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-4">
            <span>{t('charactersAndWords', { characters: content.length, words: content.split(/\s+/).filter(word => word.length > 0).length })}</span>
          </div>
          <div className="text-slate-400">
            {t('keyboardShortcuts')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;