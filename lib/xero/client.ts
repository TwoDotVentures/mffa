// Xero API Client
import {
  XeroTokenResponse,
  XeroConnection,
  XeroBankTransactionsResponse,
  XeroAccountsResponse,
  XeroAccount,
  XeroBankTransaction,
  XeroBankStatementLine,
} from './types';

const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_API_URL = 'https://api.xero.com/api.xro/2.0';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

// Scopes needed for bank transaction sync
const XERO_SCOPES = [
  'openid',
  'profile',
  'email',
  'accounting.transactions.read',
  'accounting.settings.read',
  'accounting.contacts.read',
  'offline_access', // Required for refresh tokens
].join(' ');

/**
 * Get the appropriate redirect URI based on environment
 */
export function getXeroRedirectUri(): string {
  // Check for explicit redirect URI first
  if (process.env.XERO_REDIRECT_URI) {
    return process.env.XERO_REDIRECT_URI;
  }

  // Fall back to app URL + /callback
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://finances.moyle.app';
  return `${appUrl}/callback`;
}

/**
 * Generate the Xero OAuth authorization URL
 */
export function getXeroAuthUrl(state: string): string {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = getXeroRedirectUri();

  if (!clientId) {
    throw new Error('Missing Xero client ID configuration');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: XERO_SCOPES,
    state,
  });

  return `${XERO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<XeroTokenResponse> {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Xero configuration');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange error:', error);
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<XeroTokenResponse> {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Xero configuration');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh error:', error);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  return response.json();
}

/**
 * Get connected Xero tenants/organizations
 */
export async function getXeroConnections(
  accessToken: string
): Promise<XeroConnection[]> {
  const response = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get connections: ${response.status}`);
  }

  return response.json();
}

/**
 * Get bank accounts from Xero
 */
export async function getXeroBankAccounts(
  accessToken: string,
  tenantId: string
): Promise<XeroAccount[]> {
  // URL encode the where parameter properly
  const whereClause = encodeURIComponent('Type=="BANK"');
  const url = `${XERO_API_URL}/Accounts?where=${whereClause}`;
  console.log('[getXeroBankAccounts] Fetching:', url);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  console.log('[getXeroBankAccounts] Response status:', response.status);
  console.log('[getXeroBankAccounts] Response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('[getXeroBankAccounts] Response body (first 500 chars):', responseText.substring(0, 500));

  if (!response.ok) {
    console.error('Get accounts error:', responseText);
    throw new Error(`Failed to get bank accounts: ${response.status}`);
  }

  // Parse the text we already read
  const data: XeroAccountsResponse = JSON.parse(responseText);
  return data.Accounts.filter((a) => a.Status === 'ACTIVE');
}

/**
 * Get all accounts from Xero (including non-bank)
 */
export async function getXeroAccounts(
  accessToken: string,
  tenantId: string
): Promise<XeroAccount[]> {
  const response = await fetch(`${XERO_API_URL}/Accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get accounts: ${response.status}`);
  }

  const data: XeroAccountsResponse = await response.json();
  return data.Accounts;
}

/**
 * Get bank transactions from Xero
 * @param accessToken - The OAuth access token
 * @param tenantId - The Xero tenant/organization ID
 * @param bankAccountId - Optional: filter by specific bank account
 * @param modifiedSince - Optional: only get transactions modified after this date
 * @param page - Page number for pagination (1-based)
 * @param includeAll - If true, don't filter by status (get all transactions)
 */
export async function getXeroBankTransactions(
  accessToken: string,
  tenantId: string,
  options?: {
    bankAccountId?: string;
    modifiedSince?: Date;
    page?: number;
    includeAll?: boolean;
  }
): Promise<XeroBankTransaction[]> {
  const params = new URLSearchParams();

  // Build where clause - only filter by status if includeAll is false
  const whereConditions: string[] = [];
  if (!options?.includeAll) {
    whereConditions.push('Status=="AUTHORISED"');
  }
  if (options?.bankAccountId) {
    whereConditions.push(`BankAccount.AccountID==guid("${options.bankAccountId}")`);
  }
  if (whereConditions.length > 0) {
    // Don't encode here - URLSearchParams handles encoding automatically
    params.set('where', whereConditions.join(' AND '));
  }

  // Pagination
  if (options?.page && options.page > 1) {
    params.set('page', options.page.toString());
  }

  // Order by date descending to get most recent first
  params.set('order', 'Date DESC');

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    'Xero-Tenant-Id': tenantId,
    'Content-Type': 'application/json',
  };

  // Add If-Modified-Since header for incremental sync
  if (options?.modifiedSince) {
    headers['If-Modified-Since'] = options.modifiedSince.toUTCString();
  }

  const url = `${XERO_API_URL}/BankTransactions?${params.toString()}`;
  console.log('[getXeroBankTransactions] Fetching:', url);

  const response = await fetch(url, {
    headers: {
      ...headers,
      'Accept': 'application/json',
    }
  });

  console.log('[getXeroBankTransactions] Response status:', response.status);

  // 304 Not Modified means no new data
  if (response.status === 304) {
    return [];
  }

  const responseText = await response.text();

  if (!response.ok) {
    console.error('Get transactions error:', responseText.substring(0, 500));
    throw new Error(`Failed to get bank transactions: ${response.status}`);
  }

  // Parse the text we already read
  const data: XeroBankTransactionsResponse = JSON.parse(responseText);
  console.log('[getXeroBankTransactions] Got', data.BankTransactions?.length || 0, 'transactions');
  if (data.BankTransactions?.length) {
    console.log('[getXeroBankTransactions] First transaction:', JSON.stringify(data.BankTransactions[0], null, 2).substring(0, 300));
  }
  return data.BankTransactions || [];
}

