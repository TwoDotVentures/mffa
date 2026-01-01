'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import type { TrustBeneficiary, TrustDistribution } from '@/lib/types';

interface BeneficiaryCardsProps {
  beneficiaries: TrustBeneficiary[];
  distributions: TrustDistribution[];
}

export function BeneficiaryCards({
  beneficiaries,
  distributions,
}: BeneficiaryCardsProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Calculate totals per beneficiary
  const beneficiaryTotals = beneficiaries.map((beneficiary) => {
    const beneficiaryDistributions = distributions.filter(
      (d) => d.beneficiary_id === beneficiary.id
    );
    const totalAmount = beneficiaryDistributions.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    );
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
    <div className="grid gap-4 md:grid-cols-2">
      {beneficiaryTotals.map((beneficiary) => (
        <Card key={beneficiary.id}>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{beneficiary.name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {beneficiary.beneficiary_type} Beneficiary
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Distributions YTD</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(beneficiary.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Franking Streamed</p>
                <p className="text-xl font-semibold">
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
