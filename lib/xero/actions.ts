'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import {
  refreshAccessToken,
  isTokenExpired,
  calculateTokenExpiry,
  getAllXeroBankTransactions,
  getXeroBankAccounts,
  getXeroAuthUrl,
  getBankStatementLines,
} from './client';
import {
  XeroConnectionDB,
  XeroAccountMappingDB,
  XeroSyncLogDB,
  xeroTransactionToMFFA,
  bankStatementLineToMFFA,
  SyncResult,
  XeroAccountComparisonResult,
  ReviewXeroAccountsResult,
} from './types';
import { getAccounts as getLocalAccounts } from '@/lib/accounts/actions';
import { findBestMatch, mapXeroTypeToMFFAType } from './matching';
import { DEFAULT_USER_ID } from '@/lib/constants';

/**
 * Start Xero OAuth flow - returns the authorization URL
 * @param userId - User ID (defaults to family default since app has no auth)
 */
export async function initiateXeroAuth(userId?: string): Promise<{ url: string | null; error: string | null }> {
  try {
    // Use provided userId or default (no auth in this app)
    const effectiveUserId = userId || DEFAULT_USER_ID;

    // Generate a unique state parameter to prevent CSRF
    const state = `${effectiveUserId}:${nanoid()}`;

    // Store state in cookie
    const cookieStore = await cookies();
    cookieStore.set('xero_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Get the auth URL
    const authUrl = getXeroAuthUrl(state);
    return { url: authUrl, error: null };
  } catch (error) {
    console.error('Error initiating Xero auth:', error);
    return { url: null, error: 'Failed to start Xero authorization' };
  }
}

/**
 * Get all Xero connections for the family (no auth)
 */
export async function getXeroConnections(): Promise<{
  connections: XeroConnectionDB[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Xero connections:', error);
      return { connections: [], error: error.message };
    }

    return { connections: data || [], error: null };
  } catch (error) {
    console.error('Error in getXeroConnections:', error);
    return { connections: [], error: 'Failed to fetch connections' };
  }
}

/**
 * Get account mappings for a connection
 */
export async function getAccountMappings(connectionId: string): Promise<{
  mappings: XeroAccountMappingDB[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { mappings: [], error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('xero_account_mappings')
      .select('*')
      .eq('connection_id', connectionId);

    if (error) {
      console.error('Error fetching account mappings:', error);
      return { mappings: [], error: error.message };
    }

    return { mappings: data || [], error: null };
  } catch (error) {
    console.error('Error in getAccountMappings:', error);
    return { mappings: [], error: 'Failed to fetch mappings' };
  }
}

/**
 * Get sync logs for a connection
 */
export async function getSyncLogs(connectionId: string): Promise<{
  logs: XeroSyncLogDB[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('xero_sync_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching sync logs:', error);
      return { logs: [], error: error.message };
    }

    return { logs: data || [], error: null };
  } catch (error) {
    console.error('Error in getSyncLogs:', error);
    return { logs: [], error: 'Failed to fetch logs' };
  }
}

/**
 * Update account mapping (link Xero account to MFFA account)
 */
export async function updateAccountMapping(
  mappingId: string,
  localAccountId: string | null,
  isSyncEnabled: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('xero_account_mappings')
      .update({
        local_account_id: localAccountId,
        is_sync_enabled: isSyncEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mappingId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/bank-connections');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateAccountMapping:', error);
    return { success: false, error: 'Failed to update mapping' };
  }
}

/**
 * Ensure access token is valid, refresh if needed
 */
