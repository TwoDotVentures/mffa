/**
 * Personal Super Utility Functions
 * Non-async helper functions for super calculations
 */

import type { SuperContributionSummary, SuperContributionCaps } from '@/lib/types';

/**
 * Get current financial year (July-June format: "2024-25")
 */
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7
    ? `${year}-${(year + 1).toString().slice(-2)}`
    : `${year - 1}-${year.toString().slice(-2)}`;
}

/**
 * Contribution caps for 2024-25
 * https://www.ato.gov.au/Rates/Key-superannuation-rates-and-thresholds/
 */
export const CONTRIBUTION_CAPS_2024_25: SuperContributionCaps = {
  concessional: 30000, // Was $27,500, now $30,000
  non_concessional: 120000, // Was $110,000, now $120,000
  bring_forward_available: true,
  bring_forward_amount: 360000, // 3 x $120,000
};

/**
 * Get contribution caps for a financial year
 */
export function getContributionCaps(financialYear: string): SuperContributionCaps {
  const year = parseInt(financialYear.split('-')[0]);

  if (year >= 2024) {
    return CONTRIBUTION_CAPS_2024_25;
  }

  // Historical caps (2021-22 to 2023-24)
  return {
    concessional: 27500,
    non_concessional: 110000,
    bring_forward_available: true,
    bring_forward_amount: 330000,
  };
}

/**
 * Super Guarantee rate (percentage of ordinary time earnings)
 * 2024-25: 11.5%, increasing 0.5% each year until 12% in 2025-26
 */
export function getSuperGuaranteeRate(financialYear: string): number {
  const year = parseInt(financialYear.split('-')[0]);

  if (year >= 2025) return 0.12; // 12%
  if (year >= 2024) return 0.115; // 11.5%
  if (year >= 2023) return 0.11; // 11%
  if (year >= 2022) return 0.105; // 10.5%
  return 0.10; // 10%
}

/**
 * Calculate expected employer super from salary
 */
export function calculateExpectedEmployerSuper(
  annualSalary: number,
  financialYear: string = getCurrentFinancialYear()
): number {
  const rate = getSuperGuaranteeRate(financialYear);
  return annualSalary * rate;
}

/**
 * Total Super Balance threshold for bring-forward (2024-25)
 * Can't use bring-forward if TSB is $1.9 million or more
 */
export const TSB_THRESHOLD = 1900000;

/**
 * Check if bring-forward rule is available based on total super balance
 */
export function canUseBringForward(totalSuperBalance: number): {
  available: boolean;
  yearsAvailable: number;
  maxAmount: number;
} {
  if (totalSuperBalance >= TSB_THRESHOLD) {
    return { available: false, yearsAvailable: 0, maxAmount: 120000 };
  }

  if (totalSuperBalance >= 1680000) {
    // Can only access 1 extra year
    return { available: true, yearsAvailable: 2, maxAmount: 240000 };
  }

  if (totalSuperBalance >= 1560000) {
    // Can access 2 extra years
    return { available: true, yearsAvailable: 3, maxAmount: 360000 };
  }

  // Full bring-forward available
  return { available: true, yearsAvailable: 3, maxAmount: 360000 };
}

/**
 * Concessional contribution types
 */
export const CONCESSIONAL_TYPES = [
  'employer_sg',
  'salary_sacrifice',
  'personal_deductible',
] as const;

/**
 * Non-concessional contribution types
 */
export const NON_CONCESSIONAL_TYPES = [
  'personal_non_deductible',
  'spouse',
] as const;

/**
 * Check if a contribution type is concessional
 */
export function isConcessional(contributionType: string): boolean {
  return CONCESSIONAL_TYPES.includes(contributionType as typeof CONCESSIONAL_TYPES[number]);
}

/**
 * Division 293 tax threshold (2024-25)
 * Additional 15% tax on concessional contributions if income + super > threshold
 */
export const DIVISION_293_THRESHOLD = 250000;

/**
 * Check if Division 293 tax applies
 */
export function checkDivision293(
  taxableIncome: number,
  concessionalContributions: number
): { applies: boolean; taxableAmount: number; tax: number } {
  const combinedIncome = taxableIncome + concessionalContributions;

  if (combinedIncome <= DIVISION_293_THRESHOLD) {
    return { applies: false, taxableAmount: 0, tax: 0 };
  }

  // Taxable amount is the lesser of:
  // 1. Amount over the threshold
  // 2. Total concessional contributions
  const amountOverThreshold = combinedIncome - DIVISION_293_THRESHOLD;
  const taxableAmount = Math.min(amountOverThreshold, concessionalContributions);
  const tax = taxableAmount * 0.15; // Additional 15%

  return {
    applies: true,
    taxableAmount,
    tax,
  };
}

/**
 * Low Income Superannuation Tax Offset (LISTO)
 * Refunds up to $500 of tax paid on super contributions for low income earners
 */
export function calculateLISTO(
  taxableIncome: number,
  concessionalContributions: number
): number {
  const LISTO_THRESHOLD = 37000;
  const MAX_OFFSET = 500;

  if (taxableIncome > LISTO_THRESHOLD) {
    return 0;
  }

  // LISTO = 15% of concessional contributions, max $500
  return Math.min(concessionalContributions * 0.15, MAX_OFFSET);
}

/**
 * Format currency for Australian dollars
 */
export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
