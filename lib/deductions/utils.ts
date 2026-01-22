/**
 * Deductions Utility Functions
 * Non-async helper functions for deduction calculations
 */

import type { WFHCalculation } from '@/lib/types';

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
 * Work from home deduction rate (2024-25)
 * Fixed rate method: 67 cents per hour
 * https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-expenses
 */
export const WFH_RATE_PER_HOUR = 0.67; // 67 cents

/**
 * Calculate work from home deduction using fixed rate method
 */
export function calculateWFHDeduction(
  totalHours: number,
  periodStart: string,
  periodEnd: string
): WFHCalculation {
  const deduction = totalHours * WFH_RATE_PER_HOUR;

  return {
    hours: totalHours,
    rate_per_hour: WFH_RATE_PER_HOUR,
    total_deduction: Math.round(deduction * 100) / 100,
    period_start: periodStart,
    period_end: periodEnd,
  };
}

/**
 * Calculate WFH hours from weekly average
 * Useful for estimating annual hours from a typical work pattern
 */
export function calculateWFHHoursFromWeekly(
  hoursPerWeek: number,
  weeksWorked: number = 48 // Default: 48 weeks (excluding 4 weeks leave)
): number {
  return hoursPerWeek * weeksWorked;
}

/**
 * Estimate WFH deduction from weekly pattern
 */
export function estimateAnnualWFHDeduction(
  hoursPerWeek: number,
  weeksWorked: number = 48
): number {
  const totalHours = calculateWFHHoursFromWeekly(hoursPerWeek, weeksWorked);
  return totalHours * WFH_RATE_PER_HOUR;
}

/**
 * Vehicle deduction methods
 */
export const VEHICLE_CENTS_PER_KM_RATE = 0.85; // 85 cents per km (2024-25)
export const VEHICLE_CENTS_PER_KM_LIMIT = 5000; // Maximum 5,000 km claim

/**
 * Calculate vehicle deduction using cents per km method
 */
export function calculateVehicleDeduction(kilometers: number): number {
  const claimableKm = Math.min(kilometers, VEHICLE_CENTS_PER_KM_LIMIT);
  return claimableKm * VEHICLE_CENTS_PER_KM_RATE;
}

/**
 * Common deduction limits and thresholds
 */
export const DEDUCTION_LIMITS = {
  laundry: 150, // No receipts required up to $150
  tools_equipment: 300, // Immediate deduction up to $300
  phone_internet: 50, // Percentage for work use typically 50%
  donations: 2, // Minimum $2 for DGR donations
};

/**
 * Categories that typically require substantiation (receipts)
 */
export const REQUIRES_RECEIPT_ABOVE = {
  clothing_laundry: 150,
  tools_equipment: 300,
  phone_internet: 0, // Always need records
  self_education: 0, // Always need records
  travel: 0, // Always need records
  vehicle: 0, // Need logbook or records
};

/**
 * Check if a deduction needs flagging for review
 * Returns true if the deduction might be questioned or needs documentation
 */
export function shouldFlagDeduction(
  category: string,
  amount: number,
  hasReceipt: boolean
): { flag: boolean; reason?: string } {
  // Check category-specific thresholds
  const threshold = REQUIRES_RECEIPT_ABOVE[category as keyof typeof REQUIRES_RECEIPT_ABOVE];

  if (threshold !== undefined && amount > threshold && !hasReceipt) {
    return {
      flag: true,
      reason: `Receipt required for ${category} claims over $${threshold}`,
    };
  }

  // Large deductions that might attract scrutiny
  if (amount > 1000 && !hasReceipt) {
    return {
      flag: true,
      reason: 'Large deduction without receipt - keep documentation',
    };
  }

  // Work from home claims need timesheet or diary
  if (category === 'work_from_home' && !hasReceipt) {
    return {
      flag: true,
      reason: 'WFH claims require timesheet/diary records',
    };
  }

  return { flag: false };
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
