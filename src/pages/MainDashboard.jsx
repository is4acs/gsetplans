import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import {
  LayoutDashboard, Upload, Users, Settings, CalendarDays,
  Euro, TrendingUp, PieChart, User, BarChart3
} from 'lucide-react';
import { useTheme, useAuth } from '../contexts';
import { themes } from '../utils/theme';
import { MONTHS } from '../utils/constants';
import {
  getAllProfiles, getOrangePrices, getCanalPrices,
  getImports, getAvailablePeriods,
  getOrangeInterventions, getCanalInterventions
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

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'daily', label: 'Suivi Journalier', icon: CalendarDays },
    ...(isDirection ? [
      { id: 'import', label: 'Import RCC', icon: Upload },
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
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedWeek, viewMode, loadInterventions]);

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
    </div>
  );
}

export default MainDashboard;
