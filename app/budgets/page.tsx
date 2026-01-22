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
      <PageHeader
        title="Budgets"
        description="Set spending limits and track your progress"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {/* Dashboard Summary */}
        <BudgetDashboard summary={summary} />

        {/* Add Button */}
        <div className="flex justify-end">
          <AddBudgetButton categories={(categories || []) as Category[]} />
        </div>

        {/* Budget Cards */}
        <BudgetList budgets={summary.budgets} categories={(categories || []) as Category[]} />
      </main>
    </>
  );
}