async function ensureValidToken(
  connection: XeroConnectionDB
): Promise<{ accessToken: string; error: string | null }> {
  const supabase = await createClient();

  // Check if token is expired
  if (
    connection.token_expires_at &&
    !isTokenExpired(connection.token_expires_at)
  ) {
    return { accessToken: connection.access_token!, error: null };
  }

  // Need to refresh token
  if (!connection.refresh_token) {
    // Update connection status
    await supabase
      .from('xero_connections')
      .update({
        status: 'expired',
        status_message: 'Refresh token missing - please reconnect',
      })
      .eq('id', connection.id);

    return { accessToken: '', error: 'Token expired - please reconnect to Xero' };
  }

  try {
    const tokens = await refreshAccessToken(connection.refresh_token);
    const tokenExpiry = calculateTokenExpiry(tokens.expires_in);

    // Update connection with new tokens
    await supabase
      .from('xero_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiry.toISOString(),
        status: 'active',
        status_message: null,
      })
      .eq('id', connection.id);

    return { accessToken: tokens.access_token, error: null };
  } catch (error) {
    console.error('Token refresh failed:', error);

    // Update connection status
    await supabase
      .from('xero_connections')
      .update({
        status: 'expired',
        status_message: 'Token refresh failed - please reconnect',
      })
      .eq('id', connection.id);

    return { accessToken: '', error: 'Token refresh failed - please reconnect to Xero' };
  }
}

/**
 * Sync transactions from Xero for a specific connection
 */
