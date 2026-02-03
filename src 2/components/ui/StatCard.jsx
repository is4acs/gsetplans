import { memo } from 'react';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';

const StatCard = memo(function StatCard({ icon: Icon, label, value, sub, color, hideable = true }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];

  const colors = {
    emerald: { bg: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50', text: 'text-emerald-500' },
    orange: { bg: theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50', text: 'text-orange-500' },
    purple: { bg: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50', text: 'text-purple-500' },
    blue: { bg: theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50', text: 'text-blue-500' },
    teal: { bg: theme === 'dark' ? 'bg-teal-500/10' : 'bg-teal-50', text: 'text-teal-500' },
  };

  const c = colors[color] || colors.emerald;
  const displayValue = hideable && !showAmounts && typeof value === 'string' && value.includes('€')
    ? '••••••€'
    : value;

  return (
    <div className={`rounded-2xl p-5 border ${t.card}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <p className={`text-sm ${t.textSecondary} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${t.text}`}>{displayValue}</p>
      {sub && <p className={`text-xs ${t.textMuted} mt-1`}>{sub}</p>}
    </div>
  );
});

export default StatCard;
