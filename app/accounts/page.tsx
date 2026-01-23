/**
 * Accounts Page
 *
 * Displays financial accounts with summary cards and a detailed list.
 * Features mobile-first responsive design with:
 * - Summary cards: 1 col mobile, 2 col tablet, 4 col desktop
 * - Touch-friendly interactions
 * - Proper visual hierarchy
 *
 * @module app/accounts/page
 */

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { AddAccountButton } from '@/components/accounts/add-account-button';
import { AccountsList } from '@/components/accounts/accounts-list';
import { getAccounts, getAccountsSummary } from '@/lib/accounts/actions';
import { Wallet, CreditCard, TrendingUp, PiggyBank } from 'lucide-react';

/**
 * Formats a number as Australian currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
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

      <main className="flex-1 space-y-4 p-4 sm:space-y-6 md:p-6">
        {/*
          Summary Cards Grid
          - 1 column on mobile for full-width cards
          - 2 columns on tablet for paired viewing
          - 4 columns on desktop for dashboard layout
        */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value={formatCurrency(summary.totalBalance)}
            description="Across all asset accounts"
            icon={Wallet}
            iconClassName="text-emerald-600 dark:text-emerald-400"
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />

          <StatCard
            title="Total Debt"
            value={formatCurrency(summary.totalDebt)}
            description="Credit cards and loans"
            icon={CreditCard}
            iconClassName="text-rose-600 dark:text-rose-400"
            valueClassName="text-rose-600 dark:text-rose-400"
          />

          <StatCard
            title="Net Position"
            value={formatCurrency(summary.netPosition)}
            description="Assets minus liabilities"
            icon={TrendingUp}
            iconClassName="text-blue-600 dark:text-blue-400"
            valueClassName={
              summary.netPosition >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }
          />

          <StatCard
            title="Accounts"
            value={summary.accountCount.toString()}
            description="Active accounts"
            icon={PiggyBank}
            iconClassName="text-violet-600 dark:text-violet-400"
          />
        </div>

        {/*
          Accounts List Section
          - Floating action button position on mobile
          - Card-based layout with proper spacing
        */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">Your Accounts</CardTitle>
              <CardDescription className="text-sm">
                Bank accounts, credit cards, and investment accounts
              </CardDescription>
            </div>
            {/* Add button positioned in header on desktop, prominent on mobile */}
            <div className="shrink-0">
              <AddAccountButton />
            </div>
          </CardHeader>

          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <AccountsList accounts={accounts} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
