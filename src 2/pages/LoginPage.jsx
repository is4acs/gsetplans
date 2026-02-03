import { useState } from 'react';
import { KeyRound, Sun, Moon, Mail, Eye, EyeOff } from 'lucide-react';
import { signIn, resetPassword } from '../lib/supabase';
import { Logo, LoadingSpinner } from '../components/ui';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (resetSent) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
        <div className={`w-full max-w-md ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl shadow-2xl p-8 text-center`}>
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email envoyé !</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
          </p>
          <button
            onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
      <div className={`w-full max-w-md ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden`}>
        <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Logo size="md" className="bg-white/20 backdrop-blur" />
              <div>
                <h1 className="text-2xl font-bold text-white">GSET PLANS</h1>
                <p className="text-emerald-100 text-sm">FTTH D3 Guyane</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
        <div className="p-8">
          {showForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Mot de passe oublié
                </h2>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className={`flex-1 py-3 rounded-xl border ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'} font-medium`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  Réinitialiser
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Mot de passe oublié ?
              </button>
              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                Connexion
              </button>
            </form>
          )}
          <div className={`mt-6 p-4 rounded-xl text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <p className="font-medium mb-1">Première connexion ?</p>
            <p>Cliquez sur "Mot de passe oublié" pour définir votre mot de passe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
