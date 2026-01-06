import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmailAPI } from '../services/notesService.js';

const VerifyEmailScreen = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmail.invalidLink'));
      return;
    }
    verifyEmailAPI(token).then(result => {
      if (result.success) {
        setStatus('success');
        setMessage(t('verifyEmail.success'));
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(result.error || t('verifyEmail.error'));
      }
    });
  }, [location, t, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">{t('verifyEmail.title')}</h2>
        <p className={status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-gray-300'}>
          {message}
        </p>
        {status === 'success' && <p className="mt-4 text-sm">{t('verifyEmail.redirect')}</p>}
      </div>
    </div>
  );
};

export default VerifyEmailScreen;
