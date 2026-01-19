import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// === PRIX CANAL+ PAR CODE FACTURATION ===
const CANAL_PRICES = {
  AERC: { gset: 117.45, tech: 70.47 },
  BPMS: { gset: 84.40, tech: 50.64 },
  CHRC: { gset: 169.50, tech: 101.70 },
  FARC: { gset: 156.60, tech: 93.96 },
  INRC: { gset: 139.26, tech: 83.56 },
  PBEA: { gset: 288.77, tech: 173.26 },
  PBEC: { gset: 201.30, tech: 120.78 },
  PBEF: { gset: 280.15, tech: 168.09 },
  PBIS: { gset: 176.12, tech: 105.67 },
  PDOS: { gset: 89.00, tech: 53.40 },
  SAVD: { gset: 240.00, tech: 144.00 },
  SAVS: { gset: 73.87, tech: 44.32 },
  SAVG: { gset: 73.87, tech: 44.32 },
  TXPA: { gset: 119.00, tech: 71.40 },
  TXPB: { gset: 178.50, tech: 107.10 },
  TXPC: { gset: 373.10, tech: 223.86 },
  TXPD: { gset: 174.20, tech: 104.52 },
};

// Mapping GSE → Nom
const GSE_MAPPING = {
  'GSE 02': 'Wendelle Edwige',
  'GSE 03': 'Claude',
  'GSE 04': 'Alan Pantoja',
  'GSE 05': 'Maxime Paul',
  'GSE 06': 'Carlos',
  'GSE 07': 'Technicien GSE07',
  'GSE 14': 'Technicien GSE14',
  'GSE 15': 'Luckmane Cyrile',
  'GSE 16': 'Dautruche Sauvenel',
  'GSE 17': 'Jahwer Sellemi',
  'GSE 18': 'Bakour Fallah',
  'GSE 19': 'Zakaria Settou',
};

// Colonnes pour détecter le type
const ORANGE_MARKERS = ['ND', 'TECH', 'Montant ST'];
const CANAL_POWERBI_MARKERS = ['TECHNICIEN', 'Ref PXO', 'FACTURATION'];
const CANAL_GST_MARKERS = ['Nom Technicien', 'total facture'];

