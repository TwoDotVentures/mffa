/**
 * @fileoverview Hook for sorting transactions by various columns.
 * Supports ascending/descending sort with toggle behavior.
 * @module hooks/use-transaction-sorting
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Transaction } from '@/lib/types';

/** Columns that can be used for sorting */
export type SortColumn = 'date' | 'description' | 'account' | 'category' | 'amount' | null;
export type SortDirection = 'asc' | 'desc';

export interface UseTransactionSortingReturn {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  handleSort: (column: SortColumn) => void;
  sortedTransactions: Transaction[];
}

/**
 * Hook for sorting transactions by column with direction toggle.
 * Clicking the same column toggles between ascending and descending.
 *
 * @param transactions - Array of transactions to sort
 * @param initialColumn - Initial sort column (default: 'date')
 * @param initialDirection - Initial sort direction (default: 'desc')
 * @returns Sort state and sorted transactions
 * @example
 * const { sortedTransactions, handleSort, sortColumn } =
 *   useTransactionSorting(transactions);
 */
export function useTransactionSorting(
  transactions: Transaction[],
  initialColumn: SortColumn = 'date',
  initialDirection: SortDirection = 'desc'
): UseTransactionSortingReturn {
  const [sortColumn, setSortColumn] = useState<SortColumn>(initialColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn]
  );

  const sortedTransactions = useMemo(() => {
    if (!sortColumn) return transactions;

    return [...transactions].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'account':
          comparison = (a.account?.name || '').localeCompare(b.account?.name || '');
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'amount':
          // Amounts are stored as positive, use transaction_type to determine sign
          const aAmount = a.transaction_type === 'expense' ? -a.amount : a.amount;
          const bAmount = b.transaction_type === 'expense' ? -b.amount : b.amount;
          comparison = aAmount - bAmount;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortColumn, sortDirection]);

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortedTransactions,
  };
}
