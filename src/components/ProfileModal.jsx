import React, { useState, useRef, useEffect } from 'react';
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
  const safeInitialEmail = initialEmail && typeof initialEmail === 'string' && initialEmail.includes('@') ? initialEmail : '';
  const initialAvatar = user?.user?.avatar || user?.avatar || null;
  
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(safeInitialEmail);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [componentMounted, setComponentMounted] = useState(true);
  const fileInputRef = useRef();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Cleanup on unmount to prevent state updates
  useEffect(() => {
    setComponentMounted(true);
    return () => {
      setComponentMounted(false);
    };
  }, []);

  // Helper function to construct full avatar URL
  const constructAvatarUrl = (avatarPath) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    return `https://backend-noteapp-new.salmonground-95e8af22.japaneast.azurecontainerapps.io${avatarPath}`;
  };

  // Fetch current profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    if (!componentMounted) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await profileService.getProfile();
      if (!componentMounted) return;
      
      if (result.success) {
        // API returns: { id, username, email, avatar }
        const profile = result.data;
        console.log('🔍 Profile data received:', profile);
        setUsername(profile.username || '');
        setEmail(profile.email || '');
        // Always construct full URL for avatar
        const fullAvatarUrl = constructAvatarUrl(profile.avatar);
        console.log('🔍 Loaded profile avatar URL:', fullAvatarUrl);
        console.log('🔍 Raw avatar from API:', profile.avatar);
        setAvatar(fullAvatarUrl);
        
        // Update user context with fresh profile data and full avatar URL
        if (componentMounted) {
          setUser(prev => {
            if (!prev) return prev;
            let updated = { ...prev };
            if (updated.user) {
              updated.user.username = profile.username;
              updated.user.email = profile.email;
              updated.user.avatar = fullAvatarUrl; // Use full URL
            } else {
              updated.username = profile.username;
              updated.email = profile.email;
              updated.avatar = fullAvatarUrl; // Use full URL
            }
            localStorage.setItem('notesapp_user', JSON.stringify(updated));
            return updated;
          });
        }
      } else {
        console.error('Failed to fetch profile:', result.error);
        // Don't show error for profile fetch failure, use cached data
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;


  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSizeInMB = 2; // Reduced from 5MB to 2MB
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(`Image file size must be less than ${maxSizeInMB}MB`);
      return;
    }

    // Check image dimensions (optional)
    const img = new Image();
    img.onload = async () => {
      const maxDimension = 1024;
      if (img.width > maxDimension || img.height > maxDimension) {
        setError(`Image dimensions should not exceed ${maxDimension}x${maxDimension} pixels`);
        return;
      }
      
      // Proceed with upload
      await uploadAvatar(file);
    };
    
    img.onerror = () => {
      setError('Invalid image file format');
    };
    
    img.src = URL.createObjectURL(file);
  };

  const uploadAvatar = async (file) => {
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('🔄 Starting avatar upload...');
      const result = await profileService.uploadAvatar(file);
      if (result.success) {
        // API returns: { success: true, data: { avatar: "/path/to/avatar.png" } }
        const newAvatarUrl = result.data.avatar;
        console.log('📸 Raw avatar URL from API:', newAvatarUrl);
        
        // Construct full URL for avatar display
        const fullAvatarUrl = newAvatarUrl.startsWith('http') 
          ? newAvatarUrl 
          : `https://backend-noteapp-new.salmonground-95e8af22.japaneast.azurecontainerapps.io${newAvatarUrl}`;
        
        console.log('📸 Full avatar URL constructed:', fullAvatarUrl);
        setAvatar(fullAvatarUrl);
        setAvatarFile(null);
        
        // Update user context with error boundary
        if (componentMounted) {
          try {
            setUser(prev => {
              if (!prev) return prev;
              let updated = { ...prev };
              if (updated.user) {
                updated.user.avatar = fullAvatarUrl;
              } else {
                updated.avatar = fullAvatarUrl;
              }
              localStorage.setItem('notesapp_user', JSON.stringify(updated));
              console.log('💾 Updated user in localStorage with avatar:', fullAvatarUrl);
              return updated;
            });
            // Force trigger context update
            window.dispatchEvent(new CustomEvent('auth:avatar-updated', {
              detail: { avatarUrl: fullAvatarUrl }
            }));
          } catch (updateError) {
            console.warn('Error updating user context:', updateError);
          }
        }
        // Always fetch latest profile from API after avatar upload
        await fetchProfile();
        console.log('✅ Avatar uploaded and profile refreshed');
      } else {
        console.error('Avatar upload failed:', result.error);
        console.error('Full result:', result);
        setError(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('An unexpected error occurred while uploading avatar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      // Since username and email are readonly, just close the modal
      // Avatar changes are handled immediately when uploaded/removed
      console.log('ℹ️ Profile modal closing - username and email are readonly');
      onClose();
    } catch (error) {
      console.error('❌ Unexpected error during profile save:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatar) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const result = await profileService.removeAvatar();
      if (result.success) {
        setAvatar(null);
        
        // Update user context
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
        
        console.log('✅ Avatar removed successfully');
      } else {
        setError(result.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      setError('An unexpected error occurred while removing avatar');
    } finally {
      setIsSaving(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-6 py-8" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-auto p-4 animate-scale-in relative flex flex-col space-y-3 my-auto">
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="text-center pt-1">
          <h2 className="text-lg font-bold text-gray-900">{t('profile', 'Profile')}</h2>
        </div>
        
        <form onSubmit={handleSaveProfile} className="space-y-3">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-3">
            {/* Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-2xl text-white font-bold overflow-hidden shadow-lg">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="object-cover w-full h-full" />
              ) : (
                (user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').toString().charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Avatar Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => fileInputRef.current.click()}
                title={t('changeAvatar', 'Change avatar')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{avatar ? t('changeAvatar', 'Change') : t('addAvatar', 'Add')}</span>
              </button>
              
              {avatar && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={handleRemoveAvatar}
                  title={t('removeAvatar', 'Remove avatar')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{t('removeAvatar', 'Remove')}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('username', 'Username')}</label>
              <input
                type="text"
                value={username}
                readOnly
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-800 bg-gray-50 cursor-not-allowed focus:outline-none transition-all duration-200"
                autoComplete="username"
                title={t('usernameReadonly', 'Username cannot be changed')}
              />
            </div>
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('email', 'Email')}</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-800 bg-gray-50 cursor-not-allowed focus:outline-none transition-all duration-200"
                autoComplete="email"
                title={t('emailReadonly', 'Email cannot be changed')}
              />
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? t('saving', 'Saving...') : t('saveProfile', 'Save Profile')}
            </button>
            
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200"
            >
              {t('logout', 'Logout')}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </form>
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
    </div>
  );
};

export default ProfileModal;
