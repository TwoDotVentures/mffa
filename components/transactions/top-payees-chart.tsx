/**
 * TopPayeesChart Component
 *
 * Horizontal bar chart showing top payees/merchants by expense amount.
 * Clicking bars opens transaction details popup. Optimized for mobile
 * with touch-friendly tap targets and active state feedback.
 *
 * @mobile Touch-friendly bars with 44px minimum height
 * @desktop Compact bars with hover states
 * @touch Large tap targets for payee rows
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { TransactionsPopup } from './transactions-popup';
import type { Transaction, PaginatedTransactionOptions } from '@/lib/types';
import type { PayeeSummary } from '@/lib/transactions/actions';
import { getTransactionsForChartPopup } from '@/lib/transactions/actions';

/** Props for TopPayeesChart component */
interface TopPayeesChartProps {
  /** Transactions to analyze (used if summaryData not provided) */
  transactions?: Transaction[];
  /** Pre-computed summary data from server (takes precedence over transactions) */
  summaryData?: PayeeSummary[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Current filter options (for on-demand popup fetching) */
  filterOptions?: PaginatedTransactionOptions;
}

/** Payee data structure */
interface PayeeData {
  name: string;
  amount: number;
  count: number;
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

/** Color palette for payee bars */
const COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-lime-500',
  'bg-sky-500',
];

/**
 * Chart displaying top payees by expense amount with clickable bars
 */
export function TopPayeesChart({ transactions = [], summaryData, loading = false, filterOptions }: TopPayeesChartProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupTransactions, setPopupTransactions] = useState<Transaction[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);

  // Filter expense transactions (excluding transfers) - only used if no summaryData
  const expenseTransactions = useMemo(() => {
    if (summaryData) return []; // Not needed when using summary data
    return transactions.filter(
      (t) => t.transaction_type === 'expense' && t.category?.category_type !== 'transfer'
    );
  }, [transactions, summaryData]);

  // Use server-side data when summaryData is provided
  const useServerData = !!summaryData;

  const payeeData = useMemo(() => {
    // If we have pre-computed summary data, use it directly
    if (summaryData && summaryData.length > 0) {
      return summaryData.map(p => ({
        name: p.name,
        amount: p.amount,
        count: p.count,
      }));
    }

    // Fall back to computing from transactions
    const payeeTotals: Record<string, PayeeData> = {};

    for (const t of expenseTransactions) {
      const payeeName = t.payee || t.description || 'Unknown';
      if (!payeeTotals[payeeName]) {
        payeeTotals[payeeName] = { name: payeeName, amount: 0, count: 0 };
      }
      payeeTotals[payeeName].amount += t.amount;
      payeeTotals[payeeName].count += 1;
    }

    return Object.values(payeeTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [expenseTransactions]);

  const maxAmount = payeeData.length > 0 ? payeeData[0].amount : 0;
  const totalExpenses = payeeData.reduce((sum, p) => sum + p.amount, 0);

  /**
   * Opens popup with transactions for a payee
   * Uses on-demand server fetch when summaryData is used for efficiency
   */
  const handlePayeeClick = useCallback(async (payee: PayeeData) => {
    setPopupTitle(payee.name);
    setPopupOpen(true);

    if (useServerData) {
      // Fetch transactions on-demand from server
      setPopupLoading(true);
      setPopupTransactions([]);
      try {
        const data = await getTransactionsForChartPopup('payee', payee.name, filterOptions || {});
        setPopupTransactions(data);
      } catch (error) {
        console.error('Error fetching payee transactions:', error);
      } finally {
        setPopupLoading(false);
      }
    } else {
      // Use local filtering for legacy mode
      const filtered = expenseTransactions.filter((t) => {
        const transactionPayee = t.payee || t.description || 'Unknown';
        return transactionPayee === payee.name;
      });
      setPopupTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [useServerData, filterOptions, expenseTransactions]);

  // Loading state with animated skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Payees</CardTitle>
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[80, 65, 50, 40, 30].map((width, i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full">
                  <div
                    className="h-2.5 bg-muted-foreground/20 rounded-full"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (payeeData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Payees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No expense transactions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Payees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payeeData.map((payee, index) => {
              const percentage = maxAmount > 0 ? (payee.amount / maxAmount) * 100 : 0;
              const totalPercentage = totalExpenses > 0 ? (payee.amount / totalExpenses) * 100 : 0;

              return (
                <div key={payee.name} className="space-y-1">
                  {/*
                    Payee row
                    - Touch-friendly minimum height (44px via py-2)
                    - Active state feedback for mobile
                  */}
                  <div
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 active:bg-muted -mx-2 px-2 py-2 rounded-lg transition-colors"
                    onClick={() => handlePayeeClick(payee)}
                  >
                    <span className="truncate font-medium max-w-[55%]" title={payee.name}>
                      {payee.name}
                    </span>
                    <span className="text-muted-foreground text-right flex-shrink-0 ml-2">
                      {formatCurrency(payee.amount)}
                      <span className="ml-1 text-xs">({totalPercentage.toFixed(0)}%)</span>
                    </span>
                  </div>

                  {/* Progress bar - thicker on mobile for easier visibility */}
                  <div className="h-2.5 md:h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2.5 md:h-2 rounded-full transition-all duration-300 ${COLORS[index % COLORS.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TransactionsPopup
        open={popupOpen}
        onOpenChange={setPopupOpen}
        title={popupTitle}
        transactions={popupTransactions}
        loading={popupLoading}
      />
    </>
  );
}
