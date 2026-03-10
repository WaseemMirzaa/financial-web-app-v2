import { clsx } from 'clsx';

export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return clsx(inputs);
}

const localeForNumbers = (locale: string) => (locale === 'ar' ? 'ar-SA' : 'en-US');

export function formatCurrency(amount: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(localeForNumbers(locale), {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}

/** Format integers/decimals with locale-appropriate digits (e.g. Arabic ٠١٢٣ in ar) */
export function formatNumber(value: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(localeForNumbers(locale)).format(value);
}

/** Format a percentage with locale-appropriate digits */
export function formatPercent(value: number, locale: string = 'en'): string {
  const formatted = new Intl.NumberFormat(localeForNumbers(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted}%`;
}

export function formatDate(date: string | undefined | null, locale: string = 'en'): string {
  if (date == null || date === '') return '';
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

export function formatDateOnly(date: string, locale: string = 'en'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

/** Relative time for "last seen" (e.g. "Just now", "5m ago", "1h ago"). Returns empty string if null. */
export function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (lastSeenAt == null || lastSeenAt === '') return '';
  const d = new Date(lastSeenAt);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDateOnly(lastSeenAt);
}

/** Normalize a date (Date, string, or from DB) to YYYY-MM-DD. Returns null for invalid/missing. */
export function toDateOnlyString(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'string' && v.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = v instanceof Date ? v : new Date(v as string);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** For <input type="date"> value: always yyyy-MM-dd. Prefer passing-through ISO date strings to avoid timezone shifts. */
export function toDateInputValue(date: string | undefined | null): string {
  if (date == null || date === '') return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return date.trim().slice(0, 10);
  try {
    const only = toDateOnlyString(date as unknown);
    if (only) return only;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}

export function getLoanStatusColor(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'approved':
    case 'active':
      return 'success';
    case 'under_review':
      return 'info';
    case 'rejected':
      return 'error';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}
