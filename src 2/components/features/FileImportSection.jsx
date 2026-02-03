import { useState } from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTheme } from '../../contexts';
import { themes } from '../../utils/theme';
import { MONTHS, YEARS } from '../../utils/constants';
import { parseExcelDate, getWeekNumber, getColValue, extractCodes } from '../../utils/helpers';
import { insertOrangeInterventions, insertCanalInterventions, createImport } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';

function FileImportSection({ orangePrices, canalPrices, onImportComplete }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [selectedFile, setSelectedFile] = useState(null);
  const [importType, setImportType] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      let sheetName = workbook.SheetNames[0];
      let sheet = workbook.Sheets[sheetName];

      if (workbook.SheetNames.length > 1) {
        const detailsSheet = workbook.SheetNames.find(name =>
          name.toLowerCase().includes('détail') || name.toLowerCase().includes('detail')
        );
        if (detailsSheet) {
          sheetName = detailsSheet;
          sheet = workbook.Sheets[sheetName];
        } else {
          for (const name of workbook.SheetNames) {
            const testSheet = workbook.Sheets[name];
            const testJson = XLSX.utils.sheet_to_json(testSheet, { header: 1 });
            const testHeaders = testJson[0]?.map(h => String(h).toLowerCase().trim()) || [];
            if (testHeaders.some(h => h === 'nd' || h === 'tech' || h.includes('article'))) {
              sheetName = name;
              sheet = testSheet;
              break;
            }
          }
        }
      }

      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headers = json[0]?.map(h => String(h).toLowerCase().trim()) || [];

      const isOrange = headers.some(h => h === 'nd' || h.includes('article') || h.includes('montant st'));
      const isCanal = headers.some(h => h.includes('ref pxo') || h === 'facturation' || h.includes('date solde') || h === 'gse');

      if (isOrange && !isCanal) setImportType('orange');
      else if (isCanal) setImportType('canal');
      else setImportType('');

      setPreview({ headers: json[0], rows: json.slice(1, 6), total: json.length - 1 });
    } catch (err) {
      setError('Erreur lecture fichier: ' + err.message);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importType) return;
    setImporting(true);
    setError('');

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);

      let sheetName = workbook.SheetNames[0];
      let sheet = workbook.Sheets[sheetName];

      if (workbook.SheetNames.length > 1) {
        const detailsSheet = workbook.SheetNames.find(name =>
          name.toLowerCase().includes('détail') || name.toLowerCase().includes('detail')
        );
        if (detailsSheet) {
          sheetName = detailsSheet;
          sheet = workbook.Sheets[sheetName];
        } else {
          for (const name of workbook.SheetNames) {
            const testSheet = workbook.Sheets[name];
            const testJson = XLSX.utils.sheet_to_json(testSheet, { header: 1 });
            const testHeaders = testJson[0]?.map(h => String(h).toLowerCase().trim()) || [];
            if (testHeaders.some(h => h === 'nd' || h === 'tech' || h.includes('article'))) {
              sheetName = name;
              sheet = testSheet;
              break;
            }
          }
        }
      }

      const json = XLSX.utils.sheet_to_json(sheet);
      const monthName = MONTHS.find(m => m.value === selectedMonth)?.label.toUpperCase() || '';
      const typeLabel = importType === 'orange' ? 'ORANGE' : 'CANAL+';
      const periode = `${monthName} ${selectedYear}/${typeLabel}`;

      if (importType === 'orange') {
        const interventions = json.map(row => {
          const date = parseExcelDate(getColValue(row, 'Date Cloture', 'date_cloture', 'Date'));
          return {
            periode,
            nd: getColValue(row, 'ND', 'nd') || '',
            tech: getColValue(row, 'Technicien', 'tech', 'TECH') || '',
            articles: getColValue(row, 'Articles', 'articles', 'Code') || '',
            montant_st: parseFloat(getColValue(row, 'Montant ST', 'montant_st', 'Montant') || 0),
            intervention_date: date ? date.toISOString().split('T')[0] : null,
            week_number: date ? getWeekNumber(date) : null,
            month: selectedMonth,
            year: selectedYear
          };
        }).filter(i => i.tech && i.montant_st > 0);

        await insertOrangeInterventions(interventions);
        await createImport({
          type: 'orange',
          periode,
          filename: selectedFile.name,
          total_records: interventions.length,
          total_montant: interventions.reduce((s, i) => s + i.montant_st, 0)
        });
      } else {
        const interventions = json.map(row => {
          const date = parseExcelDate(getColValue(row, 'DATE SOLDE', 'Date Realisation', 'date_realisation', 'Date', 'DATE_SOLDE'));
          const mainCodeRaw = getColValue(row, 'FACTURATION', 'Facturation', 'facturation', 'Code');
          const mainCode = mainCodeRaw ? String(mainCodeRaw).toUpperCase().trim() : '';
          const travauxSuppRaw = getColValue(row, 'TRAVAUX SUPPLEMENTAIRES', 'Travaux supplémentaires', 'travaux_supplementaires', 'Travaux Supplementaires', 'TRAVAUX_SUPPLEMENTAIRES');
          const suppCodes = extractCodes(travauxSuppRaw);

          const mainPrice = mainCode ? canalPrices.find(p => p.code === mainCode) : null;
          let totalGset = mainPrice?.gset_price || 0;
          let totalTech = mainPrice?.tech_price || 0;

          suppCodes.forEach(code => {
            const p = canalPrices.find(pr => pr.code === code);
            if (p) {
              totalGset += p.gset_price;
              totalTech += p.tech_price;
            }
          });

          const allCodes = mainCode ? (suppCodes.length ? `${mainCode} + ${suppCodes.join(' + ')}` : mainCode) : suppCodes.join(' + ');
          const techRaw = getColValue(row, 'TECHNICIEN', 'GSE', 'gse', 'Tech');
          const tech = techRaw ? String(techRaw).trim() : '';

          return {
            periode,
            tech,
            tech_name: getColValue(row, 'Nom Technicien', 'nom_technicien') || '',
            ref_pxo: String(getColValue(row, 'Ref PXO', 'ref_pxo', 'Ref_PXO', 'REF PXO') || ''),
            facturation: allCodes,
            agence: getColValue(row, 'Agence', 'agence') || '',
            montant_gset: totalGset,
            montant_tech: totalTech,
            intervention_date: date ? date.toISOString().split('T')[0] : null,
            week_number: date ? getWeekNumber(date) : null,
            month: selectedMonth,
            year: selectedYear
          };
        }).filter(i => i.tech && (i.montant_gset > 0 || i.facturation));

        await insertCanalInterventions(interventions);
        await createImport({
          type: 'canal',
          periode,
          filename: selectedFile.name,
          total_records: interventions.length,
          total_montant: interventions.reduce((s, i) => s + i.montant_gset, 0)
        });
      }

      setSelectedFile(null);
      setPreview(null);
      setImportType('');
      onImportComplete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed ${t.border} rounded-xl p-8 text-center`}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className={`w-12 h-12 ${t.textMuted} mx-auto mb-4`} />
          <p className={`font-medium ${t.text}`}>Glissez un fichier ou cliquez</p>
          <p className={`text-sm ${t.textMuted}`}>Excel ou CSV</p>
        </label>
      </div>

      {preview && (
        <div className={`rounded-xl border ${t.border} p-4 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className={`font-medium ${t.text}`}>{selectedFile?.name}</p>
              <p className={`text-sm ${t.textMuted}`}>{preview.total} lignes</p>
            </div>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className={`px-3 py-2 rounded-xl border ${t.input} w-full sm:w-auto`}
            >
              <option value="">Type...</option>
              <option value="orange">Orange</option>
              <option value="canal">Canal+</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${t.textSecondary} mb-1.5`}>Période</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${t.textSecondary} mb-1.5`}>Année</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border ${t.input}`}
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleImport}
            disabled={!importType || importing}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? <LoadingSpinner size="sm" /> : <Upload className="w-5 h-5" />}
            Importer
          </button>
        </div>
      )}
    </div>
  );
}

export default FileImportSection;
