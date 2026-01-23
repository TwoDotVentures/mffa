'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Deduction,
  DeductionFormData,
  DeductionCategory,
  DeductionInsert,
  PersonType,
  WFHCalculation,
} from '@/lib/types';
import type { Json } from '@/lib/supabase/database.types';
import {
  getCurrentFinancialYear,
  calculateWFHDeduction,
  WFH_RATE_PER_HOUR,
  shouldFlagDeduction,
} from './utils';

// ============================================
// Deduction CRUD Operations
// ============================================

/**
 * Get all deductions for current user
 */
export async function getDeductions(
  financialYear?: string,
  person?: PersonType
): Promise<Deduction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const fy = financialYear || getCurrentFinancialYear();

  let query = supabase
    .from('deductions')
    .select('*')
    .eq('user_id', user.id)
    .eq('financial_year', fy)
    .order('date', { ascending: false });

  if (person) {
    query = query.eq('person', person);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching deductions:', error);
    return [];
  }
  return (data || []) as unknown as Deduction[];
}

/**
 * Get deduction by ID
 */
export async function getDeductionById(id: string): Promise<Deduction | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('deductions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching deduction:', error);
    return null;
  }
  return data as unknown as Deduction;
}

/**
 * Add new deduction
 */
export async function addDeduction(
  formData: DeductionFormData
): Promise<{ success: boolean; error?: string; data?: Deduction; flagged?: { flag: boolean; reason?: string } }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const fy = getCurrentFinancialYear();

  // Check if deduction should be flagged for review
  const flagResult = shouldFlagDeduction(
    formData.category,
    formData.amount,
    !!formData.receipt_url
  );

  const insertData: DeductionInsert = {
    person: formData.person,
    category: formData.category,
    description: formData.description,
    amount: formData.amount,
    date: formData.date,
    user_id: user.id,
    financial_year: fy,
    is_approved: !flagResult.flag, // Auto-approve if not flagged
    receipt_url: formData.receipt_url || null,
    linked_transaction_id: formData.linked_transaction_id || null,
    calculation_method: formData.calculation_method || null,
    calculation_details: formData.calculation_details || null,
    notes: formData.notes || null,
  };

  const { data, error } = await supabase
    .from('deductions')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error adding deduction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  return { success: true, data: data as unknown as Deduction, flagged: flagResult };
}

/**
 * Update deduction
 */
export async function updateDeduction(
  id: string,
  formData: Partial<DeductionFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const updateData: Partial<DeductionInsert> & { updated_at: string } = {
    ...formData,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('deductions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating deduction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  return { success: true };
}

/**
 * Delete deduction
 */
export async function deleteDeduction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('deductions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting deduction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  return { success: true };
}

/**
 * Approve a flagged deduction
 */
export async function approveDeduction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return updateDeduction(id, { is_approved: true } as unknown as Partial<DeductionFormData>);
}

// ============================================
// Work From Home Deduction
// ============================================

/**
 * Add work from home deduction with automatic calculation
 */
export async function addWFHDeduction(
  person: PersonType,
  hours: number,
  periodStart: string,
  periodEnd: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: Deduction; calculation?: WFHCalculation }> {
  const calculation = calculateWFHDeduction(hours, periodStart, periodEnd);

  const result = await addDeduction({
    person,
    category: 'work_from_home',
    description: `WFH: ${hours} hours @ $${WFH_RATE_PER_HOUR}/hr`,
    amount: calculation.total_deduction,
    date: periodEnd,
    calculation_method: 'fixed_rate',
    calculation_details: calculation as unknown as Json,
    notes: notes || `Period: ${periodStart} to ${periodEnd}`,
  });

  return { ...result, data: result.data as unknown as Deduction, calculation };
}

// ============================================
// Deduction Summary & Analysis
// ============================================

/**
 * Get deduction summary by category
 */
export async function getDeductionSummary(
  financialYear?: string,
  person?: PersonType
): Promise<{
  by_category: Record<DeductionCategory, number>;
  total: number;
  flagged_count: number;
  pending_approval: Deduction[];
}> {
  const deductions = await getDeductions(financialYear, person);

  const byCategory: Record<DeductionCategory, number> = {
    work_from_home: 0,
    vehicle: 0,
    travel: 0,
    clothing_laundry: 0,
    self_education: 0,
    tools_equipment: 0,
    professional_subscriptions: 0,
    union_fees: 0,
    phone_internet: 0,
    donations: 0,
    income_protection: 0,
    tax_agent_fees: 0,
    investment_expenses: 0,
    rental_property: 0,
    other: 0,
  };

  let total = 0;
  const pendingApproval: Deduction[] = [];

  for (const d of deductions) {
    byCategory[d.category as DeductionCategory] += Number(d.amount);
    total += Number(d.amount);
    if (!d.is_approved) {
      pendingApproval.push(d);
    }
  }

  return {
    by_category: byCategory,
    total,
    flagged_count: pendingApproval.length,
    pending_approval: pendingApproval,
  };
}

/**
 * Get total WFH hours claimed for the year
 */
export async function getWFHSummary(
  financialYear?: string,
  person?: PersonType
): Promise<{ total_hours: number; total_deduction: number }> {
  const deductions = await getDeductions(financialYear, person);

  let totalHours = 0;
  let totalDeduction = 0;

  for (const d of deductions) {
    if (d.category === 'work_from_home' && d.calculation_details) {
      const details = d.calculation_details as unknown as WFHCalculation;
      totalHours += details.hours || 0;
      totalDeduction += Number(d.amount);
    }
  }

  return {
    total_hours: totalHours,
    total_deduction: totalDeduction,
  };
}

/**
 * Suggest deductions from transaction categories
 * (For future AI integration - flag potential deductible transactions)
 */
export async function suggestDeductionsFromTransactions(): Promise<{
  suggestions: Array<{
    transaction_id: string;
    category: DeductionCategory;
    description: string;
    amount: number;
    confidence: number;
  }>;
}> {
  // TODO: Implement AI-powered deduction suggestions based on transaction patterns
  // This will analyze transactions and suggest potential deductions
  return { suggestions: [] };
}
