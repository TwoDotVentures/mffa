/**
 * @fileoverview Server actions for managing transactions and categories.
 * Provides CRUD operations, bulk updates, CSV imports, and categorisation rules.
 * @module lib/transactions/actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Transaction, TransactionFormData, TransactionFilters, Category, CSVTransaction, CategorisationRule, PaginatedTransactionOptions, PaginatedTransactionsResult } from '@/lib/types';

/** Default user ID for this app (no auth) */
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Retrieves transactions with optional filters.
 * Supports filtering by account, category, type, date range, search text, and amount range.
 * Uses batch fetching to overcome Supabase's 1000 row limit.
 *
 * @param filters - Optional filters to apply to the transaction query
 * @returns Promise resolving to an array of Transaction objects
 * @example
 * const transactions = await getTransactions({
 *   accountId: 'abc-123',
 *   transactionType: 'expense',
 *   dateFrom: '2024-01-01'
 * });
 */
export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const supabase = await createClient();

  // Fetch transactions in batches to overcome Supabase's 1000 row limit
  const BATCH_SIZE = 1000;
  let allTransactions: Transaction[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts!transactions_account_id_fkey(*),
        category:categories(*)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

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
      break;
    }

    if (data && data.length > 0) {
      allTransactions = [...allTransactions, ...(data as unknown as Transaction[])];
      offset += BATCH_SIZE;
      hasMore = data.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allTransactions;
}

/**
 * Retrieves transactions with pagination support for efficient loading of large datasets.
 * Uses server-side filtering and sorting for optimal performance.
 *
 * @param options - Pagination and filter options
 * @returns Promise resolving to paginated result with data, counts, and pagination info
 * @example
 * const result = await getPaginatedTransactions({
 *   page: 1,
 *   limit: 100,
 *   dateFrom: '2024-01-01',
 *   sortField: 'date',
 *   sortDirection: 'desc'
 * });
 * console.log(result.data.length, result.hasMore, result.totalCount);
 */
