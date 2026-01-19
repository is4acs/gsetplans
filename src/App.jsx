import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  Upload, LayoutDashboard, LogOut, Menu, X, Settings, Sun, Moon,
  TrendingUp, Euro, Calendar, BarChart3, PieChart, User, Plus, Trash2, 
  Save, Link, ChevronDown, Filter, ChevronRight, Edit3, Check, Zap
} from 'lucide-react';
import FileImport from './components/FileImport';
import ImportHistory from './components/ImportHistory';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

// === THEME CONTEXT ===
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

// === DEFAULT CANAL PRICES ===
const DEFAULT_CANAL_PRICES = {
  AERC: { gset: 117.45, tech: 70.47 }, BPMS: { gset: 84.40, tech: 50.64 },
  CHRC: { gset: 169.50, tech: 101.70 }, FARC: { gset: 156.60, tech: 93.96 },
  INRC: { gset: 139.26, tech: 83.56 }, PBEA: { gset: 288.77, tech: 173.26 },
  PBEC: { gset: 201.30, tech: 120.78 }, PBEF: { gset: 280.15, tech: 168.09 },
  PBIS: { gset: 176.12, tech: 105.67 }, PDOS: { gset: 89.00, tech: 53.40 },
  SAVD: { gset: 240.00, tech: 144.00 }, SAVS: { gset: 73.87, tech: 44.32 },
  SAVG: { gset: 73.87, tech: 44.32 }, TXPA: { gset: 119.00, tech: 71.40 },
  TXPB: { gset: 178.50, tech: 107.10 }, TXPC: { gset: 373.10, tech: 223.86 },
  TXPD: { gset: 174.20, tech: 104.52 },
};

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

const DEFAULT_SETTINGS = { 
  coefficients: { orange: 0.5 }, 
  canalPrices: DEFAULT_CANAL_PRICES,
  theme: 'light'
};

const DEFAULT_USERS = {
  admin: { password: 'admin123', role: 'dir', name: 'Direction GSET', aliases: [] },
  zakaria: { password: 'zak123', role: 'tech', name: 'Zakaria Settou', aliases: ['SETTOU Zakaria', 'GSE 19'] },
  jahwer: { password: 'jah123', role: 'tech', name: 'Jahwer Sellemi', aliases: ['GSE 17', 'GSE 03'] },
  maxime: { password: 'max123', role: 'tech', name: 'Maxime Paul', aliases: ['Maxime Paul', 'GSE 05'] },
  alan: { password: 'ala123', role: 'tech', name: 'Alan Pantoja', aliases: ['GSE 04'] },
  sauvenel: { password: 'sau123', role: 'tech', name: 'Dautruche Sauvenel', aliases: ['GSE 16', 'DAUTRUCHE Sauvenel'] },
  carlos: { password: 'car123', role: 'tech', name: 'Carlos', aliases: ['GSE 06'] },
  bakour: { password: 'bak123', role: 'tech', name: 'Bakour Fallah', aliases: ['GSE 18'] },
  wendelle: { password: 'wen123', role: 'tech', name: 'Wendelle Edwige', aliases: ['GSE 02'] },
  cyrile: { password: 'cyr123', role: 'tech', name: 'Cyrile Luckmane', aliases: ['GSE 15', 'LUCKMANE Cyrile'] },
  macedo: { password: 'mac123', role: 'tech', name: 'Macedo Pansa', aliases: ['PANSA Macedo'] },
  prochette: { password: 'pro123', role: 'tech', name: 'Jean Paulin Prochette', aliases: ['PROCHETTE Jean paulin'] },
  claude: { password: 'cla123', role: 'tech', name: 'Claude', aliases: ['Claude'] },
};

// === HELPERS ===
function getSettings() {
  const saved = localStorage.getItem('ftth_settings');
  if (saved) {
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_SETTINGS, ...parsed, canalPrices: { ...DEFAULT_CANAL_PRICES, ...parsed.canalPrices } };
  }
  return DEFAULT_SETTINGS;
}

function getUsers() {
  const saved = localStorage.getItem('ftth_users');
  if (saved) {
    const users = JSON.parse(saved);
    Object.keys(users).forEach(k => { if (!users[k].aliases) users[k].aliases = []; });
    return users;
  }
  return DEFAULT_USERS;
}

function getAvailableTechNames() {
  const names = new Set();
  const orangeData = JSON.parse(localStorage.getItem('ftth_orange_data') || '{}');
  const canalData = JSON.parse(localStorage.getItem('ftth_canal_data') || '{}');
  Object.values(orangeData).forEach(d => Object.keys(d.byTech || {}).forEach(n => names.add(n)));
  Object.values(canalData).forEach(d => Object.keys(d.byTech || {}).forEach(n => names.add(n)));
  return Array.from(names).sort();
}

function getAllRecords(data) {
  const records = { orange: [], canal: [] };
  Object.values(data.orange).forEach(d => (d.records || []).forEach(r => records.orange.push(r)));
  Object.values(data.canal).forEach(d => (d.records || []).forEach(r => records.canal.push(r)));
  return records;
}

