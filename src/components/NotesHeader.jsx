import React, { useEffect, useState } from 'react';
import ProfileModal from './ProfileModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ConnectionStatus from './ConnectionStatus';
import LanguageSwitcher from './LanguageSwitcher';

const NotesHeader = ({ onAddNote, searchTerm, onSearchChange, notesCount, onLogoutClick }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const handleProfileClick = () => setShowProfileModal(true);
  const handleProfileClose = () => setShowProfileModal(false);

  // Collapsing header logic
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY) {
        setIsCollapsed(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 60) {
        setIsCollapsed(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <>
      <header
        className={`bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 animate-slide-in-left shadow-2xl transition-all duration-300 ${isCollapsed ? 'py-0' : 'py-0.5'}`}
        style={{ minHeight: isCollapsed ? '20px' : '36px' }}
      >
        <div className={`container mx-auto px-2 transition-all duration-300 ${isCollapsed ? 'py-0' : 'py-0.5'}`}>
          {/* Mobile-first responsive layout */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Top row: Logo, User Info, and Add Button */}
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center space-x-1.5">
                <div className={`transition-all duration-300 ${isCollapsed ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-float shadow-lg`}>
                  <svg className={`transition-all duration-300 ${isCollapsed ? 'w-2 h-2 sm:w-2.5 h-2.5' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className={`transition-all duration-300 font-bold text-white ${isCollapsed ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>{t('appTitle')}</h1>
                  {/* Notes count and user info removed as requested */}
                  {/* <ConnectionStatus /> -- hidden as requested */}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="lg:hidden flex items-center space-x-2">
                {/* Language Switcher - Mobile */}
                <LanguageSwitcher className="scale-75" />
                
                {/* User Profile - Mobile */}
                {user && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-8 h-8 rounded-full border-2 border-purple-500 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                      title={t('profile', 'Profile')}
                    >
                      <span className="text-white text-sm font-medium">
                        {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar - Full width on mobile */}
            <div className="flex-1 lg:max-w-2xl lg:mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-gray-600 rounded-xl 
                           bg-gray-800/50 text-white placeholder-gray-400 text-sm sm:text-base backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Language Switcher - Desktop */}
              <LanguageSwitcher />

              {/* User Profile - Desktop */}
              {user && (
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-600">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-200">{t('welcome')}</p>
                    <p className="text-xs text-gray-400">{user?.user?.name || user?.name || user?.user?.email || user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                    title={t('profile', 'Profile')}
                  >
                    <span className="text-white text-sm font-medium">
                      {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <ProfileModal isOpen={showProfileModal} onClose={handleProfileClose} />
    </>
  );
};

export default NotesHeader;