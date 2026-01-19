import { useState, useEffect } from 'react';
import { FileSpreadsheet, Trash2, Calendar, Users, Euro, ChevronDown, ChevronUp } from 'lucide-react';

export default function ImportHistory({ onDataChange }) {
  const [orangeData, setOrangeData] = useState({});
  const [canalData, setCanalData] = useState({});
  const [expanded, setExpanded] = useState({ orange: true, canal: true });

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const loadData = () => {
    setOrangeData(JSON.parse(localStorage.getItem('ftth_orange_data') || '{}'));
    setCanalData(JSON.parse(localStorage.getItem('ftth_canal_data') || '{}'));
  };

  const deleteImport = (type, periode) => {
    const key = type === 'orange' ? 'ftth_orange_data' : 'ftth_canal_data';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    delete data[periode];
    localStorage.setItem(key, JSON.stringify(data));
    loadData();
    onDataChange?.();
  };

  const clearAll = (type) => {
    const key = type === 'orange' ? 'ftth_orange_data' : 'ftth_canal_data';
    localStorage.removeItem(key);
    loadData();
    onDataChange?.();
  };

  const renderSection = (type, data, color) => {
    const entries = Object.entries(data);
    const isExpanded = expanded[type];
    const totalMontant = entries.reduce((s, [, d]) => s + (d.totalMontant || 0), 0);
    const totalRecords = entries.reduce((s, [, d]) => s + (d.totalRecords || 0), 0);

    return (
      <div className={`rounded-xl border ${color === 'orange' ? 'border-orange-200' : 'border-purple-200'} overflow-hidden`}>
        <button
          onClick={() => setExpanded(e => ({ ...e, [type]: !e[type] }))}
          className={`w-full px-4 py-3 flex items-center justify-between ${
            color === 'orange' ? 'bg-orange-50' : 'bg-purple-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className={`w-5 h-5 ${color === 'orange' ? 'text-orange-500' : 'text-purple-500'}`} />
            <span className="font-semibold text-gray-800">
              {type === 'orange' ? 'Orange RCC' : 'Canal+ GST'}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {entries.length} import{entries.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{totalRecords} lignes</span>
            <span className={`font-semibold ${color === 'orange' ? 'text-orange-600' : 'text-purple-600'}`}>
              {totalMontant.toLocaleString('fr-FR')}€
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="divide-y divide-gray-100">
            {entries.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Aucune donnée importée</p>
            ) : (
              entries.map(([periode, d]) => (
                <div key={periode} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{periode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{d.techs?.length || 0} techs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Euro className="w-4 h-4 text-teal-500" />
                      <span className="font-semibold text-teal-600">
                        {(d.totalMontant || 0).toLocaleString('fr-FR')}€
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{d.totalRecords} lignes</span>
                  </div>
                  <button
                    onClick={() => deleteImport(type, periode)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
            {entries.length > 0 && (
              <div className="p-3 bg-gray-50 flex justify-end">
                <button
                  onClick={() => clearAll(type)}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline"
                >
                  Tout supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSection('orange', orangeData, 'orange')}
      {renderSection('canal', canalData, 'purple')}
    </div>
  );
}
