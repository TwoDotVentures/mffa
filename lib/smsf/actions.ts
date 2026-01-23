'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getFinancialYear, getContributionCaps } from './utils';
import type {
  SmsfMemberInsert,
  SmsfContributionInsert,
  SmsfTransactionInsert,
} from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

export interface SmsfFund {
  id: string;
  user_id: string;
  name: string;
  abn: string | null;
  trustee_name: string | null;
  trustee_abn: string | null;
  establishment_date: string | null;
  fund_status: 'active' | 'winding_up' | 'wound_up';
  created_at: string;
  updated_at: string;
}

export interface SmsfMember {
  id: string;
  fund_id: string;
  name: string;
  tfn_encrypted: string | null;
  date_of_birth: string | null;
  preservation_age: number | null;
  total_super_balance: number;
  member_status: 'accumulation' | 'transition_to_retirement' | 'pension';
  created_at: string;
  updated_at: string;
}

export interface SmsfContribution {
  id: string;
  fund_id: string;
  member_id: string;
  contribution_type: 'concessional' | 'non_concessional' | 'government_co_contribution' | 'spouse' | 'downsizer';
  amount: number;
  date: string;
  financial_year: string;
  description: string | null;
  created_at: string;
  member?: SmsfMember;
}

export interface SmsfInvestment {
  id: string;
  fund_id: string;
  asset_type: 'australian_shares' | 'international_shares' | 'property' | 'fixed_income' | 'cash' | 'cryptocurrency' | 'collectibles' | 'other';
  name: string;
  description: string | null;
  units: number | null;
  cost_base: number;
  current_value: number;
  acquisition_date: string | null;
  income_ytd: number;
  created_at: string;
  updated_at: string;
}

export interface SmsfTransaction {
  id: string;
  fund_id: string;
  investment_id: string | null;
  member_id: string | null;
  type: 'contribution' | 'pension_payment' | 'lump_sum' | 'investment_income' | 'investment_purchase' | 'investment_sale' | 'fee' | 'tax' | 'transfer_in' | 'transfer_out' | 'other';
  amount: number;
  date: string;
  description: string | null;
  financial_year: string;
  created_at: string;
  member?: SmsfMember;
  investment?: SmsfInvestment;
}

export interface SmsfCompliance {
  id: string;
  fund_id: string;
  financial_year: string;
  audit_due_date: string | null;
  audit_completed_date: string | null;
  audit_status: 'pending' | 'in_progress' | 'completed' | 'issues_found';
  annual_return_due_date: string | null;
  annual_return_lodged_date: string | null;
  lodgement_status: 'pending' | 'lodged' | 'overdue';
  investment_strategy_reviewed: boolean;
  investment_strategy_date: string | null;
  member_statements_issued: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmsfCarryForward {
  id: string;
  member_id: string;
  financial_year: string;
  concessional_cap: number;
  concessional_used: number;
  unused_amount: number;
  total_super_balance_at_year_end: number | null;
  eligible_for_carry_forward: boolean;
  created_at: string;
}

// Form data types
export interface SmsfFundFormData {
  name: string;
  abn?: string;
  trustee_name?: string;
  trustee_abn?: string;
  establishment_date?: string;
  fund_status?: 'active' | 'winding_up' | 'wound_up';
}

export interface SmsfMemberFormData {
  fund_id: string;
  name: string;
  date_of_birth?: string;
  preservation_age?: number;
  total_super_balance?: number;
  member_status?: 'accumulation' | 'transition_to_retirement' | 'pension';
}

export interface SmsfContributionFormData {
  fund_id: string;
  member_id: string;
  contribution_type: 'concessional' | 'non_concessional' | 'government_co_contribution' | 'spouse' | 'downsizer';
  amount: number;
  date: string;
  description?: string;
}

export interface SmsfInvestmentFormData {
  fund_id: string;
  asset_type: SmsfInvestment['asset_type'];
  name: string;
  description?: string;
  units?: number;
  cost_base: number;
  current_value: number;
  acquisition_date?: string;
  income_ytd?: number;
}

export interface SmsfTransactionFormData {
  fund_id: string;
  investment_id?: string;
  member_id?: string;
  type: SmsfTransaction['type'];
  amount: number;
  date: string;
  description?: string;
}

// ============================================================================
// SMSF FUND ACTIONS
// ============================================================================

export async function getSmsfFunds(): Promise<SmsfFund[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_funds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfFund[];
}

export async function getSmsfFund(id: string): Promise<SmsfFund | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_funds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as SmsfFund;
}

