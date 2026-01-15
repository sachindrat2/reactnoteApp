import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ConnectionStatus from './ConnectionStatus';
import LanguageSwitcher from './LanguageSwitcher';

const NotesHeader = ({ onAddNote, searchTerm, onSearchChange, notesCount }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };
  const handleLogoutCancel = () => setShowLogoutModal(false);

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
    <header
      className={`bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 animate-slide-in-left shadow-2xl transition-all duration-300 ${isCollapsed ? 'py-1' : 'py-4'}`}
      style={{ minHeight: isCollapsed ? '48px' : '88px' }}
    >
      <div className={`container mx-auto px-4 transition-all duration-300 ${isCollapsed ? 'py-1' : 'py-4'}`}>
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Top row: Logo, User Info, and Add Button */}
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className={`transition-all duration-300 ${isCollapsed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-float shadow-lg`}>
                <svg className={`transition-all duration-300 ${isCollapsed ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-6 sm:h-6'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className={`transition-all duration-300 font-bold text-white ${isCollapsed ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>{t('appTitle')}</h1>
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
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="px-3 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white rounded-full shadow-lg hover:scale-105 hover:from-red-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 border-2 border-white/10"
                    title={t('logout')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline font-semibold">{t('logout')}</span>
                  </button>
                </div>
              )}

              {/* Add Note Button - Mobile */}
              <button
                onClick={onAddNote}
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 
                         text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-700 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
                         transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">{t('addNote')}</span>
              </button>
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
            {/* Add Note Button */}
            <button
              onClick={onAddNote}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 
                       text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-700 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
                       transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
{t('addNote')}
            </button>

            {/* Language Switcher - Desktop */}
            <LanguageSwitcher />

            {/* User Profile - Desktop */}
            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-600">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-200">{t('welcome')}</p>
                  <p className="text-xs text-gray-400">{user?.user?.name || user?.name || user?.user?.email || user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform duration-200">
                  <span className="text-white text-sm font-medium">
                    {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="px-3 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white rounded-full shadow-lg hover:scale-105 hover:from-red-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 border-2 border-white/10"
                  title={t('logout')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline font-semibold">{t('logout')}</span>
                </button>
                {/* Logout Confirmation Modal */}
                {showLogoutModal && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-xs sm:max-w-sm flex flex-col items-center border-2 border-red-400/30 relative mx-4">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-2 text-center">{t('logoutConfirmTitle', 'Are you sure you want to logout?')}</h2>
                      <p className="text-gray-500 text-center mb-6">{t('logoutConfirmDesc', 'You will be signed out of your account.')}</p>
                      <div className="flex gap-4 w-full justify-center">
                        <button
                          onClick={handleLogoutConfirm}
                          className="px-5 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          {t('yes', 'Yes')}
                        </button>
                        <button
                          onClick={handleLogoutCancel}
                          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-300 transition-all duration-200"
                        >
                          {t('no', 'No')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NotesHeader;