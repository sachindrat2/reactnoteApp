import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordAPI } from '../services/notesService.js';

const ResetPasswordScreen = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tkn = params.get('token');
    if (!tkn) {
      setStatus('error');
      setMessage(t('resetPassword.invalidLink'));
    } else {
      setToken(tkn);
    }
  }, [location, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage(t('resetPassword.noMatch'));
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMessage('');
    // Optionally pass name to API if supported
    const result = await resetPasswordAPI(token, password);
    if (result.success) {
      setStatus('success');
      setMessage(t('resetPassword.success'));
      setTimeout(() => navigate('/', { replace: true }), 3000);
    } else {
      setStatus('error');
      // Map known error messages to translation keys
      let errorMsg = result.error;
      if (errorMsg === 'Invalid token') {
        errorMsg = t('resetPassword.invalidToken');
      } else if (errorMsg === 'Token expired') {
        errorMsg = t('resetPassword.tokenExpired');
      } else if (errorMsg === 'User not found') {
        errorMsg = t('resetPassword.userNotFound');
      } else if (errorMsg === 'Passwords do not match') {
        errorMsg = t('resetPassword.passwordsMismatch');
      } else if (errorMsg === 'Password too weak') {
        errorMsg = t('resetPassword.passwordWeak');
      } else if (errorMsg) {
        errorMsg = t('resetPassword.errorGeneric', { error: errorMsg });
      } else {
        errorMsg = t('resetPassword.error');
      }
      setMessage(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-950 text-white relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 rounded-full opacity-30 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-400 rounded-full opacity-30 blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full opacity-20 blur-2xl animate-float" style={{ transform: 'translate(-50%, -50%)' }} />
      </div>
      <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border border-blue-200/60 backdrop-blur-xl relative z-10">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{t('resetPassword.title')}</h2>
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('resetPassword.newPasswordLabel')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-2 text-blue-500" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? t('resetPassword.hide') : t('resetPassword.show')}>
                  {showPassword ? (
                    // Material Design eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 19c-5.05 0-9.27-3.81-10-8.5a9.98 9.98 0 0 1 2.54-5.44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.96 0 1.84-.36 2.53-.95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.96 0-1.84.36-2.53.95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    // Material Design eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12C2.73 7.61 7.11 4.5 12 4.5s9.27 3.11 11 7.5c-1.73 4.39-6.11 7.5-11 7.5S2.73 16.39 1 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('resetPassword.confirmPasswordLabel')}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-2 text-blue-500" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? t('resetPassword.hide') : t('resetPassword.show')}>
                  {showConfirm ? (
                    // Material Design eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 19c-5.05 0-9.27-3.81-10-8.5a9.98 9.98 0 0 1 2.54-5.44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.96 0 1.84-.36 2.53-.95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.96 0-1.84.36-2.53.95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    // Material Design eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12C2.73 7.61 7.11 4.5 12 4.5s9.27 3.11 11 7.5c-1.73 4.39-6.11 7.5-11 7.5S2.73 16.39 1 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? t('resetPassword.saving') : t('resetPassword.resetButton')}
            </button>
          </form>
        )}
        {message && <p className={status === 'error' ? 'text-red-500 mt-4' : 'text-green-600 mt-4'}>{message}</p>}
        {status === 'success' && <p className="mt-4 text-sm text-blue-700">{t('resetPassword.redirect')}</p>}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
