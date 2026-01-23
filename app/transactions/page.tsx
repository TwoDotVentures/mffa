/**
 * Transactions Page
 *
 * Main transactions management page with full-featured list view,
 * filtering, bulk editing, and category management.
 *
 * OPTIMIZED: Uses paginated data fetching with infinite scroll.
 * Initial load fetches first 100 transactions for fast page load.
 *
 * @mobile Optimized for iPhone 17 Pro and all mobile devices
 * @responsive Full responsive layout with card-based mobile view
 */
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { TransactionButtons } from '@/components/transactions/transaction-buttons';
import { TransactionsList } from '@/components/transactions/transactions-list';
import { getPaginatedTransactions, getCategories, createDefaultCategories, getChartSummaryData } from '@/lib/transactions/actions';
import { getAccounts } from '@/lib/accounts/actions';

/**
 * Gets the current Australian financial year dates (July 1 - June 30)
 */
function getCurrentFinancialYear(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  let fyStartYear = now.getFullYear();

  // If before July, we're in the FY that started last year
  if (now.getMonth() < 6) {
    fyStartYear -= 1;
  }

  const from = new Date(fyStartYear, 6, 1); // July 1
  const to = new Date(fyStartYear + 1, 5, 30); // June 30 next year

  return {
    dateFrom: from.toISOString().split('T')[0],
    dateTo: to.toISOString().split('T')[0],
  };
}

export default async function TransactionsPage() {
  // Get default date range (current financial year) to match client-side defaults
  const defaultDateRange = getCurrentFinancialYear();

  // Fetch initial paginated transactions (100 items), chart summary, and metadata in parallel
  // Apply the default "this-fy" filter to match client-side default state
  const [paginatedResult, chartSummary, accounts, categories] = await Promise.all([
    getPaginatedTransactions({ page: 1, limit: 100, ...defaultDateRange }),
    getChartSummaryData(defaultDateRange), // Get summary for current FY
    getAccounts(),
    getCategories(),
  ]);

  // Create default categories if none exist (only runs on first setup)
  let finalCategories = categories;
  if (categories.length === 0) {
    await createDefaultCategories();
    finalCategories = await getCategories();
  }

  return (
    <>
      {/* Compact header with integrated actions */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Transactions</h1>
        <div className="flex-1" />
        <TransactionButtons accounts={accounts} categories={finalCategories} />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <NotificationBell />
      </header>

      {/* Content area - no redundant card wrapper */}
      <main className="flex-1 p-4 md:p-6">
        <TransactionsList
          initialTransactions={paginatedResult.data}
          initialTotalCount={paginatedResult.totalCount}
          initialHasMore={paginatedResult.hasMore}
          initialChartSummary={chartSummary}
          accounts={accounts}
          categories={finalCategories}
        />
      </main>
    </>
  );
}
