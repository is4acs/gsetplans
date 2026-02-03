import { useState, useCallback, useMemo, memo } from 'react';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';
import { formatDate } from '../../utils/helpers';

const InterventionsTable = memo(function InterventionsTable({
  interventions,
  title,
  showTech = true,
  orangePrices,
  isDirection = true
}) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];
  const [showAll, setShowAll] = useState(false);
  const limit = 20;

  const displayed = useMemo(
    () => showAll ? interventions : interventions.slice(0, limit),
    [showAll, interventions]
  );

  const getTechPrice = useCallback((inter) => {
    if (inter.source === 'canal') return inter.montant_tech || 0;
    const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
    if (match && orangePrices) {
      const price = orangePrices.find(p => p.code === match[1].toUpperCase());
      if (price) return price.tech_price;
    }
    return inter.montant_st * 0.55;
  }, [orangePrices]);

  const formatAmount = (amount) => {
    if (!showAmounts) return '••••€';
    return `${amount?.toFixed(2) || 0}€`;
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
      <div className={`p-4 border-b ${t.border} flex justify-between items-center`}>
        <div>
          <h3 className={`font-semibold ${t.text}`}>{title}</h3>
          <p className={`text-sm ${t.textMuted}`}>{interventions.length} interventions</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={t.bgTertiary}>
            <tr>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Date</th>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Source</th>
              {showTech && (
                <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Technicien</th>
              )}
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Réf</th>
              <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Type</th>
              {isDirection && (
                <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>ST</th>
              )}
              <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>
                {isDirection ? 'Tech' : 'Prix'}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${t.borderLight}`}>
            {displayed.map((inter, i) => (
              <tr key={i} className={`${t.bgHover} transition-colors`}>
                <td className={`px-4 py-3 ${t.textSecondary} font-mono text-xs`}>
                  {formatDate(inter.intervention_date)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    inter.source === 'orange'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                  }`}>
                    {inter.source === 'orange' ? 'Orange' : 'Canal+'}
                  </span>
                </td>
                {showTech && (
                  <td className={`px-4 py-3 ${t.text}`}>
                    {inter.tech || inter.tech_name || '-'}
                  </td>
                )}
                <td className={`px-4 py-3 font-mono ${t.textSecondary}`}>
                  {inter.nd || inter.ref_pxo || '-'}
                </td>
                <td className={`px-4 py-3 ${t.text}`}>
                  {inter.articles || inter.facturation || '-'}
                </td>
                {isDirection && (
                  <td className={`px-4 py-3 text-right font-medium ${
                    inter.source === 'orange' ? 'text-orange-500' : 'text-purple-500'
                  }`}>
                    {formatAmount(inter.source === 'orange' ? inter.montant_st : inter.montant_gset)}
                  </td>
                )}
                <td className={`px-4 py-3 text-right font-medium ${
                  isDirection ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  {formatAmount(getTechPrice(inter))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {interventions.length > limit && (
        <div className={`p-3 border-t ${t.border} text-center`}>
          <button
            onClick={() => setShowAll(!showAll)}
            className={`text-sm ${t.textSecondary} hover:text-emerald-500`}
          >
            {showAll ? 'Voir moins' : `Voir les ${interventions.length - limit} autres`}
          </button>
        </div>
      )}
    </div>
  );
});

export default InterventionsTable;
