import { useState, useEffect } from 'react';
import { Trash2, Database, Calendar, Users, Euro, AlertTriangle } from 'lucide-react';

export default function ImportHistory({ onDataChange }) {
  const [orangeData, setOrangeData] = useState({});
  const [canalData, setCanalData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    setOrangeData(JSON.parse(localStorage.getItem('ftth_orange_data') || '{}'));
    setCanalData(JSON.parse(localStorage.getItem('ftth_canal_data') || '{}'));
  }, []);

  const deleteImport = (type, key) => {
    const storageKey = type === 'orange' ? 'ftth_orange_data' : 'ftth_canal_data';
    const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
    delete data[key];
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    if (type === 'orange') setOrangeData(data);
    else setCanalData(data);
    
    setConfirmDelete(null);
    onDataChange?.();
  };

  const clearAll = () => {
    localStorage.removeItem('ftth_orange_data');
    localStorage.removeItem('ftth_canal_data');
    setOrangeData({});
    setCanalData({});
    setConfirmDelete(null);
    onDataChange?.();
  };

  const allImports = [
    ...Object.entries(orangeData).map(([key, data]) => ({ key, type: 'orange', data })),
    ...Object.entries(canalData).map(([key, data]) => ({ key, type: 'canal', data })),
  ].sort((a, b) => b.key.localeCompare(a.key));

  if (allImports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune donnée importée</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Importez un fichier Excel pour commencer</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total imports</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{allImports.length}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4">
          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Orange</p>
          <p className="text-2xl font-bold text-orange-600">{Object.keys(orangeData).length}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Canal+</p>
          <p className="text-2xl font-bold text-purple-600">{Object.keys(canalData).length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Interventions</p>
          <p className="text-2xl font-bold text-emerald-600">
            {allImports.reduce((s, i) => s + (i.data.totalRecords || 0), 0)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {allImports.map(({ key, type, data }) => (
          <div key={`${type}-${key}`} 
            className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  type === 'orange' ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-purple-100 dark:bg-purple-500/20'
                }`}>
                  <Database className={`w-5 h-5 ${type === 'orange' ? 'text-orange-500' : 'text-purple-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{key}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {Object.keys(data.byTech || {}).length} techs
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {data.totalRecords || 0} interv.
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {(type === 'orange' ? data.totalMontant : data.totalMontantGset || 0).toLocaleString('fr-FR')}€
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  type === 'orange' 
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' 
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                }`}>
                  {type === 'orange' ? 'Orange' : 'Canal+'}
                </span>
                
                {confirmDelete === `${type}-${key}` ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteImport(type, key)}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600">
                      Confirmer
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg">
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(`${type}-${key}`)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clear All */}
      {allImports.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {confirmDelete === 'all' ? (
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-500/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">Supprimer toutes les données ?</p>
              </div>
              <div className="flex gap-2">
                <button onClick={clearAll}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600">
                  Tout supprimer
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete('all')}
              className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors">
              Supprimer toutes les données
            </button>
          )}
        </div>
      )}
    </div>
  );
}
