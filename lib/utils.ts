/**
 * @fileoverview Utility functions for formatting and styling.
 * Provides currency, date, and percentage formatting for Australian locale.
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LOCALE, CURRENCY, DATE_FORMAT_SHORT } from './constants'

/**
 * Combines class names with Tailwind CSS merge support
 * @param inputs - Class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Australian currency
 * @param amount - The amount to format
 * @param options - Optional Intl.NumberFormatOptions overrides
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number,
  options?: Partial<Intl.NumberFormatOptions>
): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    ...options,
  }).format(amount)
}

/**
 * Formats a number as Australian currency without decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,235")
 */
export function formatCurrencyCompact(amount: number): string {
  return formatCurrency(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Formats a date string or Date object
 * @param date - The date to format (string or Date)
 * @param options - Optional Intl.DateTimeFormatOptions (defaults to short format)
 * @returns Formatted date string (e.g., "15 Jan 2024")
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = DATE_FORMAT_SHORT
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(LOCALE, options)
}

/**
 * Formats a date as relative time (e.g., "2 hours ago", "Yesterday")
 * @param date - The date to format (string or Date)
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return 'Never'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins === 1) return '1 min ago'
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

/**
 * Formats a number as a percentage
 * @param value - The value to format (0-100 or 0-1)
 * @param isDecimal - If true, treats value as decimal (0-1), otherwise as percentage (0-100)
 * @returns Formatted percentage string (e.g., "75%")
 */
export function formatPercentage(value: number, isDecimal = false): string {
  const percentage = isDecimal ? value * 100 : value
  return `${percentage.toFixed(0)}%`
}
