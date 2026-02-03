import { useState, useMemo } from 'react';
import { KeyRound, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { updatePassword } from '../lib/supabase';
import { Logo, LoadingSpinner } from '../components/ui';
import { calculatePasswordStrength } from '../utils/helpers';

function ResetPasswordPage({ onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(newPassword);
      if (result?.user) {
        setSuccess(true);
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => onComplete?.(), 2000);
      } else {
        setError('Échec de la mise à jour. Veuillez réessayer.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || 'Erreur lors de la mise à jour. Veuillez redemander un lien.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe mis à jour !</h2>
          <p className="text-gray-500 mb-4">Connexion en cours...</p>
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">GSET PLANS</h1>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Créer votre mot de passe</h2>
                <p className="text-sm text-gray-500">Choisissez un mot de passe sécurisé</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border bg-gray-50 border-gray-200 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="••••••••"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      strength.score <= 2 ? 'text-red-500' :
                      strength.score <= 3 ? 'text-yellow-500' : 'text-emerald-500'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 focus:bg-white outline-none transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300'
                      : confirmPassword && confirmPassword === newPassword
                        ? 'border-emerald-300'
                        : 'border-gray-200 focus:border-emerald-500'
                  }`}
                  placeholder="••••••••"
                  required
                />
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mots de passe identiques
                  </p>
                )}
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <><LoadingSpinner size="sm" /> Mise à jour...</> : 'Créer mon mot de passe'}
              </button>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Utilisez au moins 6 caractères avec des lettres et des chiffres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
