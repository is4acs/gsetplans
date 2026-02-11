import { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts';
import { themes } from '../../utils/theme';

const CANAL_SUPPLEMENTS = ['TXPA', 'TXPB', 'TXPC', 'TXPD'];

function DailyDetailModal({ entry, prices, existingDetails, isDirection, onSave, onClose }) {
  const { theme } = useTheme();
  const t = themes[theme];

  const isCanal = entry.source === 'Canal+';

  // Séparer codes principaux et suppléments pour Canal+
  const { mainPrices, supplementPrices } = useMemo(() => {
    if (!isCanal) return { mainPrices: prices, supplementPrices: [] };
    return {
      mainPrices: prices.filter(p => !CANAL_SUPPLEMENTS.includes(p.code)),
      supplementPrices: prices.filter(p => CANAL_SUPPLEMENTS.includes(p.code))
    };
  }, [prices, isCanal]);

  // Initialiser les quantités depuis les détails existants
  const [quantities, setQuantities] = useState(() => {
    const q = {};
    prices.forEach(p => { q[p.code] = 0; });
    if (existingDetails?.length) {
      existingDetails.forEach(d => {
        if (q[d.article_code] !== undefined) {
          q[d.article_code] = d.quantity;
        }
      });
    }
    return q;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Total des codes principaux alloués
  const totalMainAllocated = useMemo(() => {
    if (isCanal) {
      return mainPrices.reduce((sum, p) => sum + (quantities[p.code] || 0), 0);
    }
    return prices.reduce((sum, p) => sum + (quantities[p.code] || 0), 0);
  }, [quantities, prices, mainPrices, isCanal]);

  // Revenu total réel (principaux + suppléments)
  const totalRevenu = useMemo(() => {
    return prices.reduce((sum, p) => {
      const qty = quantities[p.code] || 0;
      return sum + qty * (isDirection ? (p.gset_price || 0) : (p.tech_price || 0));
    }, 0);
  }, [quantities, prices, isDirection]);

  // Revenu suppléments seuls
  const supplementRevenu = useMemo(() => {
    if (!isCanal) return 0;
    return supplementPrices.reduce((sum, p) => {
      const qty = quantities[p.code] || 0;
      return sum + qty * (isDirection ? (p.gset_price || 0) : (p.tech_price || 0));
    }, 0);
  }, [quantities, supplementPrices, isCanal, isDirection]);

  const isValid = totalMainAllocated === entry.otOK;
  const remaining = entry.otOK - totalMainAllocated;

  const updateQty = (code, delta) => {
    setQuantities(prev => {
      const newVal = Math.max(0, (prev[code] || 0) + delta);
      const isSupplement = CANAL_SUPPLEMENTS.includes(code);

      // Pour les codes principaux, vérifier qu'on ne dépasse pas otOK
      if (!isSupplement && !isCanal) {
        const otherTotal = prices.reduce((sum, p) => p.code === code ? sum : sum + (prev[p.code] || 0), 0);
        if (otherTotal + newVal > entry.otOK) return prev;
      } else if (!isSupplement && isCanal) {
        const otherTotal = mainPrices.reduce((sum, p) => p.code === code ? sum : sum + (prev[p.code] || 0), 0);
        if (otherTotal + newVal > entry.otOK) return prev;
      }

      return { ...prev, [code]: newVal };
    });
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      const details = prices
        .filter(p => (quantities[p.code] || 0) > 0)
        .map(p => ({
          article_code: p.code,
          is_supplement: CANAL_SUPPLEMENTS.includes(p.code),
          quantity: quantities[p.code],
          unit_gset_price: p.gset_price || 0,
          unit_tech_price: p.tech_price || 0
        }));
      await onSave(details);
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderCodeRow = (p) => {
    const qty = quantities[p.code] || 0;
    const unitPrice = isDirection ? (p.gset_price || 0) : (p.tech_price || 0);
    const rowTotal = qty * unitPrice;

    return (
      <tr key={p.code} className={`${qty > 0 ? (theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50') : ''} transition-colors`}>
        <td className={`px-3 py-2.5 font-mono font-medium text-sm ${t.text}`}>{p.code}</td>
        <td className={`px-3 py-2.5 text-right text-sm ${t.textSecondary}`}>{unitPrice.toFixed(2)}€</td>
        <td className="px-3 py-2.5">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => updateQty(p.code, -1)}
              disabled={qty === 0}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${qty === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200 active:scale-95'}`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className={`w-8 text-center font-bold text-sm ${qty > 0 ? 'text-emerald-500' : t.textMuted}`}>{qty}</span>
            <button
              onClick={() => updateQty(p.code, 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 hover:bg-emerald-200 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </td>
        <td className={`px-3 py-2.5 text-right font-medium text-sm ${qty > 0 ? 'text-emerald-500' : t.textMuted}`}>
          {rowTotal > 0 ? `${rowTotal.toFixed(2)}€` : '-'}
        </td>
      </tr>
    );
  };

  const progressPercent = entry.otOK > 0 ? Math.min(100, (totalMainAllocated / entry.otOK) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg max-h-[90vh] rounded-2xl ${t.bgSecondary} border ${t.border} shadow-2xl flex flex-col overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b ${t.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`text-lg font-bold ${t.text}`}>Détail OT</h3>
              <p className={`text-sm ${t.textMuted}`}>
                {entry.tech} • {formatDate(entry.date)}
              </p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${t.bgHover} transition-colors`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${entry.source === 'Orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
              {entry.source}
            </span>
            <span className={`text-sm font-medium ${t.text}`}>{entry.otOK} OT à répartir</span>
          </div>

          {/* Barre de progression */}
          <div className="relative">
            <div className={`w-full h-3 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${isValid ? 'bg-emerald-500' : progressPercent > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className={`text-xs font-medium ${isValid ? 'text-emerald-500' : t.textMuted}`}>
                {totalMainAllocated}/{entry.otOK} répartis
              </span>
              {remaining > 0 && (
                <span className={`text-xs ${t.textMuted}`}>{remaining} restant{remaining > 1 ? 's' : ''}</span>
              )}
              {remaining < 0 && (
                <span className="text-xs text-red-500">Dépassement !</span>
              )}
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full">
            <thead className={`${t.bgTertiary} sticky top-0 z-10`}>
              <tr>
                <th className={`px-3 py-2.5 text-left text-xs font-semibold ${t.textSecondary} uppercase`}>Code</th>
                <th className={`px-3 py-2.5 text-right text-xs font-semibold ${t.textSecondary} uppercase`}>Prix</th>
                <th className={`px-3 py-2.5 text-center text-xs font-semibold ${t.textSecondary} uppercase`}>Qté</th>
                <th className={`px-3 py-2.5 text-right text-xs font-semibold ${t.textSecondary} uppercase`}>Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${t.borderLight || t.border}`}>
              {/* Codes principaux */}
              {isCanal && (
                <tr>
                  <td colSpan={4} className={`px-3 py-2 ${t.bgTertiary}`}>
                    <span className={`text-xs font-semibold uppercase ${t.textSecondary}`}>Codes principaux</span>
                  </td>
                </tr>
              )}
              {(isCanal ? mainPrices : prices).map(renderCodeRow)}

              {/* Travaux supplémentaires Canal+ */}
              {isCanal && supplementPrices.length > 0 && (
                <>
                  <tr>
                    <td colSpan={4} className={`px-3 py-2 ${t.bgTertiary}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase ${t.textSecondary}`}>Travaux supplémentaires</span>
                        <span className={`text-xs ${t.textMuted}`}>(optionnel)</span>
                      </div>
                    </td>
                  </tr>
                  {supplementPrices.map(renderCodeRow)}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${t.border} space-y-3`}>
          {/* Total revenu */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${t.text}`}>Total réel</p>
              {isCanal && supplementRevenu > 0 && (
                <p className={`text-xs ${t.textMuted}`}>dont {supplementRevenu.toFixed(2)}€ de travaux supp.</p>
              )}
            </div>
            <p className="text-2xl font-bold text-emerald-500">{totalRevenu.toFixed(2)}€</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-100 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-medium text-sm ${t.bgTertiary} ${t.text} ${t.bgHover} transition-colors`}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 ${isValid ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyDetailModal;
