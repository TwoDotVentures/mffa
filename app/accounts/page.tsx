import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddAccountButton } from '@/components/accounts/add-account-button';
import { AccountsList } from '@/components/accounts/accounts-list';
import { getAccounts, getAccountsSummary } from '@/lib/accounts/actions';
import { Wallet, CreditCard, TrendingUp, DollarSign } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export default async function AccountsPage() {
  const [accounts, summary] = await Promise.all([getAccounts(), getAccountsSummary()]);

  return (
    <>
      <PageHeader title="Accounts" description="Manage your bank accounts and cards" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Across all asset accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalDebt)}
              </div>
              <p className="text-xs text-muted-foreground">Credit cards and loans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Position</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.netPosition >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(summary.netPosition)}
              </div>
              <p className="text-xs text-muted-foreground">Assets minus liabilities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.accountCount}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        <div className="flex justify-end">
          <AddAccountButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
            <CardDescription>Bank accounts, credit cards, and investment accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountsList accounts={accounts} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
