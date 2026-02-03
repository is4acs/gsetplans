import { useState } from 'react';
import { useTheme } from '../contexts';
import { themes } from '../utils/theme';
import { updateOrangePrice, updateCanalPrice } from '../lib/supabase';

function PriceGridPage({ orangePrices, canalPrices, onRefresh }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('orange');
  const [editingPrice, setEditingPrice] = useState(null);

  const handleUpdatePrice = async (gridType, code, field, value) => {
    try {
      const prices = gridType === 'orange' ? orangePrices : canalPrices;
      const current = prices.find(p => p.code === code);
      const gset = field === 'gset' ? parseFloat(value) : current?.gset_price || 0;
      const tech = field === 'tech' ? parseFloat(value) : current?.tech_price || 0;
      
      if (gridType === 'orange') {
        await updateOrangePrice(code, gset, tech);
      } else {
        await updateCanalPrice(code, gset, tech);
      }
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setEditingPrice(null);
    }
  };

  const tabClass = (active) => `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
    active ? t.accentLight : `${t.textSecondary} ${t.bgHover}`
  }`;

  const renderGrid = (prices, gridType) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className={t.bgTertiary}>
          <tr>
            <th className={`px-4 py-3 text-left font-medium ${t.textSecondary} uppercase text-xs`}>Code</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix GSET</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Prix Tech</th>
            <th className={`px-4 py-3 text-right font-medium ${t.textSecondary} uppercase text-xs`}>Marge</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${t.borderLight}`}>
          {prices.map((p) => (
            <tr key={p.code} className={`${t.bgHover} transition-colors`}>
              <td className={`px-4 py-3 font-mono font-medium ${t.text}`}>{p.code}</td>
              <td className="px-4 py-3 text-right">
                {editingPrice === `${gridType}-${p.code}-gset` ? (
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={p.gset_price}
                    autoFocus
                    onBlur={(e) => handleUpdatePrice(gridType, p.code, 'gset', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdatePrice(gridType, p.code, 'gset', e.target.value);
                      if (e.key === 'Escape') setEditingPrice(null);
                    }}
                    className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`}
                  />
                ) : (
                  <button
                    onClick={() => setEditingPrice(`${gridType}-${p.code}-gset`)}
                    className={`${gridType === 'orange' ? 'text-orange-500' : 'text-emerald-500'} px-2 py-1 rounded-lg ${t.bgHover}`}
                  >
                    {p.gset_price?.toFixed(2)}€
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editingPrice === `${gridType}-${p.code}-tech` ? (
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={p.tech_price}
                    autoFocus
                    onBlur={(e) => handleUpdatePrice(gridType, p.code, 'tech', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdatePrice(gridType, p.code, 'tech', e.target.value);
                      if (e.key === 'Escape') setEditingPrice(null);
                    }}
                    className={`w-24 px-2 py-1 rounded-lg text-right ${t.input} border`}
                  />
                ) : (
                  <button
                    onClick={() => setEditingPrice(`${gridType}-${p.code}-tech`)}
                    className={`text-blue-500 px-2 py-1 rounded-lg ${t.bgHover}`}
                  >
                    {p.tech_price?.toFixed(2)}€
                  </button>
                )}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${
                (p.gset_price - p.tech_price) > 0 ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {(p.gset_price - p.tech_price).toFixed(2)}€
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('orange')} className={tabClass(activeTab === 'orange')}>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Orange ({orangePrices.length})
          </span>
        </button>
        <button onClick={() => setActiveTab('canal')} className={tabClass(activeTab === 'canal')}>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            Canal+ ({canalPrices.length})
          </span>
        </button>
      </div>
      <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
        <div className={`p-4 border-b ${t.border}`}>
          <h3 className={`font-semibold ${t.text}`}>
            {activeTab === 'orange' ? 'Grille Orange' : 'Grille Canal+'}
          </h3>
          <p className={`text-sm ${t.textMuted}`}>Cliquez pour modifier</p>
        </div>
        {activeTab === 'orange' ? renderGrid(orangePrices, 'orange') : renderGrid(canalPrices, 'canal')}
      </div>
    </div>
  );
}

export default PriceGridPage;
