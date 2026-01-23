'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getPaginatedTransactions } from '@/lib/transactions/actions';
import type { Transaction, PaginatedTransactionOptions } from '@/lib/types';

/**
 * Options for configuring the infinite transactions hook
 */
export interface UseInfiniteTransactionsOptions {
  /** Initial transactions to display (from server-side render) */
  initialData?: Transaction[];
  /** Initial total count (from server-side render) */
  initialTotalCount?: number;
  /** Number of items per page (default: 100) */
  pageSize?: number;
  /** Initial filter options */
  initialFilters?: Omit<PaginatedTransactionOptions, 'page' | 'limit'>;
}

/**
 * Return type for the useInfiniteTransactions hook
 */
export interface UseInfiniteTransactionsReturn {
  /** All loaded transactions */
  transactions: Transaction[];
  /** Whether there are more transactions to load */
  hasMore: boolean;
  /** Whether currently loading more transactions */
  isLoading: boolean;
  /** Whether initial data is being loaded */
  isInitialLoading: boolean;
  /** Total count of transactions matching current filters */
  totalCount: number;
  /** Current page number */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Load next page of transactions */
  loadMore: () => Promise<void>;
  /** Refresh all data with current filters */
  refresh: () => Promise<void>;
  /** Update filters and reset to page 1 */
  setFilters: (filters: Omit<PaginatedTransactionOptions, 'page' | 'limit'>) => void;
  /** Current active filters */
  filters: Omit<PaginatedTransactionOptions, 'page' | 'limit'>;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook for managing infinite scroll pagination of transactions.
 *
 * This hook handles:
 * - Loading transactions in batches (default 100 per page)
 * - Tracking pagination state (page, hasMore, totalCount)
 * - Filter changes (resets to page 1)
 * - Loading states (initial load vs. load more)
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   hasMore,
 *   isLoading,
 *   loadMore,
 *   setFilters,
 * } = useInfiniteTransactions({
 *   initialData: serverTransactions,
 *   initialTotalCount: 500,
 *   pageSize: 100,
 * });
 *
 * // Load more when scrolling near bottom
 * useEffect(() => {
 *   if (nearBottom && hasMore && !isLoading) {
 *     loadMore();
 *   }
 * }, [nearBottom, hasMore, isLoading, loadMore]);
 * ```
 */
export function useInfiniteTransactions(
  options: UseInfiniteTransactionsOptions = {}
): UseInfiniteTransactionsReturn {
  const {
    initialData = [],
    initialTotalCount = 0,
    pageSize = 100,
    initialFilters = {},
  } = options;

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(
    initialTotalCount > 0 ? Math.ceil(initialTotalCount / pageSize) : 1
  );
  const [hasMore, setHasMore] = useState(initialTotalCount > initialData.length);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(initialData.length === 0);
  const [filters, setFiltersState] = useState<Omit<PaginatedTransactionOptions, 'page' | 'limit'>>(
    initialFilters
  );
  const [error, setError] = useState<string | null>(null);

  // Ref to track if we're already loading (prevents duplicate requests)
  const loadingRef = useRef(false);

  /**
   * Load more transactions (next page)
   */
  const loadMore = useCallback(async () => {
    // Prevent duplicate requests
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await getPaginatedTransactions({
        ...filters,
        page: page + 1,
        limit: pageSize,
      });

      setTransactions((prev) => [...prev, ...result.data]);
      setPage(result.page);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error loading more transactions:', err);
      setError('Failed to load more transactions');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [filters, page, pageSize, hasMore]);

  /**
   * Refresh all data with current filters (resets to page 1)
   */
  const refresh = useCallback(async () => {
    loadingRef.current = true;
    setIsLoading(true);
    setIsInitialLoading(true);
    setError(null);

    try {
      const result = await getPaginatedTransactions({
        ...filters,
        page: 1,
        limit: pageSize,
      });

      setTransactions(result.data);
      setPage(1);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
      setError('Failed to refresh transactions');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
      loadingRef.current = false;
    }
  }, [filters, pageSize]);

  /**
   * Update filters and reset to page 1
   */
  const setFilters = useCallback(
    (newFilters: Omit<PaginatedTransactionOptions, 'page' | 'limit'>) => {
      // Only update if filters actually changed
      const filtersChanged = JSON.stringify(newFilters) !== JSON.stringify(filters);
      if (!filtersChanged) return;

      setFiltersState(newFilters);
      setPage(1);
      setTransactions([]);
      setHasMore(true);
    },
    [filters]
  );

  // Load initial data if not provided
  useEffect(() => {
    if (initialData.length === 0) {
      refresh();
    }
  }, []); // Only run on mount

  // Refetch when filters change (after initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refresh();
  }, [filters]); // Don't include refresh in deps to avoid loop

  return {
    transactions,
    hasMore,
    isLoading,
    isInitialLoading,
    totalCount,
    page,
    totalPages,
    loadMore,
    refresh,
    setFilters,
    filters,
    error,
  };
}

/**
 * Helper hook to detect when user has scrolled near the bottom
 * @param threshold - Pixels from bottom to trigger (default: 200)
 * @returns Whether the scroll position is near the bottom
 */
export function useScrollNearBottom(
  scrollRef: React.RefObject<HTMLElement>,
  threshold: number = 200
): boolean {
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsNearBottom(distanceFromBottom < threshold);
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollRef, threshold]);

  return isNearBottom;
}
