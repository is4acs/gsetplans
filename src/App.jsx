import { useState, useEffect, useMemo, createContext, useContext, useCallback, useRef, useTransition } from 'react';
import { 
  Upload, LayoutDashboard, LogOut, Menu, X, Settings, Sun, Moon,
  TrendingUp, Euro, Calendar, BarChart3, PieChart, User, Plus, Trash2, 
  Save, ChevronDown, ChevronUp, Filter, Check, Zap, Mail, Lock, Users,
  KeyRound, AlertCircle, Eye, EyeOff, Loader2, RefreshCw, Trophy,
  Target, Award, TrendingDown, Activity, Crown, CalendarDays, FileText,
  CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck, ShieldAlert, UserCog
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
  getImports, createImport, deleteImport, getAvailablePeriods, getAvailableTechNames,
  getDailyTracking, insertDailyTracking, getDailyImports, createDailyImport, deleteDailyImport
} from './lib/supabase';

// === LOGO COMPONENT ===
// Logo GSET Caraïbes intégré
function Logo({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return <img src="/logo.svg" alt="GSET Caraïbes" className={`${sizes[size]} ${className} object-contain rounded-xl`} />;
}

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
              <Logo size="md" className="bg-white/20 backdrop-blur" />
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
function InterventionsTable({ interventions, title, showTech = true, orangePrices, isDirection = true }) {
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
            {isDirection && <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>ST</th>}
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>{isDirection ? 'Tech' : 'Prix'}</th>
          </tr></thead>
          <tbody className={`divide-y ${t.borderLight}`}>
            {displayed.map((inter, i) => (
              <tr key={i} className={`${t.bgHover} transition-colors`}>
                <td className={`px-4 py-3 ${t.textSecondary} font-mono text-xs`}>{formatDate(inter.intervention_date)}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs rounded-full font-medium ${inter.source === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'}`}>{inter.source === 'orange' ? 'Orange' : 'Canal+'}</span></td>
                {showTech && <td className={`px-4 py-3 ${t.text}`}>{inter.tech || inter.tech_name || '-'}</td>}
                <td className={`px-4 py-3 font-mono ${t.textSecondary}`}>{inter.nd || inter.ref_pxo || '-'}</td>
                <td className={`px-4 py-3 ${t.text}`}>{inter.articles || inter.facturation || '-'}</td>
                {isDirection && <td className={`px-4 py-3 text-right font-medium ${inter.source === 'orange' ? 'text-orange-500' : 'text-purple-500'}`}>{formatAmount(inter.source === 'orange' ? inter.montant_st : inter.montant_gset)}</td>}
                <td className={`px-4 py-3 text-right font-medium ${isDirection ? 'text-blue-500' : 'text-emerald-500'}`}>{formatAmount(getTechPrice(inter))}</td>
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
        <StatCard icon={Euro} label="Revenus" value={`${stats.totalTech.toLocaleString('fr-FR')}€`} color="emerald" />
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
            month: selectedMonth,  // Utiliser le mois sélectionné
            year: selectedYear     // Utiliser l'année sélectionnée
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
            month: selectedMonth,  // Utiliser le mois sélectionné, pas celui de la date
            year: selectedYear     // Utiliser l'année sélectionnée, pas celle de la date
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
function UserManagementPage({ profiles, onRefresh, currentUserProfile }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [newUser, setNewUser] = useState({ email: '', name: '', username: '', role: 'tech' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState({});
  const [saving, setSaving] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [customAlias, setCustomAlias] = useState({});
  const [showDirSection, setShowDirSection] = useState(true);
  const [showTechSection, setShowTechSection] = useState(true);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);
  const [changingRole, setChangingRole] = useState(null);

  const isSuperAdmin = currentUserProfile?.role === 'superadmin';
  const isDir = currentUserProfile?.role === 'dir' || isSuperAdmin;

  useEffect(() => { 
    const loadNames = async () => {
      const rccNames = await getAvailableTechNames();
      const dailyTechs = JSON.parse(localStorage.getItem('gsetplans_daily_techs') || '[]');
      const allNames = new Set([...rccNames, ...dailyTechs]);
      setAvailableNames(Array.from(allNames).sort());
    };
    loadNames();
  }, []);

  const usedAliases = useMemo(() => {
    const used = new Set();
    profiles.forEach(p => (p.aliases || []).forEach(a => used.add(a.toLowerCase())));
    return used;
  }, [profiles]);

  const handleCreateUser = async (e) => {
    e.preventDefault(); 
    setCreating(true); 
    setError('');
    try {
      const roleToCreate = (newUser.role === 'dir' && !isSuperAdmin) ? 'tech' : newUser.role;
      const { error: signUpError } = await supabase.auth.signUp({ 
        email: newUser.email, 
        password: Math.random().toString(36).slice(-12), 
        options: { 
          data: { username: newUser.username.toLowerCase(), name: newUser.name, role: roleToCreate }, 
          emailRedirectTo: `${window.location.origin}/` 
        } 
      });
      if (signUpError) throw signUpError;
      setNewUser({ email: '', name: '', username: '', role: 'tech' }); 
      onRefresh?.();
    } catch (err) { setError(err.message); } finally { setCreating(false); }
  };

  const handleDeleteUser = async (profile) => {
    if (profile.role === 'superadmin') return;
    if (profile.role === 'dir' && !isSuperAdmin) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) { console.error('Error deleting user:', err); } finally { setDeleting(false); setConfirmDelete(null); }
  };

  const handleRoleChange = async (profile, newRole) => {
    if (!isSuperAdmin) return;
    if (profile.role === 'superadmin') return;
    setChangingRole(profile.id);
    try {
      await updateProfile(profile.id, { role: newRole });
      onRefresh?.();
    } catch (err) { console.error('Error changing role:', err); } finally { setChangingRole(null); setConfirmRoleChange(null); }
  };

  const handleAddAlias = async (profile) => {
    const alias = profile._customAlias || selectedAlias[profile.id];
    if (!alias) return;
    setSaving(profile.id);
    try { 
      await updateProfile(profile.id, { aliases: [...(profile.aliases || []), alias] }); 
      setSelectedAlias(prev => ({ ...prev, [profile.id]: '' })); 
      setCustomAlias(prev => ({ ...prev, [profile.id]: '' }));
      onRefresh?.(); 
    } catch (err) { console.error(err); } finally { setSaving(null); }
  };

  const handleRemoveAlias = async (profile, aliasToRemove) => {
    setSaving(profile.id);
    try { await updateProfile(profile.id, { aliases: (profile.aliases || []).filter(a => a !== aliasToRemove) }); onRefresh?.(); } catch (err) { console.error(err); } finally { setSaving(null); }
  };

  const getAvailableForUser = (profile) => {
    const userAliases = new Set((profile.aliases || []).map(a => a.toLowerCase()));
    return availableNames.filter(name => !usedAliases.has(name.toLowerCase()) || userAliases.has(name.toLowerCase())).filter(name => !userAliases.has(name.toLowerCase()));
  };

  const superAdminProfiles = profiles.filter(p => p.role === 'superadmin');
  const dirProfiles = profiles.filter(p => p.role === 'dir');
  const techProfiles = profiles.filter(p => p.role === 'tech');
  const inputClass = `px-3 py-2 rounded-xl border outline-none ${t.input}`;

  const RoleBadge = ({ role }) => {
    const cfg = {
      superadmin: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', icon: Crown, label: 'Super Admin' },
      dir: { bg: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white', icon: ShieldCheck, label: 'Direction' },
      tech: { bg: `${t.bgTertiary} ${t.textSecondary}`, icon: User, label: 'Technicien' }
    }[role] || { bg: t.bgTertiary, icon: User, label: role };
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg}`}><cfg.icon className="w-3 h-3" />{cfg.label}</span>;
  };

  const UserCard = ({ profile, canChangeRole, canDelete }) => {
    const available = getAvailableForUser(profile);
    const isOwnProfile = profile.id === currentUserProfile?.id;
    const iconBg = profile.role === 'superadmin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : profile.role === 'dir' ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : t.accentLight;
    const IconComp = profile.role === 'superadmin' ? Crown : profile.role === 'dir' ? ShieldCheck : User;
    
    return (
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}><IconComp className={`w-6 h-6 ${profile.role !== 'tech' ? 'text-white' : ''}`} /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium ${t.text}`}>{profile.name}</p>
                <RoleBadge role={profile.role} />
                {isOwnProfile && <span className="text-xs text-emerald-500 font-medium">(Vous)</span>}
              </div>
              <p className={`text-xs ${t.textMuted}`}>@{profile.username} • {profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canChangeRole && !isOwnProfile && profile.role !== 'superadmin' && (
              confirmRoleChange === profile.id ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => handleRoleChange(profile, profile.role === 'tech' ? 'dir' : 'tech')} disabled={changingRole === profile.id}
                    className={`px-3 py-1.5 ${profile.role === 'tech' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-orange-500 hover:bg-orange-600'} text-white text-xs font-medium rounded-lg disabled:opacity-50 flex items-center gap-1`}>
                    {changingRole === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (profile.role === 'tech' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />)}
                    {profile.role === 'tech' ? 'Promouvoir Dir' : 'Rétrograder Tech'}
                  </button>
                  <button onClick={() => setConfirmRoleChange(null)} className={`px-3 py-1.5 ${t.bgTertiary} ${t.textSecondary} text-xs font-medium rounded-lg`}>Annuler</button>
                </div>
              ) : <button onClick={() => setConfirmRoleChange(profile.id)} className={`p-2 ${t.textMuted} hover:text-purple-500 rounded-lg`} title="Changer le rôle"><UserCog className="w-4 h-4" /></button>
            )}
            {canDelete && !isOwnProfile && profile.role !== 'superadmin' && (
              confirmDelete === profile.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDeleteUser(profile)} disabled={deleting} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">{deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Supprimer</button>
                  <button onClick={() => setConfirmDelete(null)} className={`px-3 py-1.5 ${t.bgTertiary} ${t.textSecondary} text-xs font-medium rounded-lg`}>Annuler</button>
                </div>
              ) : <button onClick={() => setConfirmDelete(profile.id)} className={`p-2 ${t.textMuted} hover:text-red-500 rounded-lg`}><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        </div>
        {profile.role !== 'superadmin' && (
          <div>
            <label className={`text-xs ${t.textMuted} mb-2 block`}>Aliases (noms dans RCC & Daily)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile.aliases || []).map((alias, i) => (
                <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm ${t.bgTertiary} ${t.text}`}>
                  <span className={alias.startsWith('GSE') ? 'font-mono text-purple-500' : ''}>{alias}</span>
                  <button onClick={() => handleRemoveAlias(profile, alias)} disabled={saving === profile.id} className={`${t.textMuted} hover:text-red-500`}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {(profile.aliases || []).length === 0 && <span className={`text-xs ${t.textMuted} italic`}>Aucun alias</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={selectedAlias[profile.id] || ''} onChange={(e) => setSelectedAlias(prev => ({ ...prev, [profile.id]: e.target.value }))} className={`flex-1 ${inputClass}`}>
                <option value="">Sélectionner...</option>
                {available.length > 0 && <optgroup label="📊 Disponibles">{available.map(name => <option key={name} value={name}>{name}</option>)}</optgroup>}
              </select>
              <input type="text" placeholder="Ou saisir..." value={customAlias[profile.id] || ''} onChange={(e) => setCustomAlias(prev => ({ ...prev, [profile.id]: e.target.value }))} className={`flex-1 ${inputClass}`} />
              <button onClick={() => { const a = selectedAlias[profile.id] || customAlias[profile.id]; if (a) handleAddAlias({ ...profile, _customAlias: a }); }} disabled={(!selectedAlias[profile.id] && !customAlias[profile.id]) || saving === profile.id} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                {saving === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}<span className="hidden sm:inline">Ajouter</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2 flex items-center gap-2`}><Users className="w-4 h-4" /> Gestion des comptes</h4>
        <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
          {isSuperAdmin ? "Super Admin : vous pouvez gérer tous les comptes et promouvoir/rétrograder la Direction." : "Créez des comptes techniciens. Ils recevront un email pour définir leur mot de passe."}
        </p>
      </div>

      <div className={`rounded-2xl border ${t.card} p-4`}>
        <h3 className={`font-semibold ${t.text} mb-4`}>Créer un compte</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" placeholder="Identifiant" value={newUser.username} onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))} className={inputClass} required />
            <input type="text" placeholder="Nom complet" value={newUser.name} onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))} className={inputClass} required />
            <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))} className={inputClass} required />
            {isSuperAdmin ? (
              <select value={newUser.role} onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value }))} className={inputClass}>
                <option value="tech">Technicien</option>
                <option value="dir">Direction</option>
              </select>
            ) : (
              <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
              </button>
            )}
          </div>
          {isSuperAdmin && (
            <button type="submit" disabled={creating} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer le compte
            </button>
          )}
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Super Admins */}
      {isSuperAdmin && superAdminProfiles.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
          <div className={`p-4 border-b ${t.border} flex items-center gap-2`}><Crown className="w-5 h-5 text-amber-500" /><h3 className={`font-semibold ${t.text}`}>Super Admin ({superAdminProfiles.length})</h3></div>
          <div className={`divide-y ${t.borderLight}`}>{superAdminProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={false} canDelete={false} />)}</div>
        </div>
      )}

      {/* Direction */}
      {isSuperAdmin && (
        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
          <button onClick={() => setShowDirSection(!showDirSection)} className={`w-full p-4 border-b ${t.border} flex items-center justify-between ${t.bgHover}`}>
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-purple-500" /><h3 className={`font-semibold ${t.text}`}>Direction ({dirProfiles.length})</h3></div>
            {showDirSection ? <ChevronUp className={`w-5 h-5 ${t.textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${t.textMuted}`} />}
          </button>
          {showDirSection && (
            <div className={`divide-y ${t.borderLight}`}>
              {dirProfiles.length > 0 ? dirProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={isSuperAdmin} canDelete={isSuperAdmin} />) : (
                <div className={`p-8 text-center ${t.textMuted}`}><ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Aucun membre Direction</p><p className="text-xs mt-1">Promouvez un technicien</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Techniciens */}
      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <button onClick={() => setShowTechSection(!showTechSection)} className={`w-full p-4 border-b ${t.border} flex items-center justify-between ${t.bgHover}`}>
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /><h3 className={`font-semibold ${t.text}`}>Techniciens ({techProfiles.length})</h3></div>
          {showTechSection ? <ChevronUp className={`w-5 h-5 ${t.textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${t.textMuted}`} />}
        </button>
        {showTechSection && (
          <div className={`divide-y ${t.borderLight} max-h-[600px] overflow-y-auto`}>
            {techProfiles.length > 0 ? techProfiles.map(p => <UserCard key={p.id} profile={p} canChangeRole={isSuperAdmin} canDelete={isDir} />) : (
              <div className={`p-12 text-center ${t.textMuted}`}><User className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Aucun technicien</p></div>
            )}
          </div>
        )}
      </div>

      {/* Légende */}
      <div className={`rounded-2xl p-4 border ${t.card}`}>
        <h4 className={`text-sm font-medium ${t.text} mb-3`}>Légende des rôles</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`flex items-start gap-3 p-3 rounded-xl ${t.bgTertiary}`}><Crown className="w-5 h-5 text-amber-500 flex-shrink-0" /><div><p className={`font-medium text-sm ${t.text}`}>Super Admin</p><p className={`text-xs ${t.textMuted}`}>Accès total + gestion Direction</p></div></div>
          <div className={`flex items-start gap-3 p-3 rounded-xl ${t.bgTertiary}`}><ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0" /><div><p className={`font-medium text-sm ${t.text}`}>Direction</p><p className={`text-xs ${t.textMuted}`}>Import, équipe, gestion techs</p></div></div>
          <div className={`flex items-start gap-3 p-3 rounded-xl ${t.bgTertiary}`}><User className="w-5 h-5 text-emerald-500 flex-shrink-0" /><div><p className={`font-medium text-sm ${t.text}`}>Technicien</p><p className={`text-xs ${t.textMuted}`}>Dashboard personnel</p></div></div>
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


// === DAILY PAGE (Infloww-inspired) ===
function DailyPage({ orangePrices, canalPrices, profile }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const [dailyData, setDailyData] = useState({ orange: [], canal: [], lastUpdate: null });
  const [dailyImports, setDailyImports] = useState([]);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('month');
  const [selectedTech, setSelectedTech] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAllDetails, setShowAllDetails] = useState(false);
  const isDirection = profile?.role === 'dir' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  // Charger les données depuis Supabase
  const loadDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const [tracking, imports] = await Promise.all([
        getDailyTracking(),
        getDailyImports()
      ]);
      
      // Séparer par type
      const orange = tracking.filter(d => d.type === 'ORANGE').map(d => ({
        tech: d.technicien,
        date: d.date,
        etat: d.etat,
        otPlanifies: d.planifies,
        otRealise: d.realises,
        otOK: d.ok,
        otNOK: d.nok,
        otReportes: d.reportes
      }));
      const canal = tracking.filter(d => d.type === 'CANAL').map(d => ({
        tech: d.technicien,
        date: d.date,
        etat: d.etat,
        otPlanifies: d.planifies,
        otRealise: d.realises,
        otOK: d.ok,
        otNOK: d.nok,
        otReportes: d.reportes
      }));
      
      setDailyData({ 
        orange, 
        canal, 
        lastUpdate: imports[0]?.created_at || null 
      });
      setDailyImports(imports);
    } catch (err) {
      console.error('Erreur chargement daily:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  // Calculate average prices - ST for superadmin, GSET for direction, Tech for technicians
  const avgPrices = useMemo(() => {
    // Prix moyens GSET (facturation client)
    const orangeGsetAvg = orangePrices.length > 0 
      ? orangePrices.reduce((s, p) => s + (p.gset_price || 0), 0) / orangePrices.length 
      : 85;
    const canalGsetAvg = canalPrices.length > 0 
      ? canalPrices.reduce((s, p) => s + (p.gset_price || 0), 0) / canalPrices.length 
      : 250;
    
    // Prix moyens ST (facturation Orange/Canal vers GSET)
    const orangeStAvg = orangePrices.length > 0 
      ? orangePrices.reduce((s, p) => s + (p.montant_st || p.gset_price || 0), 0) / orangePrices.length 
      : 100;
    const canalStAvg = canalPrices.length > 0 
      ? canalPrices.reduce((s, p) => s + (p.montant_st || p.gset_price || 0), 0) / canalPrices.length 
      : 300;
    
    // Prix moyens Tech (paiement techniciens)
    const orangeTechAvg = orangePrices.length > 0 
      ? orangePrices.reduce((s, p) => s + (p.tech_price || 0), 0) / orangePrices.length 
      : 45;
    const canalTechAvg = canalPrices.length > 0 
      ? canalPrices.reduce((s, p) => s + (p.tech_price || 0), 0) / canalPrices.length 
      : 120;
    
    if (isDirection) {
      return { 
        orange: orangeGsetAvg, 
        canal: canalGsetAvg,
        // Prix ST pour Super Admin
        orangeSt: orangeStAvg,
        canalSt: canalStAvg,
        // Prix Tech pour calcul marge
        orangeTech: orangeTechAvg,
        canalTech: canalTechAvg
      };
    } else {
      return { orange: orangeTechAvg, canal: canalTechAvg };
    }
  }, [orangePrices, canalPrices, isDirection]);

  // Get unique techs from data
  const techsList = useMemo(() => {
    const techs = new Set();
    dailyData.orange.forEach(d => techs.add(d.tech));
    dailyData.canal.forEach(d => techs.add(d.tech));
    return Array.from(techs).sort();
  }, [dailyData]);

  // Get today's date info
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // Calculer la dernière date de données disponible
  const lastDataDate = useMemo(() => {
    const allDates = [
      ...dailyData.orange.map(d => d.date),
      ...dailyData.canal.map(d => d.date)
    ].filter(Boolean).sort((a, b) => b.localeCompare(a));
    return allDates[0] || null;
  }, [dailyData]);

  // Filter data based on period and profile aliases
  const filteredData = useMemo(() => {
    let orange = dailyData.orange;
    let canal = dailyData.canal;
    
    // Filter by tech aliases for non-direction users
    if (!isDirection && profile?.aliases?.length) {
      const aliases = profile.aliases.map(a => a.toLowerCase());
      orange = orange.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
      canal = canal.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
    }
    
    // Filter by selected tech (admin only)
    if (isDirection && selectedTech !== 'all') {
      orange = orange.filter(d => d.tech === selectedTech);
      canal = canal.filter(d => d.tech === selectedTech);
    }
    
    // Filter by period
    if (periodFilter === 'today') {
      orange = orange.filter(d => d.date === todayStr);
      canal = canal.filter(d => d.date === todayStr);
    } else if (periodFilter === 'yesterday') {
      orange = orange.filter(d => d.date === yesterdayStr);
      canal = canal.filter(d => d.date === yesterdayStr);
    } else if (periodFilter === 'week') {
      orange = orange.filter(d => d.date >= weekStartStr && d.date <= todayStr);
      canal = canal.filter(d => d.date >= weekStartStr && d.date <= todayStr);
    } else if (periodFilter === 'custom' && dateFrom && dateTo) {
      orange = orange.filter(d => d.date >= dateFrom && d.date <= dateTo);
      canal = canal.filter(d => d.date >= dateFrom && d.date <= dateTo);
    }
    // 'month' shows all data (current month)
    
    return { orange, canal };
  }, [dailyData, selectedTech, periodFilter, isDirection, profile, todayStr, yesterdayStr, weekStartStr, dateFrom, dateTo]);

  // Calculate stats for each period
  const calculateStats = (data) => {
    const orangeOK = data.orange.reduce((s, d) => s + (d.otOK || 0), 0);
    const orangeNOK = data.orange.reduce((s, d) => s + (d.otNOK || 0), 0);
    const orangeReport = data.orange.reduce((s, d) => s + (d.otReportes || 0), 0);
    const canalOK = data.canal.reduce((s, d) => s + (d.otOK || 0), 0);
    const canalNOK = data.canal.reduce((s, d) => s + (d.otNOK || 0), 0);
    const canalReport = data.canal.reduce((s, d) => s + (d.otReportes || 0), 0);
    const orangeRevenu = orangeOK * avgPrices.orange;
    const canalRevenu = canalOK * avgPrices.canal;
    
    // Calculs supplémentaires pour Super Admin (prix ST et marges)
    const orangeStRevenu = isDirection && avgPrices.orangeSt ? orangeOK * avgPrices.orangeSt : 0;
    const canalStRevenu = isDirection && avgPrices.canalSt ? canalOK * avgPrices.canalSt : 0;
    const orangeTechCost = isDirection && avgPrices.orangeTech ? orangeOK * avgPrices.orangeTech : 0;
    const canalTechCost = isDirection && avgPrices.canalTech ? canalOK * avgPrices.canalTech : 0;
    const orangeMarge = orangeStRevenu - orangeTechCost;
    const canalMarge = canalStRevenu - canalTechCost;
    
    return {
      orange: { ok: orangeOK, nok: orangeNOK, report: orangeReport, revenu: orangeRevenu, stRevenu: orangeStRevenu, marge: orangeMarge },
      canal: { ok: canalOK, nok: canalNOK, report: canalReport, revenu: canalRevenu, stRevenu: canalStRevenu, marge: canalMarge },
      total: { 
        ok: orangeOK + canalOK, 
        nok: orangeNOK + canalNOK, 
        report: orangeReport + canalReport, 
        revenu: orangeRevenu + canalRevenu,
        stRevenu: orangeStRevenu + canalStRevenu,
        marge: orangeMarge + canalMarge
      }
    };
  };

  const stats = useMemo(() => calculateStats(filteredData), [filteredData, avgPrices]);

  // Tech performance data for admin
  const techPerformance = useMemo(() => {
    if (!isDirection) return [];
    const byTech = {};
    filteredData.orange.forEach(d => {
      if (!byTech[d.tech]) byTech[d.tech] = { tech: d.tech, orangeOK: 0, canalOK: 0, total: 0, revenu: 0 };
      byTech[d.tech].orangeOK += d.otOK || 0;
      byTech[d.tech].total += d.otOK || 0;
      byTech[d.tech].revenu += (d.otOK || 0) * avgPrices.orange;
    });
    filteredData.canal.forEach(d => {
      if (!byTech[d.tech]) byTech[d.tech] = { tech: d.tech, orangeOK: 0, canalOK: 0, total: 0, revenu: 0 };
      byTech[d.tech].canalOK += d.otOK || 0;
      byTech[d.tech].total += d.otOK || 0;
      byTech[d.tech].revenu += (d.otOK || 0) * avgPrices.canal;
    });
    return Object.values(byTech).sort((a, b) => b.total - a.total);
  }, [filteredData, avgPrices, isDirection]);

  // Daily chart data
  const dailyChartData = useMemo(() => {
    const byDate = {};
    filteredData.orange.forEach(d => {
      if (!byDate[d.date]) byDate[d.date] = { date: d.date, orangeOK: 0, canalOK: 0 };
      byDate[d.date].orangeOK += d.otOK || 0;
    });
    filteredData.canal.forEach(d => {
      if (!byDate[d.date]) byDate[d.date] = { date: d.date, orangeOK: 0, canalOK: 0 };
      byDate[d.date].canalOK += d.otOK || 0;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      label: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    }));
  }, [filteredData]);

  // Handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      const orangeSheet = workbook.Sheets['SUIVI JOURNALIER ORANGE'];
      const canalSheet = workbook.Sheets['SUIVI JOURNALIER CANAL'];
      
      if (!orangeSheet && !canalSheet) {
        alert('Feuilles "SUIVI JOURNALIER ORANGE" ou "SUIVI JOURNALIER CANAL" non trouvées');
        setImporting(false);
        return;
      }
      
      const parseSheet = (sheet) => {
        if (!sheet) return [];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const result = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0] || !row[2]) continue;
          
          const dateVal = row[2];
          let dateStr = '';
          if (dateVal instanceof Date) {
            dateStr = dateVal.toISOString().split('T')[0];
          } else if (typeof dateVal === 'number') {
            const d = new Date((dateVal - 25569) * 86400 * 1000);
            dateStr = d.toISOString().split('T')[0];
          } else if (typeof dateVal === 'string' && dateVal) {
            dateStr = new Date(dateVal).toISOString().split('T')[0];
          }
          
          if (!dateStr || dateStr === 'Invalid Date') continue;
          
          result.push({
            tech: String(row[0]).trim(),
            equipe: String(row[1] || 'D3').trim(),
            date: dateStr,
            etat: String(row[3] || '').trim(),
            otPlanifies: parseFloat(row[4]) || 0,
            otRealise: parseFloat(row[5]) || 0,
            otOK: parseFloat(row[6]) || 0,
            otNOK: parseFloat(row[7]) || 0,
            otReportes: parseFloat(row[8]) || 0,
            nd: row[13] || '',
            commentaire: row[14] || ''
          });
        }
        return result;
      };
      
      const orangeData = parseSheet(orangeSheet);
      const canalData = parseSheet(canalSheet);
      
      // Préparer les données pour Supabase
      const periode = `${new Date().toLocaleDateString('fr-FR')} - ${file.name}`;
      const supabaseRecords = [
        ...orangeData.map(d => ({
          type: 'ORANGE',
          technicien: d.tech,
          date: d.date,
          etat: d.etat,
          planifies: d.otPlanifies,
          realises: d.otRealise,
          ok: d.otOK,
          nok: d.otNOK,
          reportes: d.otReportes,
          taux_reussite: d.otRealise > 0 ? d.otOK / d.otRealise : 0,
          periode
        })),
        ...canalData.map(d => ({
          type: 'CANAL',
          technicien: d.tech,
          date: d.date,
          etat: d.etat,
          planifies: d.otPlanifies,
          realises: d.otRealise,
          ok: d.otOK,
          nok: d.otNOK,
          reportes: d.otReportes,
          taux_reussite: d.otRealise > 0 ? d.otOK / d.otRealise : 0,
          periode
        }))
      ];
      
      // Envoyer vers Supabase
      await insertDailyTracking(supabaseRecords);
      
      // Créer l'entrée d'import
      const allDates = [...orangeData, ...canalData].map(d => new Date(d.date));
      await createDailyImport({
        filename: file.name,
        total_records: supabaseRecords.length,
        date_debut: allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString().split('T')[0] : null,
        date_fin: allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString().split('T')[0] : null,
        periode
      });
      
      // Recharger les données depuis Supabase
      await loadDailyData();
      
      alert(`Import réussi: ${orangeData.length} lignes Orange, ${canalData.length} lignes Canal+ envoyées vers Supabase`);
    } catch (err) {
      console.error('Import error:', err);
      alert('Erreur lors de l\'import: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const clearData = async () => {
    if (confirm('Effacer toutes les données Daily ?')) {
      // Supprimer tous les imports et leurs données
      for (const imp of dailyImports) {
        try {
          await deleteDailyImport(imp.id, imp.periode);
        } catch (e) {
          console.error('Erreur suppression:', e);
        }
      }
      await loadDailyData();
    }
  };

  const getPeriodLabel = () => {
    if (periodFilter === 'today') return "Aujourd'hui";
    if (periodFilter === 'yesterday') return 'Hier';
    if (periodFilter === 'week') return 'Cette semaine';
    if (periodFilter === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const to = new Date(dateTo).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      return `Du ${from} au ${to}`;
    }
    return 'Ce mois';
  };

  // Infloww-style stat card
  const EarningCard = ({ icon: Icon, label, value, color, iconBg }) => (
    <div className={`${t.bgSecondary} rounded-2xl p-5 border ${t.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${t.text}`}>{showAmounts ? value : '••••'}</p>
          <p className={`text-sm ${t.textMuted} mt-1`}>{label}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  // Period selector tabs (Infloww style)
  const PeriodTab = ({ id, label, active }) => (
    <button
      onClick={() => setPeriodFilter(id)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
          : `${t.textSecondary} hover:${t.bgTertiary}`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header - Infloww style */}
      <div className={`rounded-2xl border ${t.card} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold ${t.text}`}>{isDirection ? 'Revenus équipe' : 'Mes revenus'}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.bgTertiary} ${t.textMuted}`}>
                  {new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })} • UTC+01:00
                </span>
              </div>
              <p className={`text-sm ${t.textMuted} mt-0.5`}>
                {lastDataDate 
                  ? `Données à jour jusqu'au ${new Date(lastDataDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                  : 'Aucune donnée importée'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${t.bgTertiary}`}>
              <PeriodTab id="today" label="Aujourd'hui" active={periodFilter === 'today'} />
              <PeriodTab id="yesterday" label="Hier" active={periodFilter === 'yesterday'} />
              <PeriodTab id="week" label="Cette semaine" active={periodFilter === 'week'} />
              <PeriodTab id="month" label="Ce mois" active={periodFilter === 'month'} />
              <PeriodTab id="custom" label="Personnalisé" active={periodFilter === 'custom'} />
            </div>
            
            {/* Custom date range */}
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${t.textMuted}`}>Du</span>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${t.input} ${t.text}`}
                />
                <span className={`text-sm ${t.textMuted}`}>au</span>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${t.input} ${t.text}`}
                />
              </div>
            )}
            
            {/* Import button (admin only) */}
            {isDirection && (
              <label className={`px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-all ${importing ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600'} text-white flex items-center gap-2`}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Import...' : 'Importer'}
                <input type="file" accept=".xlsx,.xls" onChange={handleFileImport} className="hidden" disabled={importing} />
              </label>
            )}
            {isDirection && dailyData.orange.length > 0 && (
              <button onClick={clearData} className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {dailyData.orange.length === 0 && dailyData.canal.length === 0 ? (
        <div className={`rounded-2xl border ${t.card} p-12 text-center`}>
          <CalendarDays className={`w-16 h-16 mx-auto mb-4 ${t.textMuted}`} />
          <h3 className={`text-lg font-semibold ${t.text} mb-2`}>Aucune donnée Daily</h3>
          <p className={`${t.textMuted} mb-4`}>
            {isDirection 
              ? 'Importez le fichier SUIVI.xlsx pour voir la progression quotidienne'
              : 'Les données seront disponibles une fois importées par l\'administrateur'}
          </p>
          {!isDirection && (
            <p className={`text-sm ${t.textSecondary}`}>
              Assurez-vous que votre nom figure dans les alias de votre compte
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Tech filter (admin only) */}
          {isDirection && (
            <div className="flex gap-3">
              <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} 
                className={`px-4 py-2.5 rounded-xl border ${t.input} ${t.text} font-medium`}>
                <option value="all">👥 Tous les techniciens</option>
                {techsList.map(tech => <option key={tech} value={tech}>{tech}</option>)}
              </select>
            </div>
          )}

          {/* Main earnings display - Infloww style */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Total Earnings - Large card */}
            <div className={`lg:col-span-1 ${t.bgSecondary} rounded-2xl p-6 border ${t.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Euro className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className={`text-sm ${t.textMuted} mb-1`}>{isDirection ? 'Total facturé' : 'Revenus'}</p>
              <p className="text-4xl font-bold text-emerald-500">
                {showAmounts ? `${stats.total.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}
              </p>
              <p className={`text-xs ${t.textMuted} mt-2`}>{getPeriodLabel()}</p>
            </div>

            {/* Other stats */}
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
              <EarningCard 
                icon={TrendingUp} 
                label="Orange" 
                value={`${stats.orange.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`}
                color="text-orange-500"
                iconBg="bg-orange-100"
              />
              <EarningCard 
                icon={PieChart} 
                label="Canal+" 
                value={`${stats.canal.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`}
                color="text-purple-500"
                iconBg="bg-purple-100"
              />
              <EarningCard 
                icon={CheckCircle} 
                label="OT Réussis" 
                value={stats.total.ok.toString()}
                color="text-emerald-500"
                iconBg="bg-emerald-100"
              />
              <EarningCard 
                icon={XCircle} 
                label="OT Échoués" 
                value={stats.total.nok.toString()}
                color="text-red-500"
                iconBg="bg-red-100"
              />
              <EarningCard 
                icon={Clock} 
                label="OT Reportés" 
                value={stats.total.report.toString()}
                color="text-yellow-600"
                iconBg="bg-yellow-100"
              />
              <EarningCard 
                icon={Target} 
                label="Taux réussite" 
                value={stats.total.ok + stats.total.nok > 0 
                  ? `${Math.round(stats.total.ok / (stats.total.ok + stats.total.nok) * 100)}%` 
                  : '0%'}
                color="text-blue-500"
                iconBg="bg-blue-100"
              />
            </div>
          </div>
          
          {/* Section Super Admin - Prix ST et Marges */}
          {isSuperAdmin && (
            <div className={`rounded-2xl border-2 border-amber-500/30 ${t.card} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${t.text}`}>Vue Super Admin</h3>
                  <p className={`text-xs ${t.textMuted}`}>Prix ST Orange/Canal+ et marges GSET</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenu ST Total */}
                <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className={`text-xs font-medium ${t.textMuted}`}>Revenu ST Total</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-500">
                    {showAmounts ? `${stats.total.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}
                  </p>
                </div>
                {/* Marge GSET */}
                <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className={`text-xs font-medium ${t.textMuted}`}>Marge GSET</span>
                  </div>
                  <p className={`text-2xl font-bold ${stats.total.marge >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {showAmounts ? `${stats.total.marge.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}
                  </p>
                </div>
                {/* ST Orange */}
                <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className={`text-xs font-medium ${t.textMuted}`}>ST Orange</span>
                  </div>
                  <p className="text-xl font-bold text-orange-500">
                    {showAmounts ? `${stats.orange.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}
                  </p>
                  <p className={`text-xs ${t.textMuted} mt-1`}>
                    Marge: {showAmounts ? `${stats.orange.marge.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••'}
                  </p>
                </div>
                {/* ST Canal+ */}
                <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className={`text-xs font-medium ${t.textMuted}`}>ST Canal+</span>
                  </div>
                  <p className="text-xl font-bold text-purple-500">
                    {showAmounts ? `${stats.canal.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}
                  </p>
                  <p className={`text-xs ${t.textMuted} mt-1`}>
                    Marge: {showAmounts ? `${stats.canal.marge.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••'}
                  </p>
                </div>
              </div>
              <p className={`text-xs ${t.textMuted} mt-3`}>
                * Prix ST moyens: {avgPrices.orangeSt?.toFixed(0) || 0}€/Orange • {avgPrices.canalSt?.toFixed(0) || 0}€/Canal+ | 
                Coût Tech: {avgPrices.orangeTech?.toFixed(0) || 0}€/Orange • {avgPrices.canalTech?.toFixed(0) || 0}€/Canal+
              </p>
            </div>
          )}
          
          {/* Discreet note about average pricing */}
          <p className={`text-xs ${t.textMuted} text-right -mt-4`}>
            * Estimation basée sur le prix moyen des articles ({avgPrices.orange.toFixed(0)}€/Orange • {avgPrices.canal.toFixed(0)}€/Canal+)
          </p>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Progress Chart */}
            <div className={`rounded-2xl border ${t.card} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${t.text}`}>Progression</h3>
                  <p className={`text-sm ${t.textMuted}`}>OT réussis par jour</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="label" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={10} />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={`${t.bgSecondary} border ${t.border} rounded-lg p-3 shadow-lg`}>
                            <p className={`font-medium ${t.text} mb-2`}>{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {p.value}</p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="orangeOK" name="Orange" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="canalOK" name="Canal+" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Success Rate Pie */}
            <div className={`rounded-2xl border ${t.card} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${t.text}`}>Répartition</h3>
                  <p className={`text-sm ${t.textMuted}`}>OK / NOK / Reportés</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Réussis', value: stats.total.ok, fill: '#10b981' },
                        { name: 'Échoués', value: stats.total.nok, fill: '#ef4444' },
                        { name: 'Reportés', value: stats.total.report, fill: '#f59e0b' }
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value"
                    />
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className={`text-xs ${t.textSecondary}`}>OK ({stats.total.ok})</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className={`text-xs ${t.textSecondary}`}>NOK ({stats.total.nok})</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className={`text-xs ${t.textSecondary}`}>Report ({stats.total.report})</span></div>
              </div>
            </div>
          </div>

          {/* Tech Performance Table (Direction only) */}
          {isDirection && techPerformance.length > 0 && (
            <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
              <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
                <div>
                  <h3 className={`font-semibold ${t.text}`}>Classement techniciens</h3>
                  <p className={`text-sm ${t.textMuted}`}>{getPeriodLabel()}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={t.bgTertiary}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>#</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Orange</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Canal+</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Total OT</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${t.textSecondary} uppercase`}>Revenu ST</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${t.border}`}>
                    {techPerformance.slice(0, 15).map((tech, idx) => (
                      <tr key={tech.tech} className={t.bgHover}>
                        <td className={`px-4 py-3 ${t.textMuted}`}>
                          {idx === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <Award className="w-5 h-5 text-gray-400" /> : idx === 2 ? <Award className="w-5 h-5 text-amber-600" /> : idx + 1}
                        </td>
                        <td className={`px-4 py-3 font-medium ${t.text}`}>{tech.tech}</td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 font-medium text-sm">{tech.orangeOK}</span></td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-600 font-medium text-sm">{tech.canalOK}</span></td>
                        <td className={`px-4 py-3 text-center font-bold ${t.text}`}>{tech.total}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-500">
                          {showAmounts ? `${tech.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail Table */}
          <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
            <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
              <div>
                <h3 className={`font-semibold ${t.text}`}>Détail journalier</h3>
                <p className={`text-sm ${t.textMuted}`}>{filteredData.orange.length + filteredData.canal.length} entrées • {getPeriodLabel()}</p>
              </div>
              {(filteredData.orange.length + filteredData.canal.length) > 20 && (
                <button 
                  onClick={() => setShowAllDetails(!showAllDetails)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${showAllDetails ? 'bg-gray-200 text-gray-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'} transition-all`}
                >
                  {showAllDetails ? 'Réduire' : `Afficher tout (${filteredData.orange.length + filteredData.canal.length})`}
                </button>
              )}
            </div>
            <div className={`overflow-x-auto ${showAllDetails ? 'max-h-[600px]' : 'max-h-80'}`}>
              <table className="w-full">
                <thead className={`${t.bgTertiary} sticky top-0`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Date</th>
                    {isDirection && <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th>}
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Source</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>État</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>OK</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>NOK</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Report</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.border}`}>
                  {[...filteredData.orange.map(d => ({ ...d, source: 'Orange' })), ...filteredData.canal.map(d => ({ ...d, source: 'Canal+' }))]
                    .sort((a, b) => b.date.localeCompare(a.date) || a.tech.localeCompare(b.tech))
                    .slice(0, showAllDetails ? 500 : 20)
                    .map((d, idx) => (
                      <tr key={`${d.source}-${d.tech}-${d.date}-${idx}`} className={t.bgHover}>
                        <td className={`px-4 py-2.5 text-sm ${t.text}`}>{new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                        {isDirection && <td className={`px-4 py-2.5 text-sm font-medium ${t.text}`}>{d.tech}</td>}
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.source === 'Orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                            {d.source}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.etat === 'Terminée' ? 'bg-emerald-100 text-emerald-700' : d.etat === 'Non planifiée' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                            {d.etat || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-sm font-medium text-emerald-500">{d.otOK || 0}</td>
                        <td className="px-4 py-2.5 text-center text-sm font-medium text-red-500">{d.otNOK || 0}</td>
                        <td className="px-4 py-2.5 text-center text-sm font-medium text-yellow-500">{d.otReportes || 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
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
  const [isPending, startTransition] = useTransition();
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
  const isDirection = profile?.role === 'dir' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';
  const initialLoadDone = useRef(false);
  const periodInitialized = useRef(false);

  // Fonction pour charger uniquement les données (avec filtres actuels)
  const loadInterventions = useCallback(async (year, month, week, mode) => {
    const [oInter, cInter] = await Promise.all([
      getOrangeInterventions({ year, month, week: mode === 'hebdo' ? week : null }),
      getCanalInterventions({ year, month, week: mode === 'hebdo' ? week : null }),
    ]);
    setOrangeInterventions(oInter);
    setCanalInterventions(cInter);
  }, []);

  // Chargement initial complet
  const loadData = useCallback(async (fullRefresh = false) => {
    if (!fullRefresh) setLoading(true);
    try {
      const [profs, oPrices, cPrices, imps, pers] = await Promise.all([
        getAllProfiles(), getOrangePrices(), getCanalPrices(),
        getImports(), getAvailablePeriods(),
      ]);
      
      // Utiliser startTransition pour les mises à jour non-urgentes
      startTransition(() => {
        setProfiles(profs);
        setOrangePrices(oPrices);
        setCanalPrices(cPrices);
        setImportsData(imps);
        setPeriods(pers);
      });
      
      // Auto-select current/latest month on first load
      if (!periodInitialized.current && pers.years?.length > 0) {
        periodInitialized.current = true;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        // Use current year if available, otherwise latest year
        const yearToSelect = pers.years.includes(currentYear) ? currentYear : pers.years[0];
        const availableMonths = pers.monthsByYear?.[yearToSelect] || [];
        // Use current month if available, otherwise latest month
        const monthToSelect = availableMonths.includes(currentMonth) ? currentMonth : availableMonths[availableMonths.length - 1];
        
        if (yearToSelect && monthToSelect) {
          setSelectedYear(yearToSelect);
          setSelectedMonth(monthToSelect);
          // Charger les interventions avec les filtres sélectionnés
          await loadInterventions(yearToSelect, monthToSelect, null, viewMode);
        } else {
          // Pas de période disponible, charger sans filtre
          await loadInterventions(null, null, null, viewMode);
        }
      } else {
        // Rechargement normal avec filtres actuels
        await loadInterventions(selectedYear, selectedMonth, selectedWeek, viewMode);
      }
    } catch (err) { console.error('Error loading data:', err); } finally { setLoading(false); }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions]);

  // Refresh rapide après import (sans recharger tout)
  const refreshAfterImport = useCallback(async () => {
    try {
      const [imps, pers] = await Promise.all([getImports(), getAvailablePeriods()]);
      startTransition(() => {
        setImportsData(imps);
        setPeriods(pers);
      });
      await loadInterventions(selectedYear, selectedMonth, selectedWeek, viewMode);
    } catch (err) { console.error('Error refreshing:', err); }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions]);

  // Premier chargement
  useEffect(() => { 
    loadData(); 
    initialLoadDone.current = true; 
  }, []);
  
  // Rechargement quand les filtres changent (après init)
  useEffect(() => { 
    if (initialLoadDone.current && periodInitialized.current) {
      setLoading(true);
      loadInterventions(selectedYear, selectedMonth, selectedWeek, viewMode)
        .finally(() => setLoading(false));
    }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions]);

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
    ? [{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'daily', icon: CalendarDays, label: 'Daily' }, { id: 'import', icon: Upload, label: 'Import' }, { id: 'users', icon: Users, label: 'Comptes' }, { id: 'prices', icon: Euro, label: 'Grilles' }] 
    : [{ id: 'dashboard', icon: User, label: 'Mon Récap' }, { id: 'daily', icon: CalendarDays, label: 'Daily' }];

  if (loading && !orangeInterventions.length) {
    return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className={`min-h-screen flex ${t.bg} transition-colors`}>
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-20'} ${t.sidebar} transition-all duration-300 flex-col`}>
        <div className="p-4 flex items-center gap-3">
          <Logo size="md" />
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
          {sidebarOpen && <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50"><p className="text-xs text-gray-500">Connecté</p><p className="font-medium text-white truncate text-sm">{profile?.name}</p><span className={`text-xs ${isSuperAdmin ? 'text-amber-400' : isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>{isSuperAdmin ? 'Super Admin' : isDirection ? 'Direction' : 'Technicien'}</span></div>}
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"><LogOut className="w-5 h-5" />{sidebarOpen && <span className="font-medium">Déconnexion</span>}</button>
        </div>
      </aside>

      {/* Sidebar Mobile (Overlay) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/50" />
          <aside className={`absolute inset-y-0 left-0 w-64 ${t.sidebar} flex flex-col shadow-2xl`}>
            <div className="p-4 flex items-center gap-3">
              <Logo size="md" />
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
              <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50"><p className="text-xs text-gray-500">Connecté</p><p className="font-medium text-white truncate text-sm">{profile?.name}</p><span className={`text-xs ${isSuperAdmin ? 'text-amber-400' : isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>{isSuperAdmin ? 'Super Admin' : isDirection ? 'Direction' : 'Technicien'}</span></div>
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
            {isPending && <LoadingSpinner size="sm" />}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <VisibilityToggle />
            <button onClick={loadData} disabled={loading || isPending} className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover} ${(loading || isPending) ? 'opacity-50' : ''}`}>
              <RefreshCw className={`w-5 h-5 ${t.textSecondary} ${(loading || isPending) ? 'animate-spin' : ''}`} />
            </button>
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
              <InterventionsTable interventions={allInterventions} title="Détail des interventions" showTech={isDirection} orangePrices={orangePrices} isDirection={isDirection} />
            </>
          )}

          {isDirection && view === 'import' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${t.card}`}><h3 className={`font-semibold ${t.text} mb-4`}>Importer des données</h3><FileImportSection orangePrices={orangePrices} canalPrices={canalPrices} onImportComplete={refreshAfterImport} /></div>
              <div className={`rounded-2xl p-6 border ${t.card}`}><h3 className={`font-semibold ${t.text} mb-4`}>Historique des imports</h3><ImportHistorySection imports={imports} onRefresh={refreshAfterImport} /></div>
            </div>
          )}

          {isDirection && view === 'users' && <UserManagementPage profiles={profiles} onRefresh={loadData} currentUserProfile={profile} />}
          {isDirection && view === 'prices' && <PriceGridPage orangePrices={orangePrices} canalPrices={canalPrices} onRefresh={loadData} />}
          {view === 'daily' && <DailyPage orangePrices={orangePrices} canalPrices={canalPrices} profile={profile} />}
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

    // Check URL for recovery token
    const checkRecoveryUrl = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      // Supabase met le token dans le hash ou les query params
      return hash.includes('type=recovery') || 
             hash.includes('access_token') || 
             search.includes('type=recovery') ||
             hash.includes('error_code=');
    };

    const initAuth = async () => {
      try {
        // Check for password recovery URL FIRST
        const isRecovery = checkRecoveryUrl();
        
        if (isRecovery) {
          // Attendre que Supabase traite le token dans l'URL
          // Le client Supabase va automatiquement extraire le token et créer une session
          await new Promise(r => setTimeout(r, 500));
          
          if (!isMounted) return;
          
          // Vérifier si Supabase a créé une session de récupération
          const sess = await getSession();
          
          if (sess) {
            setSession(sess);
            setShowResetPassword(true);
            setLoading(false);
            return;
          } else {
            // Pas de session = token expiré ou invalide
            setError('Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.');
            setLoading(false);
            return;
          }
        }
        
        // Flow normal (pas de recovery)
        await new Promise(r => setTimeout(r, 100));
        if (!isMounted) return;
        
        // Check DB first
        const { error: testError } = await supabase.from('profiles').select('id').limit(1);
        if (!isMounted) return;
        
        if (testError && (testError.code === '42P01' || testError.message?.includes('relation'))) {
          setDbConfigured(false); setDbError(testError.message); setLoading(false);
          return;
        }
        
        const sess = await getSession();
        if (!isMounted) return;
        setSession(sess);
        
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
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Erreur</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => { setError(null); window.history.replaceState(null, '', window.location.pathname); }} 
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600">
            Retour à la connexion
          </button>
          <button onClick={() => window.location.reload()} 
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
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
