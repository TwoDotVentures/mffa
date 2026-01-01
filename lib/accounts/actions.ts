'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Account, AccountFormData } from '@/lib/types';

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  return data || [];
}

export async function getAccount(id: string): Promise<Account | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return data;
}

export async function createAccount(formData: AccountFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name: formData.name,
      account_type: formData.account_type,
      institution: formData.institution || null,
      account_number: formData.account_number || null,
      bsb: formData.bsb || null,
      current_balance: formData.current_balance || 0,
      credit_limit: formData.credit_limit || null,
      interest_rate: formData.interest_rate || null,
      notes: formData.notes || null,
    });

  if (error) {
    console.error('Error creating account:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/accounts');
  return { success: true };
}

export async function updateAccount(id: string, formData: AccountFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('accounts')
    .update({
      name: formData.name,
      account_type: formData.account_type,
      institution: formData.institution || null,
      account_number: formData.account_number || null,
      bsb: formData.bsb || null,
      current_balance: formData.current_balance || 0,
      credit_limit: formData.credit_limit || null,
      interest_rate: formData.interest_rate || null,
      notes: formData.notes || null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating account:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/accounts');
  return { success: true };
}

export async function deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/accounts');
  return { success: true };
}

export async function getAccountsSummary(): Promise<{
  totalBalance: number;
  totalDebt: number;
  netPosition: number;
  accountCount: number;
}> {
  const accounts = await getAccounts();

  let totalBalance = 0;
  let totalDebt = 0;

  for (const account of accounts) {
    if (account.account_type === 'credit' || account.account_type === 'loan') {
      totalDebt += Math.abs(account.current_balance);
    } else {
      totalBalance += account.current_balance;
    }
  }

  return {
    totalBalance,
    totalDebt,
    netPosition: totalBalance - totalDebt,
    accountCount: accounts.length,
  };
}
