'use client';

import { BudgetCard } from './budget-card';
import type { BudgetProgress, Category } from '@/lib/types';

interface BudgetListProps {
  budgets: BudgetProgress[];
  categories: Category[];
}

export function BudgetList({ budgets, categories }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-lg font-medium text-muted-foreground">No budgets yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first budget to start tracking spending
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((progress) => (
        <BudgetCard
          key={progress.budget.id}
          progress={progress}
          categories={categories}
        />
      ))}
    </div>
  );
}
