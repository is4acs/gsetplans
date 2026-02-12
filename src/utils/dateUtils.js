/**
 * Standardized date handling utilities using date-fns
 */
import {
  format,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  getISOWeek,
  getMonth,
  getYear,
  parse as dateFnsParse,
} from 'date-fns';
import { fr } from 'date-fns/locale/fr.js';

/**
 * Default date format for the application
 */
export const DATE_FORMAT = 'dd/MM/yyyy';

/**
 * ISO date format for storage
 */
export const ISO_FORMAT = 'yyyy-MM-dd';

/**
 * Format a date to French locale string
 */
export function formatDateFr(date, formatStr = DATE_FORMAT) {
  if (!date) return '-';

  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';

  return format(d, formatStr, { locale: fr });
}

/**
 * Format a date for display in the UI
 */
export function formatDisplayDate(date) {
  return formatDateFr(date, 'dd MMM yyyy');
}

/**
 * Format a date for input fields
 */
export function formatInputDate(date) {
  return formatDateFr(date, DATE_FORMAT);
}

/**
 * Parse a date from various formats
 * Handles Excel dates, DD/MM/YYYY, ISO strings, etc.
 */
export function parseDate(dateValue) {
  if (!dateValue) return null;

  // Already a Date object
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : null;
  }

  // Excel date number (days since 1900-01-01)
  if (typeof dateValue === 'number') {
    const d = new Date((dateValue - 25569) * 86400 * 1000);
    return isValid(d) ? d : null;
  }

  // String value
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();

    // Try ISO format first
    const isoParsed = parseISO(trimmed);
    if (isValid(isoParsed)) return isoParsed;

    // Try DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const parsed = dateFnsParse(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 'yyyy-MM-dd');
      return isValid(parsed) ? parsed : null;
    }

    // Try parsing as a general date
    const parsed = dateFnsParse(trimmed, ISO_FORMAT);
    return isValid(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Parse an Excel date value to a JavaScript Date
 * @deprecated Use parseDate instead
 */
export function parseExcelDate(value) {
  return parseDate(value);
}

/**
 * Get the ISO week number for a date
 */
export function getWeekNumber(date) {
  const d = parseDate(date);
  if (!d) return null;
  return getISOWeek(d);
}

/**
 * Get the week number within a month (1-4)
 */
export function getWeekOfMonth(date) {
  const d = parseDate(date);
  if (!d) return null;

  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

/**
 * Get the month (1-12)
 */
export function getMonthNumber(date) {
  const d = parseDate(date);
  if (!d) return null;
  return getMonth(d) + 1;
}

/**
 * Get the year
 */
export function getYearNumber(date) {
  const d = parseDate(date);
  if (!d) return null;
  return getYear(d);
}

/**
 * Format a date to ISO string (YYYY-MM-DD)
 */
export function toISOString(date) {
  const d = parseDate(date);
  if (!d) return null;
  return format(d, ISO_FORMAT);
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const d = parseDate(date);
  if (!d) return false;
  const today = startOfDay(new Date());
  return format(d, ISO_FORMAT) === format(today, ISO_FORMAT);
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date) {
  const d = parseDate(date);
  if (!d) return false;
  const yesterday = addDays(startOfDay(new Date()), -1);
  return format(d, ISO_FORMAT) === format(yesterday, ISO_FORMAT);
}

/**
 * Get start of day (midnight)
 */
export function getStartOfDay(date) {
  const d = parseDate(date);
  return d ? startOfDay(d) : null;
}

/**
 * Get end of day (23:59:59.999)
 */
export function getEndOfDay(date) {
  const d = parseDate(date);
  return d ? endOfDay(d) : null;
}

/**
 * Get start of month
 */
export function getStartOfMonth(year, month) {
  const date = dateFnsParse(`${year}-${month.toString().padStart(2, '0')}-01`, 'yyyy-MM-dd');
  return isValid(date) ? startOfMonth(date) : null;
}

/**
 * Get end of month
 */
export function getEndOfMonth(year, month) {
  const date = dateFnsParse(`${year}-${month.toString().padStart(2, '0')}-01`, 'yyyy-MM-dd');
  return isValid(date) ? endOfMonth(date) : null;
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date) {
  const d = parseDate(date);
  return d ? startOfWeek(d, { weekStartsOn: 1 }) : null;
}

/**
 * Get end of week (Sunday)
 */
export function getEndOfWeek(date) {
  const d = parseDate(date);
  return d ? endOfWeek(d, { weekStartsOn: 1 }) : null;
}

/**
 * Add days to a date
 */
export function addDaysToDate(date, days) {
  const d = parseDate(date);
  return d ? addDays(d, days) : null;
}

/**
 * Add weeks to a date
 */
export function addWeeksToDate(date, weeks) {
  const d = parseDate(date);
  return d ? addWeeks(d, weeks) : null;
}

/**
 * Add months to a date
 */
export function addMonthsToDate(date, months) {
  const d = parseDate(date);
  return d ? addMonths(d, months) : null;
}

/**
 * Add years to a date
 */
export function addYearsToDate(date, years) {
  const d = parseDate(date);
  return d ? addYears(d, years) : null;
}

/**
 * Get difference in days between two dates
 */
export function diffDays(dateLeft, dateRight) {
  const d1 = parseDate(dateLeft);
  const d2 = parseDate(dateRight);
  if (!d1 || !d2) return null;
  return differenceInDays(d1, d2);
}

/**
 * Get difference in weeks between two dates
 */
export function diffWeeks(dateLeft, dateRight) {
  const d1 = parseDate(dateLeft);
  const d2 = parseDate(dateRight);
  if (!d1 || !d2) return null;
  return differenceInWeeks(d1, d2);
}

/**
 * Get difference in months between two dates
 */
export function diffMonths(dateLeft, dateRight) {
  const d1 = parseDate(dateLeft);
  const d2 = parseDate(dateRight);
  if (!d1 || !d2) return null;
  return differenceInMonths(d1, d2);
}

/**
 * Get difference in years between two dates
 */
export function diffYears(dateLeft, dateRight) {
  const d1 = parseDate(dateLeft);
  const d2 = parseDate(dateRight);
  if (!d1 || !d2) return null;
  return differenceInYears(d1, d2);
}

/**
 * Format a period label for display
 */
export function formatPeriod(year, month, week = null) {
  const MONTHS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthLabel = MONTHS[month] || '';
  const weekLabel = week ? ` - S${week}` : '';
  return `${monthLabel} ${year}${weekLabel}`;
}

/**
 * Format a relative date string (e.g., "il y a 2 jours")
 */
export function formatRelativeDate(date) {
  const d = parseDate(date);
  if (!d) return '-';

  const now = new Date();
  const days = differenceInDays(now, d);

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine(s)`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an(s)`;
}

/**
 * Generate an array of dates for a range
 */
export function generateDateRange(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return [];

  const dates = [];
  let current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  return dates;
}

/**
 * Get the first and last day of the current week
 */
export function getCurrentWeekRange() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return {
    start: toISOString(start),
    end: toISOString(end),
  };
}

/**
 * Get the first and last day of the current month
 */
export function getCurrentMonthRange() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return {
    start: toISOString(start),
    end: toISOString(end),
  };
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(date, startDate, endDate) {
  const d = parseDate(date);
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!d || !start || !end) return false;
  return d >= start && d <= end;
}

/**
 * Get a descriptive period name
 */
export function getPeriodName(year, month, week = null) {
  const MONTHS_SHORT = ['', 'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const monthLabel = MONTHS_SHORT[month] || '';
  const weekLabel = week ? ` S${week}` : '';
  return `${monthLabel}${year} ${weekLabel}`;
}
