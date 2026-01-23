'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Transaction, TransactionFormData, TransactionFilters, Category, CSVTransaction, CategorisationRule } from '@/lib/types';

// Default user ID for this app (no auth)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const supabase = await createClient();

  let query = supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(*),
      category:categories(*)
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId);
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters?.transactionType) {
    query = query.eq('transaction_type', filters.transactionType);
  }

  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo);
  }

  if (filters?.search) {
    query = query.or(`description.ilike.%${filters.search}%,payee.ilike.%${filters.search}%`);
  }

  if (filters?.minAmount !== undefined) {
    query = query.gte('amount', Math.abs(filters.minAmount));
  }

  if (filters?.maxAmount !== undefined) {
    query = query.lte('amount', Math.abs(filters.maxAmount));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return (data || []) as unknown as Transaction[];
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(*),
      category:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }

  return data as unknown as Transaction;
}

export async function createTransaction(formData: TransactionFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: formData.account_id,
      category_id: formData.category_id || null,
      date: formData.date,
      description: formData.description,
      amount: Math.abs(formData.amount),
      transaction_type: formData.transaction_type,
      payee: formData.payee || null,
      reference: formData.reference || null,
      notes: formData.notes || null,
    });

  if (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateTransaction(id: string, formData: TransactionFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('transactions')
    .update({
      account_id: formData.account_id,
      category_id: formData.category_id || null,
      date: formData.date,
      description: formData.description,
      amount: Math.abs(formData.amount),
      transaction_type: formData.transaction_type,
      payee: formData.payee || null,
      reference: formData.reference || null,
      notes: formData.notes || null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTransactions(ids: string[]): Promise<{ success: boolean; deleted: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, deleted: 0, error: 'No transactions selected' };
  }

  const supabase = await createClient();

  const { error, count } = await supabase
    .from('transactions')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting transactions:', error);
    return { success: false, deleted: 0, error: error.message };
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, deleted: count || ids.length };
}

export async function importTransactions(
  accountId: string,
  transactions: CSVTransaction[]
): Promise<{ success: boolean; imported: number; error?: string }> {
  const supabase = await createClient();

  const importId = `import_${Date.now()}`;

  const transactionsToInsert = transactions.map((t) => ({
    user_id: DEFAULT_USER_ID,
    account_id: accountId,
    date: t.date,
    description: t.description,
    amount: Math.abs(t.amount),
    transaction_type: t.amount >= 0 ? 'income' : 'expense' as const,
    payee: t.payee || null,
    import_id: importId,
  }));

  const { data: insertedTransactions, error } = await supabase
    .from('transactions')
    .insert(transactionsToInsert)
    .select('id');

  if (error) {
    console.error('Error importing transactions:', error);
    return { success: false, imported: 0, error: error.message };
  }

  // Automatically apply categorisation rules to the imported transactions
  if (insertedTransactions && insertedTransactions.length > 0) {
    const transactionIds = insertedTransactions.map((t) => t.id);
    await applyCategorisationRules(transactionIds);
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, imported: transactions.length };
}

// Categories

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []) as unknown as Category[];
}

export async function createCategory(name: string, categoryType: 'income' | 'expense' | 'transfer'): Promise<{ success: boolean; category?: Category; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      category_type: categoryType,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  return { success: true, category: data as unknown as Category };
}

export async function createDefaultCategories(): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const defaultCategories = [
    // Expense categories
    { name: 'Groceries', category_type: 'expense' },
    { name: 'Dining Out', category_type: 'expense' },
    { name: 'Transport', category_type: 'expense' },
    { name: 'Utilities', category_type: 'expense' },
    { name: 'Entertainment', category_type: 'expense' },
    { name: 'Shopping', category_type: 'expense' },
    { name: 'Health', category_type: 'expense' },
    { name: 'Insurance', category_type: 'expense' },
    { name: 'Education', category_type: 'expense' },
    { name: 'Subscriptions', category_type: 'expense' },
    { name: 'Home', category_type: 'expense' },
    { name: 'Personal Care', category_type: 'expense' },
    { name: 'Gifts', category_type: 'expense' },
    { name: 'Fees & Charges', category_type: 'expense' },
    { name: 'Other Expense', category_type: 'expense' },
    // Income categories
    { name: 'Salary', category_type: 'income' },
    { name: 'Dividends', category_type: 'income' },
    { name: 'Interest', category_type: 'income' },
    { name: 'Trust Distribution', category_type: 'income' },
    { name: 'Rental Income', category_type: 'income' },
    { name: 'Other Income', category_type: 'income' },
    // Transfer
    { name: 'Transfer', category_type: 'transfer' },
  ];

  for (const cat of defaultCategories) {
    await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: cat.name,
        category_type: cat.category_type,
        is_system: true,
      })
      .select();
  }
}

// Categorisation Rules

