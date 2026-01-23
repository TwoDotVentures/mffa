// Database types for Moyle Family Finance App

export type AccountType = 'bank' | 'credit' | 'investment' | 'loan' | 'cash';
export type AccountGroup = 'family' | 'trust' | 'smsf';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  account_group?: AccountGroup;
  institution: string | null;
  account_number: string | null;
  bsb: string | null;
  currency: string;
  current_balance: number; // Starting balance
  calculated_balance?: number; // Starting balance + sum of transactions (computed)
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
  account_group?: AccountGroup;
  institution?: string;
  account_number?: string;
  bsb?: string;
  current_balance?: number;
  credit_limit?: number;
  interest_rate?: number;
  notes?: string;
}

// Account group labels for UI
export const ACCOUNT_GROUP_LABELS: Record<AccountGroup, string> = {
  family: 'Family',
  trust: 'Trust',
  smsf: 'SMSF',
};

// Account group display order
export const ACCOUNT_GROUP_ORDER: AccountGroup[] = ['family', 'trust', 'smsf'];

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
  relationship?: string;
  gender?: string;
  email?: string;
  phone?: string;
  medicare_number?: string;
  notes?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// CSV Import types
export interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  payee?: string;
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
  created_at: string | null;
  updated_at: string | null;
}

export interface TrustBeneficiary {
  id: string;
  trust_id: string;
  name: string;
  beneficiary_type: BeneficiaryType;
  family_member_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
  opening_balance: number | null;
  credits_received: number | null;
  credits_distributed: number | null;
  created_at: string | null;
  updated_at: string | null;
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

// ============================================
// Phase 6: Tax & Personal Super Types
// ============================================

export type PersonType = 'grant' | 'shannon' | 'joint';

// Income Types
export type IncomeType =
  | 'salary'
  | 'bonus'
  | 'dividend'
  | 'trust_distribution'
  | 'rental'
  | 'interest'
  | 'capital_gain'
  | 'government_payment'
  | 'other';

export interface Income {
  id: string;
  user_id: string;
  person: PersonType;
  income_type: IncomeType;
  source: string;
  amount: number;
  franking_credits: number;
  tax_withheld: number;
  date: string;
  financial_year: string;
  is_taxable: boolean;
  notes: string | null;
  linked_trust_distribution_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeFormData {
  person: PersonType;
  income_type: IncomeType;
  source: string;
  amount: number;
  franking_credits?: number;
  tax_withheld?: number;
  date: string;
  is_taxable?: boolean;
  notes?: string;
  linked_trust_distribution_id?: string;
}

// Deduction Types
export type DeductionCategory =
  | 'work_from_home'
  | 'vehicle'
  | 'travel'
  | 'clothing_laundry'
  | 'self_education'
  | 'tools_equipment'
  | 'professional_subscriptions'
  | 'union_fees'
  | 'phone_internet'
  | 'donations'
  | 'income_protection'
  | 'tax_agent_fees'
  | 'investment_expenses'
  | 'rental_property'
  | 'other';

export interface Deduction {
  id: string;
  user_id: string;
  person: PersonType;
  category: DeductionCategory;
  description: string;
  amount: number;
  date: string;
  financial_year: string;
  is_approved: boolean;
  receipt_url: string | null;
  linked_transaction_id: string | null;
  calculation_method: string | null;
  calculation_details: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeductionFormData {
  person: PersonType;
  category: DeductionCategory;
  description: string;
  amount: number;
  date: string;
  is_approved?: boolean;
  receipt_url?: string;
  linked_transaction_id?: string;
  calculation_method?: string;
  calculation_details?: Record<string, unknown>;
  notes?: string;
}

// WFH Deduction calculation
export interface WFHCalculation {
  hours: number;
  rate_per_hour: number; // 67 cents for 2024-25
  total_deduction: number;
  period_start: string;
  period_end: string;
}

// Personal Super Types
export type SuperContributionType =
  | 'employer_sg'
  | 'salary_sacrifice'
  | 'personal_deductible'
  | 'personal_non_deductible'
  | 'spouse'
  | 'government_co_contribution'
  | 'low_income_super_offset'
  | 'other';

export interface SuperContribution {
  id: string;
  user_id: string;
  person: Exclude<PersonType, 'joint'>;
  fund_name: string;
  fund_abn: string | null;
  contribution_type: SuperContributionType;
  amount: number;
  date: string;
  financial_year: string;
  is_concessional: boolean;
  employer_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface SuperContributionFormData {
  person: Exclude<PersonType, 'joint'>;
  fund_name: string;
  fund_abn?: string;
  contribution_type: SuperContributionType;
  amount: number;
  date: string;
  is_concessional: boolean;
  employer_name?: string;
  notes?: string;
}

export interface SuperAccount {
  id: string;
  user_id: string;
  person: Exclude<PersonType, 'joint'>;
  fund_name: string;
  fund_abn: string | null;
  member_number: string | null;
  balance: number;
  balance_date: string | null;
  insurance_cover: {
    death?: number;
    tpd?: number;
    income_protection?: string;
  } | null;
  investment_option: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuperAccountFormData {
  person: Exclude<PersonType, 'joint'>;
  fund_name: string;
  fund_abn?: string;
  member_number?: string;
  balance?: number;
  balance_date?: string;
  insurance_cover?: {
    death?: number;
    tpd?: number;
    income_protection?: string;
  };
  investment_option?: string;
  is_active?: boolean;
  notes?: string;
}

// Super contribution caps (2024-25)
export interface SuperContributionCaps {
  concessional: number; // $30,000
  non_concessional: number; // $120,000
  bring_forward_available: boolean;
  bring_forward_amount: number; // Up to $360,000 over 3 years
}

export interface SuperContributionSummary {
  person: Exclude<PersonType, 'joint'>;
  financial_year: string;
  concessional_contributions: number;
  non_concessional_contributions: number;
  concessional_cap: number;
  non_concessional_cap: number;
  concessional_remaining: number;
  non_concessional_remaining: number;
  total_super_balance: number; // For bring-forward eligibility
}

// HECS/HELP Types
export interface HecsDebt {
  id: string;
  user_id: string;
  person: Exclude<PersonType, 'joint'>;
  opening_balance: number;
  current_balance: number;
  financial_year: string;
  indexation_rate: number | null;
  repayments_ytd: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HecsDebtFormData {
  person: Exclude<PersonType, 'joint'>;
  opening_balance: number;
  current_balance: number;
  financial_year: string;
  indexation_rate?: number;
  repayments_ytd?: number;
  notes?: string;
}

// HECS repayment thresholds (2024-25)
export interface HecsRepaymentRate {
  min_income: number;
  max_income: number | null;
  rate: number; // Percentage
}

// Tax Estimate Types
export interface TaxEstimate {
  id: string;
  user_id: string;
  financial_year: string;
  person: PersonType | 'combined';
  scenario_name: string | null;

