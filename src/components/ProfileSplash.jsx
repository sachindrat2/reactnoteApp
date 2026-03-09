import React from 'react';

const ProfileSplash = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
      <div className="w-28 h-28 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-4xl text-white font-bold shadow-lg mb-4 relative">
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-white" style={{letterSpacing: '-2px'}}>Avatar</span>
      </div>
      <div className="flex gap-4 mt-2">
        <button className="flex items-center gap-1.5 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Change
        </button>
        <button className="flex items-center gap-1.5 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-base font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
};

export default ProfileSplash;
