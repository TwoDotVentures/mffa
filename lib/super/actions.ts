'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  SuperContribution,
  SuperContributionFormData,
  SuperContributionType,
  SuperAccount,
  SuperContributionSummary,
  PersonType,
} from '@/lib/types';
import {
  getCurrentFinancialYear,
  getContributionCaps,
  isConcessional,
  checkDivision293,
  canUseBringForward,
} from './utils';

// ============================================
// Super Contribution CRUD Operations
// ============================================

/**
 * Get all super contributions for current user
 */
export async function getSuperContributions(
  financialYear?: string,
  person?: Exclude<PersonType, 'joint'>
): Promise<SuperContribution[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const fy = financialYear || getCurrentFinancialYear();

  let query = supabase
    .from('super_contributions')
    .select('*')
    .eq('user_id', user.id)
    .eq('financial_year', fy)
    .order('date', { ascending: false });

  if (person) {
    query = query.eq('person', person);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching super contributions:', error);
    return [];
  }
  return (data || []) as unknown as SuperContribution[];
}

/**
 * Get contribution by ID
 */
export async function getSuperContributionById(
  id: string
): Promise<SuperContribution | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('super_contributions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching super contribution:', error);
    return null;
  }
  return data as unknown as SuperContribution;
}

/**
 * Add new super contribution
 */
