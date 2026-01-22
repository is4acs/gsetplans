import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Upload, LayoutDashboard, LogOut, Menu, X, Settings, Sun, Moon,
  TrendingUp, Euro, Calendar, BarChart3, PieChart, User, Plus, Trash2, 
  Save, ChevronDown, Filter, Check, Zap, Mail, Lock, Users,
  KeyRound, AlertCircle, Eye, EyeOff, Loader2, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
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

// === CONSTANTS ===
const GSE_NAMES = {
  'GSE 02': 'Wendelle Edwige', 'GSE 03': 'Claude', 'GSE 04': 'Alan Pantoja',
  'GSE 05': 'Maxime Paul', 'GSE 06': 'Carlos', 'GSE 15': 'Luckmane Cyrile',
  'GSE 16': 'Dautruche Sauvenel', 'GSE 17': 'Jahwer Sellemi',
  'GSE 18': 'Bakour Fallah', 'GSE 19': 'Zakaria Settou',
};

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

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

// === LOADING SPINNER ===
function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={`${sizes[size]} animate-spin text-emerald-500`} />;
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
          <button onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600">
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
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">GSET PLANS</h1>
                <p className="text-emerald-100 text-sm">FTTH D3 Guyane</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        <div className="p-8">
          {showForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mot de passe oublié</h2>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`}
                  placeholder="votre@email.com" required />
              </div>
              
              {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForgotPassword(false)}
                  className={`flex-1 py-3 rounded-xl border ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'} font-medium`}>
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <LoadingSpinner size="sm" />}
                  Réinitialiser
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`}
                  placeholder="votre@email.com" required />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mot de passe</label>
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:border-emerald-500`}
                  placeholder="••••••••" required />
              </div>
              
              <button type="button" onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Mot de passe oublié ?
              </button>
              
              {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
              
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
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

// === STAT CARD ===
function StatCard({ icon: Icon, label, value, sub, color }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const colors = {
    emerald: { bg: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50', text: 'text-emerald-500' },
    orange: { bg: theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50', text: 'text-orange-500' },
    purple: { bg: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50', text: 'text-purple-500' },
    blue: { bg: theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50', text: 'text-blue-500' },
    teal: { bg: theme === 'dark' ? 'bg-teal-500/10' : 'bg-teal-50', text: 'text-teal-500' },
  };
  const c = colors[color] || colors.emerald;

  return (
    <div className={`rounded-2xl p-5 border ${t.card}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg}`}><Icon className={`w-5 h-5 ${c.text}`} /></div>
      </div>
      <p className={`text-sm ${t.textSecondary} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
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
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${t.accentLight}`}><Filter className="w-4 h-4" /></div>
        <span className={`text-sm font-medium ${t.text}`}>Filtrer</span>
      </div>
      
      <select value={selectedYear || ''} onChange={(e) => onChange({ year: e.target.value ? parseInt(e.target.value) : null, month: null, week: null })}
        className={selectClass}>
        <option value="">Toutes années</option>
        {(periods.years || []).map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <select value={selectedMonth || ''} onChange={(e) => onChange({ year: selectedYear, month: e.target.value ? parseInt(e.target.value) : null, week: null })}
        disabled={!selectedYear} className={`${selectClass} disabled:opacity-50`}>
        <option value="">Tous mois</option>
        {MONTHS.filter(m => availableMonths.includes(m.value)).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      {viewMode === 'hebdo' && (
        <select value={selectedWeek || ''} onChange={(e) => onChange({ year: selectedYear, month: selectedMonth, week: e.target.value ? parseInt(e.target.value) : null })}
          disabled={!selectedMonth} className={`${selectClass} disabled:opacity-50`}>
          <option value="">Toutes semaines</option>
          {availableWeeks.map(w => <option key={w} value={w}>S{w}</option>)}
        </select>
      )}

      <div className={`flex items-center gap-1 p-1 rounded-lg ${t.bgTertiary}`}>
        <button onClick={() => onChange({ year: selectedYear, month: selectedMonth, week: null, viewMode: 'mensuel' })}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'mensuel' ? `${t.bgSecondary} shadow-sm ${t.text} font-medium` : t.textSecondary}`}>Mois</button>
        <button onClick={() => onChange({ year: selectedYear, month: selectedMonth, week: selectedWeek, viewMode: 'hebdo' })}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'hebdo' ? `${t.bgSecondary} shadow-sm ${t.text} font-medium` : t.textSecondary}`}>Semaine</button>
      </div>

      {(selectedYear || selectedMonth) && (
        <button onClick={() => onChange({ year: null, month: null, week: null })}
          className={`px-3 py-1.5 text-sm ${t.textMuted}`}>Réinitialiser</button>
      )}
    </div>
  );
}

// === INTERVENTIONS TABLE ===
function InterventionsTable({ interventions, title, showTech = true, orangePrices }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [showAll, setShowAll] = useState(false);
  const limit = 20;
  const displayed = showAll ? interventions : interventions.slice(0, limit);

  const getTechPrice = (inter) => {
    if (inter.source === 'canal') return inter.montant_tech || 0;
    // Orange: find price from code
    const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
    if (match && orangePrices) {
      const price = orangePrices.find(p => p.code === match[1].toUpperCase());
      if (price) return price.tech_price;
    }
    return inter.montant_st * 0.55;
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
      <div className={`p-4 border-b ${t.border} flex justify-between items-center`}>
        <div>
          <h3 className={`font-semibold ${t.text}`}>{title}</h3>
          <p className={`text-sm ${t.textMuted}`}>{interventions.length} interventions</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={t.bgTertiary}>
            <tr>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Date</th>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Source</th>
              {showTech && <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Technicien</th>}
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Réf</th>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Type</th>
              <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>ST</th>
              <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Tech</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${t.borderLight}`}>
            {displayed.map((inter, i) => (
              <tr key={i} className={`${t.bgHover} transition-colors`}>
                <td className={`px-4 py-3 ${t.textSecondary} font-mono text-xs`}>{formatDate(inter.intervention_date)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    inter.source === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                  }`}>{inter.source === 'orange' ? 'Orange' : 'Canal+'}</span>
                </td>
                {showTech && <td className={`px-4 py-3 ${t.text}`}>{inter.tech_name || inter.tech}</td>}
                <td className={`px-4 py-3 font-mono ${t.textSecondary} text-xs`}>{inter.nd || inter.ref_pxo || '-'}</td>
                <td className={`px-4 py-3 ${t.textSecondary}`}>{inter.articles || inter.facturation || '-'}</td>
                <td className={`px-4 py-3 text-right ${t.text}`}>{(inter.montant_gset || inter.montant_st || 0).toLocaleString('fr-FR')}€</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-500">{getTechPrice(inter).toLocaleString('fr-FR')}€</td>
              </tr>
            ))}
            {interventions.length === 0 && (
              <tr><td colSpan={7} className={`px-4 py-12 text-center ${t.textMuted}`}>Aucune intervention</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {interventions.length > limit && (
        <div className={`p-4 border-t ${t.border} text-center`}>
          <button onClick={() => setShowAll(!showAll)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium ${t.accentLight} flex items-center gap-2 mx-auto`}>
            {showAll ? 'Réduire' : `Afficher tout (${interventions.length - limit} de plus)`}
            <ChevronDown className={`w-4 h-4 ${showAll ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}

// === FILE IMPORT ===
function FileImportSection({ orangePrices, canalPrices, onImportComplete }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const detectFileType = (workbook) => {
    const sheetNames = workbook.SheetNames;
    if (sheetNames.some(n => n.toLowerCase().includes('récap') || n.toLowerCase().includes('recap'))) {
      const detailSheet = sheetNames.find(n => n.toLowerCase().includes('détail') || n.toLowerCase().includes('detail'));
      if (detailSheet) {
        const ws = workbook.Sheets[detailSheet];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length > 0) {
          const headers = data[0].map(h => String(h || '').toLowerCase());
          if (headers.some(h => h.includes('date debut travaux'))) return 'orange_rcc';
        }
      }
    }
    const ws = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length > 0) {
      const headers = data[0].map(h => String(h || '').toLowerCase());
      if (headers.includes('technicien') && headers.includes('facturation') && !headers.includes('total facture')) return 'canal_powerbi';
      if (headers.some(h => h.includes('nom technicien')) && headers.some(h => h.includes('total facture'))) return 'canal_gst';
    }
    return 'unknown';
  };

  const processFile = async (file) => {
    setImporting(true);
    setResult(null);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const fileType = detectFileType(workbook);
      
      let interventions = [];
      let periode = '';
      let type = '';
      
      if (fileType === 'orange_rcc') {
        type = 'orange';
        const sheetNames = workbook.SheetNames;
        const recapSheet = sheetNames.find(n => n.toLowerCase().includes('récap'));
        if (recapSheet) {
          const ws = workbook.Sheets[recapSheet];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          for (const row of data) {
            if (row[0] && String(row[0]).match(/\d{4}[_-]\d{2}/)) {
              periode = String(row[0]).trim();
              break;
            }
          }
        }
        
        const detailSheet = sheetNames.find(n => n.toLowerCase().includes('détail'));
        if (detailSheet) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[detailSheet]);
          for (const row of rows) {
            const tech = row['TECH'] || row['Tech'];
            const montant = parseFloat(row['Montant ST'] || 0);
            const dateRef = parseExcelDate(row['Date fin travaux'] || row['Date debut travaux']);
            
            if (tech && montant) {
              interventions.push({
                periode,
                nd: String(row['ND'] || ''),
                tech,
                articles: String(row['ARTICLES'] || '').trim(),
                montant_st: montant,
                intervention_date: dateRef?.toISOString().split('T')[0],
                week_number: dateRef ? getWeekNumber(dateRef) : null,
                month: dateRef ? dateRef.getMonth() + 1 : null,
                year: dateRef ? dateRef.getFullYear() : null,
              });
            }
          }
        }
        
        if (!periode && interventions.length > 0 && interventions[0].year) {
          periode = `${interventions[0].year}_${String(interventions[0].month).padStart(2, '0')} RCC`;
        }
        
      } else if (fileType === 'canal_powerbi' || fileType === 'canal_gst') {
        type = 'canal';
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        let minDate = null;
        
        for (const row of rows) {
          const techRaw = row['TECHNICIEN'] || row['Nom Technicien'] || '';
          const facturation = row['FACTURATION'] || row['facturation'] || '';
          const dateSolde = parseExcelDate(row['DATE SOLDE']);
          
          if (!techRaw) continue;
          
          const priceRow = canalPrices.find(p => p.code === facturation?.toUpperCase());
          const montantGset = priceRow?.gset_price || 0;
          const montantTech = priceRow?.tech_price || parseFloat(row['total facture'] || 0);
          
          if (dateSolde && (!minDate || dateSolde < minDate)) minDate = dateSolde;
          
          interventions.push({
            periode: '',
            tech: techRaw,
            tech_name: GSE_NAMES[techRaw] || techRaw,
            ref_pxo: String(row['Ref PXO'] || ''),
            facturation: facturation?.toUpperCase() || '',
            agence: row['Agence'] || '',
            montant_gset: montantGset,
            montant_tech: montantTech,
            intervention_date: dateSolde?.toISOString().split('T')[0],
            week_number: dateSolde ? getWeekNumber(dateSolde) : null,
            month: dateSolde ? dateSolde.getMonth() + 1 : null,
            year: dateSolde ? dateSolde.getFullYear() : null,
          });
        }
        
        if (minDate) {
          periode = `${minDate.getFullYear()}_${String(minDate.getMonth() + 1).padStart(2, '0')} Canal`;
        } else {
          periode = `Canal_${Date.now()}`;
        }
        
        interventions = interventions.map(i => ({ ...i, periode }));
        
      } else {
        throw new Error('Format de fichier non reconnu');
      }
      
      if (interventions.length === 0) {
        throw new Error('Aucune intervention trouvée dans le fichier');
      }
      
      // Insert into database
      if (type === 'orange') {
        await deleteOrangeInterventionsByPeriode(periode);
        await insertOrangeInterventions(interventions);
      } else {
        await deleteCanalInterventionsByPeriode(periode);
        await insertCanalInterventions(interventions);
      }
      
      // Create import record
      const totalMontant = type === 'orange' 
        ? interventions.reduce((s, i) => s + i.montant_st, 0)
        : interventions.reduce((s, i) => s + i.montant_gset, 0);
      
      await createImport({
        type,
        periode,
        filename: file.name,
        total_records: interventions.length,
        total_montant: totalMontant,
        imported_by: user?.id,
      });
      
      setResult({
        success: true,
        type,
        periode,
        records: interventions.length,
        montant: totalMontant,
      });
      
      onImportComplete?.();
      
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) processFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : `${t.border} ${t.bgHover}`
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} className="hidden" id="file-input" />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            {importing ? <LoadingSpinner size="lg" /> : (
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${t.accentLight}`}>
                <Upload className="w-10 h-10" />
              </div>
            )}
            <div>
              <p className={`font-semibold ${t.text} text-lg`}>{importing ? 'Import en cours...' : 'Glissez un fichier Excel'}</p>
              <p className={`text-sm ${t.textMuted} mt-1`}>ou cliquez pour sélectionner</p>
            </div>
          </div>
        </label>
      </div>

      {result && (
        <div className={`rounded-2xl p-5 ${result.success ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border border-red-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {result.success ? <Check className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              {result.success ? (
                <>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-400">Import réussi !</p>
                  <p className={`text-sm ${t.textSecondary} mt-1`}>
                    {result.records} interventions • {result.montant?.toLocaleString('fr-FR')}€
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-800 dark:text-red-400">Erreur</p>
                  <p className="text-sm text-red-600 mt-1">{result.error}</p>
                </>
              )}
            </div>
            <button onClick={() => setResult(null)} className={t.textMuted}><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// === IMPORT HISTORY ===
function ImportHistorySection({ imports, onDelete, onRefresh }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (imp) => {
    setDeleting(true);
    try {
      await deleteImport(imp.id, imp.type, imp.periode);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (imports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`w-16 h-16 ${t.bgTertiary} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          <Upload className={`w-8 h-8 ${t.textMuted}`} />
        </div>
        <p className={`${t.textMuted} font-medium`}>Aucun import</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {imports.map((imp) => (
        <div key={imp.id} className={`group ${t.bgTertiary} rounded-xl p-4 ${t.bgHover} transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${imp.type === 'orange' ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-purple-100 dark:bg-purple-500/20'}`}>
                <Upload className={`w-5 h-5 ${imp.type === 'orange' ? 'text-orange-500' : 'text-purple-500'}`} />
              </div>
              <div>
                <p className={`font-medium ${t.text}`}>{imp.periode}</p>
                <p className={`text-xs ${t.textMuted}`}>{imp.total_records} interv. • {imp.total_montant?.toLocaleString('fr-FR')}€</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${imp.type === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'}`}>
                {imp.type === 'orange' ? 'Orange' : 'Canal+'}
              </span>
              {confirmDelete === imp.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(imp)} disabled={deleting}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50">
                    {deleting ? <LoadingSpinner size="sm" /> : 'Confirmer'}
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className={`px-3 py-1.5 ${t.bgSecondary} ${t.textSecondary} text-xs font-medium rounded-lg`}>
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(imp.id)}
                  className={`p-2 ${t.textMuted} hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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

  useEffect(() => {
    getAvailableTechNames().then(setAvailableNames);
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
      // Create user in Supabase Auth (they'll get a confirmation email)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: Math.random().toString(36).slice(-12), // Temporary password
        options: {
          data: {
            username: newUser.username.toLowerCase(),
            name: newUser.name,
            role: 'tech'
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (signUpError) throw signUpError;
      
      setNewUser({ email: '', name: '', username: '' });
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAddAlias = async (profile) => {
    const alias = selectedAlias[profile.id];
    if (!alias) return;
    
    setSaving(profile.id);
    try {
      await updateProfile(profile.id, { aliases: [...(profile.aliases || []), alias] });
      setSelectedAlias(prev => ({ ...prev, [profile.id]: '' }));
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveAlias = async (profile, aliasToRemove) => {
    setSaving(profile.id);
    try {
      await updateProfile(profile.id, { aliases: (profile.aliases || []).filter(a => a !== aliasToRemove) });
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const getAvailableForUser = (profile) => {
    const userAliases = new Set((profile.aliases || []).map(a => a.toLowerCase()));
    return availableNames.filter(name => !usedAliases.has(name.toLowerCase()) || userAliases.has(name.toLowerCase()))
      .filter(name => !userAliases.has(name.toLowerCase()));
  };

  const techProfiles = profiles.filter(p => p.role === 'tech');
  const inputClass = `px-3 py-2 rounded-xl border outline-none ${t.input}`;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2 flex items-center gap-2`}>
          <Users className="w-4 h-4" /> Gestion des comptes
        </h4>
        <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
          Créez un compte avec email. Le technicien recevra un email pour définir son mot de passe.
        </p>
      </div>

      <div className={`rounded-2xl border ${t.card} p-4`}>
        <h3 className={`font-semibold ${t.text} mb-4`}>Créer un compte</h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Identifiant" value={newUser.username}
            onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))}
            className={inputClass} required />
          <input type="text" placeholder="Nom complet" value={newUser.name}
            onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))}
            className={inputClass} required />
          <input type="email" placeholder="Email" value={newUser.email}
            onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))}
            className={inputClass} required />
          <button type="submit" disabled={creating}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {creating ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
            Créer
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className={`p-4 border-b ${t.border}`}>
          <h3 className={`font-semibold ${t.text}`}>Techniciens ({techProfiles.length})</h3>
        </div>
        <div className={`divide-y ${t.borderLight} max-h-[600px] overflow-y-auto`}>
          {techProfiles.map((profile) => {
            const available = getAvailableForUser(profile);
            return (
              <div key={profile.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.accentLight}`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`font-medium ${t.text}`}>{profile.name}</p>
                      <p className={`text-xs ${t.textMuted}`}>@{profile.username} • {profile.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-xs ${t.textMuted} mb-2 block`}>Aliases</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(profile.aliases || []).map((alias, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm ${t.bgTertiary} ${t.text}`}>
                        <span className={alias.startsWith('GSE') ? 'font-mono text-purple-500' : ''}>{alias}</span>
                        <button onClick={() => handleRemoveAlias(profile, alias)} disabled={saving === profile.id} className={`${t.textMuted} hover:text-red-500`}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {(profile.aliases || []).length === 0 && <span className={`text-xs ${t.textMuted} italic`}>Aucun alias</span>}
                  </div>
                  <div className="flex gap-2">
                    <select value={selectedAlias[profile.id] || ''} onChange={(e) => setSelectedAlias(prev => ({ ...prev, [profile.id]: e.target.value }))}
                      className={`flex-1 ${inputClass}`}>
                      <option value="">Ajouter un alias...</option>
                      {available.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button onClick={() => handleAddAlias(profile)} disabled={!selectedAlias[profile.id] || saving === profile.id}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50">
                      {saving === profile.id ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {techProfiles.length === 0 && (
            <div className={`p-12 text-center ${t.textMuted}`}>Aucun technicien</div>
          )}
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
  const [saving, setSaving] = useState(false);

  const handleUpdatePrice = async (gridType, code, field, value) => {
    setSaving(true);
    try {
      const prices = gridType === 'orange' ? orangePrices : canalPrices;
      const current = prices.find(p => p.code === code);
      const gset = field === 'gset' ? parseFloat(value) : current?.gset_price || 0;
      const tech = field === 'tech' ? parseFloat(value) : current?.tech_price || 0;
      
      if (gridType === 'orange') {
        await updateOrangePrice(code, gset, tech);
      } else {
        await updateCanalPrice(code, gset, tech);
      }
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setEditingPrice(null);
    }
  };

  const tabClass = (active) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? t.accentLight : `${t.textSecondary} ${t.bgHover}`}`;

  const renderGrid = (prices, gridType) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className={t.bgTertiary}>
          <tr>
            <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Code</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix GSET</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix Tech</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Marge</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${t.borderLight}`}>
          {prices.map((p) => (
            <tr key={p.code} className={`${t.bgHover} transition-colors`}>
              <td className={`px-4 py-3 font-mono font-medium ${t.text}`}>{p.code}</td>
              <td className="px-4 py-3 text-right">
                {editingPrice === `${gridType}-${p.code}-gset` ? (
                  <input type="number" step="0.01" defaultValue={p.gset_price} autoFocus
                    onBlur={(e) => handleUpdatePrice(gridType, p.code, 'gset', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePrice(gridType, p.code, 'gset', e.target.value); if (e.key === 'Escape') setEditingPrice(null); }}
                    className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`} />
                ) : (
                  <button onClick={() => setEditingPrice(`${gridType}-${p.code}-gset`)}
                    className={`${gridType === 'orange' ? 'text-orange-500' : 'text-emerald-500'} px-2 py-1 rounded-lg ${t.bgHover}`}>
                    {p.gset_price?.toFixed(2)}€
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editingPrice === `${gridType}-${p.code}-tech` ? (
                  <input type="number" step="0.01" defaultValue={p.tech_price} autoFocus
                    onBlur={(e) => handleUpdatePrice(gridType, p.code, 'tech', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePrice(gridType, p.code, 'tech', e.target.value); if (e.key === 'Escape') setEditingPrice(null); }}
                    className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`} />
                ) : (
                  <button onClick={() => setEditingPrice(`${gridType}-${p.code}-tech`)}
                    className={`text-blue-500 px-2 py-1 rounded-lg ${t.bgHover}`}>
                    {p.tech_price?.toFixed(2)}€
                  </button>
                )}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${(p.gset_price - p.tech_price) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {(p.gset_price - p.tech_price).toFixed(2)}€
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('orange')} className={tabClass(activeTab === 'orange')}>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Grille Orange ({orangePrices.length} codes)
          </span>
        </button>
        <button onClick={() => setActiveTab('canal')} className={tabClass(activeTab === 'canal')}>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            Grille Canal+ ({canalPrices.length} codes)
          </span>
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className={`p-4 border-b ${t.border}`}>
          <h3 className={`font-semibold ${t.text}`}>
            {activeTab === 'orange' ? 'Grille Tarifaire Orange' : 'Grille Tarifaire Canal+'}
          </h3>
          <p className={`text-sm ${t.textMuted}`}>Cliquez sur un prix pour le modifier</p>
        </div>
        {activeTab === 'orange' ? renderGrid(orangePrices, 'orange') : renderGrid(canalPrices, 'canal')}
      </div>
    </div>
  );
}

// === MAIN DASHBOARD ===
function MainDashboard() {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut: logout } = useAuth();
  const t = themes[theme];
  
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [profiles, setProfiles] = useState([]);
  const [orangePrices, setOrangePrices] = useState([]);
  const [canalPrices, setCanalPrices] = useState([]);
  const [orangeInterventions, setOrangeInterventions] = useState([]);
  const [canalInterventions, setCanalInterventions] = useState([]);
  const [imports, setImportsData] = useState([]);
  const [periods, setPeriods] = useState({ years: [], monthsByYear: {}, weeksByYearMonth: {} });
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState('mensuel');

  const isDirection = profile?.role === 'dir';

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [profs, oPrices, cPrices, oInter, cInter, imps, pers] = await Promise.all([
        getAllProfiles(),
        getOrangePrices(),
        getCanalPrices(),
        getOrangeInterventions({ year: selectedYear, month: selectedMonth, week: viewMode === 'hebdo' ? selectedWeek : null }),
        getCanalInterventions({ year: selectedYear, month: selectedMonth, week: viewMode === 'hebdo' ? selectedWeek : null }),
        getImports(),
        getAvailablePeriods(),
      ]);
      
      setProfiles(profs);
      setOrangePrices(oPrices);
      setCanalPrices(cPrices);
      setOrangeInterventions(oInter);
      setCanalInterventions(cInter);
      setImportsData(imps);
      setPeriods(pers);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, selectedWeek, viewMode]);

  // Filter interventions for tech
  const filterForTech = (interventions, source) => {
    if (isDirection) return interventions;
    const aliases = profile?.aliases || [];
    return interventions.filter(i => {
      const tech = i.tech?.toLowerCase();
      return aliases.some(a => tech?.includes(a.toLowerCase()) || a.toLowerCase().includes(tech || ''));
    });
  };

  const filteredOrange = filterForTech(orangeInterventions, 'orange');
  const filteredCanal = filterForTech(canalInterventions, 'canal');

  // Calculate totals
  const orangeTotalGset = filteredOrange.reduce((s, i) => {
    const match = String(i.articles || '').match(/([A-Z]+\d*)/i);
    const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
    return s + (price?.gset_price || i.montant_st || 0);
  }, 0);

  const orangeTotalTech = filteredOrange.reduce((s, i) => {
    const match = String(i.articles || '').match(/([A-Z]+\d*)/i);
    const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
    return s + (price?.tech_price || i.montant_st * 0.55);
  }, 0);

  const canalTotalGset = filteredCanal.reduce((s, i) => s + (i.montant_gset || 0), 0);
  const canalTotalTech = filteredCanal.reduce((s, i) => s + (i.montant_tech || 0), 0);

  const totalST = orangeTotalGset + canalTotalGset;
  const totalTech = orangeTotalTech + canalTotalTech;
  const marge = totalST - totalTech;

  // Build all interventions for table
  const allInterventions = [
    ...filteredOrange.map(i => ({ ...i, source: 'orange' })),
    ...filteredCanal.map(i => ({ ...i, source: 'canal' })),
  ].sort((a, b) => new Date(b.intervention_date || 0) - new Date(a.intervention_date || 0));

  const getPeriodLabel = () => {
    if (!selectedYear) return 'Toutes périodes';
    let label = `${selectedYear}`;
    if (selectedMonth) {
      label = `${MONTHS.find(m => m.value === selectedMonth)?.label || ''} ${selectedYear}`;
      if (selectedWeek && viewMode === 'hebdo') label += ` • S${selectedWeek}`;
    }
    return label;
  };

  const navItems = isDirection ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'import', icon: Upload, label: 'Import' },
    { id: 'users', icon: Users, label: 'Comptes' },
    { id: 'prices', icon: Euro, label: 'Grilles' },
  ] : [
    { id: 'dashboard', icon: User, label: 'Mon Récap' },
  ];

  if (loading && !orangeInterventions.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.bg}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${t.bg} transition-colors`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${t.sidebar} transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <div><h1 className="font-bold text-white">GSET PLANS</h1><p className="text-xs text-gray-500">FTTH D3 Guyane</p></div>}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? t.sidebarActive : `${t.sidebarText} ${t.sidebarHover}`}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          {sidebarOpen && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50">
              <p className="text-xs text-gray-500">Connecté</p>
              <p className="font-medium text-white truncate text-sm">{profile?.name}</p>
              <span className={`text-xs ${isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>{isDirection ? 'Direction' : 'Technicien'}</span>
            </div>
          )}
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className={`${t.bgSecondary} border-b ${t.border} px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-xl ${t.bgHover}`}>
              {sidebarOpen ? <X className={`w-5 h-5 ${t.textSecondary}`} /> : <Menu className={`w-5 h-5 ${t.textSecondary}`} />}
            </button>
            <h2 className={`text-xl font-semibold ${t.text}`}>{navItems.find(n => n.id === view)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover}`}>
              <RefreshCw className={`w-5 h-5 ${t.textSecondary}`} />
            </button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover}`}>
              {theme === 'light' ? <Moon className={`w-5 h-5 ${t.textSecondary}`} /> : <Sun className="w-5 h-5 text-yellow-400" />}
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
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

              <div className={`grid grid-cols-2 ${isDirection ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
                {isDirection && <StatCard icon={Euro} label="Total Facturé" value={totalST.toLocaleString('fr-FR') + '€'} color="emerald" />}
                <StatCard icon={TrendingUp} label="Orange" value={(isDirection ? orangeTotalGset : orangeTotalTech).toLocaleString('fr-FR') + '€'} sub={`${filteredOrange.length} interv.`} color="orange" />
                <StatCard icon={PieChart} label="Canal+" value={(isDirection ? canalTotalGset : canalTotalTech).toLocaleString('fr-FR') + '€'} sub={`${filteredCanal.length} interv.`} color="purple" />
                <StatCard icon={User} label={isDirection ? 'À payer' : 'Total'} value={totalTech.toLocaleString('fr-FR') + '€'} color="blue" />
                {isDirection && <StatCard icon={BarChart3} label="Marge GSET" value={marge.toLocaleString('fr-FR') + '€'} sub={totalST > 0 ? `${((marge/totalST)*100).toFixed(0)}%` : ''} color="teal" />}
              </div>

              <InterventionsTable interventions={allInterventions} title="Détail des interventions" showTech={isDirection} orangePrices={orangePrices} />
            </>
          )}

          {isDirection && view === 'import' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${t.card}`}>
                <h3 className={`font-semibold ${t.text} mb-4`}>Importer des données</h3>
                <FileImportSection orangePrices={orangePrices} canalPrices={canalPrices} onImportComplete={loadData} />
              </div>
              <div className={`rounded-2xl p-6 border ${t.card}`}>
                <h3 className={`font-semibold ${t.text} mb-4`}>Historique des imports</h3>
                <ImportHistorySection imports={imports} onRefresh={loadData} />
              </div>
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

  useEffect(() => {
    // Check initial session
    getSession().then(async (sess) => {
      setSession(sess);
      if (sess?.user) {
        try {
          const prof = await getProfile(sess.user.id);
          setProfile(prof);
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, sess) => {
      setSession(sess);
      if (sess?.user) {
        try {
          const prof = await getProfile(sess.user.id);
          setProfile(prof);
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <AuthContext.Provider value={{ user: session?.user, profile, signOut }}>
        <MainDashboard />
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
