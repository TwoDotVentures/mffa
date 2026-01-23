// Xero API Types
import type { Account } from '@/lib/types';

// OAuth Types
export interface XeroTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: 'Bearer';
  scope: string;
}

export interface XeroConnection {
  id: string;
  authEventId: string;
  tenantId: string;
  tenantType: 'ORGANISATION' | 'PRACTICE';
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
}

// Bank Transaction Types
export interface XeroBankTransaction {
  BankTransactionID: string;
  Type: 'RECEIVE' | 'SPEND' | 'RECEIVE-OVERPAYMENT' | 'RECEIVE-PREPAYMENT' | 'SPEND-OVERPAYMENT' | 'SPEND-PREPAYMENT' | 'RECEIVE-TRANSFER' | 'SPEND-TRANSFER';
  Contact?: {
    ContactID: string;
    Name: string;
  };
  LineItems: XeroLineItem[];
  BankAccount: {
    AccountID: string;
    Code: string;
    Name: string;
  };
  IsReconciled: boolean;
  Date: string; // ISO date string
  Reference?: string;
  CurrencyCode: string;
  CurrencyRate?: number;
  Status: 'AUTHORISED' | 'DELETED';
  SubTotal: number;
  TotalTax: number;
  Total: number;
  UpdatedDateUTC: string;
  HasAttachments: boolean;
}

export interface XeroLineItem {
  Description: string;
  UnitAmount: number;
  TaxType?: string;
  TaxAmount?: number;
  LineAmount: number;
  AccountCode?: string;
  Quantity?: number;
  LineItemID?: string;
}

// Account Types
export interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type: XeroAccountType;
  BankAccountNumber?: string;
  Status: 'ACTIVE' | 'ARCHIVED';
  Description?: string;
  BankAccountType?: 'BANK' | 'CREDITCARD' | 'PAYPAL';
  CurrencyCode?: string;
  TaxType?: string;
  EnablePaymentsToAccount?: boolean;
  ShowInExpenseClaims?: boolean;
  Class?: 'ASSET' | 'EQUITY' | 'EXPENSE' | 'LIABILITY' | 'REVENUE';
  SystemAccount?: string;
  ReportingCode?: string;
  ReportingCodeName?: string;
  HasAttachments?: boolean;
  UpdatedDateUTC?: string;
  AddToWatchlist?: boolean;
}

export type XeroAccountType =
  | 'BANK'
  | 'CURRENT'
  | 'CURRLIAB'
  | 'DEPRECIATN'
  | 'DIRECTCOSTS'
  | 'EQUITY'
  | 'EXPENSE'
  | 'FIXED'
  | 'INVENTORY'
  | 'LIABILITY'
  | 'NONCURRENT'
  | 'OTHERINCOME'
  | 'OVERHEADS'
  | 'PREPAYMENT'
  | 'REVENUE'
  | 'SALES'
  | 'TERMLIAB'
  | 'PAYGLIABILITY'
  | 'SUPERANNUATIONEXPENSE'
  | 'SUPERANNUATIONLIABILITY'
  | 'WAGESEXPENSE'
  | 'WAGESPAYABLELIABILITY';

// API Response Types
export interface XeroBankTransactionsResponse {
  Id: string;
  Status: string;
  ProviderName: string;
  DateTimeUTC: string;
  BankTransactions: XeroBankTransaction[];
}

export interface XeroAccountsResponse {
  Id: string;
  Status: string;
  ProviderName: string;
  DateTimeUTC: string;
  Accounts: XeroAccount[];
}

export interface XeroConnectionsResponse {
  id: string;
  authEventId: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
}

