/**
 * Validation utilities for Excel imports
 */

// Constants for validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ROWS_PER_SHEET = 10000;
export const MIN_ROWS_REQUIRED = 1;

/**
 * File type validation
 */
export function validateFileType(file) {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  const validExtensions = ['.xlsx', '.xls'];

  const isValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  if (!isValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Type de fichier invalide. Seuls les fichiers .xlsx et .xls sont acceptés.',
    };
  }

  return { valid: true };
}

/**
 * File size validation
 */
export function validateFileSize(file) {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. La taille maximale est de ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validate sheet data structure
 */
export function validateSheetData(sheetName, data, requiredColumns = []) {
  if (!data || !Array.isArray(data)) {
    return {
      valid: false,
      error: `La feuille "${sheetName}" ne contient pas de données valides.`,
    };
  }

  if (data.length === 0) {
    return {
      valid: false,
      error: `La feuille "${sheetName}" est vide.`,
    };
  }

  if (data.length > MAX_ROWS_PER_SHEET) {
    return {
      valid: false,
      error: `La feuille "${sheetName}" contient trop de lignes (${data.length}). Maximum: ${MAX_ROWS_PER_SHEET}.`,
    };
  }

  // Check for required columns
  if (requiredColumns.length > 0) {
    const columns = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(
      col => !columns.some(c => c.toLowerCase().includes(col.toLowerCase()))
    );

    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: `La feuille "${sheetName}" manque les colonnes requises: ${missingColumns.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate Orange intervention data
 */
export function validateOrangeIntervention(row) {
  const errors = [];

  if (!row.tech || row.tech.trim() === '') {
    errors.push('Technicien manquant');
  }

  if (!row.articles || row.articles.trim() === '') {
    errors.push('Articles manquants');
  }

  if (row.montant_st !== undefined && row.montant_st !== null && row.montant_st !== '') {
    const montant = parseFloat(row.montant_st);
    if (isNaN(montant) || montant < 0) {
      errors.push('Montant ST invalide');
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate Canal+ intervention data
 */
export function validateCanalIntervention(row) {
  const errors = [];

  if (!row.tech || row.tech.trim() === '') {
    errors.push('Technicien manquant');
  }

  if (!row.ref_pxo || row.ref_pxo.trim() === '') {
    errors.push('Référence PXO manquante');
  }

  if (row.montant_gset !== undefined && row.montant_gset !== null && row.montant_gset !== '') {
    const montant = parseFloat(row.montant_gset);
    if (isNaN(montant) || montant < 0) {
      errors.push('Montant GSET invalide');
    }
  }

  if (row.montant_tech !== undefined && row.montant_tech !== null && row.montant_tech !== '') {
    const montant = parseFloat(row.montant_tech);
    if (isNaN(montant) || montant < 0) {
      errors.push('Montant Tech invalide');
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate Daily tracking data
 */
export function validateDailyTracking(row) {
  const errors = [];

  if (!row.tech || row.tech.trim() === '') {
    errors.push('Technicien manquant');
  }

  if (!row.date || row.date.trim() === '') {
    errors.push('Date manquante');
  }

  if (row.date && !isValidDate(row.date)) {
    errors.push('Date invalide');
  }

  const otPlanifies = parseInt(row.otPlanifies);
  const otRealise = parseInt(row.otRealise);
  const otOK = parseInt(row.otOK);
  const otNOK = parseInt(row.otNOK);
  const otReportes = parseInt(row.otReportes);

  if (isNaN(otPlanifies) || otPlanifies < 0) {
    errors.push('OT Planifiés invalide');
  }

  if (isNaN(otRealise) || otRealise < 0) {
    errors.push('OT Réalisés invalide');
  }

  if (isNaN(otOK) || otOK < 0) {
    errors.push('OT OK invalide');
  }

  if (isNaN(otNOK) || otNOK < 0) {
    errors.push('OT NOK invalide');
  }

  if (isNaN(otReportes) || otReportes < 0) {
    errors.push('OT Reportés invalide');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate Rejet data
 */
export function validateRejet(row) {
  const errors = [];

  if (!row.prenom_technicien || row.prenom_technicien.trim() === '') {
    errors.push('Prénom technicien manquant');
  }

  if (row.date_rejet && !isValidDate(row.date_rejet)) {
    errors.push('Date rejet invalide');
  }

  if (row.semaine && !/^S?\d+$/i.test(row.semaine)) {
    errors.push('Semaine invalide (format attendu: S1, S2, S3, S4 ou 1, 2, 3, 4)');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Check if a date string is valid
 */
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;

  // Check for DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    return !isNaN(date.getTime());
  }

  // Check for ISO format or other valid date
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Complete file validation before import
 */
export async function validateImportFile(file, options = {}) {
  const { type, maxFileSize = MAX_FILE_SIZE } = options;

  // Validate file type
  const fileTypeValidation = validateFileType(file);
  if (!fileTypeValidation.valid) {
    return fileTypeValidation;
  }

  // Validate file size
  const fileSizeValidation = validateFileSize(file);
  if (!fileSizeValidation.valid) {
    return fileSizeValidation;
  }

  // Try to read and validate the workbook structure
  try {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        valid: false,
        error: 'Le fichier ne contient aucune feuille. Vérifiez le format du fichier.',
      };
    }

    // Optionally validate specific sheets based on import type
    if (type === 'orange' || type === 'canal') {
      // Validate structure for interventions
      const requiredColumns = type === 'orange'
        ? ['tech', 'articles', 'montant_st']
        : ['tech', 'ref_pxo', 'montant_gset', 'montant_tech'];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length > 0) {
          const sheetValidation = validateSheetData(sheetName, rows, requiredColumns);
          if (!sheetValidation.valid) {
            return sheetValidation;
          }
        }
      }
    }

    return { valid: true, workbook };
  } catch (error) {
    return {
      valid: false,
      error: `Erreur lors de la lecture du fichier: ${error.message}`,
    };
  }
}

/**
 * Validate and sanitize user input for search/filter
 */
export function validateSearchTerm(term) {
  if (typeof term !== 'string') {
    return { valid: false, error: 'Le terme de recherche doit être une chaîne de caractères' };
  }

  if (term.length > 200) {
    return { valid: false, error: 'Le terme de recherche est trop long (max 200 caractères)' };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page = 1, limit = 20) {
  const errors = [];

  if (!Number.isInteger(page) || page < 1) {
    errors.push('Le numéro de page doit être un entier positif');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    errors.push('La limite doit être un entier entre 1 et 500');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
