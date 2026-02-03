import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';
import { MONTHS } from '../../utils/constants';

function RevenueTrendChart({
  orangeInterventions,
  canalInterventions,
  orangePrices,
  isDirection
}) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];

  const trendData = useMemo(() => {
    const monthlyData = {};

    orangeInterventions.forEach(inter => {
      const key = `${inter.year}-${String(inter.month).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, orange: 0, canal: 0, orangeTech: 0, canalTech: 0 };
      }
      const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
      const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
      monthlyData[key].orange += price?.gset_price || inter.montant_st || 0;
      monthlyData[key].orangeTech += price?.tech_price || inter.montant_st * 0.55;
    });

    canalInterventions.forEach(inter => {
      const key = `${inter.year}-${String(inter.month).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, orange: 0, canal: 0, orangeTech: 0, canalTech: 0 };
      }
      monthlyData[key].canal += inter.montant_gset || 0;
      monthlyData[key].canalTech += inter.montant_tech || 0;
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(d => ({
        ...d,
        label: MONTHS.find(m => m.value === parseInt(d.month.split('-')[1]))?.label?.slice(0, 3) || d.month
      }));
  }, [orangeInterventions, canalInterventions, orangePrices]);

  return (
    <div className={`rounded-2xl border ${t.card} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className={`font-semibold ${t.text}`}>
            Évolution {isDirection ? 'CA' : 'Revenus'}
          </h3>
          <p className={`text-sm ${t.textMuted}`}>6 derniers mois</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCanal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
            />
            <XAxis
              dataKey="label"
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              fontSize={12}
            />
            <YAxis
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              fontSize={12}
              tickFormatter={(value) => showAmounts ? `${(value / 1000).toFixed(0)}k` : '•••'}
            />
            <Tooltip content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={`${t.bgSecondary} border ${t.border} rounded-lg p-3 shadow-lg`}>
                    <p className={`font-medium ${t.text} mb-2`}>{label}</p>
                    {payload.map((p, i) => (
                      <p key={i} className="text-sm" style={{ color: p.color }}>
                        {p.name}: {showAmounts ? `${p.value.toLocaleString('fr-FR')}€` : '••••€'}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }} />
            <Area
              type="monotone"
              dataKey={isDirection ? "orange" : "orangeTech"}
              name="Orange"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorOrange)"
            />
            <Area
              type="monotone"
              dataKey={isDirection ? "canal" : "canalTech"}
              name="Canal+"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorCanal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueTrendChart;