export default function FileImport({ onImportComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const detectFileType = (columns) => {
    const cols = columns.map(c => String(c || '').toLowerCase());
    
    // Orange RCC
    if (cols.some(c => c.includes('montant st')) && cols.some(c => c === 'tech' || c === 'nd')) {
      return 'orange';
    }
    
    // Canal+ Power BI (nouveau format avec GSE codes)
    if (cols.some(c => c === 'technicien') && cols.some(c => c.includes('ref pxo'))) {
      return 'canal_powerbi';
    }
    
    // Canal+ GST (ancien format avec noms et prix)
    if (cols.some(c => c.includes('nom technicien')) && cols.some(c => c.includes('total facture'))) {
      return 'canal_gst';
    }
    
    return null;
  };

  const parseOrangeFile = (workbook) => {
    const sheetName = workbook.SheetNames.find(n => 
      n.toLowerCase().includes('détail') || n.toLowerCase().includes('detail')
    ) || workbook.SheetNames[1] || workbook.SheetNames[0];
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
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

    const byTech = {};
    records.forEach(r => {
      if (!byTech[r.tech]) byTech[r.tech] = [];
      byTech[r.tech].push(r);
    });

    return {
      type: 'orange',
      periode,
      totalRecords: records.length,
      totalMontant: records.reduce((s, r) => s + r.montant, 0),
      records,
      byTech,
      techs: Object.keys(byTech)
    };
  };

  const parseCanalPowerBI = (workbook) => {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Extraire période depuis nom de feuille ou données
    let periode = workbook.SheetNames[0] || '';
    const match = periode.match(/(\d{6})/);
    if (match) {
      periode = `${match[1].slice(0,4)}_${match[1].slice(4,6)}`;
    } else {
      // Essayer de trouver dans les données
      const firstRow = data[0] || {};
      const dateCol = firstRow['DATE SOLDE'] || firstRow['DATE VALIDATION'];
      if (dateCol) {
        const d = new Date(dateCol);
        periode = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    const records = data
      .filter(row => {
        // Filtrer les lignes valides (pas les lignes de filtre)
        const tech = row.TECHNICIEN || row['TECHNICIEN'];
        const marche = row.MARCHE || '';
        return tech && tech.startsWith('GSE') && marche === 'B2C';
      })
      .map(row => {
        const factCode = String(row.FACTURATION || '').toUpperCase().trim();
        const prices = CANAL_PRICES[factCode] || { gset: 0, tech: 0 };
        const techCode = String(row.TECHNICIEN || '').trim();
        
        return {
          tech: techCode, // Garder le code GSE comme clé
          techName: GSE_MAPPING[techCode] || techCode,
          refPxo: String(row['Ref PXO'] || ''),
          dateSolde: row['DATE SOLDE'] || '',
          dateValidation: row['DATE VALIDATION'] || '',
          prisePosee: row['Prise Posée'] || '',
          facturation: factCode,
          travauxSupp: row['TRAVAUX SUPPLEMENTAIRES'] || '',
          oi: row['O.I'] || '',
          typeInter: row['TYPE_INTER'] || '',
          montantGset: prices.gset,
          montantTech: prices.tech,
          agence: row.Agence || '',
          periode
        };
      });

    // Grouper par code GSE
    const byTech = {};
    records.forEach(r => {
      if (!byTech[r.tech]) byTech[r.tech] = [];
      byTech[r.tech].push(r);
    });

    const totalGset = records.reduce((s, r) => s + r.montantGset, 0);
    const totalTech = records.reduce((s, r) => s + r.montantTech, 0);

    return {
      type: 'canal',
      format: 'powerbi',
      periode,
      totalRecords: records.length,
      totalMontantGset: totalGset,
      totalMontantTech: totalTech,
      records,
      byTech,
      techs: Object.keys(byTech)
    };
  };

  const parseCanalGST = (workbook) => {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let periode = workbook.SheetNames[0] || '';
    const match = periode.match(/(\d{6})/);
    if (match) {
      periode = `${match[1].slice(0,4)}_${match[1].slice(4,6)}`;
    }

    const records = data
      .filter(row => row['Nom Technicien'] && row['total facture'])
      .map(row => {
        const montant = parseFloat(row['total facture']) || 0;
        const factCode = String(row.FACTURATION || '').toUpperCase().trim();
        const prices = CANAL_PRICES[factCode] || { gset: montant, tech: montant * 0.6 };
        
        return {
          tech: String(row['Nom Technicien'] || '').trim(),
          refPxo: String(row['Ref PXO'] || ''),
          dateSolde: row['DATE SOLDE'] || '',
          dateValidation: row['DATE VALIDATION'] || '',
          prisePosee: row['Prise Posée'] || '',
          facturation: factCode,
          oi: row['O.I'] || '',
          montantGset: prices.gset,
          montantTech: prices.tech,
          agence: row.Agence || '',
          periode
        };
      });

    const byTech = {};
    records.forEach(r => {
      if (!byTech[r.tech]) byTech[r.tech] = [];
      byTech[r.tech].push(r);
    });

    return {
      type: 'canal',
      format: 'gst',
      periode,
      totalRecords: records.length,
      totalMontantGset: records.reduce((s, r) => s + r.montantGset, 0),
      totalMontantTech: records.reduce((s, r) => s + r.montantTech, 0),
      records,
      byTech,
      techs: Object.keys(byTech)
    };
  };

  const processFile = async (file) => {
    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      
      // Détecter le type
      let fileType = null;
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = data[0] || [];
        fileType = detectFileType(headers);
        if (fileType) break;
      }

      if (!fileType) {
        throw new Error('Format non reconnu. Formats acceptés: Orange RCC, Canal+ Power BI, Canal+ GST');
      }

      let parsed;
      if (fileType === 'orange') {
        parsed = parseOrangeFile(workbook);
      } else if (fileType === 'canal_powerbi') {
        parsed = parseCanalPowerBI(workbook);
      } else {
        parsed = parseCanalGST(workbook);
      }

      // Sauvegarder
      const storageKey = parsed.type === 'orange' ? 'ftth_orange_data' : 'ftth_canal_data';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
      existing[parsed.periode] = parsed;
      localStorage.setItem(storageKey, JSON.stringify(existing));

      // Mettre à jour techs connus
      const knownTechs = JSON.parse(localStorage.getItem('ftth_techs') || '[]');
      const newTechs = [...new Set([...knownTechs, ...parsed.techs])];
      localStorage.setItem('ftth_techs', JSON.stringify(newTechs));

      setResult({
        success: true,
        type: parsed.type,
        format: parsed.format || 'standard',
        fileName: file.name,
        ...parsed
      });

      onImportComplete?.({ type: parsed.type, data: parsed });

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
    const xlsxFile = files.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (xlsxFile) processFile(xlsxFile);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}
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
              {importing ? 'Import en cours...' : 'Glissez un fichier Excel'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Orange RCC ou Canal+ (Power BI / GST)
            </p>
          </div>

          <div className="flex gap-2 mt-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              Orange RCC
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Canal+ Power BI
            </span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
              Canal+ GST
            </span>
          </div>
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div className={`rounded-xl p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 truncate">{result.fileName}</span>
                {result.success && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    result.type === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {result.type === 'orange' ? 'Orange' : `Canal+ ${result.format === 'powerbi' ? 'Power BI' : 'GST'}`}
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
                    <p className="text-gray-500">{result.type === 'orange' ? 'Total ST' : 'Total GSET'}</p>
                    <p className="font-semibold text-teal-600">
                      {(result.type === 'orange' ? result.totalMontant : result.totalMontantGset).toLocaleString('fr-FR')}€
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

            <button onClick={() => setResult(null)} className="p-1 hover:bg-gray-200 rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {result.success && result.byTech && (
            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-2">Répartition par technicien</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.byTech).slice(0, 8).map(([tech, records]) => {
                  const total = result.type === 'orange' 
                    ? records.reduce((s, r) => s + r.montant, 0)
                    : records.reduce((s, r) => s + (r.montantGset || 0), 0);
                  const displayName = GSE_MAPPING[tech] || tech;
                  return (
                    <div key={tech} className="px-3 py-1.5 bg-white rounded-lg border text-xs">
                      <span className="font-medium text-gray-700">{displayName}</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="text-teal-600 font-semibold">{total.toLocaleString('fr-FR')}€</span>
                      <span className="text-gray-400 ml-1">({records.length})</span>
                    </div>
                  );
                })}
                {Object.keys(result.byTech).length > 8 && (
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    +{Object.keys(result.byTech).length - 8} autres
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