export async function getPaginatedTransactions(
  options: PaginatedTransactionOptions = {}
): Promise<PaginatedTransactionsResult> {
  const supabase = await createClient();

  // Default options
  const page = options.page ?? 1;
  const limit = options.limit ?? 100;
  const sortField = options.sortField ?? 'date';
  const sortDirection = options.sortDirection ?? 'desc';
  const offset = (page - 1) * limit;

  // Build count query (same filters, no pagination)
  let countQuery = supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });

  // Build data query with pagination
  let dataQuery = supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(*),
      category:categories(*)
    `)
    .order(sortField, { ascending: sortDirection === 'asc' })
    .order('created_at', { ascending: false }) // Secondary sort for stability
    .range(offset, offset + limit - 1);

  // Apply filters to both queries
  const applyFilters = (query: typeof countQuery | typeof dataQuery) => {
    if (options.accountId) {
      query = query.eq('account_id', options.accountId);
    }
    if (options.categoryId) {
      if (options.categoryId === 'uncategorised') {
        query = query.is('category_id', null);
      } else {
        query = query.eq('category_id', options.categoryId);
      }
    }
    if (options.uncategorisedOnly) {
      query = query.is('category_id', null);
    }
    if (options.transactionType) {
      query = query.eq('transaction_type', options.transactionType);
    }
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('date', options.dateTo);
    }
    if (options.search) {
      query = query.or(`description.ilike.%${options.search}%,payee.ilike.%${options.search}%`);
    }
    if (options.minAmount !== undefined) {
      query = query.gte('amount', Math.abs(options.minAmount));
    }
    if (options.maxAmount !== undefined) {
      query = query.lte('amount', Math.abs(options.maxAmount));
    }
    return query;
  };

  // Apply filters
  countQuery = applyFilters(countQuery) as typeof countQuery;
  dataQuery = applyFilters(dataQuery) as typeof dataQuery;

  // Execute both queries in parallel
  const [countResult, dataResult] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (countResult.error) {
    console.error('Error counting transactions:', countResult.error);
    return {
      data: [],
      totalCount: 0,
      hasMore: false,
      page,
      limit,
      totalPages: 0,
    };
  }

  if (dataResult.error) {
    console.error('Error fetching transactions:', dataResult.error);
    return {
      data: [],
      totalCount: 0,
      hasMore: false,
      page,
      limit,
      totalPages: 0,
    };
  }

  const totalCount = countResult.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = page < totalPages;

  return {
    data: (dataResult.data || []) as unknown as Transaction[],
    totalCount,
    hasMore,
    page,
    limit,
    totalPages,
  };
}

/**
 * Retrieves a single transaction by ID with related account and category data.
 *
 * @param id - The UUID of the transaction to retrieve
 * @returns Promise resolving to the Transaction object or null if not found
 */
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

/**
 * Creates a new transaction with the provided form data.
 * Amounts are stored as absolute values; transaction_type determines the sign.
 *
 * @param formData - The transaction data including account, amount, type, etc.
 * @returns Promise resolving to success status and optional error message
 */
export async function createTransaction(formData: TransactionFormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: DEFAULT_USER_ID,
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

/**
 * Updates an existing transaction with new data.
 *
 * @param id - The UUID of the transaction to update
 * @param formData - The updated transaction data
 * @returns Promise resolving to success status and optional error message
 */
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

/**
 * Deletes a single transaction by ID.
 *
 * @param id - The UUID of the transaction to delete
 * @returns Promise resolving to success status and optional error message
 */
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

/**
 * Deletes multiple transactions by their IDs.
 * Uses batch processing to avoid large query issues.
 *
 * @param ids - Array of transaction UUIDs to delete
 * @returns Promise resolving to success status, count of deleted, and optional error
 */
export async function deleteTransactions(ids: string[]): Promise<{ success: boolean; deleted: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, deleted: 0, error: 'No transactions selected' };
  }

  const supabase = await createClient();

  // Batch deletes to avoid "Bad Request" errors with large .in() queries
  const BATCH_SIZE = 100;
  let totalDeleted = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', batch);

    if (error) {
      console.error('Error deleting transactions batch:', error);
      return { success: false, deleted: totalDeleted, error: error.message };
    }

    totalDeleted += batch.length;
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, deleted: totalDeleted };
}

/**
 * Bulk updates the payee field for multiple transactions.
 *
 * @param ids - Array of transaction UUIDs to update
 * @param payee - The new payee value to set
 * @returns Promise resolving to success status, count of updated, and optional error
 */
export async function updateTransactionsPayee(ids: string[], payee: string): Promise<{ success: boolean; updated: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, updated: 0, error: 'No transactions selected' };
  }

  const supabase = await createClient();

  // Batch updates to avoid "Bad Request" errors with large .in() queries
  const BATCH_SIZE = 100;
  let totalUpdated = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('transactions')
      .update({ payee: payee || null })
      .in('id', batch);

    if (error) {
      console.error('Error updating transactions payee:', error);
      return { success: false, updated: totalUpdated, error: error.message };
    }

    totalUpdated += batch.length;
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, updated: totalUpdated };
}

/**
 * Bulk updates the description field for multiple transactions.
 *
 * @param ids - Array of transaction UUIDs to update
 * @param description - The new description value to set
 * @returns Promise resolving to success status, count of updated, and optional error
 */
export async function updateTransactionsDescription(ids: string[], description: string): Promise<{ success: boolean; updated: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, updated: 0, error: 'No transactions selected' };
  }

  const supabase = await createClient();

  // Batch updates to avoid "Bad Request" errors with large .in() queries
  const BATCH_SIZE = 100;
  let totalUpdated = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('transactions')
      .update({ description })
      .in('id', batch);

    if (error) {
      console.error('Error updating transactions description:', error);
      return { success: false, updated: totalUpdated, error: error.message };
    }

    totalUpdated += batch.length;
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, updated: totalUpdated };
}

/**
 * Updates the category for a single transaction.
 *
 * @param id - The UUID of the transaction to update
 * @param categoryId - The UUID of the category to assign, or null to remove
 * @returns Promise resolving to success status and optional error message
 */
export async function updateTransactionCategory(id: string, categoryId: string | null): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction category:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Bulk updates the category for multiple transactions.
 *
 * @param ids - Array of transaction UUIDs to update
 * @param categoryId - The UUID of the category to assign, or null to remove
 * @returns Promise resolving to success status, count of updated, and optional error
 */
export async function updateTransactionsCategory(ids: string[], categoryId: string | null): Promise<{ success: boolean; updated: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, updated: 0, error: 'No transactions selected' };
  }

  const supabase = await createClient();

  // Batch updates to avoid "Bad Request" errors with large .in() queries
  const BATCH_SIZE = 100;
  let totalUpdated = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('transactions')
      .update({ category_id: categoryId })
      .in('id', batch);

    if (error) {
      console.error('Error updating transactions category:', error);
      return { success: false, updated: totalUpdated, error: error.message };
    }

    totalUpdated += batch.length;
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, updated: totalUpdated };
}

/**
 * Imports transactions from a CSV file into an account.
 * Automatically applies categorisation rules to imported transactions.
 *
 * @param accountId - The UUID of the account to import transactions into
 * @param transactions - Array of parsed CSV transaction objects
 * @param categoryMap - Optional mapping of CSV category names to category IDs
 * @returns Promise resolving to success status, count of imported, and optional error
 */
export async function importTransactions(
  accountId: string,
  transactions: CSVTransaction[],
  categoryMap?: Record<string, string>
): Promise<{ success: boolean; imported: number; error?: string }> {
  const supabase = await createClient();

  const importId = `import_${Date.now()}`;

  const transactionsToInsert = transactions.map((t) => {
    // Look up category ID from the mapping if category exists
    let categoryId: string | null = null;
    if (t.category && categoryMap && categoryMap[t.category]) {
      categoryId = categoryMap[t.category];
    }

    return {
      user_id: DEFAULT_USER_ID,
      account_id: accountId,
      date: t.date,
      description: t.description,
      amount: Math.abs(t.amount),
      transaction_type: t.amount >= 0 ? 'income' : 'expense' as const,
      payee: t.payee || null,
      category_id: categoryId,
      import_id: importId,
    };
  });

  const { data: insertedTransactions, error } = await supabase
    .from('transactions')
    .insert(transactionsToInsert)
    .select('id');

  if (error) {
    console.error('Error importing transactions:', error);
    return { success: false, imported: 0, error: error.message };
  }

  // Automatically apply categorisation rules to transactions without categories
  if (insertedTransactions && insertedTransactions.length > 0) {
    const transactionIds = insertedTransactions.map((t: { id: string }) => t.id);
    await applyCategorisationRules(transactionIds);
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  return { success: true, imported: transactions.length };
}

/**
 * Creates multiple categories at once.
 *
 * @param categories - Array of category objects with name and categoryType
 * @returns Promise resolving to success status, map of created names to IDs, and optional error
 */
export async function createCategories(
  categories: { name: string; categoryType: 'income' | 'expense' | 'transfer' }[]
): Promise<{ success: boolean; created: Record<string, string>; error?: string }> {
  const supabase = await createClient();

  const created: Record<string, string> = {};

  for (const cat of categories) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: DEFAULT_USER_ID,
        name: cat.name,
        category_type: cat.categoryType,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return { success: false, created, error: error.message };
    }

    if (data) {
      created[cat.name] = data.id;
    }
  }

  revalidatePath('/transactions');
  return { success: true, created };
}

// ============================================
// Categories
// ============================================

/**
 * Retrieves all categories ordered by name.
 *
 * @returns Promise resolving to an array of Category objects
 */
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

/**
 * Creates a single new category.
 *
 * @param name - The name of the category
 * @param categoryType - The type: 'income', 'expense', or 'transfer'
 * @returns Promise resolving to success status, created category, and optional error
 */
export async function createCategory(name: string, categoryType: 'income' | 'expense' | 'transfer'): Promise<{ success: boolean; category?: Category; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: DEFAULT_USER_ID,
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

/**
 * Creates default system categories for common income and expense types.
 * Includes categories like Groceries, Salary, Utilities, etc.
 *
 * @returns Promise that resolves when all categories are created
 */
export async function createDefaultCategories(): Promise<void> {
  const supabase = await createClient();

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
        user_id: DEFAULT_USER_ID,
        name: cat.name,
        category_type: cat.category_type,
        is_system: true,
      })
      .select();
  }
}

// ============================================
// Categorisation Rules
// ============================================

/**
 * Form data for creating or updating a categorisation rule.
 */
export interface CategorisationRuleFormData {
  category_id: string;
  match_field: 'description' | 'payee' | 'reference';
  match_type: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  match_value: string;
  priority?: number;
}

/**
 * Retrieves all categorisation rules ordered by priority.
 *
 * @returns Promise resolving to an array of CategorisationRule objects
 */
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

/**
 * Creates a new categorisation rule.
 * Rules are used to automatically assign categories to transactions based on matching criteria.
 *
 * @param formData - The rule configuration including category, match field, and match value
 * @returns Promise resolving to success status, created rule, and optional error
 */
export async function createCategorisationRule(
  formData: CategorisationRuleFormData
): Promise<{ success: boolean; rule?: CategorisationRule; error?: string }> {
  const supabase = await createClient();

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
      user_id: DEFAULT_USER_ID,
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

/**
 * Updates an existing categorisation rule.
 *
 * @param id - The UUID of the rule to update
 * @param formData - The updated rule configuration
 * @returns Promise resolving to success status and optional error message
 */
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

/**
 * Deletes a categorisation rule by ID.
 *
 * @param id - The UUID of the rule to delete
 * @returns Promise resolving to success status and optional error message
 */
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

/**
 * Checks if a transaction matches a categorisation rule.
 *
 * @param transaction - The transaction to check
 * @param rule - The rule to match against
 * @returns True if the transaction matches the rule criteria
 */
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

/**
 * Applies all active categorisation rules to uncategorised transactions.
 * Rules are applied in priority order; only the first matching rule is used.
 *
 * OPTIMIZED: Uses batch updates grouped by category to reduce N+1 queries.
 * Instead of 1 query per transaction, this now uses 1 query per category.
 *
 * @param transactionIds - Optional array of specific transaction IDs to process
 * @returns Promise resolving to success status, count of categorised, and optional error
 */
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

  // OPTIMIZATION: Group transaction IDs by their matching category
  // This converts O(n) queries to O(categories) queries
  const updatesByCategory = new Map<string, string[]>();
  const processedIds = new Set<string>(); // Track which transactions we've matched

  // Apply rules in priority order to each transaction
  for (const transaction of transactions as unknown as Transaction[]) {
    // Skip if already processed (matched a higher-priority rule)
    if (processedIds.has(transaction.id)) continue;

    for (const rule of rules as unknown as CategorisationRule[]) {
      if (matchesRule(transaction, rule)) {
        // Add to batch for this category
        const existingBatch = updatesByCategory.get(rule.category_id) || [];
        existingBatch.push(transaction.id);
        updatesByCategory.set(rule.category_id, existingBatch);
        processedIds.add(transaction.id);
        break; // Only apply first matching rule
      }
    }
  }

  let categorisedCount = 0;
  const BATCH_SIZE = 100; // Supabase has limits on IN clause size

  // Execute batch updates - one query per category instead of per transaction
  for (const [categoryId, transactionIds] of updatesByCategory) {
    // Split into smaller batches if needed
    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
      const batch = transactionIds.slice(i, i + BATCH_SIZE);

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .in('id', batch);

      if (!updateError) {
        categorisedCount += batch.length;
      } else {
        console.error('Error batch updating transactions:', updateError);
      }
    }
  }

  if (categorisedCount > 0) {
    revalidatePath('/transactions');
  }

  return { success: true, categorised: categorisedCount };
}

/**
 * Creates a categorisation rule based on an existing transaction.
 * Also updates the source transaction's category and applies the new rule to other transactions.
 *
 * @param transactionId - The UUID of the transaction to base the rule on
 * @param categoryId - The category ID to assign
 * @param matchField - The field to match on: 'description' or 'payee'
 * @param matchType - The match type: 'contains' or 'exact'
 * @returns Promise resolving to success status and optional error message
 */
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

// ============================================
// Summary
// ============================================

/**
 * Calculates a summary of transactions within an optional date range.
 * Returns totals for income, expenses, and net cash flow.
 *
 * @param dateFrom - Optional start date for the summary period
 * @param dateTo - Optional end date for the summary period
 * @returns Promise resolving to summary object with totals and transaction count
 */
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

// ============================================
// Chart Summary Data
// ============================================

/**
 * Category summary for charts
 */
export interface CategorySummary {
  id: string | null;
  name: string;
  amount: number;
  count: number;
}

/**
 * Payee summary for charts
 */
export interface PayeeSummary {
  name: string;
  amount: number;
  count: number;
}

/**
 * Complete chart data summary
 */
export interface ChartSummaryData {
  /** Top categories by expense amount */
  topCategories: CategorySummary[];
  /** Top payees by expense amount */
  topPayees: PayeeSummary[];
  /** Total income amount */
  totalIncome: number;
  /** Total expense amount */
  totalExpenses: number;
  /** Total transaction count */
  totalCount: number;
}

/**
 * Gets aggregated chart data for the entire filtered dataset.
 * This fetches summary data from the database without loading all transactions,
 * allowing charts to show accurate totals even with paginated transaction lists.
 *
 * @param options - Filter options (same as getPaginatedTransactions)
 * @returns Promise resolving to chart summary data
 */
export async function getChartSummaryData(
  options: PaginatedTransactionOptions = {}
): Promise<ChartSummaryData> {
  const supabase = await createClient();

  // CRITICAL: Supabase has a default server-side limit of 1000 rows
  // .limit() cannot exceed this server setting, so we must batch fetch
  // using .range() to get ALL transactions for accurate chart data
  const BATCH_SIZE = 1000;
  let allData: Array<{
    amount: number;
    transaction_type: string;
    category_id: string | null;
    payee: string | null;
    category: { id: string; name: string; category_type: string } | null;
  }> = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Build query with filters but select only needed fields
    // Include category_type to filter out transfers
    let query = supabase
      .from('transactions')
      .select(`
        amount,
        transaction_type,
        category_id,
        payee,
        category:categories(id, name, category_type)
      `)
      .range(offset, offset + BATCH_SIZE - 1);

    // Apply same filters as getPaginatedTransactions
    if (options.accountId) {
      query = query.eq('account_id', options.accountId);
    }
    if (options.categoryId) {
      if (options.categoryId === 'uncategorised') {
        query = query.is('category_id', null);
      } else {
        query = query.eq('category_id', options.categoryId);
      }
    }
    if (options.uncategorisedOnly) {
      query = query.is('category_id', null);
    }
    if (options.transactionType) {
      query = query.eq('transaction_type', options.transactionType);
    }
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('date', options.dateTo);
    }
    if (options.search) {
      query = query.or(`description.ilike.%${options.search}%,payee.ilike.%${options.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chart summary batch:', error);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...(data as typeof allData)];
      offset += BATCH_SIZE;
      // Continue fetching if we got a full batch (might be more data)
      hasMore = data.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  console.log('[ChartSummary] Total rows fetched:', allData.length, 'with filters:', JSON.stringify(options));

  if (allData.length === 0) {
    return {
      topCategories: [],
      topPayees: [],
      totalIncome: 0,
      totalExpenses: 0,
      totalCount: 0,
    };
  }

  const data = allData;

  // Aggregate by category
  const categoryMap = new Map<string, CategorySummary>();
  const payeeMap = new Map<string, PayeeSummary>();
  let totalIncome = 0;
  let totalExpenses = 0;
  let skippedTransfers = 0;

  for (const t of data as Array<{
    amount: number;
    transaction_type: string;
    category_id: string | null;
    payee: string | null;
    category: { id: string; name: string; category_type: string } | null;
  }>) {
    // Skip transfers - they shouldn't appear in charts
    if (t.transaction_type === 'transfer' || t.category?.category_type === 'transfer') {
      skippedTransfers++;
      continue;
    }

    // Track totals
    if (t.transaction_type === 'income') {
      totalIncome += t.amount;
    } else if (t.transaction_type === 'expense') {
      totalExpenses += t.amount;

      // Aggregate expenses by category
      const categoryKey = t.category_id || 'uncategorised';
      const categoryName = t.category?.name || 'Uncategorised';
      const existing = categoryMap.get(categoryKey);
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        categoryMap.set(categoryKey, {
          id: t.category_id,
          name: categoryName,
          amount: t.amount,
          count: 1,
        });
      }

      // Aggregate expenses by payee
      const payeeName = t.payee || 'Unknown';
      const existingPayee = payeeMap.get(payeeName);
      if (existingPayee) {
        existingPayee.amount += t.amount;
        existingPayee.count += 1;
      } else {
        payeeMap.set(payeeName, {
          name: payeeName,
          amount: t.amount,
          count: 1,
        });
      }
    }
  }

  // Sort and get top 20 to ensure subcategories are included
  // The chart will group subcategories under parents, so we need more data
  const topCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 20);

  const topPayees = Array.from(payeeMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15);

  return {
    topCategories,
    topPayees,
    totalIncome,
    totalExpenses,
    totalCount: data.length,
  };
}

