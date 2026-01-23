import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeCodeForTokens,
  getXeroConnections,
  getXeroBankAccounts,
  calculateTokenExpiry,
} from '@/lib/xero/client';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { findBestMatch } from '@/lib/xero/matching';
import type { Account } from '@/lib/types';

/**
 * Get the public URL for redirects
 * Handles local dev vs production environments
 */
function getPublicUrl(request: NextRequest): string {
  // First check explicit env var
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // For local development, use the request origin
  const host = request.headers.get('host');
  if (host?.includes('localhost')) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  // Default to production
  return 'https://finances.moyle.app';
}

export async function GET(request: NextRequest) {
  const publicUrl = getPublicUrl(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Xero OAuth error:', error, searchParams.get('error_description'));
      return NextResponse.redirect(
        new URL('/settings/bank-connections?error=oauth_denied', publicUrl)
      );
    }

    // Verify we have the required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/bank-connections?error=missing_params', publicUrl)
      );
    }

    // For single-family app, we just verify state starts with our default user ID
    // (Cookie-based state verification doesn't work reliably on Firebase)
    if (!state.startsWith(DEFAULT_USER_ID)) {
      console.error('Invalid state - does not match default user:', state);
      return NextResponse.redirect(
        new URL('/settings/bank-connections?error=invalid_state', publicUrl)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const tokenExpiry = calculateTokenExpiry(tokens.expires_in);

    // Get connected tenants/organizations
    const connections = await getXeroConnections(tokens.access_token);

    if (connections.length === 0) {
      return NextResponse.redirect(
        new URL('/settings/bank-connections?error=no_organization', publicUrl)
      );
    }

    const supabase = await createClient();

    console.log('Processing connections:', connections.length);
    console.log('Using DEFAULT_USER_ID:', DEFAULT_USER_ID);

    // Store each connected tenant
    for (const connection of connections) {
      console.log('Processing tenant:', connection.tenantName, connection.tenantId);

      // Check if connection already exists
      const { data: existing, error: selectError } = await supabase
        .from('xero_connections')
        .select('id')
        .eq('user_id', DEFAULT_USER_ID)
        .eq('tenant_id', connection.tenantId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Select error:', selectError);
      }

      if (existing) {
        console.log('Updating existing connection:', existing.id);
        // Update existing connection
        const { error: updateError } = await supabase
          .from('xero_connections')
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: tokenExpiry.toISOString(),
            tenant_name: connection.tenantName,
            tenant_type: connection.tenantType,
            status: 'active',
            status_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create new connection
        console.log('Inserting new connection for tenant:', connection.tenantName);
        const { data: insertData, error: insertError } = await supabase.from('xero_connections').insert({
          user_id: DEFAULT_USER_ID,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiry.toISOString(),
          tenant_id: connection.tenantId,
          tenant_name: connection.tenantName,
          tenant_type: connection.tenantType,
          status: 'active',
          sync_enabled: true,
          sync_frequency: 'daily',
        }).select();

        if (insertError) {
          console.error('INSERT ERROR:', insertError);
        } else {
          console.log('INSERT SUCCESS:', insertData);
        }
      }

      // Fetch and store bank accounts for this tenant
      try {
        const bankAccounts = await getXeroBankAccounts(
          tokens.access_token,
          connection.tenantId
        );

        // Get the connection ID
        const { data: connData } = await supabase
          .from('xero_connections')
          .select('id')
          .eq('user_id', DEFAULT_USER_ID)
          .eq('tenant_id', connection.tenantId)
          .single();

        if (connData) {
          // Fetch local accounts for auto-linking
          const { data: localAccounts } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID);

          for (const account of bankAccounts) {
            // Check if mapping exists
            const { data: existingMapping } = await supabase
              .from('xero_account_mappings')
              .select('id, local_account_id')
              .eq('connection_id', connData.id)
              .eq('xero_account_id', account.AccountID)
              .single();

            if (!existingMapping) {
              // Try to auto-match with existing local accounts
              let localAccountId: string | null = null;

              if (localAccounts && localAccounts.length > 0) {
                const { account: matchedAccount, confidence } = findBestMatch(
                  account,
                  localAccounts as Account[]
                );

                // Auto-link if confidence is high enough (70%+)
                if (matchedAccount && confidence >= 70) {
                  localAccountId = matchedAccount.id;
                  console.log(`Auto-linking Xero "${account.Name}" to local "${matchedAccount.name}" (${confidence}% confidence)`);
                }
              }

              await supabase.from('xero_account_mappings').insert({
                connection_id: connData.id,
                xero_account_id: account.AccountID,
                xero_account_name: account.Name,
                xero_account_code: account.Code,
                xero_account_type: account.BankAccountType || account.Type,
                local_account_id: localAccountId,
                is_sync_enabled: true,
              });
            } else if (!existingMapping.local_account_id && localAccounts && localAccounts.length > 0) {
              // Existing mapping without local link - try to auto-match
              const { account: matchedAccount, confidence } = findBestMatch(
                account,
                localAccounts as Account[]
              );

              if (matchedAccount && confidence >= 70) {
                console.log(`Auto-linking existing Xero "${account.Name}" to local "${matchedAccount.name}" (${confidence}% confidence)`);
                await supabase
                  .from('xero_account_mappings')
                  .update({ local_account_id: matchedAccount.id })
                  .eq('id', existingMapping.id);
              }
            }
          }
        }
      } catch (accountError) {
        console.error('Error fetching bank accounts:', accountError);
        // Continue anyway - accounts can be synced later
      }
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/bank-connections?success=connected', publicUrl)
    );
  } catch (error) {
    console.error('Xero callback error:', error);
    return NextResponse.redirect(
      new URL('/settings/bank-connections?error=callback_failed', publicUrl)
    );
  }
}
