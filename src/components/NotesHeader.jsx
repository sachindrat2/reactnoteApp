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
        className={`bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 animate-slide-in-left shadow-2xl transition-all duration-300 ${isCollapsed ? 'py-1' : 'py-2'}`}
      >
        <div className={`container mx-auto px-3 sm:px-4 lg:px-6 transition-all duration-300`}>
          {/* Single row layout with proper flex distribution */}
          <div className="flex items-center justify-between space-x-2 sm:space-x-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <div className={`transition-all duration-300 ${isCollapsed ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-float shadow-lg`}>
                <svg className={`transition-all duration-300 ${isCollapsed ? 'w-2 h-2 sm:w-2.5 h-2.5' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className={`transition-all duration-300 font-bold text-white ${isCollapsed ? 'text-xs sm:text-sm lg:text-base' : 'text-sm sm:text-base lg:text-lg'}`}>{t('appTitle')}</h1>
                {/* Notes count and user info removed as requested */}
                {/* <ConnectionStatus /> -- hidden as requested */}
              </div>
            </div>

            {/* Search Bar - Flexible width in center */}
            <div className="flex-1 min-w-0 max-w-2xl mx-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="block w-full pl-7 sm:pl-8 lg:pl-10 pr-7 sm:pr-8 lg:pr-10 py-1.5 sm:py-2 border border-gray-600 rounded-lg sm:rounded-xl 
                           bg-gray-800/50 text-white placeholder-gray-400 text-xs sm:text-sm lg:text-base backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              {/* Language Switcher */}
              <LanguageSwitcher className="scale-75 sm:scale-100" />
              
              {/* User Profile */}
              {user && (
                <button
                  onClick={handleProfileClick}
                  className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full border border-purple-400 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                  title={t('profile', 'Profile')}
                >
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').toString().charAt(0).toUpperCase()}
                  </span>
                </button>
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