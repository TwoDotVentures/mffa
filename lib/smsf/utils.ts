/**
 * SMSF Utility Functions
 * Non-async helper functions for SMSF calculations
 */

/**
 * Get Australian financial year for a given date
 * FY runs from 1 July to 30 June
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // If July (6) or later, FY is current year to next year
  // If before July, FY is previous year to current year
  if (month >= 6) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Get contribution caps for a financial year
 */
export function getContributionCaps(financialYear: string): { concessional: number; nonConcessional: number } {
  // 2024-25 caps (update annually)
  const year = parseInt(financialYear.split('-')[0]);
  if (year >= 2024) {
    return { concessional: 30000, nonConcessional: 120000 };
  }
  // Historical caps
  return { concessional: 27500, nonConcessional: 110000 };
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

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get preservation age based on date of birth
 * https://www.ato.gov.au/individuals/super/in-detail/withdrawing-and-using-your-super/accessing-your-super-to-retire/
 */
export function getPreservationAge(dateOfBirth: string): number {
  const birthYear = new Date(dateOfBirth).getFullYear();

  if (birthYear <= 1960) return 55;
  if (birthYear === 1961) return 56;
  if (birthYear === 1962) return 57;
  if (birthYear === 1963) return 58;
  if (birthYear === 1964) return 59;
  return 60; // Born 1 July 1964 or later
}

/**
 * Asset type display names
 */
export const ASSET_TYPE_LABELS: Record<string, string> = {
  australian_shares: 'Australian Shares',
  international_shares: 'International Shares',
  property: 'Property',
  fixed_income: 'Fixed Income',
  cash: 'Cash',
  cryptocurrency: 'Cryptocurrency',
  collectibles: 'Collectibles',
  other: 'Other',
};

/**
 * Contribution type display names
 */
export const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  concessional: 'Concessional',
  non_concessional: 'Non-Concessional',
  government_co_contribution: 'Government Co-contribution',
  spouse: 'Spouse Contribution',
  downsizer: 'Downsizer Contribution',
};

/**
 * Member status display names
 */
export const MEMBER_STATUS_LABELS: Record<string, string> = {
  accumulation: 'Accumulation',
  transition_to_retirement: 'TTR',
  pension: 'Pension',
};
