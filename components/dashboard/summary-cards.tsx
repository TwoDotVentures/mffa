/**
 * Summary Cards Component
 *
 * Displays key financial metrics in a responsive card grid.
 * Layout adapts to screen size:
 * - Mobile: 1 column (full-width cards)
 * - Tablet: 2 columns (paired viewing)
 * - Desktop: 4 columns (dashboard layout)
 *
 * Features:
 * - Large, readable numbers
 * - Color-coded values (green=positive, red=negative)
 * - Subtle hover effects and gradient overlays
 * - Entrance animations
 *
 * @module components/dashboard/summary-cards
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Wallet, PiggyBank, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the SummaryCards component
 */
interface SummaryCardsProps {
  /** Account summary data */
  summary: {
    totalBalance: number;
    totalDebt: number;
    netPosition: number;
    accountCount: number;
  };
  /** Number of connected accounts */
  accountCount: number;
}

/**
 * Formats a number as Australian currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Props for individual summary card
 */
interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  valueClassName?: string;
  animationDelay?: string;
}

/**
 * Individual summary card with animation and styling
 */
function SummaryCard({
  title,
  value,
  description,
  icon,
  valueClassName = '',
  animationDelay = '0ms',
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:-translate-y-0.5',
        'animate-in fade-in slide-in-from-bottom-4',
      )}
      style={{ animationDelay, animationDuration: '500ms', animationFillMode: 'both' }}
    >
      {/* Subtle gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 pointer-events-none" />

      {/* Decorative accent line */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        valueClassName.includes('emerald') && 'bg-gradient-to-r from-emerald-500/50 to-emerald-600/50',
        valueClassName.includes('rose') && 'bg-gradient-to-r from-rose-500/50 to-rose-600/50',
        valueClassName.includes('blue') && 'bg-gradient-to-r from-blue-500/50 to-blue-600/50',
        valueClassName.includes('violet') && 'bg-gradient-to-r from-violet-500/50 to-violet-600/50',
        !valueClassName && 'bg-gradient-to-r from-primary/30 to-primary/50',
      )} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
        <CardTitle className="text-sm font-medium tracking-tight text-muted-foreground">
          {title}
        </CardTitle>
        {/* Icon with subtle background circle */}
        <div className={cn(
          'rounded-full p-2.5 transition-colors',
          'bg-muted/50 dark:bg-muted/30',
        )}>
          {icon}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Large value with responsive sizing */}
        <div className={cn(
          'text-2xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold tracking-tight',
          'transition-colors',
          valueClassName || 'text-foreground',
        )}>
          {value}
        </div>
        {/* Description with muted styling */}
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Summary cards grid component
 * Displays 4 key financial metrics in responsive layout
 */
export function SummaryCards({ summary, accountCount }: SummaryCardsProps) {
  const netPositionIsPositive = summary.netPosition >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <SummaryCard
        title="Net Worth"
        value={formatCurrency(summary.netPosition)}
        description={netPositionIsPositive ? 'Looking healthy' : 'Time to save more'}
        icon={
          netPositionIsPositive ? (
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
          )
        }
        valueClassName={
          netPositionIsPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }
        animationDelay="0ms"
      />

      <SummaryCard
        title="Total Assets"
        value={formatCurrency(summary.totalBalance)}
        description="Across all accounts"
        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />}
        valueClassName="text-blue-600 dark:text-blue-400"
        animationDelay="50ms"
      />

      <SummaryCard
        title="Total Debt"
        value={formatCurrency(summary.totalDebt)}
        description="Credit cards & loans"
        icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />}
        valueClassName="text-rose-600 dark:text-rose-400"
        animationDelay="100ms"
      />

      <SummaryCard
        title="Accounts"
        value={accountCount.toString()}
        description={accountCount === 0 ? 'Add your first account' : 'Active accounts'}
        icon={<PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />}
        valueClassName="text-violet-600 dark:text-violet-400"
        animationDelay="150ms"
      />
    </div>
  );
}
