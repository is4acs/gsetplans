import { useState, useEffect } from 'react';
import { 
  Upload, LayoutDashboard, Users, LogOut, Menu, X, Settings,
  TrendingUp, Euro, Calendar, BarChart3, PieChart, User, Plus, Trash2, Save
} from 'lucide-react';
import FileImport from './components/FileImport';
import ImportHistory from './components/ImportHistory';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

// === DEFAULT SETTINGS ===
const DEFAULT_SETTINGS = {
  coefficients: {
    orange: 0.5,  // Tech touche 50% du montant ST Orange
    canal: 0.5    // Tech touche 50% du montant ST Canal+
  },
  deductionTypes: [
    { id: 'materiel', label: 'Matériel', default: 0 },
    { id: 'carburant', label: 'Carburant', default: 0 },
    { id: 'avance', label: 'Avance sur prestation', default: 0 },
    { id: 'malus', label: 'Malus', default: 0 },
  ]
};

// === DEFAULT USERS ===
const DEFAULT_USERS = {
  admin: { password: 'admin123', role: 'dir', name: 'Direction GSET', techName: null },
  zakaria: { password: 'zak123', role: 'tech', name: 'Zakaria Settou', techName: 'SETTOU Zakaria' },
  macedo: { password: 'mac123', role: 'tech', name: 'Macedo Pansa', techName: 'PANSA Macedo' },
  prochette: { password: 'pro123', role: 'tech', name: 'Jean Paulin Prochette', techName: 'PROCHETTE Jean paulin' },
  cyrile: { password: 'cyr123', role: 'tech', name: 'Cyrile Luckmane', techName: 'LUCKMANE Cyrile' },
  claude: { password: 'cla123', role: 'tech', name: 'Claude', techName: 'Claude' },
  maxime: { password: 'max123', role: 'tech', name: 'Maxime Paul', techName: 'Maxime Paul' },
};

// Variantes de noms pour matcher Orange vs Canal+
const TECH_ALIASES = {
  'SETTOU Zakaria': ['SETTOU Zakaria', 'Zakaria Settou', 'Zakaria SETTOU', 'SETTOU'],
  'PANSA Macedo': ['PANSA Macedo', 'Macedo Pansa', 'PANSA'],
  'PROCHETTE Jean paulin': ['PROCHETTE Jean paulin', 'PROCHETTE Jean Paulin', 'Jean Paulin Prochette', 'PROCHETTE'],
  'LUCKMANE Cyrile': ['LUCKMANE Cyrile', 'Cyrile Luckmane', 'LUCKMANE', 'LUKMANE Cyrile'],
  'Claude': ['Claude'],
  'Maxime Paul': ['Maxime Paul', 'PAUL Maxime'],
};

// === HELPERS ===
function getSettings() {
  const saved = localStorage.getItem('ftth_settings');
  return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
}

function getUsers() {
  const saved = localStorage.getItem('ftth_users');
  return saved ? JSON.parse(saved) : DEFAULT_USERS;
}

function getTechDeductions(techName) {
  const all = JSON.parse(localStorage.getItem('ftth_deductions') || '{}');
  return all[techName] || {};
}

function saveTechDeductions(techName, deductions) {
  const all = JSON.parse(localStorage.getItem('ftth_deductions') || '{}');
  all[techName] = deductions;
  localStorage.setItem('ftth_deductions', JSON.stringify(all));
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
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="Identifiant"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
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

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
          <p className="font-medium mb-2">Comptes:</p>
          <p>• <b>admin</b> / admin123 <span className="text-purple-600">(Direction)</span></p>
          {techUsers.slice(0, 4).map(([k, u]) => (
            <p key={k}>• <b>{k}</b> / {u.password}</p>
          ))}
          {techUsers.length > 4 && <p className="text-gray-400">+{techUsers.length - 4} autres...</p>}
        </div>
      </div>
    </div>
  );
}

