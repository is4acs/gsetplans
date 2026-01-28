import { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts';
import { themes } from '../../utils/theme';
import { deleteImport } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';

function ImportHistorySection({ imports, onRefresh }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (imp) => {
    setDeleting(true);
    try {
      await deleteImport(imp.id, imp.type, imp.periode);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (!imports.length) {
    return <p className={`text-center py-8 ${t.textMuted}`}>Aucun import</p>;
  }

  return (
    <div className="space-y-2">
      {imports.map((imp) => (
        <div
          key={imp.id}
          className={`group ${t.bgTertiary} rounded-xl p-4 ${t.bgHover} transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                imp.type === 'orange'
                  ? 'bg-orange-100 dark:bg-orange-500/20'
                  : 'bg-purple-100 dark:bg-purple-500/20'
              }`}>
                <Upload className={`w-5 h-5 ${
                  imp.type === 'orange' ? 'text-orange-500' : 'text-purple-500'
                }`} />
              </div>
              <div>
                <p className={`font-medium ${t.text}`}>{imp.periode}</p>
                <p className={`text-xs ${t.textMuted}`}>
                  {imp.total_records} interv. • {imp.total_montant?.toLocaleString('fr-FR')}€
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                imp.type === 'orange'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
              }`}>
                {imp.type === 'orange' ? 'Orange' : 'Canal+'}
              </span>
              {confirmDelete === imp.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(imp)}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting ? <LoadingSpinner size="sm" /> : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className={`px-3 py-1.5 ${t.bgSecondary} ${t.textSecondary} text-xs font-medium rounded-lg`}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(imp.id)}
                  className={`p-2 ${t.textMuted} hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ImportHistorySection;
