/**
 * @fileoverview Server actions for managing financial accounts.
 * Provides CRUD operations and balance calculations for user accounts.
 * @module lib/accounts/actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Account, AccountFormData } from '@/lib/types';

/** Default user ID for this app (no auth) */
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Retrieves all accounts for the default user with calculated balances.
 * Fetches accounts from the database and computes the calculated balance
 * by summing all transaction amounts (income adds, expense subtracts).
 *
 * @returns Promise resolving to an array of Account objects with calculated_balance
 * @example
 * const accounts = await getAccounts();
 * console.log(accounts[0].calculated_balance);
 */
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();

  // Fetch accounts
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  if (!accounts || accounts.length === 0) {
    return [];
  }

  // Fetch transaction sums for each account
  // Amounts are stored as positive values, transaction_type determines the sign
  const accountIds = accounts.map((a: typeof accounts[number]) => a.id);

  type TransactionSum = { account_id: string; amount: number; transaction_type: string };
  // Fetch transactions in batches to overcome Supabase's 1000 row limit
  const BATCH_SIZE = 1000;
  let allTransactionSums: TransactionSum[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error: txError } = await supabase
      .from('transactions')
      .select('account_id, amount, transaction_type')
      .in('account_id', accountIds)
      .range(offset, offset + BATCH_SIZE - 1);

    if (txError) {
      console.error('Error fetching transaction sums:', txError);
      // Return accounts with just starting balance if we can't get transactions
      return accounts as Account[];
    }

    if (batch && batch.length > 0) {
      allTransactionSums = [...allTransactionSums, ...batch];
      offset += BATCH_SIZE;
      hasMore = batch.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  // Calculate sum per account
  // Income adds to balance, expense subtracts from balance
  const sumByAccount: Record<string, number> = {};
  for (const tx of allTransactionSums) {
    if (!sumByAccount[tx.account_id]) {
      sumByAccount[tx.account_id] = 0;
    }
    const amount = tx.amount || 0;
    if (tx.transaction_type === 'expense') {
      sumByAccount[tx.account_id] -= amount;
    } else {
      // income and transfer add to balance
      sumByAccount[tx.account_id] += amount;
    }
  }

  // Add calculated_balance field (starting_balance + transaction sums)
  // current_balance remains as the starting balance for editing
  type AccountRow = typeof accounts[number];
  return accounts.map((account: AccountRow) => ({
    ...account,
    calculated_balance: (account.current_balance || 0) + (sumByAccount[account.id] || 0),
  })) as Account[];
}

/**
 * Retrieves a single account by its ID.
 *
 * @param id - The UUID of the account to retrieve
 * @returns Promise resolving to the Account object or null if not found
 * @example
 * const account = await getAccount('abc-123');
 * if (account) {
 *   console.log(account.name);
 * }
 */
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

  return data as Account;
}

/**
 * Creates a new account with the provided form data.
 * Automatically assigns the default user ID and revalidates the accounts path.
 *
 * @param formData - The account data including name, type, institution, etc.
 * @returns Promise resolving to success status and optional error message
 * @example
 * const result = await createAccount({
 *   name: 'Savings Account',
 *   account_type: 'savings',
 *   institution: 'ANZ',
 *   current_balance: 1000
 * });
 */
export async function createAccount(formData: AccountFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('accounts')
    .insert({
      user_id: DEFAULT_USER_ID,
      name: formData.name,
      account_type: formData.account_type,
      account_group: formData.account_group || 'family',
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

/**
 * Updates an existing account with new data.
 * Revalidates the accounts path after successful update.
 *
 * @param id - The UUID of the account to update
 * @param formData - The updated account data
 * @returns Promise resolving to success status and optional error message
 * @example
 * const result = await updateAccount('abc-123', { name: 'New Name' });
 */
export async function updateAccount(id: string, formData: AccountFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('accounts')
    .update({
      name: formData.name,
      account_type: formData.account_type,
      account_group: formData.account_group || 'family',
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

/**
 * Deletes an account by its ID.
 * Revalidates the accounts path after successful deletion.
 *
 * @param id - The UUID of the account to delete
 * @returns Promise resolving to success status and optional error message
 * @example
 * const result = await deleteAccount('abc-123');
 */
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

/**
 * Calculates a summary of all accounts including total balance, debt, and net position.
 * Credit and loan accounts are counted as debt, all others contribute to total balance.
 *
 * @returns Promise resolving to summary object with totals and account count
 * @example
 * const summary = await getAccountsSummary();
 * console.log(`Net position: ${summary.netPosition}`);
 */
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
    // Use calculated_balance (starting + transactions) for accurate totals
    const balance = account.calculated_balance ?? account.current_balance;
    if (account.account_type === 'credit' || account.account_type === 'loan') {
      totalDebt += Math.abs(balance);
    } else {
      totalBalance += balance;
    }
  }

  return {
    totalBalance,
    totalDebt,
    netPosition: totalBalance - totalDebt,
    accountCount: accounts.length,
  };
}
