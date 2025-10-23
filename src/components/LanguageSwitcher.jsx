import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        
        <button
          onClick={() => changeLanguage('en')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors duration-200 ${
            currentLanguage === 'en' 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={t('english')}
        >
          {/* US Flag SVG */}
          <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
            <rect width="16" height="12" fill="#B22234"/>
            <rect width="16" height="0.923" y="1.077" fill="white"/>
            <rect width="16" height="0.923" y="2.769" fill="white"/>
            <rect width="16" height="0.923" y="4.462" fill="white"/>
            <rect width="16" height="0.923" y="6.154" fill="white"/>
            <rect width="16" height="0.923" y="7.846" fill="white"/>
            <rect width="16" height="0.923" y="9.538" fill="white"/>
            <rect width="16" height="0.923" y="11.231" fill="white"/>
            <rect width="5.714" height="6.462" fill="#3C3B6E"/>
          </svg>
          <span>EN</span>
        </button>
        
        <button
          onClick={() => changeLanguage('ja')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors duration-200 ${
            currentLanguage === 'ja' 
              ? 'bg-white/20 text-white' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={t('japanese')}
        >
          {/* Japan Flag SVG */}
          <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
            <rect width="16" height="12" fill="white"/>
            <circle cx="8" cy="6" r="3.6" fill="#BC002D"/>
          </svg>
          <span>日本</span>
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;