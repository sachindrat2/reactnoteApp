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
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 animate-slide-in-left">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          
          {/* Top row: Logo, User Info, and Add Button */}
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-float">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">NotesApp</h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {notesCount} notes for {user?.user?.name || user?.name || user?.user?.email || user?.email || 'User'}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* User Profile - Mobile */}
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user?.user?.name || user?.name || user?.user?.email || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 
                         text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
                className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-slate-200 rounded-xl 
                         bg-slate-50/50 text-slate-900 placeholder-slate-500 text-sm sm:text-base
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
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
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 
                       text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Note
            </button>

            {/* User Profile - Desktop */}
            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">Welcome back!</p>
                  <p className="text-xs text-slate-500">{user.name}</p>
                </div>
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"
                />
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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