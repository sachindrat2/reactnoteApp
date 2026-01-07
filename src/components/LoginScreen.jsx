import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

import { useLocation } from 'react-router-dom';

const LoginScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const autofillUsername = location.state?.username || localStorage.getItem('notesapp_remembered_username') || '';
  const autofillPassword = location.state?.password || '';
  const [username, setUsername] = useState(autofillUsername);
  const [password, setPassword] = useState(autofillPassword);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('notesapp_remember_me') === 'true';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  // Demo login removed (not used)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('notesapp_remember_me', 'true');
        localStorage.setItem('notesapp_remembered_username', username);
      } else {
        localStorage.removeItem('notesapp_remember_me');
        localStorage.removeItem('notesapp_remembered_username');
      }
      const result = await login(username, password);
      if (!result.success) {
        if (result.error === 'userNotFound') {
          setError(t('userNotFound'));
        } else {
          setError(result.error || t('loginFailed'));
        }
      }
    } catch (err) {
      setError(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 w-full h-full bg-gray-950 flex flex-col justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-float-delayed opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-pink-400 rounded-full animate-float-slow opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-purple-300 rounded-full animate-float opacity-30"></div>
      </div>
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25 animate-glow-pulse">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t('appTitle')}
          </h2>
          <p className="text-gray-400 text-lg">
            {t('signIn')}
          </p>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-700/50">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
             
            </div>
            
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex items-center mb-2">
                          <input
                            id="rememberMe"
                            name="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-300 cursor-pointer select-none">
                            {t('rememberMe')}
                          </label>
                        </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                {t('username.label')}
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:z-10 transition-all duration-200"
                  placeholder={t('username.placeholder')}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:z-10 transition-all duration-200"
                  placeholder={t('password')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between mb-2">
              <Link
                to="/forgot-password"
                className="inline-block text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 hover:bg-purple-900/20"
                tabIndex={0}
              >
                {t('forgotPassword.link')}
              </Link>
              <Link
                to="/register"
                className="inline-block text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 hover:bg-blue-900/20 ml-2"
                tabIndex={0}
              >
                {t('switchToRegisterNew')}
              </Link>
            </div>
            {error && (
              <div className="rounded-xl bg-red-900/50 border border-red-700 p-4 backdrop-blur-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('loggingIn') : t('loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;