import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { LogIn, LogOut, User, Users, Settings, Upload, TrendingUp, Calendar, DollarSign, Activity, Edit2, Save, X, FileSpreadsheet, Eye, EyeOff, Menu, Home } from 'lucide-react';

const INITIAL_USERS = [
  { id: 1, username: 'admin', password: 'admin123', role: 'DIRECTION', name: 'Direction GSET' },
  { id: 2, username: 'tech1', password: 'tech123', role: 'TECHNICIEN', name: 'Jean Dupont' },
  { id: 3, username: 'tech2', password: 'tech123', role: 'TECHNICIEN', name: 'Marie Martin' },
  { id: 4, username: 'tech3', password: 'tech123', role: 'TECHNICIEN', name: 'Pierre Bernard' },
];

const INITIAL_TARIFS = {
  direction: { 'PBEA': 45, 'PBIS': 38, 'PBEC': 52, 'PBES': 41, 'PBEP': 48, 'RACCO': 35, 'SAV': 42, 'MAINTENANCE': 30 },
  technicien: { 'PBEA': 28, 'PBIS': 24, 'PBEC': 32, 'PBES': 26, 'PBEP': 30, 'RACCO': 22, 'SAV': 26, 'MAINTENANCE': 18 }
};

const INITIAL_INTERVENTIONS = [
  { id: 1, date: '2025-01-02', technicien: 'Jean Dupont', type: 'PBEA', quantite: 3 },
  { id: 2, date: '2025-01-03', technicien: 'Jean Dupont', type: 'PBIS', quantite: 2 },
  { id: 3, date: '2025-01-05', technicien: 'Marie Martin', type: 'PBEC', quantite: 4 },
  { id: 4, date: '2025-01-06', technicien: 'Pierre Bernard', type: 'RACCO', quantite: 5 },
  { id: 5, date: '2025-01-08', technicien: 'Jean Dupont', type: 'SAV', quantite: 2 },
  { id: 6, date: '2025-01-10', technicien: 'Marie Martin', type: 'PBEA', quantite: 3 },
  { id: 7, date: '2025-01-12', technicien: 'Pierre Bernard', type: 'PBIS', quantite: 4 },
  { id: 8, date: '2025-01-14', technicien: 'Jean Dupont', type: 'MAINTENANCE', quantite: 6 },
  { id: 9, date: '2025-01-15', technicien: 'Marie Martin', type: 'PBEP', quantite: 2 },
  { id: 10, date: '2025-01-16', technicien: 'Pierre Bernard', type: 'PBEC', quantite: 3 },
];

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#0891b2', '#06b6d4', '#22d3ee'];

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600',
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
  };
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 hover:bg-slate-800/70 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div>
          <p className="text-slate-400 text-xs">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function NavButton({ children, active, onClick, icon }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${active ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
      {icon}{children}
    </button>
  );
}

