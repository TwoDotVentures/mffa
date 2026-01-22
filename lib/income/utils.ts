/**
 * Income & Tax Utility Functions
 * Non-async helper functions for tax calculations
 */

import type { TaxCalculationResult, PersonType } from '@/lib/types';

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
 * Get days until end of financial year (30 June)
 */
export function getDaysUntilEOFY(): number {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const eofy = new Date(year, 5, 30); // June 30
  return Math.ceil((eofy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 2024-25 Australian Tax Brackets
 * https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
 */
const TAX_BRACKETS_2024_25 = [
  { min: 0, max: 18200, rate: 0, base: 0 },
  { min: 18201, max: 45000, rate: 0.16, base: 0 },
  { min: 45001, max: 135000, rate: 0.30, base: 4288 },
  { min: 135001, max: 190000, rate: 0.37, base: 31288 },
  { min: 190001, max: Infinity, rate: 0.45, base: 51638 },
];

/**
 * Calculate base income tax (excluding Medicare levy, HECS, etc.)
 */
export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  for (const bracket of TAX_BRACKETS_2024_25) {
    if (taxableIncome <= bracket.max) {
      return bracket.base + (taxableIncome - bracket.min + 1) * bracket.rate;
    }
  }

  // Should never reach here, but handle just in case
  const topBracket = TAX_BRACKETS_2024_25[TAX_BRACKETS_2024_25.length - 1];
  return topBracket.base + (taxableIncome - topBracket.min + 1) * topBracket.rate;
}

/**
 * Get marginal tax rate for given taxable income
 */
export function getMarginalTaxRate(taxableIncome: number): number {
  for (const bracket of TAX_BRACKETS_2024_25) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  return 0.45; // Top rate
}

/**
 * Get tax bracket description
 */
export function getTaxBracket(taxableIncome: number): string {
  if (taxableIncome <= 18200) return '$0 - $18,200 (0%)';
  if (taxableIncome <= 45000) return '$18,201 - $45,000 (16%)';
  if (taxableIncome <= 135000) return '$45,001 - $135,000 (30%)';
  if (taxableIncome <= 190000) return '$135,001 - $190,000 (37%)';
  return '$190,001+ (45%)';
}

/**
 * Calculate Medicare Levy (2% of taxable income with low income thresholds)
 * 2024-25: No levy below $26,000, reduced up to $32,500, full 2% above
 */
export function calculateMedicareLevy(taxableIncome: number): number {
  const FULL_EXEMPTION_THRESHOLD = 26000;
  const SHADE_IN_THRESHOLD = 32500;
  const LEVY_RATE = 0.02;
  const SHADE_IN_RATE = 0.1; // 10% shade-in rate

  if (taxableIncome <= FULL_EXEMPTION_THRESHOLD) {
    return 0;
  }

  if (taxableIncome <= SHADE_IN_THRESHOLD) {
    // Shade-in calculation: 10% of amount over threshold
    return (taxableIncome - FULL_EXEMPTION_THRESHOLD) * SHADE_IN_RATE;
  }

  return taxableIncome * LEVY_RATE;
}

/**
 * Calculate Medicare Levy Surcharge (for those without private health cover)
 * Thresholds for singles: $97,000 - $130,000 (1%), $130,000 - $173,000 (1.25%), $173,000+ (1.5%)
 */
export function calculateMedicareSurcharge(
  taxableIncome: number,
  hasPrivateHealthInsurance: boolean = true
): number {
  if (hasPrivateHealthInsurance) return 0;

  if (taxableIncome <= 97000) return 0;
  if (taxableIncome <= 130000) return taxableIncome * 0.01;
  if (taxableIncome <= 173000) return taxableIncome * 0.0125;
  return taxableIncome * 0.015;
}

/**
 * HECS/HELP Repayment Rates 2024-25
 * https://www.ato.gov.au/Rates/HELP,-TSL-and-SFSS-repayment-thresholds-and-rates/
 */
const HECS_RATES_2024_25 = [
  { min: 0, max: 54435, rate: 0 },
  { min: 54436, max: 62850, rate: 0.01 },
  { min: 62851, max: 66620, rate: 0.02 },
  { min: 66621, max: 70618, rate: 0.025 },
  { min: 70619, max: 74855, rate: 0.03 },
  { min: 74856, max: 79346, rate: 0.035 },
  { min: 79347, max: 84107, rate: 0.04 },
  { min: 84108, max: 89154, rate: 0.045 },
  { min: 89155, max: 94503, rate: 0.05 },
  { min: 94504, max: 100174, rate: 0.055 },
  { min: 100175, max: 106185, rate: 0.06 },
  { min: 106186, max: 112556, rate: 0.065 },
  { min: 112557, max: 119309, rate: 0.07 },
  { min: 119310, max: 126467, rate: 0.075 },
  { min: 126468, max: 134056, rate: 0.08 },
  { min: 134057, max: 142100, rate: 0.085 },
  { min: 142101, max: 150626, rate: 0.09 },
  { min: 150627, max: 159663, rate: 0.095 },
  { min: 159664, max: Infinity, rate: 0.1 },
];

/**
 * Calculate HECS/HELP repayment based on repayment income
 */
export function calculateHecsRepayment(
  repaymentIncome: number,
  hasHecsDebt: boolean = false
): number {
  if (!hasHecsDebt) return 0;

  for (const tier of HECS_RATES_2024_25) {
    if (repaymentIncome <= tier.max) {
      return repaymentIncome * tier.rate;
    }
  }

  return repaymentIncome * 0.1;
}

/**
 * Calculate complete tax breakdown for a person
 */
export function calculateTax(
  grossIncome: number,
  deductions: number = 0,
  frankingCredits: number = 0,
  hasHecsDebt: boolean = false,
  hasPrivateHealth: boolean = true
): TaxCalculationResult {
  // Calculate taxable income
  const taxableIncome = Math.max(0, grossIncome - deductions);

  // Add franking credits to taxable income (grossed up)
  const taxableWithFranking = taxableIncome + frankingCredits;

  // Calculate components
  const incomeTax = calculateIncomeTax(taxableWithFranking);
  const medicareLevy = calculateMedicareLevy(taxableWithFranking);
  const medicareSurcharge = calculateMedicareSurcharge(taxableWithFranking, hasPrivateHealth);

  // HECS repayment based on repayment income (taxable + reportable super + exempt foreign income)
  const hecsRepayment = calculateHecsRepayment(taxableWithFranking, hasHecsDebt);

  // Total before offsets
  const totalTaxBeforeOffsets = incomeTax + medicareLevy + medicareSurcharge + hecsRepayment;

  // Apply franking credit offset
  const netTaxPayable = Math.max(0, totalTaxBeforeOffsets - frankingCredits);

  // Calculate effective tax rate (on gross income)
  const effectiveTaxRate = grossIncome > 0 ? (netTaxPayable / grossIncome) * 100 : 0;

  // Marginal rate
  const marginalTaxRate = getMarginalTaxRate(taxableWithFranking) * 100;

  return {
    gross_income: grossIncome,
    taxable_income: taxableIncome,
    income_tax: Math.round(incomeTax * 100) / 100,
    medicare_levy: Math.round(medicareLevy * 100) / 100,
    medicare_surcharge: Math.round(medicareSurcharge * 100) / 100,
    hecs_repayment: Math.round(hecsRepayment * 100) / 100,
    total_tax_before_offsets: Math.round(totalTaxBeforeOffsets * 100) / 100,
    franking_credit_offset: frankingCredits,
    net_tax_payable: Math.round(netTaxPayable * 100) / 100,
    effective_tax_rate: Math.round(effectiveTaxRate * 100) / 100,
    marginal_tax_rate: marginalTaxRate,
    tax_bracket: getTaxBracket(taxableWithFranking),
  };
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