/**
 * Get all bank transactions with automatic pagination
 */
export async function getAllXeroBankTransactions(
  accessToken: string,
  tenantId: string,
  options?: {
    bankAccountId?: string;
    modifiedSince?: Date;
    maxPages?: number;
  }
): Promise<XeroBankTransaction[]> {
  const allTransactions: XeroBankTransaction[] = [];
  const maxPages = options?.maxPages || 10; // Safety limit

  for (let page = 1; page <= maxPages; page++) {
    const transactions = await getXeroBankTransactions(accessToken, tenantId, {
      ...options,
      page,
    });

    if (transactions.length === 0) {
      break; // No more results
    }

    allTransactions.push(...transactions);

    // Xero returns max 100 per page, if less than that, we've got all
    if (transactions.length < 100) {
      break;
    }
  }

  return allTransactions;
}

/**
 * Get bank statement lines from the Reports/BankStatement endpoint
 * This returns ALL statement lines including unreconciled ones
 */
export async function getBankStatementLines(
  accessToken: string,
  tenantId: string,
  bankAccountId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<XeroBankStatementLine[]> {
  // Default to last 90 days if no dates provided
  const from = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const to = toDate || new Date();

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const url = `${XERO_API_URL}/Reports/BankStatement?bankAccountID=${bankAccountId}&fromDate=${fromStr}&toDate=${toStr}`;
  console.log('[getBankStatementLines] Fetching:', url);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-Tenant-Id': tenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  console.log('[getBankStatementLines] Response status:', response.status);
  console.log('[getBankStatementLines] Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const error = await response.text();
    console.error('[getBankStatementLines] Error response:', error);
    console.error('[getBankStatementLines] Check if you have accounting.reports.read scope');
    throw new Error(`Failed to get bank statement: ${response.status} - ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  console.log('[getBankStatementLines] Got report data');

  // Parse the complex report structure to extract statement lines
  const lines: XeroBankStatementLine[] = [];

  try {
    const report = data.Reports?.[0];
    if (!report?.Rows) {
      console.log('[getBankStatementLines] No rows in report');
      return [];
    }

    // Find the section with statement lines (usually Row[1] with RowType "Section")
    for (const row of report.Rows) {
      if (row.RowType === 'Section' && row.Rows) {
        for (const statementRow of row.Rows) {
          if (statementRow.RowType === 'Row' && statementRow.Cells) {
            const cells = statementRow.Cells;
            // Cells order: Date, Description, Reference, Reconciled, Source, Amount, Balance
            if (cells.length >= 7) {
              lines.push({
                Date: cells[0]?.Value || '',
                Description: cells[1]?.Value || '',
                Reference: cells[2]?.Value || '',
                Reconciled: cells[3]?.Value === 'Yes',
                Source: cells[4]?.Value || '',
                Amount: parseFloat(cells[5]?.Value || '0'),
                Balance: parseFloat(cells[6]?.Value || '0'),
              });
            }
          }
        }
      }
    }

    console.log('[getBankStatementLines] Parsed', lines.length, 'statement lines');
  } catch (parseError) {
    console.error('[getBankStatementLines] Error parsing report:', parseError);
  }

  return lines;
}

/**
 * Verify token is valid and not expired
 */
export function isTokenExpired(expiresAt: Date | string): boolean {
  const expiry = new Date(expiresAt);
  // Add 5 minute buffer before actual expiry
  const buffer = 5 * 60 * 1000;
  return Date.now() > expiry.getTime() - buffer;
}

/**
 * Calculate token expiry date from expires_in seconds
 */
export function calculateTokenExpiry(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}
