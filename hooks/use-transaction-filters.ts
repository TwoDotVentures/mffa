/**
 * @fileoverview Hook for managing transaction filters including date ranges,
 * accounts, categories, and search. Provides Australian financial year support.
 * @module hooks/use-transaction-filters
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Transaction } from '@/lib/types';

/** Available date range presets for filtering transactions */
export type DateRangePreset =
  | 'all'
  | 'this-fy'
  | 'last-fy'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-month'
  | 'last-month'
  | 'last-30-days'
  | 'last-90-days'
  | 'this-year'
  | 'last-year'
  | 'custom';

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  all: 'All Time',
  'this-fy': 'This Financial Year',
  'last-fy': 'Last Financial Year',
  'this-quarter': 'This Quarter',
  'last-quarter': 'Last Quarter',
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'last-30-days': 'Last 30 Days',
  'last-90-days': 'Last 90 Days',
  'this-year': 'This Calendar Year',
  'last-year': 'Last Calendar Year',
  custom: 'Custom Range',
};

// Australian Financial Year: July 1 - June 30
function getFinancialYearDates(offset: number = 0): { from: string; to: string } {
  const now = new Date();
  let fyStartYear = now.getFullYear();

  // If before July, we're in the FY that started last year
  if (now.getMonth() < 6) {
    fyStartYear -= 1;
  }

  // Apply offset (0 = current FY, -1 = last FY)
  fyStartYear += offset;

  const from = new Date(fyStartYear, 6, 1); // July 1
  const to = new Date(fyStartYear + 1, 5, 30); // June 30 next year

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function getQuarterDates(offset: number = 0): { from: string; to: string } {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const targetQuarter = currentQuarter + offset;

  let year = now.getFullYear();
  let quarter = targetQuarter;

  // Handle year wrapping
  while (quarter < 0) {
    quarter += 4;
    year -= 1;
  }
  while (quarter > 3) {
    quarter -= 4;
    year += 1;
  }

  const from = new Date(year, quarter * 3, 1);
  const to = new Date(year, quarter * 3 + 3, 0); // Last day of quarter

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function getMonthDates(offset: number = 0): { from: string; to: string } {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  const from = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const to = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function getLastNDays(days: number): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);

  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

function getCalendarYearDates(offset: number = 0): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear() + offset;

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

export function getDateRangeForPreset(preset: DateRangePreset): {
  from: string | null;
  to: string | null;
} {
  switch (preset) {
    case 'all':
      return { from: null, to: null };
    case 'this-fy':
      return getFinancialYearDates(0);
    case 'last-fy':
      return getFinancialYearDates(-1);
    case 'this-quarter':
      return getQuarterDates(0);
    case 'last-quarter':
      return getQuarterDates(-1);
    case 'this-month':
      return getMonthDates(0);
    case 'last-month':
      return getMonthDates(-1);
    case 'last-30-days':
      return getLastNDays(30);
    case 'last-90-days':
      return getLastNDays(90);
    case 'this-year':
      return getCalendarYearDates(0);
    case 'last-year':
      return getCalendarYearDates(-1);
    case 'custom':
      return { from: null, to: null };
    default:
      return { from: null, to: null };
  }
}

export function formatDateRange(from: string | null, to: string | null): string {
  if (!from && !to) return 'All Time';

  const formatShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (from && to) {
    return `${formatShort(from)} - ${formatShort(to)}`;
  }
  if (from) return `From ${formatShort(from)}`;
  if (to) return `Until ${formatShort(to)}`;
  return 'All Time';
}

export interface TransactionFilterState {
  accountFilter: string;
  categoryFilter: string;
  categoryFilterSearch: string;
  categoryFilterOpen: boolean;
  searchTerm: string;
  dateRangePreset: DateRangePreset;
  customDateFrom: string;
  customDateTo: string;
  datePickerOpen: boolean;
}

export interface UseTransactionFiltersReturn {
  // Filter state
  filters: TransactionFilterState;
  effectiveDateRange: { from: string | null; to: string | null };
  hasActiveFilters: boolean;

  // Filter setters
  setAccountFilter: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setCategoryFilterSearch: (value: string) => void;
  setCategoryFilterOpen: (value: boolean) => void;
  setSearchTerm: (value: string) => void;
  setDateRangePreset: (value: DateRangePreset) => void;
  setCustomDateFrom: (value: string) => void;
  setCustomDateTo: (value: string) => void;
  setDatePickerOpen: (value: boolean) => void;

  // Actions
  clearFilters: () => void;
  handlePresetChange: (preset: DateRangePreset) => void;

  // Filtered transactions
  filteredTransactions: Transaction[];
}

/**
 * Hook for filtering transactions by date range, account, category, and search term.
 * Defaults to the current Australian financial year.
 *
 * @param transactions - Array of transactions to filter
 * @returns Filter state, setters, and filtered transactions
 * @example
 * const { filteredTransactions, setAccountFilter, hasActiveFilters } =
 *   useTransactionFilters(transactions);
 */
export function useTransactionFilters(transactions: Transaction[]): UseTransactionFiltersReturn {
  // Filter state
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Date range state - default to current financial year
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this-fy');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Calculate effective date range
  const effectiveDateRange = useMemo(
    () =>
      dateRangePreset === 'custom'
        ? { from: customDateFrom || null, to: customDateTo || null }
        : getDateRangeForPreset(dateRangePreset),
    [dateRangePreset, customDateFrom, customDateTo]
  );

  const hasActiveFilters = useMemo(
    () =>
      accountFilter !== 'all' ||
      categoryFilter !== 'all' ||
      searchTerm !== '' ||
      dateRangePreset !== 'this-fy',
    [accountFilter, categoryFilter, searchTerm, dateRangePreset]
  );

  // Clear filters callback
  const clearFilters = useCallback(() => {
    setAccountFilter('all');
    setCategoryFilter('all');
    setCategoryFilterSearch('');
    setSearchTerm('');
    setDateRangePreset('this-fy');
    setCustomDateFrom('');
    setCustomDateTo('');
  }, []);

  // Handle preset change
  const handlePresetChange = useCallback((preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== 'custom') {
      setDatePickerOpen(false);
    }
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Date range filter
      if (effectiveDateRange.from && t.date < effectiveDateRange.from) {
        return false;
      }
      if (effectiveDateRange.to && t.date > effectiveDateRange.to) {
        return false;
      }
      // Account filter
      if (accountFilter !== 'all' && t.account_id !== accountFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'none') {
          // Filter for transactions without a category
          if (t.category_id) {
            return false;
          }
        } else if (t.category_id !== categoryFilter) {
          return false;
        }
      }
      // Search filter (searches description, payee, category, account name)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesDescription = t.description?.toLowerCase().includes(search);
        const matchesPayee = t.payee?.toLowerCase().includes(search);
        const matchesCategory = t.category?.name?.toLowerCase().includes(search);
        const matchesAccount = t.account?.name?.toLowerCase().includes(search);
        const matchesAmount = t.amount.toString().includes(search);
        if (
          !matchesDescription &&
          !matchesPayee &&
          !matchesCategory &&
          !matchesAccount &&
          !matchesAmount
        ) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, effectiveDateRange, accountFilter, categoryFilter, searchTerm]);

  return {
    filters: {
      accountFilter,
      categoryFilter,
      categoryFilterSearch,
      categoryFilterOpen,
      searchTerm,
      dateRangePreset,
      customDateFrom,
      customDateTo,
      datePickerOpen,
    },
    effectiveDateRange,
    hasActiveFilters,

    setAccountFilter,
    setCategoryFilter,
    setCategoryFilterSearch,
    setCategoryFilterOpen,
    setSearchTerm,
    setDateRangePreset,
    setCustomDateFrom,
    setCustomDateTo,
    setDatePickerOpen,

    clearFilters,
    handlePresetChange,

    filteredTransactions,
  };
}
