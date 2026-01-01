'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';
import { DistributionDialog } from './distribution-dialog';
import type { TrustBeneficiary } from '@/lib/types';

interface AddDistributionButtonProps {
  trustId: string;
  beneficiaries: TrustBeneficiary[];
  maxAmount: number;
  frankingAvailable: number;
}

export function AddDistributionButton({
  trustId,
  beneficiaries,
  maxAmount,
  frankingAvailable,
}: AddDistributionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        disabled={maxAmount <= 0}
      >
        <ArrowRightLeft className="mr-2 h-4 w-4" />
        Record Distribution
      </Button>
      <DistributionDialog
        trustId={trustId}
        beneficiaries={beneficiaries}
        maxAmount={maxAmount}
        frankingAvailable={frankingAvailable}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
