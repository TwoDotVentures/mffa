'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import type { BudgetSummary } from '@/lib/types';

interface BudgetDashboardProps {
  summary: BudgetSummary;
}

export function BudgetDashboard({ summary }: BudgetDashboardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const overallPercentage = summary.totalBudgeted > 0
    ? (summary.totalSpent / summary.totalBudgeted) * 100
    : 0;

  const getOverallStatus = () => {
    if (summary.overBudgetCount > 0) return 'over';
    if (summary.approachingLimitCount > 0) return 'warning';
    return 'good';
  };

  const status = getOverallStatus();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Budgeted */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalBudgeted)}</div>
          <p className="text-xs text-muted-foreground">
            Across {summary.budgets.length} budget{summary.budgets.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalSpent)}</div>
          <div className="mt-2 space-y-1">
            <Progress
              value={Math.min(overallPercentage, 100)}
              className="h-2"
              indicatorClassName={
                status === 'over' ? 'bg-red-500' :
                status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
              }
            />
            <p className="text-xs text-muted-foreground">
              {overallPercentage.toFixed(0)}% of total budget
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <CheckCircle className={`h-4 w-4 ${summary.totalRemaining > 0 ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.totalRemaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(summary.totalRemaining)}
          </div>
          <p className="text-xs text-muted-foreground">
            Available to spend
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className={summary.overBudgetCount > 0 ? 'border-red-200 dark:border-red-900' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${
            summary.overBudgetCount > 0 ? 'text-red-500' :
            summary.approachingLimitCount > 0 ? 'text-amber-500' : 'text-green-500'
          }`} />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary.overBudgetCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-500">{summary.overBudgetCount}</span>
                <span className="text-sm text-red-500">over budget</span>
              </div>
            )}
            {summary.approachingLimitCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-500">{summary.approachingLimitCount}</span>
                <span className="text-sm text-amber-500">approaching limit</span>
              </div>
            )}
            {summary.overBudgetCount === 0 && summary.approachingLimitCount === 0 && (
              <div className="text-2xl font-bold text-green-600">All on track</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