function getAvailablePeriodsFromRecords(data) {
  const records = getAllRecords(data);
  const allRecords = [...records.orange, ...records.canal];
  const years = new Set();
  const monthsByYear = {};
  const weeksByYearMonth = {};
  
  allRecords.forEach(r => {
    if (r.year && r.month) {
      years.add(r.year);
      if (!monthsByYear[r.year]) monthsByYear[r.year] = new Set();
      monthsByYear[r.year].add(r.month);
      if (r.week) {
        const key = `${r.year}_${r.month}`;
        if (!weeksByYearMonth[key]) weeksByYearMonth[key] = new Set();
        weeksByYearMonth[key].add(r.week);
      }
    }
  });
  
  return {
    years: Array.from(years).sort((a, b) => b - a),
    monthsByYear: Object.fromEntries(Object.entries(monthsByYear).map(([y, m]) => [y, Array.from(m).sort((a, b) => a - b)])),
    weeksByYearMonth: Object.fromEntries(Object.entries(weeksByYearMonth).map(([k, w]) => [k, Array.from(w).sort((a, b) => a - b)])),
  };
}

function filterRecordsByDate(records, year, month, week) {
  return records.filter(r => {
    if (year && r.year !== year) return false;
    if (month && r.month !== month) return false;
    if (week && r.week !== week) return false;
    return true;
  });
}

function buildFilteredData(data, year, month, week) {
  const result = { orange: {}, canal: {} };
  
  Object.entries(data.orange).forEach(([periode, periodeData]) => {
    const filtered = filterRecordsByDate(periodeData.records || [], year, month, week);
    if (filtered.length > 0) {
      const byTech = {};
      filtered.forEach(r => { if (!byTech[r.tech]) byTech[r.tech] = []; byTech[r.tech].push(r); });
      result.orange[periode] = { records: filtered, byTech, totalRecords: filtered.length, totalMontant: filtered.reduce((s, r) => s + (r.montant || 0), 0) };
    }
  });
  
  Object.entries(data.canal).forEach(([periode, periodeData]) => {
    const filtered = filterRecordsByDate(periodeData.records || [], year, month, week);
    if (filtered.length > 0) {
      const byTech = {};
      filtered.forEach(r => { if (!byTech[r.tech]) byTech[r.tech] = []; byTech[r.tech].push(r); });
      result.canal[periode] = { records: filtered, byTech, totalRecords: filtered.length, 
        totalMontantGset: filtered.reduce((s, r) => s + (r.montantGset || 0), 0),
        totalMontantTech: filtered.reduce((s, r) => s + (r.montantTech || 0), 0) };
    }
  });
  
  return result;
}

function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// === THEME STYLES ===
const themes = {
  light: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-100',
    bgHover: 'hover:bg-gray-50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    border: 'border-gray-200',
    borderLight: 'border-gray-100',
    input: 'bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20',
    card: 'bg-white border-gray-100 shadow-sm',
    cardHover: 'hover:shadow-md hover:border-gray-200',
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-600',
    accentLight: 'bg-emerald-50 text-emerald-700',
    sidebar: 'bg-gray-900',
    sidebarText: 'text-gray-300',
    sidebarHover: 'hover:bg-gray-800',
    sidebarActive: 'bg-emerald-500/20 text-emerald-400',
  },
  dark: {
    bg: 'bg-gray-950',
    bgSecondary: 'bg-gray-900',
    bgTertiary: 'bg-gray-800',
    bgHover: 'hover:bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500',
    border: 'border-gray-800',
    borderLight: 'border-gray-800/50',
    input: 'bg-gray-800 border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20',
    card: 'bg-gray-900 border-gray-800 shadow-lg shadow-black/20',
    cardHover: 'hover:border-gray-700',
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-400',
    accentLight: 'bg-emerald-500/10 text-emerald-400',
    sidebar: 'bg-black',
    sidebarText: 'text-gray-400',
    sidebarHover: 'hover:bg-gray-900',
    sidebarActive: 'bg-emerald-500/20 text-emerald-400',
  }
};

