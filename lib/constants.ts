/**
 * @fileoverview Application-wide constants for the MFFA family finance app.
 * Includes configuration for locale, currency, date formats, and default values.
 * @module lib/constants
 */

// Application Constants

/**
 * Default user ID for single-family app (no auth)
 * This is a fixed UUID used when there's no authenticated user
 * Generated as a deterministic UUID for "moyle-family-default"
 */
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Locale configuration for formatting
 * Used for currency and date formatting throughout the app
 */
export const LOCALE = 'en-AU';
export const CURRENCY = 'AUD';

/**
 * Date format options for consistent formatting across the app
 */
export const DATE_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

export const DATE_FORMAT_LONG: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

export const DATE_FORMAT_MONTH_YEAR: Intl.DateTimeFormatOptions = {
  month: 'short',
  year: 'numeric',
};
