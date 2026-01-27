import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Uses clsx for conditional classes and tailwind-merge to properly merge conflicting classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a localized string
 */
export function formatDate(date: Date, locale = 'en'): string {
  const dateLocale = locale === 'ja' ? ja : enUS;
  return format(date, 'PPP', { locale: dateLocale });
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date, locale = 'en'): string {
  const dateLocale = locale === 'ja' ? ja : enUS;
  return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
}

/**
 * Truncate a string to a specified length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
