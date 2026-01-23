/**
 * @fileoverview Server actions for managing budgets and tracking spending.
 * Provides CRUD operations, progress tracking, and budget alerts.
 * @module lib/budgets/actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Budget, BudgetFormData, BudgetProgress, BudgetSummary, Transaction } from '@/lib/types';

// ============================================
// Budget CRUD Operations
// ============================================

/**
 * Retrieves all active budgets for the current user with category information.
 *
 * @returns Promise resolving to an array of Budget objects
 */
export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
  return (data || []) as unknown as Budget[];
}

/**
 * Retrieves a single budget by ID with category information.
 *
 * @param id - The UUID of the budget to retrieve
 * @returns Promise resolving to the Budget object or null if not found
 */
export async function getBudget(id: string): Promise<Budget | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
  return data as unknown as Budget;
}

/**
 * Creates a new budget with the provided form data.
 * Automatically looks up the category name if a category_id is provided.
 *
 * @param formData - The budget data including name, amount, period, and category
 * @returns Promise resolving to success status and optional error message
 */
export async function createBudget(formData: BudgetFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get category name for fallback
  let categoryName = null;
  if (formData.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', formData.category_id)
      .single();
    categoryName = category?.name;
  }

  const { error } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      name: formData.name,
      category_id: formData.category_id || null,
      category_name: categoryName,
      amount: formData.amount,
      period: formData.period,
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      end_date: formData.end_date || null,
      alert_threshold: formData.alert_threshold ?? 80,
      alert_enabled: formData.alert_enabled ?? true,
      notes: formData.notes || null,
    });

  if (error) {
    console.error('Error creating budget:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/budgets');
  return { success: true };
}

/**
 * Updates an existing budget with new data.
 *
 * @param id - The UUID of the budget to update
 * @param formData - The updated budget data
 * @returns Promise resolving to success status and optional error message
 */
export async function updateBudget(
  id: string,
  formData: Partial<BudgetFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get category name if category_id is being updated
  let updateData: Record<string, unknown> = { ...formData };
  if (formData.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', formData.category_id)
      .single();
    updateData.category_name = category?.name;
  }

  const { error } = await supabase
    .from('budgets')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating budget:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/budgets');
  return { success: true };
}

/**
 * Soft-deletes a budget by setting is_active to false.
 *
 * @param id - The UUID of the budget to delete
 * @returns Promise resolving to success status and optional error message
 */
export async function deleteBudget(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Soft delete
  const { error } = await supabase
    .from('budgets')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting budget:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/budgets');
  return { success: true };
}

// ============================================
// Budget Progress Tracking
// ============================================

/**
 * Calculate period dates based on budget period type
 */
function calculatePeriodDates(period: string): { startDate: string; endDate: string; daysRemaining: number } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'weekly': {
      // Start of current week (Monday)
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    }
    case 'fortnightly': {
      // Start of current fortnight (approximation based on year start)
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const weeksSinceYearStart = Math.floor((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const fortnightsElapsed = Math.floor(weeksSinceYearStart / 2);
      startDate = new Date(yearStart);
      startDate.setDate(yearStart.getDate() + fortnightsElapsed * 14);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
      break;
    }
    case 'monthly': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      break;
    }
    case 'yearly': {
      // Australian Financial Year (July-June)
      const fyYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(fyYear, 6, 1); // 1 July
      endDate = new Date(fyYear + 1, 5, 30); // 30 June
      break;
    }
    default: {
      // Default to monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
  }

  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    daysRemaining,
  };
}

/**
 * Calculates the current progress for a specific budget.
 * Computes spent amount, remaining budget, percentage used, and daily allowance.
 *
 * @param budgetId - The UUID of the budget to calculate progress for
 * @returns Promise resolving to BudgetProgress object or null if not found
 */