// Database Types
export interface XeroConnectionDB {
  id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  tenant_id: string;
  tenant_name: string | null;
  tenant_type: string | null;
  status: string;
  status_message: string | null;
  sync_enabled: boolean | null;
  sync_frequency: string | null;
  last_sync_at: string | null;
  next_sync_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface XeroSyncLogDB {
  id: string;
  connection_id: string;
  sync_type: string;
  status: string;
  accounts_synced: number | null;
  transactions_imported: number | null;
  transactions_skipped: number | null;
  transactions_updated: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_code: string | null;
  error_message: string | null;
  api_calls_used: number | null;
  created_at: string | null;
}

export interface XeroAccountMappingDB {
  id: string;
  connection_id: string;
  xero_account_id: string;
  xero_account_name: string | null;
  xero_account_code: string | null;
  xero_account_type: string | null;
  local_account_id: string | null;
  is_sync_enabled: boolean | null;
  last_transaction_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Sync Result Types
export interface SyncResult {
  success: boolean;
  accountsSynced: number;
  transactionsImported: number;
  transactionsSkipped: number;
  transactionsUpdated: number;
  errors: string[];
}

// Transform helpers

/**
 * Parse Xero date format to YYYY-MM-DD string
 * Xero returns dates in Microsoft JSON format: "/Date(1767225600000+0000)/"
 * or sometimes in ISO format: "2026-01-01T00:00:00"
 */
function parseXeroDate(xeroDate: string): string {
  // Handle Microsoft JSON date format: /Date(1767225600000+0000)/
  const msDateMatch = xeroDate.match(/\/Date\((\d+)([+-]\d+)?\)\//);
  if (msDateMatch) {
    const timestamp = parseInt(msDateMatch[1], 10);
    return new Date(timestamp).toISOString().split('T')[0];
  }

  // Fallback for ISO format: 2026-01-01T00:00:00
  if (xeroDate.includes('T')) {
    return xeroDate.split('T')[0];
  }

  // If already in YYYY-MM-DD format, return as-is
  return xeroDate;
}

export function xeroTransactionToMFFA(
  xeroTx: XeroBankTransaction,
  accountId: string,
  userId: string
): {
  account_id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  payee: string | null;
  reference: string | null;
  is_reconciled: boolean;
  external_id: string;
  external_source: string;
} {
  // Determine transaction type based on Xero type
  let transactionType: 'income' | 'expense' | 'transfer';
  let amount = xeroTx.Total;

  if (xeroTx.Type.includes('RECEIVE')) {
    transactionType = 'income';
  } else if (xeroTx.Type.includes('SPEND')) {
    transactionType = 'expense';
    amount = -Math.abs(amount); // Ensure negative for expenses
  } else if (xeroTx.Type.includes('TRANSFER')) {
    transactionType = 'transfer';
  } else {
    transactionType = amount >= 0 ? 'income' : 'expense';
  }

  // Get description - prioritize Reference field, then line item, then contact
  const description =
    xeroTx.Reference ||
    xeroTx.LineItems[0]?.Description ||
    xeroTx.Contact?.Name ||
    `${xeroTx.Type} transaction`;

  return {
    account_id: accountId,
    user_id: userId,
    date: parseXeroDate(xeroTx.Date), // Parse Xero date format
    description,
    amount,
    transaction_type: transactionType,
    payee: xeroTx.Contact?.Name || null,
    reference: xeroTx.Reference || null,
    is_reconciled: xeroTx.IsReconciled,
    external_id: xeroTx.BankTransactionID,
    external_source: 'xero',
  };
}

// Review Xero Accounts Types
export interface XeroAccountComparisonResult {
  xeroAccount: XeroAccount;
  matchStatus: 'matched' | 'suggested' | 'no_match';
  localAccount: Account | null;
  confidence: number; // 0-100
  matchReason: string | null;
  existingMapping: XeroAccountMappingDB | null;
}

export interface ReviewXeroAccountsResult {
  success: boolean;
  comparisons: XeroAccountComparisonResult[];
  error: string | null;
}

// Bank Statement Report Types (from Reports/BankStatement endpoint)
export interface XeroBankStatementLine {
  Date: string;
  Description: string;
  Reference: string;
  Reconciled: boolean;
  Source: string;
  Amount: number;
  Balance: number;
}

export interface XeroBankStatementReport {
  ReportID: string;
  ReportName: string;
  ReportType: string;
  ReportTitles: string[];
  ReportDate: string;
  UpdatedDateUTC: string;
  Rows: XeroReportRow[];
}

export interface XeroReportRow {
  RowType: 'Header' | 'Section' | 'Row' | 'SummaryRow';
  Title?: string;
  Rows?: XeroReportRow[];
  Cells?: XeroReportCell[];
}

export interface XeroReportCell {
  Value: string;
  Attributes?: { Value: string; Id: string }[];
}

export interface XeroBankStatementResponse {
  Reports: XeroBankStatementReport[];
}

/**
 * Transform a bank statement line to MFFA transaction format
 * Bank statement lines come from the Reports/BankStatement endpoint
 * and include ALL transactions (not just reconciled ones)
 */
export function bankStatementLineToMFFA(
  line: XeroBankStatementLine,
  accountId: string,
  userId: string
): {
  account_id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  payee: string | null;
  reference: string | null;
  is_reconciled: boolean;
  external_id: string;
  external_source: string;
} {
  // Determine transaction type based on amount
  const transactionType: 'income' | 'expense' | 'transfer' =
    line.Amount >= 0 ? 'income' : 'expense';

  // Create a unique external ID from date + description + amount
  // This allows us to identify duplicate transactions
  const externalId = `stmt_${line.Date}_${hashString(line.Description)}_${line.Amount.toFixed(2)}`;

  return {
    account_id: accountId,
    user_id: userId,
    date: line.Date, // Already in YYYY-MM-DD format from the report
    description: line.Description,
    amount: line.Amount,
    transaction_type: transactionType,
    payee: null, // Statement lines don't have payee info
    reference: line.Reference || null,
    is_reconciled: line.Reconciled,
    external_id: externalId,
    external_source: 'xero_statement',
  };
}

/**
 * Simple hash function for creating unique IDs
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
