'use client';

import { useState, useMemo } from 'react';
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
import { MoreHorizontal, Pencil, Trash2, Loader2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Wand2, Search, X, Download, Tag, User, Calendar, FileText, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { TransactionDialog } from './transaction-dialog';
import { CreateRuleDialog } from './create-rule-dialog';
import { TopCategoriesChart } from './top-categories-chart';
import { TopPayeesChart } from './top-payees-chart';
import { deleteTransaction, deleteTransactions, updateTransactionsPayee, updateTransactionsCategory, updateTransactionCategory, updateTransactionsDescription, createCategory } from '@/lib/transactions/actions';
import { toast } from 'sonner';
import type { Transaction, Account, Category } from '@/lib/types';

interface TransactionsListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const typeIcons = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowRightLeft,
};

const typeColors = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
};

// Sorting types
type SortColumn = 'date' | 'description' | 'account' | 'category' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

// Date range presets
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

const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  'all': 'All Time',
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
  'custom': 'Custom Range',
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

export function TransactionsList({ transactions, accounts, categories }: TransactionsListProps) {
  const router = useRouter();
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

  // Calculate effective date range
  const effectiveDateRange = dateRangePreset === 'custom'
    ? { from: customDateFrom || null, to: customDateTo || null }
    : getDateRangeForPreset(dateRangePreset);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
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
      if (!matchesDescription && !matchesPayee && !matchesCategory && !matchesAccount && !matchesAmount) {
        return false;
      }
    }
    return true;
  });

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

  const allSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredTransactions.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    setDeleteLoading(true);
    const result = await deleteTransaction(deletingTransaction.id);

    if (result.success) {
      setDeletingTransaction(null);
      // Also remove from selection if selected
      const newSelected = new Set(selectedIds);
      newSelected.delete(deletingTransaction.id);
      setSelectedIds(newSelected);
      router.refresh();
    }

    setDeleteLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setBulkDeleteLoading(true);
    const result = await deleteTransactions(Array.from(selectedIds));

    if (result.success) {
      toast.success(`Deleted ${result.deleted} transactions`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete transactions');
    }

    setBulkDeleteLoading(false);
  };

  const handleBulkPayeeUpdate = async () => {
    if (selectedIds.size === 0) return;

    setBulkPayeeLoading(true);
    const result = await updateTransactionsPayee(Array.from(selectedIds), bulkPayeeValue);

    if (result.success) {
      toast.success(`Updated payee for ${result.updated} transactions`);
      setSelectedIds(new Set());
      setBulkPayeeOpen(false);
      setBulkPayeeValue('');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update payee');
    }

    setBulkPayeeLoading(false);
  };

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
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update category');
    }

    setBulkCategoryLoading(false);
  };

  const handleBulkDescriptionUpdate = async () => {
    if (selectedIds.size === 0) return;

    setBulkDescriptionLoading(true);
    const result = await updateTransactionsDescription(Array.from(selectedIds), bulkDescriptionValue);

    if (result.success) {
      toast.success(`Updated description for ${result.updated} transactions`);
      setSelectedIds(new Set());
      setBulkDescriptionOpen(false);
      setBulkDescriptionValue('');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update description');
    }

    setBulkDescriptionLoading(false);
  };

  // Inline category update handler
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

  // Create new category inline and apply to transaction
  const handleInlineCreateCategory = async (transactionId: string, transaction: Transaction) => {
    if (!inlineNewCategoryName.trim()) return;

    setInlineNewCategoryLoading(true);
    const categoryType = transaction.transaction_type;
    const result = await createCategory(inlineNewCategoryName.trim(), categoryType);

    if (result.success && result.category) {
      toast.success(`Created category "${result.category.name}"`);
      setLocalCategories(prev => [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
      // Now apply it to the transaction
      await handleInlineCategoryUpdate(transactionId, result.category.id);
      setInlineNewCategoryName('');
      setShowInlineNewCategoryInput(false);
    } else {
      toast.error(result.error || 'Failed to create category');
    }

    setInlineNewCategoryLoading(false);
  };

  // Create new category for bulk edit
  const handleBulkCreateCategory = async () => {
    if (!bulkNewCategoryName.trim()) return;

    setBulkNewCategoryLoading(true);
    // Default to expense type for bulk operations
    const result = await createCategory(bulkNewCategoryName.trim(), 'expense');

    if (result.success && result.category) {
      toast.success(`Created category "${result.category.name}"`);
      setLocalCategories(prev => [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
      setBulkCategoryValue(result.category.id);
      setBulkNewCategoryName('');
      setShowBulkNewCategoryInput(false);
    } else {
      toast.error(result.error || 'Failed to create category');
    }

    setBulkNewCategoryLoading(false);
  };

  // Clear selection when filters change
  const clearFilters = () => {
    setAccountFilter('all');
    setCategoryFilter('all');
    setCategoryFilterSearch('');
    setSearchTerm('');
    setDateRangePreset('this-fy');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSelectedIds(new Set());
  };

  const hasActiveFilters = accountFilter !== 'all' || categoryFilter !== 'all' || searchTerm !== '' || dateRangePreset !== 'this-fy';

  // Handle preset change
  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== 'custom') {
      setDatePickerOpen(false);
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
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
  };

  if (transactions.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="mb-2">No transactions yet.</p>
          <p className="text-sm">Import a bank statement or add transactions manually.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <Popover open={categoryFilterOpen} onOpenChange={(open) => {
          setCategoryFilterOpen(open);
          if (!open) setCategoryFilterSearch('');
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
              <Tag className="mr-2 h-4 w-4" />
              <span className="truncate">
                {categoryFilter === 'all'
                  ? 'All Categories'
                  : categoryFilter === 'none'
                    ? 'No Category'
                    : localCategories.find(c => c.id === categoryFilter)?.name || 'All Categories'}
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
            <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
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
                {(['this-fy', 'last-fy', 'this-quarter', 'last-quarter', 'this-month', 'last-month', 'last-30-days', 'last-90-days', 'this-year', 'last-year', 'all'] as DateRangePreset[]).map((preset) => (
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
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setDatePickerOpen(false)}
                    >
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
        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredTransactions.length === 0}>
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filter Results Info */}
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{filteredTransactions.length}</span>
        {filteredTransactions.length !== transactions.length && (
          <span> of {transactions.length}</span>
        )}
        {' '}transaction{filteredTransactions.length !== 1 ? 's' : ''}
        {effectiveDateRange.from || effectiveDateRange.to ? (
          <span className="ml-1">
            ({formatDateRange(effectiveDateRange.from, effectiveDateRange.to)})
          </span>
        ) : null}
      </div>

      {/* Chart Cards */}
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <TopCategoriesChart transactions={filteredTransactions} />
        <TopPayeesChart transactions={filteredTransactions} />
      </div>

      {/* No Results Message */}
      {hasActiveFilters && filteredTransactions.length === 0 && (
        <div className="flex h-[200px] items-center justify-center text-center text-muted-foreground">
          <div>
            <p className="mb-2">No transactions match your filters.</p>
            <Button variant="link" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkPayeeOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              Edit Payee
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkCategoryOpen(true)}
            >
              <Tag className="mr-2 h-4 w-4" />
              Edit Category
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDescriptionOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Edit Description
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {filteredTransactions.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
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
              <TableRow key={transaction.id} className={isSelected ? 'bg-muted/50' : undefined}>
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
                        <button
                          className="text-left hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors"
                        >
                          {transaction.category ? (
                            <Badge variant="secondary" className="cursor-pointer">
                              {transaction.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">+ Add category</span>
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
                              cat.name.toLowerCase().includes(inlineCategorySearch.toLowerCase())
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
                            cat.name.toLowerCase().includes(inlineCategorySearch.toLowerCase())
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
                                  className="flex-1 h-7"
                                  onClick={() => handleInlineCreateCategory(transaction.id, transaction)}
                                  disabled={inlineNewCategoryLoading || !inlineNewCategoryName.trim()}
                                >
                                  {inlineNewCategoryLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
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
                    isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
      <Dialog open={bulkPayeeOpen} onOpenChange={(open) => {
        setBulkPayeeOpen(open);
        if (!open) setBulkPayeeValue('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payee for {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
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
              className="mt-2"
            />
          </div>
          <DialogFooter>
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
      <Dialog open={bulkCategoryOpen} onOpenChange={(open) => {
        setBulkCategoryOpen(open);
        if (!open) {
          setBulkCategoryValue('');
          setBulkCategorySearch('');
          setShowBulkNewCategoryInput(false);
          setBulkNewCategoryName('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category for {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Select the new category. This will be applied to all selected transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Search categories..."
              value={bulkCategorySearch}
              onChange={(e) => setBulkCategorySearch(e.target.value)}
              className="mb-3"
              autoFocus
            />
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-1 space-y-0.5">
              {!bulkCategorySearch && (
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors ${bulkCategoryValue === 'none' ? 'bg-muted' : ''}`}
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
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors ${bulkCategoryValue === category.id ? 'bg-muted' : ''}`}
                    onClick={() => setBulkCategoryValue(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              {localCategories.filter((cat) =>
                cat.name.toLowerCase().includes(bulkCategorySearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No categories found
                </p>
              )}
            </div>
            <div className="border-t mt-3 pt-3">
              {showBulkNewCategoryInput ? (
                <div className="space-y-2">
                  <Input
                    placeholder="New category name..."
                    value={bulkNewCategoryName}
                    onChange={(e) => setBulkNewCategoryName(e.target.value)}
                    className="h-8"
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
                      className="flex-1"
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
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors flex items-center gap-1 text-primary"
                  onClick={() => setShowBulkNewCategoryInput(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add new category
                </button>
              )}
            </div>
            {bulkCategoryValue && (
              <p className="mt-3 text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{bulkCategoryValue === 'none' ? 'No Category' : localCategories.find(c => c.id === bulkCategoryValue)?.name}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCategoryUpdate} disabled={bulkCategoryLoading || !bulkCategoryValue}>
              {bulkCategoryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Description Dialog */}
      <Dialog open={bulkDescriptionOpen} onOpenChange={(open) => {
        setBulkDescriptionOpen(open);
        if (!open) setBulkDescriptionValue('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Description for {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
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
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
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
