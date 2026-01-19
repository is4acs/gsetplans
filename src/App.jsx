import { useState, useEffect } from 'react';
import { 
  Upload, LayoutDashboard, LogOut, Menu, X, Settings,
  TrendingUp, Euro, Calendar, BarChart3, PieChart, User, Plus, Trash2, Save, Link
} from 'lucide-react';
import FileImport from './components/FileImport';
import ImportHistory from './components/ImportHistory';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

// === PRIX CANAL+ ===
const CANAL_PRICES = {
  AERC: { gset: 117.45, tech: 70.47 },
  BPMS: { gset: 84.40, tech: 50.64 },
  CHRC: { gset: 169.50, tech: 101.70 },
  FARC: { gset: 156.60, tech: 93.96 },
  INRC: { gset: 139.26, tech: 83.56 },
  PBEA: { gset: 288.77, tech: 173.26 },
  PBEC: { gset: 201.30, tech: 120.78 },
  PBEF: { gset: 280.15, tech: 168.09 },
  PBIS: { gset: 176.12, tech: 105.67 },
  PDOS: { gset: 89.00, tech: 53.40 },
  SAVD: { gset: 240.00, tech: 144.00 },
  SAVS: { gset: 73.87, tech: 44.32 },
  SAVG: { gset: 73.87, tech: 44.32 },
  TXPA: { gset: 119.00, tech: 71.40 },
  TXPB: { gset: 178.50, tech: 107.10 },
  TXPC: { gset: 373.10, tech: 223.86 },
  TXPD: { gset: 174.20, tech: 104.52 },
};

// === GSE MAPPING (référence) ===
const GSE_NAMES = {
  'GSE 02': 'Wendelle Edwige',
  'GSE 03': 'Claude',
  'GSE 04': 'Alan Pantoja',
  'GSE 05': 'Maxime Paul',
  'GSE 06': 'Carlos',
  'GSE 15': 'Luckmane Cyrile',
  'GSE 16': 'Dautruche Sauvenel',
  'GSE 17': 'Jahwer Sellemi',
  'GSE 18': 'Bakour Fallah',
  'GSE 19': 'Zakaria Settou',
};

// === DEFAULT SETTINGS ===
const DEFAULT_SETTINGS = {
  coefficients: { orange: 0.5, canal: 0.5 },
};

// === DEFAULT USERS avec aliases ===
const DEFAULT_USERS = {
  admin: { 
    password: 'admin123', 
    role: 'dir', 
    name: 'Direction GSET', 
    aliases: [] 
  },
  zakaria: { 
    password: 'zak123', 
    role: 'tech', 
    name: 'Zakaria Settou', 
    aliases: ['SETTOU Zakaria', 'Zakaria Settou', 'Zakaria SETTOU', 'GSE 19']
  },
  macedo: { 
    password: 'mac123', 
    role: 'tech', 
    name: 'Macedo Pansa', 
    aliases: ['PANSA Macedo', 'Macedo Pansa', 'Macedo PANSA']
  },
  prochette: { 
    password: 'pro123', 
    role: 'tech', 
    name: 'Jean Paulin Prochette', 
    aliases: ['PROCHETTE Jean paulin', 'PROCHETTE Jean Paulin', 'Jean Paulin Prochette']
  },
  cyrile: { 
    password: 'cyr123', 
    role: 'tech', 
    name: 'Cyrile Luckmane', 
    aliases: ['LUCKMANE Cyrile', 'Luckmane Cyrile', 'Cyrile Luckmane', 'GSE 15']
  },
  jahwer: { 
    password: 'jah123', 
    role: 'tech', 
    name: 'Jahwer Sellemi', 
    // Jahwer gère aussi le planning de Claude (GSE 03)
    aliases: ['Jahwer Sellemi', 'GSE 17', 'GSE 03', 'Claude']
  },
  maxime: { 
    password: 'max123', 
    role: 'tech', 
    name: 'Maxime Paul', 
    aliases: ['Maxime Paul', 'PAUL Maxime', 'GSE 05']
  },
  alan: { 
    password: 'ala123', 
    role: 'tech', 
    name: 'Alan Pantoja', 
    aliases: ['Alan Pantoja', 'Alan PANTOJA', 'GSE 04']
  },
  sauvenel: { 
    password: 'sau123', 
    role: 'tech', 
    name: 'Dautruche Sauvenel', 
    aliases: ['Dautruche Sauvenel', 'DAUTRUCHE Sauvenel', 'GSE 16']
  },
  carlos: { 
    password: 'car123', 
    role: 'tech', 
    name: 'Carlos', 
    aliases: ['Carlos', 'GSE 06']
  },
  bakour: { 
    password: 'bak123', 
    role: 'tech', 
    name: 'Bakour Fallah', 
    aliases: ['Bakour Fallah', 'GSE 18']
  },
  wendelle: { 
    password: 'wen123', 
    role: 'tech', 
    name: 'Wendelle Edwige', 
    aliases: ['Wendelle Edwige', 'Wendell Edwige', 'GSE 02']
  },
};