  // Income breakdown
  gross_income: number;
  salary_wages: number;
  dividends_unfranked: number;
  dividends_franked: number;
  franking_credits: number;
  trust_distributions: number;
  rental_income: number;
  capital_gains: number;
  other_income: number;

  // Deductions
  total_deductions: number;

  // Tax calculation
  taxable_income: number;
  income_tax: number;
  medicare_levy: number;
  medicare_surcharge: number;
  hecs_repayment: number;
  franking_credit_offset: number;
  tax_withheld: number;

  // Result
  net_tax_payable: number; // Positive = owe, Negative = refund
  effective_tax_rate: number;
  marginal_tax_rate: number;

  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxCalculationInput {
  person: PersonType;
  financial_year: string;
  salary_wages?: number;
  dividends_unfranked?: number;
  dividends_franked?: number;
  franking_credits?: number;
  trust_distributions?: number;
  rental_income?: number;
  capital_gains?: number;
  other_income?: number;
  total_deductions?: number;
  has_private_health_insurance?: boolean;
  hecs_balance?: number;
}

export interface TaxCalculationResult {
  gross_income: number;
  taxable_income: number;
  income_tax: number;
  medicare_levy: number;
  medicare_surcharge: number;
  hecs_repayment: number;
  total_tax_before_offsets: number;
  franking_credit_offset: number;
  net_tax_payable: number;
  effective_tax_rate: number;
  marginal_tax_rate: number;
  tax_bracket: string;
}

// Tax summary for a person/financial year
export interface TaxSummary {
  person: PersonType;
  financial_year: string;
  income: {
    salary: number;
    dividends: number;
    franking_credits: number;
    trust_distributions: number;
    rental: number;
    capital_gains: number;
    other: number;
    total: number;
  };
  deductions: {
    by_category: Record<DeductionCategory, number>;
    total: number;
  };
  tax_withheld: number;
  estimated_tax: TaxCalculationResult;
  estimated_refund_or_owing: number; // Negative = refund
}

// Deduction category labels for UI
export const DEDUCTION_CATEGORY_LABELS: Record<DeductionCategory, string> = {
  work_from_home: 'Work from Home',
  vehicle: 'Vehicle & Travel',
  travel: 'Work Travel',
  clothing_laundry: 'Clothing & Laundry',
  self_education: 'Self-Education',
  tools_equipment: 'Tools & Equipment',
  professional_subscriptions: 'Professional Subscriptions',
  union_fees: 'Union Fees',
  phone_internet: 'Phone & Internet',
  donations: 'Donations',
  income_protection: 'Income Protection Insurance',
  tax_agent_fees: 'Tax Agent Fees',
  investment_expenses: 'Investment Expenses',
  rental_property: 'Rental Property',
  other: 'Other',
};

// Income type labels for UI
export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary: 'Salary & Wages',
  bonus: 'Bonus',
  dividend: 'Dividends',
  trust_distribution: 'Trust Distribution',
  rental: 'Rental Income',
  interest: 'Interest',
  capital_gain: 'Capital Gain',
  government_payment: 'Government Payment',
  other: 'Other Income',
};

// Super contribution type labels
export const SUPER_CONTRIBUTION_TYPE_LABELS: Record<SuperContributionType, string> = {
  employer_sg: 'Employer SG',
  salary_sacrifice: 'Salary Sacrifice',
  personal_deductible: 'Personal (Deductible)',
  personal_non_deductible: 'Personal (Non-Deductible)',
  spouse: 'Spouse Contribution',
  government_co_contribution: 'Government Co-Contribution',
  low_income_super_offset: 'Low Income Super Offset',
  other: 'Other',
};

// ============================================
// Assets & Liabilities Types (Phase 7)
// ============================================

export type AssetType =
  | 'property'
  | 'vehicle'
  | 'shares'
  | 'managed_fund'
  | 'crypto'
  | 'collectibles'
  | 'cash'
  | 'other';

export type LiabilityType =
  | 'mortgage'
  | 'car_loan'
  | 'personal_loan'
  | 'credit_card'
  | 'hecs'
  | 'margin_loan'
  | 'other';

export type OwnerType = 'Grant' | 'Shannon' | 'Joint' | 'Trust' | 'SMSF';
export type PaymentFrequency = 'weekly' | 'fortnightly' | 'monthly';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_type: AssetType;
  description: string | null;
  owner: OwnerType;
  purchase_price: number | null;
  purchase_date: string | null;
  current_value: number;
  last_valued_date: string;
  cost_base: number | null;
  improvement_costs: number;
  address: string | null;
  is_primary_residence: boolean;
  units: number | null;
  ticker_symbol: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  liability_type: LiabilityType;
  description: string | null;
  owner: Exclude<OwnerType, 'Trust' | 'SMSF'>;
  original_amount: number | null;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  payment_frequency: PaymentFrequency | null;
  next_payment_date: string | null;
  start_date: string | null;
  end_date: string | null;
  linked_account_id: string | null;
  linked_asset_id: string | null;
  hecs_balance: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  linked_account?: Account;
  linked_asset?: Asset;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  personal_assets: number;
  personal_liabilities: number;
  personal_net_worth: number;
  smsf_balance: number;
  trust_assets: number;
  consolidated_assets: number;
  consolidated_liabilities: number;
  consolidated_net_worth: number;
  asset_breakdown: Record<string, number> | null;
  liability_breakdown: Record<string, number> | null;
  notes: string | null;
  created_at: string;
}

// Form Data Types
export interface AssetFormData {
  name: string;
  asset_type: AssetType;
  description?: string;
  owner: OwnerType;
  purchase_price?: number;
  purchase_date?: string;
  current_value: number;
  cost_base?: number;
  improvement_costs?: number;
  address?: string;
  is_primary_residence?: boolean;
  units?: number;
  ticker_symbol?: string;
  notes?: string;
}

export interface LiabilityFormData {
  name: string;
  liability_type: LiabilityType;
  description?: string;
  owner: Exclude<OwnerType, 'Trust' | 'SMSF'>;
  original_amount?: number;
  current_balance: number;
  interest_rate?: number;
  minimum_payment?: number;
  payment_frequency?: PaymentFrequency;
  next_payment_date?: string;
  start_date?: string;
  end_date?: string;
  linked_account_id?: string;
  linked_asset_id?: string;
  notes?: string;
}

export interface AssetUpdateData {
  current_value: number;
  last_valued_date?: string;
  improvement_costs?: number;
  notes?: string;
}

export interface AssetFilters {
  asset_type?: AssetType;
  owner?: OwnerType;
  is_active?: boolean;
}

export interface LiabilityFilters {
  liability_type?: LiabilityType;
  owner?: Exclude<OwnerType, 'Trust' | 'SMSF'>;
  is_active?: boolean;
}

// Net Worth Summary
export interface NetWorthSummary {
  // Personal
  personal: {
    assets: number;
    liabilities: number;
    netWorth: number;
    byAssetType: Partial<Record<AssetType, number>>;
    byLiabilityType: Partial<Record<LiabilityType, number>>;
    byOwner: Partial<Record<OwnerType, { assets: number; liabilities: number }>>;
  };
  // SMSF (optional - from SMSF module)
  smsf?: {
    balance: number;
    note?: string;
  };
  // Trust (optional - from Trust module)
  trust?: {
    assets: number;
    note?: string;
  };
  // Consolidated
  consolidated: {
    assets: number;
    liabilities: number;
    netWorth: number;
  };
  // Historical
  previousMonth?: NetWorthSnapshot;
  monthlyChange?: number;
  monthlyChangePercent?: number;
}

// Asset type labels for UI
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  shares: 'Shares',
  managed_fund: 'Managed Fund',
  crypto: 'Cryptocurrency',
  collectibles: 'Collectibles',
  cash: 'Cash',
  other: 'Other',
};

// Liability type labels for UI
export const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
  mortgage: 'Mortgage',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  credit_card: 'Credit Card',
  hecs: 'HECS/HELP',
  margin_loan: 'Margin Loan',
  other: 'Other',
};

// Owner labels for UI
export const OWNER_LABELS: Record<OwnerType, string> = {
  Grant: 'Grant',
  Shannon: 'Shannon',
  Joint: 'Joint',
  Trust: 'Family Trust',
  SMSF: 'SMSF',
};

// ============================================
// Phase 8: Budgets, Documents & Notifications
// ============================================

// ============================================
// 8.1 Budget Types
// ============================================

export type BudgetPeriod = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  alert_threshold: number;
  alert_enabled: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
}

export interface BudgetFormData {
  name: string;
  category_id?: string;
  amount: number;
  period: BudgetPeriod;
  start_date?: string;
  end_date?: string;
  alert_threshold?: number;
  alert_enabled?: boolean;
  notes?: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isApproachingLimit: boolean; // >= alert_threshold
  transactions: Transaction[];
  daysRemaining: number;
  dailyAllowance: number;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  budgets: BudgetProgress[];
  overBudgetCount: number;
  approachingLimitCount: number;
}

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const BUDGET_PERIOD_DAYS: Record<BudgetPeriod, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
};

// ============================================
// 8.2 Document Types
// ============================================

export type EntityType = 'personal' | 'smsf' | 'trust';

export type DocumentType =
  | 'bank_statement'
  | 'tax_return'
  | 'receipt'
  | 'invoice'
  | 'trust_deed'
  | 'distribution_resolution'
  | 'smsf_annual_return'
  | 'investment_statement'
  | 'contract'
  | 'insurance'
  | 'other';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  entity_type: EntityType;
  document_type: DocumentType;
  linked_transaction_id: string | null;
  financial_year: string | null;
  is_processed: boolean;
  processing_error: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Computed
  download_url?: string;
}

