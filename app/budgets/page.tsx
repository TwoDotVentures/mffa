/**
 * Budgets Page - Mobile-First Budget Management
 *
 * Displays budget dashboard summary and individual budget cards with
 * progress tracking. Optimized for touch interactions and mobile viewing.
 *
 * @component
 * @example
 * // Accessible at /budgets route
 */

import { PageHeader } from '@/components/page-header';
import { BudgetDashboard } from '@/components/budgets/budget-dashboard';
import { BudgetList } from '@/components/budgets/budget-list';
import { AddBudgetButton } from '@/components/budgets/add-budget-button';
import { getBudgetSummary } from '@/lib/budgets/actions';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/types';

export default async function BudgetsPage() {
  const supabase = await createClient();

  // Get categories for the budget dialog
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('category_type', 'expense')
    .order('name');

  const summary = await getBudgetSummary();

  return (
    <>
      <PageHeader title="Budgets" description="Set spending limits and track your progress" />

      {/*
        Main content area with responsive padding.
        Uses safe-area-inset for notched devices.
      */}
      <main className="flex-1 space-y-4 p-4 pb-24 md:space-y-6 md:p-6 md:pb-6">
        {/* Dashboard Summary - Full width on all devices */}
        <BudgetDashboard summary={summary} />

        {/*
          Action Bar - Sticky on mobile for easy access.
          Add button is prominent and touch-friendly.
        */}
        <div className="flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-muted-foreground text-sm">
              {summary.budgets.length} active budget{summary.budgets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <AddBudgetButton categories={(categories || []) as Category[]} />
        </div>

        {/* Budget Cards Grid - Stacks on mobile, grid on larger screens */}
        <BudgetList budgets={summary.budgets} categories={(categories || []) as Category[]} />
      </main>

      {/*
        Mobile FAB (Floating Action Button) area preserved.
        Extra bottom padding ensures content isn't obscured.
      */}
    </>
  );
}
