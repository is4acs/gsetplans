import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, Euro, TrendingUp, PieChart, CheckCircle, XCircle, Clock, Target,
  Crown, Award, CalendarDays, Upload, Trash2, FileText, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie
} from 'recharts';
import * as XLSX from 'xlsx';
import { useTheme, useAmountVisibility } from '../contexts';
import { themes } from '../utils/theme';
import {
  getDailyTracking, insertDailyTracking, getDailyImports, createDailyImport, deleteDailyImport
} from '../lib/supabase';

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

  const loadDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const [tracking, imports] = await Promise.all([getDailyTracking(), getDailyImports()]);
      
      const orange = tracking.filter(d => d.type === 'ORANGE').map(d => ({
        tech: d.technicien, date: d.date, etat: d.etat, otPlanifies: d.planifies,
        otRealise: d.realises, otOK: d.ok, otNOK: d.nok, otReportes: d.reportes
      }));
      const canal = tracking.filter(d => d.type === 'CANAL').map(d => ({
        tech: d.technicien, date: d.date, etat: d.etat, otPlanifies: d.planifies,
        otRealise: d.realises, otOK: d.ok, otNOK: d.nok, otReportes: d.reportes
      }));
      
      setDailyData({ orange, canal, lastUpdate: imports[0]?.created_at || null });
      setDailyImports(imports);
    } catch (err) {
      console.error('Erreur chargement daily:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDailyData(); }, [loadDailyData]);

  const avgPrices = useMemo(() => {
    const orangeGsetAvg = orangePrices.length > 0 ? orangePrices.reduce((s, p) => s + (p.gset_price || 0), 0) / orangePrices.length : 85;
    const canalGsetAvg = canalPrices.length > 0 ? canalPrices.reduce((s, p) => s + (p.gset_price || 0), 0) / canalPrices.length : 250;
    const orangeStAvg = orangePrices.length > 0 ? orangePrices.reduce((s, p) => s + (p.montant_st || p.gset_price || 0), 0) / orangePrices.length : 100;
    const canalStAvg = canalPrices.length > 0 ? canalPrices.reduce((s, p) => s + (p.montant_st || p.gset_price || 0), 0) / canalPrices.length : 300;
    const orangeTechAvg = orangePrices.length > 0 ? orangePrices.reduce((s, p) => s + (p.tech_price || 0), 0) / orangePrices.length : 45;
    const canalTechAvg = canalPrices.length > 0 ? canalPrices.reduce((s, p) => s + (p.tech_price || 0), 0) / canalPrices.length : 120;
    
    if (isDirection) {
      return { orange: orangeGsetAvg, canal: canalGsetAvg, orangeSt: orangeStAvg, canalSt: canalStAvg, orangeTech: orangeTechAvg, canalTech: canalTechAvg };
    }
    return { orange: orangeTechAvg, canal: canalTechAvg };
  }, [orangePrices, canalPrices, isDirection]);

  const techsList = useMemo(() => {
    const techs = new Set();
    dailyData.orange.forEach(d => techs.add(d.tech));
    dailyData.canal.forEach(d => techs.add(d.tech));
    return Array.from(techs).sort();
  }, [dailyData]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const lastDataDate = useMemo(() => {
    const allDates = [...dailyData.orange.map(d => d.date), ...dailyData.canal.map(d => d.date)].filter(Boolean).sort((a, b) => b.localeCompare(a));
    return allDates[0] || null;
  }, [dailyData]);

  const filteredData = useMemo(() => {
    let orange = dailyData.orange;
    let canal = dailyData.canal;
    
    if (!isDirection && profile?.aliases?.length) {
      const aliases = profile.aliases.map(a => a.toLowerCase());
      orange = orange.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
      canal = canal.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
    }
    
    if (isDirection && selectedTech !== 'all') {
      orange = orange.filter(d => d.tech === selectedTech);
      canal = canal.filter(d => d.tech === selectedTech);
    }
    
    if (periodFilter === 'today') { orange = orange.filter(d => d.date === todayStr); canal = canal.filter(d => d.date === todayStr); }
    else if (periodFilter === 'yesterday') { orange = orange.filter(d => d.date === yesterdayStr); canal = canal.filter(d => d.date === yesterdayStr); }
    else if (periodFilter === 'week') { orange = orange.filter(d => d.date >= weekStartStr && d.date <= todayStr); canal = canal.filter(d => d.date >= weekStartStr && d.date <= todayStr); }
    else if (periodFilter === 'custom' && dateFrom && dateTo) { orange = orange.filter(d => d.date >= dateFrom && d.date <= dateTo); canal = canal.filter(d => d.date >= dateFrom && d.date <= dateTo); }
    
    return { orange, canal };
  }, [dailyData, selectedTech, periodFilter, isDirection, profile, todayStr, yesterdayStr, weekStartStr, dateFrom, dateTo]);

  const calculateStats = (data) => {
    const orangeOK = data.orange.reduce((s, d) => s + (d.otOK || 0), 0);
    const orangeNOK = data.orange.reduce((s, d) => s + (d.otNOK || 0), 0);
    const orangeReport = data.orange.reduce((s, d) => s + (d.otReportes || 0), 0);
    const canalOK = data.canal.reduce((s, d) => s + (d.otOK || 0), 0);
    const canalNOK = data.canal.reduce((s, d) => s + (d.otNOK || 0), 0);
    const canalReport = data.canal.reduce((s, d) => s + (d.otReportes || 0), 0);
    const orangeRevenu = orangeOK * avgPrices.orange;
    const canalRevenu = canalOK * avgPrices.canal;
    const orangeStRevenu = isDirection && avgPrices.orangeSt ? orangeOK * avgPrices.orangeSt : 0;
    const canalStRevenu = isDirection && avgPrices.canalSt ? canalOK * avgPrices.canalSt : 0;
    const orangeTechCost = isDirection && avgPrices.orangeTech ? orangeOK * avgPrices.orangeTech : 0;
    const canalTechCost = isDirection && avgPrices.canalTech ? canalOK * avgPrices.canalTech : 0;
    
    return {
      orange: { ok: orangeOK, nok: orangeNOK, report: orangeReport, revenu: orangeRevenu, stRevenu: orangeStRevenu, marge: orangeStRevenu - orangeTechCost },
      canal: { ok: canalOK, nok: canalNOK, report: canalReport, revenu: canalRevenu, stRevenu: canalStRevenu, marge: canalStRevenu - canalTechCost },
      total: { ok: orangeOK + canalOK, nok: orangeNOK + canalNOK, report: orangeReport + canalReport, revenu: orangeRevenu + canalRevenu, stRevenu: orangeStRevenu + canalStRevenu, marge: (orangeStRevenu - orangeTechCost) + (canalStRevenu - canalTechCost) }
    };
  };

  const stats = useMemo(() => calculateStats(filteredData), [filteredData, avgPrices]);

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

  const dailyChartData = useMemo(() => {
    const byDate = {};
    filteredData.orange.forEach(d => { if (!byDate[d.date]) byDate[d.date] = { date: d.date, orangeOK: 0, canalOK: 0 }; byDate[d.date].orangeOK += d.otOK || 0; });
    filteredData.canal.forEach(d => { if (!byDate[d.date]) byDate[d.date] = { date: d.date, orangeOK: 0, canalOK: 0 }; byDate[d.date].canalOK += d.otOK || 0; });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({ ...d, label: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }));
  }, [filteredData]);

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const orangeSheet = workbook.Sheets['SUIVI JOURNALIER ORANGE'];
      const canalSheet = workbook.Sheets['SUIVI JOURNALIER CANAL'];
      if (!orangeSheet && !canalSheet) { alert('Feuilles "SUIVI JOURNALIER ORANGE" ou "SUIVI JOURNALIER CANAL" non trouvées'); return; }

      const parseSheet = (sheet) => {
        if (!sheet) return [];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const result = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0] || !row[2]) continue;
          const dateVal = row[2];
          let dateStr = '';
          if (dateVal instanceof Date) dateStr = dateVal.toISOString().split('T')[0];
          else if (typeof dateVal === 'number') { const d = new Date((dateVal - 25569) * 86400 * 1000); dateStr = d.toISOString().split('T')[0]; }
          else if (typeof dateVal === 'string' && dateVal) dateStr = new Date(dateVal).toISOString().split('T')[0];
          if (!dateStr || dateStr === 'Invalid Date') continue;
          result.push({ tech: String(row[0]).trim(), date: dateStr, etat: String(row[3] || '').trim(), otPlanifies: parseFloat(row[4]) || 0, otRealise: parseFloat(row[5]) || 0, otOK: parseFloat(row[6]) || 0, otNOK: parseFloat(row[7]) || 0, otReportes: parseFloat(row[8]) || 0 });
        }
        return result;
      };

      const orangeData = parseSheet(orangeSheet);
      const canalData = parseSheet(canalSheet);
      const periode = `${new Date().toLocaleDateString('fr-FR')} - ${file.name}`;
      
      const supabaseRecords = [
        ...orangeData.map(d => ({ type: 'ORANGE', technicien: d.tech, date: d.date, etat: d.etat, planifies: d.otPlanifies, realises: d.otRealise, ok: d.otOK, nok: d.otNOK, reportes: d.otReportes, taux_reussite: d.otRealise > 0 ? d.otOK / d.otRealise : 0, periode })),
        ...canalData.map(d => ({ type: 'CANAL', technicien: d.tech, date: d.date, etat: d.etat, planifies: d.otPlanifies, realises: d.otRealise, ok: d.otOK, nok: d.otNOK, reportes: d.otReportes, taux_reussite: d.otRealise > 0 ? d.otOK / d.otRealise : 0, periode }))
      ];
      
      await insertDailyTracking(supabaseRecords);
      const allDates = [...orangeData, ...canalData].map(d => new Date(d.date));
      await createDailyImport({ filename: file.name, total_records: supabaseRecords.length, date_debut: allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString().split('T')[0] : null, date_fin: allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString().split('T')[0] : null, periode });
      await loadDailyData();
      alert(`Import réussi: ${orangeData.length} lignes Orange, ${canalData.length} lignes Canal+`);
    } catch (err) { console.error('Import error:', err); alert('Erreur lors de l\'import: ' + err.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const clearData = async () => {
    if (confirm('Effacer toutes les données Daily ?')) {
      for (const imp of dailyImports) { try { await deleteDailyImport(imp.id, imp.periode); } catch (e) { console.error(e); } }
      await loadDailyData();
    }
  };

  const getPeriodLabel = () => {
    if (periodFilter === 'today') return "Aujourd'hui";
    if (periodFilter === 'yesterday') return 'Hier';
    if (periodFilter === 'week') return 'Cette semaine';
    if (periodFilter === 'custom' && dateFrom && dateTo) return `Du ${new Date(dateFrom).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} au ${new Date(dateTo).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
    return 'Ce mois';
  };

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

  const PeriodTab = ({ id, label, active }) => (
    <button onClick={() => setPeriodFilter(id)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : `${t.textSecondary} hover:${t.bgTertiary}`}`}>{label}</button>
  );

  if (dailyData.orange.length === 0 && dailyData.canal.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25"><Activity className="w-7 h-7 text-white" /></div>
              <div><h2 className={`text-xl font-bold ${t.text}`}>{isDirection ? 'Revenus équipe' : 'Mes revenus'}</h2></div>
            </div>
            {isDirection && (
              <label className={`px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-all bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2`}>
                <Upload className="w-4 h-4" />Importer
                <input type="file" accept=".xlsx,.xls" onChange={handleFileImport} className="hidden" />
              </label>
            )}
          </div>
        </div>
        <div className={`rounded-2xl border ${t.card} p-12 text-center`}>
          <CalendarDays className={`w-16 h-16 mx-auto mb-4 ${t.textMuted}`} />
          <h3 className={`text-lg font-semibold ${t.text} mb-2`}>Aucune donnée Daily</h3>
          <p className={`${t.textMuted} mb-4`}>{isDirection ? 'Importez le fichier SUIVI.xlsx pour voir la progression quotidienne' : 'Les données seront disponibles une fois importées par l\'administrateur'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl border ${t.card} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25"><Activity className="w-7 h-7 text-white" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold ${t.text}`}>{isDirection ? 'Revenus équipe' : 'Mes revenus'}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.bgTertiary} ${t.textMuted}`}>{new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <p className={`text-sm ${t.textMuted} mt-0.5`}>{lastDataDate ? `Données à jour jusqu'au ${new Date(lastDataDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}` : 'Aucune donnée importée'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${t.bgTertiary}`}>
              <PeriodTab id="yesterday" label="Hier" active={periodFilter === 'yesterday'} />
              <PeriodTab id="today" label="Aujourd'hui" active={periodFilter === 'today'} />
              <PeriodTab id="week" label="Cette semaine" active={periodFilter === 'week'} />
              <PeriodTab id="month" label="Ce mois" active={periodFilter === 'month'} />
              <PeriodTab id="custom" label="Personnalisé" active={periodFilter === 'custom'} />
            </div>
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${t.textMuted}`}>Du</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`px-3 py-2 rounded-lg border text-sm ${t.input} ${t.text}`} />
                <span className={`text-sm ${t.textMuted}`}>au</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`px-3 py-2 rounded-lg border text-sm ${t.input} ${t.text}`} />
              </div>
            )}
            {isDirection && (
              <>
                <label className={`px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-all ${importing ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600'} text-white flex items-center gap-2`}>
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{importing ? 'Import...' : 'Importer'}
                  <input type="file" accept=".xlsx,.xls" onChange={handleFileImport} className="hidden" disabled={importing} />
                </label>
                {dailyData.orange.length > 0 && <button onClick={clearData} className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white"><Trash2 className="w-4 h-4" /></button>}
              </>
            )}
          </div>
        </div>
      </div>

      {isDirection && <div className="flex gap-3"><select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className={`px-4 py-2.5 rounded-xl border ${t.input} ${t.text} font-medium`}><option value="all">👥 Tous les techniciens</option>{techsList.map(tech => <option key={tech} value={tech}>{tech}</option>)}</select></div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className={`lg:col-span-1 ${t.bgSecondary} rounded-2xl p-6 border ${t.border}`}>
          <div className="flex items-center gap-3 mb-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"><Euro className="w-7 h-7 text-white" /></div></div>
          <p className={`text-sm ${t.textMuted} mb-1`}>{isDirection ? 'Total facturé' : 'Revenus'}</p>
          <p className="text-4xl font-bold text-emerald-500">{showAmounts ? `${stats.total.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p>
          <p className={`text-xs ${t.textMuted} mt-2`}>{getPeriodLabel()}</p>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <EarningCard icon={TrendingUp} label="Orange" value={`${stats.orange.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`} color="text-orange-500" iconBg="bg-orange-100" />
          <EarningCard icon={PieChart} label="Canal+" value={`${stats.canal.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`} color="text-purple-500" iconBg="bg-purple-100" />
          <EarningCard icon={CheckCircle} label="OT Réussis" value={stats.total.ok.toString()} color="text-emerald-500" iconBg="bg-emerald-100" />
          <EarningCard icon={XCircle} label="OT Échoués" value={stats.total.nok.toString()} color="text-red-500" iconBg="bg-red-100" />
          <EarningCard icon={Clock} label="OT Reportés" value={stats.total.report.toString()} color="text-yellow-600" iconBg="bg-yellow-100" />
          <EarningCard icon={Target} label="Taux réussite" value={stats.total.ok + stats.total.nok > 0 ? `${Math.round(stats.total.ok / (stats.total.ok + stats.total.nok) * 100)}%` : '0%'} color="text-blue-500" iconBg="bg-blue-100" />
        </div>
      </div>

      {/* Super Admin Section */}
      {isSuperAdmin && (
        <div className={`rounded-2xl border-2 border-amber-500/30 ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Crown className="w-5 h-5 text-white" /></div>
            <div><h3 className={`font-semibold ${t.text}`}>Vue Super Admin</h3><p className={`text-xs ${t.textMuted}`}>Prix ST et marges GSET</p></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-amber-500" /><span className={`text-xs font-medium ${t.textMuted}`}>Revenu ST Total</span></div><p className="text-2xl font-bold text-amber-500">{showAmounts ? `${stats.total.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className={`text-xs font-medium ${t.textMuted}`}>Marge GSET</span></div><p className={`text-2xl font-bold ${stats.total.marge >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{showAmounts ? `${stats.total.marge.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className={`text-xs font-medium ${t.textMuted}`}>ST Orange</span></div><p className="text-xl font-bold text-orange-500">{showAmounts ? `${stats.orange.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className={`text-xs font-medium ${t.textMuted}`}>ST Canal+</span></div><p className="text-xl font-bold text-purple-500">{showAmounts ? `${stats.canal.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div><div><h3 className={`font-semibold ${t.text}`}>Évolution journalière</h3><p className={`text-sm ${t.textMuted}`}>OT réussis par jour</p></div></div>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyChartData}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} /><XAxis dataKey="label" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} /><YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} /><Tooltip /><Bar dataKey="orangeOK" name="Orange" fill="#f97316" radius={[4, 4, 0, 0]} /><Bar dataKey="canalOK" name="Canal+" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center"><PieChart className="w-5 h-5 text-white" /></div><div><h3 className={`font-semibold ${t.text}`}>Répartition</h3><p className={`text-sm ${t.textMuted}`}>OK / NOK / Reportés</p></div></div>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={[{ name: 'Réussis', value: stats.total.ok, fill: '#10b981' }, { name: 'Échoués', value: stats.total.nok, fill: '#ef4444' }, { name: 'Reportés', value: stats.total.report, fill: '#f59e0b' }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" /><Tooltip /></RePieChart></ResponsiveContainer></div>
          <div className="flex justify-center gap-4 mt-2"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className={`text-xs ${t.textSecondary}`}>OK ({stats.total.ok})</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className={`text-xs ${t.textSecondary}`}>NOK ({stats.total.nok})</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className={`text-xs ${t.textSecondary}`}>Report ({stats.total.report})</span></div></div>
        </div>
      </div>

      {/* Tech Performance Table */}
      {isDirection && techPerformance.length > 0 && (
        <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
          <div className={`p-4 border-b ${t.border}`}><h3 className={`font-semibold ${t.text}`}>Classement techniciens</h3><p className={`text-sm ${t.textMuted}`}>{getPeriodLabel()}</p></div>
          <div className="overflow-x-auto">
            <table className="w-full"><thead className={t.bgTertiary}><tr><th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>#</th><th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Orange</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Canal+</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Total OT</th><th className={`px-4 py-3 text-right text-xs font-semibold ${t.textSecondary} uppercase`}>Revenu ST</th></tr></thead>
              <tbody className={`divide-y ${t.border}`}>{techPerformance.slice(0, 15).map((tech, idx) => (<tr key={tech.tech} className={t.bgHover}><td className={`px-4 py-3 ${t.textMuted}`}>{idx === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <Award className="w-5 h-5 text-gray-400" /> : idx === 2 ? <Award className="w-5 h-5 text-amber-600" /> : idx + 1}</td><td className={`px-4 py-3 font-medium ${t.text}`}>{tech.tech}</td><td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 font-medium text-sm">{tech.orangeOK}</span></td><td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-600 font-medium text-sm">{tech.canalOK}</span></td><td className={`px-4 py-3 text-center font-bold ${t.text}`}>{tech.total}</td><td className="px-4 py-3 text-right font-bold text-emerald-500">{showAmounts ? `${tech.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
        <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
          <div><h3 className={`font-semibold ${t.text}`}>Détail journalier</h3><p className={`text-sm ${t.textMuted}`}>{filteredData.orange.length + filteredData.canal.length} entrées • {getPeriodLabel()}</p></div>
          {(filteredData.orange.length + filteredData.canal.length) > 20 && <button onClick={() => setShowAllDetails(!showAllDetails)} className={`px-4 py-2 rounded-lg text-sm font-medium ${showAllDetails ? 'bg-gray-200 text-gray-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>{showAllDetails ? 'Réduire' : `Afficher tout`}</button>}
        </div>
        <div className={`overflow-x-auto ${showAllDetails ? 'max-h-[600px]' : 'max-h-80'}`}>
          <table className="w-full"><thead className={`${t.bgTertiary} sticky top-0`}><tr><th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Date</th>{isDirection && <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th>}<th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Source</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>État</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>OK</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>NOK</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Report</th></tr></thead>
            <tbody className={`divide-y ${t.border}`}>{[...filteredData.orange.map(d => ({ ...d, source: 'Orange' })), ...filteredData.canal.map(d => ({ ...d, source: 'Canal+' }))].sort((a, b) => b.date.localeCompare(a.date) || a.tech.localeCompare(b.tech)).slice(0, showAllDetails ? 500 : 20).map((d, idx) => (<tr key={`${d.source}-${d.tech}-${d.date}-${idx}`} className={t.bgHover}><td className={`px-4 py-2.5 text-sm ${t.text}`}>{new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</td>{isDirection && <td className={`px-4 py-2.5 text-sm font-medium ${t.text}`}>{d.tech}</td>}<td className="px-4 py-2.5"><span className={`px-2 py-1 rounded-full text-xs font-medium ${d.source === 'Orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{d.source}</span></td><td className="px-4 py-2.5 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${d.etat === 'Terminée' ? 'bg-emerald-100 text-emerald-700' : d.etat === 'Non planifiée' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{d.etat || '-'}</span></td><td className="px-4 py-2.5 text-center text-sm font-medium text-emerald-500">{d.otOK || 0}</td><td className="px-4 py-2.5 text-center text-sm font-medium text-red-500">{d.otNOK || 0}</td><td className="px-4 py-2.5 text-center text-sm font-medium text-yellow-500">{d.otReportes || 0}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DailyPage;