// === FILTER DATA FOR TECH ===
function filterDataForTech(data, techName) {
  const aliases = TECH_ALIASES[techName] || [techName];
  const matchesTech = (name) => {
    if (!name) return false;
    return aliases.some(alias => name.toLowerCase().includes(alias.toLowerCase()));
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
        byTech: { [techName]: techRecords },
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
        totalMontant: techRecords.reduce((s, r) => s + (r.montant || 0), 0),
        byTech: { [techName]: techRecords },
      };
    }
  });

  return filtered;
}

// === DIRECTION DASHBOARD ===
function DirectionDashboard({ data }) {
  const settings = getSettings();
  const coefOrange = settings.coefficients.orange;
  const coefCanal = settings.coefficients.canal;

  const orangeTotal = Object.values(data.orange).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const canalTotal = Object.values(data.canal).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const orangeRecords = Object.values(data.orange).reduce((s, d) => s + (d.totalRecords || 0), 0);
  const canalRecords = Object.values(data.canal).reduce((s, d) => s + (d.totalRecords || 0), 0);
  const totalST = orangeTotal + canalTotal;
  
  // Montant payé aux techs
  const totalTechPay = (orangeTotal * coefOrange) + (canalTotal * coefCanal);
  // Marge GSET
  const margeGSET = totalST - totalTechPay;

  const techData = {};
  Object.values(data.orange).forEach(d => {
    Object.entries(d.byTech || {}).forEach(([tech, records]) => {
      if (!techData[tech]) techData[tech] = { orange: 0, canal: 0, count: 0 };
      techData[tech].orange += records.reduce((s, r) => s + r.montant, 0);
      techData[tech].count += records.length;
    });
  });
  Object.values(data.canal).forEach(d => {
    Object.entries(d.byTech || {}).forEach(([tech, records]) => {
      if (!techData[tech]) techData[tech] = { orange: 0, canal: 0, count: 0 };
      techData[tech].canal += records.reduce((s, r) => s + r.montant, 0);
      techData[tech].count += records.length;
    });
  });

  const chartTechData = Object.entries(techData)
    .map(([name, d]) => ({ 
      name, 
      stOrange: d.orange,
      stCanal: d.canal,
      techPay: (d.orange * coefOrange) + (d.canal * coefCanal),
      total: d.orange + d.canal 
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const pieData = [
    { name: 'Marge GSET', value: margeGSET },
    { name: 'Paiement Techs', value: totalTechPay }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Euro} label="Total ST Facturé" value={totalST.toLocaleString('fr-FR') + '€'} color="teal" />
        <StatCard icon={TrendingUp} label="Orange ST" value={orangeTotal.toLocaleString('fr-FR') + '€'} sub={`${orangeRecords} interv.`} color="orange" />
        <StatCard icon={PieChart} label="Canal+ ST" value={canalTotal.toLocaleString('fr-FR') + '€'} sub={`${canalRecords} interv.`} color="purple" />
        <StatCard icon={Users} label="À payer Techs" value={totalTechPay.toLocaleString('fr-FR') + '€'} sub={`${Object.keys(techData).length} techs`} color="blue" />
        <StatCard icon={BarChart3} label="Marge GSET" value={margeGSET.toLocaleString('fr-FR') + '€'} sub={`${((margeGSET/totalST)*100 || 0).toFixed(0)}%`} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Production par Technicien (Montant ST)</h3>
          {chartTechData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartTechData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={v => v.toLocaleString()} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} />
                <Legend />
                <Bar dataKey="stOrange" stackId="a" fill="#f97316" name="Orange ST" />
                <Bar dataKey="stCanal" stackId="a" fill="#8b5cf6" name="Canal+ ST" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Importez des données" />}
        </div>

        {/* Pie chart marge */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Répartition Marge / Paiement Techs</h3>
          {pieData.length > 0 ? (
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

      {/* Table techs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Récapitulatif Équipe D3</h3>
          <p className="text-xs text-gray-500 mt-1">Coef Orange: {(coefOrange*100).toFixed(0)}% | Coef Canal+: {(coefCanal*100).toFixed(0)}%</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Technicien</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Orange ST</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Canal+ ST</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Total ST</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">À payer Tech</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(techData)
                .sort((a, b) => (b[1].orange + b[1].canal) - (a[1].orange + a[1].canal))
                .map(([tech, d]) => {
                  const totalST = d.orange + d.canal;
                  const techPay = (d.orange * coefOrange) + (d.canal * coefCanal);
                  const marge = totalST - techPay;
                  return (
                    <tr key={tech} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{tech}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{d.orange.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right text-purple-600">{d.canal.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{totalST.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{techPay.toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-600">{marge.toLocaleString('fr-FR')}€</td>
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
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', techName: '' });
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
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
        techName: newUser.techName || newUser.name
      }
    }));
    setNewUser({ username: '', password: '', name: '', techName: '' });
  };

  const deleteUser = (username) => {
    if (username === 'admin') return;
    setUsers(prev => {
      const copy = { ...prev };
      delete copy[username];
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      {/* Coefficients */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600" />
          Coefficients Techniciens
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Pourcentage du montant ST reversé aux techniciens (ex: 0.5 = 50%)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient Orange</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.coefficients.orange}
                onChange={(e) => setSettings(s => ({ 
                  ...s, 
                  coefficients: { ...s.coefficients, orange: parseFloat(e.target.value) || 0 }
                }))}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-gray-500 font-medium">{((settings.coefficients.orange || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient Canal+</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.coefficients.canal}
                onChange={(e) => setSettings(s => ({ 
                  ...s, 
                  coefficients: { ...s.coefficients, canal: parseFloat(e.target.value) || 0 }
                }))}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <span className="text-gray-500 font-medium">{((settings.coefficients.canal || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gestion Techniciens */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Gestion des Techniciens
        </h3>

        {/* Liste existants */}
        <div className="mb-4 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Login</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Nom</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Nom Excel</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">MDP</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(users).map(([username, u]) => (
                <tr key={username} className={u.role === 'dir' ? 'bg-purple-50' : ''}>
                  <td className="px-3 py-2 font-mono text-gray-800">{username}</td>
                  <td className="px-3 py-2 text-gray-700">{u.name}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{u.techName || '-'}</td>
                  <td className="px-3 py-2 text-gray-400 font-mono text-xs">{u.password}</td>
                  <td className="px-3 py-2 text-center">
                    {u.role !== 'dir' && (
                      <button onClick={() => deleteUser(username)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ajouter nouveau */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Ajouter un technicien</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="Login"
              value={newUser.username}
              onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              placeholder="Mot de passe"
              value={newUser.password}
              onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              placeholder="Nom complet"
              value={newUser.name}
              onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              placeholder="Nom dans Excel"
              value={newUser.techName}
              onChange={(e) => setNewUser(u => ({ ...u, techName: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={addUser}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            "Nom dans Excel" = nom exact tel qu'il apparaît dans les fichiers RCC/GST (ex: "SETTOU Zakaria")
          </p>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'
          }`}
        >
          <Save className="w-5 h-5" />
          {saved ? 'Sauvegardé !' : 'Sauvegarder les paramètres'}
        </button>
      </div>
    </div>
  );
}

// === TECH DASHBOARD ===
function TechDashboard({ data, user }) {
  const settings = getSettings();
  const coefOrange = settings.coefficients.orange;
  const coefCanal = settings.coefficients.canal;
  
  const techName = user.techName;
  const filteredData = filterDataForTech(data, techName);
  
  const orangeTotalST = Object.values(filteredData.orange).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const canalTotalST = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalMontant || 0), 0);
  const orangeCount = Object.values(filteredData.orange).reduce((s, d) => s + (d.totalRecords || 0), 0);
  const canalCount = Object.values(filteredData.canal).reduce((s, d) => s + (d.totalRecords || 0), 0);
  
  // Montants tech (après coefficient)
  const orangeTech = orangeTotalST * coefOrange;
  const canalTech = canalTotalST * coefCanal;
  const totalTech = orangeTech + canalTech;
  const totalCount = orangeCount + canalCount;

  // Déductions du tech
  const [deductions, setDeductions] = useState(() => getTechDeductions(techName));
  const totalDeductions = Object.values(deductions).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const netAPayer = totalTech - totalDeductions;

  // Interventions
  const allInterventions = [];
  Object.values(filteredData.orange).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'orange' }));
  });
  Object.values(filteredData.canal).forEach(d => {
    (d.records || []).forEach(r => allInterventions.push({ ...r, source: 'canal' }));
  });

  const periodes = [...new Set([...Object.keys(filteredData.orange), ...Object.keys(filteredData.canal)])].sort();
  const evolutionData = periodes.map(p => ({
    name: p,
    orange: (filteredData.orange[p]?.totalMontant || 0) * coefOrange,
    canal: (filteredData.canal[p]?.totalMontant || 0) * coefCanal
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-teal-100">Mon récapitulatif personnel</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Euro} label="Ma Production" value={totalTech.toLocaleString('fr-FR') + '€'} color="teal" />
        <StatCard icon={TrendingUp} label="Orange" value={orangeTech.toLocaleString('fr-FR') + '€'} sub={`${orangeCount} interv.`} color="orange" />
        <StatCard icon={PieChart} label="Canal+" value={canalTech.toLocaleString('fr-FR') + '€'} sub={`${canalCount} interv.`} color="purple" />
        <StatCard icon={Calendar} label="Interventions" value={totalCount} color="blue" />
      </div>

      {/* Graphique */}
      {evolutionData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Mon évolution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={v => v.toLocaleString()} />
              <Tooltip formatter={v => v.toLocaleString('fr-FR') + '€'} />
              <Legend />
              <Bar dataKey="orange" fill="#f97316" name="Orange" />
              <Bar dataKey="canal" fill="#8b5cf6" name="Canal+" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Interventions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
          <h3 className="font-semibold text-gray-800">Mes Interventions</h3>
          <span className="text-sm text-gray-500">{allInterventions.length} total</span>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Source</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Réf</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Type</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 uppercase">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allInterventions.slice(0, 30).map((inter, i) => {
                const coef = inter.source === 'orange' ? coefOrange : coefCanal;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        inter.source === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                      }`}>{inter.source === 'orange' ? 'Orange' : 'Canal+'}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-700">{inter.nd || inter.refPxo || '-'}</td>
                    <td className="px-3 py-2 text-gray-600">{inter.articles || inter.facturation || '-'}</td>
                    <td className="px-3 py-2 text-right font-medium text-teal-600">
                      {((inter.montant || 0) * coef).toLocaleString('fr-FR')}€
                    </td>
                  </tr>
                );
              })}
              {allInterventions.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-500">Aucune intervention</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Récap à payer */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
        <h3 className="font-semibold text-gray-800 mb-4">Mon Récapitulatif À Payer</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Orange ({(coefOrange*100).toFixed(0)}%)</p>
            <p className="text-lg font-bold text-orange-600">{orangeTech.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Canal+ ({(coefCanal*100).toFixed(0)}%)</p>
            <p className="text-lg font-bold text-purple-600">{canalTech.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Brut</p>
            <p className="text-lg font-bold text-gray-800">{totalTech.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Déductions</p>
            <p className="text-lg font-bold text-red-500">-{totalDeductions.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white rounded-lg p-3 border-2 border-green-400">
            <p className="text-xs text-green-600 font-medium">NET À PAYER</p>
            <p className="text-xl font-bold text-green-600">{netAPayer.toLocaleString('fr-FR')}€</p>
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
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                view === item.id ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
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
            <h2 className="text-xl font-semibold text-gray-800">
              {navItems.find(n => n.id === view)?.label || 'Dashboard'}
            </h2>
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
  const colors = {
    teal: 'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600'
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
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
