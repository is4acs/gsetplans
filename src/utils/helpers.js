// === HELPER FUNCTIONS ===

/**
 * Parse an Excel date value to a JavaScript Date object
 */
export function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/**
 * Get the ISO week number for a date
 */
export function getWeekNumber(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Format a date string to French locale
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format a number as currency (EUR)
 */
export function formatCurrency(amount, showDecimals = true) {
  if (amount === null || amount === undefined) return '0€';
  const options = showDecimals
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { maximumFractionDigits: 0 };
  return `${amount.toLocaleString('fr-FR', options)}€`;
}

/**
 * Format amount with visibility toggle
 */
export function formatAmountWithVisibility(amount, showAmounts, showDecimals = true) {
  if (!showAmounts) return '••••€';
  return formatCurrency(amount, showDecimals);
}

/**
 * Get column value from a row with multiple possible column names
 */
export function getColValue(row, ...names) {
  for (const name of names) {
    const keys = Object.keys(row);
    const key = keys.find(k => 
      k.toLowerCase().trim() === name.toLowerCase().trim() || 
      k.toLowerCase().includes(name.toLowerCase())
    );
    if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return '';
}

/**
 * Extract codes from a string (for Canal+ travaux supplémentaires)
 */
export function extractCodes(str) {
  if (!str) return [];
  return String(str).match(/[A-Z]{2,}[A-Z0-9]*/gi)?.map(m => m.toUpperCase()) || [];
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Moyen', color: 'bg-yellow-500' };
  return { score, label: 'Fort', color: 'bg-emerald-500' };
}

/**
 * Check if an error is an abort error (should be ignored)
 */
export function isAbortError(err) {
  if (!err) return false;
  const msg = err.message || err.toString();
  return msg.includes('abort') || 
         msg.includes('AbortError') || 
         msg.includes('signal') || 
         err.name === 'AbortError';
}
