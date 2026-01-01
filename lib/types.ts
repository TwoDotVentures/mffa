// Database types for Moyle Family Finance App

export type AccountType = 'bank' | 'credit' | 'investment' | 'loan' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  institution: string | null;
  account_number: string | null;
  bsb: string | null;
  currency: string;
  current_balance: number;
  available_balance: number | null;
  credit_limit: number | null;
  interest_rate: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  account_type: AccountType;
  institution?: string;
  account_number?: string;
  bsb?: string;
  current_balance?: number;
  credit_limit?: number;
  interest_rate?: number;
  notes?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  category_type: CategoryType;
  icon: string | null;
  colour: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  date: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  payee: string | null;
  reference: string | null;
  notes: string | null;
  is_reconciled: boolean;
  is_pending: boolean;
  transfer_account_id: string | null;
  import_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  account?: Account;
  category?: Category;
}

export interface TransactionFormData {
  account_id: string;
  category_id?: string;
  date: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  payee?: string;
  reference?: string;
  notes?: string;
}

export interface CategorisationRule {
  id: string;
  user_id: string;
  category_id: string;
  match_field: 'description' | 'payee' | 'reference';
  match_type: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  match_value: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  member_type: 'adult' | 'child';
  date_of_birth: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// CSV Import types
export interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  transactionType?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ============================================
// Trust Entity Types (Phase 5)
// ============================================

export type TrustIncomeType = 'dividend' | 'interest' | 'rent' | 'capital_gain' | 'other';
export type TrustDistributionType = 'income' | 'capital' | 'mixed';
export type TrustAssetType = 'shares' | 'etf' | 'managed_fund' | 'property' | 'cash' | 'other';
export type BeneficiaryType = 'primary' | 'secondary' | 'contingent';

export interface Trust {
  id: string;
  user_id: string;
  name: string;
  abn: string | null;
  trustee_name: string;
  trustee_abn: string | null;
  establishment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustBeneficiary {
  id: string;
  trust_id: string;
  name: string;
  beneficiary_type: BeneficiaryType;
  family_member_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustIncome {
  id: string;
  trust_id: string;
  source: string;
  income_type: TrustIncomeType;
  amount: number;
  franking_credits: number;
  date: string;
  financial_year: string;
  notes: string | null;
  created_at: string;
}

export interface TrustDistribution {
  id: string;
  trust_id: string;
  beneficiary_id: string;
  beneficiary?: TrustBeneficiary;
  amount: number;
  franking_credits_streamed: number;
  capital_gains_streamed: number;
  distribution_type: TrustDistributionType;
  date: string;
  financial_year: string;
  is_paid: boolean;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface TrustInvestment {
  id: string;
  trust_id: string;
  asset_type: TrustAssetType;
  name: string;
  description: string | null;
  units: number | null;
  cost_base: number;
  current_value: number;
  acquisition_date: string | null;
  last_valued_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FrankingCredits {
  id: string;
  trust_id: string;
  financial_year: string;
  opening_balance: number;
  credits_received: number;
  credits_distributed: number;
  created_at: string;
  updated_at: string;
}

// Form Data Types
export interface TrustFormData {
  name: string;
  abn?: string;
  trustee_name: string;
  trustee_abn?: string;
  establishment_date?: string;
}

export interface TrustIncomeFormData {
  source: string;
  income_type: TrustIncomeType;
  amount: number;
  franking_credits: number;
  date: string;
  notes?: string;
}

export interface TrustDistributionFormData {
  beneficiary_id: string;
  amount: number;
  franking_credits_streamed: number;
  distribution_type: TrustDistributionType;
  date: string;
  notes?: string;
}

export interface TrustBeneficiaryFormData {
  name: string;
  beneficiary_type: BeneficiaryType;
  family_member_id?: string;
}

// Distribution Modelling
export interface DistributionScenario {
  grant_percentage: number;
  shannon_percentage: number;
  grant_amount: number;
  shannon_amount: number;
  grant_franking: number;
  shannon_franking: number;
  grant_tax_estimate: number;
  shannon_tax_estimate: number;
  total_tax: number;
}

export interface TrustSummary {
  trust: Trust;
  income_ytd: number;
  franking_credits_ytd: number;
  distributions_ytd: number;
  distributable_amount: number;
  days_until_eofy: number;
  beneficiaries: TrustBeneficiary[];
}
