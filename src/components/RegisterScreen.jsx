import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      setIsLoading(false);
      return;
    }
    try {
      const result = await register(username, email, password);
      if (result.success) {
        setSuccess(t('registrationSuccessCheckEmail'));
        setTimeout(() => {
          navigate('/verify-code', { state: { username } });
        }, 100);
      } else {
        setError(result.error || t('registrationFailed'));
      }
    } catch (err) {
      setError(t('registrationFailed'));
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
      {/* Main Content */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t('registerButton')}
          </h2>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                {t('username.label')}
              </label>
              <input id="username" name="username" type="text" autoComplete="username" required className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('username.placeholder')} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                {t('email')}
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {t('password')}
              </label>
              <input id="password" name="password" type="password" autoComplete="new-password" required className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                {t('confirmPassword')}
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('confirmPassword')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {error && <div className="rounded-xl bg-red-900/50 border border-red-700 p-4"><h3 className="text-sm font-medium text-red-300">{error}</h3></div>}
            {success && <div className="rounded-xl bg-green-900/50 border border-green-700 p-4 mt-4"><h3 className="text-sm font-medium text-green-300">{success}</h3></div>}
            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? t('creatingAccount') : t('registerButton')}
            </button>
            <div className="text-center mt-4">
              <Link
                to="/login"
                className="inline-block text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 hover:bg-blue-900/20"
                tabIndex={0}
              >
                {t('loginButton')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
