/**
 * Dashboard Skeleton
 *
 * Loading skeleton for the dashboard page.
 * Provides visual feedback while data is being fetched.
 * Matches the layout of the actual dashboard content.
 *
 * @module components/dashboard/dashboard-skeleton
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton component for summary cards
 * Animated placeholder matching the summary card layout
 */
function SummaryCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for transaction list items
 */
function TransactionItemSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/**
 * Main dashboard skeleton component
 * Displays animated placeholders for all dashboard sections
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Skeleton className="h-12 sm:h-14 rounded-lg" />
            <Skeleton className="h-12 sm:h-14 rounded-lg" />
            <Skeleton className="h-12 sm:h-14 rounded-lg" />
            <Skeleton className="h-12 sm:h-14 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
        {/* Recent Transactions Skeleton */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-20" />
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
              <TransactionItemSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* AI Accountant Skeleton */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