export async function createSmsfFund(formData: SmsfFundFormData): Promise<SmsfFund> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_funds')
    .insert({
      user_id: user.id,
      name: formData.name,
      abn: formData.abn || null,
      trustee_name: formData.trustee_name || null,
      trustee_abn: formData.trustee_abn || null,
      establishment_date: formData.establishment_date || null,
      fund_status: formData.fund_status || 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfFund;
}

export async function updateSmsfFund(id: string, formData: Partial<SmsfFundFormData>): Promise<SmsfFund> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_funds')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfFund;
}

export async function deleteSmsfFund(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('smsf_funds')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
}

// ============================================================================
// SMSF MEMBER ACTIONS
// ============================================================================

export async function getSmsfMembers(fundId: string): Promise<SmsfMember[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_members')
    .select('*')
    .eq('fund_id', fundId)
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfMember[];
}

export async function createSmsfMember(formData: SmsfMemberFormData): Promise<SmsfMember> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insertData: SmsfMemberInsert = {
    fund_id: formData.fund_id,
    name: formData.name,
    date_of_birth: formData.date_of_birth || null,
    preservation_age: formData.preservation_age || null,
    total_super_balance: formData.total_super_balance || 0,
    member_status: formData.member_status || 'accumulation',
  };

  const { data, error } = await supabase
    .from('smsf_members')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfMember;
}

export async function updateSmsfMember(id: string, formData: Partial<SmsfMemberFormData>): Promise<SmsfMember> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_members')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfMember;
}

export async function deleteSmsfMember(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('smsf_members')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
}

// ============================================================================
// SMSF CONTRIBUTION ACTIONS
// ============================================================================

