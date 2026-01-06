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
    const result = await resetPasswordAPI(token, password);
    if (result.success) {
      setStatus('success');
      setMessage(t('resetPassword.success'));
      setTimeout(() => navigate('/'), 3000);
    } else {
      setStatus('error');
      setMessage(result.error || t('resetPassword.error'));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">{t('resetPassword.title')}</h2>
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700"
              placeholder={t('resetPassword.newPassword')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700"
              placeholder={t('resetPassword.confirmPassword')}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? t('resetPassword.saving') : t('resetPassword.saveButton')}
            </button>
          </form>
        )}
        {message && <p className={status === 'error' ? 'text-red-400 mt-4' : 'text-green-400 mt-4'}>{message}</p>}
        {status === 'success' && <p className="mt-4 text-sm">{t('resetPassword.redirect')}</p>}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