// === PERIOD SELECTOR ===
function PeriodSelector({ data, selectedYear, selectedMonth, selectedWeek, viewMode, onYearChange, onMonthChange, onWeekChange, onViewModeChange }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const periods = useMemo(() => getAvailablePeriodsFromRecords(data), [data]);
  const availableMonths = useMemo(() => selectedYear ? (periods.monthsByYear[selectedYear] || []) : [], [periods, selectedYear]);
  const availableWeeks = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    return periods.weeksByYearMonth[`${selectedYear}_${selectedMonth}`] || [];
  }, [periods, selectedYear, selectedMonth]);

  const selectClass = `px-3 py-2 rounded-lg text-sm outline-none transition-all ${t.input} border`;

  return (
    <div className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl border ${t.card}`}>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${t.accentLight}`}>
          <Filter className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium ${t.text}`}>Filtrer</span>
      </div>
      
      <select value={selectedYear || ''} onChange={(e) => { onYearChange(e.target.value ? parseInt(e.target.value) : null); onMonthChange(null); onWeekChange(null); }}
        className={selectClass}>
        <option value="">Toutes années</option>
        {periods.years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <select value={selectedMonth || ''} onChange={(e) => { onMonthChange(e.target.value ? parseInt(e.target.value) : null); onWeekChange(null); }}
        disabled={!selectedYear} className={`${selectClass} disabled:opacity-50`}>
        <option value="">Tous mois</option>
        {MONTHS.filter(m => availableMonths.includes(m.value)).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      {viewMode === 'hebdo' && (
        <select value={selectedWeek || ''} onChange={(e) => onWeekChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedMonth} className={`${selectClass} disabled:opacity-50`}>
          <option value="">Toutes semaines</option>
          {availableWeeks.map(w => <option key={w} value={w}>S{w}</option>)}
        </select>
      )}

      <div className={`flex items-center gap-1 p-1 rounded-lg ${t.bgTertiary}`}>
        <button onClick={() => { onViewModeChange('mensuel'); onWeekChange(null); }}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'mensuel' ? `${t.bgSecondary} shadow-sm ${t.text} font-medium` : t.textSecondary}`}>
          Mois
        </button>
        <button onClick={() => onViewModeChange('hebdo')}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'hebdo' ? `${t.bgSecondary} shadow-sm ${t.text} font-medium` : t.textSecondary}`}>
          Semaine
        </button>
      </div>

      {(selectedYear || selectedMonth) && (
        <button onClick={() => { onYearChange(null); onMonthChange(null); onWeekChange(null); }}
          className={`px-3 py-1.5 text-sm ${t.textMuted} hover:${t.textSecondary} transition-colors`}>
          Réinitialiser
        </button>
      )}
    </div>
  );
}

// === LOGIN ===
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = getUsers();
    const user = users[username.toLowerCase()];
    if (user && user.password === password) {
      onLogin({ username: username.toLowerCase(), ...user });
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
      <div className={`w-full max-w-md ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-3xl border shadow-2xl overflow-hidden`}>
        <div className={`p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">GSET PLANS</h1>
                  <p className="text-emerald-100 text-sm">FTTH D3 Guyane</p>
                </div>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Identifiant</label>
              <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-200 focus:border-emerald-500 focus:bg-white'
                }`} placeholder="admin" />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mot de passe</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-200 focus:border-emerald-500 focus:bg-white'
                }`} placeholder="••••••••" />
            </div>
            {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
              Connexion
            </button>
          </form>

          <div className={`mt-6 p-4 rounded-xl text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <p className="font-medium mb-2">Accès rapide:</p>
            <div className="grid grid-cols-2 gap-1">
              <p>• <span className="font-mono">admin</span> / admin123</p>
              <p>• <span className="font-mono">zakaria</span> / zak123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === STAT CARD ===
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  const { theme } = useTheme();
  const t = themes[theme];
  
  const colors = {
    emerald: { bg: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    orange: { bg: theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-500/20' },
    purple: { bg: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-500/20' },
    blue: { bg: theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-500/20' },
    teal: { bg: theme === 'dark' ? 'bg-teal-500/10' : 'bg-teal-50', text: 'text-teal-500', border: 'border-teal-500/20' },
  };
  const c = colors[color] || colors.emerald;

  return (
    <div className={`rounded-2xl p-5 border transition-all ${t.card} ${t.cardHover}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className={`text-sm ${t.textSecondary} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
      {sub && <p className={`text-xs ${t.textMuted} mt-1`}>{sub}</p>}
    </div>
  );
}

// === FILTER DATA FOR TECH ===
function filterDataForTech(data, user) {
  const aliases = user.aliases || [];
  const matchesTech = (name) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    return aliases.some(alias => {
      const a = alias.toLowerCase().trim();
      return n === a || n.includes(a) || a.includes(n);
    });
  };

  const filtered = { orange: {}, canal: {} };

  Object.entries(data.orange).forEach(([periode, periodeData]) => {
    const techRecords = [];
    Object.entries(periodeData.byTech || {}).forEach(([tech, records]) => {
      if (matchesTech(tech)) techRecords.push(...records);
    });
    if (techRecords.length > 0) {
      filtered.orange[periode] = { records: techRecords, totalRecords: techRecords.length, totalMontant: techRecords.reduce((s, r) => s + (r.montant || 0), 0) };
    }
  });

  Object.entries(data.canal).forEach(([periode, periodeData]) => {
    const techRecords = [];
    Object.entries(periodeData.byTech || {}).forEach(([tech, records]) => {
      if (matchesTech(tech)) techRecords.push(...records);
    });
    if (techRecords.length > 0) {
      filtered.canal[periode] = { records: techRecords, totalRecords: techRecords.length,
        totalMontantGset: techRecords.reduce((s, r) => s + (r.montantGset || 0), 0),
        totalMontantTech: techRecords.reduce((s, r) => s + (r.montantTech || 0), 0) };
    }
  });

  return filtered;
}

// === INTERVENTIONS TABLE ===
function InterventionsTable({ interventions, title, showTech = true }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [showAll, setShowAll] = useState(false);
  const [limit, setLimit] = useState(20);
  
  const displayedInterventions = showAll ? interventions : interventions.slice(0, limit);
  const hasMore = interventions.length > limit;

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
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Référence</th>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Type</th>
              <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Montant ST</th>
              <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix Tech</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${t.borderLight}`}>
            {displayedInterventions.map((inter, i) => (
              <tr key={i} className={`${t.bgHover} transition-colors`}>
                <td className={`px-4 py-3 ${t.textSecondary} font-mono text-xs`}>{formatDate(inter.date)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    inter.source === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                  }`}>{inter.source === 'orange' ? 'Orange' : 'Canal+'}</span>
                </td>
                {showTech && <td className={`px-4 py-3 ${t.text}`}>{inter.techName || inter.tech}</td>}
                <td className={`px-4 py-3 font-mono ${t.textSecondary} text-xs`}>{inter.nd || inter.refPxo || '-'}</td>
                <td className={`px-4 py-3 ${t.textSecondary}`}>{inter.articles || inter.facturation || '-'}</td>
                <td className={`px-4 py-3 text-right ${t.text}`}>{(inter.montant || inter.montantGset || 0).toLocaleString('fr-FR')}€</td>
                <td className={`px-4 py-3 text-right font-semibold text-emerald-500`}>{(inter.prixTech || 0).toLocaleString('fr-FR')}€</td>
              </tr>
            ))}
            {interventions.length === 0 && (
              <tr><td colSpan={7} className={`px-4 py-12 text-center ${t.textMuted}`}>Aucune intervention pour cette période</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && !showAll && (
        <div className={`p-4 border-t ${t.border} text-center`}>
          <button onClick={() => setShowAll(true)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${t.accentLight} hover:bg-emerald-100 dark:hover:bg-emerald-500/20 flex items-center gap-2 mx-auto`}>
            Afficher tout ({interventions.length - limit} de plus)
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
      {showAll && interventions.length > 20 && (
        <div className={`p-4 border-t ${t.border} text-center`}>
          <button onClick={() => setShowAll(false)} className={`px-6 py-2.5 rounded-xl text-sm font-medium ${t.textSecondary} ${t.bgHover}`}>
            Réduire
          </button>
        </div>
      )}
    </div>
  );
}

// === DIRECTION DASHBOARD ===
function DirectionDashboard({ filteredData, selectedYear, selectedMonth, selectedWeek, viewMode }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const settings = getSettings();
  const users = getUsers();
  const coefOrange = settings.coefficients.orange;

  const orangeTotal = Object.values(filteredData.orange).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const orangeRecords = Object.values(filteredData.orange).reduce((s, d) => s + (d.totalRecords || 0), 0);
  const orangeTechPay = orangeTotal * coefOrange;

  const canalTotalGset = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalMontantGset || 0), 0);
  const canalTotalTech = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalMontantTech || 0), 0);
  const canalRecords = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalRecords || 0), 0);

  const totalST = orangeTotal + canalTotalGset;
  const totalTechPay = orangeTechPay + canalTotalTech;
  const margeGSET = totalST - totalTechPay;

  const techData = {};
  const aliasToUser = {};
  Object.entries(users).forEach(([username, u]) => {
    if (u.role === 'tech' && u.aliases) u.aliases.forEach(alias => { aliasToUser[alias.toLowerCase()] = username; });
  });

  Object.values(filteredData.orange).forEach(d => {
    Object.entries(d.byTech || {}).forEach(([tech, records]) => {
      const username = aliasToUser[tech.toLowerCase()] || tech;
      const displayName = users[username]?.name || GSE_NAMES[tech] || tech;
      if (!techData[displayName]) techData[displayName] = { orange: 0, orangeTech: 0, canalGset: 0, canalTech: 0, count: 0 };
      const sum = records.reduce((s, r) => s + r.montant, 0);
      techData[displayName].orange += sum;
      techData[displayName].orangeTech += sum * coefOrange;
      techData[displayName].count += records.length;
    });
  });

  Object.values(filteredData.canal).forEach(d => {
    Object.entries(d.byTech || {}).forEach(([tech, records]) => {
      const username = aliasToUser[tech.toLowerCase()] || tech;
      const displayName = users[username]?.name || GSE_NAMES[tech] || tech;
      if (!techData[displayName]) techData[displayName] = { orange: 0, orangeTech: 0, canalGset: 0, canalTech: 0, count: 0 };
      techData[displayName].canalGset += records.reduce((s, r) => s + (r.montantGset || 0), 0);
      techData[displayName].canalTech += records.reduce((s, r) => s + (r.montantTech || 0), 0);
      techData[displayName].count += records.length;
    });
  });

  const getPeriodLabel = () => {
    if (!selectedYear) return 'Toutes périodes';
    let label = `${selectedYear}`;
    if (selectedMonth) {
      label = `${MONTHS.find(m => m.value === selectedMonth)?.label || ''} ${selectedYear}`;
      if (selectedWeek && viewMode === 'hebdo') label += ` • Semaine ${selectedWeek}`;
    }
    return label;
  };

  const chartData = Object.entries(techData)
    .map(([name, d]) => ({ name: name.split(' ')[0], orange: d.orange, canal: d.canalGset, total: d.orange + d.canalGset }))
    .sort((a, b) => b.total - a.total).slice(0, 8);

  const pieData = [
    { name: 'Marge GSET', value: margeGSET, color: '#10b981' },
    { name: 'Techniciens', value: totalTechPay, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  const allInterventions = [];
  Object.values(filteredData.orange).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'orange', prixTech: (r.montant || 0) * coefOrange }));
  });
  Object.values(filteredData.canal).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'canal', prixTech: r.montantTech || 0 }));
  });
  allInterventions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className={`rounded-2xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600`}>
        <p className="text-emerald-100 text-sm mb-1">Période</p>
        <p className="text-white text-2xl font-bold">{getPeriodLabel()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Euro} label="Total Facturé" value={totalST.toLocaleString('fr-FR') + '€'} color="emerald" />
        <StatCard icon={TrendingUp} label="Orange" value={orangeTotal.toLocaleString('fr-FR') + '€'} sub={`${orangeRecords} interv.`} color="orange" />
        <StatCard icon={PieChart} label="Canal+" value={canalTotalGset.toLocaleString('fr-FR') + '€'} sub={`${canalRecords} interv.`} color="purple" />
        <StatCard icon={User} label="À payer" value={totalTechPay.toLocaleString('fr-FR') + '€'} color="blue" />
        <StatCard icon={BarChart3} label="Marge GSET" value={margeGSET.toLocaleString('fr-FR') + '€'} sub={totalST > 0 ? `${((margeGSET/totalST)*100).toFixed(0)}%` : ''} color="teal" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${t.card}`}>
          <h3 className={`font-semibold ${t.text} mb-4`}>Production par technicien</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
                <XAxis type="number" tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
                <YAxis type="category" dataKey="name" width={70} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
                <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="orange" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                <Bar dataKey="canal" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className={`h-64 flex items-center justify-center ${t.textMuted}`}>Aucune donnée</div>}
        </div>

        <div className={`rounded-2xl p-6 border ${t.card}`}>
          <h3 className={`font-semibold ${t.text} mb-4`}>Répartition</h3>
          {pieData.length > 0 && pieData[0].value > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          ) : <div className={`h-64 flex items-center justify-center ${t.textMuted}`}>Aucune donnée</div>}
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className={`text-sm ${t.textSecondary}`}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Table */}
      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className={`p-4 border-b ${t.border}`}>
          <h3 className={`font-semibold ${t.text}`}>Récapitulatif par technicien</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={t.bgTertiary}>
              <tr>
                <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Technicien</th>
                <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Orange</th>
                <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Canal+</th>
                <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Total ST</th>
                <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix Tech</th>
                <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Marge</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${t.borderLight}`}>
              {Object.entries(techData).sort((a, b) => (b[1].orange + b[1].canalGset) - (a[1].orange + a[1].canalGset))
                .map(([tech, d]) => {
                  const total = d.orange + d.canalGset;
                  const techPay = d.orangeTech + d.canalTech;
                  return (
                    <tr key={tech} className={`${t.bgHover} transition-colors`}>
                      <td className={`px-4 py-3 font-medium ${t.text}`}>{tech}</td>
                      <td className="px-4 py-3 text-right text-orange-500">{d.orange.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right text-purple-500">{d.canalGset.toLocaleString('fr-FR')}€</td>
                      <td className={`px-4 py-3 text-right ${t.text}`}>{total.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-500">{techPay.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-500">{(total - techPay).toLocaleString('fr-FR')}€</td>
                    </tr>
                  );
                })}
              {Object.keys(techData).length === 0 && (
                <tr><td colSpan={6} className={`px-4 py-12 text-center ${t.textMuted}`}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interventions */}
      <InterventionsTable interventions={allInterventions} title="Détail des interventions" />
    </div>
  );
}

// === SETTINGS PAGE ===
function SettingsPage({ onSave }) {
  const { theme, setTheme } = useTheme();
  const t = themes[theme];
  const [settings, setSettings] = useState(getSettings());
  const [users, setUsers] = useState(getUsers());
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '' });
  const [selectedAlias, setSelectedAlias] = useState({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('techs');
  const [editingPrice, setEditingPrice] = useState(null);
  
  const availableNames = useMemo(() => getAvailableTechNames(), []);
  const usedAliases = useMemo(() => {
    const used = new Set();
    Object.values(users).forEach(u => (u.aliases || []).forEach(a => used.add(a.toLowerCase())));
    return used;
  }, [users]);

  const handleSave = () => {
    localStorage.setItem('ftth_settings', JSON.stringify(settings));
    localStorage.setItem('ftth_users', JSON.stringify(users));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave?.();
  };

  const updatePrice = (code, field, value) => {
    const numVal = parseFloat(value) || 0;
    setSettings(s => ({
      ...s,
      canalPrices: { ...s.canalPrices, [code]: { ...s.canalPrices[code], [field]: numVal } }
    }));
  };

  const addUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    setUsers(prev => ({ ...prev, [newUser.username.toLowerCase()]: { password: newUser.password, role: 'tech', name: newUser.name, aliases: [] } }));
    setNewUser({ username: '', password: '', name: '' });
  };

  const deleteUser = (username) => {
    if (username === 'admin') return;
    setUsers(prev => { const copy = { ...prev }; delete copy[username]; return copy; });
  };

  const addAlias = (username) => {
    const alias = selectedAlias[username];
    if (!alias) return;
    setUsers(prev => ({ ...prev, [username]: { ...prev[username], aliases: [...(prev[username].aliases || []), alias] } }));
    setSelectedAlias(prev => ({ ...prev, [username]: '' }));
  };

  const removeAlias = (username, aliasToRemove) => {
    setUsers(prev => ({ ...prev, [username]: { ...prev[username], aliases: (prev[username].aliases || []).filter(a => a !== aliasToRemove) } }));
  };

  const getAvailableForUser = (username) => {
    const userAliases = new Set((users[username]?.aliases || []).map(a => a.toLowerCase()));
    return availableNames.filter(name => !usedAliases.has(name.toLowerCase()) || userAliases.has(name.toLowerCase())).filter(name => !userAliases.has(name.toLowerCase()));
  };

  const techUsers = Object.entries(users).filter(([, u]) => u.role === 'tech');
  const inputClass = `px-3 py-2 rounded-xl border outline-none transition-all ${t.input}`;
  const tabClass = (active) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? `${t.accentLight}` : `${t.textSecondary} ${t.bgHover}`}`;

  return (
    <div className="space-y-6">
      {/* Theme Toggle */}
      <div className={`rounded-2xl p-4 border ${t.card} flex items-center justify-between`}>
        <div>
          <h3 className={`font-semibold ${t.text}`}>Apparence</h3>
          <p className={`text-sm ${t.textMuted}`}>Basculer entre thème clair et sombre</p>
        </div>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className={`p-3 rounded-xl ${t.bgTertiary} ${t.bgHover} transition-all`}>
          {theme === 'light' ? <Moon className={`w-5 h-5 ${t.textSecondary}`} /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('techs')} className={tabClass(activeTab === 'techs')}>Techniciens & Fusion</button>
        <button onClick={() => setActiveTab('coef')} className={tabClass(activeTab === 'coef')}>Coefficients</button>
        <button onClick={() => setActiveTab('prices')} className={tabClass(activeTab === 'prices')}>Grille Canal+</button>
      </div>

      {activeTab === 'techs' && (
        <div className="space-y-6">
          <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <h4 className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2 flex items-center gap-2`}><Link className="w-4 h-4" /> Système de Fusion</h4>
            <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Associez les noms/codes des fichiers importés à chaque technicien.</p>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
            <div className={`p-4 border-b ${t.border} flex justify-between items-center`}>
              <h3 className={`font-semibold ${t.text}`}>Techniciens</h3>
              <span className={`text-xs ${t.textMuted}`}>{availableNames.length} noms disponibles</span>
            </div>
            <div className={`divide-y ${t.borderLight} max-h-[500px] overflow-y-auto`}>
              {techUsers.map(([username, u]) => {
                const availableForThis = getAvailableForUser(username);
                return (
                  <div key={username} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.accentLight}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-medium ${t.text}`}>{u.name}</p>
                          <p className={`text-xs ${t.textMuted}`}>@{username}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteUser(username)} className={`p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="ml-13 pl-10">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(u.aliases || []).map((alias, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm ${t.bgTertiary} ${t.text}`}>
                            <span className={alias.startsWith('GSE') ? 'font-mono text-purple-500' : ''}>{alias}</span>
                            <button onClick={() => removeAlias(username, alias)} className={`${t.textMuted} hover:text-red-500`}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        {(u.aliases || []).length === 0 && <span className={`text-xs ${t.textMuted} italic`}>Aucun alias</span>}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select value={selectedAlias[username] || ''} onChange={(e) => setSelectedAlias(prev => ({ ...prev, [username]: e.target.value }))}
                            className={`w-full ${inputClass} appearance-none pr-10`}>
                            <option value="">Sélectionner un alias...</option>
                            {availableForThis.map(name => <option key={name} value={name}>{name}</option>)}
                          </select>
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted} pointer-events-none`} />
                        </div>
                        <button onClick={() => addAlias(username)} disabled={!selectedAlias[username]}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`p-4 border-t ${t.border} ${t.bgTertiary}`}>
              <p className={`text-sm font-medium ${t.text} mb-3`}>Ajouter un technicien</p>
              <div className="flex gap-2 flex-wrap">
                <input type="text" placeholder="Login" value={newUser.username} onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))}
                  className={`${inputClass} flex-1 min-w-[120px]`} />
                <input type="text" placeholder="Mot de passe" value={newUser.password} onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
                  className={`${inputClass} flex-1 min-w-[120px]`} />
                <input type="text" placeholder="Nom complet" value={newUser.name} onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))}
                  className={`${inputClass} flex-1 min-w-[150px]`} />
                <button onClick={addUser} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coef' && (
        <div className={`rounded-2xl p-6 border ${t.card}`}>
          <h3 className={`font-semibold ${t.text} mb-2`}>Coefficient Orange</h3>
          <p className={`text-sm ${t.textMuted} mb-4`}>Pourcentage du montant ST reversé aux techniciens</p>
          <div className="flex items-center gap-4 max-w-xs">
            <input type="range" min="0" max="1" step="0.05" value={settings.coefficients.orange}
              onChange={(e) => setSettings(s => ({ ...s, coefficients: { ...s.coefficients, orange: parseFloat(e.target.value) }}))}
              className="flex-1 accent-emerald-500" />
            <span className={`text-2xl font-bold ${t.text} w-20 text-right`}>{((settings.coefficients.orange || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {activeTab === 'prices' && (
        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
          <div className={`p-4 border-b ${t.border} flex justify-between items-center`}>
            <div>
              <h3 className={`font-semibold ${t.text}`}>Grille Tarifaire Canal+</h3>
              <p className={`text-sm ${t.textMuted}`}>Cliquez sur un prix pour le modifier</p>
            </div>
            <button onClick={() => setSettings(s => ({ ...s, canalPrices: DEFAULT_CANAL_PRICES }))}
              className={`text-sm ${t.textMuted} ${t.bgHover} px-3 py-1.5 rounded-lg`}>
              Réinitialiser
            </button>
          </div>
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
                {Object.entries(settings.canalPrices || {}).map(([code, prices]) => (
                  <tr key={code} className={`${t.bgHover} transition-colors`}>
                    <td className={`px-4 py-3 font-mono font-medium ${t.text}`}>{code}</td>
                    <td className="px-4 py-3 text-right">
                      {editingPrice === `${code}-gset` ? (
                        <input type="number" step="0.01" defaultValue={prices.gset} autoFocus
                          onBlur={(e) => { updatePrice(code, 'gset', e.target.value); setEditingPrice(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { updatePrice(code, 'gset', e.target.value); setEditingPrice(null); }}}
                          className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`} />
                      ) : (
                        <button onClick={() => setEditingPrice(`${code}-gset`)}
                          className={`text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors`}>
                          {prices.gset.toFixed(2)}€
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingPrice === `${code}-tech` ? (
                        <input type="number" step="0.01" defaultValue={prices.tech} autoFocus
                          onBlur={(e) => { updatePrice(code, 'tech', e.target.value); setEditingPrice(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { updatePrice(code, 'tech', e.target.value); setEditingPrice(null); }}}
                          className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`} />
                      ) : (
                        <button onClick={() => setEditingPrice(`${code}-tech`)}
                          className={`text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-2 py-1 rounded-lg transition-colors`}>
                          {prices.tech.toFixed(2)}€
                        </button>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${prices.gset - prices.tech > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {(prices.gset - prices.tech).toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${
            saved ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
          }`}>
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// === TECH DASHBOARD ===
function TechDashboard({ filteredData, user, selectedYear, selectedMonth, selectedWeek, viewMode }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const settings = getSettings();
  const coefOrange = settings.coefficients.orange;
  const techFiltered = filterDataForTech(filteredData, user);
  
  const orangeTotalST = Object.values(techFiltered.orange).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const orangeTotal = orangeTotalST * coefOrange;
  const orangeCount = Object.values(techFiltered.orange).reduce((s, d) => s + (d.totalRecords || 0), 0);

  const canalTotal = Object.values(techFiltered.canal).reduce((s, d) => s + (d.totalMontantTech || 0), 0);
  const canalCount = Object.values(techFiltered.canal).reduce((s, d) => s + (d.totalRecords || 0), 0);

  const total = orangeTotal + canalTotal;

  const allInterventions = [];
  Object.values(techFiltered.orange).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'orange', prixTech: (r.montant || 0) * coefOrange }));
  });
  Object.values(techFiltered.canal).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'canal', prixTech: r.montantTech || 0 }));
  });
  allInterventions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const getPeriodLabel = () => {
    if (!selectedYear) return 'Toutes périodes';
    let label = `${selectedYear}`;
    if (selectedMonth) {
      label = `${MONTHS.find(m => m.value === selectedMonth)?.label || ''} ${selectedYear}`;
      if (selectedWeek && viewMode === 'hebdo') label += ` • S${selectedWeek}`;
    }
    return label;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-emerald-100">{getPeriodLabel()}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Euro} label="Total à recevoir" value={total.toLocaleString('fr-FR') + '€'} color="emerald" />
        <StatCard icon={TrendingUp} label="Orange" value={orangeTotal.toLocaleString('fr-FR') + '€'} sub={`${orangeCount} interv.`} color="orange" />
        <StatCard icon={PieChart} label="Canal+" value={canalTotal.toLocaleString('fr-FR') + '€'} sub={`${canalCount} interv.`} color="purple" />
        <StatCard icon={Calendar} label="Total interventions" value={orangeCount + canalCount} color="blue" />
      </div>

      {/* Interventions */}
      <InterventionsTable interventions={allInterventions} title="Mes interventions" showTech={false} />

      {/* Summary */}
      <div className={`rounded-2xl p-6 border ${theme === 'dark' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'}`}>
        <h3 className={`font-semibold ${t.text} mb-4`}>Récapitulatif</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`rounded-xl p-4 text-center ${t.bgSecondary}`}>
            <p className={`text-sm ${t.textMuted} mb-1`}>Orange</p>
            <p className="text-xl font-bold text-orange-500">{orangeTotal.toLocaleString('fr-FR')}€</p>
          </div>
          <div className={`rounded-xl p-4 text-center ${t.bgSecondary}`}>
            <p className={`text-sm ${t.textMuted} mb-1`}>Canal+</p>
            <p className="text-xl font-bold text-purple-500">{canalTotal.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="rounded-xl p-4 text-center bg-emerald-500 text-white">
            <p className="text-sm text-emerald-100 mb-1">Total à recevoir</p>
            <p className="text-2xl font-bold">{total.toLocaleString('fr-FR')}€</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// === MAIN DASHBOARD ===
function Dashboard({ user, onLogout }) {
  const { theme, setTheme } = useTheme();
  const t = themes[theme];
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState({ orange: {}, canal: {} });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState('mensuel');

  const isDirection = user.role === 'dir';

  useEffect(() => {
    setData({
      orange: JSON.parse(localStorage.getItem('ftth_orange_data') || '{}'),
      canal: JSON.parse(localStorage.getItem('ftth_canal_data') || '{}')
    });
  }, [refreshKey]);

  const filteredData = useMemo(() => buildFilteredData(data, selectedYear, selectedMonth, viewMode === 'hebdo' ? selectedWeek : null), [data, selectedYear, selectedMonth, selectedWeek, viewMode]);

  const navItems = isDirection ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'import', icon: Upload, label: 'Import' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ] : [
    { id: 'dashboard', icon: User, label: 'Mon Récap' },
  ];

  return (
    <div className={`min-h-screen flex ${t.bg} transition-colors`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${t.sidebar} transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-white">GSET PLANS</h1>
              <p className="text-xs text-gray-500">FTTH D3 Guyane</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                view === item.id ? t.sidebarActive : `${t.sidebarText} ${t.sidebarHover}`
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          {sidebarOpen && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-gray-800/50">
              <p className="text-xs text-gray-500">Connecté</p>
              <p className="font-medium text-white truncate text-sm">{user.name}</p>
              <span className={`text-xs ${isDirection ? 'text-purple-400' : 'text-emerald-400'}`}>
                {isDirection ? 'Direction' : 'Technicien'}
              </span>
            </div>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className={`${t.bgSecondary} border-b ${t.border} px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-xl ${t.bgHover} transition-colors`}>
              {sidebarOpen ? <X className={`w-5 h-5 ${t.textSecondary}`} /> : <Menu className={`w-5 h-5 ${t.textSecondary}`} />}
            </button>
            <h2 className={`text-xl font-semibold ${t.text}`}>{navItems.find(n => n.id === view)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-xl ${t.bgTertiary} ${t.bgHover} transition-colors`}>
              {theme === 'light' ? <Moon className={`w-5 h-5 ${t.textSecondary}`} /> : <Sun className="w-5 h-5 text-yellow-400" />}
            </button>
            <span className={`px-3 py-1.5 text-xs rounded-full font-medium ${isDirection ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
              {isDirection ? 'Direction' : 'Technicien'}
            </span>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {view === 'dashboard' && (
            <PeriodSelector data={data} selectedYear={selectedYear} selectedMonth={selectedMonth} selectedWeek={selectedWeek}
              viewMode={viewMode} onYearChange={setSelectedYear} onMonthChange={setSelectedMonth}
              onWeekChange={setSelectedWeek} onViewModeChange={setViewMode} />
          )}

          {isDirection && view === 'dashboard' && <DirectionDashboard filteredData={filteredData} selectedYear={selectedYear} selectedMonth={selectedMonth} selectedWeek={selectedWeek} viewMode={viewMode} />}
          {isDirection && view === 'import' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${t.card}`}>
                <h3 className={`font-semibold ${t.text} mb-4`}>Importer des données</h3>
                <FileImport onImportComplete={() => setRefreshKey(k => k + 1)} />
              </div>
              <div className={`rounded-2xl p-6 border ${t.card}`}>
                <h3 className={`font-semibold ${t.text} mb-4`}>Historique des imports</h3>
                <ImportHistory onDataChange={() => setRefreshKey(k => k + 1)} />
              </div>
            </div>
          )}
          {isDirection && view === 'settings' && <SettingsPage onSave={() => setRefreshKey(k => k + 1)} />}
          {!isDirection && view === 'dashboard' && <TechDashboard filteredData={filteredData} user={user} selectedYear={selectedYear} selectedMonth={selectedMonth} selectedWeek={selectedWeek} viewMode={viewMode} />}
        </div>
      </main>
    </div>
  );
}

// === APP ===
export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ftth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState(() => {
    const settings = getSettings();
    return settings.theme || 'light';
  });

  useEffect(() => {
    const settings = getSettings();
    localStorage.setItem('ftth_settings', JSON.stringify({ ...settings, theme }));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('ftth_user', JSON.stringify(u)); }} />;
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Dashboard user={user} onLogout={() => { setUser(null); localStorage.removeItem('ftth_user'); }} />
    </ThemeContext.Provider>
  );
}
