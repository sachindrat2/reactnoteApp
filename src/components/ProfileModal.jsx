import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { profileService } from '../services/profileService.js';



const ProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout, setUser } = useAuth();
  const [name, setName] = useState(user?.user?.name || user?.name || '');
  const [email, setEmail] = useState(user?.user?.email || user?.email || '');
  const [avatar, setAvatar] = useState(user?.user?.avatar || user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = async () => {
    setIsSaving(true);
    setError(null);
    const result = await profileService.removeAvatar();
    if (result.success) {
      setAvatar(null);
      setAvatarFile(null);
      // Update user context (remove avatar)
      setUser(prev => {
        if (!prev) return prev;
        let updated = { ...prev };
        if (updated.user) {
          updated.user.avatar = null;
        } else {
          updated.avatar = null;
        }
        // Also update localStorage
        localStorage.setItem('notesapp_user', JSON.stringify(updated));
        return updated;
      });
    } else {
      setError(result.error);
    }
    setIsSaving(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const result = await profileService.updateProfile({ name, email, avatar: avatarFile });
    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
      // Update user context with new profile data
      setUser(prev => {
        if (!prev) return prev;
        let updated = { ...prev };
        const d = result.data;
        if (updated.user) {
          if (d.username) updated.user.name = d.username;
          if (d.email) updated.user.email = d.email;
          if ('avatar' in d) updated.user.avatar = d.avatar;
        } else {
          if (d.username) updated.name = d.username;
          if (d.email) updated.email = d.email;
          if ('avatar' in d) updated.avatar = d.avatar;
        }
        // Also update localStorage
        localStorage.setItem('notesapp_user', JSON.stringify(updated));
        return updated;
      });
      onClose();
    }
    setIsSaving(false);
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleCancelLogout = () => setShowLogoutConfirm(false);
  const handleConfirmLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in relative flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-2 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">{t('profile', 'Profile')}</h2>
        <form onSubmit={handleSave} className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-4xl text-white font-bold overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="object-cover w-full h-full" />
            ) : (
              (user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()
            )}
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-white/80 rounded-full p-1 text-xs border border-gray-300 shadow"
              onClick={() => fileInputRef.current.click()}
              title={t('changeAvatar', 'Change avatar')}
            >
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 7a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 002 2h10z" />
              </svg>
            </button>
            {avatar && (
              <button
                type="button"
                className="absolute top-1 left-1 bg-white/80 rounded-full p-1 text-xs border border-gray-300 shadow"
                onClick={handleRemoveAvatar}
                title={t('removeAvatar', 'Remove avatar')}
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name', 'Name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email', 'Email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm w-full text-center">{error}</div>}
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow hover:scale-105 transition-all duration-200 disabled:opacity-60"
            >
              {isSaving ? t('saving') : t('saveProfile')}
            </button>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow hover:scale-105 hover:bg-red-700 transition-all duration-200"
            >
              {t('logout', 'Logout')}
            </button>
          </div>
          {/* Redesigned Logout Confirmation Modal Sheet */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center animate-fade-in">
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-full p-4 mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    {t('logout')}
                  </h3>
                  {/* Removed confirmLogout text as requested */}
                </div>
                <div className="flex gap-4 w-full mt-2">
                  <button
                    onClick={handleConfirmLogout}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow hover:scale-105 transition-all duration-200"
                  >
                    {t('logout')}
                  </button>
                  <button
                    onClick={handleCancelLogout}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold shadow hover:bg-gray-300 transition-all duration-200"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
