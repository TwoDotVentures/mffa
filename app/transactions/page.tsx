import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionButtons } from '@/components/transactions/transaction-buttons';
import { TransactionsList } from '@/components/transactions/transactions-list';
import { getTransactions, getCategories, createDefaultCategories } from '@/lib/transactions/actions';
import { getAccounts } from '@/lib/accounts/actions';

export default async function TransactionsPage() {
  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
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
