import { useState, useEffect, useMemo, createContext, useContext, useCallback, useRef } from 'react';
import { 
  Upload, LayoutDashboard, LogOut, Menu, X, Settings, Sun, Moon,
  TrendingUp, Euro, Calendar, BarChart3, PieChart, User, Plus, Trash2, 
  Save, ChevronDown, Filter, Check, Zap, Mail, Lock, Users,
  KeyRound, AlertCircle, Eye, EyeOff, Loader2, RefreshCw, Trophy,
  Target, Award, TrendingDown, Activity, Crown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  supabase, signIn, signOut, resetPassword, updatePassword, getCurrentUser,
  getSession, onAuthStateChange, getProfile, getAllProfiles, updateProfile,
  getOrangePrices, updateOrangePrice, getCanalPrices, updateCanalPrice,
  getOrangeInterventions, insertOrangeInterventions, deleteOrangeInterventionsByPeriode,
  getCanalInterventions, insertCanalInterventions, deleteCanalInterventionsByPeriode,
  getImports, createImport, deleteImport, getAvailablePeriods, getAvailableTechNames
} from './lib/supabase';

// === CONTEXTS ===
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);
const AmountVisibilityContext = createContext();
const useAmountVisibility = () => useContext(AmountVisibilityContext);

// === CONSTANTS ===
const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];
const CHART_COLORS = ['#10b981', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b', '#ec4899', '#06b6d4'];

// === THEME STYLES ===
const themes = {
  light: {
    bg: 'bg-gray-50', bgSecondary: 'bg-white', bgTertiary: 'bg-gray-100',
    bgHover: 'hover:bg-gray-50', text: 'text-gray-900', textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400', border: 'border-gray-200', borderLight: 'border-gray-100',
    input: 'bg-white border-gray-200 focus:border-emerald-500',
    card: 'bg-white border-gray-100 shadow-sm', cardHover: 'hover:shadow-md',
    accentLight: 'bg-emerald-50 text-emerald-700',
    sidebar: 'bg-gray-900', sidebarText: 'text-gray-300', sidebarHover: 'hover:bg-gray-800',
    sidebarActive: 'bg-emerald-500/20 text-emerald-400',
  },
  dark: {
    bg: 'bg-gray-950', bgSecondary: 'bg-gray-900', bgTertiary: 'bg-gray-800',
    bgHover: 'hover:bg-gray-800', text: 'text-gray-100', textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500', border: 'border-gray-800', borderLight: 'border-gray-800/50',
    input: 'bg-gray-800 border-gray-700 focus:border-emerald-500',
    card: 'bg-gray-900 border-gray-800 shadow-lg', cardHover: 'hover:border-gray-700',
    accentLight: 'bg-emerald-500/10 text-emerald-400',
    sidebar: 'bg-black', sidebarText: 'text-gray-400', sidebarHover: 'hover:bg-gray-900',
    sidebarActive: 'bg-emerald-500/20 text-emerald-400',
  }
};

// === HELPERS ===
function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function getWeekNumber(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// === VISIBILITY TOGGLE ===
function VisibilityToggle() {
  const { showAmounts, toggleAmounts } = useAmountVisibility();
  const { theme } = useTheme();
  const t = themes[theme];
  return (
    <button onClick={toggleAmounts} className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover} transition-all`}
      title={showAmounts ? 'Masquer les montants' : 'Afficher les montants'}>
      {showAmounts ? <Eye className={`w-5 h-5 ${t.textSecondary}`} /> : <EyeOff className={`w-5 h-5 ${t.textSecondary}`} />}
    </button>
  );
}

// === LOADING SPINNER ===
function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={`${sizes[size]} animate-spin text-emerald-500`} />;
}

// === RESET PASSWORD PAGE (Modern style like Google/Apple) ===
function ResetPasswordPage({ onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Moyen', color: 'bg-yellow-500' };
    return { score, label: 'Fort', color: 'bg-emerald-500' };
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    
    // Timeout de sécurité pour éviter le chargement infini
    const timeout = setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => onComplete?.(), 1500);
    }, 5000);
    
    try {
      await updatePassword(newPassword);
      clearTimeout(timeout);
      setSuccess(true);
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => onComplete?.(), 1500);
    } catch (err) { 
      clearTimeout(timeout);
      setError(err.message || 'Erreur lors de la mise à jour'); 
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
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border bg-gray-50 border-gray-200 focus:border-emerald-500 focus:bg-white outline-none transition-all" placeholder="••••••••" required autoFocus />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score <= 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>{strength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 focus:bg-white outline-none transition-all ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : confirmPassword && confirmPassword === newPassword ? 'border-emerald-300' : 'border-gray-200 focus:border-emerald-500'}`} placeholder="••••••••" required />
                {confirmPassword && confirmPassword === newPassword && <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Mots de passe identiques</p>}
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /><p className="text-red-600 text-sm">{error}</p></div>}
              <button type="submit" disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {loading ? <><LoadingSpinner size="sm" /> Mise à jour...</> : 'Créer mon mot de passe'}
              </button>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">Utilisez au moins 6 caractères avec des lettres et des chiffres.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// === LOGIN PAGE ===
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
    e.preventDefault(); setLoading(true); setError('');
    try { await signIn(email, password); } 
    catch (err) { setError(err.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : err.message); } 
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await resetPassword(email); setResetSent(true); } 
    catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  if (resetSent) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
        <div className={`w-full max-w-md ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl shadow-2xl p-8 text-center`}>
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-emerald-600" /></div>
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email envoyé !</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vérifiez votre boîte mail pour réinitialiser votre mot de passe.</p>
          <button onClick={() => { setShowForgotPassword(false); setResetSent(false); }} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600">Retour à la connexion</button>
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
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-2xl font-bold text-white">GSET PLANS</h1><p className="text-emerald-100 text-sm">FTTH D3 Guyane</p></div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
        <div className="p-8">
          {showForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="flex items-center gap-3 mb-4"><KeyRound className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mot de passe oublié</h2></div>
              <div><label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`} placeholder="votre@email.com" required /></div>
              {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForgotPassword(false)} className={`flex-1 py-3 rounded-xl border ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'} font-medium`}>Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <LoadingSpinner size="sm" />} Réinitialiser</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div><label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`} placeholder="votre@email.com" required /></div>
              <div><label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mot de passe</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div></div>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Mot de passe oublié ?</button>
              {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <LoadingSpinner size="sm" />} Connexion</button>
            </form>
          )}
          <div className={`mt-6 p-4 rounded-xl text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <p className="font-medium mb-1">Première connexion ?</p><p>Cliquez sur "Mot de passe oublié" pour définir votre mot de passe.</p></div>
        </div>
      </div>
    </div>
  );
}

// === STAT CARD ===
function StatCard({ icon: Icon, label, value, sub, color, hideable = true }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const colors = {
    emerald: { bg: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50', text: 'text-emerald-500' },
    orange: { bg: theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50', text: 'text-orange-500' },
    purple: { bg: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50', text: 'text-purple-500' },
    blue: { bg: theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50', text: 'text-blue-500' },
    teal: { bg: theme === 'dark' ? 'bg-teal-500/10' : 'bg-teal-50', text: 'text-teal-500' },
  };
  const c = colors[color] || colors.emerald;
  const displayValue = hideable && !showAmounts && typeof value === 'string' && value.includes('€') ? '••••••€' : value;
  return (
    <div className={`rounded-2xl p-5 border ${t.card}`}>
      <div className="flex items-start justify-between mb-3"><div className={`p-2.5 rounded-xl ${c.bg}`}><Icon className={`w-5 h-5 ${c.text}`} /></div></div>
      <p className={`text-sm ${t.textSecondary} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${t.text}`}>{displayValue}</p>
      {sub && <p className={`text-xs ${t.textMuted} mt-1`}>{sub}</p>}
    </div>
  );
}

// === PERIOD SELECTOR ===
function PeriodSelector({ periods, selectedYear, selectedMonth, selectedWeek, viewMode, onChange }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const availableMonths = useMemo(() => selectedYear ? (periods.monthsByYear?.[selectedYear] || []) : [], [periods, selectedYear]);
  const availableWeeks = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    return periods.weeksByYearMonth?.[`${selectedYear}_${selectedMonth}`] || [];
  }, [periods, selectedYear, selectedMonth]);
  const selectClass = `px-3 py-2 rounded-lg text-sm outline-none transition-all ${t.input} border`;
  return (
    <div className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl border ${t.card}`}>
      <div className="flex items-center gap-2"><div className={`p-2 rounded-lg ${t.accentLight}`}><Filter className="w-4 h-4" /></div>
        <span className={`text-sm font-medium ${t.text}`}>Filtrer</span></div>
      <select value={selectedYear || ''} onChange={(e) => onChange({ year: e.target.value ? parseInt(e.target.value) : null, month: null, week: null })} className={selectClass}>
        <option value="">Toutes années</option>{(periods.years || []).map(y => <option key={y} value={y}>{y}</option>)}</select>
      <select value={selectedMonth || ''} onChange={(e) => onChange({ year: selectedYear, month: e.target.value ? parseInt(e.target.value) : null, week: null })}
        disabled={!selectedYear} className={`${selectClass} disabled:opacity-50`}>
        <option value="">Tous mois</option>{MONTHS.filter(m => availableMonths.includes(m.value)).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
      {viewMode === 'hebdo' && (
        <select value={selectedWeek || ''} onChange={(e) => onChange({ year: selectedYear, month: selectedMonth, week: e.target.value ? parseInt(e.target.value) : null })}
          disabled={!selectedMonth} className={`${selectClass} disabled:opacity-50`}>
          <option value="">Toutes semaines</option>{availableWeeks.map(w => <option key={w} value={w}>S{w}</option>)}</select>
      )}
      <div className={`flex items-center gap-1 p-1 rounded-lg ${t.bgTertiary}`}>
        <button onClick={() => onChange({ year: selectedYear, month: selectedMonth, week: null, viewMode: 'mensuel' })}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'mensuel' ? `${t.bgSecondary} shadow-sm ${t.text} font-medium` : t.textSecondary}`}>Mois</button>
        <button onClick={() => onChange({ year: selectedYear, month: selectedMonth, week: selectedWeek, viewMode: 'hebdo' })}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'hebdo' ? `${t.bgSecondary} shadow-sm ${t.text} font-medium` : t.textSecondary}`}>Semaine</button>
      </div>
      {(selectedYear || selectedMonth) && (<button onClick={() => onChange({ year: null, month: null, week: null })} className={`px-3 py-1.5 text-sm ${t.textMuted}`}>Réinitialiser</button>)}
    </div>
  );
}

