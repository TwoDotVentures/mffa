/**
 * @fileoverview Hook for managing transaction selection state.
 * Provides select all, toggle, and clear operations for bulk actions.
 * @module hooks/use-transaction-selection
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Transaction } from '@/lib/types';

/** Return type for the useTransactionSelection hook */
export interface UseTransactionSelectionReturn {
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  selectionCount: number;

  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  removeFromSelection: (id: string) => void;
  setSelectedIds: (ids: Set<string>) => void;
}

/**
 * Hook for managing selection state for transactions.
 * Tracks selected transaction IDs and provides bulk selection operations.
 *
 * @param filteredTransactions - Currently visible/filtered transactions
 * @returns Selection state and control functions
 * @example
 * const { selectedIds, toggleSelect, toggleSelectAll } =
 *   useTransactionSelection(filteredTransactions);
 */
export function useTransactionSelection(
  filteredTransactions: Transaction[]
): UseTransactionSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = useMemo(
    () => filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length,
    [filteredTransactions.length, selectedIds.size]
  );

  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < filteredTransactions.length,
    [selectedIds.size, filteredTransactions.length]
  );

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  }, [allSelected, filteredTransactions]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      newSelected.delete(id);
      return newSelected;
    });
  }, []);

  return {
    selectedIds,
    allSelected,
    someSelected,
    selectionCount: selectedIds.size,

    toggleSelectAll,
    toggleSelect,
    clearSelection,
    removeFromSelection,
    setSelectedIds,
  };
}
