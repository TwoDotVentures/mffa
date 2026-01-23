/**
 * TransactionsList Component
 *
 * Comprehensive transaction list with mobile-first responsive design.
 * Features card view on mobile, table view on desktop, with full
 * filtering, bulk editing, and inline category management.
 *
 * @mobile Card-based layout with swipe-friendly interactions
 * @desktop Full table view with sorting and bulk actions
 * @touch Minimum 44px touch targets for all interactive elements
 */
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Wand2,
  Search,
  X,
  Download,
  Tag,
  User,
  Calendar,
  FileText,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronUp,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { TransactionDialog } from './transaction-dialog';
import { CreateRuleDialog } from './create-rule-dialog';
import { TopCategoriesChart } from './top-categories-chart';
import { TopPayeesChart } from './top-payees-chart';
import {
  deleteTransaction,
  deleteTransactions,
  updateTransactionsPayee,
  updateTransactionsCategory,
  updateTransactionCategory,
  updateTransactionsDescription,
  createCategory,
  getChartSummaryData,
} from '@/lib/transactions/actions';
import { toast } from 'sonner';
import type { Transaction, Account, Category, PaginatedTransactionOptions } from '@/lib/types';
import type { ChartSummaryData } from '@/lib/transactions/actions';
import { useInfiniteTransactions } from '@/hooks/use-infinite-transactions';
import { CategoryPopover, useCategoryPopover } from './category-popover';

/** Props for the TransactionsList component */
interface TransactionsListProps {
  /** Initial transactions from server (first page) */
  initialTransactions?: Transaction[];
  /** Total count of transactions matching filters */
  initialTotalCount?: number;
  /** Whether there are more pages to load */
  initialHasMore?: boolean;
  /** Chart summary data from full dataset */
  initialChartSummary?: ChartSummaryData;
  /** @deprecated Use initialTransactions instead */
  transactions?: Transaction[];
  accounts: Account[];
  categories: Category[];
}

/**
 * Formats a number as Australian currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Formats a date string for display
 * @param dateStr - ISO date string
 * @returns Formatted date (e.g., "15 Jan 2024")
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a date string for compact mobile display
 * @param dateStr - ISO date string
 * @returns Compact formatted date (e.g., "15 Jan")
 */
function formatDateCompact(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
}

/** Icon mapping for transaction types */
const typeIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowRightLeft,
};

/** Color classes for transaction types */
const typeColors = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
};

/** Background colors for transaction type badges */
const typeBgColors = {
  income: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  expense: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  transfer: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
};

// Sorting types
type SortColumn = 'date' | 'description' | 'account' | 'category' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

// Date range presets for Australian Financial Year
type DateRangePreset =
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

/** Human-readable labels for date range presets */
const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  'all': 'All Time',
  'this-fy': 'This FY',
  'last-fy': 'Last FY',
  'this-quarter': 'This Quarter',
  'last-quarter': 'Last Quarter',
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'last-30-days': 'Last 30 Days',
  'last-90-days': 'Last 90 Days',
  'this-year': 'This Year',
  'last-year': 'Last Year',
  'custom': 'Custom',
};

/**
 * Gets financial year dates (Australian: July 1 - June 30)
 * @param offset - Year offset (0 = current, -1 = last year)
 */
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

/**
 * Gets calendar quarter dates
 * @param offset - Quarter offset (0 = current, -1 = last quarter)
 */
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

/**
 * Gets calendar month dates
 * @param offset - Month offset (0 = current, -1 = last month)
 */
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

/**
 * Gets date range for last N days
 * @param days - Number of days to look back
 */
function getLastNDays(days: number): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);

  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

/**
 * Gets calendar year dates
 * @param offset - Year offset (0 = current, -1 = last year)
 */
function getCalendarYearDates(offset: number = 0): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear() + offset;

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

/**
 * Converts a date range preset to actual date values
 */