export interface CategorisationRuleFormData {
  category_id: string;
  match_field: 'description' | 'payee' | 'reference';
  match_type: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  match_value: string;
  priority?: number;
}

export async function getCategorisationRules(): Promise<CategorisationRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categorisation_rules')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching categorisation rules:', error);
    return [];
  }

  return (data || []) as unknown as CategorisationRule[];
}

export async function createCategorisationRule(
  formData: CategorisationRuleFormData
): Promise<{ success: boolean; rule?: CategorisationRule; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get the next priority value
  const { data: existingRules } = await supabase
    .from('categorisation_rules')
    .select('priority')
    .order('priority', { ascending: false })
    .limit(1);

  const nextPriority = formData.priority ?? ((existingRules?.[0]?.priority ?? 0) + 1);

  const { data, error } = await supabase
    .from('categorisation_rules')
    .insert({
      user_id: user.id,
      category_id: formData.category_id,
      match_field: formData.match_field,
      match_type: formData.match_type,
      match_value: formData.match_value,
      priority: nextPriority,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating categorisation rule:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  return { success: true, rule: data as unknown as CategorisationRule };
}

export async function updateCategorisationRule(
  id: string,
  formData: Partial<CategorisationRuleFormData> & { is_active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('categorisation_rules')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating categorisation rule:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  return { success: true };
}

export async function deleteCategorisationRule(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('categorisation_rules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting categorisation rule:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  return { success: true };
}

// Apply categorisation rules to a single transaction
function matchesRule(transaction: Transaction, rule: CategorisationRule): boolean {
  const fieldValue = transaction[rule.match_field as keyof Transaction] as string | null;
  if (!fieldValue) return false;

  const normalizedField = fieldValue.toLowerCase();
  const normalizedMatch = rule.match_value.toLowerCase();

  switch (rule.match_type) {
    case 'contains':
      return normalizedField.includes(normalizedMatch);
    case 'starts_with':
      return normalizedField.startsWith(normalizedMatch);
    case 'ends_with':
      return normalizedField.endsWith(normalizedMatch);
    case 'exact':
      return normalizedField === normalizedMatch;
    default:
      return false;
  }
}

export async function applyCategorisationRules(transactionIds?: string[]): Promise<{
  success: boolean;
  categorised: number;
  error?: string;
}> {
  const supabase = await createClient();

  // Get all active rules
  const { data: rules, error: rulesError } = await supabase
    .from('categorisation_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (rulesError || !rules || rules.length === 0) {
    return { success: true, categorised: 0 };
  }

  // Get uncategorised transactions
  let query = supabase
    .from('transactions')
    .select('*')
    .is('category_id', null);

  if (transactionIds && transactionIds.length > 0) {
    query = query.in('id', transactionIds);
  }

  const { data: transactions, error: txError } = await query;

  if (txError || !transactions) {
    return { success: false, categorised: 0, error: txError?.message };
  }

  let categorisedCount = 0;

  // Apply rules to each uncategorised transaction
  for (const transaction of transactions as unknown as Transaction[]) {
    for (const rule of rules as unknown as CategorisationRule[]) {
      if (matchesRule(transaction, rule)) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category_id: rule.category_id })
          .eq('id', transaction.id);

        if (!updateError) {
          categorisedCount++;
        }
        break; // Only apply first matching rule
      }
    }
  }

  if (categorisedCount > 0) {
    revalidatePath('/transactions');
  }

  return { success: true, categorised: categorisedCount };
}

// Create a rule from an existing transaction
export async function createRuleFromTransaction(
  transactionId: string,
  categoryId: string,
  matchField: 'description' | 'payee' = 'description',
  matchType: 'contains' | 'exact' = 'contains'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (!transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  const matchValue = transaction[matchField];
  if (!matchValue) {
    return { success: false, error: `Transaction has no ${matchField}` };
  }

  const result = await createCategorisationRule({
    category_id: categoryId,
    match_field: matchField,
    match_type: matchType,
    match_value: matchValue,
  });

  if (!result.success) {
    return result;
  }

  // Also update this transaction's category
  await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', transactionId);

  // Apply the new rule to other uncategorised transactions
  await applyCategorisationRules();

  return { success: true };
}

// Summary

export async function getTransactionsSummary(dateFrom?: string, dateTo?: string): Promise<{
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
}> {
  const supabase = await createClient();

  let query = supabase
    .from('transactions')
    .select('amount, transaction_type');

  if (dateFrom) {
    query = query.gte('date', dateFrom);
  }

  if (dateTo) {
    query = query.lte('date', dateTo);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { totalIncome: 0, totalExpenses: 0, netCashFlow: 0, transactionCount: 0 };
  }

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of data) {
    if (t.transaction_type === 'income') {
      totalIncome += t.amount;
    } else if (t.transaction_type === 'expense') {
      totalExpenses += t.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    transactionCount: data.length,
  };
}