export async function addSuperContribution(
  formData: SuperContributionFormData
): Promise<{ success: boolean; error?: string; data?: SuperContribution; warnings?: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const fy = getCurrentFinancialYear();
  const warnings: string[] = [];

  // Get current contribution summary to check caps
  const summary = await getContributionSummary(fy, formData.person);

  // Check if this contribution would exceed caps
  const caps = getContributionCaps(fy);
  if (formData.is_concessional) {
    const newTotal = summary.concessional_contributions + formData.amount;
    if (newTotal > caps.concessional) {
      warnings.push(
        `This contribution will exceed the concessional cap by $${(newTotal - caps.concessional).toLocaleString()}`
      );
    }
  } else {
    const newTotal = summary.non_concessional_contributions + formData.amount;
    if (newTotal > caps.non_concessional) {
      warnings.push(
        `This contribution will exceed the non-concessional cap by $${(newTotal - caps.non_concessional).toLocaleString()}`
      );
    }
  }

  const { data, error } = await supabase
    .from('super_contributions')
    .insert([
      {
        ...formData,
        user_id: user.id,
        financial_year: fy,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding super contribution:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  revalidatePath('/super');
  return { success: true, data: data as unknown as SuperContribution, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Update super contribution
 */
export async function updateSuperContribution(
  id: string,
  formData: Partial<SuperContributionFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('super_contributions')
    .update(formData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating super contribution:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  revalidatePath('/super');
  return { success: true };
}

/**
 * Delete super contribution
 */
export async function deleteSuperContribution(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('super_contributions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting super contribution:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/tax');
  revalidatePath('/super');
  return { success: true };
}

// ============================================
// Super Account Operations
// ============================================

/**
 * Get super accounts for current user
 */
export async function getSuperAccounts(
  person?: Exclude<PersonType, 'joint'>
): Promise<SuperAccount[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('super_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('balance', { ascending: false });

  if (person) {
    query = query.eq('person', person);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching super accounts:', error);
    return [];
  }
  return (data || []) as unknown as SuperAccount[];
}

/**
 * Add or update super account
 */
export async function upsertSuperAccount(
  account: Omit<SuperAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: SuperAccount }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if account exists by fund name and person
  const { data: existing } = await supabase
    .from('super_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('person', account.person)
    .eq('fund_name', account.fund_name)
    .single();

  let result;
  if (existing) {
    // Update existing
    result = await supabase
      .from('super_accounts')
      .update({ ...account, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    // Insert new
    result = await supabase
      .from('super_accounts')
      .insert([{ ...account, user_id: user.id }])
      .select()
      .single();
  }

  if (result.error) {
    console.error('Error upserting super account:', result.error);
    return { success: false, error: result.error.message };
  }

  revalidatePath('/super');
  return { success: true, data: result.data as unknown as SuperAccount };
}

// ============================================
// Contribution Summary & Analysis
// ============================================

/**
 * Get contribution summary for a person/year
 */
export async function getContributionSummary(
  financialYear?: string,
  person?: Exclude<PersonType, 'joint'>
): Promise<SuperContributionSummary> {
  const fy = financialYear || getCurrentFinancialYear();
  const targetPerson = person || 'grant';
  const caps = getContributionCaps(fy);

  const contributions = await getSuperContributions(fy, targetPerson);
  const accounts = await getSuperAccounts(targetPerson);

  let concessionalTotal = 0;
  let nonConcessionalTotal = 0;

  for (const c of contributions) {
    if (c.is_concessional) {
      concessionalTotal += Number(c.amount);
    } else {
      nonConcessionalTotal += Number(c.amount);
    }
  }

  const totalSuperBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return {
    person: targetPerson,
    financial_year: fy,
    concessional_contributions: concessionalTotal,
    non_concessional_contributions: nonConcessionalTotal,
    concessional_cap: caps.concessional,
    non_concessional_cap: caps.non_concessional,
    concessional_remaining: Math.max(0, caps.concessional - concessionalTotal),
    non_concessional_remaining: Math.max(0, caps.non_concessional - nonConcessionalTotal),
    total_super_balance: totalSuperBalance,
  };
}

/**
 * Get contribution summary for both Grant and Shannon
 */
export async function getHouseholdContributionSummary(
  financialYear?: string
): Promise<{
  grant: SuperContributionSummary;
  shannon: SuperContributionSummary;
  combined: {
    total_concessional: number;
    total_non_concessional: number;
    total_super_balance: number;
  };
}> {
  const [grant, shannon] = await Promise.all([
    getContributionSummary(financialYear, 'grant'),
    getContributionSummary(financialYear, 'shannon'),
  ]);

  return {
    grant,
    shannon,
    combined: {
      total_concessional:
        grant.concessional_contributions + shannon.concessional_contributions,
      total_non_concessional:
        grant.non_concessional_contributions + shannon.non_concessional_contributions,
      total_super_balance: grant.total_super_balance + shannon.total_super_balance,
    },
  };
}

/**
 * Check contribution status and provide alerts
 */
export async function checkContributionStatus(
  financialYear?: string,
  person?: Exclude<PersonType, 'joint'>
): Promise<{
  summary: SuperContributionSummary;
  alerts: Array<{ type: 'warning' | 'info' | 'error'; message: string }>;
  bringForward: ReturnType<typeof canUseBringForward>;
}> {
  const summary = await getContributionSummary(financialYear, person);
  const alerts: Array<{ type: 'warning' | 'info' | 'error'; message: string }> = [];

  // Check concessional cap
  if (summary.concessional_contributions > summary.concessional_cap) {
    const excess = summary.concessional_contributions - summary.concessional_cap;
    alerts.push({
      type: 'error',
      message: `Concessional cap exceeded by $${excess.toLocaleString()}. Excess will be taxed at marginal rate.`,
    });
  } else if (summary.concessional_remaining < 5000) {
    alerts.push({
      type: 'warning',
      message: `Only $${summary.concessional_remaining.toLocaleString()} concessional cap remaining.`,
    });
  }

  // Check non-concessional cap
  if (summary.non_concessional_contributions > summary.non_concessional_cap) {
    const excess = summary.non_concessional_contributions - summary.non_concessional_cap;
    alerts.push({
      type: 'error',
      message: `Non-concessional cap exceeded by $${excess.toLocaleString()}. Excess will be taxed at 47%.`,
    });
  }

  // Check bring-forward availability
  const bringForward = canUseBringForward(summary.total_super_balance);
  if (!bringForward.available) {
    alerts.push({
      type: 'info',
      message: 'Bring-forward rule not available due to total super balance exceeding $1.9M.',
    });
  }

  // Cap utilization reminder
  const concessionalUtilization =
    (summary.concessional_contributions / summary.concessional_cap) * 100;
  if (concessionalUtilization < 50) {
    alerts.push({
      type: 'info',
      message: `Only ${concessionalUtilization.toFixed(0)}% of concessional cap used. Consider salary sacrifice to reduce tax.`,
    });
  }

  return {
    summary,
    alerts,
    bringForward,
  };
}

/**
 * Get contributions by type for reporting
 */
export async function getContributionsByType(
  financialYear?: string,
  person?: Exclude<PersonType, 'joint'>
): Promise<Record<SuperContributionType, number>> {
  const contributions = await getSuperContributions(financialYear, person);

  const byType: Record<SuperContributionType, number> = {
    employer_sg: 0,
    salary_sacrifice: 0,
    personal_deductible: 0,
    personal_non_deductible: 0,
    spouse: 0,
    government_co_contribution: 0,
    low_income_super_offset: 0,
    other: 0,
  };

  for (const c of contributions) {
    byType[c.contribution_type] += Number(c.amount);
  }

  return byType;
}