export async function getBudgetProgress(budgetId: string): Promise<BudgetProgress | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get budget
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('id', budgetId)
    .single();

  if (budgetError || !budget) {
    console.error('Error fetching budget:', budgetError);
    return null;
  }

  // Calculate period dates
  const { startDate, endDate, daysRemaining } = calculatePeriodDates(budget.period);

  // Get transactions for this period and category
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .lt('amount', 0); // Expenses only (negative amounts)

  if (budget.category_id) {
    query = query.eq('category_id', budget.category_id);
  }

  const { data: transactions, error: txError } = await query.order('date', { ascending: false });

  if (txError) {
    console.error('Error fetching transactions:', txError);
    return null;
  }

  // Calculate totals
  type TxRec = { amount: number };
  const spent = Math.abs((transactions || []).reduce((sum: number, t: TxRec) => sum + t.amount, 0));
  const remaining = Math.max(0, budget.amount - spent);
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;

  return {
    budget: budget as unknown as Budget,
    spent,
    remaining,
    percentage,
    isOverBudget: spent > budget.amount,
    isApproachingLimit: percentage >= (budget.alert_threshold || 80) && percentage < 100,
    transactions: (transactions || []) as unknown as Transaction[],
    daysRemaining,
    dailyAllowance,
  };
}

/**
 * Retrieves a summary of all budgets including totals and alert counts.
 *
 * @returns Promise resolving to BudgetSummary with aggregated budget data
 */
export async function getBudgetSummary(): Promise<BudgetSummary> {
  const budgets = await getBudgets();

  if (budgets.length === 0) {
    return {
      totalBudgeted: 0,
      totalSpent: 0,
      totalRemaining: 0,
      budgets: [],
      overBudgetCount: 0,
      approachingLimitCount: 0,
    };
  }

  const budgetProgressPromises = budgets.map(b => getBudgetProgress(b.id));
  const progressResults = await Promise.all(budgetProgressPromises);
  const budgetProgress = progressResults.filter((p): p is BudgetProgress => p !== null);

  const totalBudgeted = budgetProgress.reduce((sum, p) => sum + p.budget.amount, 0);
  const totalSpent = budgetProgress.reduce((sum, p) => sum + p.spent, 0);
  const overBudgetCount = budgetProgress.filter(p => p.isOverBudget).length;
  const approachingLimitCount = budgetProgress.filter(p => p.isApproachingLimit).length;

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining: Math.max(0, totalBudgeted - totalSpent),
    budgets: budgetProgress,
    overBudgetCount,
    approachingLimitCount,
  };
}

// ============================================
// Budget Alerts
// ============================================

/**
 * Checks all budgets and creates notifications for those approaching or exceeding limits.
 *
 * @returns Promise that resolves when all alerts have been processed
 */
export async function checkBudgetAlerts(): Promise<void> {
  const summary = await getBudgetSummary();

  for (const progress of summary.budgets) {
    if (progress.isOverBudget || progress.isApproachingLimit) {
      // Create notification if approaching limit or over budget
      await createBudgetNotification(progress);
    }
  }
}

/**
 * Creates a notification for a budget that is approaching or over its limit.
 * Only creates one notification per budget per day.
 *
 * @param progress - The BudgetProgress object containing budget status
 */
async function createBudgetNotification(progress: BudgetProgress): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if we already sent a notification for this budget today
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('notification_type', 'budget_alert')
    .eq('related_entity_id', progress.budget.id)
    .gte('created_at', today)
    .single();

  if (existing) return; // Already notified today

  const isOverBudget = progress.isOverBudget;
  const title = isOverBudget ? 'Budget Exceeded' : 'Budget Alert';
  const priority = isOverBudget ? 'urgent' : 'high';
  const message = isOverBudget
    ? `${progress.budget.name} is ${progress.percentage.toFixed(0)}% spent - over budget by $${(progress.spent - progress.budget.amount).toFixed(0)}`
    : `${progress.budget.name} is at ${progress.percentage.toFixed(0)}% - $${progress.remaining.toFixed(0)} remaining`;

  await supabase.from('notifications').insert({
    user_id: user.id,
    title,
    message,
    notification_type: 'budget_alert',
    priority,
    link_url: '/budgets',
    related_entity_type: 'budget',
    related_entity_id: progress.budget.id,
    metadata: {
      percentage: progress.percentage,
      spent: progress.spent,
      budgeted: progress.budget.amount,
    },
  });
}
