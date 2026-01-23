'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Transaction } from '@/lib/types';

type SortColumn = 'date' | 'description' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

interface TransactionsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  transactions: Transaction[];
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

export function TransactionsPopup({
  open,
  onOpenChange,
  title,
  transactions,
}: TransactionsPopupProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1152px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} · {formatCurrency(total)}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto flex-1 -mx-6 px-6">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No transactions found</p>
          ) : (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