export interface DocumentUploadData {
  name: string;
  entity_type: EntityType;
  document_type: DocumentType;
  description?: string;
  financial_year?: string;
  linked_transaction_id?: string;
  tags?: string[];
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  created_at: string;
}

export interface DocumentSearchResult {
  document_id: string;
  document_name: string;
  entity_type: EntityType;
  document_type: DocumentType;
  financial_year: string | null;
  chunk_index: number;
  chunk_content: string;
  similarity: number;
}

export interface DocumentFilters {
  entity_type?: EntityType;
  document_type?: DocumentType;
  financial_year?: string;
  search?: string;
  tags?: string[];
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  personal: 'Personal',
  smsf: 'SMSF',
  trust: 'Family Trust',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  receipt: 'Receipt',
  invoice: 'Invoice',
  trust_deed: 'Trust Deed',
  distribution_resolution: 'Distribution Resolution',
  smsf_annual_return: 'SMSF Annual Return',
  investment_statement: 'Investment Statement',
  contract: 'Contract',
  insurance: 'Insurance',
  other: 'Other',
};

// ============================================
// 8.3 Notification Types
// ============================================

export type NotificationType =
  | 'trust_distribution_reminder'
  | 'super_cap_warning'
  | 'smsf_audit_reminder'
  | 'budget_alert'
  | 'document_processed'
  | 'tax_deadline'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_dismissed: boolean;
  scheduled_for: string | null;
  expires_at: string | null;
  link_url: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  notification_type: NotificationType;
  priority?: NotificationPriority;
  scheduled_for?: string;
  expires_at?: string;
  link_url?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, unknown>;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  trust_distribution_reminder: 'Trust Distribution',
  super_cap_warning: 'Super Cap Warning',
  smsf_audit_reminder: 'SMSF Audit',
  budget_alert: 'Budget Alert',
  document_processed: 'Document Ready',
  tax_deadline: 'Tax Deadline',
  general: 'General',
};

