import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';


const NoteEditor = ({ note = null, onSave, onClose, onDelete }) => {
  // Defensive: note must be a valid object with required fields
  const isValidNote = note && typeof note === 'object' && 'id' in note && 'title' in note && 'content' in note;
  if (!isValidNote) {
    console.warn('NoteEditor: Invalid or missing `note` prop. Component will not render.', note);
    return null;
  }

  const { t } = useTranslation();
  // If note is not defined, do not initialize state/hooks
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');
  const [tags, setTags] = useState(note && note.tags ? note.tags : []);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState(note && Array.isArray(note.images) ? note.images : []);
  const [imageFiles, setImageFiles] = useState([]); // For new uploads
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const contentRef = useRef(null);

  // Sync state with note prop when it changes
  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setImages(Array.isArray(note.images) ? note.images : []);
  }, [note]);

  useEffect(() => {
    if (!note) return;
    const hasAnyChanges =
      title !== note.title ||
      content !== note.content ||
      JSON.stringify(tags) !== JSON.stringify(note.tags || []) ||
      JSON.stringify(images) !== JSON.stringify(note.images || []);
    setHasChanges(hasAnyChanges);
  }, [title, content, tags, images, note]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, []);

  // Helper to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    let updatedImages = images;
    if (imageFiles.length > 0) {
      const newBase64s = await Promise.all(imageFiles.map(f => fileToBase64(f.file)));
      updatedImages = [...images, ...newBase64s];
    }
    const updatedNote = {
      ...note,
      title: title.trim() || t('untitledNote'),
      content: content.trim(),
      tags,
      images: updatedImages
    };
    try {
      await onSave(updatedNote);
      setImageFiles([]); // Clear after save
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('deleteConfirm'))) {
      setIsDeleteLoading(true);
      try {
        await onDelete(note.id);
      } finally {
        setIsDeleteLoading(false);
      }
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
                disabled={isDeleteLoading}
                className={`p-2 rounded-lg transition-colors duration-200 ${isDeleteLoading ? 'bg-red-200 text-red-400 cursor-wait' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
                title={t('deleteNote')}
              >
                {isDeleteLoading ? (
                  <svg className="animate-spin w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
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
                )
                }
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
        {/* Tags Input - add/remove individual tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('tagsLabel')}</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1">
                {tag}
                <button type="button" className="ml-1 text-blue-500 hover:text-red-500" onClick={() => setTags(tags.filter((_, i) => i !== idx))}>&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder={t('tagsPlaceholder')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              onKeyDown={e => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
                  setTagInput('');
                }
              }}
            />
            <button type="button" className="px-3 py-2 bg-blue-500 text-white rounded-lg" onClick={() => {
              if (tagInput.trim() && !tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
              setTagInput('');
            }}>Add</button>
          </div>
        </div>
                {/* Images Section - add/remove images */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Images</label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt={`Note image ${idx + 1}`} className="object-cover w-full h-full" />
                        <button type="button" className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs" onClick={() => setImages(images.filter((_, i) => i !== idx))}>&times;</button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      const previews = files.map(file => ({ file }));
                      setImageFiles(prev => [...prev, ...previews]);
                      e.target.value = '';
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <input
                    type="text"
                    placeholder="Paste image URL and press Enter"
                    className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && imageUrlInput.trim()) {
                        setImages(prev => [...prev, imageUrlInput.trim()]);
                        setImageUrlInput('');
                      }
                    }}
                  />
                  <button type="button" className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-lg" onClick={() => {
                    if (imageUrlInput.trim()) {
                      setImages(prev => [...prev, imageUrlInput.trim()]);
                      setImageUrlInput('');
                    }
                  }}>Add Image URL</button>
                  {/* Preview new uploads before save */}
                  {imageFiles.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {imageFiles.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          <img src={URL.createObjectURL(img.file)} alt="Preview" className="object-cover w-full h-full" />
                          <button type="button" className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs" onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
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
}

export default NoteEditor;

