import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import {
  LayoutDashboard, Upload, Users, Settings, CalendarDays,
  Euro, TrendingUp, PieChart, User, BarChart3, AlertTriangle,
  XCircle, CheckCircle, Clock, FileWarning, Loader2, Trash2, X, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTheme, useAuth, useAmountVisibility } from '../contexts';
import { themes } from '../utils/theme';
import { MONTHS } from '../utils/constants';
import {
  getAllProfiles, getOrangePrices, getCanalPrices,
  getImports, getAvailablePeriods,
  getOrangeInterventions, getCanalInterventions,
  getRejets, insertRejets, getRejetsImports, createRejetsImport, deleteRejetsImport, updateRejetStatut
} from '../lib/supabase';
import { Sidebar, Header } from '../components/layout';
import { StatCard, PeriodSelector } from '../components/ui';
import {
  InterventionsTable, TechRankingChart, InterventionTypeChart,
  RevenueTrendChart, TechDashboardStats, FileImportSection, ImportHistorySection
} from '../components/features';
import UserManagementPage from './UserManagementPage';
import PriceGridPage from './PriceGridPage';
import DailyPage from './DailyPage';

function MainDashboard() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { showAmounts } = useAmountVisibility();
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

  // Rejets state
  const [rejets, setRejets] = useState([]);
  const [rejetsImports, setRejetsImports] = useState([]);
  const [importingRejets, setImportingRejets] = useState(false);
  const [showRejetsModal, setShowRejetsModal] = useState(false);
  const [rejetsWeekFilter, setRejetsWeekFilter] = useState('all');
  const [rejetsAliases, setRejetsAliases] = useState(() => {
    const saved = localStorage.getItem('gset_rejets_aliases');
    return saved ? JSON.parse(saved) : {};
  });

  const isDirection = profile?.role === 'dir' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';
  const initialLoadDone = useRef(false);
  const periodInitialized = useRef(false);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'daily', label: 'Suivi Journalier', icon: CalendarDays },
    ...(isDirection ? [
      { id: 'import', label: 'Import RCC', icon: Upload },
      { id: 'rejets', label: 'Rejets', icon: AlertTriangle },
      { id: 'users', label: 'Équipe', icon: Users },
      { id: 'prices', label: 'Grilles Prix', icon: Settings },
    ] : [])
  ];

  const loadInterventions = useCallback(async (year, month, week, mode) => {
    const [oInter, cInter] = await Promise.all([
      getOrangeInterventions({ year, month, week: mode === 'hebdo' ? week : null }),
      getCanalInterventions({ year, month, week: mode === 'hebdo' ? week : null }),
    ]);
    setOrangeInterventions(oInter);
    setCanalInterventions(cInter);
  }, []);

  const loadRejetsData = useCallback(async () => {
    try {
      const [rejetsData, rejetsImportsData] = await Promise.all([getRejets(), getRejetsImports()]);
      setRejets(rejetsData);
      setRejetsImports(rejetsImportsData);
    } catch (err) {
      console.error('Error loading rejets:', err);
    }
  }, []);

  const loadData = useCallback(async (fullRefresh = false) => {
    if (!fullRefresh) setLoading(true);
    try {
      const [profs, oPrices, cPrices, imps, pers] = await Promise.all([
        getAllProfiles(), getOrangePrices(), getCanalPrices(),
        getImports(), getAvailablePeriods(),
      ]);

      startTransition(() => {
        setProfiles(profs);
        setOrangePrices(oPrices);
        setCanalPrices(cPrices);
        setImportsData(imps);
        setPeriods(pers);
      });

      if (!periodInitialized.current && pers.years?.length > 0) {
        periodInitialized.current = true;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const yearToSelect = pers.years.includes(currentYear) ? currentYear : pers.years[0];
        const availableMonths = pers.monthsByYear?.[yearToSelect] || [];
        const monthToSelect = availableMonths.includes(currentMonth) ? currentMonth : availableMonths[availableMonths.length - 1];

        if (yearToSelect && monthToSelect) {
          setSelectedYear(yearToSelect);
          setSelectedMonth(monthToSelect);
          await loadInterventions(yearToSelect, monthToSelect, null, viewMode);
        } else {
          await loadInterventions(null, null, null, viewMode);
        }
      } else {
        await loadInterventions(selectedYear, selectedMonth, selectedWeek, viewMode);
      }

      await loadRejetsData();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions, loadRejetsData]);

  const refreshAfterImport = useCallback(async () => {
    try {
      const [imps, pers] = await Promise.all([getImports(), getAvailablePeriods()]);
      startTransition(() => {
        setImportsData(imps);
        setPeriods(pers);
      });
      await loadInterventions(selectedYear, selectedMonth, selectedWeek, viewMode);
    } catch (err) {
      console.error('Error refreshing:', err);
    }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions]);

  useEffect(() => {
    loadData();
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    if (initialLoadDone.current && periodInitialized.current) {
      setLoading(true);
      loadInterventions(selectedYear, selectedMonth, selectedWeek, viewMode)
        .finally(() => setLoading(false));
    }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions]);

  // Sauvegarder les aliases
  useEffect(() => {
    localStorage.setItem('gset_rejets_aliases', JSON.stringify(rejetsAliases));
  }, [rejetsAliases]);

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

  // Filtrer les rejets pour les techniciens
  const filteredRejets = (isDirection ? rejets : rejets.filter(r => {
    const aliases = profile?.aliases || [];
    const profileName = profile?.name?.toLowerCase() || '';
    const rejetTech = r.prenom_technicien?.toLowerCase() || '';
    
    // Matcher par aliases
    const matchByAlias = aliases.some(a => {
      const aliasLower = a.toLowerCase();
      return rejetTech.includes(aliasLower) || aliasLower.includes(rejetTech);
    });
    
    // Matcher par nom du profil (prénom ou nom complet)
    const matchByName = profileName && (
      rejetTech.includes(profileName) || 
      profileName.includes(rejetTech) ||
      profileName.split(' ').some(part => part.length > 2 && rejetTech.includes(part.toLowerCase())) ||
      rejetTech.split(' ').some(part => part.length > 2 && profileName.includes(part.toLowerCase()))
    );
    
    return matchByAlias || matchByName;
  })).filter(r => rejetsWeekFilter === 'all' || r.semaine === rejetsWeekFilter);

  // Debug: afficher les infos de filtrage dans la console (pour les techniciens)
  if (!isDirection && rejets.length > 0) {
    console.log('Debug Rejets - Profile:', profile?.name, 'Aliases:', profile?.aliases);
    console.log('Debug Rejets - Total rejets:', rejets.length, 'Filtrés:', filteredRejets.length);
    console.log('Debug Rejets - Techniciens dans rejets:', [...new Set(rejets.map(r => r.prenom_technicien))]);
  }

  // Semaines disponibles dans les rejets
  const availableWeeks = [...new Set(rejets.map(r => r.semaine).filter(Boolean))].sort();

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

  const allInterventions = [
    ...filteredOrange.map(i => ({ ...i, source: 'orange' })),
    ...filteredCanal.map(i => ({ ...i, source: 'canal' }))
  ].sort((a, b) => new Date(b.intervention_date) - new Date(a.intervention_date));

  const getPeriodLabel = () => {
    if (!selectedYear && !selectedMonth) return 'Toutes périodes';
    const monthLabel = selectedMonth ? MONTHS.find(m => m.value === selectedMonth)?.label : '';
    const weekLabel = viewMode === 'hebdo' && selectedWeek ? ` - S${selectedWeek}` : '';
    return `${monthLabel} ${selectedYear || ''}${weekLabel}`.trim();
  };

  // Import des rejets - Toutes les feuilles (semaines)
  const handleRejetsImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingRejets(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      console.log('Feuilles trouvées:', workbook.SheetNames);
      
      const allRecords = [];
      const periode = `Rejets ${new Date().toLocaleDateString('fr-FR')} - ${file.name}`;
      const today = new Date();

      // Parser toutes les feuilles
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        
        // Essayer différentes méthodes de parsing
        let rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        
        // Si pas de lignes, essayer avec header: 1 puis reconstruire
        if (rows.length === 0) {
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (rawRows.length > 1) {
            const headers = rawRows[0].map(h => String(h || '').trim());
            rows = rawRows.slice(1).map(row => {
              const obj = {};
              headers.forEach((h, i) => { obj[h] = row[i] || ''; });
              return obj;
            });
          }
        }
        
        if (rows.length === 0) {
          console.log(`Feuille ${sheetName} vide, ignorée`);
          continue;
        }

        console.log(`Feuille ${sheetName}: ${rows.length} lignes`);
        console.log('Colonnes:', Object.keys(rows[0]));

        // Détecter le numéro de semaine depuis le nom de la feuille (S1, S2, S3, S4 ou Semaine 1, etc.)
        let semaine;
        const weekMatch = sheetName.match(/S\s*(\d+)|[Ss]emaine\s*(\d+)|^(\d+)$/i);
        if (weekMatch) {
          const weekNum = weekMatch[1] || weekMatch[2] || weekMatch[3];
          semaine = `S${Math.min(parseInt(weekNum), 4)}`; // Limiter à S4
        } else {
          // Si le nom ne contient pas de numéro, utiliser le nom tel quel ou tenter de déduire
          semaine = sheetName.trim() || 'S1';
        }

        // Détecter les colonnes de manière plus flexible
        const cols = Object.keys(rows[0]);
        
        // Fonction pour trouver une colonne avec plusieurs variantes
        const findCol = (...patterns) => {
          for (const pattern of patterns) {
            const found = cols.find(c => {
              const lower = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return lower.includes(pattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
            });
            if (found) return found;
          }
          return null;
        };

        const prenomCol = findCol('prenom', 'prénom', 'technicien', 'tech');
        const nomCol = cols.find(c => {
          const lower = c.toLowerCase();
          return (lower.includes('nom') && !lower.includes('prénom') && !lower.includes('prenom'));
        });
        const typeCol = findCol('type');
        const motifCol = findCol('motif', 'raison', 'cause');
        const dateRejetCol = findCol('date rejet', 'date_rejet', 'daterejet') || findCol('date');
        const dateInterCol = findCol('date interv', 'date_interv', 'intervention');
        const ndCol = findCol('nd', 'référence', 'reference', 'numéro');
        const commentCol = findCol('comment', 'remarque', 'observation');
        const traitementCol = findCol('traitement', 'statut', 'status');

        console.log('Colonnes détectées:', { prenomCol, nomCol, typeCol, motifCol, dateRejetCol, ndCol, traitementCol });

        // Fonction pour normaliser le statut depuis la colonne Traitement
        const normalizeStatut = (val) => {
          if (!val) return 'en_attente';
          const lower = String(val).toLowerCase().trim();
          
          if (lower.includes('traitement ok') || lower === 'ok' || lower === 'traité') {
            return 'traitement_ok';
          }
          if (lower.includes('planifi') || lower.includes('planifié')) {
            return 'planifie';
          }
          if (lower.includes('nok') || lower.includes('non ok') || lower.includes('clôtur') || lower.includes('clotur')) {
            return 'nok';
          }
          // Retourner la valeur brute si non reconnue
          return val.trim();
        };

        const parseDate = (val) => {
          if (!val) return null;
          if (val instanceof Date) return val.toISOString().split('T')[0];
          if (typeof val === 'number') {
            // Date Excel (jours depuis 1900-01-01)
            const d = new Date((val - 25569) * 86400 * 1000);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          }
          if (typeof val === 'string') {
            // Essayer différents formats
            const cleanVal = val.trim();
            // Format DD/MM/YYYY ou DD-MM-YYYY
            const dmyMatch = cleanVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
            if (dmyMatch) {
              const [, day, month, year] = dmyMatch;
              const fullYear = year.length === 2 ? `20${year}` : year;
              const d = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            }
            // Format ISO ou autre
            try {
              const d = new Date(cleanVal);
              if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            } catch {}
          }
          return null;
        };

        const sheetRecords = rows
          .filter(row => {
            // Filtrer les lignes qui ont au moins un prénom/technicien
            const prenom = String(row[prenomCol] || row['Prénom technicien'] || row['PRENOM'] || row['Prenom'] || row['Technicien'] || '').trim();
            return prenom && prenom.length > 0 && prenom.toLowerCase() !== 'prénom' && prenom.toLowerCase() !== 'technicien';
          })
          .map(row => {
            const prenom = String(row[prenomCol] || row['Prénom technicien'] || row['PRENOM'] || row['Prenom'] || row['Technicien'] || '').trim();
            const dateRejet = parseDate(row[dateRejetCol] || row['Date rejet'] || row['DATE']);
            const dateInter = parseDate(row[dateInterCol] || row['Date intervention']);
            const month = dateRejet ? new Date(dateRejet).getMonth() + 1 : today.getMonth() + 1;
            const year = dateRejet ? new Date(dateRejet).getFullYear() : today.getFullYear();
            
            // Récupérer le traitement depuis la colonne
            const traitementRaw = String(row[traitementCol] || row['Traitement'] || row['TRAITEMENT'] || row['Statut'] || '').trim();
            const statut = normalizeStatut(traitementRaw);

            return {
              periode,
              semaine,
              nd: String(row[ndCol] || row['ND'] || row['Référence'] || row['REF'] || '').trim(),
              prenom_technicien: prenom,
              nom_technicien: String(row[nomCol] || row['NOM'] || '').trim(),
              type_rejet: String(row[typeCol] || row['Type'] || row['TYPE'] || '').trim(),
              motif: String(row[motifCol] || row['Motif'] || row['MOTIF'] || row['Raison'] || '').trim(),
              date_rejet: dateRejet,
              date_intervention: dateInter,
              commentaire: String(row[commentCol] || row['Commentaire'] || row['COMMENTAIRE'] || '').trim(),
              statut: statut,
              month,
              year
            };
          });

        console.log(`Feuille ${sheetName} (${semaine}): ${sheetRecords.length} rejets valides`);
        allRecords.push(...sheetRecords);
      }

      if (allRecords.length === 0) {
        alert('Aucun rejet valide trouvé.\n\nVérifiez que le fichier contient des colonnes comme "Prénom technicien" ou "Technicien" et des données valides.');
        return;
      }

      // Compter les semaines
      const weekCounts = {};
      allRecords.forEach(r => {
        weekCounts[r.semaine] = (weekCounts[r.semaine] || 0) + 1;
      });
      const weekSummary = Object.entries(weekCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([w, c]) => `${w}: ${c}`)
        .join(', ');

      await insertRejets(allRecords);
      await createRejetsImport({ filename: file.name, periode, total_records: allRecords.length });
      await loadRejetsData();
      alert(`Import réussi: ${allRecords.length} rejets importés\n\nPar semaine:\n${weekSummary}`);
    } catch (err) {
      console.error('Rejets import error:', err);
      alert('Erreur lors de l\'import: ' + err.message);
    } finally {
      setImportingRejets(false);
      e.target.value = '';
    }
  };

  const handleDeleteRejetsImport = async (imp) => {
    if (!confirm(`Supprimer l'import "${imp.filename}" et ses ${imp.total_records} rejets ?`)) return;
    try {
      await deleteRejetsImport(imp.id, imp.periode);
      await loadRejetsData();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleRejetStatutChange = async (id, newStatut) => {
    try {
      await updateRejetStatut(id, newStatut);
      setRejets(prev => prev.map(r => r.id === id ? { ...r, statut: newStatut } : r));
    } catch (err) {
      console.error('Error updating rejet:', err);
    }
  };

  // Rejets stats - basés sur la colonne Traitement
  const rejetsStats = {
    total: filteredRejets.length,
    traitementOk: filteredRejets.filter(r => r.statut === 'traitement_ok').length,
    planifie: filteredRejets.filter(r => r.statut === 'planifie').length,
    nok: filteredRejets.filter(r => r.statut === 'nok').length,
    autre: filteredRejets.filter(r => !['traitement_ok', 'planifie', 'nok'].includes(r.statut)).length,
  };

  // Rejets par technicien
  const rejetsByTech = {};
  filteredRejets.forEach(r => {
    const tech = r.prenom_technicien || 'Inconnu';
    if (!rejetsByTech[tech]) rejetsByTech[tech] = { total: 0, traitement_ok: 0, planifie: 0, nok: 0, autre: 0 };
    rejetsByTech[tech].total++;
    if (r.statut === 'traitement_ok') rejetsByTech[tech].traitement_ok++;
    else if (r.statut === 'planifie') rejetsByTech[tech].planifie++;
    else if (r.statut === 'nok') rejetsByTech[tech].nok++;
    else rejetsByTech[tech].autre++;
  });

  // Rejets par semaine - trier par S1, S2, S3, S4
  const rejetsByWeek = {};
  rejets.forEach(r => {
    let week = r.semaine || 'Non défini';
    // Normaliser le format de semaine
    if (week && /^S?\d+$/i.test(week)) {
      const num = parseInt(week.replace(/\D/g, ''));
      week = `S${Math.min(num, 4)}`; // Limiter à S4
    }
    if (!rejetsByWeek[week]) rejetsByWeek[week] = { total: 0, traitement_ok: 0, planifie: 0, nok: 0, autre: 0 };
    rejetsByWeek[week].total++;
    if (r.statut === 'traitement_ok') rejetsByWeek[week].traitement_ok++;
    else if (r.statut === 'planifie') rejetsByWeek[week].planifie++;
    else if (r.statut === 'nok') rejetsByWeek[week].nok++;
    else rejetsByWeek[week].autre++;
  });

  // Fonction pour afficher le statut avec couleur
  const getStatutDisplay = (statut) => {
    switch (statut) {
      case 'traitement_ok':
        return { label: 'Traitement OK', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' };
      case 'planifie':
        return { label: 'Planifié', bgClass: 'bg-blue-100', textClass: 'text-blue-700' };
      case 'nok':
        return { label: 'Clôturé NOK', bgClass: 'bg-red-100', textClass: 'text-red-700' };
      default:
        return { label: statut || '-', bgClass: 'bg-gray-100', textClass: 'text-gray-700' };
    }
  };

  // Trier les semaines : S1, S2, S3, S4, puis le reste
  const sortedWeeks = Object.keys(rejetsByWeek).sort((a, b) => {
    const aMatch = a.match(/^S(\d+)$/i);
    const bMatch = b.match(/^S(\d+)$/i);
    if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
    if (aMatch) return -1;
    if (bMatch) return 1;
    return a.localeCompare(b);
  });

  // Alias modal component
  const AliasModal = () => {
    const [selectedRejetTech, setSelectedRejetTech] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState('');

    const uniqueRejetTechs = [...new Set(rejets.map(r => r.prenom_technicien))].filter(Boolean).sort();

    const handleAddAlias = () => {
      if (!selectedRejetTech || !selectedProfileId) return;
      setRejetsAliases(prev => ({
        ...prev,
        [selectedRejetTech]: selectedProfileId
      }));
      setSelectedRejetTech('');
      setSelectedProfileId('');
    };

    const handleRemoveAlias = (rejetTech) => {
      setRejetsAliases(prev => {
        const copy = { ...prev };
        delete copy[rejetTech];
        return copy;
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`${t.card} rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden`}>
          <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
            <h3 className={`font-semibold ${t.text}`}>Gestion des alias Rejets</h3>
            <button onClick={() => setShowRejetsModal(false)} className={`p-2 rounded-lg hover:${t.bgTertiary}`}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            <p className={`text-sm ${t.textMuted}`}>Associer les noms des rejets aux techniciens de l'équipe</p>
            
            <div className="flex gap-2">
              <select value={selectedRejetTech} onChange={e => setSelectedRejetTech(e.target.value)} className={`flex-1 px-3 py-2 rounded-lg border ${t.input} ${t.text}`}>
                <option value="">Nom dans fichier rejet...</option>
                {uniqueRejetTechs.filter(t => !rejetsAliases[t]).map(tech => <option key={tech} value={tech}>{tech}</option>)}
              </select>
              <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)} className={`flex-1 px-3 py-2 rounded-lg border ${t.input} ${t.text}`}>
                <option value="">Technicien...</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleAddAlias} disabled={!selectedRejetTech || !selectedProfileId} className="px-4 py-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50">+</button>
            </div>

            {Object.keys(rejetsAliases).length > 0 && (
              <div className={`rounded-lg border ${t.border} divide-y ${t.border}`}>
                {Object.entries(rejetsAliases).map(([rejetTech, profileId]) => {
                  const prof = profiles.find(p => p.id === profileId);
                  return (
                    <div key={rejetTech} className={`p-3 flex items-center justify-between ${t.bgSecondary}`}>
                      <div>
                        <span className={`text-sm ${t.textMuted}`}>{rejetTech}</span>
                        <span className={`mx-2 ${t.textMuted}`}>→</span>
                        <span className={`font-medium ${t.text}`}>{prof?.name || 'Inconnu'}</span>
                      </div>
                      <button onClick={() => handleRemoveAlias(rejetTech)} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${t.bg} flex`}>
      <Sidebar
        navItems={navItems}
        currentView={view}
        onViewChange={setView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 overflow-auto">
        <Header
          title={navItems.find(n => n.id === view)?.label}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          loading={loading}
          isPending={isPending}
          onRefresh={loadData}
        />

        <div className="p-4 sm:p-6 space-y-6">
          {view === 'dashboard' && (
            <>
              <PeriodSelector
                periods={periods}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                viewMode={viewMode}
                onChange={({ year, month, week, viewMode: vm }) => {
                  if (year !== undefined) setSelectedYear(year);
                  if (month !== undefined) setSelectedMonth(month);
                  if (week !== undefined) setSelectedWeek(week);
                  if (vm !== undefined) setViewMode(vm);
                }}
              />

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
                  
                  {/* Section Mes Rejets pour les techniciens */}
                  <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
                    <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${t.text}`}>Mes Rejets</h3>
                          <p className={`text-sm ${t.textMuted}`}>{filteredRejets.length} rejet{filteredRejets.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {filteredRejets.length > 0 && (
                        <div className="flex gap-2">
                          <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                            {filteredRejets.filter(r => r.statut === 'traitement_ok').length} OK
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
                            {filteredRejets.filter(r => r.statut === 'planifie').length} Planifiés
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-medium">
                            {filteredRejets.filter(r => r.statut === 'nok').length} NOK
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {filteredRejets.length === 0 ? (
                      <div className="p-8 text-center">
                        <CheckCircle className={`w-12 h-12 mx-auto mb-3 text-emerald-500`} />
                        <p className={`font-medium ${t.text}`}>Aucun rejet</p>
                        <p className={`text-sm ${t.textMuted} mt-1`}>Vous n'avez pas de rejets enregistrés</p>
                      </div>
                    ) : (
                      <>
                        {/* Stats par semaine */}
                        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b ${t.border}`}>
                          {['S1', 'S2', 'S3', 'S4'].map(sem => {
                            const semRejets = filteredRejets.filter(r => r.semaine === sem);
                            return (
                              <div key={sem} className={`${t.bgTertiary} rounded-xl p-3 border ${t.border}`}>
                                <p className={`font-bold ${t.text}`}>{sem}</p>
                                <p className="text-xl font-bold text-red-500">{semRejets.length}</p>
                                <div className="flex gap-1 mt-1 text-xs">
                                  <span className="text-emerald-600">{semRejets.filter(r => r.statut === 'traitement_ok').length} OK</span>
                                  <span className="text-orange-600">{semRejets.filter(r => r.statut === 'nok').length} NOK</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Liste des rejets */}
                        <div className="overflow-x-auto max-h-[400px]">
                          <table className="w-full">
                            <thead className={`${t.bgTertiary} sticky top-0`}>
                              <tr>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Sem.</th>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Date</th>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>ND</th>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Type</th>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Motif</th>
                                <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Traitement</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${t.border}`}>
                              {filteredRejets.slice(0, 50).map(rejet => {
                                const statutDisplay = getStatutDisplay(rejet.statut);
                                return (
                                  <tr key={rejet.id} className={t.bgHover}>
                                    <td className="px-4 py-2.5">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{rejet.semaine || '-'}</span>
                                    </td>
                                    <td className={`px-4 py-2.5 text-sm ${t.text}`}>
                                      {rejet.date_rejet ? new Date(rejet.date_rejet).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className={`px-4 py-2.5 text-sm ${t.textMuted}`}>{rejet.nd || '-'}</td>
                                    <td className={`px-4 py-2.5 text-sm ${t.textMuted}`}>{rejet.type_rejet || '-'}</td>
                                    <td className={`px-4 py-2.5 text-sm ${t.textMuted} max-w-xs truncate`}>{rejet.motif || '-'}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statutDisplay.bgClass} ${statutDisplay.textClass}`}>
                                        {statutDisplay.label}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              <InterventionsTable interventions={allInterventions} title="Détail des interventions" showTech={isDirection} orangePrices={orangePrices} isDirection={isDirection} />
            </>
          )}

          {isDirection && view === 'import' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${t.card}`}>
                <h3 className={`font-semibold ${t.text} mb-4`}>Importer des données</h3>
                <FileImportSection orangePrices={orangePrices} canalPrices={canalPrices} onImportComplete={refreshAfterImport} />
              </div>
              <div className={`rounded-2xl p-6 border ${t.card}`}>
                <h3 className={`font-semibold ${t.text} mb-4`}>Historique des imports</h3>
                <ImportHistorySection imports={imports} onRefresh={refreshAfterImport} />
              </div>
            </div>
          )}

          {isDirection && view === 'rejets' && (
            <div className="space-y-6">
              {/* Header */}
              <div className={`rounded-2xl border ${t.card} p-6`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                      <FileWarning className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${t.text}`}>Gestion des Rejets</h2>
                      <p className={`text-sm ${t.textMuted}`}>{rejetsStats.total} rejets • {rejetsStats.traitementOk} OK • {rejetsStats.planifie} planifiés • {rejetsStats.nok} NOK</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setShowRejetsModal(true)} className={`px-4 py-2.5 rounded-xl font-medium ${t.bgTertiary} ${t.text} hover:${t.bgSecondary} transition-colors`}>
                      ⚙️ Alias
                    </button>
                    <label className={`px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-all ${importingRejets ? 'bg-gray-400' : 'bg-emerald-500 hover:bg-emerald-600'} text-white flex items-center gap-2`}>
                      {importingRejets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {importingRejets ? 'Import...' : 'Importer Rejets'}
                      <input type="file" accept=".xlsx,.xls" onChange={handleRejetsImport} className="hidden" disabled={importingRejets} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${t.bgSecondary} rounded-2xl p-5 border ${t.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-red-500">{rejetsStats.total}</p>
                      <p className={`text-sm ${t.textMuted} mt-1`}>Total rejets</p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </div>
                <div className={`${t.bgSecondary} rounded-2xl p-5 border ${t.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-emerald-500">{rejetsStats.traitementOk}</p>
                      <p className={`text-sm ${t.textMuted} mt-1`}>Traitement OK</p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                </div>
                <div className={`${t.bgSecondary} rounded-2xl p-5 border ${t.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-blue-500">{rejetsStats.planifie}</p>
                      <p className={`text-sm ${t.textMuted} mt-1`}>Planifié</p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className={`${t.bgSecondary} rounded-2xl p-5 border ${t.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-orange-500">{rejetsStats.nok}</p>
                      <p className={`text-sm ${t.textMuted} mt-1`}>Clôturé NOK</p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100">
                      <XCircle className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejets par semaine */}
              {Object.keys(rejetsByWeek).length > 0 && (
                <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
                  <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
                    <h3 className={`font-semibold ${t.text}`}>Rejets par semaine</h3>
                    <div className={`flex gap-1 p-1 rounded-xl ${t.bgTertiary}`}>
                      <button onClick={() => setRejetsWeekFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${rejetsWeekFilter === 'all' ? 'bg-blue-500 text-white' : `${t.textSecondary}`}`}>Toutes</button>
                      {sortedWeeks.filter(w => ['S1', 'S2', 'S3', 'S4'].includes(w)).map(w => (
                        <button key={w} onClick={() => setRejetsWeekFilter(w)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${rejetsWeekFilter === w ? 'bg-blue-500 text-white' : `${t.textSecondary}`}`}>{w}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    {sortedWeeks.map(week => (
                      <div key={week} className={`${t.bgTertiary} rounded-xl p-4 border ${t.border} cursor-pointer hover:border-blue-500 transition-colors ${rejetsWeekFilter === week ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`} onClick={() => setRejetsWeekFilter(rejetsWeekFilter === week ? 'all' : week)}>
                        <p className={`font-bold text-lg ${t.text}`}>{week}</p>
                        <p className={`text-2xl font-bold text-red-500`}>{rejetsByWeek[week].total}</p>
                        <div className="flex gap-2 mt-2 text-xs flex-wrap">
                          <span className="text-emerald-600">{rejetsByWeek[week].traitement_ok} OK</span>
                          <span className="text-blue-600">{rejetsByWeek[week].planifie} Plan.</span>
                          <span className="text-orange-600">{rejetsByWeek[week].nok} NOK</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejets par technicien */}
              {Object.keys(rejetsByTech).length > 0 && (
                <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
                  <div className={`p-4 border-b ${t.border}`}>
                    <h3 className={`font-semibold ${t.text}`}>Rejets par technicien {rejetsWeekFilter !== 'all' && `(${rejetsWeekFilter})`}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={t.bgTertiary}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th>
                          <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Total</th>
                          <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Traitement OK</th>
                          <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Planifié</th>
                          <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Clôturé NOK</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${t.border}`}>
                        {Object.entries(rejetsByTech).sort((a, b) => b[1].total - a[1].total).map(([tech, stats]) => (
                          <tr key={tech} className={t.bgHover}>
                            <td className={`px-4 py-3 font-medium ${t.text}`}>{tech}</td>
                            <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-red-100 text-red-600 font-medium text-sm">{stats.total}</span></td>
                            <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-600 font-medium text-sm">{stats.traitement_ok}</span></td>
                            <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-600 font-medium text-sm">{stats.planifie}</span></td>
                            <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 font-medium text-sm">{stats.nok}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Liste des rejets */}
              <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
                <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
                  <div>
                    <h3 className={`font-semibold ${t.text}`}>Détail des rejets</h3>
                    <p className={`text-sm ${t.textMuted}`}>{filteredRejets.length} rejets {rejetsWeekFilter !== 'all' && `(${rejetsWeekFilter})`}</p>
                  </div>
                  {rejetsWeekFilter !== 'all' && (
                    <button onClick={() => setRejetsWeekFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${t.bgTertiary} ${t.text}`}>
                      <X className="w-4 h-4 inline mr-1" />Réinitialiser filtre
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className={`${t.bgTertiary} sticky top-0`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Sem.</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Date</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Technicien</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>ND</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Type</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Motif</th>
                        <th className={`px-4 py-3 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Traitement</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${t.border}`}>
                      {filteredRejets.slice(0, 100).map(rejet => {
                        const statutDisplay = getStatutDisplay(rejet.statut);
                        return (
                          <tr key={rejet.id} className={t.bgHover}>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>{rejet.semaine || '-'}</span>
                            </td>
                            <td className={`px-4 py-2.5 text-sm ${t.text}`}>
                              {rejet.date_rejet ? new Date(rejet.date_rejet).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td className={`px-4 py-2.5 text-sm font-medium ${t.text}`}>{rejet.prenom_technicien}</td>
                            <td className={`px-4 py-2.5 text-sm ${t.textMuted}`}>{rejet.nd || '-'}</td>
                            <td className={`px-4 py-2.5 text-sm ${t.textMuted}`}>{rejet.type_rejet || '-'}</td>
                            <td className={`px-4 py-2.5 text-sm ${t.textMuted} max-w-xs truncate`}>{rejet.motif || '-'}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statutDisplay.bgClass} ${statutDisplay.textClass}`}>
                                {statutDisplay.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historique imports */}
              {rejetsImports.length > 0 && (
                <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
                  <div className={`p-4 border-b ${t.border}`}>
                    <h3 className={`font-semibold ${t.text}`}>Historique des imports</h3>
                  </div>
                  <div className={`divide-y ${t.border}`}>
                    {rejetsImports.map(imp => (
                      <div key={imp.id} className={`p-4 flex items-center justify-between ${t.bgHover}`}>
                        <div>
                          <p className={`font-medium ${t.text}`}>{imp.filename}</p>
                          <p className={`text-sm ${t.textMuted}`}>{imp.total_records} rejets • {new Date(imp.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <button onClick={() => handleDeleteRejetsImport(imp)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isDirection && view === 'users' && (
            <UserManagementPage profiles={profiles} onRefresh={loadData} currentUserProfile={profile} />
          )}

          {isDirection && view === 'prices' && (
            <PriceGridPage orangePrices={orangePrices} canalPrices={canalPrices} onRefresh={loadData} />
          )}

          {view === 'daily' && (
            <DailyPage orangePrices={orangePrices} canalPrices={canalPrices} profile={profile} />
          )}
        </div>
      </main>

      {showRejetsModal && <AliasModal />}
    </div>
  );
}

export default MainDashboard;
