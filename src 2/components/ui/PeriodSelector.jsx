import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useTheme } from '../../contexts';
import { themes } from '../../utils/theme';
import { MONTHS } from '../../utils/constants';

function PeriodSelector({
  periods,
  selectedYear,
  selectedMonth,
  selectedWeek,
  viewMode,
  onChange
}) {
  const { theme } = useTheme();
  const t = themes[theme];

  const availableMonths = useMemo(() => {
    return selectedYear ? (periods.monthsByYear?.[selectedYear] || []) : [];
  }, [periods, selectedYear]);

  const availableWeeks = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    return periods.weeksByYearMonth?.[`${selectedYear}_${selectedMonth}`] || [];
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

      <select
        value={selectedYear || ''}
        onChange={(e) => onChange({
          year: e.target.value ? parseInt(e.target.value) : null,
          month: null,
          week: null
        })}
        className={selectClass}
      >
        <option value="">Toutes années</option>
        {(periods.years || []).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        value={selectedMonth || ''}
        onChange={(e) => onChange({
          year: selectedYear,
          month: e.target.value ? parseInt(e.target.value) : null,
          week: null
        })}
        disabled={!selectedYear}
        className={`${selectClass} disabled:opacity-50`}
      >
        <option value="">Tous mois</option>
        {MONTHS.filter(m => availableMonths.includes(m.value)).map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {viewMode === 'hebdo' && (
        <select
          value={selectedWeek || ''}
          onChange={(e) => onChange({
            year: selectedYear,
            month: selectedMonth,
            week: e.target.value ? parseInt(e.target.value) : null
          })}
          disabled={!selectedMonth}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">Toutes semaines</option>
          {availableWeeks.map(w => (
            <option key={w} value={w}>S{w}</option>
          ))}
        </select>
      )}

      <div className={`flex items-center gap-1 p-1 rounded-lg ${t.bgTertiary}`}>
        <button
          onClick={() => onChange({
            year: selectedYear,
            month: selectedMonth,
            week: null,
            viewMode: 'mensuel'
          })}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            viewMode === 'mensuel'
              ? `${t.bgSecondary} shadow-sm ${t.text} font-medium`
              : t.textSecondary
          }`}
        >
          Mois
        </button>
        <button
          onClick={() => onChange({
            year: selectedYear,
            month: selectedMonth,
            week: selectedWeek,
            viewMode: 'hebdo'
          })}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            viewMode === 'hebdo'
              ? `${t.bgSecondary} shadow-sm ${t.text} font-medium`
              : t.textSecondary
          }`}
        >
          Semaine
        </button>
      </div>

      {(selectedYear || selectedMonth) && (
        <button
          onClick={() => onChange({ year: null, month: null, week: null })}
          className={`px-3 py-1.5 text-sm ${t.textMuted}`}
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}

export default PeriodSelector;
