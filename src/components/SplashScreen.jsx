import React from 'react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black z-50">
      <div className="flex flex-col items-center">
        <img src="/app-icon.svg" alt="Notes App Logo" className="w-24 h-24 mb-6 animate-bounce" />
        <h1 className="text-3xl font-bold text-white mb-2">Notes App</h1>
        <p className="text-lg text-purple-300">Organize your thoughts, instantly.</p>
      </div>
    </div>
  );
};

export default SplashScreen;
