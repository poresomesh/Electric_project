/**
 * Utility functions for current dates, formatting, and dynamic reference dates
 */

export const getTodayDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateStr = (): string => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const formatReadableDate = (dateStr: string): string => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatMonthYear = (monthStr: string): string => {
  if (!monthStr) return '-';
  try {
    const [year, month] = monthStr.split('-').map(Number);
    if (!year || !month) return monthStr;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return monthStr;
  }
};

export const getPastNMonths = (count = 6, referenceDate = getTodayDateStr()): Array<{ monthStr: string; label: string; shortLabel: string }> => {
  const [refYear, refMonth] = referenceDate.split('-').map(Number);
  const result: Array<{ monthStr: string; label: string; shortLabel: string }> = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(refYear, refMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const monthStr = `${y}-${m}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g. "Sep 2026"
    const shortLabel = d.toLocaleDateString('en-US', { month: 'short' }) + ' ' + String(y).slice(2); // e.g. "Sep 26"
    result.push({ monthStr, label, shortLabel });
  }

  return result;
};
