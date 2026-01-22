'use client';

import { useState } from 'react';
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
import { MoreVertical, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { deleteBudget } from '@/lib/budgets/actions';
import type { BudgetProgress, Category } from '@/lib/types';
import { BUDGET_PERIOD_LABELS } from '@/lib/types';
import { BudgetDialog } from './budget-dialog';

interface BudgetCardProps {
  progress: BudgetProgress;
  categories: Category[];
}

export function BudgetCard({ progress, categories }: BudgetCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { budget, spent, remaining, percentage, isOverBudget, isApproachingLimit, daysRemaining, dailyAllowance } = progress;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    setDeleting(true);
    await deleteBudget(budget.id);
    router.refresh();
  };

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isApproachingLimit) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getStatusBadge = () => {
    if (isOverBudget) {
      return <Badge variant="destructive">Over Budget</Badge>;
    }
    if (isApproachingLimit) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Approaching Limit</Badge>;
    }
    return <Badge variant="outline" className="text-green-600">On Track</Badge>;
  };

  return (
    <>
      <Card className={isOverBudget ? 'border-red-200 dark:border-red-900' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{budget.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {budget.category_name || 'All expenses'} • {BUDGET_PERIOD_LABELS[budget.period]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{formatCurrency(spent)} spent</span>
              <span className="text-muted-foreground">of {formatCurrency(budget.amount)}</span>
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className="h-2"
              indicatorClassName={getProgressColor()}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{percentage.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Used</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                {formatCurrency(remaining)}
              </p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
          </div>

          {/* Daily Allowance */}
          {remaining > 0 && daysRemaining > 0 && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Daily allowance</p>
              <p className="text-lg font-semibold">{formatCurrency(dailyAllowance)}/day</p>
            </div>
          )}

          {/* Warning */}
          {isOverBudget && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span>Over budget by {formatCurrency(spent - budget.amount)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budget={budget}
        categories={categories}
      />
    </>
  );
}
