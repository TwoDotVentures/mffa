'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { TransactionsPopup } from './transactions-popup';
import type { Transaction } from '@/lib/types';

interface TopPayeesChartProps {
  transactions: Transaction[];
}

interface PayeeData {
  name: string;
  amount: number;
  count: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

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

export function TopPayeesChart({ transactions }: TopPayeesChartProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupTransactions, setPopupTransactions] = useState<Transaction[]>([]);

  // Filter expense transactions (excluding transfers)
  const expenseTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.transaction_type === 'expense' && t.category?.category_type !== 'transfer'
    );
  }, [transactions]);

  const payeeData = useMemo(() => {
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

  const handlePayeeClick = (payee: PayeeData) => {
    // Get transactions for this payee
    const filtered = expenseTransactions.filter((t) => {
      const transactionPayee = t.payee || t.description || 'Unknown';
      return transactionPayee === payee.name;
    });

    setPopupTitle(payee.name);
    setPopupTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPopupOpen(true);
  };

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
                <div
                  key={payee.name}
                  className="space-y-1 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
                  onClick={() => handlePayeeClick(payee)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium max-w-[60%]" title={payee.name}>
                      {payee.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(payee.amount)}
                      <span className="ml-1 text-xs">({payee.count})</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${COLORS[index % COLORS.length]}`}
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
      />
    </>
  );
}