function getDateRangeForPreset(preset: DateRangePreset): { from: string | null; to: string | null } {
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

/**
 * Formats a date range for display
 */
function formatDateRange(from: string | null, to: string | null): string {
  if (!from && !to) return 'All Time';

  const formatShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (from && to) {
    return `${formatShort(from)} - ${formatShort(to)}`;
  }
  if (from) return `From ${formatShort(from)}`;
  if (to) return `Until ${formatShort(to)}`;
  return 'All Time';
}

export function TransactionsList({
  initialTransactions,
  initialTotalCount = 0,
  initialHasMore = false,
  initialChartSummary,
  transactions: legacyTransactions,
  accounts,
  categories,
}: TransactionsListProps) {
  const router = useRouter();

  // Use infinite scroll hook for paginated data
  // Falls back to legacy prop if initialTransactions not provided
  const {
    transactions: paginatedTransactions,
    hasMore,
    isLoading: isLoadingMore,
    isInitialLoading,
    totalCount,
    loadMore,
    refresh,
    setFilters: setServerFilters,
  } = useInfiniteTransactions({
    initialData: initialTransactions || legacyTransactions || [],
    initialTotalCount,
    pageSize: 100,
  });

  // Use paginated transactions if available, otherwise fall back to legacy
  const transactions = initialTransactions ? paginatedTransactions : (legacyTransactions || []);

  // Chart summary data from full dataset (not just loaded transactions)
  const [chartSummary, setChartSummary] = useState<ChartSummaryData | undefined>(initialChartSummary);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Current filter options (for chart popup on-demand fetching)
  const [currentFilterOptions, setCurrentFilterOptions] = useState<PaginatedTransactionOptions>({});

  // Shared category popover state (single popover for all rows)
  const categoryPopover = useCategoryPopover();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [ruleTransaction, setRuleTransaction] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Mobile filter sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Calculate effective date range
  const effectiveDateRange =
    dateRangePreset === 'custom'
      ? { from: customDateFrom || null, to: customDateTo || null }
      : getDateRangeForPreset(dateRangePreset);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Mobile selection mode
  const [selectionMode, setSelectionMode] = useState(false);

  // Bulk edit state
  const [bulkPayeeOpen, setBulkPayeeOpen] = useState(false);
  const [bulkPayeeValue, setBulkPayeeValue] = useState('');
  const [bulkPayeeLoading, setBulkPayeeLoading] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState('');
  const [bulkCategoryLoading, setBulkCategoryLoading] = useState(false);
  const [bulkCategorySearch, setBulkCategorySearch] = useState('');
  const [bulkNewCategoryName, setBulkNewCategoryName] = useState('');
  const [bulkNewCategoryLoading, setBulkNewCategoryLoading] = useState(false);
  const [showBulkNewCategoryInput, setShowBulkNewCategoryInput] = useState(false);
  const [bulkDescriptionOpen, setBulkDescriptionOpen] = useState(false);
  const [bulkDescriptionValue, setBulkDescriptionValue] = useState('');
  const [bulkDescriptionLoading, setBulkDescriptionLoading] = useState(false);

  // Inline category edit state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [inlineCategoryLoading, setInlineCategoryLoading] = useState<string | null>(null);
  const [inlineCategorySearch, setInlineCategorySearch] = useState('');
  const [inlineNewCategoryName, setInlineNewCategoryName] = useState('');
  const [inlineNewCategoryLoading, setInlineNewCategoryLoading] = useState(false);
  const [showInlineNewCategoryInput, setShowInlineNewCategoryInput] = useState(false);

  // Local categories state (to update when new category is created)
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  // Sort state
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Back to top visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Ref to track if this is the initial render (skip first filter effect)
  const isFirstFilterRender = useRef(true);

  // Effect to update server-side filters and refetch chart data when filters change
  useEffect(() => {
    // Skip on first render - we already have initial data from server
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }

    // Map client sort column to server-supported sort field
    // Server only supports: 'date' | 'amount' | 'payee' | 'description'
    const mapSortField = (column: SortColumn): 'date' | 'amount' | 'payee' | 'description' => {
      if (column === 'date' || column === 'amount' || column === 'description') {
        return column;
      }
      // For unsupported columns (category, account, null), default to date
      return 'date';
    };

    // Build filter options for server-side queries
    const filterOptions = {
      accountId: accountFilter !== 'all' ? accountFilter : undefined,
      categoryId: categoryFilter !== 'all' ? (categoryFilter === 'none' ? 'uncategorised' : categoryFilter) : undefined,
      search: searchTerm || undefined,
      dateFrom: effectiveDateRange.from || undefined,
      dateTo: effectiveDateRange.to || undefined,
      sortField: mapSortField(sortColumn),
      sortDirection: sortDirection,
    };

    // Update transaction filters (triggers server-side refetch)
    setServerFilters(filterOptions);

    // Store filter options for chart popup on-demand fetching
    setCurrentFilterOptions(filterOptions);

    // Refetch chart summary with same filters
    const fetchChartSummary = async () => {
      setIsChartLoading(true);
      try {
        const summary = await getChartSummaryData(filterOptions);
        setChartSummary(summary);
      } catch (error) {
        console.error('Failed to fetch chart summary:', error);
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartSummary();
  }, [accountFilter, categoryFilter, searchTerm, effectiveDateRange.from, effectiveDateRange.to, sortColumn, sortDirection, setServerFilters]);

  /**
   * Handles column sort toggling
   */
  const handleSort = useCallback((column: SortColumn) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  /**
   * Renders sort icon for table headers
   */
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // Filter transactions based on all active filters
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

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!sortColumn) return filteredTransactions;

    return [...filteredTransactions].sort((a, b) => {
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
  }, [filteredTransactions, sortColumn, sortDirection]);

  const allSelected =
    filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredTransactions.length;

  /**
   * Toggles selection of all visible transactions
   */
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  }, [allSelected, filteredTransactions]);

  /**
   * Toggles selection of a single transaction
   */
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

  /**
   * Handles single transaction deletion
   */
  const handleDelete = async () => {
    if (!deletingTransaction) return;

    setDeleteLoading(true);
    const result = await deleteTransaction(deletingTransaction.id);

    if (result.success) {
      setDeletingTransaction(null);
      // Also remove from selection if selected
      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        newSelected.delete(deletingTransaction.id);
        return newSelected;
      });
      router.refresh();
    }

    setDeleteLoading(false);
  };

  /**
   * Handles bulk deletion of selected transactions
   */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setBulkDeleteLoading(true);
    const result = await deleteTransactions(Array.from(selectedIds));

    if (result.success) {
      toast.success(`Deleted ${result.deleted} transactions`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setSelectionMode(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete transactions');
    }

    setBulkDeleteLoading(false);
  };

  /**
   * Handles bulk payee update for selected transactions
   */
  const handleBulkPayeeUpdate = async () => {
    if (selectedIds.size === 0) return;

    setBulkPayeeLoading(true);
    const result = await updateTransactionsPayee(Array.from(selectedIds), bulkPayeeValue);

    if (result.success) {
      toast.success(`Updated payee for ${result.updated} transactions`);
      setSelectedIds(new Set());
      setBulkPayeeOpen(false);
      setBulkPayeeValue('');
      setSelectionMode(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update payee');
    }

    setBulkPayeeLoading(false);
  };

  /**
   * Handles bulk category update for selected transactions
   */
  const handleBulkCategoryUpdate = async () => {
    if (selectedIds.size === 0) return;

    setBulkCategoryLoading(true);
    const categoryId = bulkCategoryValue === 'none' ? null : bulkCategoryValue;
    const result = await updateTransactionsCategory(Array.from(selectedIds), categoryId);

    if (result.success) {
      toast.success(`Updated category for ${result.updated} transactions`);
      setSelectedIds(new Set());
      setBulkCategoryOpen(false);
      setBulkCategoryValue('');
      setSelectionMode(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update category');
    }

    setBulkCategoryLoading(false);
  };

  /**
   * Handles bulk description update for selected transactions
   */
  const handleBulkDescriptionUpdate = async () => {
    if (selectedIds.size === 0) return;

    setBulkDescriptionLoading(true);
    const result = await updateTransactionsDescription(
      Array.from(selectedIds),
      bulkDescriptionValue
    );

    if (result.success) {
      toast.success(`Updated description for ${result.updated} transactions`);
      setSelectedIds(new Set());
      setBulkDescriptionOpen(false);
      setBulkDescriptionValue('');
      setSelectionMode(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update description');
    }

    setBulkDescriptionLoading(false);
  };

  /**
   * Handles inline category update for a single transaction
   */
  const handleInlineCategoryUpdate = async (transactionId: string, categoryId: string | null) => {
    setInlineCategoryLoading(transactionId);
    setEditingCategoryId(null);

    const result = await updateTransactionCategory(transactionId, categoryId);

    if (result.success) {
      toast.success('Category updated');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update category');
    }

    setInlineCategoryLoading(null);
  };

  /**
   * Creates a new category inline and applies it to a transaction
   */
  const handleInlineCreateCategory = async (transactionId: string, transaction: Transaction) => {
    if (!inlineNewCategoryName.trim()) return;

    setInlineNewCategoryLoading(true);
    const categoryType = transaction.transaction_type;
    const result = await createCategory(inlineNewCategoryName.trim(), categoryType);

    if (result.success && result.category) {
      toast.success(`Created category "${result.category.name}"`);
      setLocalCategories((prev) =>
        [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name))
      );
      // Now apply it to the transaction
      await handleInlineCategoryUpdate(transactionId, result.category.id);
      setInlineNewCategoryName('');
      setShowInlineNewCategoryInput(false);
    } else {
      toast.error(result.error || 'Failed to create category');
    }

    setInlineNewCategoryLoading(false);
  };

  /**
   * Creates a new category for bulk edit operations
   */
  const handleBulkCreateCategory = async () => {
    if (!bulkNewCategoryName.trim()) return;

    setBulkNewCategoryLoading(true);
    // Default to expense type for bulk operations
    const result = await createCategory(bulkNewCategoryName.trim(), 'expense');

    if (result.success && result.category) {
      toast.success(`Created category "${result.category.name}"`);
      setLocalCategories((prev) =>
        [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name))
      );
      setBulkCategoryValue(result.category.id);
      setBulkNewCategoryName('');
      setShowBulkNewCategoryInput(false);
    } else {
      toast.error(result.error || 'Failed to create category');
    }

    setBulkNewCategoryLoading(false);
  };

  /**
   * Clears all active filters and resets to defaults
   */
  const clearFilters = useCallback(() => {
    setAccountFilter('all');
    setCategoryFilter('all');
    setCategoryFilterSearch('');
    setSearchTerm('');
    setDateRangePreset('this-fy');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const hasActiveFilters =
    accountFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchTerm !== '' ||
    dateRangePreset !== 'this-fy';

  // Count active filters for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (accountFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (dateRangePreset !== 'this-fy') count++;
    return count;
  }, [accountFilter, categoryFilter, dateRangePreset]);

  /**
   * Handles date range preset changes
   */
  const handlePresetChange = useCallback((preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== 'custom') {
      setDatePickerOpen(false);
    }
  }, []);

  /**
   * Exports filtered transactions to CSV
   */
  const exportToCSV = useCallback(() => {
    // CSV header
    const headers = ['Date', 'Description', 'Payee', 'Account', 'Category', 'Type', 'Amount'];

    // CSV rows
    const rows = filteredTransactions.map((t) => {
      const amount = t.transaction_type === 'expense' ? -t.amount : t.amount;
      return [
        t.date,
        `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(t.payee || '').replace(/"/g, '""')}"`,
        `"${(t.account?.name || '').replace(/"/g, '""')}"`,
        `"${(t.category?.name || '').replace(/"/g, '""')}"`,
        t.transaction_type,
        amount.toFixed(2),
      ].join(',');
    });

    // Combine header and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredTransactions.length} transactions`);
  }, [filteredTransactions]);

  /**
   * Scrolls to top of page
   */
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check if we have any transactions at all (not filtered, just raw data)
  const hasAnyTransactions = transactions.length > 0 || totalCount > 0;

  return (
    <>
      {/*
        Mobile Filter Bar
        - Prominent search with filter button
        - Shows active filter count badge
      */}
      <div className="md:hidden px-4 pb-3 space-y-3">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 h-11 text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter and Actions Row */}
        <div className="flex items-center gap-2">
          {/* Filter Sheet Trigger */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-3 flex-shrink-0 relative">
                <Filter className="h-4 w-4 mr-1.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Filter your transactions</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 overflow-auto pb-20">
                {/* Date Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'this-fy',
                        'last-fy',
                        'this-month',
                        'last-month',
                        'last-30-days',
                        'last-90-days',
                        'this-quarter',
                        'last-quarter',
                        'this-year',
                        'last-year',
                        'all',
                      ] as DateRangePreset[]
                    ).map((preset) => (
                      <Button
                        key={preset}
                        variant={dateRangePreset === preset ? 'default' : 'outline'}
                        className="h-11 text-sm"
                        onClick={() => handlePresetChange(preset)}
                      >
                        {DATE_RANGE_LABELS[preset]}
                      </Button>
                    ))}
                  </div>
                  {dateRangePreset === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">From</Label>
                        <Input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">To</Label>
                        <Input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Account</Label>
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Category</Label>
                  <Input
                    placeholder="Search categories..."
                    value={categoryFilterSearch}
                    onChange={(e) => setCategoryFilterSearch(e.target.value)}
                    className="h-11"
                  />
                  <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-lg p-2">
                    {!categoryFilterSearch && (
                      <>
                        <button
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setCategoryFilter('all')}
                        >
                          All Categories
                        </button>
                        <button
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors ${categoryFilter === 'none' ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setCategoryFilter('none')}
                        >
                          No Category
                        </button>
                      </>
                    )}
                    {localCategories
                      .filter((cat) =>
                        cat.name.toLowerCase().includes(categoryFilterSearch.toLowerCase())
                      )
                      .map((category) => (
                        <button
                          key={category.id}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors ${categoryFilter === category.id ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setCategoryFilter(category.id)}
                        >
                          {category.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="flex-1 h-12">
                    Clear All
                  </Button>
                )}
                <SheetClose asChild>
                  <Button className="flex-1 h-12">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Date Range Quick Select */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 flex-1 justify-start text-left truncate"
            onClick={() => setFilterSheetOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{DATE_RANGE_LABELS[dateRangePreset]}</span>
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Selection Mode Toggle */}
          <Button
            variant={selectionMode ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) {
                setSelectedIds(new Set());
              }
            }}
          >
            {selectionMode ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {accountFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="h-7 pl-2 pr-1 gap-1 cursor-pointer"
                onClick={() => setAccountFilter('all')}
              >
                {accounts.find((a) => a.id === accountFilter)?.name}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="h-7 pl-2 pr-1 gap-1 cursor-pointer"
                onClick={() => setCategoryFilter('all')}
              >
                {categoryFilter === 'none'
                  ? 'No Category'
                  : localCategories.find((c) => c.id === categoryFilter)?.name}
                <X className="h-3 w-3" />
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/*
        Desktop Filter Bar
        - Full horizontal layout with all filters visible
        - Hidden on mobile
      */}
      <div className="hidden md:block mb-4 px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Popover
            open={categoryFilterOpen}
            onOpenChange={(open) => {
              setCategoryFilterOpen(open);
              if (!open) setCategoryFilterSearch('');
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[200px] justify-start text-left font-normal"
              >
                <Tag className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {categoryFilter === 'all'
                    ? 'All Categories'
                    : categoryFilter === 'none'
                      ? 'No Category'
                      : localCategories.find((c) => c.id === categoryFilter)?.name ||
                        'All Categories'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search categories..."
                value={categoryFilterSearch}
                onChange={(e) => setCategoryFilterSearch(e.target.value)}
                className="h-8 mb-2"
                autoFocus
              />
              <div className="max-h-[280px] overflow-y-auto space-y-0.5">
                {!categoryFilterSearch && (
                  <>
                    <button
                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${categoryFilter === 'all' ? 'bg-muted' : ''}`}
                      onClick={() => {
                        setCategoryFilter('all');
                        setCategoryFilterOpen(false);
                        setCategoryFilterSearch('');
                      }}
                    >
                      All Categories
                    </button>
                    <button
                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${categoryFilter === 'none' ? 'bg-muted' : ''}`}
                      onClick={() => {
                        setCategoryFilter('none');
                        setCategoryFilterOpen(false);
                        setCategoryFilterSearch('');
                      }}
                    >
                      No Category
                    </button>
                    <div className="border-t my-1" />
                  </>
                )}
                {localCategories
                  .filter((cat) =>
                    cat.name.toLowerCase().includes(categoryFilterSearch.toLowerCase())
                  )
                  .map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${categoryFilter === category.id ? 'bg-muted' : ''}`}
                      onClick={() => {
                        setCategoryFilter(category.id);
                        setCategoryFilterOpen(false);
                        setCategoryFilterSearch('');
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                {localCategories.filter((cat) =>
                  cat.name.toLowerCase().includes(categoryFilterSearch.toLowerCase())
                ).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No categories found
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range Filter */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {dateRangePreset === 'custom'
                    ? formatDateRange(customDateFrom || null, customDateTo || null)
                    : DATE_RANGE_LABELS[dateRangePreset]}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2 space-y-2">
                <div className="grid gap-1">
                  {(
                    [
                      'this-fy',
                      'last-fy',
                      'this-quarter',
                      'last-quarter',
                      'this-month',
                      'last-month',
                      'last-30-days',
                      'last-90-days',
                      'this-year',
                      'last-year',
                      'all',
                    ] as DateRangePreset[]
                  ).map((preset) => (
                    <Button
                      key={preset}
                      variant={dateRangePreset === preset ? 'secondary' : 'ghost'}
                      className="justify-start h-8 px-2"
                      onClick={() => handlePresetChange(preset)}
                    >
                      {DATE_RANGE_LABELS[preset]}
                    </Button>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <Button
                    variant={dateRangePreset === 'custom' ? 'secondary' : 'ghost'}
                    className="justify-start w-full h-8 px-2 mb-2"
                    onClick={() => setDateRangePreset('custom')}
                  >
                    Custom Range
                  </Button>
                  {dateRangePreset === 'custom' && (
                    <div className="space-y-2 px-1">
                      <div className="grid gap-1">
                        <Label className="text-xs">From</Label>
                        <Input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">To</Label>
                        <Input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <Button size="sm" className="w-full mt-2" onClick={() => setDatePickerOpen(false)}>
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Results Info */}
      <div className="mb-4 text-sm text-muted-foreground px-4 md:px-0">
        <span className="font-medium text-foreground">{filteredTransactions.length}</span>
        {filteredTransactions.length !== transactions.length && (
          <span> of {transactions.length}</span>
        )}
        {' '}transaction{filteredTransactions.length !== 1 ? 's' : ''}
        {effectiveDateRange.from || effectiveDateRange.to ? (
          <span className="ml-1 hidden sm:inline">
            ({formatDateRange(effectiveDateRange.from, effectiveDateRange.to)})
          </span>
        ) : null}
      </div>

      {/* Chart Cards - Stack vertically on mobile */}
      {/* Uses server-side summary data for full dataset accuracy when available */}
      <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2 px-4 md:px-0">
        <TopCategoriesChart
          transactions={filteredTransactions}
          summaryData={chartSummary?.topCategories}
          loading={isChartLoading}
          filterOptions={currentFilterOptions}
        />
        <TopPayeesChart
          transactions={filteredTransactions}
          summaryData={chartSummary?.topPayees}
          loading={isChartLoading}
          filterOptions={currentFilterOptions}
        />
      </div>

      {/* Loading State - Show animated skeleton while fetching */}
      {(isInitialLoading || isChartLoading) && filteredTransactions.length === 0 && (
        <div className="flex h-[200px] items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          </div>
        </div>
      )}

      {/* No Results from Filters - Show when filters applied but no matches */}
      {!isInitialLoading && !isChartLoading && hasActiveFilters && hasAnyTransactions && filteredTransactions.length === 0 && (
        <div className="flex h-[200px] items-center justify-center text-center text-muted-foreground px-4">
          <div>
            <p className="mb-2">No transactions match your filters.</p>
            <Button variant="link" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      )}

      {/* Empty Database State - No transactions exist at all */}
      {!isInitialLoading && !isChartLoading && !hasAnyTransactions && (
        <div className="flex h-[200px] items-center justify-center text-center text-muted-foreground px-4">
          <div>
            <p className="mb-2 text-base font-medium">No transactions yet.</p>
            <p className="text-sm">Import a bank statement or add transactions manually.</p>
          </div>
        </div>
      )}

      {/*
        Desktop Bulk Actions Bar
        - Shown when items are selected on desktop
      */}
      {selectedIds.size > 0 && (
        <div className="hidden md:flex mb-4 items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear Selection
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkPayeeOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Edit Payee
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkCategoryOpen(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Edit Category
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkDescriptionOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Edit Description
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/*
        Mobile Selection Mode Header
        - Shows selection count and select all toggle
      */}
      {selectionMode && (
        <div className="md:hidden flex items-center justify-between px-4 py-2 mb-2 bg-muted/50 rounded-lg mx-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate =
                    someSelected;
                }
              }}
              onCheckedChange={toggleSelectAll}
              className="h-5 w-5"
            />
            <span className="text-sm font-medium">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : 'Select transactions'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectionMode(false);
              setSelectedIds(new Set());
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <>
          {/*
            Mobile Transaction Cards
            - Card-based view optimized for touch
            - Shows key info with expandable details
          */}
          <div className="md:hidden divide-y divide-border">
            {sortedTransactions.map((transaction) => {
              const TypeIcon = typeIcons[transaction.transaction_type];
              const isExpense = transaction.transaction_type === 'expense';
              const isSelected = selectedIds.has(transaction.id);

              return (
                <div
                  key={`mobile-${transaction.id}`}
                  className={`px-4 py-3 transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/50 active:bg-muted'
                  }`}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(transaction.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox (visible in selection mode) */}
                    {selectionMode && (
                      <div className="flex-shrink-0 pt-0.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(transaction.id)}
                          className="h-5 w-5"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Transaction Type Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeBgColors[transaction.transaction_type]}`}
                    >
                      <TypeIcon
                        className={`h-5 w-5 ${typeColors[transaction.transaction_type]}`}
                      />
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {transaction.description}
                          </p>
                          {transaction.payee && (
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.payee}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`font-semibold text-sm ${
                              isExpense
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateCompact(transaction.date)}
                          </p>
                        </div>
                      </div>

                      {/* Category and Actions Row */}
                      <div className="flex items-center justify-between mt-2">
                        {/* Inline Category Picker */}
                        <div className="flex-1">
                          {inlineCategoryLoading === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Popover
                              open={editingCategoryId === transaction.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingCategoryId(transaction.id);
                                  setInlineCategorySearch('');
                                } else {
                                  setEditingCategoryId(null);
                                  setInlineCategorySearch('');
                                  setShowInlineNewCategoryInput(false);
                                  setInlineNewCategoryName('');
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  className="text-left min-h-[32px] flex items-center hover:bg-muted/50 rounded px-1.5 py-1 -ml-1.5 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {transaction.category ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {transaction.category.name}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs italic flex items-center gap-1">
                                      <Plus className="h-3 w-3" />
                                      Add category
                                    </span>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[250px] p-2"
                                align="start"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Input
                                  placeholder="Search categories..."
                                  value={inlineCategorySearch}
                                  onChange={(e) => setInlineCategorySearch(e.target.value)}
                                  className="h-9 mb-2"
                                  autoFocus
                                />
                                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                  {!inlineCategorySearch && (
                                    <button
                                      className={`w-full text-left px-2 py-2 text-sm rounded hover:bg-muted transition-colors ${!transaction.category_id ? 'bg-muted' : ''}`}
                                      onClick={() => {
                                        handleInlineCategoryUpdate(transaction.id, null);
                                      }}
                                    >
                                      No Category
                                    </button>
                                  )}
                                  {localCategories
                                    .filter((cat) =>
                                      cat.name
                                        .toLowerCase()
                                        .includes(inlineCategorySearch.toLowerCase())
                                    )
                                    .map((category) => (
                                      <button
                                        key={category.id}
                                        className={`w-full text-left px-2 py-2 text-sm rounded hover:bg-muted transition-colors ${transaction.category_id === category.id ? 'bg-muted' : ''}`}
                                        onClick={() => {
                                          handleInlineCategoryUpdate(transaction.id, category.id);
                                        }}
                                      >
                                        {category.name}
                                      </button>
                                    ))}
                                  {localCategories.filter((cat) =>
                                    cat.name
                                      .toLowerCase()
                                      .includes(inlineCategorySearch.toLowerCase())
                                  ).length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                      No categories found
                                    </p>
                                  )}
                                </div>
                                <div className="border-t mt-2 pt-2">
                                  {showInlineNewCategoryInput ? (
                                    <div className="space-y-2">
                                      <Input
                                        placeholder="New category name..."
                                        value={inlineNewCategoryName}
                                        onChange={(e) => setInlineNewCategoryName(e.target.value)}
                                        className="h-9"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleInlineCreateCategory(transaction.id, transaction);
                                          } else if (e.key === 'Escape') {
                                            setShowInlineNewCategoryInput(false);
                                            setInlineNewCategoryName('');
                                          }
                                        }}
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="flex-1 h-9"
                                          onClick={() =>
                                            handleInlineCreateCategory(transaction.id, transaction)
                                          }
                                          disabled={
                                            inlineNewCategoryLoading || !inlineNewCategoryName.trim()
                                          }
                                        >
                                          {inlineNewCategoryLoading && (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                          )}
                                          Add
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-9"
                                          onClick={() => {
                                            setShowInlineNewCategoryInput(false);
                                            setInlineNewCategoryName('');
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      className="w-full text-left px-2 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-1 text-primary"
                                      onClick={() => setShowInlineNewCategoryInput(true)}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Add new category
                                    </button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {/* Actions Menu (hidden in selection mode) */}
                        {!selectionMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mr-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRuleTransaction(transaction)}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Create Rule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingTransaction(transaction)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/*
            Desktop Transaction Table
            - Full-featured table with sorting and inline editing
            - Hidden on mobile
          */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate =
                            someSelected;
                        }
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead
                    className="w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon column="date" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center">
                      Description
                      <SortIcon column="description" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('account')}
                  >
                    <div className="flex items-center">
                      Account
                      <SortIcon column="account" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      <SortIcon column="category" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end">
                      Amount
                      <SortIcon column="amount" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.map((transaction) => {
                  const TypeIcon = typeIcons[transaction.transaction_type];
                  const isExpense = transaction.transaction_type === 'expense';
                  const isSelected = selectedIds.has(transaction.id);

                  return (
                    <TableRow
                      key={transaction.id}
                      className={isSelected ? 'bg-muted/50' : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(transaction.id)}
                          aria-label={`Select transaction ${transaction.description}`}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon
                            className={`h-4 w-4 ${typeColors[transaction.transaction_type]}`}
                          />
                          <div>
                            <span className="font-medium">{transaction.description}</span>
                            {transaction.payee && (
                              <p className="text-sm text-muted-foreground">{transaction.payee}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.account?.name || '—'}
                      </TableCell>
                      <TableCell>
                        {inlineCategoryLoading === transaction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Popover
                            open={editingCategoryId === transaction.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setEditingCategoryId(transaction.id);
                                setInlineCategorySearch('');
                              } else {
                                setEditingCategoryId(null);
                                setInlineCategorySearch('');
                                setShowInlineNewCategoryInput(false);
                                setInlineNewCategoryName('');
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button className="text-left hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors">
                                {transaction.category ? (
                                  <Badge variant="secondary" className="cursor-pointer">
                                    {transaction.category.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">
                                    + Add category
                                  </span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-2" align="start">
                              <Input
                                placeholder="Search categories..."
                                value={inlineCategorySearch}
                                onChange={(e) => setInlineCategorySearch(e.target.value)}
                                className="h-8 mb-2"
                                autoFocus
                              />
                              <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                {!inlineCategorySearch && (
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${!transaction.category_id ? 'bg-muted' : ''}`}
                                    onClick={() => {
                                      handleInlineCategoryUpdate(transaction.id, null);
                                    }}
                                  >
                                    No Category
                                  </button>
                                )}
                                {localCategories
                                  .filter((cat) =>
                                    cat.name
                                      .toLowerCase()
                                      .includes(inlineCategorySearch.toLowerCase())
                                  )
                                  .map((category) => (
                                    <button
                                      key={category.id}
                                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${transaction.category_id === category.id ? 'bg-muted' : ''}`}
                                      onClick={() => {
                                        handleInlineCategoryUpdate(transaction.id, category.id);
                                      }}
                                    >
                                      {category.name}
                                    </button>
                                  ))}
                                {localCategories.filter((cat) =>
                                  cat.name
                                    .toLowerCase()
                                    .includes(inlineCategorySearch.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-2">
                                    No categories found
                                  </p>
                                )}
                              </div>
                              <div className="border-t mt-2 pt-2">
                                {showInlineNewCategoryInput ? (
                                  <div className="space-y-2">
                                    <Input
                                      placeholder="New category name..."
                                      value={inlineNewCategoryName}
                                      onChange={(e) => setInlineNewCategoryName(e.target.value)}
                                      className="h-8"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleInlineCreateCategory(
                                            transaction.id,
                                            transaction
                                          );
                                        } else if (e.key === 'Escape') {
                                          setShowInlineNewCategoryInput(false);
                                          setInlineNewCategoryName('');
                                        }
                                      }}
                                    />
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="flex-1 h-7"
                                        onClick={() =>
                                          handleInlineCreateCategory(transaction.id, transaction)
                                        }
                                        disabled={
                                          inlineNewCategoryLoading || !inlineNewCategoryName.trim()
                                        }
                                      >
                                        {inlineNewCategoryLoading && (
                                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        )}
                                        Add
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7"
                                        onClick={() => {
                                          setShowInlineNewCategoryInput(false);
                                          setInlineNewCategoryName('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors flex items-center gap-1 text-primary"
                                    onClick={() => setShowInlineNewCategoryInput(true)}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add new category
                                  </button>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          isExpense
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRuleTransaction(transaction)}>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Create Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingTransaction(transaction)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Load More Button for infinite scroll */}
            {hasMore && (
              <div className="flex justify-center py-4 border-t">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({sortedTransactions.length} of {totalCount})
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Showing count info */}
            {!hasMore && sortedTransactions.length > 0 && (
              <div className="text-center py-3 text-sm text-muted-foreground border-t">
                Showing all {sortedTransactions.length} transactions
              </div>
            )}
          </div>
        </>
      )}

      {/* Shared Category Popover - renders once for entire list */}
      <CategoryPopover
        state={categoryPopover.state}
        categories={localCategories}
        onSelect={handleInlineCategoryUpdate}
        onCreate={handleInlineCreateCategory}
        onClose={categoryPopover.close}
        isLoading={inlineCategoryLoading !== null}
      />

      {/*
        Mobile Bulk Actions Bar
        - Fixed bottom bar when items selected on mobile
        - Large touch targets for bulk operations
      */}
      {selectedIds.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedIds(new Set());
                setSelectionMode(false);
              }}
            >
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-12 flex-col gap-1 px-2"
              onClick={() => setBulkPayeeOpen(true)}
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Payee</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-12 flex-col gap-1 px-2"
              onClick={() => setBulkCategoryOpen(true)}
            >
              <Tag className="h-4 w-4" />
              <span className="text-xs">Category</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-12 flex-col gap-1 px-2"
              onClick={() => setBulkDescriptionOpen(true)}
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Desc.</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-12 flex-col gap-1 px-2"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg z-40 md:hidden"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}

      {/* Edit Dialog */}
      <TransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingTransaction(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      {ruleTransaction && (
        <CreateRuleDialog
          open={!!ruleTransaction}
          onOpenChange={(open) => !open && setRuleTransaction(null)}
          transaction={ruleTransaction}
          categories={categories}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} transaction
              {selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Payee Dialog */}
      <Dialog
        open={bulkPayeeOpen}
        onOpenChange={(open) => {
          setBulkPayeeOpen(open);
          if (!open) setBulkPayeeValue('');
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit Payee for {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Enter the new payee name. This will be applied to all selected transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-payee">Payee</Label>
            <Input
              id="bulk-payee"
              placeholder="Enter payee name"
              value={bulkPayeeValue}
              onChange={(e) => setBulkPayeeValue(e.target.value)}
              className="mt-2 h-11"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkPayeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkPayeeUpdate} disabled={bulkPayeeLoading}>
              {bulkPayeeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Payee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Category Dialog */}
      <Dialog
        open={bulkCategoryOpen}
        onOpenChange={(open) => {
          setBulkCategoryOpen(open);
          if (!open) {
            setBulkCategoryValue('');
            setBulkCategorySearch('');
            setShowBulkNewCategoryInput(false);
            setBulkNewCategoryName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit Category for {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Select the new category. This will be applied to all selected transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Search categories..."
              value={bulkCategorySearch}
              onChange={(e) => setBulkCategorySearch(e.target.value)}
              className="mb-3 h-11"
              autoFocus
            />
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-1 space-y-0.5">
              {!bulkCategorySearch && (
                <button
                  className={`w-full text-left px-3 py-2.5 text-sm rounded hover:bg-muted transition-colors ${bulkCategoryValue === 'none' ? 'bg-muted' : ''}`}
                  onClick={() => setBulkCategoryValue('none')}
                >
                  No Category
                </button>
              )}
              {localCategories
                .filter((cat) =>
                  cat.name.toLowerCase().includes(bulkCategorySearch.toLowerCase())
                )
                .map((category) => (
                  <button
                    key={category.id}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded hover:bg-muted transition-colors ${bulkCategoryValue === category.id ? 'bg-muted' : ''}`}
                    onClick={() => setBulkCategoryValue(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              {localCategories.filter((cat) =>
                cat.name.toLowerCase().includes(bulkCategorySearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">No categories found</p>
              )}
            </div>
            <div className="border-t mt-3 pt-3">
              {showBulkNewCategoryInput ? (
                <div className="space-y-2">
                  <Input
                    placeholder="New category name..."
                    value={bulkNewCategoryName}
                    onChange={(e) => setBulkNewCategoryName(e.target.value)}
                    className="h-10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBulkCreateCategory();
                      } else if (e.key === 'Escape') {
                        setShowBulkNewCategoryInput(false);
                        setBulkNewCategoryName('');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 h-10"
                      onClick={handleBulkCreateCategory}
                      disabled={bulkNewCategoryLoading || !bulkNewCategoryName.trim()}
                    >
                      {bulkNewCategoryLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Create & Select
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-10"
                      onClick={() => {
                        setShowBulkNewCategoryInput(false);
                        setBulkNewCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full text-left px-3 py-2.5 text-sm rounded hover:bg-muted transition-colors flex items-center gap-1 text-primary"
                  onClick={() => setShowBulkNewCategoryInput(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add new category
                </button>
              )}
            </div>
            {bulkCategoryValue && (
              <p className="mt-3 text-sm text-muted-foreground">
                Selected:{' '}
                <span className="font-medium text-foreground">
                  {bulkCategoryValue === 'none'
                    ? 'No Category'
                    : localCategories.find((c) => c.id === bulkCategoryValue)?.name}
                </span>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkCategoryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCategoryUpdate}
              disabled={bulkCategoryLoading || !bulkCategoryValue}
            >
              {bulkCategoryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Description Dialog */}
      <Dialog
        open={bulkDescriptionOpen}
        onOpenChange={(open) => {
          setBulkDescriptionOpen(open);
          if (!open) setBulkDescriptionValue('');
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit Description for {selectedIds.size} Transaction
              {selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Enter the new description. This will be applied to all selected transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-description">Description</Label>
            <Input
              id="bulk-description"
              placeholder="Enter description"
              value={bulkDescriptionValue}
              onChange={(e) => setBulkDescriptionValue(e.target.value)}
              className="mt-2 h-11"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkDescriptionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkDescriptionUpdate} disabled={bulkDescriptionLoading}>
              {bulkDescriptionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Description
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