// === HELPERS ===
function getSettings() {
  const saved = localStorage.getItem('ftth_settings');
  return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
}

function getUsers() {
  const saved = localStorage.getItem('ftth_users');
  if (saved) {
    const users = JSON.parse(saved);
    Object.keys(users).forEach(k => {
      if (!users[k].aliases) users[k].aliases = [];
    });
    return users;
  }
  return DEFAULT_USERS;
}

function resolveGSEToName(gseCode) {
  return GSE_NAMES[gseCode] || gseCode;
}

// === LOGIN ===
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  const users = getUsers();
  const techUsers = Object.entries(users).filter(([, u]) => u.role === 'tech');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FTTH D3 Guyane</h1>
          <p className="text-gray-500 text-sm mt-1">GSET Caraïbes Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
            <input
              type="text" value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="Identifiant"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-xl font-semibold hover:bg-teal-600 transition-colors">
            Connexion
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 max-h-40 overflow-y-auto">
          <p className="font-medium mb-2">Comptes:</p>
          <p>• <b>admin</b> / admin123 <span className="text-purple-600">(Direction)</span></p>
          {techUsers.slice(0, 6).map(([k, u]) => (
            <p key={k}>• <b>{k}</b> / {u.password}</p>
          ))}
          {techUsers.length > 6 && <p className="text-gray-400">+{techUsers.length - 6} autres...</p>}
        </div>
      </div>
    </div>
  );
}

// === FILTER DATA FOR TECH (utilise les aliases) ===
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
      filtered.orange[periode] = {
        records: techRecords,
        totalRecords: techRecords.length,
        totalMontant: techRecords.reduce((s, r) => s + (r.montant || 0), 0),
      };
    }
  });

  Object.entries(data.canal).forEach(([periode, periodeData]) => {
    const techRecords = [];
    Object.entries(periodeData.byTech || {}).forEach(([tech, records]) => {
      if (matchesTech(tech)) techRecords.push(...records);
    });
    if (techRecords.length > 0) {
      filtered.canal[periode] = {
        records: techRecords,
        totalRecords: techRecords.length,
        totalMontantGset: techRecords.reduce((s, r) => s + (r.montantGset || 0), 0),
        totalMontantTech: techRecords.reduce((s, r) => s + (r.montantTech || 0), 0),
      };
    }
  });

  return filtered;
}

