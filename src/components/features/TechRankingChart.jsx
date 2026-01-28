import { useMemo } from 'react';
import { Trophy, Crown } from 'lucide-react';
import { useTheme, useAmountVisibility } from '../../contexts';
import { themes } from '../../utils/theme';

function TechRankingChart({ orangeInterventions, canalInterventions, orangePrices }) {
  const { theme } = useTheme();
  const { showAmounts } = useAmountVisibility();
  const t = themes[theme];

  const rankingData = useMemo(() => {
    const techStats = {};

    orangeInterventions.forEach(inter => {
      const tech = inter.tech || 'Inconnu';
      if (!techStats[tech]) techStats[tech] = { name: tech, totalGset: 0, count: 0 };
      const match = String(inter.articles || '').match(/([A-Z]+\d*)/i);
      const price = match && orangePrices.find(p => p.code === match[1].toUpperCase());
      techStats[tech].totalGset += price?.gset_price || inter.montant_st || 0;
      techStats[tech].count++;
    });

    canalInterventions.forEach(inter => {
      const tech = inter.tech || inter.tech_name || 'Inconnu';
      if (!techStats[tech]) techStats[tech] = { name: tech, totalGset: 0, count: 0 };
      techStats[tech].totalGset += inter.montant_gset || 0;
      techStats[tech].count++;
    });

    return Object.values(techStats)
      .sort((a, b) => b.totalGset - a.totalGset)
      .slice(0, 10)
      .map((tech, i) => ({ ...tech, rank: i + 1 }));
  }, [orangeInterventions, canalInterventions, orangePrices]);

  return (
    <div className={`rounded-2xl border ${t.card} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className={`font-semibold ${t.text}`}>Classement Techniciens</h3>
          <p className={`text-sm ${t.textMuted}`}>Par CA généré</p>
        </div>
      </div>
      <div className="space-y-3">
        {rankingData.map((tech) => (
          <div key={tech.name} className={`flex items-center gap-4 p-3 rounded-xl ${t.bgTertiary}`}>
            <div className="w-8 flex justify-center">
              {tech.rank <= 3 ? (
                <Crown className={`w-5 h-5 ${
                  tech.rank === 1 ? 'text-yellow-500' :
                  tech.rank === 2 ? 'text-gray-400' : 'text-amber-600'
                }`} />
              ) : (
                <span className={`text-sm font-bold ${t.textMuted}`}>#{tech.rank}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${t.text} truncate`}>{tech.name}</p>
              <p className={`text-xs ${t.textMuted}`}>{tech.count} interv.</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${t.text}`}>
                {showAmounts ? `${tech.totalGset.toLocaleString('fr-FR')}€` : '••••€'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechRankingChart;
