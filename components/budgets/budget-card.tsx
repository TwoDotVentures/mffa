/**
 * Budget Card Component
 *
 * Displays individual budget progress with visual indicators.
 * Shows spending status, remaining allowance, and alerts.
 * Optimized for mobile viewing with touch-friendly controls.
 *
 * @component
 * @example
 * <BudgetCard progress={budgetProgress} categories={categories} />
 */
'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { deleteBudget } from '@/lib/budgets/actions';
import type { BudgetProgress, Category } from '@/lib/types';
import { BUDGET_PERIOD_LABELS } from '@/lib/types';
import { BudgetDialog } from './budget-dialog';

/** Props for the BudgetCard component */
interface BudgetCardProps {
  /** Budget progress data including spending and limits */
  progress: BudgetProgress;
  /** Available categories for editing */
  categories: Category[];
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

function BudgetCardComponent({ progress, categories }: BudgetCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    budget,
    spent,
    remaining,
    percentage,
    isOverBudget,
    isApproachingLimit,
    daysRemaining,
    dailyAllowance,
  } = progress;

  /**
   * Handles budget deletion with confirmation.
   * Shows loading state during deletion.
   */
  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    setDeleting(true);
    await deleteBudget(budget.id);
    router.refresh();
  }, [budget.id, router]);

  const handleOpenDialog = useCallback(() => setDialogOpen(true), []);

  /**
   * Returns the appropriate color class for the progress bar.
   * Red for over budget, amber for approaching, green for on track.
   */
  const progressColor = useMemo((): string => {
    if (isOverBudget) return 'bg-red-500';
    if (isApproachingLimit) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [isOverBudget, isApproachingLimit]);

  /**
   * Returns the status badge based on budget health.
   * Provides visual indicator of current budget status.
   */
  const statusBadge = useMemo(() => {
    if (isOverBudget) {
      return (
        <Badge variant="destructive" className="animate-pulse font-medium">
          Over Budget
        </Badge>
      );
    }
    if (isApproachingLimit) {
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        >
          Approaching
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
      >
        On Track
      </Badge>
    );
  }, [isOverBudget, isApproachingLimit]);

  return (
    <>
      {/*
        Card with conditional border color based on budget status.
        Hover state for desktop, always shows shadow for depth.
      */}
      <Card
        className={`group relative transition-all duration-300 hover:shadow-lg ${
          isOverBudget
            ? 'border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20'
            : isApproachingLimit
              ? 'border-amber-200 dark:border-amber-900'
              : 'hover:border-primary/30'
        } `}
      >
        {/* Card Header with Title and Actions */}
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Budget Name - Truncates on overflow */}
            <CardTitle className="line-clamp-1 text-base leading-tight font-semibold">
              {budget.name}
            </CardTitle>

            {/* Category and Period Info */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="max-w-[120px] truncate">
                {budget.category_name || 'All expenses'}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm">{BUDGET_PERIOD_LABELS[budget.period]}</span>
            </div>
          </div>

          {/* Status Badge and Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {statusBadge}

            {/* Dropdown Menu with 44px touch target */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted/80 h-10 w-10 shrink-0"
                  aria-label="Budget options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleOpenDialog} className="gap-2">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          {/* Progress Section */}
          <div className="space-y-3">
            {/* Amount Labels */}
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold tabular-nums">{formatCurrency(spent)}</span>
              <span className="text-muted-foreground text-sm">
                of {formatCurrency(budget.amount)}
              </span>
            </div>

            {/* Progress Bar - Taller for better visibility */}
            <div className="relative">
              <Progress
                value={Math.min(percentage, 100)}
                className="h-3 rounded-full"
                indicatorClassName={`${progressColor} rounded-full transition-all duration-500`}
              />

              {/* Over budget indicator line */}
              {isOverBudget && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-600 dark:bg-red-400"
                  style={{ left: `${(budget.amount / spent) * 100}%` }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          {/* Stats Grid - 3 columns on mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Percentage Used */}
            <div className="bg-muted/50 hover:bg-muted/80 rounded-lg p-3 text-center transition-colors">
              <div className="flex items-center justify-center gap-1">
                {percentage > 100 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                ) : percentage < 50 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                ) : null}
                <p className="text-xl font-bold tabular-nums sm:text-2xl">
                  {percentage.toFixed(0)}%
                </p>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-wider uppercase sm:text-xs">
                Used
              </p>
            </div>

            {/* Remaining Amount */}
            <div className="bg-muted/50 hover:bg-muted/80 rounded-lg p-3 text-center transition-colors">
              <p
                className={`text-xl font-bold tabular-nums sm:text-2xl ${
                  isOverBudget ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(Math.abs(remaining))}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-wider uppercase sm:text-xs">
                {isOverBudget ? 'Over' : 'Left'}
              </p>
            </div>

            {/* Days Remaining */}
            <div className="bg-muted/50 hover:bg-muted/80 rounded-lg p-3 text-center transition-colors">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                <p className="text-xl font-bold tabular-nums sm:text-2xl">{daysRemaining}</p>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-wider uppercase sm:text-xs">
                Days Left
              </p>
            </div>
          </div>

          {/* Daily Allowance - Only shown when there's remaining budget */}
          {remaining > 0 && daysRemaining > 0 && (
            <div className="from-primary/5 via-primary/10 to-primary/5 rounded-xl bg-gradient-to-r p-4 text-center">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Daily Allowance
              </p>
              <p className="text-primary mt-1 text-2xl font-bold">
                {formatCurrency(dailyAllowance)}
                <span className="text-muted-foreground text-base font-normal">/day</span>
              </p>
            </div>
          )}

          {/* Over Budget Warning */}
          {isOverBudget && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-950/50">
              <div className="shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-900/50">
                <AlertTriangle
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-red-700 dark:text-red-300">
                  Over budget by {formatCurrency(spent - budget.amount)}
                </p>
                <p className="mt-0.5 text-sm text-red-600/80 dark:text-red-400/80">
                  Consider adjusting spending or budget limit
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budget={budget}
        categories={categories}
      />
    </>
  );
}

// Memoize to prevent unnecessary re-renders when parent list updates
export const BudgetCard = memo(BudgetCardComponent);