/**
 * Fetches transactions for a specific category or payee (on-demand for chart popups).
 * Applies the same filters as the chart summary for consistency.
 *
 * @param type - Whether to filter by 'category' or 'payee'
 * @param value - The category name or payee name to filter by
 * @param options - Same filter options as chart summary (date range, account, etc.)
 * @returns Promise resolving to array of matching transactions
 */
export async function getTransactionsForChartPopup(
  type: 'category' | 'payee',
  value: string,
  options: PaginatedTransactionOptions = {}
): Promise<Transaction[]> {
  const supabase = await createClient();

  // Build query with full transaction data for popup display
  let query = supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(*),
      category:categories(*)
    `)
    .eq('transaction_type', 'expense') // Charts only show expenses
    .order('date', { ascending: false });

  // Apply same filters as chart summary
  if (options.accountId) {
    query = query.eq('account_id', options.accountId);
  }
  if (options.dateFrom) {
    query = query.gte('date', options.dateFrom);
  }
  if (options.dateTo) {
    query = query.lte('date', options.dateTo);
  }
  if (options.search) {
    query = query.or(`description.ilike.%${options.search}%,payee.ilike.%${options.search}%`);
  }

  // Batch fetch to handle large datasets
  const BATCH_SIZE = 1000;
  let allData: Transaction[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batchQuery = query.range(offset, offset + BATCH_SIZE - 1);
    const { data, error } = await batchQuery;

    if (error) {
      console.error('Error fetching chart popup transactions:', error);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...(data as unknown as Transaction[])];
      offset += BATCH_SIZE;
      hasMore = data.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  // Filter by category or payee (done client-side for flexibility with category naming)
  // This allows matching "Holiday: Hammo" when clicking parent "Holiday"
  let filtered: Transaction[];

  if (type === 'category') {
    if (value === 'Uncategorised') {
      filtered = allData.filter(t => !t.category_id);
    } else {
      // Check if this is a parent category (match prefix) or exact match
      const prefix = value + ':';
      filtered = allData.filter(t => {
        const catName = t.category?.name || 'Uncategorised';
        return catName === value || catName.startsWith(prefix);
      });
    }
  } else {
    // Payee filter
    filtered = allData.filter(t => {
      const payeeName = t.payee || 'Unknown';
      return payeeName === value;
    });
  }

  // Exclude transfers
  filtered = filtered.filter(t => t.category?.category_type !== 'transfer');

  return filtered;
}
