import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotesHeader = ({ onAddNote, searchTerm, onSearchChange, notesCount }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 animate-slide-in-left shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          
          {/* Top row: Logo, User Info, and Add Button */}
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-float shadow-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">NotesApp</h1>
                <p className="text-xs sm:text-sm text-gray-300">
                  {notesCount} notes for {user?.user?.name || user?.name || user?.user?.email || user?.email || 'User'}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* User Profile - Mobile */}
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    title="Logout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
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
                <span className="hidden sm:inline">New Note</span>
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
                placeholder="Search notes..."
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
              New Note
            </button>

            {/* User Profile - Desktop */}
            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-600">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-200">Welcome back!</p>
                  <p className="text-xs text-gray-400">{user?.user?.name || user?.name || user?.user?.email || user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-sm bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform duration-200">
                  <span className="text-white text-sm font-medium">
                    {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NotesHeader;