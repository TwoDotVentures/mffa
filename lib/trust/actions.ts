'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Trust,
  TrustBeneficiary,
  TrustIncome,
  TrustDistribution,
  TrustInvestment,
  FrankingCredits,
  TrustSummary,
  DistributionScenario,
  TrustFormData,
  TrustIncomeFormData,
  TrustDistributionFormData,
  TrustBeneficiaryFormData,
} from '@/lib/types';
import { getCurrentFinancialYear, getDaysUntilEOFY, calculateTax } from './utils';

// ============================================
// Trust CRUD Operations
// ============================================

// Get trust details
export async function getTrust(): Promise<Trust | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('trusts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching trust:', error);
  }
  return data || null;
}

// Create trust
export async function createTrust(
  formData: TrustFormData
): Promise<{ success: boolean; error?: string; data?: Trust }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('trusts')
    .insert([{ ...formData, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating trust:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/trust');
  return { success: true, data };
}

// Update trust
export async function updateTrust(
  id: string,
  formData: Partial<TrustFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('trusts')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating trust:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/trust');
  return { success: true };
}

// ============================================
// Beneficiary Operations
// ============================================

// Get trust beneficiaries
export async function getTrustBeneficiaries(
  trustId: string
): Promise<TrustBeneficiary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trust_beneficiaries')
    .select('*')
    .eq('trust_id', trustId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching beneficiaries:', error);
    return [];
  }
  return (data || []) as unknown as TrustBeneficiary[];
}

// Add beneficiary
export async function addBeneficiary(
  trustId: string,
  formData: TrustBeneficiaryFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('trust_beneficiaries')
    .insert([{ ...formData, trust_id: trustId }]);

  if (error) {
    console.error('Error adding beneficiary:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/trust');
  return { success: true };
}

// ============================================
// Income Operations
// ============================================

// Get trust income for financial year
export async function getTrustIncome(
  trustId: string,
  financialYear?: string
): Promise<TrustIncome[]> {
  const supabase = await createClient();
  const fy = financialYear || getCurrentFinancialYear();

  const { data, error } = await supabase
    .from('trust_income')
    .select('*')
    .eq('trust_id', trustId)
    .eq('financial_year', fy)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching trust income:', error);
    return [];
  }
  return (data || []) as unknown as TrustIncome[];
}

// Add trust income (dividend, etc.)
export async function addTrustIncome(
  trustId: string,
  formData: TrustIncomeFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const fy = getCurrentFinancialYear();

  const { error: incomeError } = await supabase
    .from('trust_income')
    .insert([{ ...formData, trust_id: trustId, financial_year: fy }]);

  if (incomeError) {
    console.error('Error adding income:', incomeError);
    return { success: false, error: incomeError.message };
  }

  // Update franking credits balance
  if (formData.franking_credits > 0) {
    await updateFrankingCreditsBalance(trustId, fy, formData.franking_credits, 0);
  }

  revalidatePath('/trust');
  return { success: true };
}

// Delete trust income
export async function deleteTrustIncome(
  incomeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the income record first to update franking credits
  const { data: income } = await supabase
    .from('trust_income')
    .select('*')
    .eq('id', incomeId)
    .single();

  if (!income) {
    return { success: false, error: 'Income record not found' };
  }

  const { error } = await supabase.from('trust_income').delete().eq('id', incomeId);

  if (error) {
    console.error('Error deleting income:', error);
    return { success: false, error: error.message };
  }

  // Adjust franking credits
  if (income.franking_credits && income.franking_credits > 0) {
    await updateFrankingCreditsBalance(
      income.trust_id,
      income.financial_year,
      -income.franking_credits,
      0
    );
  }

  revalidatePath('/trust');
  return { success: true };
}

// ============================================
// Distribution Operations
// ============================================

// Get distributions for financial year
export async function getTrustDistributions(
  trustId: string,
  financialYear?: string,
  beneficiaryId?: string
): Promise<TrustDistribution[]> {
  const supabase = await createClient();
  const fy = financialYear || getCurrentFinancialYear();

  let query = supabase
    .from('trust_distributions')
    .select('*, beneficiary:trust_beneficiaries(*)')
    .eq('trust_id', trustId)
    .eq('financial_year', fy);

  if (beneficiaryId) {
    query = query.eq('beneficiary_id', beneficiaryId);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    console.error('Error fetching distributions:', error);
    return [];
  }
  return (data || []) as unknown as TrustDistribution[];
}

// Record distribution
export async function addTrustDistribution(
  trustId: string,
  formData: TrustDistributionFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const fy = getCurrentFinancialYear();

  const { error } = await supabase.from('trust_distributions').insert([
    {
      ...formData,
      trust_id: trustId,
      financial_year: fy,
    },
  ]);

  if (error) {
    console.error('Error adding distribution:', error);
    return { success: false, error: error.message };
  }

  // Update franking credits if streamed
  if (formData.franking_credits_streamed > 0) {
    await updateFrankingCreditsBalance(trustId, fy, 0, formData.franking_credits_streamed);
  }

  revalidatePath('/trust');
  return { success: true };
}

// Delete distribution
export async function deleteTrustDistribution(
  distributionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the distribution record first
  const { data: distribution } = await supabase
    .from('trust_distributions')
    .select('*')
    .eq('id', distributionId)
    .single();

  if (!distribution) {
    return { success: false, error: 'Distribution record not found' };
  }

  const { error } = await supabase
    .from('trust_distributions')
    .delete()
    .eq('id', distributionId);

  if (error) {
    console.error('Error deleting distribution:', error);
    return { success: false, error: error.message };
  }

  // Adjust franking credits
  if (distribution.franking_credits_streamed && distribution.franking_credits_streamed > 0) {
    await updateFrankingCreditsBalance(
      distribution.trust_id,
      distribution.financial_year,
      0,
      -distribution.franking_credits_streamed
    );
  }

  revalidatePath('/trust');
  return { success: true };
}

// ============================================
// Franking Credits Operations
// ============================================

// Get franking credits balance
export async function getFrankingCredits(
  trustId: string,
  financialYear?: string
): Promise<FrankingCredits | null> {
  const supabase = await createClient();
  const fy = financialYear || getCurrentFinancialYear();

  const { data, error } = await supabase
    .from('franking_credits')
    .select('*')
    .eq('trust_id', trustId)
    .eq('financial_year', fy)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching franking credits:', error);
  }
  return data || null;
}

