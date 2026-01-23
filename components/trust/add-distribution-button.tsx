/**
 * @fileoverview Add Distribution Button Component
 * @description Action button that opens the distribution dialog for recording
 * trust distributions to beneficiaries.
 *
 * @features
 * - Touch-friendly button with 44px minimum height
 * - Opens DistributionDialog on click
 * - Disabled when no distributable amount available
 * - Mobile-optimized with flexible width
 *
 * @mobile Full touch target with responsive sizing
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';
import { DistributionDialog } from './distribution-dialog';
import type { TrustBeneficiary } from '@/lib/types';

/** Props interface for AddDistributionButton component */
interface AddDistributionButtonProps {
  /** Trust ID for the distribution */
  trustId: string;
  /** Array of available beneficiaries */
  beneficiaries: TrustBeneficiary[];
  /** Maximum amount available for distribution */
  maxAmount: number;
  /** Available franking credits to stream */
  frankingAvailable: number;
}

/**
 * Add Distribution Button Component
 *
 * Renders a button that opens the distribution dialog for
 * recording distributions to beneficiaries.
 *
 * @param props - Component props
 * @returns Rendered add distribution button with dialog
 */
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
        className="h-9 text-xs whitespace-nowrap sm:h-8 sm:text-sm"
      >
        <ArrowRightLeft className="mr-1.5 h-4 w-4" />
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
