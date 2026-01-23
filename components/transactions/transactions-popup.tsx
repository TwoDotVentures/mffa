'use client';

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
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import type { Transaction } from '@/lib/types';

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
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
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
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
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
