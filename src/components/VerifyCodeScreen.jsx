
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyCodeScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  // Get username and password from location.state or query param
  const params = new URLSearchParams(location.search);
  const username = location.state?.username || params.get('username') || '';
  const password = location.state?.password || '';
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    console.log('🔍 Username (should be the registered username, not email):', username);
    console.log('🔍 Code:', code);
    const payload = { username, code };
    console.log('🔍 Sending to /verify-code:', payload);
    try {
      const response = await fetch('https://notesapp.agreeableocean-d7058ab3.japanwest.azurecontainerapps.io/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.error('🔍 Could not parse JSON from backend:', jsonErr);
        result = { error: 'Invalid JSON response', raw: await response.text() };
      }
      console.log('🔍 Backend verify-code response:', result, '| Status:', response.status);
      if (response.ok && result.success) {
        setStatus('success');
        setMessage(t('verifyCode.success'));
        // Auto-login after successful verification
        setTimeout(async () => {
          if (username && password) {
            const loginResult = await login(username, password);
            console.log('🔍 Auto-login result:', loginResult);
            if (loginResult.success) {
              navigate('/notes');
            } else {
              navigate('/login', {
                state: {
                  username: username,
                  password: '',
                }
              });
            }
          } else {
            // If password is not available, redirect to login with username autofilled
            navigate('/login', {
              state: {
                username: username,
                password: '',
              }
            });
          }
        }, 1000);
      } else {
        setStatus('error');
        // Map known error messages to translation keys
        let errorMsg = result.error;
        if (errorMsg === 'Invalid code') {
          errorMsg = t('verifyCode.invalidCode');
        } else if (errorMsg === 'Code expired') {
          errorMsg = t('verifyCode.codeExpired');
        } else if (errorMsg === 'User not found') {
          errorMsg = t('verifyCode.userNotFound');
        } else if (errorMsg === 'Too many attempts') {
          errorMsg = t('verifyCode.tooManyAttempts');
        } else if (errorMsg) {
          errorMsg = t('verifyCode.errorGeneric', { error: errorMsg });
        } else {
          errorMsg = t('verifyCode.error');
        }
        setMessage(errorMsg);
      }
    } catch (err) {
      console.error('🔍 Verify code error:', err);
      setStatus('error');
      setMessage(t('verifyCode.error'));
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
      <div className="bg-gray-900/90 p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border border-gray-700/60 backdrop-blur-xl relative z-10">
        <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in drop-shadow-lg">
          {t('Verification')}
        </h2>
        <p className="text-gray-300 mb-8 animate-fade-in-slow text-lg">
          {t('verifyCode.instructions')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-slow">
          <div className="flex justify-center gap-3">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="w-14 h-16 text-3xl text-center rounded-xl border-2 border-purple-500 bg-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-200 outline-none shadow-lg font-mono tracking-widest"
                value={code[i] || ''}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length === 1) {
                    // Single char entry
                    const newCode = code.split('');
                    newCode[i] = val;
                    setCode(newCode.join('').slice(0, 6));
                    // Move to next input
                    const next = document.getElementById(`code-input-${i+1}`);
                    if (next) next.focus();
                  } else if (val.length > 1) {
                    // Paste case: distribute chars
                    const chars = val.split('');
                    const newCode = code.split('');
                    for (let j = 0; j < chars.length && i + j < 6; j++) {
                      newCode[i + j] = chars[j];
                    }
                    setCode(newCode.join('').slice(0, 6));
                    // Focus last filled
                    const next = document.getElementById(`code-input-${Math.min(i + chars.length, 5)}`);
                    if (next) next.focus();
                  }
                }}
                onPaste={e => {
                  const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
                  if (paste.length) {
                    e.preventDefault();
                    const newCode = code.split('');
                    for (let j = 0; j < paste.length && i + j < 6; j++) {
                      newCode[i + j] = paste[j];
                    }
                    setCode(newCode.join('').slice(0, 6));
                    // Focus last filled
                    const next = document.getElementById(`code-input-${Math.min(i + paste.length, 5)}`);
                    if (next) next.focus();
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Backspace') {
                    if (!code[i] && i > 0) {
                      // Move focus to previous
                      const prev = document.getElementById(`code-input-${i-1}`);
                      if (prev) prev.focus();
                      // Remove previous digit
                      const newCode = code.split('');
                      newCode[i-1] = '';
                      setCode(newCode.join('').slice(0, 6));
                      e.preventDefault();
                    } else {
                      // Clear current
                      const newCode = code.split('');
                      newCode[i] = '';
                      setCode(newCode.join('').slice(0, 6));
                    }
                  }
                }}
                id={`code-input-${i}`}
                autoFocus={i === 0}
                required={i === 0}
                style={{ letterSpacing: '0.2em' }}
              />
            ))}
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 text-white font-bold text-xl shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed tracking-wide"
            disabled={status === 'loading' || code.length !== 6}
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('verifying')}
              </span>
            ) : t('verify')}
          </button>
        </form>
        {message && (
          <p className={status === 'error' ? 'text-red-400 mt-8 text-lg' : 'text-green-400 mt-8 text-lg'}>{message}</p>
        )}
        {status === 'success' && <p className="mt-6 text-base animate-fade-in text-gray-200">{t('verifyCode.redirect')}</p>}
      </div>
    </div>
  );
};

export default VerifyCodeScreen;