export async function getSmsfContributions(fundId: string, financialYear?: string): Promise<SmsfContribution[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('smsf_contributions')
    .select('*, member:smsf_members(id, name)')
    .eq('fund_id', fundId)
    .order('date', { ascending: false });

  if (financialYear) {
    query = query.eq('financial_year', financialYear);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfContribution[];
}

export async function getMemberContributions(memberId: string, financialYear?: string): Promise<SmsfContribution[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('smsf_contributions')
    .select('*')
    .eq('member_id', memberId)
    .order('date', { ascending: false });

  if (financialYear) {
    query = query.eq('financial_year', financialYear);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfContribution[];
}

export async function createSmsfContribution(formData: SmsfContributionFormData): Promise<SmsfContribution> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const contributionDate = new Date(formData.date);
  const financialYear = getFinancialYear(contributionDate);

  const insertData: SmsfContributionInsert = {
    fund_id: formData.fund_id,
    member_id: formData.member_id,
    contribution_type: formData.contribution_type,
    amount: formData.amount,
    date: formData.date,
    financial_year: financialYear,
    description: formData.description || null,
  };

  const { data, error } = await supabase
    .from('smsf_contributions')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfContribution;
}

export async function deleteSmsfContribution(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('smsf_contributions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
}

// ============================================================================
// CONTRIBUTION CAP CALCULATIONS
// ============================================================================

export interface ContributionSummary {
  memberId: string;
  memberName: string;
  financialYear: string;
  concessional: {
    used: number;
    cap: number;
    remaining: number;
    percentage: number;
  };
  nonConcessional: {
    used: number;
    cap: number;
    remaining: number;
    percentage: number;
  };
  carryForward: {
    available: number;
    eligible: boolean;
    breakdown: { year: string; amount: number }[];
  };
}

export async function getMemberContributionSummary(
  memberId: string,
  financialYear: string = getFinancialYear()
): Promise<ContributionSummary> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get member details
  const { data: member } = await supabase
    .from('smsf_members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (!member) throw new Error('Member not found');

  // Get contributions for this financial year
  const { data: contributions } = await supabase
    .from('smsf_contributions')
    .select('*')
    .eq('member_id', memberId)
    .eq('financial_year', financialYear);

  const caps = getContributionCaps(financialYear);

  // Define contribution type for type safety
  type ContributionRecord = { contribution_type: string; amount: number };
  type CarryForwardRecord = { financial_year: string; unused_amount: number; eligible_for_carry_forward: boolean };

  // Calculate concessional contributions
  const contributionList = (contributions || []) as ContributionRecord[];
  const concessionalContribs = contributionList
    .filter((c) => c.contribution_type === 'concessional')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Calculate non-concessional contributions (including spouse, downsizer are separate)
  const nonConcessionalContribs = contributionList
    .filter((c) => c.contribution_type === 'non_concessional')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Get carry-forward amounts (last 5 years)
  const { data: carryForwardData } = await supabase
    .from('smsf_carry_forward')
    .select('*')
    .eq('member_id', memberId)
    .order('financial_year', { ascending: false })
    .limit(5);

  // Calculate available carry-forward
  // Eligible if total super balance < $500,000 at previous 30 June
  const isEligible = (member.total_super_balance || 0) < 500000;
  const carryForwardList = (carryForwardData || []) as CarryForwardRecord[];
  const carryForwardBreakdown = carryForwardList
    .filter((cf) => cf.eligible_for_carry_forward && cf.unused_amount > 0)
    .map((cf) => ({
      year: cf.financial_year,
      amount: Number(cf.unused_amount),
    }));

  const totalCarryForward = carryForwardBreakdown.reduce((sum, cf) => sum + cf.amount, 0);

  return {
    memberId,
    memberName: member.name,
    financialYear,
    concessional: {
      used: concessionalContribs,
      cap: caps.concessional,
      remaining: Math.max(0, caps.concessional - concessionalContribs),
      percentage: Math.min(100, (concessionalContribs / caps.concessional) * 100),
    },
    nonConcessional: {
      used: nonConcessionalContribs,
      cap: caps.nonConcessional,
      remaining: Math.max(0, caps.nonConcessional - nonConcessionalContribs),
      percentage: Math.min(100, (nonConcessionalContribs / caps.nonConcessional) * 100),
    },
    carryForward: {
      available: isEligible ? totalCarryForward : 0,
      eligible: isEligible,
      breakdown: carryForwardBreakdown,
    },
  };
}

// ============================================================================
// SMSF INVESTMENT ACTIONS
// ============================================================================

export async function getSmsfInvestments(fundId: string): Promise<SmsfInvestment[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_investments')
    .select('*')
    .eq('fund_id', fundId)
    .order('asset_type');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfInvestment[];
}

export async function createSmsfInvestment(formData: SmsfInvestmentFormData): Promise<SmsfInvestment> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_investments')
    .insert({
      fund_id: formData.fund_id,
      asset_type: formData.asset_type,
      name: formData.name,
      description: formData.description || null,
      units: formData.units || null,
      cost_base: formData.cost_base,
      current_value: formData.current_value,
      acquisition_date: formData.acquisition_date || null,
      income_ytd: formData.income_ytd || 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfInvestment;
}

export async function updateSmsfInvestment(id: string, formData: Partial<SmsfInvestmentFormData>): Promise<SmsfInvestment> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('smsf_investments')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfInvestment;
}

export async function deleteSmsfInvestment(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('smsf_investments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
}

// ============================================================================
// SMSF TRANSACTION ACTIONS
// ============================================================================

export async function getSmsfTransactions(fundId: string, financialYear?: string): Promise<SmsfTransaction[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('smsf_transactions')
    .select('*, member:smsf_members(id, name), investment:smsf_investments(id, name)')
    .eq('fund_id', fundId)
    .order('date', { ascending: false });

  if (financialYear) {
    query = query.eq('financial_year', financialYear);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfTransaction[];
}

export async function createSmsfTransaction(formData: SmsfTransactionFormData): Promise<SmsfTransaction> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const transactionDate = new Date(formData.date);
  const financialYear = getFinancialYear(transactionDate);

  const insertData: SmsfTransactionInsert = {
    fund_id: formData.fund_id,
    investment_id: formData.investment_id || null,
    member_id: formData.member_id || null,
    type: formData.type,
    amount: formData.amount,
    date: formData.date,
    financial_year: financialYear,
    description: formData.description || null,
  };

  const { data, error } = await supabase
    .from('smsf_transactions')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
  return data as unknown as SmsfTransaction;
}

export async function deleteSmsfTransaction(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('smsf_transactions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/smsf');
}

// ============================================================================
// SMSF COMPLIANCE ACTIONS
// ============================================================================

export async function getSmsfCompliance(fundId: string, financialYear?: string): Promise<SmsfCompliance[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('smsf_compliance')
    .select('*')
    .eq('fund_id', fundId)
    .order('financial_year', { ascending: false });

  if (financialYear) {
    query = query.eq('financial_year', financialYear);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []) as unknown as SmsfCompliance[];
}

export async function createOrUpdateSmsfCompliance(
  fundId: string,
  financialYear: string,
  updates: Partial<Omit<SmsfCompliance, 'id' | 'fund_id' | 'financial_year' | 'created_at' | 'updated_at'>>
): Promise<SmsfCompliance> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try to update existing record first
  const { data: existing } = await supabase
    .from('smsf_compliance')
    .select('id')
    .eq('fund_id', fundId)
    .eq('financial_year', financialYear)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('smsf_compliance')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath('/smsf');
    return data as unknown as SmsfCompliance;
  } else {
    const { data, error } = await supabase
      .from('smsf_compliance')
      .insert({
        fund_id: fundId,
        financial_year: financialYear,
        ...updates,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath('/smsf');
    return data as unknown as SmsfCompliance;
  }
}

// ============================================================================
// SMSF DASHBOARD / SUMMARY
// ============================================================================

export interface SmsfDashboardData {
  fund: SmsfFund;
  members: SmsfMember[];
  totalBalance: number;
  investments: {
    total: number;
    byType: { type: string; value: number; percentage: number }[];
    performance: { costBase: number; currentValue: number; gainLoss: number; gainLossPercent: number };
  };
  contributions: {
    currentFY: number;
    byType: { type: string; amount: number }[];
  };
  compliance: SmsfCompliance | null;
  recentTransactions: SmsfTransaction[];
}

export async function getSmsfDashboard(fundId: string): Promise<SmsfDashboardData> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const currentFY = getFinancialYear();

  // Get fund
  const { data: fund } = await supabase
    .from('smsf_funds')
    .select('*')
    .eq('id', fundId)
    .single();

  if (!fund) throw new Error('Fund not found');

  // Get members
  const { data: members } = await supabase
    .from('smsf_members')
    .select('*')
    .eq('fund_id', fundId);

  // Get investments
  const { data: investments } = await supabase
    .from('smsf_investments')
    .select('*')
    .eq('fund_id', fundId);

  // Get contributions for current FY
  const { data: contributions } = await supabase
    .from('smsf_contributions')
    .select('*')
    .eq('fund_id', fundId)
    .eq('financial_year', currentFY);

  // Get compliance for current FY
  const { data: compliance } = await supabase
    .from('smsf_compliance')
    .select('*')
    .eq('fund_id', fundId)
    .eq('financial_year', currentFY)
    .single();

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('smsf_transactions')
    .select('*, member:smsf_members(id, name), investment:smsf_investments(id, name)')
    .eq('fund_id', fundId)
    .order('date', { ascending: false })
    .limit(10);

  // Type definitions for dashboard calculations
  type InvestmentRecord = { asset_type: string; current_value: number; cost_base: number };
  type ContributionRecord = { contribution_type: string; amount: number };
  type MemberRecord = { total_super_balance: number };

  // Calculate investment summary
  const investmentList = (investments || []) as InvestmentRecord[];
  const totalInvestmentValue = investmentList.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalCostBase = investmentList.reduce((sum, inv) => sum + Number(inv.cost_base), 0);

  const investmentByType = investmentList.reduce<Record<string, number>>((acc, inv) => {
    const type = inv.asset_type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += Number(inv.current_value);
    return acc;
  }, {});

  const investmentTypeBreakdown = Object.entries(investmentByType).map(([type, value]) => ({
    type,
    value,
    percentage: totalInvestmentValue > 0 ? (value / totalInvestmentValue) * 100 : 0,
  }));

  // Calculate contribution summary
  const contributionList = (contributions || []) as ContributionRecord[];
  const totalContributions = contributionList.reduce((sum, c) => sum + Number(c.amount), 0);

  const contributionByType = contributionList.reduce<Record<string, number>>((acc, c) => {
    const type = c.contribution_type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += Number(c.amount);
    return acc;
  }, {});

  const contributionTypeBreakdown = Object.entries(contributionByType).map(([type, amount]) => ({
    type,
    amount,
  }));

  // Calculate total balance (sum of member balances)
  const memberList = (members || []) as MemberRecord[];
  const totalBalance = memberList.reduce((sum, m) => sum + Number(m.total_super_balance), 0);

  return {
    fund: fund as unknown as SmsfFund,
    members: memberList as unknown as SmsfMember[],
    totalBalance,
    investments: {
      total: totalInvestmentValue,
      byType: investmentTypeBreakdown,
      performance: {
        costBase: totalCostBase,
        currentValue: totalInvestmentValue,
        gainLoss: totalInvestmentValue - totalCostBase,
        gainLossPercent: totalCostBase > 0 ? ((totalInvestmentValue - totalCostBase) / totalCostBase) * 100 : 0,
      },
    },
    contributions: {
      currentFY: totalContributions,
      byType: contributionTypeBreakdown,
    },
    compliance: (compliance || null) as unknown as SmsfCompliance | null,
    recentTransactions: (transactions || []) as unknown as SmsfTransaction[],
  };
}
