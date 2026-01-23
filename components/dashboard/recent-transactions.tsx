/**
 * Recent Transactions Component
 *
 * Displays a compact list of the most recent transactions.
 * Optimized for mobile viewing with:
 * - Clear date, payee, and amount display
 * - Color-coded transaction types
 * - Touch-friendly row spacing
 * - "View All" link to full transactions page
 *
 * @module components/dashboard/recent-transactions
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronRight,
  Receipt,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

/**
 * Props for the RecentTransactions component
 */
interface RecentTransactionsProps {
  /** Array of recent transactions to display */
  transactions: Transaction[];
}

/**
 * Formats a number as Australian currency
 * @param amount - The amount to format
 * @returns Formatted currency string with proper sign
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "23 Jan")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Gets the appropriate icon and colors for a transaction type
 * @param type - Transaction type (income, expense, transfer)
 * @returns Icon component and styling classes
 */
function getTransactionStyle(type: string) {
  switch (type) {
    case 'income':
      return {
        icon: ArrowDownLeft,
        iconClassName: 'text-emerald-600 dark:text-emerald-400',
        bgClassName: 'bg-emerald-100 dark:bg-emerald-950/50',
        amountClassName: 'text-emerald-600 dark:text-emerald-400',
        prefix: '+',
      };
    case 'expense':
      return {
        icon: ArrowUpRight,
        iconClassName: 'text-rose-600 dark:text-rose-400',
        bgClassName: 'bg-rose-100 dark:bg-rose-950/50',
        amountClassName: 'text-rose-600 dark:text-rose-400',
        prefix: '-',
      };
    case 'transfer':
      return {
        icon: ArrowLeftRight,
        iconClassName: 'text-blue-600 dark:text-blue-400',
        bgClassName: 'bg-blue-100 dark:bg-blue-950/50',
        amountClassName: 'text-blue-600 dark:text-blue-400',
        prefix: '',
      };
    default:
      return {
        icon: Receipt,
        iconClassName: 'text-muted-foreground',
        bgClassName: 'bg-muted',
        amountClassName: 'text-foreground',
        prefix: '',
      };
  }
}

/**
 * Individual transaction row component
 */
function TransactionRow({ transaction }: { transaction: Transaction }) {
  const style = getTransactionStyle(transaction.transaction_type);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 sm:py-4',
        'border-b border-border/50 last:border-0',
        'transition-colors hover:bg-muted/30',
        'animate-in fade-in slide-in-from-left-2',
      )}
      style={{ animationDuration: '400ms' }}
    >
      {/* Left side: Icon, payee/description, date */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Transaction type icon */}
        <div className={cn('shrink-0 rounded-full p-2.5', style.bgClassName)}>
          <Icon className={cn('h-4 w-4', style.iconClassName)} />
        </div>

        {/* Payee and date */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm sm:text-base truncate">
            {transaction.payee || transaction.description}
          </p>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>{formatDate(transaction.date)}</span>
            {transaction.category && (
              <>
                <span className="text-muted-foreground/50">-</span>
                <span className="truncate">{transaction.category.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Amount */}
      <div className={cn('shrink-0 font-semibold text-sm sm:text-base tabular-nums', style.amountClassName)}>
        {style.prefix}{formatCurrency(transaction.amount)}
      </div>
    </div>
  );
}

/**
 * Empty state when no transactions exist
 */
function EmptyTransactions() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">No transactions yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        Import a bank statement or add your first transaction to get started
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/transactions">
          Add Transaction
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  );
}

/**
 * Recent transactions card component
 * Displays latest transactions with View All link
 */
export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card
      className={cn(
        'lg:col-span-4 overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-4',
      )}
      style={{ animationDelay: '200ms', animationDuration: '500ms', animationFillMode: 'both' }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
          <CardDescription className="text-sm">
            {transactions.length > 0
              ? 'Your latest financial activity'
              : 'No activity to show'}
          </CardDescription>
        </div>
        {transactions.length > 0 && (
          <CardAction>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/transactions">
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        {transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="space-y-0">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                style={{ animationDelay: `${250 + index * 50}ms` }}
              >
                <TransactionRow transaction={transaction} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
