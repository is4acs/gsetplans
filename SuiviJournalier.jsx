import { useState, useCallback, useMemo } from 'react';
import { Upload, Calendar, TrendingUp, TrendingDown, Target, AlertCircle, BarChart3, Download, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';

// Thèmes
const themes = {
  light: {
    bg: 'bg-gray-50', bgSecondary: 'bg-white', bgTertiary: 'bg-gray-100',
    text: 'text-gray-900', textSecondary: 'text-gray-600', textMuted: 'text-gray-400',
    border: 'border-gray-200', card: 'bg-white border-gray-100 shadow-sm',
  },
  dark: {
    bg: 'bg-gray-950', bgSecondary: 'bg-gray-900', bgTertiary: 'bg-gray-800',
    text: 'text-gray-100', textSecondary: 'text-gray-400', textMuted: 'text-gray-500',
    border: 'border-gray-800', card: 'bg-gray-900 border-gray-800 shadow-lg',
  }
};

// Parser pour les feuilles de suivi journalier
function parseSuiviJournalier(worksheet, type) {
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  const data = [];
  
  // Trouver l'index de la ligne d'en-tête
  let headerRow = 0;
  for (let i = 0; i < Math.min(5, json.length); i++) {
    if (json[i][0] && (json[i][0].toString().toLowerCase().includes('nom') || json[i][0].toString().toLowerCase().includes('technicien'))) {
      headerRow = i;
      break;
    }
  }
  
  // Parser les données
  for (let i = headerRow + 1; i < json.length; i++) {
    const row = json[i];
    if (!row[0] || !row[2]) continue; // Ignorer les lignes sans technicien ou date
    
    const techName = row[0]?.toString().trim();
    const date = parseExcelDate(row[2]);
    if (!techName || !date || techName === 'NaN') continue;
    
    data.push({
      type,
      technicien: techName,
      date: date.toISOString().split('T')[0],
      etat: row[3]?.toString() || 'N/A',
      planifies: parseFloat(row[4]) || 0,
      realises: parseFloat(row[5]) || 0,
      ok: parseFloat(row[6]) || 0,
      nok: parseFloat(row[7]) || 0,
      reportes: parseFloat(row[8]) || 0,
      tauxReussite: parseFloat(row[9]) || 0,
      tauxEchec: parseFloat(row[10]) || 0,
      tauxReport: parseFloat(row[11]) || 0,
      tauxCloture: parseFloat(row[12]) || 0,
    });
  }
  
  return data;
}

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

// Composant principal
export default function SuiviJournalier({ theme = 'light', userRole = 'tech', currentTechName = null }) {
  const [suiviData, setSuiviData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedType, setSelectedType] = useState('all');
  const t = themes[theme];

  // Import fichier SUIVI
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allData = [];
        
        // Parser SUIVI JOURNALIER CANAL
        if (workbook.SheetNames.includes('SUIVI JOURNALIER CANAL')) {
          const canalSheet = workbook.Sheets['SUIVI JOURNALIER CANAL'];
          const canalData = parseSuiviJournalier(canalSheet, 'CANAL');
          allData = [...allData, ...canalData];
        }
        
        // Parser SUIVI JOURNALIER ORANGE
        if (workbook.SheetNames.includes('SUIVI JOURNALIER ORANGE')) {
          const orangeSheet = workbook.Sheets['SUIVI JOURNALIER ORANGE'];
          const orangeData = parseSuiviJournalier(orangeSheet, 'ORANGE');
          allData = [...allData, ...orangeData];
        }
        
        // Sauvegarder dans localStorage
        localStorage.setItem('gsetplans_suivi', JSON.stringify(allData));
        setSuiviData(allData);
        
      } catch (error) {
        console.error('Erreur import:', error);
        alert('Erreur lors de l\'import du fichier');
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, []);

  // Charger les données au montage
  useState(() => {
    const stored = localStorage.getItem('gsetplans_suivi');
    if (stored) {
      try {
        setSuiviData(JSON.parse(stored));
      } catch (e) {
        console.error('Erreur chargement:', e);
      }
    }
  }, []);

  // Filtrer les données
  const filteredData = useMemo(() => {
    let data = suiviData;
    
    // Filtre par technicien pour les techs
    if (userRole === 'tech' && currentTechName) {
      data = data.filter(d => d.technicien === currentTechName);
    }
    
    // Filtre par type
    if (selectedType !== 'all') {
      data = data.filter(d => d.type === selectedType);
    }
    
    // Filtre par période
    const now = new Date();
    if (selectedPeriod === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      data = data.filter(d => new Date(d.date) >= weekAgo);
    } else if (selectedPeriod === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      data = data.filter(d => new Date(d.date) >= monthAgo);
    }
    
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [suiviData, userRole, currentTechName, selectedType, selectedPeriod]);

  // Stats globales
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const total = filteredData.reduce((acc, d) => ({
      planifies: acc.planifies + d.planifies,
      realises: acc.realises + d.realises,
      ok: acc.ok + d.ok,
      nok: acc.nok + d.nok,
      reportes: acc.reportes + d.reportes,
    }), { planifies: 0, realises: 0, ok: 0, nok: 0, reportes: 0 });
    
    const tauxReussite = total.realises > 0 ? (total.ok / total.realises) * 100 : 0;
    const tauxEchec = total.realises > 0 ? (total.nok / total.realises) * 100 : 0;
    const tauxCloture = total.planifies > 0 ? (total.realises / total.planifies) * 100 : 0;
    
    return { ...total, tauxReussite, tauxEchec, tauxCloture };
  }, [filteredData]);

  // Données pour graphique évolution
  const chartData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(d => {
      if (!grouped[d.date]) {
        grouped[d.date] = { date: d.date, planifies: 0, realises: 0, ok: 0, nok: 0 };
      }
      grouped[d.date].planifies += d.planifies;
      grouped[d.date].realises += d.realises;
      grouped[d.date].ok += d.ok;
      grouped[d.date].nok += d.nok;
    });
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  // Reset data
  const handleClearData = () => {
    if (confirm('Supprimer toutes les données de suivi ?')) {
      localStorage.removeItem('gsetplans_suivi');
      setSuiviData([]);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${t.bg}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${t.text} flex items-center gap-3`}>
              <Calendar className="w-8 h-8 text-emerald-500" />
              Suivi Journalier {userRole === 'admin' ? 'D3' : ''}
            </h1>
            <p className={`mt-2 ${t.textSecondary}`}>
              Progression quotidienne Orange & Canal+
            </p>
          </div>
          
          <div className="flex gap-3">
            {suiviData.length > 0 && (
              <button
                onClick={handleClearData}
                className={`px-4 py-2 rounded-lg border ${t.border} ${t.textSecondary} hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2`}
              >
                <Trash2 className="w-4 h-4" />
                Effacer
              </button>
            )}
            <label className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {loading ? 'Import...' : 'Importer SUIVI'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* Filtres */}
        {suiviData.length > 0 && (
          <div className={`${t.card} rounded-lg border ${t.border} p-4 flex gap-4 flex-wrap`}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${t.border} ${t.text} bg-transparent`}
            >
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="all">Tout</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${t.border} ${t.text} bg-transparent`}
            >
              <option value="all">Orange + Canal</option>
              <option value="ORANGE">Orange uniquement</option>
              <option value="CANAL">Canal uniquement</option>
            </select>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Target}
              label="OT Planifiés"
              value={stats.planifies}
              theme={t}
              color="blue"
            />
            <StatCard
              icon={BarChart3}
              label="OT Réalisés"
              value={stats.realises}
              theme={t}
              color="emerald"
              subValue={`${stats.tauxCloture.toFixed(1)}% de clôture`}
            />
            <StatCard
              icon={TrendingUp}
              label="Taux Réussite"
              value={`${stats.tauxReussite.toFixed(1)}%`}
              theme={t}
              color="green"
              subValue={`${stats.ok} OT OK`}
            />
            <StatCard
              icon={TrendingDown}
              label="Taux Échec"
              value={`${stats.tauxEchec.toFixed(1)}%`}
              theme={t}
              color="red"
              subValue={`${stats.nok} OT NOK`}
            />
          </div>
        )}

        {/* Graphiques */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution */}
            <div className={`${t.card} rounded-lg border ${t.border} p-6`}>
              <h3 className={`text-lg font-semibold ${t.text} mb-4`}>Évolution Quotidienne</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="planifies" stroke="#3b82f6" name="Planifiés" />
                  <Line type="monotone" dataKey="realises" stroke="#10b981" name="Réalisés" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* OK vs NOK */}
            <div className={`${t.card} rounded-lg border ${t.border} p-6`}>
              <h3 className={`text-lg font-semibold ${t.text} mb-4`}>OK vs NOK</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="ok" fill="#10b981" name="OK" />
                  <Bar dataKey="nok" fill="#ef4444" name="NOK" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table détaillée */}
        {filteredData.length > 0 ? (
          <div className={`${t.card} rounded-lg border ${t.border} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${t.bgTertiary} ${t.textSecondary} text-sm`}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    {userRole === 'admin' && <th className="px-4 py-3 text-left font-semibold">Technicien</th>}
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-center font-semibold">Planifiés</th>
                    <th className="px-4 py-3 text-center font-semibold">Réalisés</th>
                    <th className="px-4 py-3 text-center font-semibold">OK</th>
                    <th className="px-4 py-3 text-center font-semibold">NOK</th>
                    <th className="px-4 py-3 text-center font-semibold">Reportés</th>
                    <th className="px-4 py-3 text-center font-semibold">Taux Réussite</th>
                  </tr>
                </thead>
                <tbody className={`${t.text} divide-y ${t.border}`}>
                  {filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-4 py-3 font-medium">{item.technicien}</td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.type === 'CANAL' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{item.planifies}</td>
                      <td className="px-4 py-3 text-center font-semibold">{item.realises}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-semibold">{item.ok}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-semibold">{item.nok}</td>
                      <td className="px-4 py-3 text-center text-yellow-600">{item.reportes}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${
                          item.tauxReussite >= 0.7 ? 'text-green-600' : 
                          item.tauxReussite >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(item.tauxReussite * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`${t.card} rounded-lg border ${t.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${t.textMuted}`} />
            <h3 className={`text-xl font-semibold ${t.text} mb-2`}>
              Aucune donnée de suivi
            </h3>
            <p className={t.textSecondary}>
              Importez le fichier SUIVI D3 pour voir les données journalières
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant StatCard
function StatCard({ icon: Icon, label, value, subValue, theme, color = 'emerald' }) {
  const colors = {
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    green: 'text-green-500 bg-green-50 dark:bg-green-500/10',
    red: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  };
  
  return (
    <div className={`${theme.card} rounded-lg border ${theme.border} p-6`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`${theme.textSecondary} text-sm font-medium`}>{label}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={`text-2xl font-bold ${theme.text}`}>{value}</div>
      {subValue && <div className={`mt-1 text-sm ${theme.textMuted}`}>{subValue}</div>}
    </div>
  );
}
