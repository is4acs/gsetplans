import { useMemo } from 'react';
import { Euro, Activity, TrendingUp, PieChart, Users } from 'lucide-react';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';
import StatCard from '../ui/StatCard';

function TechDashboardStats({ filteredOrange, filteredCanal, orangePrices, profile }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];

  const stats = useMemo(() => {
    let totalTech = 0;

    filteredOrange.forEach(inter => {
      const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
      const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
      totalTech += price?.tech_price || inter.montant_st * 0.55;
    });

    filteredCanal.forEach(inter => {
      totalTech += inter.montant_tech || 0;
    });

    const aliases = profile?.aliases || [];
    const byAlias = {};

    if (aliases.length > 1) {
      aliases.forEach(alias => {
        byAlias[alias] = { orange: 0, canal: 0, total: 0 };
      });

      filteredOrange.forEach(inter => {
        const tech = inter.tech?.toLowerCase();
        const alias = aliases.find(a => tech?.includes(a.toLowerCase()));
        if (alias && byAlias[alias]) {
          const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
          const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
          byAlias[alias].orange++;
          byAlias[alias].total += price?.tech_price || inter.montant_st * 0.55;
        }
      });

      filteredCanal.forEach(inter => {
        const tech = (inter.tech || inter.tech_name)?.toLowerCase();
        const alias = aliases.find(a => tech?.includes(a.toLowerCase()));
        if (alias && byAlias[alias]) {
          byAlias[alias].canal++;
          byAlias[alias].total += inter.montant_tech || 0;
        }
      });
    }

    return {
      totalTech,
      totalCount: filteredOrange.length + filteredCanal.length,
      orangeCount: filteredOrange.length,
      canalCount: filteredCanal.length,
      byAlias
    };
  }, [filteredOrange, filteredCanal, orangePrices, profile]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Euro}
          label="Revenus"
          value={`${stats.totalTech.toLocaleString('fr-FR')}€`}
          color="emerald"
        />
        <StatCard
          icon={Activity}
          label="Interventions"
          value={stats.totalCount}
          sub={`${stats.orangeCount} Orange • ${stats.canalCount} Canal+`}
          color="blue"
          hideable={false}
        />
        <StatCard
          icon={TrendingUp}
          label="Orange"
          value={`${stats.orangeCount}`}
          color="orange"
          hideable={false}
        />
        <StatCard
          icon={PieChart}
          label="Canal+"
          value={`${stats.canalCount}`}
          color="purple"
          hideable={false}
        />
      </div>

      {Object.keys(stats.byAlias).length > 1 && (
        <div className={`rounded-2xl border ${t.card} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className={`font-semibold ${t.text}`}>Détail par technicien</h3>
              <p className={`text-sm ${t.textMuted}`}>{Object.keys(stats.byAlias).length} techniciens</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.byAlias).map(([alias, data]) => (
              <div key={alias} className={`p-4 rounded-xl ${t.bgTertiary}`}>
                <p className={`font-medium ${t.text} mb-2`}>{alias}</p>
                <div className="flex justify-between">
                  <span className={`text-sm ${t.textMuted}`}>Orange</span>
                  <span className="text-sm font-medium text-orange-500">{data.orange}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${t.textMuted}`}>Canal+</span>
                  <span className="text-sm font-medium text-purple-500">{data.canal}</span>
                </div>
                <div className={`flex justify-between pt-2 border-t ${t.borderLight} mt-2`}>
                  <span className={`text-sm font-medium ${t.text}`}>Total</span>
                  <span className="text-sm font-bold text-emerald-500">
                    {showAmounts ? `${data.total.toLocaleString('fr-FR')}€` : '••••€'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TechDashboardStats;
