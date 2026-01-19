import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';

// Get settings to access prices
function getSettings() {
  const saved = localStorage.getItem('ftth_settings');
  if (saved) return JSON.parse(saved);
  return { canalPrices: {} };
}

const DEFAULT_CANAL_PRICES = {
  AERC: { gset: 117.45, tech: 70.47 }, BPMS: { gset: 84.40, tech: 50.64 },
  CHRC: { gset: 169.50, tech: 101.70 }, FARC: { gset: 156.60, tech: 93.96 },
  INRC: { gset: 139.26, tech: 83.56 }, PBEA: { gset: 288.77, tech: 173.26 },
  PBEC: { gset: 201.30, tech: 120.78 }, PBEF: { gset: 280.15, tech: 168.09 },
  PBIS: { gset: 176.12, tech: 105.67 }, PDOS: { gset: 89.00, tech: 53.40 },
  SAVD: { gset: 240.00, tech: 144.00 }, SAVS: { gset: 73.87, tech: 44.32 },
  SAVG: { gset: 73.87, tech: 44.32 }, TXPA: { gset: 119.00, tech: 71.40 },
  TXPB: { gset: 178.50, tech: 107.10 }, TXPC: { gset: 373.10, tech: 223.86 },
  TXPD: { gset: 174.20, tech: 104.52 },
};

const GSE_NAMES = {
  'GSE 02': 'Wendelle Edwige', 'GSE 03': 'Claude', 'GSE 04': 'Alan Pantoja',
  'GSE 05': 'Maxime Paul', 'GSE 06': 'Carlos', 'GSE 15': 'Luckmane Cyrile',
  'GSE 16': 'Dautruche Sauvenel', 'GSE 17': 'Jahwer Sellemi',
  'GSE 18': 'Bakour Fallah', 'GSE 19': 'Zakaria Settou',
};

function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
    const dmyMatch = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) return new Date(dmyMatch[3], dmyMatch[2] - 1, dmyMatch[1]);
  }
  return null;
}

function formatDateISO(date) {
  return date ? date.toISOString() : null;
}

function getWeekNumber(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function detectFileType(workbook) {
  const sheetNames = workbook.SheetNames;
  
  if (sheetNames.some(n => n.toLowerCase().includes('récap') || n.toLowerCase().includes('recap'))) {
    const detailSheet = sheetNames.find(n => n.toLowerCase().includes('détail') || n.toLowerCase().includes('detail'));
    if (detailSheet) {
      const ws = workbook.Sheets[detailSheet];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        const headers = data[0].map(h => String(h || '').toLowerCase());
        if (headers.some(h => h.includes('date debut travaux') || h.includes('date fin travaux'))) {
          return 'orange_rcc';
        }
      }
    }
  }
  
  const ws = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (data.length > 0) {
    const headers = data[0].map(h => String(h || '').toLowerCase());
    if (headers.includes('technicien') && headers.includes('facturation') && !headers.includes('total facture')) {
      return 'canal_powerbi';
    }
    if (headers.some(h => h.includes('nom technicien')) && headers.some(h => h.includes('total facture'))) {
      return 'canal_gst';
    }
  }
  
  return 'unknown';
}

