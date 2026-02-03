import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';
import { CHART_COLORS } from '../../utils/constants';

function InterventionTypeChart({
  orangeInterventions,
  canalInterventions,
  orangePrices,
  isDirection
}) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];

  const typeData = useMemo(() => {
    const types = {};

    orangeInterventions.forEach(inter => {
      const match = String(inter.articles || '').match(/([A-Z]+)/i);
      const code = match ? match[1].toUpperCase() : 'AUTRE';
      if (!types[code]) types[code] = { name: code, count: 0, totalGset: 0 };
      types[code].count++;
      const price = orangePrices.find(p => p.code.startsWith(code));
      types[code].totalGset += price?.gset_price || inter.montant_st || 0;
    });

    canalInterventions.forEach(inter => {
      const code = inter.facturation || 'AUTRE';
      if (!types[code]) types[code] = { name: code, count: 0, totalGset: 0 };
      types[code].count++;
      types[code].totalGset += inter.montant_gset || 0;
    });

    return Object.values(types).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [orangeInterventions, canalInterventions, orangePrices]);

  const chartData = typeData.map((type, i) => ({
    ...type,
    fill: CHART_COLORS[i % CHART_COLORS.length]
  }));

  return (
    <div className={`rounded-2xl border ${t.card} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
          <PieChart className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h3 className={`font-semibold ${t.text}`}>Types d'interventions</h3>
          <p className={`text-sm ${t.textMuted}`}>Répartition</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className={`${t.bgSecondary} border ${t.border} rounded-lg p-3 shadow-lg`}>
                    <p className={`font-medium ${t.text}`}>{data.name}</p>
                    <p className={`text-sm ${t.textSecondary}`}>{data.count} interventions</p>
                    {isDirection && showAmounts && (
                      <p className="text-sm text-emerald-500">
                        {data.totalGset.toLocaleString('fr-FR')}€
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }} />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.slice(0, 6).map((type) => (
          <div key={type.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.fill }} />
            <span className={`text-xs ${t.textSecondary} truncate`}>{type.name}</span>
            <span className={`text-xs font-medium ${t.text}`}>{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InterventionTypeChart;
