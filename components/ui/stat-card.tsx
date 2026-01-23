import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  /** The title displayed in the card header */
  title: string;
  /** The main value to display (typically formatted number or currency) */
  value: React.ReactNode;
  /** Optional description text below the value */
  description?: string;
  /** Icon component from lucide-react */
  icon?: LucideIcon;
  /** Optional icon color class (e.g., 'text-green-600' or 'text-muted-foreground') */
  iconClassName?: string;
  /** Optional value color class (e.g., 'text-green-600' for positive amounts) */
  valueClassName?: string;
  /** Optional trend indicator: 'up', 'down', or custom ReactNode */
  trend?: 'up' | 'down' | React.ReactNode;
  /** Optional trend value (e.g., '+12%' or '-5%') */
  trendValue?: string;
  /** Optional className for the Card container */
  className?: string;
  /** Optional children to render below the description */
  children?: React.ReactNode;
}

/**
 * StatCard - A reusable card component for displaying statistics.
 *
 * Used across Dashboard, Accounts, Tax, and Budgets pages for consistent stat display.
 *
 * @example
 * // Basic usage
 * <StatCard
 *   title="Net Worth"
 *   value="$125,000.00"
 *   description="Total assets minus liabilities"
 *   icon={DollarSign}
 * />
 *
 * @example
 * // With trend and custom colors
 * <StatCard
 *   title="Monthly Income"
 *   value="$8,500.00"
 *   valueClassName="text-green-600"
 *   description="+12% from last month"
 *   icon={TrendingUp}
 *   iconClassName="text-green-600"
 *   trend="up"
 * />
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = 'text-muted-foreground',
  valueClassName,
  trend,
  trendValue,
  className,
  children,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn('h-4 w-4', iconClassName)} />}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', valueClassName)}>{value}</div>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
        {(trend || trendValue) && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {typeof trend === 'string' ? (
              <span
                className={cn(
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600'
                )}
              >
                {trend === 'up' ? '↑' : '↓'}
              </span>
            ) : (
              trend
            )}
            {trendValue && <span className="text-muted-foreground">{trendValue}</span>}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