export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-slate-500',
  medium: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
};

// ============================================
// Phase 9: Family Members Feature
// ============================================

// ============================================
// 9.1 Lookup Tables (User-Definable Categories)
// ============================================

export interface FeeType {
  id: string;
  user_id: string | null; // null = system default
  name: string;
  description?: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface ActivityType {
  id: string;
  user_id: string | null;
  name: string;
  icon?: string;
  description?: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface Frequency {
  id: string;
  user_id: string | null;
  name: string;
  description?: string;
  per_year_multiplier?: number; // For annual cost calculation
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface FeeTypeFormData {
  name: string;
  description?: string;
  sort_order?: number;
}

export interface ActivityTypeFormData {
  name: string;
  icon?: string;
  description?: string;
  sort_order?: number;
}

export interface FrequencyFormData {
  name: string;
  description?: string;
  per_year_multiplier?: number;
  sort_order?: number;
}

// ============================================
// 9.2 Enhanced Family Members
// ============================================

export type RelationshipType = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// Update existing FamilyMember interface with new fields plus summary fields
export interface FamilyMemberExtended extends FamilyMember {
  relationship?: RelationshipType;
  gender?: GenderType;
  email?: string;
  phone?: string;
  medicare_number?: string;
  notes?: string;
  avatar_url?: string;
  // Summary fields - populated by getFamilyMembersWithSummary
  age?: number;
  current_school?: School;
  current_year_level?: string;
  total_school_fees_year?: number;
  unpaid_fees_count?: number;
  active_activities_count?: number;
  total_activities_cost_year?: number;
  document_count?: number;
}

export interface FamilyMemberFormData {
  name: string;
  member_type: 'adult' | 'child';
  relationship?: RelationshipType;
  gender?: GenderType;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  medicare_number?: string;
  notes?: string;
  is_primary?: boolean;
}

// ============================================
// 9.3 Schools
// ============================================

export type SchoolType = 'primary' | 'secondary' | 'combined' | 'preschool' | 'tertiary' | 'other';
export type SchoolSector = 'public' | 'private' | 'catholic' | 'independent' | 'other';

export interface School {
  id: string;
  user_id: string;
  name: string;
  school_type: SchoolType;
  sector?: SchoolSector;
  address?: string;
  suburb?: string;
  state: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  school_years?: SchoolYear[];
}

export interface SchoolFormData {
  name: string;
  school_type: SchoolType;
  sector?: SchoolSector;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  combined: 'Combined (K-12)',
  preschool: 'Preschool/Kindy',
  tertiary: 'Tertiary',
  other: 'Other',
};

export const SCHOOL_SECTOR_LABELS: Record<SchoolSector, string> = {
  public: 'Public',
  private: 'Private',
  catholic: 'Catholic',
  independent: 'Independent',
  other: 'Other',
};

// ============================================
// 9.4 School Years & Terms
// ============================================

export type TermType = 'term' | 'semester' | 'trimester' | 'quarter';

export interface SchoolYear {
  id: string;
  school_id: string;
  year: number;
  year_start: string;
  year_end: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  terms?: SchoolTerm[];
  school?: School;
}

export interface SchoolYearFormData {
  school_id: string;
  year: number;
  year_start: string;
  year_end: string;
  notes?: string;
}

export interface SchoolTerm {
  id: string;
  school_year_id: string;
  term_type: TermType;
  term_number: number;
  name?: string;
  start_date: string;
  end_date: string;
  fees_due_date?: string;
  notes?: string;
  created_at: string;
  // Joined data
  school_year?: SchoolYear;
}

export interface SchoolTermFormData {
  school_year_id: string;
  term_type: TermType;
  term_number: number;
  name?: string;
  start_date: string;
  end_date: string;
  fees_due_date?: string;
  notes?: string;
}

export const TERM_TYPE_LABELS: Record<TermType, string> = {
  term: 'Term',
  semester: 'Semester',
  trimester: 'Trimester',
  quarter: 'Quarter',
};

// ============================================
// 9.5 School Enrolments
// ============================================

export interface SchoolEnrolment {
  id: string;
  family_member_id: string;
  school_id: string;
  year_level?: string;
  enrolment_date?: string;
  expected_graduation?: string;
  student_id?: string;
  house?: string;
  is_current: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  school?: School;
  family_member?: FamilyMember;
}

export interface SchoolEnrolmentFormData {
  family_member_id: string;
  school_id: string;
  year_level?: string;
  enrolment_date?: string;
  expected_graduation?: string;
  student_id?: string;
  house?: string;
  is_current?: boolean;
  notes?: string;
}

export const YEAR_LEVELS = [
  'Prep',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
];

// ============================================
// 9.6 School Fees
// ============================================

export interface SchoolFee {
  id: string;
  enrolment_id: string;
  fee_type_id: string;
  frequency_id: string;
  description: string;
  amount: number;
  due_date?: string;
  school_term_id?: string;
  year: number;
  is_paid: boolean;
  paid_date?: string;
  paid_amount?: number;
  payment_method?: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  fee_type?: FeeType;
  frequency?: Frequency;
  school_term?: SchoolTerm;
  enrolment?: SchoolEnrolment;
}

export interface SchoolFeeFormData {
  enrolment_id: string;
  fee_type_id: string;
  frequency_id: string;
  description: string;
  amount: number;
  due_date?: string;
  school_term_id?: string;
  year?: number;
  notes?: string;
}

export interface SchoolFeePaymentData {
  is_paid: boolean;
  paid_date?: string;
  paid_amount?: number;
  payment_method?: string;
}

// ============================================
// 9.7 Extracurricular Activities
// ============================================

export interface Extracurricular {
  id: string;
  family_member_id: string;
  activity_type_id: string;
  name: string;
  provider?: string;
  venue?: string;
  day_of_week?: string[];
  time_start?: string;
  time_end?: string;
  season_start?: string;
  season_end?: string;
  is_active: boolean;
  cost_amount?: number;
  cost_frequency_id?: string;
  registration_fee?: number;
  equipment_cost?: number;
  uniform_cost?: number;
  other_costs?: number;
  other_costs_description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  activity_type?: ActivityType;
  cost_frequency?: Frequency;
  family_member?: FamilyMember;
}

export interface ExtracurricularFormData {
  family_member_id: string;
  activity_type_id: string;
  name: string;
  provider?: string;
  venue?: string;
  day_of_week?: string[];
  time_start?: string;
  time_end?: string;
  season_start?: string;
  season_end?: string;
  cost_amount?: number;
  cost_frequency_id?: string;
  registration_fee?: number;
  equipment_cost?: number;
  uniform_cost?: number;
  other_costs?: number;
  other_costs_description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  notes?: string;
}

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// ============================================
// 9.8 Member Documents
// ============================================

export type MemberDocumentCategory =
  | 'identification'
  | 'medical'
  | 'school'
  | 'certificate'
  | 'legal'
  | 'insurance'
  | 'financial'
  | 'other';

export interface MemberDocument {
  id: string;
  family_member_id: string;
  document_id: string;
  document_category: MemberDocumentCategory;
  notes?: string;
  created_at: string;
  // Joined data
  document?: Document;
  family_member?: FamilyMember;
}

export interface MemberDocumentFormData {
  family_member_id: string;
  document_id: string;
  document_category: MemberDocumentCategory;
  notes?: string;
}

export const MEMBER_DOCUMENT_CATEGORY_LABELS: Record<MemberDocumentCategory, string> = {
  identification: 'Identification',
  medical: 'Medical',
  school: 'School',
  certificate: 'Certificate',
  legal: 'Legal',
  insurance: 'Insurance',
  financial: 'Financial',
  other: 'Other',
};

// ============================================
// 9.9 Summary Types
// ============================================

export interface FamilyMemberSummary extends FamilyMemberExtended {
  age?: number;
  current_school?: School;
  current_year_level?: string;
  total_school_fees_year?: number;
  unpaid_fees_count?: number;
  active_activities_count?: number;
  total_activities_cost_year?: number;
  document_count?: number;
}

export interface SchoolFeesSummary {
  total_fees: number;
  paid_amount: number;
  remaining_amount: number;
  overdue_count: number;
  upcoming_count: number;
  fees_by_type: { fee_type: FeeType; total: number }[];
  fees_by_term: { term: SchoolTerm; total: number }[];
}

export interface ExtracurricularSummary {
  total_activities: number;
  active_activities: number;
  total_annual_cost: number;
  weekly_hours: number;
  by_type: { activity_type: ActivityType; count: number; cost: number }[];
}

export interface FamilyFeesOverview {
  total_school_fees: number;
  total_paid: number;
  total_remaining: number;
  total_activities_cost: number;
  by_child: {
    family_member: FamilyMember;
    school_fees: number;
    activities_cost: number;
  }[];
}

// ============================================
// 9.10 Relationship Labels
// ============================================

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  self: 'Self',
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other',
};

export const GENDER_LABELS: Record<GenderType, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export type MemberType = 'adult' | 'child';

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  adult: 'Adult',
  child: 'Child',
};