function parseOrangeRCC(workbook) {
  const sheetNames = workbook.SheetNames;
  let periode = '';
  
  const recapSheet = sheetNames.find(n => n.toLowerCase().includes('récap') || n.toLowerCase().includes('recap'));
  if (recapSheet) {
    const ws = workbook.Sheets[recapSheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (const row of data) {
      if (row[0] && String(row[0]).match(/\d{4}[_-]\d{2}/)) {
        periode = String(row[0]).trim();
        break;
      }
    }
  }
  
  const detailSheet = sheetNames.find(n => n.toLowerCase().includes('détail') || n.toLowerCase().includes('detail'));
  if (!detailSheet) return { error: 'Feuille Détails non trouvée' };
  
  const ws = workbook.Sheets[detailSheet];
  const rows = XLSX.utils.sheet_to_json(ws);
  
  const records = [];
  const byTech = {};
  
  for (const row of rows) {
    const nd = row['ND'] || row['nd'];
    const tech = row['TECH'] || row['Tech'] || row['tech'];
    const montant = parseFloat(row['Montant ST'] || row['montant st'] || row['MONTANT ST'] || 0);
    const articles = row['ARTICLES'] || row['Articles'] || row['articles'] || '';
    const dateDebut = parseExcelDate(row['Date debut travaux'] || row['DATE DEBUT TRAVAUX']);
    const dateFin = parseExcelDate(row['Date fin travaux'] || row['DATE FIN TRAVAUX']);
    const dateRef = dateFin || dateDebut;
    
    if (tech && montant) {
      const record = {
        nd: String(nd || ''), tech, montant, articles: String(articles).trim(),
        dateDebut: formatDateISO(dateDebut), dateFin: formatDateISO(dateFin), date: formatDateISO(dateRef),
        week: dateRef ? getWeekNumber(dateRef) : null,
        month: dateRef ? dateRef.getMonth() + 1 : null,
        year: dateRef ? dateRef.getFullYear() : null,
      };
      records.push(record);
      if (!byTech[tech]) byTech[tech] = [];
      byTech[tech].push(record);
    }
  }
  
  if (!periode && records.length > 0) {
    const firstDate = records.find(r => r.date);
    if (firstDate?.year && firstDate?.month) {
      periode = `${firstDate.year}_${String(firstDate.month).padStart(2, '0')} RCC`;
    }
  }
  
  return {
    type: 'orange', periode: periode || `Import_${Date.now()}`, records, byTech,
    totalRecords: records.length, totalMontant: records.reduce((s, r) => s + r.montant, 0),
  };
}

function parseCanalPowerBI(workbook) {
  const settings = getSettings();
  const prices = { ...DEFAULT_CANAL_PRICES, ...settings.canalPrices };
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
  
  const records = [];
  const byTech = {};
  let minDate = null;
  
  for (const row of rows) {
    const techRaw = row['TECHNICIEN'] || row['technicien'] || '';
    const refPxo = row['Ref PXO'] || row['REF PXO'] || '';
    const facturation = row['FACTURATION'] || row['facturation'] || '';
    const agence = row['Agence'] || row['agence'] || '';
    const dateSolde = parseExcelDate(row['DATE SOLDE'] || row['Date Solde']);
    const dateValidation = parseExcelDate(row['DATE VALIDATION'] || row['Date Validation']);
    const dateRef = dateSolde || dateValidation;
    
    if (dateRef && (!minDate || dateRef < minDate)) minDate = dateRef;
    if (!facturation || !techRaw) continue;
    
    const p = prices[facturation.toUpperCase()] || { gset: 0, tech: 0 };
    
    const record = {
      tech: techRaw, techName: GSE_NAMES[techRaw] || techRaw, refPxo: String(refPxo),
      facturation: facturation.toUpperCase(), agence, montantGset: p.gset, montantTech: p.tech,
      dateSolde: formatDateISO(dateSolde), dateValidation: formatDateISO(dateValidation),
      date: formatDateISO(dateRef), week: dateRef ? getWeekNumber(dateRef) : null,
      month: dateRef ? dateRef.getMonth() + 1 : null, year: dateRef ? dateRef.getFullYear() : null,
    };
    
    records.push(record);
    if (!byTech[techRaw]) byTech[techRaw] = [];
    byTech[techRaw].push(record);
  }
  
  let periode = minDate ? `${minDate.getFullYear()}_${String(minDate.getMonth() + 1).padStart(2, '0')} Canal PowerBI` : `Canal_PowerBI_${Date.now()}`;
  
  return {
    type: 'canal', periode, records, byTech, totalRecords: records.length,
    totalMontantGset: records.reduce((s, r) => s + r.montantGset, 0),
    totalMontantTech: records.reduce((s, r) => s + r.montantTech, 0),
  };
}

function parseCanalGST(workbook) {
  const settings = getSettings();
  const prices = { ...DEFAULT_CANAL_PRICES, ...settings.canalPrices };
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
  
  const records = [];
  const byTech = {};
  let minDate = null;
  
  for (const row of rows) {
    const tech = row['Nom Technicien'] || row['nom technicien'] || '';
    const refPxo = row['Ref PXO'] || row['REF PXO'] || '';
    const facturation = row['FACTURATION'] || row['facturation'] || '';
    const totalFacture = parseFloat(row['total facture'] || row['Total Facture'] || 0);
    const agence = row['Agence'] || row['agence'] || '';
    const dateSolde = parseExcelDate(row['DATE SOLDE'] || row['Date Solde']);
    const dateValidation = parseExcelDate(row['DATE VALIDATION'] || row['Date Validation']);
    const dateRef = dateSolde || dateValidation;
    
    if (dateRef && (!minDate || dateRef < minDate)) minDate = dateRef;
    if (!tech) continue;
    
    const p = prices[facturation?.toUpperCase()];
    const montantTech = p ? p.tech : totalFacture;
    const montantGset = p ? p.gset : totalFacture;
    
    const record = {
      tech, techName: tech, refPxo: String(refPxo), facturation: (facturation || '').toUpperCase(),
      agence, montantGset, montantTech, dateSolde: formatDateISO(dateSolde),
      dateValidation: formatDateISO(dateValidation), date: formatDateISO(dateRef),
      week: dateRef ? getWeekNumber(dateRef) : null,
      month: dateRef ? dateRef.getMonth() + 1 : null, year: dateRef ? dateRef.getFullYear() : null,
    };
    
    records.push(record);
    if (!byTech[tech]) byTech[tech] = [];
    byTech[tech].push(record);
  }
  
  let periode = minDate ? `${minDate.getFullYear()}_${String(minDate.getMonth() + 1).padStart(2, '0')} Canal GST` : `Canal_GST_${Date.now()}`;
  
  return {
    type: 'canal', periode, records, byTech, totalRecords: records.length,
    totalMontantGset: records.reduce((s, r) => s + r.montantGset, 0),
    totalMontantTech: records.reduce((s, r) => s + r.montantTech, 0),
  };
}

export default function FileImport({ onImportComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const processFile = useCallback(async (file) => {
    setImporting(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const fileType = detectFileType(workbook);
      let parsed;
      
      switch (fileType) {
        case 'orange_rcc': parsed = parseOrangeRCC(workbook); break;
        case 'canal_powerbi': parsed = parseCanalPowerBI(workbook); break;
        case 'canal_gst': parsed = parseCanalGST(workbook); break;
        default: throw new Error('Format de fichier non reconnu');
      }
      
      if (parsed.error) throw new Error(parsed.error);
      
      const storageKey = parsed.type === 'orange' ? 'ftth_orange_data' : 'ftth_canal_data';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
      existing[parsed.periode] = parsed;
      localStorage.setItem(storageKey, JSON.stringify(existing));
      
      setResult({
        success: true, type: parsed.type, fileType, periode: parsed.periode,
        records: parsed.totalRecords, techs: Object.keys(parsed.byTech).length,
        montant: parsed.type === 'orange' ? parsed.totalMontant : parsed.totalMontantGset,
        datesFound: parsed.records.filter(r => r.date).length,
      });
      
      onImportComplete?.();
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  }, [onImportComplete]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".xlsx,.xls" onChange={handleFileInput} className="hidden" id="file-input" />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            {importing ? (
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                dragActive ? 'bg-emerald-500 text-white' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500'
              }`}>
                <UploadCloud className="w-10 h-10" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                {importing ? 'Import en cours...' : 'Glissez un fichier Excel'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ou cliquez pour sélectionner</p>
            </div>
          </div>
        </label>
      </div>

      {result && (
        <div className={`rounded-2xl p-5 ${result.success 
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' 
          : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'}`}>
          <div className="flex items-start gap-4">
            {result.success ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1">
              {result.success ? (
                <>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-400 text-lg">Import réussi !</p>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {result.fileType === 'orange_rcc' ? 'Orange RCC' : result.fileType === 'canal_powerbi' ? 'Canal+ PBI' : 'Canal+ GST'}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Interventions</p>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{result.records}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Techniciens</p>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{result.techs}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Montant</p>
                      <p className="font-semibold text-emerald-600">{result.montant?.toLocaleString('fr-FR')}€</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-800 dark:text-red-400">Erreur d'import</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{result.error}</p>
                </>
              )}
            </div>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { name: 'Orange RCC', desc: 'Récap + Détails', color: 'orange' },
          { name: 'Canal+ Power BI', desc: 'Codes GSE', color: 'purple' },
          { name: 'Canal+ GST', desc: 'Noms directs', color: 'purple' },
        ].map((format, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              format.color === 'orange' ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-purple-100 dark:bg-purple-500/20'
            }`}>
              <FileSpreadsheet className={`w-4 h-4 ${format.color === 'orange' ? 'text-orange-500' : 'text-purple-500'}`} />
            </div>
            <p className={`font-medium text-sm ${format.color === 'orange' ? 'text-orange-600' : 'text-purple-600'}`}>{format.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{format.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