// === DIRECTION DASHBOARD ===
function DirectionDashboard({ data }) {
  const settings = getSettings();
  const users = getUsers();
  const coefOrange = settings.coefficients.orange;

  const orangeTotal = Object.values(data.orange).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const orangeRecords = Object.values(data.orange).reduce((s, d) => s + (d.totalRecords || 0), 0);
  const orangeTechPay = orangeTotal * coefOrange;

  const canalTotalGset = Object.values(data.canal).reduce((s, d) => s + (d.totalMontantGset || 0), 0);
  const canalTotalTech = Object.values(data.canal).reduce((s, d) => s + (d.totalMontantTech || 0), 0);
  const canalRecords = Object.values(data.canal).reduce((s, d) => s + (d.totalRecords || 0), 0);

  const totalST = orangeTotal + canalTotalGset;
  const totalTechPay = orangeTechPay + canalTotalTech;
  const margeGSET = totalST - totalTechPay;

  // Agréger par USER via aliases
  const techData = {};
  const aliasToUser = {};
  Object.entries(users).forEach(([username, u]) => {
    if (u.role === 'tech' && u.aliases) {
      u.aliases.forEach(alias => {
        aliasToUser[alias.toLowerCase()] = username;
      });
    }
  });

  Object.values(data.orange).forEach(d => {
    Object.entries(d.byTech || {}).forEach(([tech, records]) => {
      const username = aliasToUser[tech.toLowerCase()] || tech;
      const displayName = users[username]?.name || resolveGSEToName(tech);
      
      if (!techData[displayName]) techData[displayName] = { orange: 0, orangeTech: 0, canalGset: 0, canalTech: 0, count: 0 };
      const sum = records.reduce((s, r) => s + r.montant, 0);
      techData[displayName].orange += sum;
      techData[displayName].orangeTech += sum * coefOrange;
      techData[displayName].count += records.length;
    });
  });

  Object.values(data.canal).forEach(d => {
    Object.entries(d.byTech || {}).forEach(([tech, records]) => {
      const username = aliasToUser[tech.toLowerCase()] || tech;
      const displayName = users[username]?.name || resolveGSEToName(tech);
      
      if (!techData[displayName]) techData[displayName] = { orange: 0, orangeTech: 0, canalGset: 0, canalTech: 0, count: 0 };
      techData[displayName].canalGset += records.reduce((s, r) => s + (r.montantGset || 0), 0);
      techData[displayName].canalTech += records.reduce((s, r) => s + (r.montantTech || 0), 0);
      techData[displayName].count += records.length;
    });
  });

  const chartData = Object.entries(techData)
    .map(([name, d]) => ({ name, orange: d.orange, canal: d.canalGset, total: d.orange + d.canalGset }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const pieData = [
    { name: 'Marge GSET', value: margeGSET },
    { name: 'Paiement Techs', value: totalTechPay }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Euro} label="Total Facturé" value={totalST.toLocaleString('fr-FR') + '€'} color="teal" />
        <StatCard icon={TrendingUp} label="Orange" value={orangeTotal.toLocaleString('fr-FR') + '€'} sub={`${orangeRecords} interv.`} color="orange" />
        <StatCard icon={PieChart} label="Canal+" value={canalTotalGset.toLocaleString('fr-FR') + '€'} sub={`${canalRecords} interv.`} color="purple" />
        <StatCard icon={User} label="À payer Techs" value={totalTechPay.toLocaleString('fr-FR') + '€'} color="blue" />
        <StatCard icon={BarChart3} label="Marge GSET" value={margeGSET.toLocaleString('fr-FR') + '€'} sub={totalST > 0 ? `${((margeGSET/totalST)*100).toFixed(0)}%` : ''} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Production par Technicien</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={v => v.toLocaleString()} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} />
                <Bar dataKey="orange" stackId="a" fill="#f97316" name="Orange" />
                <Bar dataKey="canal" stackId="a" fill="#8b5cf6" name="Canal+" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Importez des données" />}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Répartition Marge / Techs</h3>
          {pieData.length > 0 && pieData[0].value > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="#14b8a6" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} />
              </RePieChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Importez des données" />}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Récapitulatif Équipe (Données fusionnées)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Technicien</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Orange</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Canal+</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Total ST</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Prix Tech</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(techData)
                .sort((a, b) => (b[1].orange + b[1].canalGset) - (a[1].orange + a[1].canalGset))
                .map(([tech, d]) => {
                  const total = d.orange + d.canalGset;
                  const techPay = d.orangeTech + d.canalTech;
                  return (
                    <tr key={tech} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{tech}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{d.orange.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right text-purple-600">{d.canalGset.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right text-gray-700">{total.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{techPay.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-600">{(total - techPay).toLocaleString('fr-FR')}€</td>
                    </tr>
                  );
                })}
              {Object.keys(techData).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// === SETTINGS PAGE ===
function SettingsPage({ onSave }) {
  const [settings, setSettings] = useState(getSettings());
  const [users, setUsers] = useState(getUsers());
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '' });
  const [newAlias, setNewAlias] = useState({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('techs');

  const handleSave = () => {
    localStorage.setItem('ftth_settings', JSON.stringify(settings));
    localStorage.setItem('ftth_users', JSON.stringify(users));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave?.();
  };

  const addUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    setUsers(prev => ({
      ...prev,
      [newUser.username.toLowerCase()]: {
        password: newUser.password,
        role: 'tech',
        name: newUser.name,
        aliases: [newUser.name]
      }
    }));
    setNewUser({ username: '', password: '', name: '' });
  };

  const deleteUser = (username) => {
    if (username === 'admin') return;
    setUsers(prev => { const copy = { ...prev }; delete copy[username]; return copy; });
  };

  const addAlias = (username) => {
    const alias = newAlias[username]?.trim();
    if (!alias) return;
    setUsers(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        aliases: [...(prev[username].aliases || []), alias]
      }
    }));
    setNewAlias(prev => ({ ...prev, [username]: '' }));
  };

  const removeAlias = (username, aliasToRemove) => {
    setUsers(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        aliases: (prev[username].aliases || []).filter(a => a !== aliasToRemove)
      }
    }));
  };

  const techUsers = Object.entries(users).filter(([, u]) => u.role === 'tech');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button onClick={() => setActiveTab('techs')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'techs' ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500' : 'text-gray-500'}`}>
          Techniciens & Fusion
        </button>
        <button onClick={() => setActiveTab('coef')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'coef' ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500' : 'text-gray-500'}`}>
          Coefficients
        </button>
        <button onClick={() => setActiveTab('prices')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'prices' ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500' : 'text-gray-500'}`}>
          Grille Canal+
        </button>
      </div>

      {/* Tab: Techniciens & Aliases */}
      {activeTab === 'techs' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Système de Fusion & Aliases
            </h4>
            <p className="text-sm text-blue-700">
              Ajoutez tous les noms/codes liés à un technicien. Toutes les interventions seront fusionnées.
            </p>
            <div className="mt-2 text-sm text-blue-600 space-y-1">
              <p>• <b>Zakaria</b> = "SETTOU Zakaria" (Orange) + "GSE 19" (Canal+)</p>
              <p>• <b>Jahwer</b> = "GSE 17" + "GSE 03" + "Claude" (gère le planning de Claude)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Techniciens & Aliases</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {techUsers.map(([username, u]) => (
                <div key={username} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">
                          Login: <span className="font-mono">{username}</span> • MDP: <span className="font-mono">{u.password}</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={() => deleteUser(username)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="ml-13 pl-10">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Link className="w-3 h-3" /> Aliases fusionnés (noms Orange, codes GSE Canal+, autres plannings)
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(u.aliases || []).map((alias, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
                          <span className={alias.startsWith('GSE') ? 'font-mono text-purple-600' : 'text-gray-700'}>
                            {alias}
                          </span>
                          <button onClick={() => removeAlias(username, alias)} className="text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {(u.aliases || []).length === 0 && <span className="text-xs text-gray-400 italic">Aucun alias</span>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter (ex: GSE 19, SETTOU Zakaria, Claude...)"
                        value={newAlias[username] || ''}
                        onChange={(e) => setNewAlias(prev => ({ ...prev, [username]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && addAlias(username)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button onClick={() => addAlias(username)}
                        className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Ajouter un technicien</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Login" value={newUser.username}
                  onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                <input type="text" placeholder="Mot de passe" value={newUser.password}
                  onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                <input type="text" placeholder="Nom complet" value={newUser.name}
                  onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                <button onClick={addUser}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-3">Codes GSE de référence</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              {Object.entries(GSE_NAMES).map(([code, name]) => (
                <div key={code} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded">
                  <span className="font-mono text-purple-600 text-xs">{code}</span>
                  <span className="text-gray-700 text-xs truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coef' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Coefficient Orange</h3>
          <p className="text-sm text-gray-500 mb-4">% du montant ST reversé aux techniciens (Canal+ = prix fixes)</p>
          <div className="max-w-xs flex items-center gap-2">
            <input type="number" step="0.05" min="0" max="1" value={settings.coefficients.orange}
              onChange={(e) => setSettings(s => ({ ...s, coefficients: { ...s.coefficients, orange: parseFloat(e.target.value) || 0 }}))}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
            <span className="text-gray-500 font-medium w-16">{((settings.coefficients.orange || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Grille Tarifaire Canal+</h3>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Code</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 uppercase">Prix GSET</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 uppercase">Prix Tech</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 uppercase">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(CANAL_PRICES).map(([code, prices]) => (
                  <tr key={code} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono font-medium text-gray-800">{code}</td>
                    <td className="px-3 py-2 text-right text-teal-600">{prices.gset.toFixed(2)}€</td>
                    <td className="px-3 py-2 text-right text-blue-600">{prices.tech.toFixed(2)}€</td>
                    <td className="px-3 py-2 text-right text-green-600">{(prices.gset - prices.tech).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'}`}>
          <Save className="w-5 h-5" />
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// === TECH DASHBOARD ===
function TechDashboard({ data, user }) {
  const settings = getSettings();
  const coefOrange = settings.coefficients.orange;
  const filteredData = filterDataForTech(data, user);
  
  const orangeTotalST = Object.values(filteredData.orange).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const orangeTotal = orangeTotalST * coefOrange;
  const orangeCount = Object.values(filteredData.orange).reduce((s, d) => s + (d.totalRecords || 0), 0);

  const canalTotal = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalMontantTech || 0), 0);
  const canalCount = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalRecords || 0), 0);

  const total = orangeTotal + canalTotal;
  const totalCount = orangeCount + canalCount;

  const allInterventions = [];
  Object.values(filteredData.orange).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'orange', prixTech: (r.montant || 0) * coefOrange }));
  });
  Object.values(filteredData.canal).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'canal', prixTech: r.montantTech || 0 }));
  });

  const periodes = [...new Set([...Object.keys(filteredData.orange), ...Object.keys(filteredData.canal)])].sort();
  const evolutionData = periodes.map(p => ({
    name: p,
    orange: (filteredData.orange[p]?.totalMontant || 0) * coefOrange,
    canal: filteredData.canal[p]?.totalMontantTech || 0
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-teal-100">Mon récapitulatif</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Euro} label="Total à recevoir" value={total.toLocaleString('fr-FR') + '€'} color="teal" />
        <StatCard icon={TrendingUp} label="Orange" value={orangeTotal.toLocaleString('fr-FR') + '€'} sub={`${orangeCount} interv.`} color="orange" />
        <StatCard icon={PieChart} label="Canal+" value={canalTotal.toLocaleString('fr-FR') + '€'} sub={`${canalCount} interv.`} color="purple" />
        <StatCard icon={Calendar} label="Interventions" value={totalCount} color="blue" />
      </div>

      {evolutionData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Mon évolution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={v => v.toLocaleString()} />
              <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} />
              <Bar dataKey="orange" fill="#f97316" name="Orange" />
              <Bar dataKey="canal" fill="#8b5cf6" name="Canal+" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
          <h3 className="font-semibold text-gray-800">Mes Interventions</h3>
          <span className="text-sm text-gray-500">{allInterventions.length} total</span>
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Source</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Référence</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Type</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 uppercase">Prix Tech</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allInterventions.slice(0, 50).map((inter, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      inter.source === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                    }`}>{inter.source === 'orange' ? 'Orange' : 'Canal+'}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-700">{inter.nd || inter.refPxo || '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{inter.articles || inter.facturation || '-'}</td>
                  <td className="px-3 py-2 text-right font-semibold text-teal-600">
                    {(inter.prixTech || 0).toLocaleString('fr-FR')}€
                  </td>
                </tr>
              ))}
              {allInterventions.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-500">Aucune intervention</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
        <h3 className="font-semibold text-gray-800 mb-4">Récapitulatif</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Orange</p>
            <p className="text-xl font-bold text-orange-600">{orangeTotal.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Canal+</p>
            <p className="text-xl font-bold text-purple-600">{canalTotal.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border-2 border-green-400">
            <p className="text-sm text-green-600 font-medium mb-1">TOTAL À RECEVOIR</p>
            <p className="text-2xl font-bold text-green-600">{total.toLocaleString('fr-FR')}€</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// === MAIN DASHBOARD ===
function Dashboard({ user, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState({ orange: {}, canal: {} });
  const [refreshKey, setRefreshKey] = useState(0);

  const isDirection = user.role === 'dir';

  useEffect(() => {
    setData({
      orange: JSON.parse(localStorage.getItem('ftth_orange_data') || '{}'),
      canal: JSON.parse(localStorage.getItem('ftth_canal_data') || '{}')
    });
  }, [refreshKey]);

  const navItems = isDirection ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'import', icon: Upload, label: 'Import' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ] : [
    { id: 'dashboard', icon: User, label: 'Mon Récap' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-teal-600" />
          </div>
          {sidebarOpen && <div><h1 className="font-bold text-gray-800">FTTH D3</h1><p className="text-xs text-gray-500">GSET Caraïbes</p></div>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                view === item.id ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {sidebarOpen && (
            <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Connecté</p>
              <p className="font-medium text-gray-800 truncate text-sm">{user.name}</p>
              <span className={`text-xs ${isDirection ? 'text-purple-600' : 'text-blue-600'}`}>
                {isDirection ? 'Direction' : 'Technicien'}
              </span>
            </div>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-semibold text-gray-800">{navItems.find(n => n.id === view)?.label}</h2>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
            isDirection ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>{isDirection ? 'Direction' : 'Technicien'}</span>
        </header>

        <div className="p-6">
          {isDirection && view === 'dashboard' && <DirectionDashboard data={data} />}
          {isDirection && view === 'import' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Importer des données</h3>
                <FileImport onImportComplete={() => setRefreshKey(k => k + 1)} />
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Historique</h3>
                <ImportHistory onDataChange={() => setRefreshKey(k => k + 1)} />
              </div>
            </div>
          )}
          {isDirection && view === 'settings' && <SettingsPage onSave={() => setRefreshKey(k => k + 1)} />}
          {!isDirection && <TechDashboard data={data} user={user} />}
        </div>
      </main>
    </div>
  );
}

// === SHARED ===
function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = { teal: 'bg-teal-50 text-teal-600', orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600', blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600' };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon className="w-5 h-5" /></div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="h-48 flex items-center justify-center text-gray-400"><p>{text}</p></div>;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ftth_user');
    return saved ? JSON.parse(saved) : null;
  });

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('ftth_user', JSON.stringify(u)); }} />;
  return <Dashboard user={user} onLogout={() => { setUser(null); localStorage.removeItem('ftth_user'); }} />;
}
