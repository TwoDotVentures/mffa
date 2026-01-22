'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Income,
  IncomeFormData,
  IncomeType,
  PersonType,
  TaxSummary,
  DeductionCategory,
} from '@/lib/types';
import { getCurrentFinancialYear, calculateTax } from './utils';

// ============================================
// Income CRUD Operations
// ============================================

/**
 * Get all income records for current user
 */
export async function getIncome(
  financialYear?: string,
  person?: PersonType
): Promise<Income[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const fy = financialYear || getCurrentFinancialYear();

  let query = supabase
    .from('income')
    .select('*')
    .eq('user_id', user.id)
    .eq('financial_year', fy)
    .order('date', { ascending: false });

  if (person) {
    query = query.eq('person', person);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching income:', error);
    return [];
  }
  return (data || []) as unknown as Income[];
}

/**
 * Get income by ID
 */
export async function getIncomeById(id: string): Promise<Income | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching income:', error);
    return null;
  }
  return data as unknown as Income;
}

/**
 * Add new income record
 */
export async function addIncome(
  formData: IncomeFormData
): Promise<{ success: boolean; error?: string; data?: Income }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const fy = getCurrentFinancialYear();

  const { data, error } = await supabase
    .from('income')
    .insert([
      {
        ...formData,
        user_id: user.id,
        financial_year: fy,
        franking_credits: formData.franking_credits || 0,
        tax_withheld: formData.tax_withheld || 0,
        is_taxable: formData.is_taxable ?? true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding income:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  return { success: true, data: data as unknown as Income };
}

/**
 * Update income record
 */
export async function updateIncome(
  id: string,
  formData: Partial<IncomeFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('income')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating income:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  return { success: true };
}

/**
 * Delete income record
 */
export async function deleteIncome(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('income')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting income:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  return { success: true };
}

// ============================================
// Income Summary & Analysis
// ============================================

/**
 * Get income summary by type for a person
 */
export async function getIncomeSummary(
  financialYear?: string,
  person?: PersonType
): Promise<{
  by_type: Record<IncomeType, number>;
  total: number;
  franking_credits: number;
  tax_withheld: number;
}> {
  const income = await getIncome(financialYear, person);

  const summary: {
    by_type: Record<IncomeType, number>;
    total: number;
    franking_credits: number;
    tax_withheld: number;
  } = {
    by_type: {
      salary: 0,
      bonus: 0,
      dividend: 0,
      trust_distribution: 0,
      rental: 0,
      interest: 0,
      capital_gain: 0,
      government_payment: 0,
      other: 0,
    },
    total: 0,
    franking_credits: 0,
    tax_withheld: 0,
  };

  for (const item of income) {
    if (item.is_taxable) {
      summary.by_type[item.income_type] += Number(item.amount);
      summary.total += Number(item.amount);
    }
    summary.franking_credits += Number(item.franking_credits || 0);
    summary.tax_withheld += Number(item.tax_withheld || 0);
  }

  return summary;
}

/**
 * Get complete tax summary for a person
 */
export async function getTaxSummary(
  financialYear?: string,
  person?: PersonType,
  hasHecsDebt: boolean = false,
  hasPrivateHealth: boolean = true
): Promise<TaxSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const fy = financialYear || getCurrentFinancialYear();
  const targetPerson = person || 'grant';

  // Get income summary
  const incomeData = await getIncome(fy, targetPerson);

  // Get deductions
  const { data: deductionsData } = await supabase
    .from('deductions')
    .select('*')
    .eq('user_id', user.id)
    .eq('financial_year', fy)
    .eq('person', targetPerson);

  const deductions = deductionsData || [];

  // Calculate income breakdown
  const incomeSummary = {
    salary: 0,
    dividends: 0,
    franking_credits: 0,
    trust_distributions: 0,
    rental: 0,
    capital_gains: 0,
    other: 0,
    total: 0,
  };

  let taxWithheld = 0;

  for (const item of incomeData) {
    const amount = Number(item.amount);
    if (!item.is_taxable) continue;

    switch (item.income_type) {
      case 'salary':
      case 'bonus':
        incomeSummary.salary += amount;
        break;
      case 'dividend':
        incomeSummary.dividends += amount;
        break;
      case 'trust_distribution':
        incomeSummary.trust_distributions += amount;
        break;
      case 'rental':
        incomeSummary.rental += amount;
        break;
      case 'capital_gain':
        incomeSummary.capital_gains += amount;
        break;
      default:
        incomeSummary.other += amount;
    }
    incomeSummary.franking_credits += Number(item.franking_credits || 0);
    taxWithheld += Number(item.tax_withheld || 0);
  }

  incomeSummary.total =
    incomeSummary.salary +
    incomeSummary.dividends +
    incomeSummary.trust_distributions +
    incomeSummary.rental +
    incomeSummary.capital_gains +
    incomeSummary.other;

  // Calculate deduction breakdown
  const deductionsByCategory: Record<DeductionCategory, number> = {
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

  let totalDeductions = 0;
  for (const d of deductions) {
    deductionsByCategory[d.category as DeductionCategory] += Number(d.amount);
    totalDeductions += Number(d.amount);
  }

  // Calculate tax
  const estimatedTax = calculateTax(
    incomeSummary.total,
    totalDeductions,
    incomeSummary.franking_credits,
    hasHecsDebt,
    hasPrivateHealth
  );

  // Estimated refund/owing (negative = refund)
  const estimatedRefundOrOwing = estimatedTax.net_tax_payable - taxWithheld;

  return {
    person: targetPerson,
    financial_year: fy,
    income: incomeSummary,
    deductions: {
      by_category: deductionsByCategory,
      total: totalDeductions,
    },
    tax_withheld: taxWithheld,
    estimated_tax: estimatedTax,
    estimated_refund_or_owing: estimatedRefundOrOwing,
  };
}

/**
 * Compare tax for both Grant and Shannon
 */
export async function getHouseholdTaxSummary(
  financialYear?: string
): Promise<{
  grant: TaxSummary | null;
  shannon: TaxSummary | null;
  combined_tax: number;
  combined_refund: number;
}> {
  const [grant, shannon] = await Promise.all([
    getTaxSummary(financialYear, 'grant'),
    getTaxSummary(financialYear, 'shannon'),
  ]);

  return {
    grant,
    shannon,
    combined_tax:
      (grant?.estimated_tax.net_tax_payable || 0) +
      (shannon?.estimated_tax.net_tax_payable || 0),
    combined_refund:
      (grant?.estimated_refund_or_owing || 0) +
      (shannon?.estimated_refund_or_owing || 0),
  };
}