function LoginPage({ users, setCurrentUser, setCurrentPage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) { setCurrentUser(user); setCurrentPage('dashboard'); }
      else { setError('Identifiants incorrects'); }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl shadow-2xl mb-3">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">GSET PLAN</h1>
          <p className="text-slate-400 text-sm mt-1">Plateforme de Gestion Fibre Optique</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-teal-400" />Connexion
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Identifiant</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" placeholder="Entrez votre identifiant" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 pr-10" placeholder="Entrez votre mot de passe" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" />Se connecter</>}
            </button>
          </form>
          <div className="mt-4 p-3 bg-slate-700/30 rounded-xl border border-white/5">
            <p className="text-xs text-slate-400 mb-1 font-medium">Comptes démo :</p>
            <div className="space-y-0.5 text-xs text-slate-500">
              <p><span className="text-teal-400">Direction:</span> admin / admin123</p>
              <p><span className="text-cyan-400">Technicien:</span> tech1 / tech123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechnicianDashboard({ user, interventions, tarifs, calculateTotal }) {
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const myInterventions = interventions.filter(i => i.technicien === user.name);
  const monthInterventions = myInterventions.filter(i => i.date.startsWith(selectedMonth));
  const totalQuantite = monthInterventions.reduce((sum, i) => sum + i.quantite, 0);
  const totalRevenu = monthInterventions.reduce((sum, i) => sum + calculateTotal(i, 'technicien'), 0);
  const byType = monthInterventions.reduce((acc, i) => {
    if (!acc[i.type]) acc[i.type] = { quantite: 0, total: 0 };
    acc[i.type].quantite += i.quantite;
    acc[i.type].total += calculateTotal(i, 'technicien');
    return acc;
  }, {});
  const pieData = Object.entries(byType).map(([type, data]) => ({ name: type, value: data.quantite }));
  const dailyData = monthInterventions.reduce((acc, i) => {
    const day = i.date.split('-')[2];
    if (!acc[day]) acc[day] = { day, interventions: 0, revenu: 0 };
    acc[day].interventions += i.quantite;
    acc[day].revenu += calculateTotal(i, 'technicien');
    return acc;
  }, {});
  const chartData = Object.values(dailyData).sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Mon Tableau de Bord</h2>
          <p className="text-slate-400 text-sm">Récapitulatif mensuel</p>
        </div>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
          <option value="2025-01">Janvier 2025</option>
          <option value="2024-12">Décembre 2024</option>
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Activity className="w-5 h-5" />} label="Interventions" value={totalQuantite} color="teal" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenu Total" value={`${totalRevenu.toLocaleString()} €`} color="cyan" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Moyenne/Jour" value={(totalQuantite / 31).toFixed(1)} color="emerald" />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Jours Travaillés" value={Object.keys(dailyData).length} color="blue" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Évolution Journalière</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Line type="monotone" dataKey="interventions" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Répartition par Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Détail par Type</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Type</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Qté</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Tarif</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byType).map(([type, data]) => (
                <tr key={type} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3"><span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded text-xs font-medium">{type}</span></td>
                  <td className="py-2 px-3 text-right text-white">{data.quantite}</td>
                  <td className="py-2 px-3 text-right text-slate-400">{tarifs.technicien[type]} €</td>
                  <td className="py-2 px-3 text-right text-teal-400 font-semibold">{data.total.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-teal-500/30">
                <td className="py-3 px-3 font-bold text-white">TOTAL</td>
                <td className="py-3 px-3 text-right font-bold text-white">{totalQuantite}</td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-right font-bold text-teal-400">{totalRevenu.toLocaleString()} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function DirectionDashboard({ interventions, tarifs, calculateTotal, setInterventions }) {
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const [selectedTech, setSelectedTech] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const monthInterventions = interventions.filter(i => i.date.startsWith(selectedMonth));
  const filteredInterventions = selectedTech === 'all' ? monthInterventions : monthInterventions.filter(i => i.technicien === selectedTech);
  const technicians = [...new Set(interventions.map(i => i.technicien))];
  const totalQuantite = filteredInterventions.reduce((sum, i) => sum + i.quantite, 0);
  const totalRevenuDir = filteredInterventions.reduce((sum, i) => sum + calculateTotal(i, 'direction'), 0);
  const totalRevenuTech = filteredInterventions.reduce((sum, i) => sum + calculateTotal(i, 'technicien'), 0);
  const marge = totalRevenuDir - totalRevenuTech;

  const byTech = monthInterventions.reduce((acc, i) => {
    if (!acc[i.technicien]) acc[i.technicien] = { name: i.technicien.split(' ')[0], interventions: 0, revenu: 0 };
    acc[i.technicien].interventions += i.quantite;
    acc[i.technicien].revenu += calculateTotal(i, 'direction');
    return acc;
  }, {});
  const techData = Object.values(byTech);

  const handleEdit = (intervention) => { setEditingId(intervention.id); setEditData({ ...intervention }); };
  const handleSave = () => { setInterventions(prev => prev.map(i => i.id === editingId ? { ...editData } : i)); setEditingId(null); };
  const handleDelete = (id) => { setInterventions(prev => prev.filter(i => i.id !== id)); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Direction - Vue Globale</h2>
          <p className="text-slate-400 text-sm">Supervision de l'activité</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none">
            <option value="2025-01">Janvier 2025</option>
            <option value="2024-12">Décembre 2024</option>
          </select>
          <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none">
            <option value="all">Tous</option>
            {technicians.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Activity className="w-5 h-5" />} label="Interventions" value={totalQuantite} color="teal" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="CA Direction" value={`${totalRevenuDir.toLocaleString()} €`} color="cyan" />
        <StatCard icon={<User className="w-5 h-5" />} label="Coût Tech." value={`${totalRevenuTech.toLocaleString()} €`} color="blue" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Marge" value={`${marge.toLocaleString()} €`} color="emerald" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Performance par Technicien</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={techData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="interventions" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">CA par Technicien</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={techData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={60} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(v) => `${v.toLocaleString()} €`} />
              <Bar dataKey="revenu" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Détail des Interventions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2 text-slate-400 font-medium">Date</th>
                <th className="text-left py-2 px-2 text-slate-400 font-medium">Technicien</th>
                <th className="text-left py-2 px-2 text-slate-400 font-medium">Type</th>
                <th className="text-right py-2 px-2 text-slate-400 font-medium">Qté</th>
                <th className="text-right py-2 px-2 text-slate-400 font-medium">Total</th>
                <th className="text-right py-2 px-2 text-slate-400 font-medium">Act.</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterventions.slice(0, 8).map((intervention) => (
                <tr key={intervention.id} className="border-b border-white/5 hover:bg-white/5">
                  {editingId === intervention.id ? (
                    <>
                      <td className="py-2 px-2"><input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="w-full px-1 py-1 bg-slate-700 border border-white/10 rounded text-white text-xs" /></td>
                      <td className="py-2 px-2"><select value={editData.technicien} onChange={(e) => setEditData({ ...editData, technicien: e.target.value })} className="w-full px-1 py-1 bg-slate-700 border border-white/10 rounded text-white text-xs">{technicians.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                      <td className="py-2 px-2"><select value={editData.type} onChange={(e) => setEditData({ ...editData, type: e.target.value })} className="w-full px-1 py-1 bg-slate-700 border border-white/10 rounded text-white text-xs">{Object.keys(tarifs.direction).map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                      <td className="py-2 px-2"><input type="number" value={editData.quantite} onChange={(e) => setEditData({ ...editData, quantite: parseInt(e.target.value) || 0 })} className="w-12 px-1 py-1 bg-slate-700 border border-white/10 rounded text-white text-xs text-right" /></td>
                      <td className="py-2 px-2 text-right text-teal-400">{(editData.quantite * tarifs.direction[editData.type]).toLocaleString()} €</td>
                      <td className="py-2 px-2 text-right"><button onClick={handleSave} className="p-1 text-green-400 hover:bg-green-500/20 rounded"><Save className="w-3 h-3" /></button><button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-500/20 rounded"><X className="w-3 h-3" /></button></td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-2 text-white">{new Date(intervention.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2 px-2 text-white">{intervention.technicien.split(' ')[0]}</td>
                      <td className="py-2 px-2"><span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded text-xs">{intervention.type}</span></td>
                      <td className="py-2 px-2 text-right text-white">{intervention.quantite}</td>
                      <td className="py-2 px-2 text-right text-teal-400 font-semibold">{calculateTotal(intervention, 'direction').toLocaleString()} €</td>
                      <td className="py-2 px-2 text-right"><button onClick={() => handleEdit(intervention)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 className="w-3 h-3" /></button><button onClick={() => handleDelete(intervention.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><X className="w-3 h-3" /></button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ImportPage({ interventions, setInterventions }) {
  const [preview, setPreview] = useState([]);
  const [message, setMessage] = useState('');

  const handleFileUpload = () => {
    const mockData = [
      { date: '2025-01-17', technicien: 'Jean Dupont', type: 'PBEA', quantite: 4 },
      { date: '2025-01-17', technicien: 'Marie Martin', type: 'PBIS', quantite: 3 },
      { date: '2025-01-18', technicien: 'Pierre Bernard', type: 'RACCO', quantite: 5 },
    ];
    setPreview(mockData);
  };

  const handleImport = () => {
    const maxId = Math.max(...interventions.map(i => i.id), 0);
    const newInterventions = preview.map((item, index) => ({ ...item, id: maxId + index + 1 }));
    setInterventions(prev => [...prev, ...newInterventions]);
    setPreview([]);
    setMessage(`${newInterventions.length} interventions importées !`);
  };

  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-white">Import Excel</h2><p className="text-slate-400 text-sm">Importez vos données d'interventions</p></div>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-teal-500/50 transition-colors">
          <FileSpreadsheet className="w-12 h-12 text-teal-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">Glissez votre fichier Excel</h3>
          <p className="text-slate-400 text-sm mb-3">ou cliquez pour sélectionner</p>
          <button onClick={handleFileUpload} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-cyan-400 transition-all text-sm">
            <Upload className="w-4 h-4" />Simuler Import
          </button>
        </div>
        <div className="mt-4 p-3 bg-slate-700/30 rounded-xl border border-white/5">
          <h4 className="text-xs font-medium text-slate-300 mb-1">Format: Date | Technicien | Type | Quantité</h4>
        </div>
      </div>
      {preview.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Aperçu ({preview.length} lignes)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2 px-3 text-slate-400">Date</th><th className="text-left py-2 px-3 text-slate-400">Technicien</th><th className="text-left py-2 px-3 text-slate-400">Type</th><th className="text-right py-2 px-3 text-slate-400">Qté</th></tr></thead>
              <tbody>{preview.map((row, i) => (<tr key={i} className="border-b border-white/5"><td className="py-2 px-3 text-white">{row.date}</td><td className="py-2 px-3 text-white">{row.technicien}</td><td className="py-2 px-3"><span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded text-xs">{row.type}</span></td><td className="py-2 px-3 text-right text-white">{row.quantite}</td></tr>))}</tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleImport} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl text-sm">Confirmer</button>
            <button onClick={() => setPreview([])} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-xl text-sm">Annuler</button>
          </div>
        </div>
      )}
      {message && <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">{message}</div>}
    </div>
  );
}

function SettingsPage({ tarifs, setTarifs, users, setUsers }) {
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'TECHNICIEN' });

  const handleTarifChange = (category, type, value) => {
    setTarifs(prev => ({ ...prev, [category]: { ...prev[category], [type]: parseFloat(value) || 0 } }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const maxId = Math.max(...users.map(u => u.id), 0);
    setUsers(prev => [...prev, { ...newUser, id: maxId + 1 }]);
    setNewUser({ username: '', password: '', name: '', role: 'TECHNICIEN' });
  };

  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-white">Paramètres</h2><p className="text-slate-400 text-sm">Configuration tarifs et utilisateurs</p></div>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-teal-400" />Tarifs par Type</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-teal-400 mb-2">Tarifs Direction</h4>
            <div className="space-y-1">
              {Object.entries(tarifs.direction).map(([type, value]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                  <span className="text-white text-sm">{type}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" value={value} onChange={(e) => handleTarifChange('direction', type, e.target.value)} className="w-16 px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-right text-sm focus:outline-none" />
                    <span className="text-slate-400 text-sm">€</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-cyan-400 mb-2">Tarifs Technicien</h4>
            <div className="space-y-1">
              {Object.entries(tarifs.technicien).map(([type, value]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                  <span className="text-white text-sm">{type}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" value={value} onChange={(e) => handleTarifChange('technicien', type, e.target.value)} className="w-16 px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-right text-sm focus:outline-none" />
                    <span className="text-slate-400 text-sm">€</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-teal-400" />Utilisateurs</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10"><th className="text-left py-2 px-3 text-slate-400">Nom</th><th className="text-left py-2 px-3 text-slate-400">ID</th><th className="text-left py-2 px-3 text-slate-400">Rôle</th><th className="text-right py-2 px-3 text-slate-400">Act.</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3 text-white">{user.name}</td>
                  <td className="py-2 px-3 text-slate-400">{user.username}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'DIRECTION' ? 'bg-purple-500/20 text-purple-300' : 'bg-teal-500/20 text-teal-300'}`}>{user.role}</span></td>
                  <td className="py-2 px-3 text-right"><button onClick={() => setUsers(prev => prev.filter(u => u.id !== user.id))} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><X className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-700/30 rounded-xl border border-white/5">
          <h4 className="text-xs font-medium text-white mb-2">Ajouter utilisateur</h4>
          <form onSubmit={handleAddUser} className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <input type="text" placeholder="Nom" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="px-2 py-1.5 bg-slate-700 border border-white/10 rounded text-white placeholder-slate-500 text-sm" required />
            <input type="text" placeholder="Identifiant" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="px-2 py-1.5 bg-slate-700 border border-white/10 rounded text-white placeholder-slate-500 text-sm" required />
            <input type="password" placeholder="Mot de passe" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="px-2 py-1.5 bg-slate-700 border border-white/10 rounded text-white placeholder-slate-500 text-sm" required />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="px-2 py-1.5 bg-slate-700 border border-white/10 rounded text-white text-sm">
              <option value="TECHNICIEN">Technicien</option>
              <option value="DIRECTION">Direction</option>
            </select>
            <button type="submit" className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded text-sm">Ajouter</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GSETPlan() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tarifs, setTarifs] = useState(INITIAL_TARIFS);
  const [interventions, setInterventions] = useState(INITIAL_INTERVENTIONS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { setCurrentUser(null); setCurrentPage('login'); setMobileMenuOpen(false); };
  const calculateTotal = (intervention, tarifType) => {
    const tarif = tarifs[tarifType][intervention.type] || 0;
    return intervention.quantite * tarif;
  };

  if (!currentUser) {
    return <LoginPage users={users} setCurrentUser={setCurrentUser} setCurrentPage={setCurrentPage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <header className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div><h1 className="text-lg font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">GSET PLAN</h1></div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <NavButton active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} icon={<Home className="w-4 h-4" />}>Dashboard</NavButton>
              {currentUser.role === 'DIRECTION' && (
                <>
                  <NavButton active={currentPage === 'import'} onClick={() => setCurrentPage('import')} icon={<Upload className="w-4 h-4" />}>Import</NavButton>
                  <NavButton active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} icon={<Settings className="w-4 h-4" />}>Paramètres</NavButton>
                </>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/10">
                <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-500 rounded flex items-center justify-center">
                  {currentUser.role === 'DIRECTION' ? <Users className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-white" />}
                </div>
                <div><p className="text-xs font-medium text-white">{currentUser.name}</p><p className="text-[10px] text-teal-400">{currentUser.role}</p></div>
              </div>
              <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"><LogOut className="w-4 h-4" /></button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 text-slate-400 hover:text-white"><Menu className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 space-y-1">
            <button onClick={() => { setCurrentPage('dashboard'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm"><Home className="w-4 h-4" />Dashboard</button>
            {currentUser.role === 'DIRECTION' && (
              <>
                <button onClick={() => { setCurrentPage('import'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm"><Upload className="w-4 h-4" />Import</button>
                <button onClick={() => { setCurrentPage('settings'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm"><Settings className="w-4 h-4" />Paramètres</button>
              </>
            )}
          </div>
        )}
      </header>
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'dashboard' && currentUser.role === 'TECHNICIEN' && <TechnicianDashboard user={currentUser} interventions={interventions} tarifs={tarifs} calculateTotal={calculateTotal} />}
        {currentPage === 'dashboard' && currentUser.role === 'DIRECTION' && <DirectionDashboard interventions={interventions} tarifs={tarifs} calculateTotal={calculateTotal} setInterventions={setInterventions} />}
        {currentPage === 'import' && currentUser.role === 'DIRECTION' && <ImportPage interventions={interventions} setInterventions={setInterventions} />}
        {currentPage === 'settings' && currentUser.role === 'DIRECTION' && <SettingsPage tarifs={tarifs} setTarifs={setTarifs} users={users} setUsers={setUsers} />}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GSETPlan />
  </React.StrictMode>
);
