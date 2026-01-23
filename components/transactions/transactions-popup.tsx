/**
 * TransactionsPopup Component
 *
 * Modal dialog showing a list of transactions, typically used when
 * clicking on chart segments to see underlying transactions.
 * Optimized for mobile with card-based layout and touch-friendly sorting.
 *
 * @mobile Card-based transaction list with touch-friendly interactions
 * @desktop Full table view with sortable columns
 * @touch Large touch targets for sorting and navigation
 */
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SortAsc,
  Loader2,
} from 'lucide-react';
import type { Transaction } from '@/lib/types';

/** Sortable columns */
type SortColumn = 'date' | 'description' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

/** Props for TransactionsPopup component */
interface TransactionsPopupProps {
  /** Whether the popup is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Title for the popup header */
  title: string;
  /** Transactions to display */
  transactions: Transaction[];
  /** Whether transactions are being loaded */
  loading?: boolean;
}

/**
 * Formats a number as Australian currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Formats a date string for display
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

/** Background colors for transaction type badges on mobile */
const typeBgColors = {
  income: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  expense: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  transfer: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
};

/** Sort option labels for mobile dropdown */
const SORT_OPTIONS: { column: SortColumn; direction: SortDirection; label: string }[] = [
  { column: 'date', direction: 'desc', label: 'Date (Newest)' },
  { column: 'date', direction: 'asc', label: 'Date (Oldest)' },
  { column: 'amount', direction: 'desc', label: 'Amount (Highest)' },
  { column: 'amount', direction: 'asc', label: 'Amount (Lowest)' },
  { column: 'description', direction: 'asc', label: 'Description (A-Z)' },
  { column: 'description', direction: 'desc', label: 'Description (Z-A)' },
];

/**
 * Popup dialog displaying transaction list with sorting
 */
export function TransactionsPopup({
  open,
  onOpenChange,
  title,
  transactions,
  loading = false,
}: TransactionsPopupProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  /**
   * Handles column sort toggling for desktop table
   */
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  /**
   * Handles sort selection from mobile dropdown
   */
  const handleMobileSort = (column: SortColumn, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  /**
   * Sorts transactions based on current sort state
   */
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

  /**
   * Renders sort icon for desktop table headers
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

  // Calculate total amount
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Get current sort label for mobile display
  const currentSortLabel =
    SORT_OPTIONS.find(
      (opt) => opt.column === sortColumn && opt.direction === sortDirection
    )?.label || 'Date (Newest)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col p-0 sm:p-6 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-0 sm:pt-0 sm:pb-4 border-b sm:border-0 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-lg truncate pr-2">{title}</DialogTitle>
            <span className="text-sm font-normal text-muted-foreground whitespace-nowrap">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} ·{' '}
              {formatCurrency(total)}
            </span>
          </div>
        </DialogHeader>

        {/* Mobile Sort Dropdown */}
        <div className="md:hidden px-4 py-3 border-b flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between h-10">
                <span className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  {currentSortLabel}
                </span>
                <ArrowUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={`${option.column}-${option.direction}`}
                  onClick={() => handleMobileSort(option.column, option.direction)}
                  className={`py-2.5 ${
                    sortColumn === option.column && sortDirection === option.direction
                      ? 'bg-muted'
                      : ''
                  }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <>
              {/*
                Mobile Transaction Cards
                - Card layout optimized for touch
                - Shows key info with type indicator
              */}
              <div className="md:hidden divide-y">
                {sortedTransactions.map((transaction) => {
                  const TypeIcon = typeIcons[transaction.transaction_type];
                  const isExpense = transaction.transaction_type === 'expense';

                  return (
                    <div key={transaction.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
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

                          {/* Account and Category */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {transaction.account?.name}
                            </span>
                            {transaction.category && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <Badge variant="secondary" className="text-xs h-5">
                                  {transaction.category.name}
                                </Badge>
                              </>
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
                - Full table with sortable headers
                - Hidden on mobile
              */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        className="text-right cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-end">
                          Amount
                          <SortIcon column="amount" />
                        </div>
                      </TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.map((transaction) => {
                      const TypeIcon = typeIcons[transaction.transaction_type];
                      const isExpense = transaction.transaction_type === 'expense';

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon
                                className={`h-4 w-4 flex-shrink-0 ${typeColors[transaction.transaction_type]}`}
                              />
                              <div className="min-w-0">
                                <span className="font-medium text-sm truncate block">
                                  {transaction.description}
                                </span>
                                {transaction.payee && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {transaction.payee}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium text-sm ${
                              isExpense
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {transaction.account?.name || '—'}
                          </TableCell>
                          <TableCell>
                            {transaction.category ? (
                              <Badge variant="secondary" className="text-xs">
                                {transaction.category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
