/**
 * Budget Dashboard Component
 *
 * Displays a summary of all budgets with key metrics.
 * Responsive grid layout adapts from 2 columns on mobile to 4 on desktop.
 * Provides at-a-glance view of overall financial health.
 *
 * @component
 * @example
 * <BudgetDashboard summary={budgetSummary} />
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingDown, AlertTriangle, CheckCircle, Wallet, Target } from 'lucide-react';
import type { BudgetSummary } from '@/lib/types';

/** Props for the BudgetDashboard component */
interface BudgetDashboardProps {
  /** Summary data containing totals and budget status counts */
  summary: BudgetSummary;
}

/**
 * Formats a number as Australian currency.
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function BudgetDashboard({ summary }: BudgetDashboardProps) {
  /**
   * Calculate overall budget utilization percentage.
   * Returns 0 if no budget is set to avoid division by zero.
   */
  const overallPercentage =
    summary.totalBudgeted > 0 ? (summary.totalSpent / summary.totalBudgeted) * 100 : 0;

  /**
   * Determines overall budget health status.
   * - 'over': One or more budgets exceeded
   * - 'warning': One or more budgets approaching limit
   * - 'good': All budgets on track
   */
  const getOverallStatus = (): 'over' | 'warning' | 'good' => {
    if (summary.overBudgetCount > 0) return 'over';
    if (summary.approachingLimitCount > 0) return 'warning';
    return 'good';
  };

  const status = getOverallStatus();

  /**
   * Returns the appropriate color class based on status.
   */
  const getProgressColor = (): string => {
    if (status === 'over') return 'bg-red-500';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <>
      {/*
        Dashboard Grid - Responsive layout:
        Mobile: 2 columns for compact view
        Tablet: 2 columns
        Desktop: 4 columns for full overview
      */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Budgeted Card */}
        <Card className="group hover:border-primary/20 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
              Total Budget
            </CardTitle>
            <div className="bg-primary/10 group-hover:bg-primary/20 rounded-full p-2 transition-colors">
              <Wallet className="text-primary h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatCurrency(summary.totalBudgeted)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              <span className="text-foreground font-medium">{summary.budgets.length}</span> active
              budget{summary.budgets.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Total Spent Card with Progress */}
        <Card className="group hover:border-primary/20 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
              Total Spent
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2 transition-colors group-hover:bg-blue-500/20">
              <TrendingDown className="h-4 w-4 text-blue-500" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatCurrency(summary.totalSpent)}
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-2 space-y-1.5">
              <Progress
                value={Math.min(overallPercentage, 100)}
                className="h-2"
                indicatorClassName={`${getProgressColor()} transition-all duration-500`}
              />
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span className="font-medium tabular-nums">{overallPercentage.toFixed(0)}%</span>
                <span>of budget</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Budget Card */}
        <Card className="group hover:border-primary/20 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
              Remaining
            </CardTitle>
            <div
              className={`rounded-full p-2 transition-colors ${
                summary.totalRemaining > 0
                  ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                  : 'bg-red-500/10 group-hover:bg-red-500/20'
              }`}
            >
              {summary.totalRemaining > 0 ? (
                <Target className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold tabular-nums sm:text-2xl ${
                summary.totalRemaining > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500'
              }`}
            >
              {formatCurrency(Math.abs(summary.totalRemaining))}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {summary.totalRemaining > 0 ? 'Available to spend' : 'Over total budget'}
            </p>
          </CardContent>
        </Card>

        {/* Alerts Card */}
        <Card
          className={`group transition-all duration-300 hover:shadow-md ${
            summary.overBudgetCount > 0
              ? 'border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20'
              : summary.approachingLimitCount > 0
                ? 'border-amber-200 dark:border-amber-900'
                : 'hover:border-primary/20'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase sm:text-sm">
              Alerts
            </CardTitle>
            <div
              className={`rounded-full p-2 transition-colors ${
                summary.overBudgetCount > 0
                  ? 'bg-red-500/10 group-hover:bg-red-500/20'
                  : summary.approachingLimitCount > 0
                    ? 'bg-amber-500/10 group-hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
              }`}
            >
              {summary.overBudgetCount > 0 || summary.approachingLimitCount > 0 ? (
                <AlertTriangle
                  className={`h-4 w-4 ${
                    summary.overBudgetCount > 0 ? 'text-red-500' : 'text-amber-500'
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Over Budget Count */}
              {summary.overBudgetCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-red-500 tabular-nums sm:text-2xl">
                    {summary.overBudgetCount}
                  </span>
                  <span className="text-sm text-red-600 dark:text-red-400">over budget</span>
                </div>
              )}

              {/* Approaching Limit Count */}
              {summary.approachingLimitCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-amber-500 tabular-nums sm:text-2xl">
                    {summary.approachingLimitCount}
                  </span>
                  <span className="text-sm text-amber-600 dark:text-amber-400">near limit</span>
                </div>
              )}

              {/* All Good Message */}
              {summary.overBudgetCount === 0 && summary.approachingLimitCount === 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    All on track
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
