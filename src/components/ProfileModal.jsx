import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { profileService } from '../services/profileService.js';



const ProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout, setUser } = useAuth();
    // Only use username for username, and email for email
    const initialUsername = user?.user?.username || user?.username || '';
    const initialEmail = user?.user?.email || user?.email || '';
    // If initialEmail is actually the username (no @), set to empty
    const safeInitialEmail = initialEmail && initialEmail.includes('@') ? initialEmail : '';
    const initialAvatar = user?.user?.avatar || user?.avatar || null;
    const [username, setUsername] = useState(initialUsername);
    const [email, setEmail] = useState(safeInitialEmail);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;


  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsSaving(true);
      setError(null);
      const result = await profileService.uploadAvatar(file);
      if (result.success) {
        setAvatar(result.data.avatar);
        setAvatarFile(null);
        setUser(prev => {
          if (!prev) return prev;
          let updated = { ...prev };
          if (updated.user) {
            updated.user.avatar = result.data.avatar;
          } else {
            updated.avatar = result.data.avatar;
          }
          localStorage.setItem('notesapp_user', JSON.stringify(updated));
          return updated;
        });
      } else {
        setError(result.error);
      }
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsSaving(true);
    setError(null);
    const result = await profileService.removeAvatar();
    if (result.success) {
      setAvatar(null);
      setAvatarFile(null);
      setUser(prev => {
        if (!prev) return prev;
        let updated = { ...prev };
        if (updated.user) {
          updated.user.avatar = null;
        } else {
          updated.avatar = null;
        }
        localStorage.setItem('notesapp_user', JSON.stringify(updated));
        return updated;
      });
    } else {
      setError(result.error);
    }
    setIsSaving(false);
  };


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    let updated = false;
    // Update username if changed
    if (username !== initialUsername) {
      const result = await profileService.updateUsername(username);
      if (result.success) {
        setUser(prev => {
          if (!prev) return prev;
          let upd = { ...prev };
          if (upd.user) {
            upd.user.username = username;
          } else {
            upd.username = username;
          }
          localStorage.setItem('notesapp_user', JSON.stringify(upd));
          return upd;
        });
        updated = true;
      } else {
        setError(result.error);
        setIsSaving(false);
        return;
      }
    }
    // Update email if changed
    if (email !== initialEmail) {
      const result = await profileService.updateEmail(email);
      if (result.success) {
        setUser(prev => {
          if (!prev) return prev;
          let upd = { ...prev };
          if (upd.user) {
            upd.user.email = email;
          } else {
            upd.email = email;
          }
          localStorage.setItem('notesapp_user', JSON.stringify(upd));
          return upd;
        });
        updated = true;
      } else {
        setError(result.error);
        setIsSaving(false);
        return;
      }
    }
    // Avatar is handled immediately on change
    if (updated) onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4 sm:p-6" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-3 sm:p-4 animate-scale-in relative flex flex-col max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 p-1 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center pr-6">{t('profile', 'Profile')}</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col items-center gap-2 sm:gap-3">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-lg sm:text-xl text-white font-bold overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="object-cover w-full h-full" />
            ) : (
              (user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()
            )}
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-white/90 rounded-full p-1 text-xs border border-gray-300 shadow-sm"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('username', 'Username')}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                autoComplete="username"
                required
              />
          </div>
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('email', 'Email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                autoComplete="email"
                required={false}
                placeholder=""
              />
          </div>
          {error && <div className="text-red-500 text-sm w-full text-center px-2">{error}</div>}
          <div className="flex flex-col gap-1.5 w-full mt-1">
              <button
                type="submit"
                disabled={isSaving || (username === initialUsername && email === safeInitialEmail)}
                className="w-full py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium text-sm shadow hover:scale-105 transition-all duration-200 disabled:opacity-60"
              >
                {isSaving ? t('saving') : t('saveProfile')}
              </button>
              {/* Logout button must NOT be type submit! */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full py-2 px-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium text-sm shadow hover:scale-105 hover:bg-red-700 transition-all duration-200"
              >
                {t('logout', 'Logout')}
              </button>
          </div>
          {/* Redesigned Logout Confirmation Modal Sheet */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm p-6 flex flex-col items-center animate-fade-in">
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
                    type="button"
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
