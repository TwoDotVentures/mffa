/**
 * Dashboard Content
 *
 * Server component that fetches and displays the main dashboard content.
 * Features comprehensive financial overview with:
 * - Summary cards with net worth, SMSF, trust, and account metrics
 * - Recent transactions list
 * - Quick action buttons
 * - AI Accountant chat preview
 *
 * @module components/dashboard/dashboard-content
 */

import { getAccountsSummary, getAccounts } from '@/lib/accounts/actions';
import { getTransactions } from '@/lib/transactions/actions';
import { SummaryCards } from './summary-cards';
import { RecentTransactions } from './recent-transactions';
import { QuickActions } from './quick-actions';
import { AiAccountantPreview } from './ai-accountant-preview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Main dashboard content component
 * Fetches all required data and renders dashboard sections
 */
export async function DashboardContent() {
  // Fetch all dashboard data in parallel
  const [summary, accounts, transactions] = await Promise.all([
    getAccountsSummary(),
    getAccounts(),
    getTransactions(),
  ]);

  // Get the 5 most recent transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards - responsive grid */}
      <SummaryCards summary={summary} accountCount={accounts.length} />

      {/* Quick Actions - large touch targets for mobile */}
      <QuickActions />

      {/* Main Content Grid - stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
        {/* Recent Transactions - takes more space on desktop */}
        <RecentTransactions transactions={recentTransactions} />

        {/* AI Accountant Preview - collapsible on mobile */}
        <AiAccountantPreview />
      </div>
    </div>
  );
}
