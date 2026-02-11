import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, Euro, TrendingUp, PieChart, CheckCircle, XCircle, Clock, Target,
  Crown, Award, CalendarDays, Upload, Trash2, FileText, Loader2, ArrowUpRight,
  ArrowDownRight, Minus, ChevronLeft, ChevronRight, BarChart2, Percent, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, LineChart, Line, Legend, ComposedChart, Area
} from 'recharts';
// XLSX est lazy-loadé uniquement lors de l'import de fichiers
import { useTheme, useAmountVisibility } from '../contexts';
import { themes } from '../utils/theme';
import {
  getDailyTracking, insertDailyTracking, getDailyImports, createDailyImport, deleteDailyImport
} from '../lib/supabase';

const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Vues rapides pour le suivi journalier
const QUICK_VIEWS = [
  { value: 'yesterday', label: 'Hier' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
];

// Semaines du mois (S1-S4 uniquement)
const WEEKS = [
  { value: 1, label: 'S1' },
  { value: 2, label: 'S2' },
  { value: 3, label: 'S3' },
  { value: 4, label: 'S4' },
];

// Fonction pour parser une date string YYYY-MM-DD en composants locaux (évite les problèmes UTC)
const parseDateLocal = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day, date: new Date(year, month - 1, day) };
};

// Fonction pour obtenir la date locale au format YYYY-MM-DD
const getLocalDateStr = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fonction pour formater une date string YYYY-MM-DD en format lisible
const formatDateDisplay = (dateStr) => {
  const parsed = parseDateLocal(dateStr);
  if (!parsed) return dateStr;
  return parsed.date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};

// Fonction pour obtenir le numéro de semaine dans le mois (S1-S4)
// S1 = jours 1-7, S2 = jours 8-14, S3 = jours 15-21, S4 = jours 22-fin du mois
const getWeekOfMonth = (dateInput) => {
  let day;
  if (typeof dateInput === 'string') {
    const parsed = parseDateLocal(dateInput);
    day = parsed ? parsed.day : 1;
  } else {
    day = new Date(dateInput).getDate();
  }
  
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4; // 22-31
};

// Fonction pour obtenir les dates de début/fin de semaine dans le mois
const getWeekDateRange = (year, month, weekNum) => {
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  
  let startDay, endDay;
  switch (weekNum) {
    case 1: startDay = 1; endDay = 7; break;
    case 2: startDay = 8; endDay = 14; break;
    case 3: startDay = 15; endDay = 21; break;
    case 4: startDay = 22; endDay = lastDayOfMonth; break;
    default: startDay = 1; endDay = lastDayOfMonth;
  }
  
  return {
    start: new Date(year, month - 1, startDay),
    end: new Date(year, month - 1, Math.min(endDay, lastDayOfMonth)),
    startDay,
    endDay: Math.min(endDay, lastDayOfMonth)
  };
};

