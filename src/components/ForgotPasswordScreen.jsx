import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { forgotPasswordAPI } from '../services/notesService.js';

const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, sent, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    const result = await forgotPasswordAPI(email);
    if (result.success) {
      setStatus('sent');
      setMessage(t('sent'));
    } else {
      setStatus('error');
      setMessage(result.error || t('error'));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">{t('forgotPassword.title')}</h2>
        {status !== 'sent' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700"
              placeholder={t('forgotPassword.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? t('forgotPassword.sending') : t('forgotPassword.sendButton')}
            </button>
          </form>
        )}
        {message && <p className={status === 'error' ? 'text-red-400 mt-4' : 'text-green-400 mt-4'}>{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