// Update franking credits balance (internal helper)
async function updateFrankingCreditsBalance(
  trustId: string,
  financialYear: string,
  creditsReceived: number,
  creditsDistributed: number
): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('franking_credits')
    .select('*')
    .eq('trust_id', trustId)
    .eq('financial_year', financialYear)
    .single();

  if (existing) {
    await supabase
      .from('franking_credits')
      .update({
        credits_received: (existing.credits_received || 0) + creditsReceived,
        credits_distributed: (existing.credits_distributed || 0) + creditsDistributed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('franking_credits').insert([
      {
        trust_id: trustId,
        financial_year: financialYear,
        opening_balance: 0,
        credits_received: creditsReceived,
        credits_distributed: creditsDistributed,
      },
    ]);
  }
}

// ============================================
// Investment Operations
// ============================================

// Get trust investments
export async function getTrustInvestments(
  trustId: string
): Promise<TrustInvestment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trust_investments')
    .select('*')
    .eq('trust_id', trustId)
    .order('current_value', { ascending: false });

  if (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
  return (data || []) as unknown as TrustInvestment[];
}

// ============================================
// Summary & Calculations
// ============================================

// Get complete trust summary
export async function getTrustSummary(): Promise<TrustSummary | null> {
  const trust = await getTrust();
  if (!trust) return null;

  const fy = getCurrentFinancialYear();
  const [income, distributions, beneficiaries, frankingCredits] = await Promise.all([
    getTrustIncome(trust.id, fy),
    getTrustDistributions(trust.id, fy),
    getTrustBeneficiaries(trust.id),
    getFrankingCredits(trust.id, fy),
  ]);

  const income_ytd = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const franking_credits_ytd = income.reduce(
    (sum, i) => sum + Number(i.franking_credits),
    0
  );
  const distributions_ytd = distributions.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );

  return {
    trust,
    income_ytd,
    franking_credits_ytd,
    distributions_ytd,
    distributable_amount: income_ytd - distributions_ytd,
    days_until_eofy: getDaysUntilEOFY(),
    beneficiaries,
  };
}