function DailyPage({ orangePrices, canalPrices, profile }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const [dailyData, setDailyData] = useState({ orange: [], canal: [], lastUpdate: null });
  const [dailyImports, setDailyImports] = useState([]);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState('all');
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [quickView, setQuickView] = useState('month'); // Vue rapide: yesterday, today, week, month

  // Sélection du mois et semaine
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(null); // null = tout le mois, 1-4 = semaine spécifique

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

  // Calcul du mois précédent
  const prevMonth = useMemo(() => {
    let m = selectedMonth - 1;
    let y = selectedYear;
    if (m < 1) { m = 12; y--; }
    return { month: m, year: y };
  }, [selectedMonth, selectedYear]);

  // Filtrage par vue rapide (utilise les dates locales)
  const filterByQuickView = useCallback((data, view) => {
    const now = new Date();
    const todayStr = getLocalDateStr(now);
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    
    // Début de la semaine courante (lundi)
    const weekStart = new Date(now);
    const dayOfWeek = now.getDay() || 7; // Dimanche = 7
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    const weekStartStr = getLocalDateStr(weekStart);
    
    // Début du mois courant
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    return data.filter(d => {
      if (!d.date) return false;
      const dateStr = d.date; // Format YYYY-MM-DD
      
      switch (view) {
        case 'yesterday':
          return dateStr === yesterdayStr;
        case 'today':
          return dateStr === todayStr;
        case 'week':
          return dateStr >= weekStartStr && dateStr <= todayStr;
        case 'month':
        default:
          return dateStr >= monthStartStr && dateStr <= todayStr;
      }
    });
  }, []);

  // Filtrage par mois et semaine (utilise les dates locales)
  const filterByPeriod = useCallback((data, year, month, week) => {
    return data.filter(d => {
      if (!d.date) return false;
      
      const parsed = parseDateLocal(d.date);
      if (!parsed) return false;
      
      // Vérifier année et mois
      if (parsed.year !== year || parsed.month !== month) return false;
      
      // Si une semaine est spécifiée, vérifier
      if (week !== null && week > 0) {
        const weekOfMonth = getWeekOfMonth(d.date);
        return weekOfMonth === week;
      }
      
      return true;
    });
  }, []);

  // Données filtrées pour la période en cours
  const filteredCurrentPeriod = useMemo(() => {
    let orange, canal;
    
    // Si on est en mode comparaison, utiliser le filtrage par mois/semaine
    if (compareMode) {
      orange = filterByPeriod(dailyData.orange, selectedYear, selectedMonth, selectedWeek);
      canal = filterByPeriod(dailyData.canal, selectedYear, selectedMonth, selectedWeek);
    } else if (quickView) {
      // Sinon utiliser la vue rapide si elle est définie
      orange = filterByQuickView(dailyData.orange, quickView);
      canal = filterByQuickView(dailyData.canal, quickView);
    } else {
      orange = filterByPeriod(dailyData.orange, selectedYear, selectedMonth, selectedWeek);
      canal = filterByPeriod(dailyData.canal, selectedYear, selectedMonth, selectedWeek);
    }
    
    if (!isDirection && profile?.aliases?.length) {
      const aliases = profile.aliases.map(a => a.toLowerCase());
      orange = orange.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
      canal = canal.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
    }
    
    if (isDirection && selectedTech !== 'all') {
      orange = orange.filter(d => d.tech === selectedTech);
      canal = canal.filter(d => d.tech === selectedTech);
    }
    
    return { orange, canal };
  }, [dailyData, selectedYear, selectedMonth, selectedWeek, selectedTech, isDirection, profile, filterByPeriod, filterByQuickView, quickView, compareMode]);

  // Données filtrées pour la période précédente (mois précédent, même semaine)
  const filteredPrevPeriod = useMemo(() => {
    let orange = filterByPeriod(dailyData.orange, prevMonth.year, prevMonth.month, selectedWeek);
    let canal = filterByPeriod(dailyData.canal, prevMonth.year, prevMonth.month, selectedWeek);
    
    if (!isDirection && profile?.aliases?.length) {
      const aliases = profile.aliases.map(a => a.toLowerCase());
      orange = orange.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
      canal = canal.filter(d => aliases.some(a => d.tech?.toLowerCase().includes(a) || a.includes(d.tech?.toLowerCase() || '')));
    }
    
    if (isDirection && selectedTech !== 'all') {
      orange = orange.filter(d => d.tech === selectedTech);
      canal = canal.filter(d => d.tech === selectedTech);
    }
    
    return { orange, canal };
  }, [dailyData, prevMonth, selectedWeek, selectedTech, isDirection, profile, filterByPeriod]);

  const calculateStats = (data) => {
    const orangeOK = data.orange.reduce((s, d) => s + (d.otOK || 0), 0);
    const orangeNOK = data.orange.reduce((s, d) => s + (d.otNOK || 0), 0);
    const orangeReport = data.orange.reduce((s, d) => s + (d.otReportes || 0), 0);
    const orangePlanifies = data.orange.reduce((s, d) => s + (d.otPlanifies || 0), 0);
    const canalOK = data.canal.reduce((s, d) => s + (d.otOK || 0), 0);
    const canalNOK = data.canal.reduce((s, d) => s + (d.otNOK || 0), 0);
    const canalReport = data.canal.reduce((s, d) => s + (d.otReportes || 0), 0);
    const canalPlanifies = data.canal.reduce((s, d) => s + (d.otPlanifies || 0), 0);
    const orangeRevenu = orangeOK * avgPrices.orange;
    const canalRevenu = canalOK * avgPrices.canal;
    const orangeStRevenu = isDirection && avgPrices.orangeSt ? orangeOK * avgPrices.orangeSt : 0;
    const canalStRevenu = isDirection && avgPrices.canalSt ? canalOK * avgPrices.canalSt : 0;
    const orangeTechCost = isDirection && avgPrices.orangeTech ? orangeOK * avgPrices.orangeTech : 0;
    const canalTechCost = isDirection && avgPrices.canalTech ? canalOK * avgPrices.canalTech : 0;
    
    const totalOK = orangeOK + canalOK;
    const totalNOK = orangeNOK + canalNOK;
    const totalPlanifies = orangePlanifies + canalPlanifies;
    const tauxReussite = (totalOK + totalNOK) > 0 ? (totalOK / (totalOK + totalNOK)) * 100 : 0;
    const tauxRealisation = totalPlanifies > 0 ? (totalOK / totalPlanifies) * 100 : 0;
    const nbJours = new Set([...data.orange.map(d => d.date), ...data.canal.map(d => d.date)]).size;
    const moyenneJour = nbJours > 0 ? totalOK / nbJours : 0;
    
    return {
      orange: { ok: orangeOK, nok: orangeNOK, report: orangeReport, planifies: orangePlanifies, revenu: orangeRevenu, stRevenu: orangeStRevenu, marge: orangeStRevenu - orangeTechCost },
      canal: { ok: canalOK, nok: canalNOK, report: canalReport, planifies: canalPlanifies, revenu: canalRevenu, stRevenu: canalStRevenu, marge: canalStRevenu - canalTechCost },
      total: { 
        ok: totalOK, nok: totalNOK, report: orangeReport + canalReport, planifies: totalPlanifies,
        revenu: orangeRevenu + canalRevenu, stRevenu: orangeStRevenu + canalStRevenu, 
        marge: (orangeStRevenu - orangeTechCost) + (canalStRevenu - canalTechCost),
        tauxReussite, tauxRealisation, nbJours, moyenneJour
      }
    };
  };

  const statsCurrent = useMemo(() => calculateStats(filteredCurrentPeriod), [filteredCurrentPeriod, avgPrices]);
  const statsPrev = useMemo(() => calculateStats(filteredPrevPeriod), [filteredPrevPeriod, avgPrices]);

  // Calcul de l'évolution
  const evolution = useMemo(() => {
    const calcDiff = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
    const calcDiffAbs = (curr, prev) => curr - prev;
    return {
      ok: calcDiff(statsCurrent.total.ok, statsPrev.total.ok),
      okAbs: calcDiffAbs(statsCurrent.total.ok, statsPrev.total.ok),
      nok: calcDiff(statsCurrent.total.nok, statsPrev.total.nok),
      nokAbs: calcDiffAbs(statsCurrent.total.nok, statsPrev.total.nok),
      revenu: calcDiff(statsCurrent.total.revenu, statsPrev.total.revenu),
      revenuAbs: calcDiffAbs(statsCurrent.total.revenu, statsPrev.total.revenu),
      orangeOK: calcDiff(statsCurrent.orange.ok, statsPrev.orange.ok),
      orangeOKAbs: calcDiffAbs(statsCurrent.orange.ok, statsPrev.orange.ok),
      canalOK: calcDiff(statsCurrent.canal.ok, statsPrev.canal.ok),
      canalOKAbs: calcDiffAbs(statsCurrent.canal.ok, statsPrev.canal.ok),
      tauxReussite: calcDiffAbs(statsCurrent.total.tauxReussite, statsPrev.total.tauxReussite),
      moyenneJour: calcDiffAbs(statsCurrent.total.moyenneJour, statsPrev.total.moyenneJour),
    };
  }, [statsCurrent, statsPrev]);

  const techPerformance = useMemo(() => {
    if (!isDirection) return [];
    const byTech = {};
    filteredCurrentPeriod.orange.forEach(d => {
      if (!byTech[d.tech]) byTech[d.tech] = { tech: d.tech, orangeOK: 0, canalOK: 0, total: 0, revenu: 0, nok: 0 };
      byTech[d.tech].orangeOK += d.otOK || 0;
      byTech[d.tech].total += d.otOK || 0;
      byTech[d.tech].nok += d.otNOK || 0;
      byTech[d.tech].revenu += (d.otOK || 0) * avgPrices.orange;
    });
    filteredCurrentPeriod.canal.forEach(d => {
      if (!byTech[d.tech]) byTech[d.tech] = { tech: d.tech, orangeOK: 0, canalOK: 0, total: 0, revenu: 0, nok: 0 };
      byTech[d.tech].canalOK += d.otOK || 0;
      byTech[d.tech].total += d.otOK || 0;
      byTech[d.tech].nok += d.otNOK || 0;
      byTech[d.tech].revenu += (d.otOK || 0) * avgPrices.canal;
    });
    return Object.values(byTech).sort((a, b) => b.total - a.total);
  }, [filteredCurrentPeriod, avgPrices, isDirection]);

  // Données pour graphique comparatif
  const comparisonChartData = useMemo(() => {
    if (!compareMode) return [];
    
    const byDay = {};
    // Période actuelle
    [...filteredCurrentPeriod.orange, ...filteredCurrentPeriod.canal].forEach(d => {
      const parsed = parseDateLocal(d.date);
      const day = parsed ? parsed.day : 1;
      if (!byDay[day]) byDay[day] = { day, current: 0, prev: 0 };
      byDay[day].current += d.otOK || 0;
    });
    // Période précédente
    [...filteredPrevPeriod.orange, ...filteredPrevPeriod.canal].forEach(d => {
      const parsed = parseDateLocal(d.date);
      const day = parsed ? parsed.day : 1;
      if (!byDay[day]) byDay[day] = { day, current: 0, prev: 0 };
      byDay[day].prev += d.otOK || 0;
    });
    
    return Object.values(byDay).sort((a, b) => a.day - b.day).map(d => ({
      ...d,
      label: `J${d.day}`,
      diff: d.current - d.prev
    }));
  }, [filteredCurrentPeriod, filteredPrevPeriod, compareMode]);

  // Données pour graphique standard
  const dailyChartData = useMemo(() => {
    const byDate = {};
    [...filteredCurrentPeriod.orange, ...filteredCurrentPeriod.canal].forEach(d => {
      const parsed = parseDateLocal(d.date);
      const day = parsed ? parsed.day : 1;
      if (!byDate[day]) byDate[day] = { day, orangeOK: 0, canalOK: 0 };
      if (filteredCurrentPeriod.orange.includes(d)) byDate[day].orangeOK += d.otOK || 0;
      else byDate[day].canalOK += d.otOK || 0;
    });
    return Object.values(byDate).sort((a, b) => a.day - b.day).map(d => ({
      ...d,
      label: `${d.day}`,
      total: d.orangeOK + d.canalOK
    }));
  }, [filteredCurrentPeriod]);

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import('xlsx');
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
      
      // Fonction de déduplication : garde le dernier enregistrement pour chaque clé unique (technicien+date+type)
      const deduplicateRecords = (records) => {
        const map = new Map();
        for (const rec of records) {
          const key = `${rec.technicien}|${rec.date}|${rec.type}`;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, rec);
          } else {
            // Fusionner: prendre les valeurs non-nulles ou additionner si les deux ont des données
            map.set(key, {
              ...existing,
              etat: rec.etat || existing.etat,
              planifies: Math.max(rec.planifies || 0, existing.planifies || 0),
              realises: Math.max(rec.realises || 0, existing.realises || 0),
              ok: Math.max(rec.ok || 0, existing.ok || 0),
              nok: Math.max(rec.nok || 0, existing.nok || 0),
              reportes: Math.max(rec.reportes || 0, existing.reportes || 0),
              taux_reussite: Math.max(rec.taux_reussite || 0, existing.taux_reussite || 0)
            });
          }
        }
        return Array.from(map.values());
      };
      
      const allRecords = [
        ...orangeData.map(d => ({ type: 'ORANGE', technicien: d.tech, date: d.date, etat: d.etat, planifies: d.otPlanifies, realises: d.otRealise, ok: d.otOK, nok: d.otNOK, reportes: d.otReportes, taux_reussite: d.otRealise > 0 ? d.otOK / d.otRealise : 0, periode })),
        ...canalData.map(d => ({ type: 'CANAL', technicien: d.tech, date: d.date, etat: d.etat, planifies: d.otPlanifies, realises: d.otRealise, ok: d.otOK, nok: d.otNOK, reportes: d.otReportes, taux_reussite: d.otRealise > 0 ? d.otOK / d.otRealise : 0, periode }))
      ];
      
      // Dédupliquer pour éviter l'erreur "ON CONFLICT DO UPDATE cannot affect row a second time"
      const supabaseRecords = deduplicateRecords(allRecords);
      console.log(`Import: ${allRecords.length} lignes brutes → ${supabaseRecords.length} lignes après déduplication`);
      
      await insertDailyTracking(supabaseRecords);
      const allDates = [...orangeData, ...canalData].map(d => new Date(d.date));
      await createDailyImport({ filename: file.name, total_records: supabaseRecords.length, date_debut: allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString().split('T')[0] : null, date_fin: allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString().split('T')[0] : null, periode });
      await loadDailyData();
      const dupCount = allRecords.length - supabaseRecords.length;
      alert(`Import réussi!\n${supabaseRecords.length} enregistrements importés${dupCount > 0 ? `\n(${dupCount} doublons fusionnés)` : ''}`);
    } catch (err) { console.error('Import error:', err); alert('Erreur lors de l\'import: ' + err.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const clearData = async () => {
    if (confirm('Effacer toutes les données Daily ?')) {
      for (const imp of dailyImports) { try { await deleteDailyImport(imp.id, imp.periode); } catch (e) { console.error(e); } }
      await loadDailyData();
    }
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  const getPeriodLabel = () => {
    if (!compareMode && quickView) {
      switch (quickView) {
        case 'yesterday': return 'Hier';
        case 'today': return "Aujourd'hui";
        case 'week': return 'Cette semaine';
        case 'month': return 'Ce mois';
      }
    }
    const weekLabel = selectedWeek ? ` - S${selectedWeek}` : '';
    return `${MONTHS_FR[selectedMonth]} ${selectedYear}${weekLabel}`;
  };

  const getPrevPeriodLabel = () => {
    const weekLabel = selectedWeek ? ` - S${selectedWeek}` : '';
    return `${MONTHS_FR[prevMonth.month]} ${prevMonth.year}${weekLabel}`;
  };

  const getQuickViewLabel = () => {
    switch (quickView) {
      case 'yesterday': return 'Hier';
      case 'today': return "Aujourd'hui";
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      default: return '';
    }
  };

  const EvolutionBadge = ({ value, inverse = false, showAbs = false, absValue }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = value === 0;
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${isNeutral ? 'bg-gray-100 text-gray-600' : isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {showAbs && absValue !== undefined ? `${absValue >= 0 ? '+' : ''}${absValue}` : `${Math.abs(value)}%`}
      </span>
    );
  };

  const EarningCard = ({ icon: Icon, label, value, color, iconBg, evolution: evo, evolutionAbs, inverse }) => (
    <div className={`${t.bgSecondary} rounded-2xl p-5 border ${t.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${t.text}`}>{showAmounts ? value : '••••'}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className={`text-sm ${t.textMuted}`}>{label}</p>
            {compareMode && evo !== undefined && <EvolutionBadge value={evo} inverse={inverse} />}
            {compareMode && evolutionAbs !== undefined && <EvolutionBadge value={evolutionAbs} showAbs absValue={evolutionAbs} inverse={inverse} />}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (dailyData.orange.length === 0 && dailyData.canal.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25"><Activity className="w-7 h-7 text-white" /></div>
              <div><h2 className={`text-xl font-bold ${t.text}`}>{isDirection ? 'Suivi Journalier' : 'Mon suivi'}</h2></div>
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
          <p className={`${t.textMuted} mb-4`}>{isDirection ? 'Importez le fichier SUIVI.xlsx' : 'Données disponibles après import par l\'admin'}</p>
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
              <h2 className={`text-xl font-bold ${t.text}`}>{isDirection ? 'Suivi Journalier' : 'Mon suivi'}</h2>
              <p className={`text-sm ${t.textMuted} mt-0.5`}>{getPeriodLabel()}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Vues rapides */}
            {!compareMode && (
              <div className={`grid w-full sm:w-auto grid-cols-4 gap-1 p-1 rounded-xl ${t.bgTertiary}`}>
                {QUICK_VIEWS.map(v => (
                  <button 
                    key={v.value} 
                    onClick={() => { setQuickView(v.value); setSelectedWeek(null); }}
                    className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-center ${quickView === v.value && !compareMode ? 'bg-emerald-500 text-white shadow' : `${t.textSecondary} ${t.bgHover}`}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Mode comparaison : Sélecteur de mois */}
            {compareMode && (
              <div className={`flex items-center gap-1 p-1 rounded-xl ${t.bgTertiary}`}>
                <button onClick={goToPrevMonth} className={`p-2 rounded-lg ${t.bgHover} transition-colors`}><ChevronLeft className="w-5 h-5" /></button>
                <span className={`px-2 py-1.5 font-semibold ${t.text} min-w-[120px] text-center text-sm`}>{MONTHS_FR[selectedMonth]} {selectedYear}</span>
                <button onClick={goToNextMonth} className={`p-2 rounded-lg ${t.bgHover} transition-colors`}><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
            
            {/* Mode comparaison : Sélecteur de semaine S1-S4 */}
            {compareMode && (
              <div className={`flex gap-1 p-1 rounded-xl ${t.bgTertiary}`}>
                <button 
                  onClick={() => setSelectedWeek(null)} 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedWeek === null ? 'bg-blue-500 text-white shadow' : `${t.textSecondary} ${t.bgHover}`}`}
                >
                  Mois
                </button>
                {WEEKS.map(w => (
                  <button 
                    key={w.value} 
                    onClick={() => setSelectedWeek(w.value)} 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedWeek === w.value ? 'bg-blue-500 text-white shadow' : `${t.textSecondary} ${t.bgHover}`}`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Toggle comparaison */}
            <button 
              onClick={() => {
                setCompareMode(!compareMode);
                if (!compareMode) {
                  setQuickView(null);
                  setSelectedWeek(null);
                } else {
                  setQuickView('month');
                }
              }} 
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${compareMode ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : `${t.bgTertiary} ${t.textSecondary}`}`}
            >
              {compareMode ? '📊 Comparaison ON' : '📊 Comparer'}
            </button>
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

      {isDirection && (
        <div className="flex gap-3">
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border ${t.input} ${t.text} font-medium`}
          >
            <option value="all">👥 Tous les techniciens</option>
            {techsList.map(tech => <option key={tech} value={tech}>{tech}</option>)}
          </select>
        </div>
      )}

      {/* Bandeau comparaison */}
      {compareMode && (
        <div className={`rounded-2xl p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className={`font-medium ${t.text}`}>{getPeriodLabel()}</span>
                <span className={`text-sm ${t.textMuted}`}>({statsCurrent.total.ok} OT)</span>
              </div>
              <span className={t.textMuted}>vs</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className={`font-medium ${t.text}`}>{getPrevPeriodLabel()}</span>
                <span className={`text-sm ${t.textMuted}`}>({statsPrev.total.ok} OT)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${t.textMuted}`}>Différence:</span>
              <EvolutionBadge value={evolution.okAbs} showAbs absValue={evolution.okAbs} />
            </div>
          </div>
        </div>
      )}

      {/* Indicateurs de comparaison avancés */}
      {compareMode && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${t.bgSecondary} rounded-2xl p-4 border ${t.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-medium ${t.textMuted}`}>Productivité/jour</span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-bold ${t.text}`}>{statsCurrent.total.moyenneJour.toFixed(1)}</p>
              <EvolutionBadge value={evolution.moyenneJour} showAbs absValue={parseFloat(evolution.moyenneJour.toFixed(1))} />
            </div>
            <p className={`text-xs ${t.textMuted} mt-1`}>vs {statsPrev.total.moyenneJour.toFixed(1)} OT/jour</p>
          </div>
          <div className={`${t.bgSecondary} rounded-2xl p-4 border ${t.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-blue-500" />
              <span className={`text-xs font-medium ${t.textMuted}`}>Taux de réussite</span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-bold ${t.text}`}>{statsCurrent.total.tauxReussite.toFixed(1)}%</p>
              <EvolutionBadge value={evolution.tauxReussite} showAbs absValue={parseFloat(evolution.tauxReussite.toFixed(1))} />
            </div>
            <p className={`text-xs ${t.textMuted} mt-1`}>vs {statsPrev.total.tauxReussite.toFixed(1)}%</p>
          </div>
          <div className={`${t.bgSecondary} rounded-2xl p-4 border ${t.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-orange-500" />
              <span className={`text-xs font-medium ${t.textMuted}`}>Évol. Orange</span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-bold text-orange-500`}>{statsCurrent.orange.ok}</p>
              <EvolutionBadge value={evolution.orangeOKAbs} showAbs absValue={evolution.orangeOKAbs} />
            </div>
            <p className={`text-xs ${t.textMuted} mt-1`}>vs {statsPrev.orange.ok} OT</p>
          </div>
          <div className={`${t.bgSecondary} rounded-2xl p-4 border ${t.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-purple-500" />
              <span className={`text-xs font-medium ${t.textMuted}`}>Évol. Canal+</span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-bold text-purple-500`}>{statsCurrent.canal.ok}</p>
              <EvolutionBadge value={evolution.canalOKAbs} showAbs absValue={evolution.canalOKAbs} />
            </div>
            <p className={`text-xs ${t.textMuted} mt-1`}>vs {statsPrev.canal.ok} OT</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className={`lg:col-span-1 ${t.bgSecondary} rounded-2xl p-6 border ${t.border}`}>
          <div className="flex items-center gap-3 mb-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"><Euro className="w-7 h-7 text-white" /></div></div>
          <p className={`text-sm ${t.textMuted} mb-1`}>{isDirection ? 'Total facturé' : 'Revenus'}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-4xl font-bold text-emerald-500">{showAmounts ? `${statsCurrent.total.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p>
            {compareMode && <EvolutionBadge value={evolution.revenu} />}
          </div>
          {compareMode && <p className={`text-xs ${t.textMuted} mt-2`}>vs {statsPrev.total.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</p>}
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <EarningCard icon={TrendingUp} label="Orange" value={`${statsCurrent.orange.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`} color="text-orange-500" iconBg="bg-orange-100" evolution={evolution.orangeOK} evolutionAbs={evolution.orangeOKAbs} />
          <EarningCard icon={PieChart} label="Canal+" value={`${statsCurrent.canal.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`} color="text-purple-500" iconBg="bg-purple-100" evolution={evolution.canalOK} evolutionAbs={evolution.canalOKAbs} />
          <EarningCard icon={CheckCircle} label="OT Réussis" value={statsCurrent.total.ok.toString()} color="text-emerald-500" iconBg="bg-emerald-100" evolution={evolution.ok} evolutionAbs={evolution.okAbs} />
          <EarningCard icon={XCircle} label="OT Échoués" value={statsCurrent.total.nok.toString()} color="text-red-500" iconBg="bg-red-100" evolution={evolution.nok} evolutionAbs={evolution.nokAbs} inverse />
          <EarningCard icon={Clock} label="OT Reportés" value={statsCurrent.total.report.toString()} color="text-yellow-600" iconBg="bg-yellow-100" />
          <EarningCard icon={Target} label="Taux réussite" value={`${statsCurrent.total.tauxReussite.toFixed(0)}%`} color="text-blue-500" iconBg="bg-blue-100" />
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
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-amber-500" /><span className={`text-xs font-medium ${t.textMuted}`}>Revenu ST Total</span></div><p className="text-2xl font-bold text-amber-500">{showAmounts ? `${statsCurrent.total.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className={`text-xs font-medium ${t.textMuted}`}>Marge GSET</span></div><p className={`text-2xl font-bold ${statsCurrent.total.marge >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{showAmounts ? `${statsCurrent.total.marge.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className={`text-xs font-medium ${t.textMuted}`}>ST Orange</span></div><p className="text-xl font-bold text-orange-500">{showAmounts ? `${statsCurrent.orange.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
            <div className={`${t.bgTertiary} rounded-xl p-4 border ${t.border}`}><div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className={`text-xs font-medium ${t.textMuted}`}>ST Canal+</span></div><p className="text-xl font-bold text-purple-500">{showAmounts ? `${statsCurrent.canal.stRevenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</p></div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div><div><h3 className={`font-semibold ${t.text}`}>{compareMode ? 'Comparaison journalière' : 'Évolution journalière'}</h3><p className={`text-sm ${t.textMuted}`}>{compareMode ? `${getPeriodLabel()} vs ${getPrevPeriodLabel()}` : 'OT réussis par jour'}</p></div></div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              {compareMode ? (
                <ComposedChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="label" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" name={MONTHS_FR[selectedMonth]} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="prev" name={MONTHS_FR[prevMonth.month]} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="diff" name="Différence" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              ) : (
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="label" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="orangeOK" name="Orange" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="canalOK" name="Canal+" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center"><PieChart className="w-5 h-5 text-white" /></div><div><h3 className={`font-semibold ${t.text}`}>Répartition</h3><p className={`text-sm ${t.textMuted}`}>OK / NOK / Reportés</p></div></div>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={[{ name: 'Réussis', value: statsCurrent.total.ok, fill: '#10b981' }, { name: 'Échoués', value: statsCurrent.total.nok, fill: '#ef4444' }, { name: 'Reportés', value: statsCurrent.total.report, fill: '#f59e0b' }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" /><Tooltip /></RePieChart></ResponsiveContainer></div>
          <div className="flex justify-center gap-4 mt-2"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className={`text-xs ${t.textSecondary}`}>OK ({statsCurrent.total.ok})</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className={`text-xs ${t.textSecondary}`}>NOK ({statsCurrent.total.nok})</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className={`text-xs ${t.textSecondary}`}>Report ({statsCurrent.total.report})</span></div></div>
        </div>
      </div>

      {/* Tech Performance Table */}
      {isDirection && techPerformance.length > 0 && (
        <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
          <div className={`p-4 border-b ${t.border}`}><h3 className={`font-semibold ${t.text}`}>Classement techniciens</h3><p className={`text-sm ${t.textMuted}`}>{getPeriodLabel()}</p></div>
          <div className="overflow-x-auto">
            <table className="w-full"><thead className={t.bgTertiary}><tr><th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>#</th><th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Orange</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Canal+</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Total</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>NOK</th><th className={`px-4 py-3 text-right text-xs font-semibold ${t.textSecondary} uppercase`}>Revenu</th></tr></thead>
              <tbody className={`divide-y ${t.border}`}>{techPerformance.slice(0, 15).map((tech, idx) => (<tr key={tech.tech} className={t.bgHover}><td className={`px-4 py-3 ${t.textMuted}`}>{idx === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <Award className="w-5 h-5 text-gray-400" /> : idx === 2 ? <Award className="w-5 h-5 text-amber-600" /> : idx + 1}</td><td className={`px-4 py-3 font-medium ${t.text}`}>{tech.tech}</td><td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 font-medium text-sm">{tech.orangeOK}</span></td><td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-600 font-medium text-sm">{tech.canalOK}</span></td><td className={`px-4 py-3 text-center font-bold ${t.text}`}>{tech.total}</td><td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-red-100 text-red-600 font-medium text-sm">{tech.nok}</span></td><td className="px-4 py-3 text-right font-bold text-emerald-500">{showAmounts ? `${tech.revenu.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€` : '••••€'}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
        <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
          <div><h3 className={`font-semibold ${t.text}`}>Détail journalier</h3><p className={`text-sm ${t.textMuted}`}>{filteredCurrentPeriod.orange.length + filteredCurrentPeriod.canal.length} entrées • {getPeriodLabel()}</p></div>
          {(filteredCurrentPeriod.orange.length + filteredCurrentPeriod.canal.length) > 20 && <button onClick={() => setShowAllDetails(!showAllDetails)} className={`px-4 py-2 rounded-lg text-sm font-medium ${showAllDetails ? 'bg-gray-200 text-gray-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>{showAllDetails ? 'Réduire' : `Afficher tout`}</button>}
        </div>
        <div className={`overflow-x-auto ${showAllDetails ? 'max-h-[600px]' : 'max-h-80'}`}>
          <table className="w-full"><thead className={`${t.bgTertiary} sticky top-0`}><tr><th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Date</th>{isDirection && <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th>}<th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Source</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Sem.</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>OK</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>NOK</th><th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Report</th></tr></thead>
            <tbody className={`divide-y ${t.border}`}>{[...filteredCurrentPeriod.orange.map(d => ({ ...d, source: 'Orange' })), ...filteredCurrentPeriod.canal.map(d => ({ ...d, source: 'Canal+' }))].sort((a, b) => b.date.localeCompare(a.date) || a.tech.localeCompare(b.tech)).slice(0, showAllDetails ? 500 : 20).map((d, idx) => (<tr key={`${d.source}-${d.tech}-${d.date}-${idx}`} className={t.bgHover}><td className={`px-4 py-2.5 text-sm ${t.text}`}>{formatDateDisplay(d.date)}</td>{isDirection && <td className={`px-4 py-2.5 text-sm font-medium ${t.text}`}>{d.tech}</td>}<td className="px-4 py-2.5"><span className={`px-2 py-1 rounded-full text-xs font-medium ${d.source === 'Orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{d.source}</span></td><td className="px-4 py-2.5 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>S{getWeekOfMonth(d.date)}</span></td><td className="px-4 py-2.5 text-center text-sm font-medium text-emerald-500">{d.otOK || 0}</td><td className="px-4 py-2.5 text-center text-sm font-medium text-red-500">{d.otNOK || 0}</td><td className="px-4 py-2.5 text-center text-sm font-medium text-yellow-500">{d.otReportes || 0}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DailyPage;
