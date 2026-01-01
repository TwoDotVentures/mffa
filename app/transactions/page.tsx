import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionButtons } from '@/components/transactions/transaction-buttons';
import { TransactionsList } from '@/components/transactions/transactions-list';
import { getTransactions, getTransactionsSummary, getCategories, createDefaultCategories } from '@/lib/transactions/actions';
import { getAccounts } from '@/lib/accounts/actions';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Receipt } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export default async function TransactionsPage() {
  const [transactions, accounts, categories, summary] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
    getTransactionsSummary(),
  ]);

  // Create default categories if none exist
  if (categories.length === 0) {
    await createDefaultCategories();
  }

  // Refetch categories if we just created them
  const finalCategories = categories.length === 0 ? await getCategories() : categories;

  return (
    <>
      <PageHeader title="Transactions" description="View and categorise your transactions" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">Total income received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">Total spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.netCashFlow >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(summary.netCashFlow)}
              </div>
              <p className="text-xs text-muted-foreground">Income minus expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.transactionCount}</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <TransactionButtons accounts={accounts} categories={finalCategories} />
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>Search, filter, and categorise your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionsList
              transactions={transactions}
              accounts={accounts}
              categories={finalCategories}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