// === INTERVENTIONS TABLE ===
function InterventionsTable({ interventions, title, showTech = true, orangePrices }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const [showAll, setShowAll] = useState(false);
  const limit = 20;
  const displayed = showAll ? interventions : interventions.slice(0, limit);
  const getTechPrice = (inter) => {
    if (inter.source === 'canal') return inter.montant_tech || 0;
    const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
    if (match && orangePrices) { const price = orangePrices.find(p => p.code === match[1].toUpperCase()); if (price) return price.tech_price; }
    return inter.montant_st * 0.55;
  };
  const formatAmount = (amount) => !showAmounts ? '••••€' : `${amount?.toFixed(2) || 0}€`;
  return (
    <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
      <div className={`p-4 border-b ${t.border} flex justify-between items-center`}>
        <div><h3 className={`font-semibold ${t.text}`}>{title}</h3><p className={`text-sm ${t.textMuted}`}>{interventions.length} interventions</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={t.bgTertiary}><tr>
            <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Date</th>
            <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Source</th>
            {showTech && <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Technicien</th>}
            <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Réf</th>
            <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Type</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>ST</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Tech</th>
          </tr></thead>
          <tbody className={`divide-y ${t.borderLight}`}>
            {displayed.map((inter, i) => (
              <tr key={i} className={`${t.bgHover} transition-colors`}>
                <td className={`px-4 py-3 ${t.textSecondary} font-mono text-xs`}>{formatDate(inter.intervention_date)}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs rounded-full font-medium ${inter.source === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'}`}>{inter.source === 'orange' ? 'Orange' : 'Canal+'}</span></td>
                {showTech && <td className={`px-4 py-3 ${t.text}`}>{inter.tech || inter.tech_name || '-'}</td>}
                <td className={`px-4 py-3 font-mono ${t.textSecondary}`}>{inter.nd || inter.ref_pxo || '-'}</td>
                <td className={`px-4 py-3 ${t.text}`}>{inter.articles || inter.facturation || '-'}</td>
                <td className={`px-4 py-3 text-right font-medium ${inter.source === 'orange' ? 'text-orange-500' : 'text-purple-500'}`}>{formatAmount(inter.source === 'orange' ? inter.montant_st : inter.montant_gset)}</td>
                <td className={`px-4 py-3 text-right font-medium text-blue-500`}>{formatAmount(getTechPrice(inter))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {interventions.length > limit && (
        <div className={`p-3 border-t ${t.border} text-center`}>
          <button onClick={() => setShowAll(!showAll)} className={`text-sm ${t.textSecondary} hover:text-emerald-500`}>{showAll ? 'Voir moins' : `Voir les ${interventions.length - limit} autres`}</button>
        </div>
      )}
    </div>
  );
}

// === TECH RANKING CHART ===
function TechRankingChart({ orangeInterventions, canalInterventions, orangePrices }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const rankingData = useMemo(() => {
    const techStats = {};
    orangeInterventions.forEach(inter => {
      const tech = inter.tech || 'Inconnu';
      if (!techStats[tech]) techStats[tech] = { name: tech, totalGset: 0, count: 0 };
      const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
      const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
      techStats[tech].totalGset += price?.gset_price || inter.montant_st || 0;
      techStats[tech].count++;
    });
    canalInterventions.forEach(inter => {
      const tech = inter.tech || inter.tech_name || 'Inconnu';
      if (!techStats[tech]) techStats[tech] = { name: tech, totalGset: 0, count: 0 };
      techStats[tech].totalGset += inter.montant_gset || 0;
      techStats[tech].count++;
    });
    return Object.values(techStats).sort((a, b) => b.totalGset - a.totalGset).slice(0, 10).map((tech, i) => ({ ...tech, rank: i + 1 }));
  }, [orangeInterventions, canalInterventions, orangePrices]);

  return (
    <div className={`rounded-2xl border ${t.card} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}><Trophy className="w-5 h-5 text-yellow-500" /></div>
        <div><h3 className={`font-semibold ${t.text}`}>Classement Techniciens</h3><p className={`text-sm ${t.textMuted}`}>Par CA généré</p></div>
      </div>
      <div className="space-y-3">
        {rankingData.map((tech) => (
          <div key={tech.name} className={`flex items-center gap-4 p-3 rounded-xl ${t.bgTertiary}`}>
            <div className="w-8 flex justify-center">
              {tech.rank <= 3 ? <Crown className={`w-5 h-5 ${tech.rank === 1 ? 'text-yellow-500' : tech.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} /> : <span className={`text-sm font-bold ${t.textMuted}`}>#{tech.rank}</span>}
            </div>
            <div className="flex-1 min-w-0"><p className={`font-medium ${t.text} truncate`}>{tech.name}</p><p className={`text-xs ${t.textMuted}`}>{tech.count} interv.</p></div>
            <div className="text-right"><p className={`font-bold ${t.text}`}>{showAmounts ? `${tech.totalGset.toLocaleString('fr-FR')}€` : '••••€'}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === INTERVENTION TYPE CHART ===
function InterventionTypeChart({ orangeInterventions, canalInterventions, orangePrices, isDirection }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const typeData = useMemo(() => {
    const types = {};
    orangeInterventions.forEach(inter => {
      const match = String(inter.articles || '').match(/([A-Z]+)/i);
      const code = match ? match[1].toUpperCase() : 'AUTRE';
      if (!types[code]) types[code] = { name: code, count: 0, totalGset: 0 };
      types[code].count++;
      const price = orangePrices.find(p => p.code.startsWith(code));
      types[code].totalGset += price?.gset_price || inter.montant_st || 0;
    });
    canalInterventions.forEach(inter => {
      const code = inter.facturation || 'AUTRE';
      if (!types[code]) types[code] = { name: code, count: 0, totalGset: 0 };
      types[code].count++;
      types[code].totalGset += inter.montant_gset || 0;
    });
    return Object.values(types).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [orangeInterventions, canalInterventions, orangePrices]);
  const chartData = typeData.map((type, i) => ({ ...type, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <div className={`rounded-2xl border ${t.card} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}><PieChart className="w-5 h-5 text-purple-500" /></div>
        <div><h3 className={`font-semibold ${t.text}`}>Types d'interventions</h3><p className={`text-sm ${t.textMuted}`}>Répartition</p></div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count">
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
          </Pie><Tooltip content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (<div className={`${t.bgSecondary} border ${t.border} rounded-lg p-3 shadow-lg`}>
                <p className={`font-medium ${t.text}`}>{data.name}</p>
                <p className={`text-sm ${t.textSecondary}`}>{data.count} interventions</p>
                {isDirection && showAmounts && <p className="text-sm text-emerald-500">{data.totalGset.toLocaleString('fr-FR')}€</p>}
              </div>);
            } return null;
          }} /></RePieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.slice(0, 6).map((type) => (
          <div key={type.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.fill }} />
            <span className={`text-xs ${t.textSecondary} truncate`}>{type.name}</span>
            <span className={`text-xs font-medium ${t.text}`}>{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// === REVENUE TREND CHART ===
function RevenueTrendChart({ orangeInterventions, canalInterventions, orangePrices, isDirection }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const trendData = useMemo(() => {
    const monthlyData = {};
    orangeInterventions.forEach(inter => {
      const key = `${inter.year}-${String(inter.month).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { month: key, orange: 0, canal: 0, orangeTech: 0, canalTech: 0 };
      const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
      const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
      monthlyData[key].orange += price?.gset_price || inter.montant_st || 0;
      monthlyData[key].orangeTech += price?.tech_price || inter.montant_st * 0.55;
    });
    canalInterventions.forEach(inter => {
      const key = `${inter.year}-${String(inter.month).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { month: key, orange: 0, canal: 0, orangeTech: 0, canalTech: 0 };
      monthlyData[key].canal += inter.montant_gset || 0;
      monthlyData[key].canalTech += inter.montant_tech || 0;
    });
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
      .map(d => ({ ...d, label: MONTHS.find(m => m.value === parseInt(d.month.split('-')[1]))?.label?.slice(0, 3) || d.month }));
  }, [orangeInterventions, canalInterventions, orangePrices]);

  return (
    <div className={`rounded-2xl border ${t.card} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}><TrendingUp className="w-5 h-5 text-blue-500" /></div>
        <div><h3 className={`font-semibold ${t.text}`}>Évolution {isDirection ? 'CA' : 'Revenus'}</h3><p className={`text-sm ${t.textMuted}`}>6 derniers mois</p></div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorCanal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
            <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(value) => showAmounts ? `${(value/1000).toFixed(0)}k` : '•••'} />
            <Tooltip content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (<div className={`${t.bgSecondary} border ${t.border} rounded-lg p-3 shadow-lg`}>
                  <p className={`font-medium ${t.text} mb-2`}>{label}</p>
                  {payload.map((p, i) => <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {showAmounts ? `${p.value.toLocaleString('fr-FR')}€` : '••••€'}</p>)}
                </div>);
              } return null;
            }} />
            <Area type="monotone" dataKey={isDirection ? "orange" : "orangeTech"} name="Orange" stroke="#f97316" fillOpacity={1} fill="url(#colorOrange)" />
            <Area type="monotone" dataKey={isDirection ? "canal" : "canalTech"} name="Canal+" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCanal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// === TECH DASHBOARD STATS ===
function TechDashboardStats({ filteredOrange, filteredCanal, orangePrices, profile }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const stats = useMemo(() => {
    let totalTech = 0;
    filteredOrange.forEach(inter => {
      const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
      const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
      totalTech += price?.tech_price || inter.montant_st * 0.55;
    });
    filteredCanal.forEach(inter => { totalTech += inter.montant_tech || 0; });
    const aliases = profile?.aliases || [];
    const byAlias = {};
    if (aliases.length > 1) {
      aliases.forEach(alias => { byAlias[alias] = { orange: 0, canal: 0, total: 0 }; });
      filteredOrange.forEach(inter => {
        const tech = inter.tech?.toLowerCase();
        const alias = aliases.find(a => tech?.includes(a.toLowerCase()));
        if (alias && byAlias[alias]) {
          const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
          const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
          byAlias[alias].orange++;
          byAlias[alias].total += price?.tech_price || inter.montant_st * 0.55;
        }
      });
      filteredCanal.forEach(inter => {
        const tech = (inter.tech || inter.tech_name)?.toLowerCase();
        const alias = aliases.find(a => tech?.includes(a.toLowerCase()));
        if (alias && byAlias[alias]) { byAlias[alias].canal++; byAlias[alias].total += inter.montant_tech || 0; }
      });
    }
    return { totalTech, totalCount: filteredOrange.length + filteredCanal.length, orangeCount: filteredOrange.length, canalCount: filteredCanal.length, byAlias };
  }, [filteredOrange, filteredCanal, orangePrices, profile]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Euro} label="Total à percevoir" value={`${stats.totalTech.toLocaleString('fr-FR')}€`} color="emerald" />
        <StatCard icon={Activity} label="Interventions" value={stats.totalCount} sub={`${stats.orangeCount} Orange • ${stats.canalCount} Canal+`} color="blue" hideable={false} />
        <StatCard icon={TrendingUp} label="Orange" value={`${stats.orangeCount}`} color="orange" hideable={false} />
        <StatCard icon={PieChart} label="Canal+" value={`${stats.canalCount}`} color="purple" hideable={false} />
      </div>
      {Object.keys(stats.byAlias).length > 1 && (
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}><Users className="w-5 h-5 text-purple-500" /></div>
            <div><h3 className={`font-semibold ${t.text}`}>Détail par technicien</h3><p className={`text-sm ${t.textMuted}`}>{Object.keys(stats.byAlias).length} techniciens</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.byAlias).map(([alias, data]) => (
              <div key={alias} className={`p-4 rounded-xl ${t.bgTertiary}`}>
                <p className={`font-medium ${t.text} mb-2`}>{alias}</p>
                <div className="flex justify-between"><span className={`text-sm ${t.textMuted}`}>Orange</span><span className="text-sm font-medium text-orange-500">{data.orange}</span></div>
                <div className="flex justify-between"><span className={`text-sm ${t.textMuted}`}>Canal+</span><span className="text-sm font-medium text-purple-500">{data.canal}</span></div>
                <div className={`flex justify-between pt-2 border-t ${t.borderLight} mt-2`}><span className={`text-sm font-medium ${t.text}`}>Total</span>
                  <span className="text-sm font-bold text-emerald-500">{showAmounts ? `${data.total.toLocaleString('fr-FR')}€` : '••••€'}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === FILE IMPORT SECTION ===
function FileImportSection({ orangePrices, canalPrices, onImportComplete }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [selectedFile, setSelectedFile] = useState(null);
  const [importType, setImportType] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file); setError('');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Pour Orange RCC: chercher la feuille "Détails" ou celle avec les bonnes colonnes
      let sheetName = workbook.SheetNames[0];
      let sheet = workbook.Sheets[sheetName];
      
      // Si plusieurs feuilles, chercher "Détails" ou celle avec ND/TECH/Articles
      if (workbook.SheetNames.length > 1) {
        const detailsSheet = workbook.SheetNames.find(name => name.toLowerCase().includes('détail') || name.toLowerCase().includes('detail'));
        if (detailsSheet) {
          sheetName = detailsSheet;
          sheet = workbook.Sheets[sheetName];
        } else {
          // Chercher la feuille avec les colonnes attendues
          for (const name of workbook.SheetNames) {
            const testSheet = workbook.Sheets[name];
            const testJson = XLSX.utils.sheet_to_json(testSheet, { header: 1 });
            const testHeaders = testJson[0]?.map(h => String(h).toLowerCase().trim()) || [];
            if (testHeaders.some(h => h === 'nd' || h === 'tech' || h.includes('article'))) {
              sheetName = name;
              sheet = testSheet;
              break;
            }
          }
        }
      }
      
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headers = json[0]?.map(h => String(h).toLowerCase().trim()) || [];
      
      // Détection Orange: colonnes ND, Articles, Montant ST
      const isOrange = headers.some(h => h === 'nd' || h.includes('article') || h.includes('montant st'));
      // Détection Canal+: colonnes Ref PXO, FACTURATION, GSE, TECHNICIEN avec format GSE
      const isCanal = headers.some(h => h.includes('ref pxo') || h === 'facturation' || h.includes('date solde') || h === 'gse');
      
      if (isOrange && !isCanal) setImportType('orange');
      else if (isCanal) setImportType('canal');
      else setImportType('');
      
      setPreview({ headers: json[0], rows: json.slice(1, 6), total: json.length - 1 });
    } catch (err) { 
      console.error('Erreur lecture:', err);
      setError('Erreur de lecture du fichier'); 
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importType) return;
    setImporting(true); setError('');
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Pour Orange RCC: chercher la feuille "Détails" ou celle avec les bonnes colonnes
      let sheetName = workbook.SheetNames[0];
      let sheet = workbook.Sheets[sheetName];
      
      if (workbook.SheetNames.length > 1) {
        const detailsSheet = workbook.SheetNames.find(name => name.toLowerCase().includes('détail') || name.toLowerCase().includes('detail'));
        if (detailsSheet) {
          sheetName = detailsSheet;
          sheet = workbook.Sheets[sheetName];
        } else {
          for (const name of workbook.SheetNames) {
            const testSheet = workbook.Sheets[name];
            const testJson = XLSX.utils.sheet_to_json(testSheet, { header: 1 });
            const testHeaders = testJson[0]?.map(h => String(h).toLowerCase().trim()) || [];
            if (testHeaders.some(h => h === 'nd' || h === 'tech' || h.includes('article'))) {
              sheetName = name;
              sheet = testSheet;
              break;
            }
          }
        }
      }
      
      const json = XLSX.utils.sheet_to_json(sheet);
      
      // Format période: "MOIS ANNEE/TYPE" ex: "DECEMBRE 2025/ORANGE"
      const monthName = MONTHS.find(m => m.value === selectedMonth)?.label.toUpperCase() || '';
      const typeLabel = importType === 'orange' ? 'ORANGE' : 'CANAL+';
      const periode = `${monthName} ${selectedYear}/${typeLabel}`;
      
      // Helper: get value from row with multiple possible column names
      const getCol = (row, ...names) => {
        for (const name of names) {
          const keys = Object.keys(row);
          const key = keys.find(k => k.toLowerCase().trim() === name.toLowerCase().trim() || k.toLowerCase().includes(name.toLowerCase()));
          if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
        }
        return '';
      };
      
      if (importType === 'orange') {
        const interventions = json.map(row => {
          const date = parseExcelDate(getCol(row, 'Date Cloture', 'date_cloture', 'Date'));
          return { 
            periode, 
            nd: getCol(row, 'ND', 'nd') || '', 
            tech: getCol(row, 'Technicien', 'tech', 'TECH') || '', 
            articles: getCol(row, 'Articles', 'articles', 'Code') || '', 
            montant_st: parseFloat(getCol(row, 'Montant ST', 'montant_st', 'Montant') || 0), 
            intervention_date: date ? date.toISOString().split('T')[0] : null, 
            week_number: date ? getWeekNumber(date) : null, 
            month: date ? date.getMonth() + 1 : null, 
            year: date ? date.getFullYear() : null 
          };
        }).filter(i => i.tech && i.montant_st > 0);
        await insertOrangeInterventions(interventions);
        await createImport({ type: 'orange', periode, filename: selectedFile.name, total_records: interventions.length, total_montant: interventions.reduce((s, i) => s + i.montant_st, 0) });
      } else {
        // Canal+ avec support des Travaux supplémentaires
        const extractCodes = (str) => str ? String(str).match(/[A-Z]{2,}[A-Z0-9]*/gi)?.map(m => m.toUpperCase()) || [] : [];
        
        const interventions = json.map(row => {
          // Date: plusieurs formats possibles
          const date = parseExcelDate(getCol(row, 'DATE SOLDE', 'Date Realisation', 'date_realisation', 'Date', 'DATE_SOLDE'));
          
          // Code facturation principal (colonne FACTURATION)
          const mainCodeRaw = getCol(row, 'FACTURATION', 'Facturation', 'facturation', 'Code');
          const mainCode = mainCodeRaw ? String(mainCodeRaw).toUpperCase().trim() : '';
          
          // Travaux supplémentaires (colonne L généralement)
          const travauxSuppRaw = getCol(row, 'TRAVAUX SUPPLEMENTAIRES', 'Travaux supplémentaires', 'travaux_supplementaires', 'Travaux Supplementaires', 'TRAVAUX_SUPPLEMENTAIRES');
          const suppCodes = extractCodes(travauxSuppRaw);
          
          // Calcul des prix - code principal
          const mainPrice = mainCode ? canalPrices.find(p => p.code === mainCode) : null;
          let totalGset = mainPrice?.gset_price || 0;
          let totalTech = mainPrice?.tech_price || 0;
          
          // Ajouter les travaux supplémentaires
          suppCodes.forEach(code => { 
            const p = canalPrices.find(pr => pr.code === code); 
            if (p) { 
              totalGset += p.gset_price; 
              totalTech += p.tech_price; 
            } 
          });
          
          // Affichage des codes (ex: "PBEA + TXPD")
          const allCodes = mainCode ? (suppCodes.length ? `${mainCode} + ${suppCodes.join(' + ')}` : mainCode) : suppCodes.join(' + ');
          
          // Technicien: colonne TECHNICIEN ou GSE
          const techRaw = getCol(row, 'TECHNICIEN', 'GSE', 'gse', 'Tech');
          const tech = techRaw ? String(techRaw).trim() : '';
          
          return { 
            periode, 
            tech,
            tech_name: getCol(row, 'Nom Technicien', 'nom_technicien') || '', 
            ref_pxo: String(getCol(row, 'Ref PXO', 'ref_pxo', 'Ref_PXO', 'REF PXO') || ''),
            facturation: allCodes, 
            agence: getCol(row, 'Agence', 'agence') || '', 
            montant_gset: totalGset, 
            montant_tech: totalTech, 
            intervention_date: date ? date.toISOString().split('T')[0] : null, 
            week_number: date ? getWeekNumber(date) : null, 
            month: date ? date.getMonth() + 1 : null, 
            year: date ? date.getFullYear() : null 
          };
        }).filter(i => i.tech && (i.montant_gset > 0 || i.facturation));
        
        await insertCanalInterventions(interventions);
        await createImport({ type: 'canal', periode, filename: selectedFile.name, total_records: interventions.length, total_montant: interventions.reduce((s, i) => s + i.montant_gset, 0) });
      }
      setSelectedFile(null); setPreview(null); setImportType(''); onImportComplete?.();
    } catch (err) { setError(err.message); } finally { setImporting(false); }
  };

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed ${t.border} rounded-xl p-8 text-center`}>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" id="file-input" />
        <label htmlFor="file-input" className="cursor-pointer"><Upload className={`w-12 h-12 ${t.textMuted} mx-auto mb-4`} /><p className={`font-medium ${t.text}`}>Glissez un fichier ou cliquez</p><p className={`text-sm ${t.textMuted}`}>Excel ou CSV</p></label>
      </div>
      {preview && (
        <div className={`rounded-xl border ${t.border} p-4 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div><p className={`font-medium ${t.text}`}>{selectedFile?.name}</p><p className={`text-sm ${t.textMuted}`}>{preview.total} lignes</p></div>
            <select value={importType} onChange={(e) => setImportType(e.target.value)} className={`px-3 py-2 rounded-xl border ${t.input} w-full sm:w-auto`}><option value="">Type...</option><option value="orange">Orange</option><option value="canal">Canal+</option></select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${t.textSecondary} mb-1.5`}>Période</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${t.textSecondary} mb-1.5`}>Année</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={`w-full px-3 py-2 rounded-xl border ${t.input}`}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleImport} disabled={!importType || importing} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">{importing ? <LoadingSpinner size="sm" /> : <Upload className="w-5 h-5" />} Importer</button>
        </div>
      )}
    </div>
  );
}

// === IMPORT HISTORY ===
function ImportHistorySection({ imports, onRefresh }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (imp) => {
    setDeleting(true);
    try { await deleteImport(imp.id, imp.type, imp.periode); onRefresh?.(); } catch (err) { console.error(err); } finally { setDeleting(false); setConfirmDelete(null); }
  };

  if (!imports.length) return <p className={`text-center py-8 ${t.textMuted}`}>Aucun import</p>;

  return (
    <div className="space-y-2">
      {imports.map((imp) => (
        <div key={imp.id} className={`group ${t.bgTertiary} rounded-xl p-4 ${t.bgHover} transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${imp.type === 'orange' ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-purple-100 dark:bg-purple-500/20'}`}><Upload className={`w-5 h-5 ${imp.type === 'orange' ? 'text-orange-500' : 'text-purple-500'}`} /></div>
              <div><p className={`font-medium ${t.text}`}>{imp.periode}</p><p className={`text-xs ${t.textMuted}`}>{imp.total_records} interv. • {imp.total_montant?.toLocaleString('fr-FR')}€</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${imp.type === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'}`}>{imp.type === 'orange' ? 'Orange' : 'Canal+'}</span>
              {confirmDelete === imp.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(imp)} disabled={deleting} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">{deleting ? <LoadingSpinner size="sm" /> : 'Confirmer'}</button>
                  <button onClick={() => setConfirmDelete(null)} className={`px-3 py-1.5 ${t.bgSecondary} ${t.textSecondary} text-xs font-medium rounded-lg`}>Annuler</button>
                </div>
              ) : (<button onClick={() => setConfirmDelete(imp.id)} className={`p-2 ${t.textMuted} hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all`}><Trash2 className="w-4 h-4" /></button>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// === USER MANAGEMENT ===
function UserManagementPage({ profiles, onRefresh }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [newUser, setNewUser] = useState({ email: '', name: '', username: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState({});
  const [saving, setSaving] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { getAvailableTechNames().then(setAvailableNames); }, []);

  const usedAliases = useMemo(() => {
    const used = new Set();
    profiles.forEach(p => (p.aliases || []).forEach(a => used.add(a.toLowerCase())));
    return used;
  }, [profiles]);

  const handleCreateUser = async (e) => {
    e.preventDefault(); setCreating(true); setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email: newUser.email, password: Math.random().toString(36).slice(-12), options: { data: { username: newUser.username.toLowerCase(), name: newUser.name, role: 'tech' }, emailRedirectTo: `${window.location.origin}/` } });
      if (signUpError) throw signUpError;
      setNewUser({ email: '', name: '', username: '' }); onRefresh?.();
    } catch (err) { setError(err.message); } finally { setCreating(false); }
  };

  const handleDeleteUser = async (profile) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) { console.error('Error deleting user:', err); } finally { setDeleting(false); setConfirmDelete(null); }
  };

  const handleAddAlias = async (profile) => {
    const alias = selectedAlias[profile.id];
    if (!alias) return;
    setSaving(profile.id);
    try { await updateProfile(profile.id, { aliases: [...(profile.aliases || []), alias] }); setSelectedAlias(prev => ({ ...prev, [profile.id]: '' })); onRefresh?.(); } catch (err) { console.error(err); } finally { setSaving(null); }
  };

  const handleRemoveAlias = async (profile, aliasToRemove) => {
    setSaving(profile.id);
    try { await updateProfile(profile.id, { aliases: (profile.aliases || []).filter(a => a !== aliasToRemove) }); onRefresh?.(); } catch (err) { console.error(err); } finally { setSaving(null); }
  };

  const getAvailableForUser = (profile) => {
    const userAliases = new Set((profile.aliases || []).map(a => a.toLowerCase()));
    return availableNames.filter(name => !usedAliases.has(name.toLowerCase()) || userAliases.has(name.toLowerCase())).filter(name => !userAliases.has(name.toLowerCase()));
  };

  const techProfiles = profiles.filter(p => p.role === 'tech');
  const inputClass = `px-3 py-2 rounded-xl border outline-none ${t.input}`;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2 flex items-center gap-2`}><Users className="w-4 h-4" /> Gestion des comptes</h4>
        <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Créez un compte. Le technicien recevra un email pour définir son mot de passe.</p>
      </div>
      <div className={`rounded-2xl border ${t.card} p-4`}>
        <h3 className={`font-semibold ${t.text} mb-4`}>Créer un compte</h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Identifiant" value={newUser.username} onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))} className={inputClass} required />
          <input type="text" placeholder="Nom complet" value={newUser.name} onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))} className={inputClass} required />
          <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))} className={inputClass} required />
          <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">{creating ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />} Créer</button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className={`p-4 border-b ${t.border}`}><h3 className={`font-semibold ${t.text}`}>Techniciens ({techProfiles.length})</h3></div>
        <div className={`divide-y ${t.borderLight} max-h-[600px] overflow-y-auto`}>
          {techProfiles.map((profile) => {
            const available = getAvailableForUser(profile);
            return (
              <div key={profile.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.accentLight}`}><User className="w-6 h-6" /></div>
                    <div><p className={`font-medium ${t.text}`}>{profile.name}</p><p className={`text-xs ${t.textMuted}`}>@{profile.username} • {profile.email}</p></div>
                  </div>
                  {confirmDelete === profile.id ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDeleteUser(profile)} disabled={deleting} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">{deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3 h-3" />} Supprimer</button>
                      <button onClick={() => setConfirmDelete(null)} className={`px-3 py-1.5 ${t.bgTertiary} ${t.textSecondary} text-xs font-medium rounded-lg`}>Annuler</button>
                    </div>
                  ) : (<button onClick={() => setConfirmDelete(profile.id)} className={`p-2 ${t.textMuted} hover:text-red-500 rounded-lg transition-colors`}><Trash2 className="w-4 h-4" /></button>)}
                </div>
                <div>
                  <label className={`text-xs ${t.textMuted} mb-2 block`}>Aliases (techniciens sous responsabilité)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(profile.aliases || []).map((alias, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm ${t.bgTertiary} ${t.text}`}>
                        <span className={alias.startsWith('GSE') ? 'font-mono text-purple-500' : ''}>{alias}</span>
                        <button onClick={() => handleRemoveAlias(profile, alias)} disabled={saving === profile.id} className={`${t.textMuted} hover:text-red-500`}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {(profile.aliases || []).length === 0 && <span className={`text-xs ${t.textMuted} italic`}>Aucun alias</span>}
                  </div>
                  <div className="flex gap-2">
                    <select value={selectedAlias[profile.id] || ''} onChange={(e) => setSelectedAlias(prev => ({ ...prev, [profile.id]: e.target.value }))} className={`flex-1 ${inputClass}`}>
                      <option value="">Ajouter un alias...</option>{available.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button onClick={() => handleAddAlias(profile)} disabled={!selectedAlias[profile.id] || saving === profile.id} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50">{saving === profile.id ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}</button>
                  </div>
                </div>
              </div>
            );
          })}
          {techProfiles.length === 0 && <div className={`p-12 text-center ${t.textMuted}`}>Aucun technicien</div>}
        </div>
      </div>
    </div>
  );
}

// === PRICE GRID PAGE ===
function PriceGridPage({ orangePrices, canalPrices, onRefresh }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('orange');
  const [editingPrice, setEditingPrice] = useState(null);

  const handleUpdatePrice = async (gridType, code, field, value) => {
    try {
      const prices = gridType === 'orange' ? orangePrices : canalPrices;
      const current = prices.find(p => p.code === code);
      const gset = field === 'gset' ? parseFloat(value) : current?.gset_price || 0;
      const tech = field === 'tech' ? parseFloat(value) : current?.tech_price || 0;
      if (gridType === 'orange') await updateOrangePrice(code, gset, tech);
      else await updateCanalPrice(code, gset, tech);
      onRefresh?.();
    } catch (err) { console.error(err); } finally { setEditingPrice(null); }
  };

  const tabClass = (active) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? t.accentLight : `${t.textSecondary} ${t.bgHover}`}`;
  const renderGrid = (prices, gridType) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className={t.bgTertiary}><tr>
          <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Code</th>
          <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix GSET</th>
          <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix Tech</th>
          <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Marge</th>
        </tr></thead>
        <tbody className={`divide-y ${t.borderLight}`}>
          {prices.map((p) => (
            <tr key={p.code} className={`${t.bgHover} transition-colors`}>
              <td className={`px-4 py-3 font-mono font-medium ${t.text}`}>{p.code}</td>
              <td className="px-4 py-3 text-right">
                {editingPrice === `${gridType}-${p.code}-gset` ? (
                  <input type="number" step="0.01" defaultValue={p.gset_price} autoFocus onBlur={(e) => handleUpdatePrice(gridType, p.code, 'gset', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePrice(gridType, p.code, 'gset', e.target.value); if (e.key === 'Escape') setEditingPrice(null); }} className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`} />
                ) : (<button onClick={() => setEditingPrice(`${gridType}-${p.code}-gset`)} className={`${gridType === 'orange' ? 'text-orange-500' : 'text-emerald-500'} px-2 py-1 rounded-lg ${t.bgHover}`}>{p.gset_price?.toFixed(2)}€</button>)}
              </td>
              <td className="px-4 py-3 text-right">
                {editingPrice === `${gridType}-${p.code}-tech` ? (
                  <input type="number" step="0.01" defaultValue={p.tech_price} autoFocus onBlur={(e) => handleUpdatePrice(gridType, p.code, 'tech', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePrice(gridType, p.code, 'tech', e.target.value); if (e.key === 'Escape') setEditingPrice(null); }} className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`} />
                ) : (<button onClick={() => setEditingPrice(`${gridType}-${p.code}-tech`)} className={`text-blue-500 px-2 py-1 rounded-lg ${t.bgHover}`}>{p.tech_price?.toFixed(2)}€</button>)}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${(p.gset_price - p.tech_price) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{(p.gset_price - p.tech_price).toFixed(2)}€</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('orange')} className={tabClass(activeTab === 'orange')}><span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" />Orange ({orangePrices.length})</span></button>
        <button onClick={() => setActiveTab('canal')} className={tabClass(activeTab === 'canal')}><span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" />Canal+ ({canalPrices.length})</span></button>
      </div>
      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className={`p-4 border-b ${t.border}`}><h3 className={`font-semibold ${t.text}`}>{activeTab === 'orange' ? 'Grille Orange' : 'Grille Canal+'}</h3><p className={`text-sm ${t.textMuted}`}>Cliquez pour modifier</p></div>
        {activeTab === 'orange' ? renderGrid(orangePrices, 'orange') : renderGrid(canalPrices, 'canal')}
      </div>
    </div>
  );
}


// === MAIN DASHBOARD ===
function MainDashboard() {
  const { theme, setTheme } = useTheme();
  const { profile, signOut: logout } = useAuth();
  const t = themes[theme];
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [orangePrices, setOrangePrices] = useState([]);
  const [canalPrices, setCanalPrices] = useState([]);
  const [orangeInterventions, setOrangeInterventions] = useState([]);
  const [canalInterventions, setCanalInterventions] = useState([]);
  const [imports, setImportsData] = useState([]);
  const [periods, setPeriods] = useState({ years: [], monthsByYear: {}, weeksByYearMonth: {} });
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState('mensuel');
  const isDirection = profile?.role === 'dir';
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profs, oPrices, cPrices, oInter, cInter, imps, pers] = await Promise.all([
        getAllProfiles(), getOrangePrices(), getCanalPrices(),
        getOrangeInterventions({ year: selectedYear, month: selectedMonth, week: viewMode === 'hebdo' ? selectedWeek : null }),
        getCanalInterventions({ year: selectedYear, month: selectedMonth, week: viewMode === 'hebdo' ? selectedWeek : null }),
        getImports(), getAvailablePeriods(),
      ]);
      setProfiles(profs); setOrangePrices(oPrices); setCanalPrices(cPrices);
      setOrangeInterventions(oInter); setCanalInterventions(cInter); setImportsData(imps); setPeriods(pers);
    } catch (err) { console.error('Error loading data:', err); } finally { setLoading(false); }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode]);

  useEffect(() => { loadData(); initialLoadDone.current = true; }, []);
  useEffect(() => { if (initialLoadDone.current) loadData(); }, [selectedYear, selectedMonth, selectedWeek, viewMode]);

  const filterForTech = (interventions, source) => {
    if (isDirection) return interventions;
    const aliases = profile?.aliases || [];
    return interventions.filter(i => {
      const tech = (source === 'canal' ? (i.tech || i.tech_name) : i.tech)?.toLowerCase();
      return aliases.some(a => tech?.includes(a.toLowerCase()) || a.toLowerCase().includes(tech || ''));
    });
  };

  const filteredOrange = filterForTech(orangeInterventions, 'orange');
  const filteredCanal = filterForTech(canalInterventions, 'canal');

  const orangeTotalGset = filteredOrange.reduce((s, i) => { const match = String(i.articles || '').match(/([A-Z]+\d*)/i); const price = match && orangePrices.find(p => p.code === match[1].toUpperCase()); return s + (price?.gset_price || i.montant_st || 0); }, 0);
  const orangeTotalTech = filteredOrange.reduce((s, i) => { const match = String(i.articles || '').match(/([A-Z]+\d*)/i); const price = match && orangePrices.find(p => p.code === match[1].toUpperCase()); return s + (price?.tech_price || i.montant_st * 0.55); }, 0);
  const canalTotalGset = filteredCanal.reduce((s, i) => s + (i.montant_gset || 0), 0);
  const canalTotalTech = filteredCanal.reduce((s, i) => s + (i.montant_tech || 0), 0);
  const totalST = orangeTotalGset + canalTotalGset;
  const totalTech = orangeTotalTech + canalTotalTech;
  const marge = totalST - totalTech;

  const allInterventions = [...filteredOrange.map(i => ({ ...i, source: 'orange' })), ...filteredCanal.map(i => ({ ...i, source: 'canal' }))].sort((a, b) => new Date(b.intervention_date || 0) - new Date(a.intervention_date || 0));
  
  const getPeriodLabel = () => {
    if (!selectedYear) return 'Toutes périodes';
    let label = `${selectedYear}`;
    if (selectedMonth) {
      label = `${MONTHS.find(m => m.value === selectedMonth)?.label || ''} ${selectedYear}`;
      if (selectedWeek && viewMode === 'hebdo') label += ` • S${selectedWeek}`;
    }
    return label;
  };

  const navItems = isDirection 
    ? [{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'import', icon: Upload, label: 'Import' }, { id: 'users', icon: Users, label: 'Comptes' }, { id: 'prices', icon: Euro, label: 'Grilles' }] 
    : [{ id: 'dashboard', icon: User, label: 'Mon Récap' }];

  if (loading && !orangeInterventions.length) {
    return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className={`min-h-screen flex ${t.bg} transition-colors`}>
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-20'} ${t.sidebar} transition-all duration-300 flex-col`}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-white" /></div>
          {sidebarOpen && <div><h1 className="font-bold text-white">GSET PLANS</h1><p className="text-xs text-gray-500">FTTH D3 Guyane</p></div>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? t.sidebarActive : `${t.sidebarText} ${t.sidebarHover}`}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          {sidebarOpen && <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50"><p className="text-xs text-gray-500">Connecté</p><p className="font-medium text-white truncate text-sm">{profile?.name}</p><span className={`text-xs ${isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>{isDirection ? 'Direction' : 'Technicien'}</span></div>}
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"><LogOut className="w-5 h-5" />{sidebarOpen && <span className="font-medium">Déconnexion</span>}</button>
        </div>
      </aside>

      {/* Sidebar Mobile (Overlay) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
          <aside className={`absolute inset-y-0 left-0 w-64 ${t.sidebar} flex flex-col shadow-2xl`}>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-white" /></div>
              <div><h1 className="font-bold text-white">GSET PLANS</h1><p className="text-xs text-gray-500">FTTH D3 Guyane</p></div>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? t.sidebarActive : `${t.sidebarText} ${t.sidebarHover}`}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" /><span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-800">
              <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50"><p className="text-xs text-gray-500">Connecté</p><p className="font-medium text-white truncate text-sm">{profile?.name}</p><span className={`text-xs ${isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>{isDirection ? 'Direction' : 'Technicien'}</span></div>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"><LogOut className="w-5 h-5" /><span className="font-medium">Déconnexion</span></button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <header className={`${t.bgSecondary} border-b ${t.border} px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-xl ${t.bgHover}`}>
              {sidebarOpen ? <X className={`w-5 h-5 ${t.textSecondary}`} /> : <Menu className={`w-5 h-5 ${t.textSecondary}`} />}
            </button>
            <h2 className={`text-lg sm:text-xl font-semibold ${t.text} truncate`}>{navItems.find(n => n.id === view)?.label}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <VisibilityToggle />
            <button onClick={loadData} className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover}`}><RefreshCw className={`w-5 h-5 ${t.textSecondary}`} /></button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover}`}>
              {theme === 'light' ? <Moon className={`w-5 h-5 ${t.textSecondary}`} /> : <Sun className="w-5 h-5 text-yellow-400" />}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {view === 'dashboard' && (
            <>
              <PeriodSelector periods={periods} selectedYear={selectedYear} selectedMonth={selectedMonth} selectedWeek={selectedWeek} viewMode={viewMode}
                onChange={({ year, month, week, viewMode: vm }) => {
                  if (year !== undefined) setSelectedYear(year);
                  if (month !== undefined) setSelectedMonth(month);
                  if (week !== undefined) setSelectedWeek(week);
                  if (vm !== undefined) setViewMode(vm);
                }} />

              <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600">
                <p className="text-emerald-100 text-sm mb-1">Période</p>
                <p className="text-white text-2xl font-bold">{getPeriodLabel()}</p>
              </div>

              {isDirection ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard icon={Euro} label="Total Facturé" value={`${totalST.toLocaleString('fr-FR')}€`} color="emerald" />
                    <StatCard icon={TrendingUp} label="Orange" value={`${orangeTotalGset.toLocaleString('fr-FR')}€`} sub={`${filteredOrange.length} interv.`} color="orange" />
                    <StatCard icon={PieChart} label="Canal+" value={`${canalTotalGset.toLocaleString('fr-FR')}€`} sub={`${filteredCanal.length} interv.`} color="purple" />
                    <StatCard icon={User} label="À payer" value={`${totalTech.toLocaleString('fr-FR')}€`} color="blue" />
                    <StatCard icon={BarChart3} label="Marge GSET" value={`${marge.toLocaleString('fr-FR')}€`} color="teal" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TechRankingChart orangeInterventions={filteredOrange} canalInterventions={filteredCanal} orangePrices={orangePrices} />
                    <InterventionTypeChart orangeInterventions={filteredOrange} canalInterventions={filteredCanal} orangePrices={orangePrices} isDirection={true} />
                  </div>
                  <RevenueTrendChart orangeInterventions={orangeInterventions} canalInterventions={canalInterventions} orangePrices={orangePrices} isDirection={true} />
                </>
              ) : (
                <>
                  <TechDashboardStats filteredOrange={filteredOrange} filteredCanal={filteredCanal} orangePrices={orangePrices} profile={profile} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InterventionTypeChart orangeInterventions={filteredOrange} canalInterventions={filteredCanal} orangePrices={orangePrices} isDirection={false} />
                    <RevenueTrendChart orangeInterventions={filteredOrange} canalInterventions={filteredCanal} orangePrices={orangePrices} isDirection={false} />
                  </div>
                </>
              )}
              <InterventionsTable interventions={allInterventions} title="Détail des interventions" showTech={isDirection} orangePrices={orangePrices} />
            </>
          )}

          {isDirection && view === 'import' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${t.card}`}><h3 className={`font-semibold ${t.text} mb-4`}>Importer des données</h3><FileImportSection orangePrices={orangePrices} canalPrices={canalPrices} onImportComplete={loadData} /></div>
              <div className={`rounded-2xl p-6 border ${t.card}`}><h3 className={`font-semibold ${t.text} mb-4`}>Historique des imports</h3><ImportHistorySection imports={imports} onRefresh={loadData} /></div>
            </div>
          )}

          {isDirection && view === 'users' && <UserManagementPage profiles={profiles} onRefresh={loadData} />}
          {isDirection && view === 'prices' && <PriceGridPage orangePrices={orangePrices} canalPrices={canalPrices} onRefresh={loadData} />}
        </div>
      </main>
    </div>
  );
}

// === APP ===
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [error, setError] = useState(null);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let initialCheckDone = false;

    // Helper: Check if error is abort (should be ignored)
    const isAbortError = (err) => {
      if (!err) return false;
      const msg = err.message || err.toString();
      return msg.includes('abort') || msg.includes('AbortError') || msg.includes('signal') || err.name === 'AbortError';
    };

    // Check URL for recovery token FIRST
    const checkRecoveryUrl = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('type=recovery') || hash.includes('access_token') || search.includes('type=recovery')) {
        return true;
      }
      return false;
    };

    const initAuth = async () => {
      try {
        // Small delay to avoid race conditions on mount
        await new Promise(r => setTimeout(r, 100));
        if (!isMounted) return;
        
        // Check DB first
        const { error: testError } = await supabase.from('profiles').select('id').limit(1);
        if (!isMounted) return;
        
        if (testError && (testError.code === '42P01' || testError.message?.includes('relation'))) {
          setDbConfigured(false); setDbError(testError.message); setLoading(false);
          return;
        }
        
        // Check for password recovery URL BEFORE getting session
        const isRecovery = checkRecoveryUrl();
        
        const sess = await getSession();
        if (!isMounted) return;
        setSession(sess);
        
        // If recovery URL detected, show reset page
        if (isRecovery && sess) {
          setShowResetPassword(true);
          setLoading(false);
          return;
        }
        
        if (sess?.user) {
          try { 
            const prof = await getProfile(sess.user.id); 
            if (isMounted) setProfile(prof); 
          } catch (err) { 
            if (!isAbortError(err)) console.error('Error fetching profile:', err); 
          }
        }
      } catch (err) {
        if (!isMounted) return;
        if (isAbortError(err)) {
          // Abort errors are normal during hot reload, just retry
          console.log('Init aborted, retrying...');
          setTimeout(() => { if (isMounted) initAuth(); }, 500);
          return;
        }
        console.error('Auth init error:', err);
        if (err.message?.includes('relation') || err.code === '42P01') { 
          setDbConfigured(false); setDbError(err.message); 
        } else {
          setError(err.message);
        }
      } finally { 
        if (isMounted) { setLoading(false); initialCheckDone = true; } 
      }
    };
    
    initAuth();

    const { data: { subscription } } = onAuthStateChange(async (event, sess) => {
      console.log('Auth event:', event);
      if (event === 'INITIAL_SESSION' || !isMounted || !initialCheckDone) return;
      if (event === 'PASSWORD_RECOVERY') { setShowResetPassword(true); return; }
      setSession(prev => prev?.user?.id === sess?.user?.id ? prev : sess);
      if (sess?.user && event === 'SIGNED_IN') {
        try { 
          const prof = await getProfile(sess.user.id); 
          if (isMounted) setProfile(prof); 
        } catch (err) { 
          if (!isAbortError(err)) console.error(err); 
        }
      } else if (event === 'SIGNED_OUT' && isMounted) setProfile(null);
    });

    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  const handleSignOut = async () => { try { await signOut(); setSession(null); setProfile(null); } catch (err) { console.error(err); } };
  const handleResetComplete = async () => { 
    setShowResetPassword(false); 
    window.history.replaceState(null, '', window.location.pathname);
    // Petit délai pour laisser Supabase terminer ses événements
    await new Promise(r => setTimeout(r, 500));
    try {
      const sess = await getSession();
      if (sess) {
        setSession(sess);
        if (sess.user) {
          const prof = await getProfile(sess.user.id);
          setProfile(prof);
        }
      }
    } catch (e) { 
      console.error('Error after password reset:', e); 
    }
  };
  const toggleAmounts = () => setShowAmounts(prev => !prev);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>;
  if (!dbConfigured) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"><AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Configuration requise</h2><p className="text-gray-500 mb-4">Exécutez le script SQL dans Supabase.</p></div></div>;
  if (showResetPassword) return <ResetPasswordPage onComplete={handleResetComplete} />;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Erreur</h2><p className="text-gray-500 mb-4">{error}</p><button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600">Réessayer</button></div></div>;
  if (!session) return <LoginPage />;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <AuthContext.Provider value={{ user: session?.user, profile, signOut: handleSignOut }}>
        <AmountVisibilityContext.Provider value={{ showAmounts, toggleAmounts }}>
          <MainDashboard />
        </AmountVisibilityContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