// Get distributions by beneficiary
export async function getDistributionsByBeneficiary(
  trustId: string,
  financialYear?: string
): Promise<Record<string, { name: string; total: number; franking: number }>> {
  const distributions = await getTrustDistributions(trustId, financialYear);

  const byBeneficiary: Record<string, { name: string; total: number; franking: number }> =
    {};

  for (const d of distributions) {
    const name = d.beneficiary?.name || 'Unknown';
    if (!byBeneficiary[d.beneficiary_id]) {
      byBeneficiary[d.beneficiary_id] = { name, total: 0, franking: 0 };
    }
    byBeneficiary[d.beneficiary_id].total += Number(d.amount);
    byBeneficiary[d.beneficiary_id].franking += Number(d.franking_credits_streamed);
  }

  return byBeneficiary;
}

// Model distribution scenarios
export async function modelDistribution(
  distributableAmount: number,
  frankingCredits: number,
  grantOtherIncome: number,
  shannonOtherIncome: number,
  scenarios: { grant: number; shannon: number }[]
): Promise<DistributionScenario[]> {
  return scenarios.map(({ grant, shannon }) => {
    const grantAmount = distributableAmount * (grant / 100);
    const shannonAmount = distributableAmount * (shannon / 100);

    // Proportional franking by default
    const grantFranking = frankingCredits * (grant / 100);
    const shannonFranking = frankingCredits * (shannon / 100);

    // Gross up income for tax calculation (include franking credits)
    const grantTaxable = grantOtherIncome + grantAmount + grantFranking;
    const shannonTaxable = shannonOtherIncome + shannonAmount + shannonFranking;

    // Calculate tax then apply franking credit offset
    const grantTaxRaw = calculateTax(grantTaxable);
    const shannonTaxRaw = calculateTax(shannonTaxable);

    // Franking credits reduce tax payable (can result in refund if negative)
    const grantTax = Math.max(0, grantTaxRaw - grantFranking);
    const shannonTax = Math.max(0, shannonTaxRaw - shannonFranking);

    return {
      grant_percentage: grant,
      shannon_percentage: shannon,
      grant_amount: grantAmount,
      shannon_amount: shannonAmount,
      grant_franking: grantFranking,
      shannon_franking: shannonFranking,
      grant_tax_estimate: grantTax,
      shannon_tax_estimate: shannonTax,
      total_tax: grantTax + shannonTax,
    };
  });
}

// ============================================
// Seed Initial Data
// ============================================

// Initialize trust with default beneficiaries (Moyle Family Trust)
export async function initializeMoyleFamilyTrust(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if trust already exists
  const existingTrust = await getTrust();
  if (existingTrust) {
    return { success: false, error: 'Trust already exists' };
  }

  // Create the trust
  const trustResult = await createTrust({
    name: 'Moyle Family Trust',
    abn: '',
    trustee_name: 'Moyle Australia Pty Ltd',
    trustee_abn: '',
  });

  if (!trustResult.success || !trustResult.data) {
    return { success: false, error: trustResult.error };
  }

  // Add beneficiaries
  await addBeneficiary(trustResult.data.id, {
    name: 'Grant Moyle',
    beneficiary_type: 'primary',
  });

  await addBeneficiary(trustResult.data.id, {
    name: 'Shannon Moyle',
    beneficiary_type: 'primary',
  });

  revalidatePath('/trust');
  return { success: true };
}