export async function syncXeroTransactions(
  connectionId: string,
  syncType: 'manual' | 'scheduled' | 'initial' = 'manual'
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    accountsSynced: 0,
    transactionsImported: 0,
    transactionsSkipped: 0,
    transactionsUpdated: 0,
    errors: [],
  };

  const supabase = await createClient();
  let logId: string | null = null;

  try {
    // Get connection (no auth - use default user)
    const { data: connection, error: connError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (connError || !connection) {
      result.errors.push('Connection not found');
      return result;
    }

    // Create sync log entry
    const { data: logData } = await supabase
      .from('xero_sync_logs')
      .insert({
        connection_id: connectionId,
        sync_type: syncType,
        status: 'started',
      })
      .select('id')
      .single();

    logId = logData?.id || null;

    // Ensure valid token
    const { accessToken, error: tokenError } = await ensureValidToken(connection);
    if (tokenError) {
      result.errors.push(tokenError);
      if (logId) {
        await supabase
          .from('xero_sync_logs')
          .update({
            status: 'failed',
            error_message: tokenError,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          })
          .eq('id', logId);
      }
      return result;
    }

    // Get account mappings that are enabled for sync
    const { data: mappings } = await supabase
      .from('xero_account_mappings')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('is_sync_enabled', true);

    if (!mappings || mappings.length === 0) {
      result.errors.push('No accounts configured for sync');
      if (logId) {
        await supabase
          .from('xero_sync_logs')
          .update({
            status: 'completed',
            error_message: 'No accounts configured for sync',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          })
          .eq('id', logId);
      }
      return result;
    }

    let apiCalls = 0;

    // Process each mapped account
    for (const mapping of mappings) {
      if (!mapping.local_account_id) {
        // Skip accounts not linked to MFFA accounts
        continue;
      }

      try {
        // Fetch transactions from Xero
        const modifiedSince = mapping.last_transaction_date
          ? new Date(mapping.last_transaction_date)
          : undefined;

        const xeroTransactions = await getAllXeroBankTransactions(
          accessToken,
          connection.tenant_id,
          {
            bankAccountId: mapping.xero_account_id,
            modifiedSince,
            maxPages: 5, // Limit for safety
          }
        );
        apiCalls++;

        result.accountsSynced++;

        // Process each transaction
        for (const xeroTx of xeroTransactions) {
          // Check if transaction already exists
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('external_id', xeroTx.BankTransactionID)
            .eq('external_source', 'xero')
            .single();

          if (existing) {
            result.transactionsSkipped++;
            continue;
          }

          // Transform and insert transaction
          const mffaTx = xeroTransactionToMFFA(
            xeroTx,
            mapping.local_account_id,
            DEFAULT_USER_ID
          );

          const { error: insertError } = await supabase
            .from('transactions')
            .insert(mffaTx);

          if (insertError) {
            console.error('Error inserting transaction:', insertError);
            result.errors.push(`Failed to import transaction: ${xeroTx.BankTransactionID}`);
          } else {
            result.transactionsImported++;
          }
        }

        // Update last transaction date for mapping
        const latestDate = xeroTransactions.reduce((latest, tx) => {
          const txDate = new Date(tx.Date);
          return txDate > latest ? txDate : latest;
        }, new Date(0));

        if (latestDate.getTime() > 0) {
          await supabase
            .from('xero_account_mappings')
            .update({
              last_transaction_date: latestDate.toISOString().split('T')[0],
            })
            .eq('id', mapping.id);
        }
      } catch (accountError) {
        console.error(
          `Error syncing account ${mapping.xero_account_name}:`,
          accountError
        );
        result.errors.push(
          `Failed to sync ${mapping.xero_account_name}: ${accountError}`
        );
      }
    }

    // Update connection last sync time
    await supabase
      .from('xero_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        next_sync_at:
          connection.sync_frequency === 'hourly'
            ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', connectionId);

    // Update sync log
    const durationMs = Date.now() - startTime;
    if (logId) {
      await supabase
        .from('xero_sync_logs')
        .update({
          status: result.errors.length > 0 ? 'partial' : 'completed',
          accounts_synced: result.accountsSynced,
          transactions_imported: result.transactionsImported,
          transactions_skipped: result.transactionsSkipped,
          transactions_updated: result.transactionsUpdated,
          api_calls_used: apiCalls,
          error_message:
            result.errors.length > 0 ? result.errors.join('; ') : null,
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
        })
        .eq('id', logId);
    }

    result.success = true;
    revalidatePath('/settings/bank-connections');
    revalidatePath('/transactions');

    return result;
  } catch (error) {
    console.error('Sync error:', error);
    result.errors.push(String(error));

    if (logId) {
      await supabase
        .from('xero_sync_logs')
        .update({
          status: 'failed',
          error_message: String(error),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq('id', logId);
    }

    return result;
  }
}

/**
 * Disconnect Xero connection
 */
export async function disconnectXero(
  connectionId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    // Delete account mappings first (due to FK constraint)
    await supabase
      .from('xero_account_mappings')
      .delete()
      .eq('connection_id', connectionId);

    // Delete sync logs
    await supabase
      .from('xero_sync_logs')
      .delete()
      .eq('connection_id', connectionId);

    // Delete connection (no auth - use default user)
    const { error } = await supabase
      .from('xero_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', DEFAULT_USER_ID);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/bank-connections');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error disconnecting Xero:', error);
    return { success: false, error: 'Failed to disconnect' };
  }
}

/**
 * Refresh bank accounts from Xero
 */
export async function refreshXeroAccounts(
  connectionId: string
): Promise<{ success: boolean; accountsFound: number; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get connection (no auth - use default user)
    const { data: connection, error: connError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (connError || !connection) {
      return { success: false, accountsFound: 0, error: 'Connection not found' };
    }

    // Ensure valid token
    const { accessToken, error: tokenError } = await ensureValidToken(connection);
    if (tokenError) {
      return { success: false, accountsFound: 0, error: tokenError };
    }

    // Fetch bank accounts from Xero
    const bankAccounts = await getXeroBankAccounts(
      accessToken,
      connection.tenant_id
    );

    // Update/insert account mappings
    for (const account of bankAccounts) {
      const { data: existing } = await supabase
        .from('xero_account_mappings')
        .select('id')
        .eq('connection_id', connectionId)
        .eq('xero_account_id', account.AccountID)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('xero_account_mappings')
          .update({
            xero_account_name: account.Name,
            xero_account_code: account.Code,
            xero_account_type: account.BankAccountType || account.Type,
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase.from('xero_account_mappings').insert({
          connection_id: connectionId,
          xero_account_id: account.AccountID,
          xero_account_name: account.Name,
          xero_account_code: account.Code,
          xero_account_type: account.BankAccountType || account.Type,
          is_sync_enabled: true,
        });
      }
    }

    revalidatePath('/settings/bank-connections');
    return { success: true, accountsFound: bankAccounts.length, error: null };
  } catch (error) {
    console.error('Error refreshing accounts:', error);
    return { success: false, accountsFound: 0, error: 'Failed to refresh accounts' };
  }
}

/**
 * Review Xero accounts and compare with local accounts
 * Returns comparison results for each Xero bank account
 */
export async function reviewXeroAccounts(
  connectionId: string
): Promise<ReviewXeroAccountsResult> {
  try {
    console.log('[reviewXeroAccounts] Starting with connectionId:', connectionId);
    const supabase = await createClient();

    // Get connection (no auth - use default user)
    console.log('[reviewXeroAccounts] Fetching connection...');
    const { data: connection, error: connError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (connError || !connection) {
      console.error('[reviewXeroAccounts] Connection error:', connError);
      return { success: false, comparisons: [], error: 'Connection not found' };
    }
    console.log('[reviewXeroAccounts] Connection found:', connection.tenant_name);

    // Ensure valid token
    console.log('[reviewXeroAccounts] Ensuring valid token...');
    const { accessToken, error: tokenError } = await ensureValidToken(connection);
    if (tokenError) {
      console.error('[reviewXeroAccounts] Token error:', tokenError);
      return { success: false, comparisons: [], error: tokenError };
    }
    console.log('[reviewXeroAccounts] Token valid');

    // Fetch Xero bank accounts
    console.log('[reviewXeroAccounts] Fetching Xero bank accounts...');
    const xeroBankAccounts = await getXeroBankAccounts(
      accessToken,
      connection.tenant_id
    );
    console.log('[reviewXeroAccounts] Got', xeroBankAccounts.length, 'Xero accounts');

    // Fetch local accounts
    console.log('[reviewXeroAccounts] Fetching local accounts...');
    const localAccounts = await getLocalAccounts();
    console.log('[reviewXeroAccounts] Got', localAccounts.length, 'local accounts');

    // Fetch existing mappings for this connection
    const { data: existingMappings } = await supabase
      .from('xero_account_mappings')
      .select('*')
      .eq('connection_id', connectionId);

    const mappingsMap = new Map(
      (existingMappings || []).map(m => [m.xero_account_id, m])
    );

    // Build comparison results
    const comparisons: XeroAccountComparisonResult[] = [];

    for (const xeroAccount of xeroBankAccounts) {
      const existingMapping = mappingsMap.get(xeroAccount.AccountID) || null;

      // If already mapped to a local account, it's matched
      if (existingMapping?.local_account_id) {
        const linkedAccount = localAccounts.find(
          a => a.id === existingMapping.local_account_id
        );

        comparisons.push({
          xeroAccount,
          matchStatus: 'matched',
          localAccount: linkedAccount || null,
          confidence: 100,
          matchReason: 'Manually linked',
          existingMapping,
        });
        continue;
      }

      // Try to find a matching local account
      const { account, confidence, reason } = findBestMatch(
        xeroAccount,
        localAccounts
      );

      if (account && confidence >= 70) {
        // Suggested match (high confidence)
        comparisons.push({
          xeroAccount,
          matchStatus: 'suggested',
          localAccount: account,
          confidence,
          matchReason: reason,
          existingMapping,
        });
      } else if (account && confidence >= 50) {
        // Suggested match (medium confidence)
        comparisons.push({
          xeroAccount,
          matchStatus: 'suggested',
          localAccount: account,
          confidence,
          matchReason: reason,
          existingMapping,
        });
      } else {
        // No match found
        comparisons.push({
          xeroAccount,
          matchStatus: 'no_match',
          localAccount: null,
          confidence: 0,
          matchReason: null,
          existingMapping,
        });
      }
    }

    // Sort: matched first, then suggested (by confidence desc), then no_match
    comparisons.sort((a, b) => {
      const statusOrder = { matched: 0, suggested: 1, no_match: 2 };
      const statusDiff = statusOrder[a.matchStatus] - statusOrder[b.matchStatus];
      if (statusDiff !== 0) return statusDiff;
      return b.confidence - a.confidence;
    });

    return { success: true, comparisons, error: null };
  } catch (error) {
    console.error('Error reviewing Xero accounts:', error);
    return { success: false, comparisons: [], error: String(error) };
  }
}

/**
 * Import a Xero account as a new local account
 */
export async function importXeroAccountAsLocal(
  connectionId: string,
  xeroAccountId: string
): Promise<{ success: boolean; accountId: string | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (connError || !connection) {
      return { success: false, accountId: null, error: 'Connection not found' };
    }

    // Ensure valid token
    const { accessToken, error: tokenError } = await ensureValidToken(connection);
    if (tokenError) {
      return { success: false, accountId: null, error: tokenError };
    }

    // Fetch Xero bank accounts to get account details
    const xeroBankAccounts = await getXeroBankAccounts(
      accessToken,
      connection.tenant_id
    );

    const xeroAccount = xeroBankAccounts.find(a => a.AccountID === xeroAccountId);
    if (!xeroAccount) {
      return { success: false, accountId: null, error: 'Xero account not found' };
    }

    // Map Xero type to MFFA type
    const accountType = mapXeroTypeToMFFAType(
      xeroAccount.BankAccountType || xeroAccount.Type
    );

    // Create local account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert({
        user_id: DEFAULT_USER_ID,
        name: xeroAccount.Name,
        account_type: accountType,
        account_number: xeroAccount.BankAccountNumber || null,
        institution: connection.tenant_name || 'Xero',
        current_balance: 0,
        currency: xeroAccount.CurrencyCode || 'AUD',
        is_active: true,
        notes: `Imported from Xero (${xeroAccount.Code})`,
      })
      .select('id')
      .single();

    if (createError || !newAccount) {
      console.error('Error creating account:', createError);
      return { success: false, accountId: null, error: createError?.message || 'Failed to create account' };
    }

    // Update or create the mapping
    const { data: existingMapping } = await supabase
      .from('xero_account_mappings')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('xero_account_id', xeroAccountId)
      .single();

    if (existingMapping) {
      // Update existing mapping
      await supabase
        .from('xero_account_mappings')
        .update({
          local_account_id: newAccount.id,
          is_sync_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMapping.id);
    } else {
      // Create new mapping
      await supabase.from('xero_account_mappings').insert({
        connection_id: connectionId,
        xero_account_id: xeroAccountId,
        xero_account_name: xeroAccount.Name,
        xero_account_code: xeroAccount.Code,
        xero_account_type: xeroAccount.BankAccountType || xeroAccount.Type,
        local_account_id: newAccount.id,
        is_sync_enabled: true,
      });
    }

    revalidatePath('/settings/bank-connections');
    revalidatePath('/accounts');

    return { success: true, accountId: newAccount.id, error: null };
  } catch (error) {
    console.error('Error importing Xero account:', error);
    return { success: false, accountId: null, error: String(error) };
  }
}

/**
 * Link a Xero account to an existing local account
 */
export async function linkXeroToLocalAccount(
  connectionId: string,
  xeroAccountId: string,
  localAccountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    // Check if mapping exists
    const { data: existingMapping } = await supabase
      .from('xero_account_mappings')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('xero_account_id', xeroAccountId)
      .single();

    if (existingMapping) {
      // Update existing mapping
      const { error } = await supabase
        .from('xero_account_mappings')
        .update({
          local_account_id: localAccountId,
          is_sync_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMapping.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Need to fetch Xero account details first
      const { data: connection } = await supabase
        .from('xero_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', DEFAULT_USER_ID)
        .single();

      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      const { accessToken, error: tokenError } = await ensureValidToken(connection);
      if (tokenError) {
        return { success: false, error: tokenError };
      }

      const xeroBankAccounts = await getXeroBankAccounts(
        accessToken,
        connection.tenant_id
      );

      const xeroAccount = xeroBankAccounts.find(a => a.AccountID === xeroAccountId);
      if (!xeroAccount) {
        return { success: false, error: 'Xero account not found' };
      }

      // Create new mapping
      const { error } = await supabase.from('xero_account_mappings').insert({
        connection_id: connectionId,
        xero_account_id: xeroAccountId,
        xero_account_name: xeroAccount.Name,
        xero_account_code: xeroAccount.Code,
        xero_account_type: xeroAccount.BankAccountType || xeroAccount.Type,
        local_account_id: localAccountId,
        is_sync_enabled: true,
      });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/settings/bank-connections');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error linking accounts:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Import all unmatched Xero accounts as local accounts
 */
export async function importAllUnmatchedXeroAccounts(
  connectionId: string
): Promise<{ success: boolean; importedCount: number; error: string | null }> {
  try {
    // First, review to get the list of unmatched accounts
    const reviewResult = await reviewXeroAccounts(connectionId);
    if (!reviewResult.success) {
      return { success: false, importedCount: 0, error: reviewResult.error };
    }

    const unmatchedAccounts = reviewResult.comparisons.filter(
      c => c.matchStatus === 'no_match'
    );

    let importedCount = 0;
    const errors: string[] = [];

    for (const comparison of unmatchedAccounts) {
      const result = await importXeroAccountAsLocal(
        connectionId,
        comparison.xeroAccount.AccountID
      );

      if (result.success) {
        importedCount++;
      } else {
        errors.push(`${comparison.xeroAccount.Name}: ${result.error}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: importedCount > 0,
        importedCount,
        error: errors.join('; '),
      };
    }

    return { success: true, importedCount, error: null };
  } catch (error) {
    console.error('Error importing all unmatched accounts:', error);
    return { success: false, importedCount: 0, error: String(error) };
  }
}

/**
 * Get Xero link status for multiple local accounts
 * Returns a map of account_id -> xero mapping info
 */
export async function getXeroLinkStatusForAccounts(
  accountIds: string[]
): Promise<{
  links: Record<string, { xeroAccountName: string; connectionId: string; mappingId: string; lastSyncAt: string | null } | null>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data: mappings, error } = await supabase
      .from('xero_account_mappings')
      .select('*')
      .in('local_account_id', accountIds);

    if (error) {
      return { links: {}, error: error.message };
    }

    const links: Record<string, { xeroAccountName: string; connectionId: string; mappingId: string; lastSyncAt: string | null } | null> = {};

    // Initialize all as null
    for (const id of accountIds) {
      links[id] = null;
    }

    // Fill in linked accounts
    for (const mapping of mappings || []) {
      if (mapping.local_account_id) {
        // Use the per-mapping last_sync_at timestamp, fall back to updated_at or last_transaction_date
        const mappingData = mapping as typeof mapping & { last_sync_at?: string | null };
        links[mapping.local_account_id] = {
          xeroAccountName: mapping.xero_account_name || 'Unknown',
          connectionId: mapping.connection_id,
          mappingId: mapping.id,
          lastSyncAt: mappingData.last_sync_at || mapping.updated_at || mapping.last_transaction_date || null,
        };
      }
    }

    return { links, error: null };
  } catch (error) {
    console.error('Error getting Xero link status:', error);
    return { links: {}, error: String(error) };
  }
}

/**
 * Get available Xero accounts that can be linked to a local account
 */
export async function getAvailableXeroAccountsForLinking(): Promise<{
  accounts: Array<{
    id: string;
    connectionId: string;
    xeroAccountId: string;
    xeroAccountName: string;
    xeroAccountCode: string;
    isLinked: boolean;
  }>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data: mappings, error } = await supabase
      .from('xero_account_mappings')
      .select('id, connection_id, xero_account_id, xero_account_name, xero_account_code, local_account_id');

    if (error) {
      return { accounts: [], error: error.message };
    }

    const accounts = (mappings || []).map(m => ({
      id: m.id,
      connectionId: m.connection_id,
      xeroAccountId: m.xero_account_id,
      xeroAccountName: m.xero_account_name || 'Unknown',
      xeroAccountCode: m.xero_account_code || '',
      isLinked: !!m.local_account_id,
    }));

    return { accounts, error: null };
  } catch (error) {
    console.error('Error getting available Xero accounts:', error);
    return { accounts: [], error: String(error) };
  }
}

/**
 * Link a local account to a Xero account mapping
 */
export async function linkLocalAccountToXero(
  localAccountId: string,
  mappingId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('xero_account_mappings')
      .update({
        local_account_id: localAccountId,
        is_sync_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mappingId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/accounts');
    revalidatePath('/settings/bank-connections');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error linking account to Xero:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Unlink a local account from Xero
 */
export async function unlinkLocalAccountFromXero(
  localAccountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('xero_account_mappings')
      .update({
        local_account_id: null,
        is_sync_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('local_account_id', localAccountId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/accounts');
    revalidatePath('/settings/bank-connections');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error unlinking account from Xero:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Sync transactions for a specific local account from Xero
 * This finds the Xero mapping and syncs only new transactions
 */
export async function syncAccountTransactions(
  localAccountId: string
): Promise<{
  success: boolean;
  transactionsImported: number;
  transactionsSkipped: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Use default user ID (no auth in this app)
    const userId = DEFAULT_USER_ID;

    // Find the Xero mapping for this account
    console.log('[syncAccountTransactions] Looking for mapping with local_account_id:', localAccountId);

    const { data: mapping, error: mappingError } = await supabase
      .from('xero_account_mappings')
      .select('*, xero_connections(*)')
      .eq('local_account_id', localAccountId)
      .single();

    console.log('[syncAccountTransactions] Mapping result:', { mapping: mapping ? { id: mapping.id, xero_account_id: mapping.xero_account_id, xero_account_name: mapping.xero_account_name } : null, error: mappingError });

    if (mappingError || !mapping) {
      return {
        success: false,
        transactionsImported: 0,
        transactionsSkipped: 0,
        error: 'No Xero connection found for this account',
      };
    }

    const connection = mapping.xero_connections;
    console.log('[syncAccountTransactions] Connection:', { tenant_id: connection?.tenant_id, tenant_name: connection?.tenant_name });
    if (!connection) {
      return {
        success: false,
        transactionsImported: 0,
        transactionsSkipped: 0,
        error: 'Xero connection details not found',
      };
    }

    // Ensure valid token
    const { accessToken, error: tokenError } = await ensureValidToken(connection);
    if (tokenError) {
      return {
        success: false,
        transactionsImported: 0,
        transactionsSkipped: 0,
        error: tokenError,
      };
    }

    let transactionsImported = 0;
    let transactionsSkipped = 0;

    // Fetch bank transactions from Xero
    // Note: BankTransactions only contains reconciled transactions
    // The BankStatement report endpoint requires special Xero developer approval
    console.log('[syncAccountTransactions] Calling getAllXeroBankTransactions with:', {
      tenant_id: connection.tenant_id,
      bankAccountId: mapping.xero_account_id,
    });

    const xeroTransactions = await getAllXeroBankTransactions(
      accessToken,
      connection.tenant_id,
      {
        bankAccountId: mapping.xero_account_id,
        maxPages: 10,
      }
    );

    console.log(`[syncAccountTransactions] Fetched ${xeroTransactions.length} transactions from Xero`);
    if (xeroTransactions.length > 0) {
      console.log('[syncAccountTransactions] First transaction:', xeroTransactions[0].BankTransactionID);
    }

    // Process each transaction
    for (const xeroTx of xeroTransactions) {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('external_id', xeroTx.BankTransactionID)
        .eq('external_source', 'xero')
        .single();

      if (existing) {
        transactionsSkipped++;
        continue;
      }

      // Transform and insert transaction
      const mffaTx = xeroTransactionToMFFA(
        xeroTx,
        localAccountId,
        userId
      );

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(mffaTx);

      if (insertError) {
        console.error('Error inserting transaction:', insertError);
      } else {
        transactionsImported++;
      }
    }

    // Update the mapping's last sync timestamp
    const syncTime = new Date().toISOString();
    await supabase
      .from('xero_account_mappings')
      .update({
        last_transaction_date: syncTime,
        last_sync_at: syncTime,
        updated_at: syncTime,
      })
      .eq('id', mapping.id);

    // Update the connection's last sync timestamp
    await supabase
      .from('xero_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    revalidatePath('/accounts');
    revalidatePath('/transactions');

    return {
      success: true,
      transactionsImported,
      transactionsSkipped,
      error: null,
    };
  } catch (error) {
    console.error('Error syncing account transactions:', error);
    return {
      success: false,
      transactionsImported: 0,
      transactionsSkipped: 0,
      error: String(error),
    };
  }
}
