import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// Colonnes attendues pour détecter le type de fichier
const ORANGE_COLUMNS = ['ND', 'TECH', 'ARTICLES', 'Montant ST'];
const CANAL_COLUMNS = ['Nom Technicien', 'Ref PXO', 'total facture', 'FACTURATION'];

export default function FileImport({ onImportComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const detectFileType = (columns) => {
    const colSet = new Set(columns.map(c => String(c).toLowerCase().trim()));
    const hasOrange = ORANGE_COLUMNS.some(c => 
      columns.some(col => String(col).toLowerCase().includes(c.toLowerCase()))
    );
    const hasCanal = CANAL_COLUMNS.some(c => 
      columns.some(col => String(col).toLowerCase().includes(c.toLowerCase()))
    );
    
    if (hasOrange && columns.some(c => String(c).includes('Montant ST'))) return 'orange';
    if (hasCanal && columns.some(c => String(c).includes('total facture'))) return 'canal';
    return null;
  };

  const parseOrangeFile = (workbook) => {
    // Chercher la feuille "Détails"
    const sheetName = workbook.SheetNames.find(n => 
      n.toLowerCase().includes('détail') || n.toLowerCase().includes('detail')
    ) || workbook.SheetNames[1] || workbook.SheetNames[0];
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    // Extraire période depuis la feuille Récap si possible
    let periode = '';
    if (workbook.SheetNames.includes('Récap')) {
      const recap = XLSX.utils.sheet_to_json(workbook.Sheets['Récap'], { header: 1 });
      const cell = recap.flat().find(c => String(c).includes('RCC'));
      if (cell) periode = String(cell).trim();
    }

    const records = data
      .filter(row => row.ND && row.TECH && row['Montant ST'])
      .map(row => ({
        nd: String(row.ND),
        dateDebut: row['Date debut travaux'] || '',
        dateFin: row['Date fin travaux'] || '',
        tech: String(row.TECH || '').trim(),
        articles: String(row.ARTICLES || '').trim(),
        montant: parseFloat(row['Montant ST']) || 0,
        typeMapping: row['TYPE MAPPING'] || 'D3',
        zone: row.ZONE || 'GUYANE',
        etat: row['ETAT PRAXEDO'] || '',
        periode: row.VALFAC || periode
      }));

    // Grouper par tech
    const byTech = {};
    records.forEach(r => {
      if (!byTech[r.tech]) byTech[r.tech] = [];
      byTech[r.tech].push(r);
    });

    // Stats par article
    const articleStats = {};
    records.forEach(r => {
      const art = r.articles.replace(/[\d.]+\s*/, '').trim();
      if (!articleStats[art]) articleStats[art] = { count: 0, total: 0 };
      articleStats[art].count++;
      articleStats[art].total += r.montant;
    });

    return {
      type: 'orange',
      periode,
      totalRecords: records.length,
      totalMontant: records.reduce((s, r) => s + r.montant, 0),
      records,
      byTech,
      articleStats,
      techs: Object.keys(byTech)
    };
  };

  const parseCanalFile = (workbook) => {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Extraire période depuis nom du fichier ou première ligne
    let periode = workbook.SheetNames[0] || '';
    const match = periode.match(/(\d{6})/);
    if (match) {
      const [, ym] = match;
      periode = `${ym.slice(0,4)}_${ym.slice(4,6)}`;
    }

    const records = data
      .filter(row => row['Nom Technicien'] && row['total facture'])
      .map(row => ({
        tech: String(row['Nom Technicien'] || '').trim(),
        refPxo: String(row['Ref PXO'] || ''),
        dateSolde: row['DATE SOLDE'] || '',
        dateValidation: row['DATE VALIDATION'] || '',
        prisePosee: row['Prise Posée'] || '',
        facturation: String(row.FACTURATION || ''),
        travauxSupp: row['TRAVAUX SUPPLEMENTAIRES'] || '',
        oi: row['O.I'] || '',
        montant: parseFloat(row['total facture']) || 0,
        marche: row.MARCHE || '',
        agence: row.Agence || '',
        periode
      }));

    // Grouper par tech
    const byTech = {};
    records.forEach(r => {
      if (!byTech[r.tech]) byTech[r.tech] = [];
      byTech[r.tech].push(r);
    });

    // Stats par facturation
    const facturationStats = {};
    records.forEach(r => {
      const fact = r.facturation;
      if (!facturationStats[fact]) facturationStats[fact] = { count: 0, total: 0 };
      facturationStats[fact].count++;
      facturationStats[fact].total += r.montant;
    });

    return {
      type: 'canal',
      periode,
      totalRecords: records.length,
      totalMontant: records.reduce((s, r) => s + r.montant, 0),
      records,
      byTech,
      facturationStats,
      techs: Object.keys(byTech)
    };
  };

  const processFile = async (file) => {
    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      
      // Détecter le type en analysant les colonnes de la première feuille avec données
      let fileType = null;
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = data[0] || [];
        fileType = detectFileType(headers);
        if (fileType) break;
      }

      if (!fileType) {
        // Essayer avec la deuxième ligne (parfois les headers sont décalés)
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (data[1]) {
            fileType = detectFileType(data[1]);
            if (fileType) break;
          }
        }
      }

      if (!fileType) {
        throw new Error('Format de fichier non reconnu. Attendu: RCC Orange ou Extract Canal+');
      }

      const parsed = fileType === 'orange' 
        ? parseOrangeFile(workbook) 
        : parseCanalFile(workbook);

      // Sauvegarder en localStorage
      const storageKey = fileType === 'orange' ? 'ftth_orange_data' : 'ftth_canal_data';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      // Merger avec les données existantes (par période)
      existing[parsed.periode] = parsed;
      localStorage.setItem(storageKey, JSON.stringify(existing));

      // Mettre à jour la liste des techs connus
      const knownTechs = JSON.parse(localStorage.getItem('ftth_techs') || '[]');
      const newTechs = [...new Set([...knownTechs, ...parsed.techs])];
      localStorage.setItem('ftth_techs', JSON.stringify(newTechs));

      setResult({
        success: true,
        type: fileType,
        fileName: file.name,
        ...parsed
      });

      onImportComplete?.({ type: fileType, data: parsed });

    } catch (err) {
      setResult({
        success: false,
        error: err.message,
        fileName: file.name
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = [...e.dataTransfer.files];
    const xlsxFile = files.find(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    if (xlsxFile) processFile(xlsxFile);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive 
            ? 'border-teal-500 bg-teal-50' 
            : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
          }
          ${importing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={importing}
        />
        
        <div className="flex flex-col items-center gap-3">
          {importing ? (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
          ) : (
            <Upload className={`w-12 h-12 ${dragActive ? 'text-teal-500' : 'text-gray-400'}`} />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {importing ? 'Import en cours...' : 'Glissez un fichier Excel ici'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              RCC Orange (.xlsx) ou Extract Canal+ (.xlsx)
            </p>
          </div>

          <div className="flex gap-2 mt-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              Orange RCC
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Canal+ GST
            </span>
          </div>
        </div>
      </div>

      {/* Résultat de l'import */}
      {result && (
        <div className={`
          rounded-xl p-4 ${result.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
          }
        `}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 truncate">{result.fileName}</span>
                {result.success && (
                  <span className={`
                    px-2 py-0.5 text-xs rounded-full font-medium
                    ${result.type === 'orange' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-purple-100 text-purple-700'
                    }
                  `}>
                    {result.type === 'orange' ? 'Orange RCC' : 'Canal+'}
                  </span>
                )}
              </div>

              {result.success ? (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Période</p>
                    <p className="font-semibold text-gray-800">{result.periode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lignes</p>
                    <p className="font-semibold text-gray-800">{result.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold text-teal-600">
                      {result.totalMontant.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Techs</p>
                    <p className="font-semibold text-gray-800">{result.techs.length}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-red-600">{result.error}</p>
              )}
            </div>

            <button 
              onClick={() => setResult(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Détails par tech si succès */}
          {result.success && result.byTech && (
            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-2">Répartition par technicien</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.byTech).slice(0, 6).map(([tech, records]) => (
                  <div 
                    key={tech}
                    className="px-3 py-1.5 bg-white rounded-lg border text-xs"
                  >
                    <span className="font-medium text-gray-700">{tech}</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span className="text-teal-600 font-semibold">
                      {records.reduce((s, r) => s + r.montant, 0).toLocaleString('fr-FR')}€
                    </span>
                    <span className="text-gray-400 ml-1">({records.length})</span>
                  </div>
                ))}
                {Object.keys(result.byTech).length > 6 && (
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    +{Object.keys(result.byTech).length - 6} autres
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
