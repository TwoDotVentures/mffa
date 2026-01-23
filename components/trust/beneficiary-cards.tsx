/**
 * @fileoverview Beneficiary Cards Component
 * @description Displays trust beneficiaries with their distribution totals
 * and franking credits streamed for the financial year.
 *
 * @features
 * - Beneficiary profile cards with avatar
 * - Distribution YTD totals per beneficiary
 * - Franking credits streamed tracking
 * - Responsive grid layout
 *
 * @mobile Single column on mobile, 2 columns on tablet+
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import type { TrustBeneficiary, TrustDistribution } from '@/lib/types';

/** Props interface for BeneficiaryCards component */
interface BeneficiaryCardsProps {
  /** Array of trust beneficiaries */
  beneficiaries: TrustBeneficiary[];
  /** Array of distributions for the financial year */
  distributions: TrustDistribution[];
}

/**
 * Formats a number as Australian currency without decimal places
 *
 * @param amount - Number to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * Beneficiary Cards Component
 *
 * Renders beneficiary profile cards showing distribution totals
 * and franking credits streamed for the current financial year.
 *
 * @param props - Component props
 * @returns Rendered beneficiary cards grid or null if no beneficiaries
 */
export function BeneficiaryCards({ beneficiaries, distributions }: BeneficiaryCardsProps) {
  // Calculate totals per beneficiary
  const beneficiaryTotals = beneficiaries.map((beneficiary) => {
    const beneficiaryDistributions = distributions.filter(
      (d) => d.beneficiary_id === beneficiary.id
    );
    const totalAmount = beneficiaryDistributions.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalFranking = beneficiaryDistributions.reduce(
      (sum, d) => sum + Number(d.franking_credits_streamed),
      0
    );

    return {
      ...beneficiary,
      totalAmount,
      totalFranking,
    };
  });

  if (beneficiaries.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {beneficiaryTotals.map((beneficiary) => (
        <Card key={beneficiary.id} className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />

          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2 sm:gap-4 sm:pb-3">
            {/* Avatar */}
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12">
              <User className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-sm sm:text-base">{beneficiary.name}</CardTitle>
              <p className="text-muted-foreground text-xs capitalize sm:text-sm">
                {beneficiary.beneficiary_type} Beneficiary
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Distributions YTD */}
              <div>
                <p className="text-muted-foreground text-[10px] sm:text-xs">Distributions YTD</p>
                <p className="text-lg font-semibold tabular-nums sm:text-xl">
                  {formatCurrency(beneficiary.totalAmount)}
                </p>
              </div>
              {/* Franking Streamed */}
              <div>
                <p className="text-muted-foreground text-[10px] sm:text-xs">Franking Streamed</p>
                <p className="text-lg font-semibold tabular-nums sm:text-xl">
                  {formatCurrency(beneficiary.totalFranking)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
