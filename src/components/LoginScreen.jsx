import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const LoginScreen = () => {
  const { t } = useTranslation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  const demoLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Use the demo credentials: hello@gmail.com / hello7863
      const result = await login('hello@gmail.com', 'hello7863');
      if (!result.success) {
        setError(result.error || 'Demo login failed');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (isRegisterMode && password !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      setIsLoading(false);
      return;
    }
    try {
      const result = isRegisterMode 
        ? await register(email, password)
        : await login(email, password);
      if (!result.success) {
        setError(result.error || t(isRegisterMode ? 'registrationFailed' : 'loginFailed'));
      }
    } catch (err) {
      setError(t(isRegisterMode ? 'registrationFailed' : 'loginFailed'));
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
            {isRegisterMode ? t('joinApp') : t('signIn')}
          </p>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-700/50">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">{t('orContinueWith')}</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                {t('email')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-600 
                           placeholder-gray-500 text-white bg-gray-800/50 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           focus:z-10 transition-all duration-200"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
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
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-600 
                           placeholder-gray-500 text-white bg-gray-800/50 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                           focus:z-10 transition-all duration-200"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            {isRegisterMode && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-600 
                             placeholder-gray-500 text-white bg-gray-800/50 backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                             focus:z-10 transition-all duration-200"
                    placeholder={t('confirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            )}
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
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white 
                         bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900
                         disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 
                         shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isRegisterMode ? t('creatingAccount') : t('loggingIn')}
                  </div>
                ) : (
                  isRegisterMode ? t('registerButton') : t('loginButton')
                )}
              </button>
            </div>
          </form>
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200"
            >
              {isRegisterMode 
                ? t('switchToLogin') 
                : t('switchToRegister')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;